import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { VKBridgeService } from '../services/vk-bridge.service';
import { AuthService } from '../services/auth.service';
import { BottomNavComponent } from '../components/bottom-nav/bottom-nav.component';
import { CoursesService, CourseDto } from '../services/courses.service';
import { ResultsService } from '../services/results.service';
import { FavoritesService } from '../services/favorites.service';
import { ProgressService, UserCourseProgress } from '../services/progress.service';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [BottomNavComponent]
})
export class HomeComponent implements OnInit {
  private vkBridge = inject(VKBridgeService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private coursesSvc = inject(CoursesService);
  private resultsSvc = inject(ResultsService);
  private favSvc = inject(FavoritesService);
  private progressSvc = inject(ProgressService);
  
  public readonly user = this.vkBridge.user;
  public readonly isInitialized = this.vkBridge.isInitialized;

  lecturesProgress = 0;
  correctAnswers = 0;
  statsTitle = 'Курс';
  
  currentCardIndex = 0;
  courseCards = computed(() => {
    const u = this.user();
    if (!u) return [];
    const results = this.resultsSvc.getAll(u.id);
    const started = Object.entries(results)
      .filter(([, r]) => (r as any)?.progress > 0)
      .sort((a, b) => ((b[1] as any)?.passedAt ?? 0) - ((a[1] as any)?.passedAt ?? 0))
      .slice(0, 3);
    
    return started.map(([courseId, result]) => {
      const course = this.courses().find(c => c.id === courseId);
      return {
        course,
        progress: Math.min(100, Math.round((result as any).progress ?? 0)),
        score: Math.min(100, Math.round((result as any).score ?? 0)),
        courseId
      };
    });
  });

  courses = this.coursesSvc.courses;
  backendProgress = signal<UserCourseProgress[]>([]);
  
  inProgressCourses = computed(() => {
    const user = this.user();
    const list = this.courses();
    if (!user || list.length === 0) return [] as CourseDto[];
    
    const backendData = this.backendProgress();
    if (backendData.length > 0) {
      return list.filter(course => {
        const progress = backendData.find(p => String(p.courseId) === course.id);
        return progress && progress.progress > 0 && progress.progress < 100;
      });
    }
    
    const results = this.resultsSvc.getAll(user.id);
    return list.filter(c => {
      const r = results[c.id];
      return r && (r.progress ?? 0) > 0 && (r.progress ?? 0) < 100;
    });
  });

  ngOnInit() {
    console.log('Главная страница загружена');
    this.loadProgressFromBackend();
    this.updateStats();
    this.router.events.subscribe(ev => {
      if (ev instanceof NavigationEnd && ev.urlAfterRedirects.includes('/home')) {
        this.loadProgressFromBackend();
        this.updateStats();
      }
    });
  }

  private async loadProgressFromBackend() {
    try {
      console.log('🔄 HomeComponent: загружаем прогресс с бэкенда...');
      const progress = await this.progressSvc.getUserProgress();
      this.backendProgress.set(progress);
      console.log('✅ HomeComponent: прогресс загружен с бэкенда:', progress.length);
    } catch (error) {
      console.error('❌ HomeComponent: ошибка загрузки прогресса с бэкенда:', error);
    }
  }

  private updateStats() {
    const u = this.user();
    if (!u) { return; }
    const results = this.resultsSvc.getAll(u.id);
    const started = Object.entries(results)
      .filter(([, r]) => (r as any)?.progress > 0)
      .sort((a, b) => ((b[1] as any)?.passedAt ?? 0) - ((a[1] as any)?.passedAt ?? 0));
    if (started.length === 0) {
      this.lecturesProgress = 0;
      this.correctAnswers = 0;
      this.statsTitle = 'Курс';
      return;
    }
    const [lastCourseId, last] = started[0] as [string, any];
    this.lecturesProgress = Math.min(100, Math.round(last.progress ?? 0));
    this.correctAnswers = Math.min(100, Math.round(last.score ?? 0));
    const course = this.courses().find(c => c.id === lastCourseId);
    this.statsTitle = course?.title || 'Курс';
  }

  async onShowAlert() {
    await this.vkBridge.showAlert('Привет! Это тестовое сообщение от VK Mini App!');
  }

  async onShareResult() {
    const resultText = `Я прошел курс "Основы компьютерной грамотности" в приложении "Университет третьего возраста"! 🎓`;
    await this.vkBridge.shareResult(resultText);
  }

  onNavigateToCourses() {
    this.router.navigateByUrl('/courses');
  }

  onNavigateToProfile() {
    this.router.navigateByUrl('/profile');
  }

  onNavigateToProgress() {
    this.router.navigateByUrl('/progress');
  }

  onNavigateToFavorites() {
    this.router.navigateByUrl('/favorites');
  }

  openCourse(course: CourseDto) {
    this.router.navigate(['/courses', course.id]);
  }


  isFav(course: CourseDto) {
    const u = this.user();
    return u ? this.favSvc.isFavorite(u.id, course.id) : false;
  }

  nextCard() {
    const cards = this.courseCards();
    if (this.currentCardIndex < cards.length) {
      this.currentCardIndex++;
    }
  }

  prevCard() {
    if (this.currentCardIndex > 0) {
      this.currentCardIndex--;
    }
  }

  getCurrentCard() {
    const cards = this.courseCards();
    if (this.currentCardIndex < cards.length) {
      return cards[this.currentCardIndex];
    }
    return null;
  }

  getTotalCards() {
    return this.courseCards().length + 1;
  }

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
    
    return 'guest';
  }
}
