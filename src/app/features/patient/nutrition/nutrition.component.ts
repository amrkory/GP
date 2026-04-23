import { Component, inject, signal } from '@angular/core';
import { CommonModule }               from '@angular/common';
import { HttpClient }                 from '@angular/common/http';
import { environment }                from '../../../../environments/environment';
import { ApiResponse, FoodRecognitionResult } from '../../../core/models/api.models';

@Component({
  selector: 'app-nutrition',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="page-header"><h1>Nutrition Tracker</h1></div>

      <!-- Upload zone -->
      <div class="upload-zone" (click)="fileInput.click()" [class.has-preview]="preview()">
        <input #fileInput type="file" accept="image/*" style="display:none" (change)="onFile($event)" />
        <img *ngIf="preview()" [src]="preview()!" class="preview-img" alt="food" />
        <div class="upload-placeholder" *ngIf="!preview()">
          <div class="upload-icon">📸</div>
          <p>Take a photo of your meal</p>
          <span>AI will identify food and calculate calories</span>
        </div>
        <div class="change-photo" *ngIf="preview()">Tap to change photo</div>
      </div>

      <button class="btn-analyze" (click)="analyze()"
              [disabled]="!selectedFile || analyzing() || !!result()"
              *ngIf="preview()">
        <span class="mini-spinner" *ngIf="analyzing()"></span>
        {{ analyzing() ? 'Analyzing...' : result() ? 'Analysis Complete' : '🔍 Analyze Meal' }}
      </button>

      <!-- Results -->
      <div class="result-card" *ngIf="result()">
        <div class="calories-banner">
          <div class="calories-num">{{ result()!.totalCalories }}</div>
          <div class="calories-label">Total Calories</div>
        </div>

        <div class="predictions">
          <h3>Detected Foods</h3>
          <div class="pred-row" *ngFor="let p of result()!.topPredictions">
            <div class="pred-info">
              <div class="pred-name">{{ p.label }}</div>
              <div class="pred-bar-wrap">
                <div class="pred-bar" [style.width.%]="p.confidence * 100"></div>
              </div>
            </div>
            <div class="pred-right">
              <div class="pred-cal">{{ p.calories }} kcal</div>
              <div class="pred-conf">{{ (p.confidence * 100).toFixed(0) }}%</div>
            </div>
          </div>
        </div>

        <div class="advice-box" *ngIf="result()!.nutritionAdvice">
          <div class="advice-icon">💡</div>
          <p>{{ result()!.nutritionAdvice }}</p>
        </div>

        <button class="btn-reset" (click)="reset()">Analyze Another Meal</button>
      </div>

      <!-- Tips -->
      <div class="tips-section" *ngIf="!result()">
        <h3>Nutrition Tips</h3>
        <div class="tip-card" *ngFor="let t of tips">
          <span class="tip-icon">{{ t.icon }}</span>
          <div>
            <div class="tip-title">{{ t.title }}</div>
            <div class="tip-text">{{ t.text }}</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding:16px; max-width:640px; margin:0 auto; }
    .page-header h1 { font-size:22px; font-weight:700; color:#111; margin-bottom:16px; }
    .upload-zone { border:2px dashed #e8e8e8; border-radius:16px; min-height:200px; display:flex; align-items:center; justify-content:center; cursor:pointer; margin-bottom:12px; overflow:hidden; position:relative; background:#fafafa; transition:all .2s; }
    .upload-zone:hover { border-color:#D84040; background:#FEF2F2; }
    .upload-zone.has-preview { border-style:solid; border-color:#D84040; background:#000; }
    .preview-img { width:100%; height:220px; object-fit:cover; opacity:0.9; }
    .upload-placeholder { text-align:center; padding:24px; }
    .upload-icon { font-size:40px; margin-bottom:10px; }
    .upload-placeholder p    { font-size:15px; color:#555; font-weight:500; margin-bottom:4px; }
    .upload-placeholder span { font-size:12px; color:#aaa; }
    .change-photo { position:absolute; bottom:10px; right:10px; background:rgba(0,0,0,0.6); color:#fff; font-size:12px; padding:4px 10px; border-radius:10px; }
    .btn-analyze { width:100%; padding:14px; background:#D84040; color:#fff; border:none; border-radius:14px; font-size:16px; font-weight:700; cursor:pointer; font-family:'Cairo',sans-serif; margin-bottom:12px; }
    .btn-analyze:disabled { opacity:0.55; cursor:not-allowed; }
    .mini-spinner { display:inline-block; width:14px; height:14px; border:2px solid rgba(255,255,255,0.4); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; vertical-align:middle; margin-right:6px; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .result-card { background:#fff; border-radius:16px; overflow:hidden; margin-bottom:16px; box-shadow:0 1px 8px rgba(0,0,0,0.06); }
    .calories-banner { background:#D84040; padding:20px; text-align:center; }
    .calories-num    { font-size:40px; font-weight:700; color:#fff; }
    .calories-label  { font-size:14px; color:rgba(255,255,255,0.8); }
    .predictions { padding:16px; }
    .predictions h3 { font-size:15px; font-weight:700; color:#111; margin-bottom:12px; }
    .pred-row    { display:flex; align-items:center; gap:12px; margin-bottom:10px; }
    .pred-info   { flex:1; }
    .pred-name   { font-size:14px; font-weight:600; color:#111; margin-bottom:4px; }
    .pred-bar-wrap { height:6px; background:#f0f0f0; border-radius:3px; overflow:hidden; }
    .pred-bar    { height:100%; background:#D84040; border-radius:3px; transition:width .5s; }
    .pred-right  { text-align:right; flex-shrink:0; }
    .pred-cal    { font-size:14px; font-weight:700; color:#D84040; }
    .pred-conf   { font-size:11px; color:#888; }
    .advice-box  { display:flex; gap:10px; align-items:flex-start; background:#E1F5EE; margin:0 16px 16px; border-radius:10px; padding:12px 14px; }
    .advice-icon { font-size:20px; flex-shrink:0; }
    .advice-box p { font-size:13px; color:#0F6E56; line-height:1.5; }
    .btn-reset   { width:calc(100% - 32px); margin:0 16px 16px; padding:12px; border:1.5px solid #D84040; background:#fff; color:#D84040; border-radius:12px; font-size:14px; font-weight:600; cursor:pointer; display:block; }
    .tips-section    { margin-top:4px; }
    .tips-section h3 { font-size:16px; font-weight:700; color:#111; margin-bottom:10px; }
    .tip-card  { background:#fff; border-radius:12px; padding:14px; display:flex; align-items:flex-start; gap:12px; margin-bottom:10px; box-shadow:0 1px 6px rgba(0,0,0,0.05); }
    .tip-icon  { font-size:24px; flex-shrink:0; }
    .tip-title { font-size:14px; font-weight:600; color:#111; margin-bottom:2px; }
    .tip-text  { font-size:13px; color:#888; line-height:1.4; }
  `],
})
export class NutritionComponent {
  private http = inject(HttpClient);

  preview      = signal<string | null>(null);
  analyzing    = signal(false);
  result       = signal<FoodRecognitionResult | null>(null);
  selectedFile: File | null = null;

  tips = [
    { icon:'🥗', title:'Eat more vegetables', text:'Aim for at least 5 servings of vegetables daily.' },
    { icon:'💧', title:'Stay hydrated',       text:'Drink 8 glasses of water per day for optimal health.' },
    { icon:'🍽️', title:'Portion control',    text:'Use smaller plates to help manage your portion sizes.' },
    { icon:'🌾', title:'Choose whole grains', text:'Replace white rice and bread with whole grain alternatives.' },
  ];

  onFile(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.selectedFile = file;
    this.result.set(null);
    const reader = new FileReader();
    reader.onload = (ev: ProgressEvent<FileReader>) => this.preview.set(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  analyze(): void {
    if (!this.selectedFile) return;
    this.analyzing.set(true);
    const form = new FormData();
    form.append('image', this.selectedFile);
    this.http.post<ApiResponse<FoodRecognitionResult>>(
      `${environment.apiUrl}/ai/food-recognize`, form
    ).subscribe({
      next: (res: ApiResponse<FoodRecognitionResult>) => {
        this.result.set(res.data);
        this.analyzing.set(false);
      },
      error: () => this.analyzing.set(false),
    });
  }

  reset(): void { this.preview.set(null); this.selectedFile = null; this.result.set(null); }
}
