import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from '../services/auth.service';

export const authInterceptorFn: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  
  const token = authService.accessToken();
  
  console.log('🔍 AuthInterceptor: обрабатываем запрос', {
    url: req.url,
    hasToken: !!token,
    tokenPreview: token ? token.slice(0, 20) + '...' : 'none'
  });
  
  if (token && !req.url.includes('/auth/')) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('✅ AuthInterceptor: добавлен JWT токен в заголовки');
    return next(authReq);
  }
  
  console.log('⚠️ AuthInterceptor: токен не добавлен', {
    reason: !token ? 'no token' : 'auth request'
  });
  return next(req);
};
