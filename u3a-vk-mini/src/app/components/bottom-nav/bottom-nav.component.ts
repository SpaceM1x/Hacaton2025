import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  template: `
    <nav class="bottom-nav">
      <button class="nav-item" [class.active]="active==='home'" (click)="go('/home')" title="Главная">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9,22 9,12 15,12 15,22"/>
        </svg>
      </button>
      <button class="nav-item" [class.active]="active==='courses'" (click)="go('/courses')" title="Курсы">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
        </svg>
      </button>
      <button class="nav-item" [class.active]="active==='chat'" (click)="go('/chat')" title="Общение с нейросетью">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          <path d="M8 9h8"/>
          <path d="M8 13h6"/>
        </svg>
      </button>
      <button class="nav-item" [class.active]="active==='profile'" (click)="go('/profile')" title="Профиль">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </button>
    </nav>
  `,
  styles: [`
    .bottom-nav { 
      position: fixed; 
      left: 12px; 
      right: 12px; 
      bottom: 12px; 
      display: grid; 
      grid-template-columns: repeat(4,1fr); 
      gap: 8px; 
      background: #fff; 
      border: 1px solid var(--vk-border-color,#e1e3e6); 
      border-radius: 18px; 
      padding: 10px; 
      box-shadow: 0 20px 40px rgba(0,0,0,.1); 
    }
    .nav-item { 
      background: transparent; 
      border: none; 
      height: 40px; 
      border-radius: 12px; 
      cursor: pointer; 
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }
    .nav-item.active { 
      background: rgba(42,109,245,.12); 
    }
    .nav-icon {
      width: 20px;
      height: 20px;
      color: #6b7280;
      transition: color 0.2s ease;
    }
    .nav-item.active .nav-icon {
      color: #2a6df5;
    }
    .nav-item:hover .nav-icon {
      color: #374151;
    }
  `]
})
export class BottomNavComponent {
  @Input() active: 'home' | 'courses' | 'chat' | 'profile' = 'home';
  constructor(private router: Router) {}
  go(url: string) { this.router.navigateByUrl(url); }
}


