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

  private async init() {
    try {
      // Инициализируем VK Bridge
      await (bridge as any).send('VKWebAppInit');
      
      // Получаем информацию о пользователе
      const userInfo = await (bridge as any).send('VKWebAppGetUserInfo') as any;
      this._user.set(userInfo as VKUser);
      
      // Подписываемся на события изменения темы
      bridge.subscribe((e) => {
        if (e.detail.type === 'VKWebAppUpdateConfig') {
          this.updateTheme(e.detail.data);
        }
      });

      this._isInitialized.set(true);
      console.log('VK Bridge инициализирован успешно', userInfo);
    } catch (error) {
      console.error('Ошибка инициализации VK Bridge:', error);
      // В режиме разработки можем симулировать пользователя
      this._user.set({
        id: 1,
        first_name: 'Тестовый',
        last_name: 'Пользователь',
        photo_200: ''
      });
      this._isInitialized.set(true);
    }
  }

  private updateTheme(config: any) {
    // Применяем тему VK к приложению
    const theme = config.theme || 'light';
    document.body.setAttribute('data-theme', theme);
    
    // Применяем цветовую схему VK
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
