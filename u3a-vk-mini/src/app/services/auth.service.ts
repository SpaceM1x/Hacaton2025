import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface JwtResponse {
  token: string;
  refreshToken: string;
  type: string;
  id: number;
  login: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  private _accessToken = signal<string | null>(null);
  private _refreshToken = signal<string | null>(null);
  private _userName = signal<string | null>(null);
  private _isAuthReady = signal<boolean>(false);

  accessToken = this._accessToken.asReadonly();
  refreshToken = this._refreshToken.asReadonly();
  userName = this._userName.asReadonly();
  isAuthReady = this._isAuthReady.asReadonly();

  isAuthenticated(): boolean {
    return !!this._accessToken();
  }

  constructor() {
    this.loadTokensFromStorage();
  }

  private loadTokensFromStorage(): void {
    try {
      const token = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      const userName = localStorage.getItem('userName');
      
      console.log('🔍 AuthService: проверяем localStorage', {
        hasToken: !!token,
        hasRefreshToken: !!refreshToken,
        userName: userName
      });
      
      if (token && refreshToken) {
        this._accessToken.set(token);
        this._refreshToken.set(refreshToken);
        this._userName.set(userName);
        this._isAuthReady.set(true);
        console.log('✅ AuthService: токены загружены из localStorage', {
          tokenPreview: token.slice(0, 20) + '...',
          userName: userName
        });
      } else {
        console.log('⚠️ AuthService: токены не найдены в localStorage');
        this._isAuthReady.set(true);
      }
    } catch (e) {
      console.warn('⚠️ AuthService: не удалось загрузить токены из localStorage или нет токенов:', e);
    }
  }

  async loginWithVkUserId(userId: number): Promise<JwtResponse> {
    console.log('🔐 AuthService: отправка VK userId на бэкенд:', userId);
    
    try {
      const resp = await firstValueFrom(
        this.http.post<JwtResponse>('http://localhost:8085/api/auth/login/vk-service-user', { userId })
      );
      
      console.log('✅ AuthService: получен JWT ответ от бэкенда:', {
        id: resp.id,
        login: resp.login,
        name: resp.name,
        tokenPreview: resp.token?.slice(0, 20) + '...',
        refreshTokenPreview: resp.refreshToken?.slice(0, 20) + '...'
      });
      
      this._accessToken.set(resp.token);
      this._refreshToken.set(resp.refreshToken);
      this._userName.set(resp.name || resp.login);
      this._isAuthReady.set(true);
      
      try {
        localStorage.setItem('accessToken', resp.token);
        localStorage.setItem('refreshToken', resp.refreshToken);
        localStorage.setItem('userName', resp.name || resp.login);
        console.log('💾 AuthService: токены сохранены в localStorage');
      } catch (e) {
        console.warn('⚠️ AuthService: не удалось сохранить токены в localStorage:', e);
      }
      
      console.log('🎉 AuthService: авторизация VK успешна для пользователя', resp.login);
      return resp;
      
    } catch (error: any) {
      console.error('❌ AuthService: ошибка авторизации VK:', {
        userId,
        error: error.message || error,
        status: error.status,
        statusText: error.statusText
      });
      this._isAuthReady.set(true);
      throw error;
    }
  }
}


