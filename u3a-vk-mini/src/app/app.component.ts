import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { VKBridgeService } from './services/vk-bridge.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  private vkBridge = inject(VKBridgeService);
  title = 'Университет третьего возраста';

  ngOnInit() {
    // VK Bridge инициализируется автоматически в сервисе
    console.log('VK Mini App запущено');
  }
}
