import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserCourseProgress {
  courseId: number;
  courseTitle: string;
  courseCategory?: string;
  courseDescription?: string;
  avatarUrl?: string;
  progress: number; // 0-100
  score: number; // средний балл
  enrolled?: string; // дата начала
  completed?: string; // дата завершения
  status?: string;
}

export interface UpdateProgressRequest {
  courseId: number;
  progress: number;
  score?: number;
}

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private http = inject(HttpClient);
  private apiBaseUrl = environment.apiBaseUrl;

  /**
   * Получить прогресс пользователя по всем курсам
   */
  async getUserProgress(): Promise<UserCourseProgress[]> {
    try {
      console.log('🔄 ProgressService: получаем прогресс пользователя с бэкенда...');
      const progress = await firstValueFrom(
        this.http.get<UserCourseProgress[]>(`${this.apiBaseUrl}/progress/courses`)
      );
      console.log('✅ ProgressService: прогресс получен:', progress?.length || 0);
      return progress ?? [];
    } catch (e: any) {
      console.error('❌ ProgressService: ошибка получения прогресса:', e);
      return [];
    }
  }

  /**
   * Начать изучение курса
   */
  async startCourse(courseId: number): Promise<UserCourseProgress | null> {
    try {
      console.log('🔄 ProgressService: начинаем курс', courseId);
      const progress = await firstValueFrom(
        this.http.post<UserCourseProgress>(`${this.apiBaseUrl}/progress/start/${courseId}`, {})
      );
      console.log('✅ ProgressService: курс начат:', progress);
      return progress;
    } catch (e: any) {
      console.error('❌ ProgressService: ошибка начала курса:', e);
      return null;
    }
  }

  /**
   * Обновить прогресс изучения курса
   */
  async updateProgress(request: UpdateProgressRequest): Promise<UserCourseProgress | null> {
    try {
      console.log('🔄 ProgressService: обновляем прогресс:', request);
      const progress = await firstValueFrom(
        this.http.put<UserCourseProgress>(`${this.apiBaseUrl}/progress/update`, request)
      );
      console.log('✅ ProgressService: прогресс обновлен:', progress);
      return progress;
    } catch (e: any) {
      console.error('❌ ProgressService: ошибка обновления прогресса:', e);
      return null;
    }
  }
}
