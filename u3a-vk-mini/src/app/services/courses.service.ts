import { Injectable, inject, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface CourseDto {
  id: string;
  title: string;
  category: string;
  description?: string;
  avatarUrl?: string;
}

export interface LessonDto {
  id: number;
  title: string;
  videoUrl?: string;
  lectureText?: string;
  lessonOrder: number;
}

@Injectable({ providedIn: 'root' })
export class CoursesService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private _courses = signal<CourseDto[]>([]);
  private _isLoading = signal<boolean>(false);
  courses = this._courses.asReadonly();
  isLoading = this._isLoading.asReadonly();

  private apiBaseUrl = environment.apiBaseUrl;

  constructor() {
    effect(() => {
      if (this.auth.isAuthReady() && this._courses().length === 0 && !this._isLoading()) {
        console.log('🔄 CoursesService: авторизация готова, загружаем курсы автоматически');
        this.load();
      }
    }, { allowSignalWrites: true });
  }

  async load() {
    if (this._isLoading()) {
      console.log('⚠️ CoursesService: загрузка уже в процессе, пропускаем');
      return;
    }

    this._isLoading.set(true);
    try {
      console.log('🔄 CoursesService: загружаем курсы с API...');
      const data = await firstValueFrom(this.http.get<any[]>(`${this.apiBaseUrl}/course/list`));
      console.log('✅ CoursesService: курсы загружены с API:', data?.length || 0);
      
      const coursesWithStringIds: CourseDto[] = (data ?? []).map(course => ({
        ...course,
        id: String(course.id)
      }));
      
      this._courses.set(coursesWithStringIds);
    } catch (e: any) {
      console.error('❌ CoursesService: не удалось загрузить курсы с API', {
        error: e.message || e,
        status: e.status,
        statusText: e.statusText,
        url: e.url
      });
      
      if (e.status === 401) {
        console.error('🚫 CoursesService: ошибка авторизации при загрузке курсов. Токен недействителен или отсутствует.');
      }
      
      console.error('🚫 CoursesService: курсы недоступны - бэкенд не отвечает. Fallback отключен.');
      this._courses.set([]);
    } finally {
      this._isLoading.set(false);
    }
  }

  async ensureLoaded() {
    if (this._courses().length === 0) {
      await this.load();
    }
  }

  async getById(id: string): Promise<CourseDto | null> {
    try {
      const course = await firstValueFrom(this.http.get<any>(`${this.apiBaseUrl}/course/${id}`));
      return course ? { ...course, id: String(course.id) } : null;
    } catch (e) {
      console.error(`🚫 Не удалось загрузить курс ${id} с бэкенда`, e);
      return null;
    }
  }

  async getFavorites(): Promise<CourseDto[]> {
    try {
      const courses = await firstValueFrom(this.http.get<any[]>(`${this.apiBaseUrl}/course/favorites`));
      return (courses ?? []).map(course => ({
        ...course,
        id: String(course.id)
      }));
    } catch (e) {
      console.error('Не удалось загрузить избранные курсы', e);
      return [];
    }
  }

  async getLessonsByCourseId(courseId: string): Promise<LessonDto[]> {
    try {
      const lessons = await firstValueFrom(this.http.get<LessonDto[]>(`${this.apiBaseUrl}/lesson/by-course/${courseId}`));
      return lessons ?? [];
    } catch (e) {
      console.error(`Не удалось загрузить уроки для курса ${courseId}`, e);
      return [];
    }
  }
}
