import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface QuizResultDto {
  answers: Record<string, string>; // questionId -> optionId
  correctCount: number;
  total: number;
  submittedAt: number;
}

export interface QuizQuestionDto {
  id: number;
  text: string;
  options: QuizQuestionOptionDto[];
}

export interface QuizQuestionOptionDto {
  id: number;
  text: string;
  isCorrect: boolean;
}

export interface QuizDto {
  id: number;
  title: string;
  description?: string;
  passingScore: number;
  questions: QuizQuestionDto[];
}

@Injectable({ providedIn: 'root' })
export class QuizService {
  private http = inject(HttpClient);
  private apiBaseUrl = environment.apiBaseUrl;

  private key(userId: number | string, courseId: string, lectureId: string) {
    return `u3a-quiz-${userId}-${courseId}-${lectureId}`;
  }

  async getQuizByLessonId(lessonId: number): Promise<QuizDto | null> {
    try {
      const quiz = await firstValueFrom(this.http.get<QuizDto>(`${this.apiBaseUrl}/quiz/by-lesson/${lessonId}`));
      return quiz;
    } catch (e) {
      console.error(`Не удалось загрузить тест для урока ${lessonId}`, e);
      return null;
    }
  }

  get(userId: number | string, courseId: string, lectureId: string): QuizResultDto | null {
    const raw = localStorage.getItem(this.key(userId, courseId, lectureId));
    if (!raw) return null;
    try { return JSON.parse(raw) as QuizResultDto; } catch { return null; }
  }

  save(userId: number | string, courseId: string, lectureId: string, dto: QuizResultDto) {
    localStorage.setItem(this.key(userId, courseId, lectureId), JSON.stringify(dto));
  }
}
