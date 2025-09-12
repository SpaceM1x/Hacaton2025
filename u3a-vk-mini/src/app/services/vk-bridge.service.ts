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
      // Начальная тема до прихода события из VK
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.updateTheme({ scheme: prefersDark ? 'space_gray' : 'bright_light' });

      // Инициализируем VK Bridge, если поддерживается
      if ((bridge as any).supports?.('VKWebAppInit')) {
        await this.withTimeout((bridge as any).send('VKWebAppInit'), 2000, 'VKWebAppInit');
      }
      
      // Получаем информацию о пользователе, если доступно в окружении Mini Apps
      let resolvedUser: VKUser | null = null;
      if ((bridge as any).supports?.('VKWebAppGetUserInfo')) {
        try {
          const userInfo = await this.withTimeout((bridge as any).send('VKWebAppGetUserInfo'), 2500, 'VKWebAppGetUserInfo');
          resolvedUser = userInfo as VKUser;
        } catch (err) {
          console.warn('VKWebAppGetUserInfo недоступен/таймаут, используем фолбэк');
        }
      }

      if (resolvedUser) {
        this._user.set(resolvedUser);
      } else {
        // Фолбэк для разработки в браузере вне VK контейнера
        this._user.set({
          id: 1,
          first_name: 'Гость',
          last_name: 'VK',
          photo_200: ''
        });
      }
      
      // Подписываемся на события изменения темы
      (bridge as any).subscribe?.((e: any) => {
        if (e?.detail?.type === 'VKWebAppUpdateConfig') {
          this.updateTheme(e.detail.data);
        }
      });

      console.log('VK Bridge инициализация завершена');
    } catch (error) {
      console.error('Ошибка инициализации VK Bridge:', error);
      // Гарантируем наличие пользователя в dev
      this._user.set({
        id: 1,
        first_name: 'Гость',
        last_name: 'VK',
        photo_200: ''
      });
    } finally {
      // В любом случае снимаем лоадер
      this._isInitialized.set(true);
    }
  }

  private updateTheme(config: any) {
    // VK передает scheme: bright_light | space_gray | ...
    const scheme: string | undefined = config?.scheme || config?.theme;
    const theme = scheme === 'space_gray' || scheme === 'vkcom_dark' || scheme === 'dark' ? 'dark' : 'light';
    document.body.setAttribute('data-theme', theme);

    // Цветовая схема
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
      // Используем правильный метод для показа алерта
      await (bridge as any).send('VKWebAppShowSnackbar', { text: message });
    } catch (error) {
      console.error('Ошибка показа уведомления:', error);
      alert(message); // Fallback для разработки
    }
  }

  async shareResult(text: string) {
    try {
      await (bridge as any).send('VKWebAppShare', {
        link: window.location.href
      } as any);
    } catch (error) {
      console.error('Ошибка шеринга:', error);
      // Fallback для разработки
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
}
