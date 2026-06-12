import { Component, inject, signal } from '@angular/core';
import { CommonModule }  from '@angular/common';
import { FormsModule }   from '@angular/forms';
import { AiService }     from '../../../core/services/ai.service';

interface FoodEntry { food: string; grams: number; per100g: number; calories: number; protein?: number; carbs?: number; fat?: number; fiber?: number; }

@Component({
  selector: 'app-nutrition',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Nutrition Tracker</h1>
        <p class="page-sub">AI-powered calorie & nutrition analysis</p>
      </div>

      <!-- Search -->
      <div class="search-card">
        <div class="search-title">Analyze Food</div>
        <div class="search-row">
          <input [(ngModel)]="foodInput"
                 placeholder="e.g. Koshary, grilled chicken, salad..."
                 class="food-input"
                 (keydown.enter)="analyze()" />
          <button class="btn-analyze" (click)="analyze()" [disabled]="searching() || !foodInput.trim()">
            <span class="mini-spinner" *ngIf="searching()"></span>
            {{ searching() ? 'Analyzing...' : 'Analyze' }}
          </button>
        </div>
        <div class="error-msg" *ngIf="error()">{{ error() }}</div>
      </div>

      <!-- AI Result -->
      <div class="result-card" *ngIf="result()">
        <div class="result-header">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
          "{{ result()!.food }}" — {{ result()!.grams }}g
        </div>
        <div class="per100-note">{{ result()!.per100g | number:'1.0-0' }} kcal per 100g</div>
        <div class="macros-grid">
          <div class="macro-box calories">
            <div class="macro-num">{{ result()!.calories | number:'1.0-0' }}</div>
            <div class="macro-lbl">kcal total</div>
          </div>
          <div class="macro-box protein" *ngIf="result()!.protein">
            <div class="macro-num">{{ scale(result()!.protein!, result()!.grams) | number:'1.0-1' }}g</div>
            <div class="macro-lbl">Protein</div>
          </div>
          <div class="macro-box carbs" *ngIf="result()!.carbs">
            <div class="macro-num">{{ scale(result()!.carbs!, result()!.grams) | number:'1.0-1' }}g</div>
            <div class="macro-lbl">Carbs</div>
          </div>
          <div class="macro-box fat" *ngIf="result()!.fat">
            <div class="macro-num">{{ scale(result()!.fat!, result()!.grams) | number:'1.0-1' }}g</div>
            <div class="macro-lbl">Fat</div>
          </div>
          <div class="macro-box fiber" *ngIf="result()!.fiber">
            <div class="macro-num">{{ scale(result()!.fiber!, result()!.grams) | number:'1.0-1' }}g</div>
            <div class="macro-lbl">Fiber</div>
          </div>
        </div>
        <div class="advice" *ngIf="advice()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#185FA5" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {{ advice() }}
        </div>
        <button class="btn-add" (click)="addToLog()">+ Add to Today's Log</button>
      </div>

      <!-- Today's log -->
      <div class="log-section" *ngIf="todayLog().length > 0">
        <div class="log-header">
          <span>Today's Log</span>
          <span class="total-cal">{{ totalCalories() }} kcal total</span>
        </div>
        <div class="log-list">
          <div class="log-item" *ngFor="let item of todayLog(); let i = index">
            <div class="log-food">{{ item.food }}</div>
            <div class="log-cal">{{ item.calories }} kcal</div>
            <button class="del-btn" (click)="removeItem(i)">×</button>
          </div>
        </div>

        <!-- Progress bar -->
        <div class="progress-section">
          <div class="progress-label">
            <span>Daily Goal (2000 kcal)</span>
            <span>{{ progressPct() }}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" [style.width]="progressPct() + '%'"
                 [class.over]="progressPct() > 100"></div>
          </div>
        </div>
      </div>

      <!-- Quick suggestions -->
      <div class="suggestions">
        <div class="sugg-title">Quick Search</div>
        <div class="sugg-chips">
          <button *ngFor="let s of suggestions" class="chip" (click)="quickSearch(s)">{{ s }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page{padding:24px;max-width:640px;}@media(max-width:768px){.page{padding:16px;}}
    .page-header{margin-bottom:20px;}.page-header h1{font-size:22px;font-weight:800;color:#111;margin-bottom:4px;}
    .page-sub{font-size:14px;color:#888;}
    .search-card{background:#fff;border-radius:14px;padding:18px;margin-bottom:16px;box-shadow:0 1px 8px rgba(0,0,0,.06);}
    .search-title{font-size:14px;font-weight:700;color:#111;margin-bottom:12px;}
    .search-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;}
    .mult-wrap{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:6px;}
    .mult-lbl{font-size:12px;color:#888;font-weight:600;white-space:nowrap;}
    .mult-btn{padding:6px 12px;border:1.5px solid #e8e8e8;border-radius:20px;background:#F8F9FA;font-size:12px;font-weight:600;cursor:pointer;color:#555;font-family:inherit;transition:all .15s;white-space:nowrap;}
    .mult-btn:hover{border-color:#0F6E56;color:#0F6E56;}
    .mult-btn.active{background:#0F6E56;color:#fff;border-color:#0F6E56;}
    .custom-g{position:relative;width:90px;flex-shrink:0;}
    .grams-wrap{position:relative;width:80px;flex-shrink:0;}
    .grams-input{width:100%;padding:12px 24px 12px 10px;border:1.5px solid #e8e8e8;border-radius:10px;font-size:14px;font-family:inherit;outline:none;appearance:none;}
    .grams-input:focus{border-color:#0F6E56;}
    .g-lbl{position:absolute;right:8px;top:50%;transform:translateY(-50%);font-size:12px;color:#aaa;font-weight:600;}
    .per100-note{font-size:12px;color:#9CA3AF;margin-bottom:10px;}
    .food-input{flex:1;padding:11px 14px;border:1.5px solid #e8e8e8;border-radius:10px;font-size:14px;outline:none;font-family:'Cairo',sans-serif;}
    .food-input:focus{border-color:#0F6E56;}
    .btn-analyze{padding:11px 18px;background:#0F6E56;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;white-space:nowrap;display:flex;align-items:center;gap:6px;}
    .btn-analyze:disabled{opacity:.6;cursor:not-allowed;}
    .mini-spinner{display:inline-block;width:13px;height:13px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;}
    @keyframes spin{to{transform:rotate(360deg);}}
    .error-msg{color:#D84040;font-size:13px;margin-top:8px;}
    .result-card{background:#fff;border-radius:14px;padding:18px;margin-bottom:16px;box-shadow:0 1px 8px rgba(0,0,0,.06);border-left:4px solid #0F6E56;}
    .result-header{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:700;color:#111;margin-bottom:14px;}
    .macros-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px;}
    .macro-box{border-radius:12px;padding:12px 8px;text-align:center;}
    .macro-box.calories{background:#FEF2F2;}.macro-box.protein{background:#E1F5EE;}.macro-box.carbs{background:#E6F1FB;}.macro-box.fat{background:#FEF9E7;}
    .macro-num{font-size:20px;font-weight:800;color:#111;}.macro-lbl{font-size:11px;color:#888;margin-top:2px;}
    .advice{display:flex;align-items:flex-start;gap:6px;background:#E6F1FB;border-radius:10px;padding:10px 12px;font-size:13px;color:#185FA5;margin-bottom:12px;line-height:1.5;}
    .btn-add{width:100%;padding:11px;background:#E1F5EE;color:#0F6E56;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;}
    .btn-add:hover{background:#C8EDDF;}
    .log-section{background:#fff;border-radius:14px;padding:18px;margin-bottom:16px;box-shadow:0 1px 8px rgba(0,0,0,.06);}
    .log-header{display:flex;justify-content:space-between;font-size:14px;font-weight:700;color:#111;margin-bottom:12px;}
    .total-cal{color:#0F6E56;font-size:13px;}
    .log-list{display:flex;flex-direction:column;gap:6px;margin-bottom:14px;}
    .log-item{display:flex;align-items:center;gap:10px;padding:8px 12px;background:#F7F8FA;border-radius:8px;}
    .log-food{flex:1;font-size:14px;color:#111;}.log-cal{font-size:13px;font-weight:600;color:#555;}
    .del-btn{background:none;border:none;color:#aaa;cursor:pointer;font-size:18px;line-height:1;}
    .del-btn:hover{color:#D84040;}
    .progress-section{margin-top:4px;}
    .progress-label{display:flex;justify-content:space-between;font-size:12px;color:#888;margin-bottom:6px;}
    .progress-bar{height:8px;background:#f0f0f0;border-radius:4px;overflow:hidden;}
    .progress-fill{height:100%;background:#0F6E56;border-radius:4px;transition:width .3s;max-width:100%;}
    .progress-fill.over{background:#D84040;}
    .suggestions{background:#fff;border-radius:14px;padding:16px;box-shadow:0 1px 8px rgba(0,0,0,.06);}
    .sugg-title{font-size:13px;font-weight:600;color:#888;margin-bottom:10px;}
    .sugg-chips{display:flex;flex-wrap:wrap;gap:8px;}
    .chip{background:#F7F8FA;border:1.5px solid #e8e8e8;border-radius:20px;padding:6px 14px;font-size:13px;color:#555;cursor:pointer;font-family:'Cairo',sans-serif;}
    .chip:hover{border-color:#0F6E56;color:#0F6E56;background:#E1F5EE;}
  `],
})
export class NutritionComponent {
  private ai = inject(AiService);

  searching = signal(false);
  result    = signal<FoodEntry | null>(null);
  error     = signal('');
  advice    = signal('');
  todayLog  = signal<FoodEntry[]>([]);
  foodInput  = '';
  multipliers = [
    { label: '100g (1×)',  g: 100  },
    { label: '200g (2×)',  g: 200  },
    { label: '300g (3×)',  g: 300  },
    { label: '150g',       g: 150  },
    { label: '250g',       g: 250  },
  ];
  gramsInput = 100;

  suggestions = ['Koshary', 'Ful medames', 'Grilled chicken', 'Rice', 'Salad', 'Eggs', 'Bread', 'Yogurt'];

  totalCalories(): number {
    return this.todayLog().reduce((sum: number, f: FoodEntry) => sum + f.calories, 0);
  }

  progressPct(): number {
    return Math.min(Math.round((this.totalCalories() / 2000) * 100), 150);
  }

  quickSearch(food: string): void {
    this.foodInput = food;
    this.analyze();
  }

  analyze(): void {
    const food = this.foodInput.trim();
    if (!food) return;
    const g = Number(this.gramsInput) || 100;
    this.searching.set(true);
    this.error.set('');
    this.result.set(null);

    // API returns values per 100g — we pass only the food name
    this.ai.getCalories(food).subscribe({
      next: (res: any) => {
        const d = res?.data ?? res;
        console.log('[Nutrition] API response:', d);

        // Extract per-100g calories from any response shape
        const per100 =
          d?.calories_per_100g ?? d?.calories ?? d?.kcal ?? d?.energy ??
          d?.caloriesPer100g   ?? d?.calorie  ?? d?.value ??
          (typeof d?.result === 'number' ? d.result : null) ??
          (typeof d === 'number' ? d : 200);

        const entry: FoodEntry = {
          food,
          grams:   g,
          per100g: Number(per100) || 200,
          calories: Math.round((Number(per100) || 200) * g / 100),
          protein: d?.protein  ?? d?.protein_g  ?? d?.proteinGrams,
          carbs:   d?.carbohydrates ?? d?.carbs ?? d?.carbsGrams,
          fat:     d?.fat      ?? d?.fat_g      ?? d?.fatGrams,
          fiber:   d?.fiber    ?? d?.fiber_g    ?? null,
        };
        this.result.set(entry);
        this.advice.set(d?.nutritionAdvice ?? d?.advice ?? '');
        this.searching.set(false);
      },
      error: (err: any) => {
        console.error('[Nutrition] API error:', err);
        this.error.set(err?.error?.message ?? 'Could not analyze this food. Please try again.');
        this.searching.set(false);
      },
    });
  }

  /** Scale per-100g macro to actual grams */
  scale(per100g: number, grams: number): number {
    return (per100g * grams) / 100;
  }

  addToLog(): void {
    const r = this.result();
    if (!r) return;
    this.todayLog.update((log: FoodEntry[]) => [...log, { ...r }]);
    this.result.set(null);
    this.foodInput  = '';
    this.gramsInput = 100;
  }

  removeItem(index: number): void {
    this.todayLog.update((log: FoodEntry[]) => log.filter((_: FoodEntry, i: number) => i !== index));
  }
}
