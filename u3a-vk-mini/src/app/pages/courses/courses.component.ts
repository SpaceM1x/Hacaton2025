import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CoursesService, CourseDto } from '../../services/courses.service';
import { VKBridgeService } from '../../services/vk-bridge.service';
import { FavoritesService } from '../../services/favorites.service';
import { BottomNavComponent } from '../../components/bottom-nav/bottom-nav.component';
import { ResultsService } from '../../services/results.service';
import { RecommendationService } from '../../services/recommendation.service';
import { ProgressService } from '../../services/progress.service';

@Component({
  selector: 'app-courses',
  standalone: true,
  template: `
    <div class="page">
      <header class="header">
        <button class="back" (click)="goHome()">
          <svg class="back-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <h1>Курсы</h1>
        <span class="spacer"></span>
      </header>

      @if (tab !== 'for-you') {
        <div class="search-bar">
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input class="search-input" type="search" placeholder="название курса, тема..." [value]="query" (input)="onSearch($event)" />
        </div>
      }

      <div class="tabs">
        <button class="tab" [class.active]="tab==='for-you'" (click)="switchTab('for-you')">Для Вас</button>
        <button class="tab" [class.active]="tab==='fav'" (click)="switchTab('fav')">Избранные</button>
        <button class="tab" [class.active]="tab==='all'" (click)="switchTab('all')">Все курсы</button>
      </div>

      @if (tab==='for-you') {
        @if (isLoadingRecommendations) {
          <div class="loading-reco">
            <p>Подбираем персональные рекомендации...</p>
            <div class="spinner"></div>
          </div>
        } @else if (recommendedCourses.length > 0) {
          <div class="reco-header">
            <h3>Рекомендуем специально для Вас</h3>
            <button class="refresh-btn" (click)="requestRecs()" title="Обновить рекомендации">
              <svg class="refresh-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 4 23 10 17 10"/>
                <polyline points="1 20 1 14 7 14"/>
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4a9 9 0 0 1-14.85 4.36L23 14"/>
              </svg>
            </button>
          </div>
          <div class="list">
            @for (course of recommendedCourses; track course.id) {
              <article class="item recommended">
                <div class="cover"></div>
                <div class="info">
                  <div class="title">{{ course.title }}</div>
                  <div class="meta">{{ course.category }} • Рекомендовано для Вас</div>
                </div>
                <button class="start btn-blue" (click)="startCourse($event, course)">{{ isStarted(course) ? 'В процессе изучения' : 'Начать изучение' }}</button>
                @if (isStarted(course)) {
                  <button class="cancel" (click)="cancelCourse($event, course)">Отменить</button>
                }
                <button class="fav" [class.favorited]="isFav(course)" (click)="toggleFav($event, course)">
                  <svg class="fav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </button>
              </article>
            }
          </div>
        } @else if (hasTriedRecommendations) {
          <div class="all-completed">
            <h3>Поздравляем!</h3>
            <p>Вы уже прошли все доступные курсы или система не смогла подобрать новые рекомендации.</p>
            <p>Посмотрите вкладку "Все курсы" или дождитесь добавления новых материалов.</p>
            <button class="reco-btn" (click)="requestRecs()">Попробовать еще раз</button>
          </div>
        } @else {
          <div class="empty-reco">
            <p>Персональные рекомендации пока пусты.</p>
            <button class="reco-btn" (click)="requestRecs()">Запросить рекомендации</button>
          </div>
        }
      } @else {
        <div class="list">
          @for (course of filtered(); track course.id) {
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
              <button class="fav" [class.favorited]="isFav(course)" (click)="toggleFav($event, course)">
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
    .search-bar { display:flex; align-items:center; gap:8px; border:1px solid var(--vk-border-color,#e1e3e6); background:#fff; border-radius:25px; padding:12px 16px; margin-top:10px; }
    .search-icon { width: 16px; height: 16px; color: #6b7280; }
    .search-input { border:none; outline:none; background:transparent; width:100%; }
    .tabs { display:flex; gap:8px; margin-top: 10px; }
    .tab { padding: 8px 14px; border:1px solid var(--vk-border-color,#e1e3e6); border-radius: 20px; background:#fff; cursor:pointer; }
    .tab.active { background:#2a6df5; color:#fff; border-color:#2a6df5; }
    .empty-reco { margin-top: 16px; background:#fff; border:1px solid var(--vk-border-color,#e1e3e6); border-radius: 14px; padding: 16px; text-align: center; }
    .reco-btn { margin-top: 8px; background:#2a6df5; color:#fff; border:none; border-radius: 12px; padding: 10px 16px; cursor: pointer; }
    .list { margin-top: 12px; display: grid; gap: 10px; }
    .item { display:grid; grid-template-columns: 64px 1fr auto auto; align-items:center; gap: 12px; padding: 10px; border:1px solid var(--vk-border-color,#e1e3e6); border-radius: 14px; background:#fff; cursor: pointer; }
    .cover { width:64px; height:48px; border-radius: 10px; background: linear-gradient(135deg,#bfd7ff,#f0f5ff); }
    .title { font-weight: 700; }
    .meta { opacity: .7; font-size: 12px; }
    .start { background:#2a6df5; color:#fff; border:none; border-radius: 10px; padding: 8px 12px; }
    .cancel { background:#fff; color:#d92d2d; border:1px solid #e1e3e6; border-radius:10px; padding:8px 12px; }
    .fav { width:40px; height:40px; border-radius: 10px; border:1px solid var(--vk-border-color,#e1e3e6); background:#fff; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease; }
    .fav-icon { width: 18px; height: 18px; color: #000000; stroke: #000000; fill: none; transition: all 0.2s ease; }
    .fav.favorited .fav-icon { color: #EB5050; stroke: #EB5050; fill: #EB5050; }
    .fav:hover .fav-icon { transform: scale(1.1); }
    
    .loading-reco { margin-top: 16px; background:#fff; border:1px solid var(--vk-border-color,#e1e3e6); border-radius: 14px; padding: 40px 20px; text-align:center; }
    .loading-reco p { margin-bottom:20px; color:#2a6df5; font-weight:500; }
    .spinner { width:40px; height:40px; border:4px solid #e1e3e6; border-top:4px solid #2a6df5; border-radius:50%; animation:spin 1s linear infinite; margin:0 auto; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    
    .reco-header { display:flex; justify-content:space-between; align-items:center; padding:16px 0 8px; }
    .reco-header h3 { margin:0; color:#2c2d2e; font-size:18px; font-weight:600; }
    .refresh-btn { background:transparent; border:1px solid #e1e3e6; border-radius:8px; width:36px; height:36px; cursor:pointer; display: flex; align-items: center; justify-content: center; }
    .refresh-btn:hover { background:#f7f8fa; }
    .refresh-icon { width: 16px; height: 16px; color: #6b7280; }
    
    .item.recommended { border-left:4px solid #2a6df5; background:linear-gradient(90deg, rgba(42,109,245,0.05) 0%, transparent 20%); }
    .item.recommended .meta { color:#2a6df5; font-weight:500; }
    
    .all-completed { margin-top: 16px; background:#fff; border:1px solid var(--vk-border-color,#e1e3e6); border-radius: 14px; padding: 24px; text-align: center; }
    .all-completed h3 { margin:0 0 16px; color:#2c2d2e; font-size:20px; }
    .all-completed p { margin:8px 0; color:#818c99; line-height:1.4; }
    .all-completed .reco-btn { margin-top:16px; }
    
    @media (prefers-color-scheme: dark) {
      .fav-icon { color: #ffffff; stroke: #ffffff; }
      .fav.favorited .fav-icon { color: #EB5050; stroke: #EB5050; fill: #EB5050; }
      .back { background: #222; border-color: #333; }
      .back-icon { color: #ffffff; }
    }
  `],
  imports: [BottomNavComponent]
})
export class CoursesComponent {
  private router = inject(Router);
  private coursesSvc = inject(CoursesService);
  private vk = inject(VKBridgeService);
  private favSvc = inject(FavoritesService);
  private resultsSvc = inject(ResultsService);
  private recoSvc = inject(RecommendationService);
  private progressSvc = inject(ProgressService);

  courses = this.coursesSvc.courses;
  tab: 'for-you' | 'fav' | 'all' = 'for-you';
  query = '';
  recommendedCourses: CourseDto[] = [];
  isLoadingRecommendations = false;
  hasTriedRecommendations = false;

  constructor() {
    this.loadRecommendationsOnInit();
  }

  private async loadRecommendationsOnInit() {
    setTimeout(() => {
      if (this.courses().length > 0) {
        this.requestRecs();
      }
    }, 1000);
  }

  openCourse(course: CourseDto) {
    this.router.navigate(['/courses', course.id]);
  }

  goHome() { this.router.navigateByUrl('/home'); }

  filtered() {
    let list = this.courses();
    const q = this.query.trim().toLowerCase();
    if (q) {
      list = list.filter(c => c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q));
    }
    const user = this.vk.user();
    if (this.tab === 'all' || !user) return list;
    if (this.tab === 'fav') {
      const fav = this.favSvc.getSet(user.id);
      return list.filter(c => fav.has(c.id));
    }
    return list;
  }

  isFav(course: CourseDto) {
    const u = this.vk.user();
    return u ? this.favSvc.isFavorite(u.id, course.id) : false;
  }

  async toggleFav(event: MouseEvent, course: CourseDto) {
    event.stopPropagation();
    const u = this.vk.user();
    if (!u) return;
    await this.favSvc.toggle(u.id, course.id);
  }

  onSearch(e: Event) {
    const input = e.target as HTMLInputElement;
    this.query = input.value;
  }

  switchTab(newTab: 'for-you' | 'fav' | 'all') {
    this.tab = newTab;
    
    if (newTab === 'for-you') {
      this.query = '';
    }
  }

  async requestRecs() {
    try {
      this.isLoadingRecommendations = true;
      console.log('Получение рекомендаций...');
      
      const candidates = this.courses().map(course => ({
        id: course.id,
        title: course.title,
        category: course.category,
        description: course.description || ''
      }));
      const recommendedIds = await this.recoSvc.getRecommendations(candidates);
      
      console.log('Получены рекомендации:', recommendedIds);
      if (recommendedIds.length > 0) {
        const allCourses = this.courses();
        console.log('🔍 Отладка сопоставления рекомендаций:');
        console.log('Рекомендованные ID:', recommendedIds);
        console.log('Доступные курсы:', allCourses.map(c => ({ id: c.id, title: c.title })));
        
        this.recommendedCourses = recommendedIds
          .map(id => {
            const idStr = String(id);
            const found = allCourses.find(course => course.id === idStr);
            console.log(`Ищем курс с ID "${idStr}" (исходный: "${id}", тип: ${typeof id}):`, found ? `найден - ${found.title}` : 'НЕ НАЙДЕН');
            return found;
          })
          .filter(course => course !== undefined) as CourseDto[];
        
        console.log('✅ Итоговые рекомендованные курсы:', this.recommendedCourses);
      } else {
        console.log('⚠️ Рекомендации пусты');
        this.recommendedCourses = [];
      }
      
    } catch (error) {
      console.error('Ошибка получения рекомендаций:', error);
      this.recommendedCourses = [];
    } finally {
      this.isLoadingRecommendations = false;
      this.hasTriedRecommendations = true;
    }
  }

  async startCourse(event: MouseEvent, course: CourseDto) {
    event.stopPropagation();
    const u = this.vk.user();
    if (!u) return;
    
    try {
      console.log('🔄 Начинаем курс:', course.title);
      const courseIdNum = parseInt(course.id);
      const progress = await this.progressSvc.startCourse(courseIdNum);
      
      if (progress) {
        console.log('✅ Курс успешно начат на бэкенде');
        const current = this.resultsSvc.get(u.id, course.id)?.progress ?? 0;
        const next = current > 0 ? current : 5;
        this.resultsSvc.save(u.id, course.id, { progress: next, passedAt: Date.now() });
      } else {
        console.warn('⚠️ Не удалось начать курс на бэкенде, используем локальное сохранение');
        const current = this.resultsSvc.get(u.id, course.id)?.progress ?? 0;
        const next = current > 0 ? current : 5;
        this.resultsSvc.save(u.id, course.id, { progress: next, passedAt: Date.now() });
      }
      this.openCourse(course);
    } catch (error) {
      console.error('❌ Ошибка при начале курса:', error);
      const current = this.resultsSvc.get(u.id, course.id)?.progress ?? 0;
      const next = current > 0 ? current : 5;
      this.resultsSvc.save(u.id, course.id, { progress: next, passedAt: Date.now() });
      this.openCourse(course);
    }
  }

  isStarted(course: CourseDto) {
    const u = this.vk.user();
    if (!u) return false;
    const p = this.resultsSvc.get(u.id, course.id)?.progress ?? 0;
    return p > 0;
  }

  cancelCourse(event: MouseEvent, course: CourseDto) {
    event.stopPropagation();
    const u = this.vk.user();
    if (!u) return;
    this.resultsSvc.remove(u.id, course.id);
  }
}
