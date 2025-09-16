import { Component } from '@angular/core';

@Component({
  selector: 'app-progress',
  standalone: true,
  template: `
    <div class="page">
      <h1>Прогресс</h1>
    </div>
  `,
  styles: [`
    .page { min-height: 100vh; padding: 16px; background: var(--vk-bg-color, #fff); color: var(--vk-text-color, #000); }
    h1 { margin: 0; font-size: 24px; font-weight: 800; }
  `]
})
export class ProgressComponent {}
