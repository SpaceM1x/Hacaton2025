import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { VKBridgeService } from './vk-bridge.service';
import { ResultsService } from './results.service';
import { environment } from '../../environments/environment';

export interface CandidateCourse {
  id: string;
  title: string;
  category: string;
  description?: string;
}

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  age?: number;
  city?: string;
  country?: string;
  interests?: string[];
  education?: string;
  occupation?: string;
  sex?: number; 
}

@Injectable({ providedIn: 'root' })
export class RecommendationService {
  private http = inject(HttpClient);
  private vk = inject(VKBridgeService);
  private results = inject(ResultsService);
  private endpoint = `${environment.apiBaseUrl}/recommendations`;

  /**
   * Получает рекомендации курсов для пользователя
   * @param candidates Список доступных курсов
   * @returns Массив из 3 наиболее подходящих ID курсов
   */
  async getRecommendations(candidates: CandidateCourse[]): Promise<string[]> {
    try {
      console.log('🔍 Начинаем получение рекомендаций...');
      
      const userProfile = await this.collectUserProfile();
      console.log('👤 Собранный профиль пользователя:', userProfile);
      
      const availableCandidates = this.filterCompletedCourses(candidates);
      console.log('📚 Доступных курсов после фильтрации:', availableCandidates.length, 'из', candidates.length);
      
      if (availableCandidates.length === 0) {
        console.log('🎉 Все курсы уже пройдены!');
        return [];
      }
      
      const recommendedIds = await this.queryBackend(userProfile, availableCandidates);
      console.log('🤖 Ответ от нейросети:', recommendedIds);
      
      if (recommendedIds.length > 0) {
        const result = recommendedIds.slice(0, 3);
        console.log('✅ Итоговые рекомендации от нейросети:', result);
        return result;
      }
      
      console.log('⚠️ Нейросеть не вернула рекомендации');
      return [];
      
    } catch (error) {
      console.error('❌ Ошибка получения рекомендаций от нейросети:', error);
      console.log('🚫 Рекомендации недоступны - сервис не отвечает');
      return [];
    }
  }

  /**
   * Фильтрует пройденные курсы из списка кандидатов
   */
  private filterCompletedCourses(candidates: CandidateCourse[]): CandidateCourse[] {
    const user = this.vk.user();
    if (!user) {
      return candidates;
    }

    const userResults = this.results.getAll(user.id);
    
    return candidates.filter(course => {
      const result = userResults[course.id];
      const isCompleted = result && (result.progress ?? 0) >= 100;
      
      if (isCompleted) {
        console.log(`📋 Курс "${course.title}" уже пройден (${result.progress}%)`);
      }
      
      return !isCompleted;
    });
  }

  /**
   * Собирает максимально полный профиль пользователя из VK Bridge
   */
  private async collectUserProfile(): Promise<UserProfile> {
    const profile: UserProfile = {};

    try {
      const user = this.vk.user();
      if (user) {
        profile.firstName = user.first_name;
        profile.lastName = user.last_name;
      }

      try {
        const userInfo: any = await this.vk.bridge('VKWebAppGetUserInfo', {});
        if (userInfo) {
          profile.age = this.calculateAge(userInfo.bdate);
          profile.city = userInfo.city?.title;
          profile.country = userInfo.country?.title;
          profile.sex = userInfo.sex;
        }
      } catch (e) {
        console.log('VKWebAppGetUserInfo недоступен, используем базовую информацию');
      }

      try {
        const launchParams = await this.vk.getLaunchParams();
        if (launchParams && launchParams.vk_user_id) {
          console.log('Параметры запуска получены:', launchParams);
        }
      } catch (e) {
        console.log('Параметры запуска недоступны');
      }

      if (profile.city) {
        const regionalInterests = this.getRegionalInterests(profile.city);
        if (regionalInterests.length > 0) {
          profile.interests = regionalInterests;
        }
      }

    } catch (error) {
      console.warn('Ошибка сбора профиля пользователя:', error);
    }

    return profile;
  }

  /**
   * Определяет возможные интересы на основе региона
   */
  private getRegionalInterests(city: string): string[] {
    const cityLower = city.toLowerCase();
    const interests: string[] = [];

    if (cityLower.includes('москв') || cityLower.includes('петербург') || cityLower.includes('спб')) {
      interests.push('технологии', 'карьера', 'бизнес');
    }
    
    if (cityLower.includes('екатеринбург') || cityLower.includes('новосибирск') || 
        cityLower.includes('казань') || cityLower.includes('нижний')) {
      interests.push('образование', 'культура');
    }
    
    interests.push('здоровье', 'саморазвитие');
    
    return interests;
  }

  /**
   * Вычисляет возраст по дате рождения
   */
  private calculateAge(bdate?: string): number | undefined {
    if (!bdate) return undefined;
    
    const parts = bdate.split('.');
    if (parts.length === 3) {
      const birthYear = parseInt(parts[2]);
      const currentYear = new Date().getFullYear();
      return currentYear - birthYear;
    }
    
    return undefined;
  }

  /**
   * Отправляет запрос на бэкенд для получения рекомендаций
   */
  private async queryBackend(userProfile: UserProfile, candidates: CandidateCourse[]): Promise<string[]> {
    const body = {
      userProfile: userProfile,
      courses: candidates
    };

    try {
      console.log('🔄 RecommendationService: отправляем запрос на бэкенд', {
        endpoint: this.endpoint,
        userProfileKeys: Object.keys(userProfile),
        candidatesCount: candidates.length
      });

      const response: any = await firstValueFrom(
        this.http.post(this.endpoint, body)
      );

      console.log('✅ RecommendationService: получен ответ от бэкенда:', response);

      if (!response.success || !Array.isArray(response.recommendations)) {
        throw new Error('Некорректный ответ от сервера');
      }

      return response.recommendations;
      
    } catch (error: any) {
      console.error('❌ RecommendationService: ошибка запроса к бэкенду:', {
        error: error.message || error,
        status: error.status,
        statusText: error.statusText,
        url: error.url
      });
      
      if (error.status === 401) {
        console.warn('⚠️ RecommendationService: ошибка авторизации при запросе рекомендаций. Возможно, токен недействителен или отсутствует.');
      }
      
      throw error;
    }
  }

}
