import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { VKBridgeService } from '../../services/vk-bridge.service';
import { AuthService } from '../../services/auth.service';
import { CoursesService, CourseDto } from '../../services/courses.service';
import { ResultsService } from '../../services/results.service';
import { BottomNavComponent } from '../../components/bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  template: `
    <div class="profile">
      <header class="header">
        <button class="back" aria-label="Назад" (click)="goHome()">
          <svg class="back-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
      </header>

      <section class="user-block">
        <img class="avatar" [src]="(user()?.photo_200) || placeholder" alt="avatar">
        <div class="fullname">{{ user()?.last_name }} {{ user()?.first_name }}</div>
        <div class="nickname">&#64;{{ getUserName() }}</div>
      </section>

      <nav class="tabs">
        <button class="tab active">Завершенные курсы</button>
      </nav>

      <section class="cards">
        @for (card of finishedCards(); track card.id) {
          <article class="card">
            <div class="cover"></div>
            <div class="title">{{ card.title }}</div>
            <div class="meta">Прогресс: {{ card.progress }}% · Правильных: {{ card.score }}%</div>
          </article>
        }
        @empty { <p>Пока нет завершенных курсов.</p> }
      </section>

      <app-bottom-nav active="profile" />
    </div>
  `,
  styles: [`
    .profile { min-height: 100vh; padding: 16px 16px 84px; background: var(--vk-bg-color,#fff); color: var(--vk-text-color,#000); }
    .header { display:flex; justify-content: space-between; align-items:center; }
    .back { 
      width: 40px; 
      height: 40px; 
      border-radius: 50%; 
      border: 1px solid var(--vk-border-color,#e1e3e6); 
      background:#fff; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .back:hover {
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
      transform: translateY(-1px);
    }
    .back-icon {
      width: 18px;
      height: 18px;
      color: #374151;
    }
    .user-block { display:flex; flex-direction:column; align-items:center; gap:8px; margin:8px 0 12px; }
    .avatar { width: 120px; height:120px; border-radius: 999px; object-fit: cover; box-shadow: 0 12px 30px rgba(0,0,0,.12); }
    .fullname { font-size: 28px; font-weight: 900; text-align: center; }
    .nickname { opacity: .6; margin-top: -4px; }
    .tabs { display:flex; gap: 24px; justify-content: center; margin: 8px 0 12px; }
    .tab { background: transparent; border: none; font-weight: 800; text-decoration: underline; text-underline-offset: 6px; }
    .tab.active { color: #2a6df5; }
    .cards { display:grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .card { background:#fff; border:1px solid var(--vk-border-color,#e1e3e6); border-radius: 16px; padding: 10px; box-shadow: 0 10px 24px rgba(0,0,0,.06); display:flex; flex-direction:column; gap:8px; }
    .cover { height: 120px; border-radius: 12px; background: linear-gradient(135deg,#b7d1ff,#f3f7ff); }
    .cover.alt { background: linear-gradient(135deg,#ffd7b7,#fff3e8); }
    .cover.health { background: linear-gradient(135deg,#d1ffd7,#f0fff3); }
    .title { font-weight: 700; }
    .action { align-self: start; background:#2a6df5; color:#fff; border:none; border-radius: 12px; padding: 10px 16px; }
    
    @media (prefers-color-scheme: dark) {
      .back { background: #222; border-color: #333; }
      .back-icon { color: #ffffff; }
    }
  `],
  imports: [BottomNavComponent]
})
export class ProfileComponent {
  private router = inject(Router);
  private vk = inject(VKBridgeService);
  private auth = inject(AuthService);
  private coursesSvc = inject(CoursesService);
  private resultsSvc = inject(ResultsService);
  placeholder = 'https://via.placeholder.com/120x120.png?text=U3';
  user = this.vk.user;
  courses = this.coursesSvc.courses;

  getUserName(): string {
    const authUserName = this.auth.userName();
    if (authUserName) {
      const vkUser = this.user();
      if (vkUser) {
        return `vk${vkUser.id}`;
      }
      return authUserName.toLowerCase().replace(/\s+/g, '');
    }
    
    const vkUser = this.user();
    if (vkUser) {
      return `vk${vkUser.id}`;
    }
    
    return 'username';
  }

  finishedCards() {
    const u = this.user();
    if (!u) return [] as Array<{id:string,title:string,progress:number,score:number}>;
    const results = this.resultsSvc.getAll(u.id);
    const finishedIds = Object.keys(results).filter(id => (results[id]?.progress ?? 0) >= 100);
    const map = new Map(this.courses().map(c => [c.id, c] as const));
    return finishedIds.map(id => ({
      id,
      title: map.get(id)?.title ?? 'Курс',
      progress: Math.min(100, Math.round(results[id]?.progress ?? 0)),
      score: Math.min(100, Math.round(results[id]?.score ?? 0))
    }));
  }

  goHome() { this.router.navigateByUrl('/home'); }
  goCourses() { this.router.navigateByUrl('/courses'); }

  constructor() {
    this.coursesSvc.load();
  }

}
