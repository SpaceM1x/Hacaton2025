import { Component, inject, signal } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CoursesService, CourseDto, LessonDto } from '../../services/courses.service';
import { VKBridgeService } from '../../services/vk-bridge.service';
import { FavoritesService } from '../../services/favorites.service';
import { ResultsService } from '../../services/results.service';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { QuizService, QuizResultDto, QuizDto, QuizQuestionDto } from '../../services/quiz.service';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  template: `
    @if (course; as c) {
    <div class="page">
      <header class="header">
        <button class="back" (click)="goBack()">
          <svg class="back-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <h1>{{ c.title }}</h1>
        <span class="spacer"></span>
        <button class="fav" [class.favorited]="isFav()" (click)="toggleFav()">
          <svg class="fav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </header>

      <!-- Список уроков -->
      @if (lessons().length > 1) {
        <section class="lessons-list">
          <h3>Уроки курса</h3>
          <div class="lessons-grid">
            @for (lesson of lessons(); track lesson.id) {
              <button 
                class="lesson-card" 
                [class.active]="currentLesson()?.id === lesson.id"
                (click)="selectLesson(lesson)"
              >
                <div class="lesson-number">{{ lesson.lessonOrder }}</div>
                <div class="lesson-title">{{ lesson.title }}</div>
              </button>
            }
          </div>
        </section>
      }

      <nav class="tabs">
        <button class="tab" [class.active]="tab==='video'" (click)="tab='video'">Видео</button>
        <button class="tab" [class.active]="tab==='lecture'" (click)="tab='lecture'">Лекция</button>
        <button class="tab" [class.active]="tab==='quiz'" (click)="tab='quiz'">Тест</button>
      </nav>

      @if (tab==='video') {
        <section class="video">
          @if (currentLecture()?.videoUrl) {
            <div class="video-frame">
              <video controls [src]="currentLecture()?.videoUrl" style="width: 100%; height: 100%; border-radius: 16px;">
                Ваш браузер не поддерживает видео.
              </video>
            </div>
          } @else {
            <div class="video-frame">Видео-заглушка</div>
            <p class="muted">Здесь будет встроенный видеоплеер</p>
          }
        </section>
      } @else if (tab==='lecture') {
        <section class="lecture">
          <h3>{{ currentLecture()?.title || 'Лекция' }}</h3>
          <p>{{ currentLecture()?.text || 'Текст лекции...' }}</p>
        </section>
      } @else {
        <section class="quiz">
          <h3>{{ quiz()?.title || 'Тест' }}</h3>
          @if (quiz()?.description) {
            <p class="quiz-description">{{ quiz()?.description }}</p>
          }
          @if (resultShown) {
            <p class="result">Ваш результат: {{ resultCorrect }} из {{ resultTotal }}</p>
          }
          <form (submit)="submitQuiz($event)">
            @for (question of quizQuestions(); track question.id) {
              <div class="q">
                <div class="q-title">{{ question.text }}</div>
                @for (opt of question.options; track opt.id) {
                  <label>
                    <input type="radio" [name]="question.id" [value]="opt.id" [checked]="isChecked(question.id.toString(), opt.id.toString())">
                    {{ opt.text }}
                  </label>
                }
              </div>
            }
            <button class="submit btn-blue" type="submit">Отправить ответы</button>
          </form>
        </section>
      }
    </div>
    }
  `,
  styles: [`
    .page { min-height: 100vh; padding: 16px; background:#fff; color:#000 }
    .header { display:flex; align-items:center; gap:8px; }
    .back { 
      width:40px; 
      height:40px; 
      border-radius:50%; 
      border:1px solid #e1e3e6; 
      background:#fff; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      cursor: pointer;
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
    .spacer { flex:1 }
    .fav { width:40px; height:40px; border-radius:10px; border:1px solid #e1e3e6; background:#fff; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease; }
    .fav-icon { width: 18px; height: 18px; color: #000000; stroke: #000000; fill: none; transition: all 0.2s ease; }
    .fav.favorited .fav-icon { color: #EB5050; stroke: #EB5050; fill: #EB5050; }
    .fav:hover .fav-icon { transform: scale(1.1); }
    .tabs { display:flex; gap:8px; margin: 12px 0; }
    .tab { padding:8px 14px; border:1px solid #e1e3e6; border-radius:20px; background:#fff; cursor:pointer; }
    .tab.active { background:#2a6df5; color:#fff; border-color:#2a6df5; }
    .video-frame { height:180px; border-radius:16px; background:linear-gradient(135deg,#bfd7ff,#f0f5ff); display:flex; align-items:center; justify-content:center; font-weight:700; }
    .muted { opacity:.6 }
    .lecture { background:#fff; border:1px solid #e1e3e6; border-radius: 16px; padding: 12px; }
    .quiz .q { background:#fff; border:1px solid #e1e3e6; border-radius: 12px; padding: 10px; margin-bottom: 10px; display:flex; flex-direction:column; gap:6px; }
    .quiz .q-title { font-weight:700 }
    .submit { background:#2a6df5; color:#fff; border:none; border-radius:12px; padding:10px 16px; }
    .result { font-weight: 700; margin-bottom: 8px; }
    
    .lessons-list { margin: 16px 0; }
    .lessons-list h3 { margin: 0 0 12px 0; font-size: 18px; font-weight: 600; }
    .lessons-grid { display: flex; flex-direction: column; gap: 8px; }
    .lesson-card { 
      display: flex; 
      align-items: center; 
      gap: 12px; 
      padding: 12px 16px; 
      background: #f8f9fa; 
      border: 1px solid #e1e3e6; 
      border-radius: 12px; 
      cursor: pointer; 
      transition: all 0.2s ease;
      text-align: left;
    }
    .lesson-card:hover { background: #e3f2fd; border-color: #2a6df5; }
    .lesson-card.active { background: #2a6df5; color: white; border-color: #2a6df5; }
    .lesson-number { 
      width: 32px; 
      height: 32px; 
      border-radius: 50%; 
      background: #2a6df5; 
      color: white; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      font-weight: 600; 
      font-size: 14px;
      flex-shrink: 0;
    }
    .lesson-card.active .lesson-number { background: white; color: #2a6df5; }
    .lesson-title { font-weight: 500; flex: 1; }
    
    @media (prefers-color-scheme: dark) {
      .fav-icon { color: #ffffff; stroke: #ffffff; }
      .fav.favorited .fav-icon { color: #EB5050; stroke: #EB5050; fill: #EB5050; }
      .back { background: #222; border-color: #333; }
      .back-icon { color: #ffffff; }
      .lesson-card { background: #2a2a2a; border-color: #444; color: white; }
      .lesson-card:hover { background: #1a3a5c; border-color: #2a6df5; }
    }
  `]
})
export class CourseDetailComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private coursesSvc = inject(CoursesService);
  private location = inject(Location);
  private vk = inject(VKBridgeService);
  private favSvc = inject(FavoritesService);
  private resultsSvc = inject(ResultsService);
  private http = inject(HttpClient);
  private quizSvc = inject(QuizService);

  course: CourseDto | null = null;
  tab: 'video' | 'lecture' | 'quiz' = 'video';
  content: any | null = null;
  activeLectureId = 'intro';
  lessons = signal<LessonDto[]>([]);
  currentLesson = signal<LessonDto | null>(null);
  quiz = signal<QuizDto | null>(null);

  savedAnswers: Record<string, string> = {};
  resultCorrect = 0;
  resultTotal = 0;
  resultShown = false;

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCourseData(id);
    }
    firstValueFrom(this.http.get<any>('assets/course-content.json')).then(data => { this.content = data; this.tryLoadPrev(); });
  }

  async loadCourseData(courseId: string) {
    try {
      this.course = await this.coursesSvc.getById(courseId);
      
      const lessonsData = await this.coursesSvc.getLessonsByCourseId(courseId);
      this.lessons.set(lessonsData);
      
      if (lessonsData.length > 0) {
        this.currentLesson.set(lessonsData[0]);
        this.activeLectureId = lessonsData[0].id.toString();
        
        await this.loadQuizForLesson(lessonsData[0].id);
      }
      
      this.tryLoadPrev();
    } catch (error) {
      console.error('Ошибка загрузки данных курса:', error);
    }
  }

  async loadQuizForLesson(lessonId: number) {
    try {
      const quizData = await this.quizSvc.getQuizByLessonId(lessonId);
      this.quiz.set(quizData);
    } catch (error) {
      console.error('Ошибка загрузки теста:', error);
    }
  }

  async selectLesson(lesson: LessonDto) {
    this.currentLesson.set(lesson);
    this.activeLectureId = lesson.id.toString();
    
    await this.loadQuizForLesson(lesson.id);
    
    this.resultShown = false;
    this.savedAnswers = {};
    this.resultCorrect = 0;
    this.resultTotal = 0;
    
    this.tryLoadPrev();
  }

  currentLecture() {
    const currentLesson = this.currentLesson();
    if (currentLesson) {
      return {
        id: currentLesson.id.toString(),
        title: currentLesson.title,
        text: currentLesson.lectureText || 'Текст лекции...',
        videoUrl: currentLesson.videoUrl
      };
    }
    
    const cid = this.course?.id;
    if (!cid || !this.content) return null;
    const courseData = (this.content as any)[cid];
    const lectures = courseData?.lectures || [];
    return lectures.find((l: any) => l.id === this.activeLectureId) || null;
  }

  quizQuestions(): QuizQuestionDto[] {
    const quizData = this.quiz();
    if (quizData && quizData.questions) {
      return quizData.questions;
    }
    
    return this.currentLecture()?.quiz?.questions || [];
  }

  tryLoadPrev() {
    if (!this.course || !this.content) return;
    const u = this.vk.user();
    if (!u) return;
    const prev = this.quizSvc.get(u.id, this.course.id, this.activeLectureId);
    if (prev) {
      this.savedAnswers = prev.answers || {};
      this.resultCorrect = prev.correctCount;
      this.resultTotal = prev.total;
      this.resultShown = true;
    }
  }

  goBack() {
    if (window.history && window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigateByUrl('/courses');
    }
  }

  isFav() {
    const u = this.vk.user();
    if (!u || !this.course) return false;
    return this.favSvc.isFavorite(u.id, this.course.id);
  }

  async toggleFav() {
    const u = this.vk.user();
    if (!u || !this.course) return;
    await this.favSvc.toggle(u.id, this.course.id);
  }

  isChecked(qid: string, optId: string) {
    return this.savedAnswers[qid] === optId;
  }

  submitQuiz(e: Event) {
    e.preventDefault();
    if (!this.course) return;
    const courseId = this.course.id;
    const lectureId = this.activeLectureId;
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const answers: Record<string,string> = {};
    formData.forEach((value, key) => { answers[String(key)] = String(value); });

    let correct = 0;
    const q = this.quizQuestions();
    for (const question of q) {
      const chosen = answers[question.id.toString()];
      const correctOpt = question.options.find((o: any) => o.isCorrect);
      if (chosen && correctOpt && chosen === correctOpt.id.toString()) correct += 1;
    }
    const total = q.length;

    const u = this.vk.user();
    if (!u) return;
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    this.resultsSvc.save(u.id, courseId, { progress: 100, score, passedAt: Date.now() });

    const dto: QuizResultDto = { answers, correctCount: correct, total, submittedAt: Date.now() };
    this.quizSvc.save(u.id, courseId, lectureId, dto);

    this.savedAnswers = answers;
    this.resultCorrect = correct;
    this.resultTotal = total;
    this.resultShown = true;
  }
}
