import { Injectable, signal } from '@angular/core';
import bridge from '@vkontakte/vk-bridge';

export interface VKUser {
  id: number;
  first_name: string;
  last_name: string;
  photo_200?: string;
}

@Injectable({
  providedIn: 'root'
})
export class VKBridgeService {
  private _user = signal<VKUser | null>(null);
  private _isInitialized = signal(false);
  private static readonly STORAGE_USER_ID = 'vk_user_id';
  private static readonly STORAGE_USER_NAME = 'vk_user_name';

  public readonly user = this._user.asReadonly();
  public readonly isInitialized = this._isInitialized.asReadonly();

  constructor() {
    this.init();
  }

  private withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
    let timeoutHandle: any;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(() => reject(new Error(`${label} timeout ${timeoutMs}ms`)), timeoutMs);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutHandle)) as Promise<T>;
  }

  private async init() {
    try {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.updateTheme({ scheme: prefersDark ? 'space_gray' : 'bright_light' });

      if ((bridge as any).supportsAsync?.('VKWebAppInit') || (bridge as any).supports?.('VKWebAppInit')) {
        await this.withTimeout((bridge as any).send('VKWebAppInit'), 2000, 'VKWebAppInit');
      }
      
      let resolvedUser: VKUser | null = null;
      if ((bridge as any).supportsAsync?.('VKWebAppGetUserInfo') || (bridge as any).supports?.('VKWebAppGetUserInfo')) {
        try {
          const userInfo = await this.withTimeout((bridge as any).send('VKWebAppGetUserInfo'), 2500, 'VKWebAppGetUserInfo');
          resolvedUser = userInfo as VKUser;
        } catch (err) {
          console.warn('VKWebAppGetUserInfo недоступен/таймаут, используем фолбэк');
        }
      }

      if (!resolvedUser) {
        try {
          const params = await this.getLaunchParams();
          const fromParams = Number(params?.vk_user_id || params?.user_id);
          const fromUrl = Number(this.getUserIdFromUrl());
          const stored = Number(this.safeGetFromStorage(VKBridgeService.STORAGE_USER_ID));

          const candidateId = Number.isFinite(fromParams) && fromParams > 0
            ? fromParams
            : Number.isFinite(fromUrl) && fromUrl > 0
              ? fromUrl
              : Number.isFinite(stored) && stored > 0
                ? stored
                : NaN;

          if (Number.isFinite(candidateId)) {
            resolvedUser = {
              id: candidateId as number,
              first_name: this.safeGetFromStorage(VKBridgeService.STORAGE_USER_NAME) || 'Пользователь',
              last_name: 'VK',
              photo_200: ''
            } as VKUser;
          }
        } catch (e) {
        }
      }

      if (resolvedUser) {
        this._user.set(resolvedUser);
        console.log('👤 VKBridge: пользователь VK определен:', {
          id: resolvedUser.id,
          name: `${resolvedUser.first_name} ${resolvedUser.last_name}`.trim(),
          photo: resolvedUser.photo_200 ? 'есть' : 'нет'
        });
        
        try {
          localStorage.setItem(VKBridgeService.STORAGE_USER_ID, String(resolvedUser.id));
          const name = `${resolvedUser.first_name || ''} ${resolvedUser.last_name || ''}`.trim();
          if (name) localStorage.setItem(VKBridgeService.STORAGE_USER_NAME, name);
          console.log('💾 VKBridge: данные пользователя сохранены в localStorage');
        } catch (e) {
          console.warn('⚠️ VKBridge: не удалось сохранить данные пользователя в localStorage:', e);
        }
      } else {
        this._user.set({
          id: 1,
          first_name: 'Гость',
          last_name: 'VK',
          photo_200: ''
        });
        console.warn('⚠️ VKBridge: используется dev fallback пользователь ID 1');
      }
      
      (bridge as any).subscribe?.((e: any) => {
        if (e?.detail?.type === 'VKWebAppUpdateConfig') {
          this.updateTheme(e.detail.data);
        }
      });

      console.log('VK Bridge инициализация завершена');
    } catch (error) {
      console.error('Ошибка инициализации VK Bridge:', error);
      this._user.set({
        id: 1,
        first_name: 'Гость',
        last_name: 'VK',
        photo_200: ''
      });
    } finally {
      this._isInitialized.set(true);
    }
  }

  private getUserIdFromUrl(): number | null {
    try {
      const params = new URLSearchParams(window.location.search);
      let id = params.get('vk_user_id') || params.get('user_id');

      if (!id && typeof window.location.hash === 'string' && window.location.hash.includes('=')) {
        const hash = window.location.hash.startsWith('#') ? window.location.hash.substring(1) : window.location.hash;
        const hashParams = new URLSearchParams(hash);
        id = hashParams.get('vk_user_id') || hashParams.get('user_id');
      }
      return id ? Number(id) : null;
    } catch {
      return null;
    }
  }

  private safeGetFromStorage(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private updateTheme(config: any) {
    const scheme: string | undefined = config?.scheme || config?.theme;
    const theme = scheme === 'space_gray' || scheme === 'vkcom_dark' || scheme === 'dark' ? 'dark' : 'light';
    document.body.setAttribute('data-theme', theme);

    if (theme === 'dark') {
      document.documentElement.style.setProperty('--vk-bg-color', '#19191a');
      document.documentElement.style.setProperty('--vk-text-color', '#ffffff');
      document.documentElement.style.setProperty('--vk-accent-color', '#0077ff');
    } else {
      document.documentElement.style.setProperty('--vk-bg-color', '#ffffff');
      document.documentElement.style.setProperty('--vk-text-color', '#000000');
      document.documentElement.style.setProperty('--vk-accent-color', '#0077ff');
    }
  }

  async showAlert(message: string) {
    try {
      await (bridge as any).send('VKWebAppShowSnackbar', { text: message });
    } catch (error) {
      console.error('Ошибка показа уведомления:', error);
      alert(message);
    }
  }

  async shareResult(text: string) {
    try {
      await (bridge as any).send('VKWebAppShare', {
        link: window.location.href
      } as any);
    } catch (error) {
      console.error('Ошибка шеринга:', error);
      if (navigator.share) {
        navigator.share({
          title: 'Результат прохождения курса',
          text: text,
          url: window.location.href
        });
      }
    }
  }

  async getLaunchParams() {
    try {
      const params = await (bridge as any).send('VKWebAppGetLaunchParams');
      return params;
    } catch (error) {
      console.error('Ошибка получения параметров запуска:', error);
      return {};
    }
  }

  /**
   * Универсальный метод для вызова VK Bridge API
   */
  async bridge(method: string, params: any = {}): Promise<any> {
    try {
      if ((bridge as any).supportsAsync?.(method) || (bridge as any).supports?.(method)) {
        return await this.withTimeout(
          (bridge as any).send(method, params), 
          3000, 
          method
        );
      } else {
        throw new Error(`Метод ${method} не поддерживается`);
      }
    } catch (error) {
      console.warn(`Ошибка вызова VK Bridge метода ${method}:`, error);
      throw error;
    }
  }
}
