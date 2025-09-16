import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { CourseDto } from './courses.service';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private http = inject(HttpClient);
  private apiBaseUrl = environment.apiBaseUrl;
  private _favorites = new Set<string>();

  private storageKey(userId: number | string) { return `u3a-fav-${userId}`; }

  private read(userId: number | string): string[] {
    const raw = localStorage.getItem(this.storageKey(userId));
    if (!raw) return [];
    try { return JSON.parse(raw) as string[]; } catch { return []; }
  }

  private write(userId: number | string, ids: string[]) {
    localStorage.setItem(this.storageKey(userId), JSON.stringify(ids));
  }

  async loadFavorites(): Promise<CourseDto[]> {
    try {
      const courses = await firstValueFrom(this.http.get<CourseDto[]>(`${this.apiBaseUrl}/course/favorites`));
      this._favorites = new Set(courses.map(c => c.id));
      return courses;
    } catch (e) {
      console.error('Не удалось загрузить избранные курсы', e);
      return [];
    }
  }

  getSet(userId: number | string): Set<string> {
    if (this._favorites.size > 0) {
      return this._favorites;
    }
    return new Set(this.read(userId));
  }

  isFavorite(userId: number | string, courseId: string): boolean {
    return this.getSet(userId).has(courseId);
  }

  async toggle(userId: number | string, courseId: string): Promise<boolean> {
    try {
      const set = this.getSet(userId);
      if (set.has(courseId)) {
        set.delete(courseId);
      } else {
        set.add(courseId);
      }
      this.write(userId, Array.from(set));
      this._favorites = set;
      return set.has(courseId);
    } catch (e) {
      console.error('Ошибка при изменении избранного', e);
      return false;
    }
  }
}


