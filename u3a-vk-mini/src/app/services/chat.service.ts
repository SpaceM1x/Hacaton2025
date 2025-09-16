import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { VKBridgeService } from './vk-bridge.service';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private http = inject(HttpClient);
  private vk = inject(VKBridgeService);
  private auth = inject(AuthService);
  
  private endpoint = `${environment.apiBaseUrl}/chat`;

  private messages: ChatMessage[] = [];

  /**
   * Отправляет сообщение пользователя и получает ответ от нейросети
   */
  async sendMessage(userMessage: string): Promise<ChatMessage> {
    const token = this.auth.accessToken();
    if (!token) {
      const errorMsg: ChatMessage = {
        id: this.generateId(),
        text: 'Для использования чата необходимо войти в систему. Пожалуйста, обновите страницу.',
        isUser: false,
        timestamp: new Date()
      };
      this.messages.push(errorMsg);
      return errorMsg;
    }

    const userMsg: ChatMessage = {
      id: this.generateId(),
      text: userMessage,
      isUser: true,
      timestamp: new Date()
    };
    this.messages.push(userMsg);

    try {
      console.log('🌐 Connecting to YandexGPT API...');
      const aiResponse = await this.queryYandexGPT(userMessage);
      
      const aiMsg: ChatMessage = {
        id: this.generateId(),
        text: aiResponse,
        isUser: false,
        timestamp: new Date()
      };
      this.messages.push(aiMsg);

      return aiMsg;
    } catch (error) {
      console.error('Ошибка получения ответа от нейросети:', error);
      
      const errorMsg: ChatMessage = {
        id: this.generateId(),
        text: 'Извините, произошла ошибка при обращении к нейросети. Пожалуйста, попробуйте еще раз.',
        isUser: false,
        timestamp: new Date()
      };
      this.messages.push(errorMsg);

      return errorMsg;
    }
  }

  /**
   * Получает всю историю сообщений
   */
  getMessages(): ChatMessage[] {
    return [...this.messages];
  }

  /**
   * Очищает историю чата
   */
  clearHistory(): void {
    this.messages = [];
  }

  /**
   * Отправляет запрос в чат через бэкенд
   */
  private async queryYandexGPT(userMessage: string): Promise<string> {
    const token = this.auth.accessToken();
    if (!token) {
      throw new Error('Пользователь не авторизован. Пожалуйста, войдите в систему.');
    }

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    console.log('🔐 Отправка запроса с JWT токеном:', token.substring(0, 20) + '...');

    const systemPrompt = this.buildSystemPrompt();
    
    const conversationHistory = this.buildConversationHistory(userMessage);

    const body = {
      messages: [
        {
          role: 'system',
          text: systemPrompt
        },
        ...conversationHistory
      ]
    };

    try {
      const response: any = await firstValueFrom(
        this.http.post(this.endpoint, body, { headers })
      );

      if (!response.success || !response.response) {
        throw new Error('Некорректный ответ от сервера');
      }

      return response.response;
      
    } catch (error: any) {
      console.error('❌ Ошибка запроса к чату:', {
        status: error.status,
        message: error.message,
        error: error.error
      });
      
      if (error.status === 401) {
        throw new Error('Ошибка авторизации. Пожалуйста, перезайдите в приложение.');
      } else if (error.status === 403) {
        throw new Error('Доступ запрещен. У вас нет прав для использования чата.');
      } else if (error.status >= 500) {
        throw new Error('Временная ошибка сервера. Попробуйте позже.');
      }
      
      throw error;
    }
  }

  /**
   * Формирует системный промпт для пользователей 50+
   */
  private buildSystemPrompt(): string {
    const user = this.vk.user();
    const userName = user ? `${user.first_name}` : 'друг';

    return `Ты дружелюбный помощник в Университете третьего возраста, который общается с людьми старше 50 лет.

ВАЖНЫЕ ПРАВИЛА ОБЩЕНИЯ:
- Обращайся к пользователю по имени "${userName}" или "Вы" с большой буквы
- Используй простые, понятные объяснения без сложных технических терминов
- Говори доброжелательно и терпеливо, как с близким другом
- Если спрашивают про технологии - объясняй пошагово, очень подробно
- Поощряй желание учиться новому в любом возрасте
- Давай практические советы, которые легко применить

ТВОЯ РОЛЬ:
- Помощник по вопросам обучения и саморазвития
- Консультант по компьютерной грамотности  
- Советчик по здоровому образу жизни
- Собеседник по интересам людей старшего возраста

СТИЛЬ ОТВЕТОВ:
- Короткие абзацы (2-3 предложения)
- Конкретные примеры из жизни
- Пошаговые инструкции где нужно
- Позитивный и вдохновляющий тон

Отвечай так, будто разговариваешь с мудрым человеком, который заслуживает уважения и хочет продолжать развиваться.`;
  }

  /**
   * Формирует историю разговора для контекста
   */
  private buildConversationHistory(currentMessage: string): Array<{role: string, text: string}> {
    const history: Array<{role: string, text: string}> = [];
    
    const recentMessages = this.messages.slice(-6);
    
    recentMessages.forEach(msg => {
      history.push({
        role: msg.isUser ? 'user' : 'assistant',
        text: msg.text
      });
    });

    history.push({
      role: 'user',
      text: currentMessage
    });

    return history;
  }


  /**
   * Генерирует уникальный ID для сообщения
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
