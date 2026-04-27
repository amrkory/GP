import { Component, inject } from '@angular/core';
import { CommonModule }  from '@angular/common';
import { FormsModule }   from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient }    from '@angular/common/http';
import { signal }        from '@angular/core';
import { environment }   from '../../../../../environments/environment';

@Component({
  selector: 'app-record-visit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="top-bar">
        <button class="back-btn" (click)="router.back()"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg></button>
        <h1>Record Visit</h1><span></span>
      </div>
      <div class="form-card">
        <div class="field"><label>Visit Date *</label><input [(ngModel)]="visitDate" type="datetime-local" class="text-input" [max]="now()"/></div>
        <div class="field"><label>Duration (minutes)</label><input [(ngModel)]="duration" type="number" min="15" class="text-input" placeholder="e.g. 45"/></div>
        <div class="field"><label>Services Performed *</label><textarea [(ngModel)]="services" class="notes-input" rows="3" placeholder="Describe what was done..."></textarea></div>
        <div class="field"><label>Patient's Condition</label><textarea [(ngModel)]="condition" class="notes-input" rows="2" placeholder="Patient's condition and response..."></textarea></div>
        <div class="field"><label>Recommendations</label><textarea [(ngModel)]="recommendations" class="notes-input" rows="2" placeholder="Follow-up actions needed..."></textarea></div>
      </div>
      <div class="alert-success" *ngIf="saved()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        Visit recorded successfully!
      </div>
      <button class="btn-primary" (click)="save()" [disabled]="!visitDate||!services||saving()||saved()">
        <span class="mini-spinner" *ngIf="saving()"></span>
        {{ saving()?'Saving...':saved()?'Saved!':'Record Visit' }}
      </button>
    </div>
  `,
  styles: [`
    .page{padding:24px;max-width:640px;}@media(max-width:768px){.page{padding:16px;}}
    .top-bar{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;}
    .top-bar h1{font-size:18px;font-weight:700;color:#111;}
    .back-btn{background:none;border:none;cursor:pointer;color:#555;padding:6px;border-radius:8px;display:flex;}
    .form-card{background:#fff;border-radius:14px;padding:20px;margin-bottom:14px;box-shadow:0 1px 8px rgba(0,0,0,.05);}
    .field{margin-bottom:12px;}.field label{display:block;font-size:13px;font-weight:600;color:#111;margin-bottom:5px;}
    .text-input{width:100%;padding:10px 12px;border:1.5px solid #e8e8e8;border-radius:10px;font-size:14px;font-family:'Inter',sans-serif;outline:none;box-sizing:border-box;}
    .text-input:focus{border-color:#0F6E56;}
    .notes-input{width:100%;padding:10px 12px;border:1.5px solid #e8e8e8;border-radius:10px;font-size:14px;font-family:'Inter',sans-serif;outline:none;resize:none;box-sizing:border-box;}
    .alert-success{display:flex;align-items:center;gap:8px;background:#E1F5EE;color:#0F6E56;border-radius:10px;padding:12px 14px;margin-bottom:12px;font-size:14px;font-weight:600;}
    .btn-primary{width:100%;padding:14px;background:#0F6E56;color:#fff;border:none;border-radius:14px;font-size:16px;font-weight:700;cursor:pointer;font-family:'Inter',sans-serif;}
    .btn-primary:disabled{opacity:.55;cursor:not-allowed;}
    .mini-spinner{display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;vertical-align:middle;margin-right:6px;}
    @keyframes spin{to{transform:rotate(360deg);}}
  `]
})
export class RecordVisitComponent {
  readonly router = { back: () => window.history.back() };
  private http  = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private nav   = inject(Router);
  saving = signal(false); saved = signal(false);
  visitDate=''; duration: number|null=null; services=''; condition=''; recommendations='';
  now(){ return new Date().toISOString().slice(0,16); }
  save(){
    this.saving.set(true);
    this.http.post(`${environment.apiUrl}/home-service/visits`,
      { requestId: this.route.snapshot.paramMap.get('reqId'), visitDate: this.visitDate, duration: this.duration, services: this.services, condition: this.condition, recommendations: this.recommendations }
    ).subscribe({
      next:()=>{ this.saving.set(false); this.saved.set(true); setTimeout(()=>this.nav.navigate(['/provider/requests']),1500); },
      error:()=>this.saving.set(false)
    });
  }
}
