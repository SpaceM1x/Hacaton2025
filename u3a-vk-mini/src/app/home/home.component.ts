import { Component, OnInit, inject } from '@angular/core';
import { VKBridgeService } from '../services/vk-bridge.service';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  private vkBridge = inject(VKBridgeService);
  
  // Используем Angular signals для реактивности
  public readonly user = this.vkBridge.user;
  public readonly isInitialized = this.vkBridge.isInitialized;

  // UI model
  lecturesProgress = 45;
  correctAnswers = 87;
  selectedTab: 'for-you' | 'new' | 'fav' = 'for-you';
  courses = [
    { id: 1, title: 'Компьютерная грамотность' }
  ];

  ngOnInit() {
    console.log('Главная страница загружена');
  }

  async onShowAlert() {
    await this.vkBridge.showAlert('Привет! Это тестовое сообщение от VK Mini App!');
  }

  async onShareResult() {
    const resultText = `Я прошел курс "Основы компьютерной грамотности" в приложении "Университет третьего возраста"! 🎓`;
    await this.vkBridge.shareResult(resultText);
  }

  onNavigateToCourses() {
    console.log('Переход к каталогу курсов');
    // Здесь будет навигация к каталогу курсов
  }

  onNavigateToProfile() {
    console.log('Переход к профилю пользователя');
    // Здесь будет навигация к профилю
  }

  onNavigateToProgress() {
    console.log('Переход к прогрессу обучения');
    // Здесь будет навигация к прогрессу
  }
}
