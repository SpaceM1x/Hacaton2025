import { Component, inject, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ChatService, ChatMessage } from '../../services/chat.service';
import { VKBridgeService } from '../../services/vk-bridge.service';
import { BottomNavComponent } from '../../components/bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-chat',
  standalone: true,
  template: `
    <div class="page">
      <header class="header">
        <button class="back" (click)="goHome()">
          <svg class="back-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <h1>Общение с нейросетью</h1>
        <button class="clear-btn" (click)="clearChat()" title="Очистить чат">
          <svg class="clear-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3,6 5,6 21,6"/>
            <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
            <line x1="10" y1="11" x2="10" y2="17"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
        </button>
      </header>

      <div class="chat-container" #chatContainer>
        @if (messages.length === 0) {
          <div class="welcome-message">
            <div class="welcome-card">
              <h3>Добро пожаловать!</h3>
              <p>Я ваш цифровой помощник в Университете третьего возраста.</p>
              <p>Задавайте любые вопросы - я объясню всё простым и понятным языком!</p>
              
              <div class="suggested-questions">
                <p><strong>Примеры вопросов:</strong></p>
                <button class="suggestion" (click)="askSuggestion('Как начать изучать компьютер?')">Как начать изучать компьютер?</button>
                <button class="suggestion" (click)="askSuggestion('Какие курсы мне подойдут?')">Какие курсы мне подойдут?</button>
                <button class="suggestion" (click)="askSuggestion('Как поддерживать здоровье после 50?')">Как поддерживать здоровье после 50?</button>
                <button class="suggestion" (click)="askSuggestion('Расскажи про безопасность в интернете')">Расскажи про безопасность в интернете</button>
              </div>
            </div>
          </div>
        } @else {
          <div class="messages">
            @for (message of messages; track message.id) {
              <div class="message" [class.user]="message.isUser" [class.ai]="!message.isUser">
                <div class="message-content">
                  <div class="message-text">{{ message.text }}</div>
                  <div class="message-time">{{ formatTime(message.timestamp) }}</div>
                </div>
              </div>
            }
            
            @if (isLoading) {
              <div class="message ai">
                <div class="message-content">
                  <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <div class="message-time">Печатает...</div>
                </div>
              </div>
            }
          </div>
        }
      </div>

      <div class="input-area">
        <div class="input-container">
          <input 
            class="message-input" 
            type="text" 
            placeholder="Задайте ваш вопрос..." 
            [(ngModel)]="currentMessage"
            (keydown.enter)="sendMessage()"
            [disabled]="isLoading"
          />
          <button 
            class="send-btn" 
            (click)="sendMessage()" 
            [disabled]="!currentMessage.trim() || isLoading"
            title="Отправить сообщение"
          >
            <svg class="send-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22,2 15,22 11,13 2,9"/>
            </svg>
          </button>
        </div>
      </div>

      <app-bottom-nav active="chat" />
    </div>
  `,
  styles: [`
    .page { min-height: 100vh; padding: 16px; padding-bottom: 120px; background: var(--vk-bg-color, #fff); color: var(--vk-text-color, #000); display: flex; flex-direction: column; }
    
    .header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
    .back { 
      width: 40px; 
      height: 40px; 
      border-radius: 50%; 
      border: 1px solid var(--vk-border-color,#e1e3e6); 
      background: #fff; 
      cursor: pointer; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
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
    h1 { margin: 0; font-size: 24px; font-weight: 800; flex: 1; }
    .clear-btn { width: 40px; height: 40px; border-radius: 12px; border: 1px solid var(--vk-border-color,#e1e3e6); background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .clear-btn:hover { background: #f7f8fa; }
    .clear-icon { width: 16px; height: 16px; color: #6b7280; }
    
    .chat-container { flex: 1; overflow-y: auto; margin-bottom: 16px; }
    
    .welcome-message { display: flex; justify-content: center; align-items: center; min-height: 400px; }
    .welcome-card { background: #fff; border: 1px solid var(--vk-border-color,#e1e3e6); border-radius: 16px; padding: 24px; text-align: center; max-width: 400px; }
    .welcome-card h3 { margin: 0 0 16px; color: #2a6df5; font-size: 24px; }
    .welcome-card p { margin: 8px 0; color: #818c99; line-height: 1.4; }
    
    .suggested-questions { margin-top: 20px; text-align: left; }
    .suggested-questions p { font-weight: 600; margin-bottom: 12px; color: #2c2d2e; }
    .suggestion { display: block; width: 100%; text-align: left; background: #f7f8fa; border: 1px solid #e1e3e6; border-radius: 12px; padding: 12px; margin-bottom: 8px; cursor: pointer; font-size: 14px; }
    .suggestion:hover { background: #2a6df5; color: #fff; }
    
    .messages { display: flex; flex-direction: column; gap: 12px; }
    
    .message { display: flex; }
    .message.user { justify-content: flex-end; }
    .message.ai { justify-content: flex-start; }
    
    .message-content { max-width: 80%; padding: 12px 16px; border-radius: 16px; }
    .message.user .message-content { background: #2a6df5; color: #fff; border-bottom-right-radius: 4px; }
    .message.ai .message-content { background: #f7f8fa; color: #2c2d2e; border: 1px solid #e1e3e6; border-bottom-left-radius: 4px; }
    
    .message-text { margin-bottom: 4px; line-height: 1.4; white-space: pre-wrap; }
    .message-time { font-size: 11px; opacity: 0.7; }
    
    .typing-indicator { display: flex; gap: 4px; align-items: center; margin-bottom: 4px; }
    .typing-indicator span { width: 8px; height: 8px; background: #2a6df5; border-radius: 50%; animation: typing 1.4s infinite; }
    .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
    .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
    
    @keyframes typing { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-10px); } }
    
    .input-area { position: fixed; left: 16px; right: 16px; bottom: 80px; }
    .input-container { display: flex; gap: 8px; background: #fff; border: 1px solid var(--vk-border-color,#e1e3e6); border-radius: 16px; padding: 8px; }
    .message-input { flex: 1; border: none; outline: none; padding: 8px 12px; font-size: 16px; background: transparent; }
    .send-btn { width: 40px; height: 40px; border-radius: 12px; border: none; background: #2a6df5; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .send-btn:disabled { background: #e1e3e6; cursor: not-allowed; }
    .send-btn:not(:disabled):hover { background: #1e5bb8; }
    .send-icon { width: 16px; height: 16px; color: #fff; }
    
    @media (prefers-color-scheme: dark) {
      .back { background: #222; border-color: #333; }
      .back-icon { color: #ffffff; }
    }
  `],
  imports: [BottomNavComponent, FormsModule]
})
export class ChatComponent implements AfterViewChecked {
  private router = inject(Router);
  private chatService = inject(ChatService);
  private vk = inject(VKBridgeService);

  @ViewChild('chatContainer') private chatContainer!: ElementRef;

  messages: ChatMessage[] = [];
  currentMessage = '';
  isLoading = false;
  private shouldScrollToBottom = false;

  constructor() {
    this.loadMessages();
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  private loadMessages() {
    this.messages = this.chatService.getMessages();
  }

  async sendMessage() {
    if (!this.currentMessage.trim() || this.isLoading) return;

    const messageText = this.currentMessage.trim();
    this.currentMessage = '';
    this.isLoading = true;
    this.shouldScrollToBottom = true;

    this.loadMessages();

    try {
      const aiResponse = await this.chatService.sendMessage(messageText);
      
      this.loadMessages();
      this.shouldScrollToBottom = true;

    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
    } finally {
      this.isLoading = false;
    }
  }

  askSuggestion(question: string) {
    this.currentMessage = question;
    this.sendMessage();
  }

  clearChat() {
    if (confirm('Вы уверены, что хотите очистить историю чата?')) {
      this.chatService.clearHistory();
      this.loadMessages();
    }
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  private scrollToBottom() {
    if (this.chatContainer) {
      const element = this.chatContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }

  goHome() {
    this.router.navigateByUrl('/home');
  }
}

