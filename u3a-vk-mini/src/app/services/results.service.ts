import { Injectable } from '@angular/core';

export interface UserResultDto {
  progress: number; // 0-100
  score?: number;
  passedAt?: number; // timestamp
}

@Injectable({ providedIn: 'root' })
export class ResultsService {
  private storageKey(userId: number | string) { return `u3a-results-${userId}`; }

  getAll(userId: number | string): Record<string, UserResultDto> {
    const raw = localStorage.getItem(this.storageKey(userId));
    if (!raw) return {};
    try { return JSON.parse(raw) as Record<string, UserResultDto>; } catch { return {}; }
  }

  get(userId: number | string, courseId: string): UserResultDto | null {
    const all = this.getAll(userId);
    return all[courseId] ?? null;
  }

  save(userId: number | string, courseId: string, data: UserResultDto) {
    const all = this.getAll(userId);
    all[courseId] = { ...all[courseId], ...data };
    localStorage.setItem(this.storageKey(userId), JSON.stringify(all));
  }

  remove(userId: number | string, courseId: string) {
    const all = this.getAll(userId);
    if (courseId in all) {
      delete all[courseId];
      localStorage.setItem(this.storageKey(userId), JSON.stringify(all));
    }
  }
}
