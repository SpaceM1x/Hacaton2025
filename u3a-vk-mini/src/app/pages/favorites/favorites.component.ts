import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FavoritesService } from '../../services/favorites.service';
import { VKBridgeService } from '../../services/vk-bridge.service';
import { ResultsService } from '../../services/results.service';
import { BottomNavComponent } from '../../components/bottom-nav/bottom-nav.component';
import { CourseDto } from '../../services/courses.service';

@Component({
  selector: 'app-favorites',
  standalone: true,
  template: `
    <div class="page">
      <header class="header">
        <button class="back" (click)="goHome()">
          <svg class="back-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <h1>Избранное</h1>
        <span class="spacer"></span>
      </header>

      @if (isLoading) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Загрузка избранных курсов...</p>
        </div>
      } @else if (favorites().length === 0) {
        <div class="empty">
          <h3>Избранное пусто</h3>
          <p>Добавьте курсы в избранное, чтобы они отображались здесь</p>
        </div>
      } @else {
        <div class="list">
          @for (course of favorites(); track course.id) {
            <article class="item">
              <div class="cover"></div>
              <div class="info">
                <div class="title">{{ course.title }}</div>
                <div class="meta">{{ course.category }}</div>
              </div>
              <button class="start btn-blue" (click)="startCourse($event, course)">{{ isStarted(course) ? 'В процессе изучения' : 'Начать изучение' }}</button>
              @if (isStarted(course)) {
                <button class="cancel" (click)="cancelCourse($event, course)">Отменить</button>
              }
              <button class="fav favorited" (click)="toggleFav($event, course)">
                <svg class="fav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </button>
            </article>
          }
        </div>
      }
      <app-bottom-nav active="courses" />
    </div>
  `,
  styles: [`
    .page { min-height: 100vh; padding: 16px; background: var(--vk-bg-color, #fff); color: var(--vk-text-color, #000); }
    .header { display:flex; align-items:center; gap: 8px; }
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
    .spacer { flex: 1; }
    h1 { margin: 0; font-size: 24px; font-weight: 800; }
    .loading { margin-top: 40px; text-align: center; }
    .spinner { width:40px; height:40px; border:4px solid #e1e3e6; border-top:4px solid #2a6df5; border-radius:50%; animation:spin 1s linear infinite; margin:0 auto 20px; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .empty { margin-top: 40px; text-align: center; background:#fff; border:1px solid var(--vk-border-color,#e1e3e6); border-radius: 14px; padding: 40px 20px; }
    .empty h3 { margin:0 0 16px; color:#2c2d2e; font-size:20px; }
    .empty p { margin:0; color:#818c99; line-height:1.4; }
    .list { margin-top: 12px; display: grid; gap: 10px; }
    .item { display:grid; grid-template-columns: 64px 1fr auto auto; align-items:center; gap: 12px; padding: 10px; border:1px solid var(--vk-border-color,#e1e3e6); border-radius: 14px; background:#fff; cursor: pointer; }
    .cover { width:64px; height:48px; border-radius: 10px; background: linear-gradient(135deg,#bfd7ff,#f0f5ff); }
    .title { font-weight: 700; }
    .meta { opacity: .7; font-size: 12px; }
    .start { background:#2a6df5; color:#fff; border:none; border-radius: 10px; padding: 8px 12px; }
    .cancel { background:#fff; color:#d92d2d; border:1px solid #e1e3e6; border-radius:10px; padding:8px 12px; }
    .fav { width:40px; height:40px; border-radius: 10px; border:1px solid var(--vk-border-color,#e1e3e6); background:#fff; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease; }
    .fav-icon { width: 18px; height: 18px; color: #EB5050; stroke: #EB5050; fill: #EB5050; }
    .fav:hover .fav-icon { transform: scale(1.1); }
    
    @media (prefers-color-scheme: dark) {
      .back { background: #222; border-color: #333; }
      .back-icon { color: #ffffff; }
    }
  `],
  imports: [BottomNavComponent]
})
export class FavoritesComponent {
  private router = inject(Router);
  private favSvc = inject(FavoritesService);
  private vk = inject(VKBridgeService);
  private resultsSvc = inject(ResultsService);

  favorites = signal<CourseDto[]>([]);
  isLoading = true;

  constructor() {
    this.loadFavorites();
  }

  async loadFavorites() {
    try {
      this.isLoading = true;
      const favoritesData = await this.favSvc.loadFavorites();
      this.favorites.set(favoritesData);
    } catch (error) {
      console.error('Ошибка загрузки избранных курсов:', error);
    } finally {
      this.isLoading = false;
    }
  }

  goHome() { 
    this.router.navigateByUrl('/home'); 
  }

  openCourse(course: CourseDto) {
    this.router.navigate(['/courses', course.id]);
  }

  isStarted(course: CourseDto) {
    const u = this.vk.user();
    if (!u) return false;
    const p = this.resultsSvc.get(u.id, course.id)?.progress ?? 0;
    return p > 0;
  }

  startCourse(event: MouseEvent, course: CourseDto) {
    event.stopPropagation();
    const u = this.vk.user();
    if (!u) return;
    const current = this.resultsSvc.get(u.id, course.id)?.progress ?? 0;
    const next = current > 0 ? current : 5;
    this.resultsSvc.save(u.id, course.id, { progress: next, passedAt: Date.now() });
    this.openCourse(course);
  }

  cancelCourse(event: MouseEvent, course: CourseDto) {
    event.stopPropagation();
    const u = this.vk.user();
    if (!u) return;
    this.resultsSvc.remove(u.id, course.id);
  }

  async toggleFav(event: MouseEvent, course: CourseDto) {
    event.stopPropagation();
    const u = this.vk.user();
    if (!u) return;
    
    const isFav = await this.favSvc.toggle(u.id, course.id);
    if (!isFav) {
      this.loadFavorites();
    }
  }
}
