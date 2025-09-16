import { Component, OnInit, inject, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { VKBridgeService } from './services/vk-bridge.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  private vkBridge = inject(VKBridgeService);
  private auth = inject(AuthService);
  title = 'Университет третьего возраста';

  constructor() {
    console.log('🚀 VK Mini App запущено');
    
    let logged = false;
    const ref = effect(() => {
      const current = this.vkBridge.user();
      if (!logged && current?.id) {
        logged = true;
        console.log('🔍 App: обнаружен VK user ID, начинаю авторизацию на бэкенде:', {
          id: current.id,
          name: `${current.first_name} ${current.last_name}`.trim()
        });
        
        this.auth.loginWithVkUserId(current.id)
          .then(jwt => {
            console.log('🎉 App: успешная авторизация на бэкенде для пользователя:', {
              login: jwt.login,
              name: jwt.name,
              id: jwt.id
            });
          })
          .catch(err => {
            console.error('❌ App: ошибка авторизации на бэкенде:', {
              userId: current.id,
              error: err?.message || err,
              status: err?.status,
              statusText: err?.statusText
            });
          })
          .finally(() => ref.destroy());
      }
    });
  }

  ngOnInit() {
  }
}
