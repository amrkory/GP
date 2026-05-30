import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { FormsModule }    from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HttpClient }     from '@angular/common/http';
import { environment }    from '../../../../../environments/environment';

function toArr(r: any): any[] {
  if (Array.isArray(r))              return r;
  if (Array.isArray(r?.data?.items)) return r.data.items;
  if (Array.isArray(r?.data))        return r.data;
  if (Array.isArray(r?.items))       return r.items;
  return [];
}

@Component({
  selector: 'app-patient-vitals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="vwrap">

  <!-- Header with log button -->
  <div class="vhdr">
    <div>
      <h2>Vitals History</h2>
      <p class="sub" *ngIf="!loading()">{{ vitals().length }} record{{ vitals().length!==1?'s':'' }}</p>
    </div>
    <button class="btn-log" (click)="showAdd.set(!showAdd())">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
      Log Vitals
    </button>
  </div>

  <!-- Add vitals form -->
  <div class="add-form" *ngIf="showAdd()">
    <div class="af-title">Record New Vitals</div>
    <div class="af-grid">
      <div class="af-field">
        <label>Blood Pressure</label>
        <input [(ngModel)]="form.bloodPressure" class="inp" placeholder="e.g. 120/80" />
      </div>
      <div class="af-field">
        <label>Heart Rate <small>bpm</small></label>
        <input [(ngModel)]="form.heartRate" type="number" class="inp" placeholder="72" />
      </div>
      <div class="af-field">
        <label>Blood Sugar <small>mg/dL</small></label>
        <input [(ngModel)]="form.bloodSugarLevel" type="number" class="inp" placeholder="90" />
      </div>
      <div class="af-field">
        <label>Oxygen Level <small>%</small></label>
        <input [(ngModel)]="form.oxygenLevel" type="number" class="inp" placeholder="98" />
      </div>
      <div class="af-field">
        <label>Temperature <small>°C</small></label>
        <input [(ngModel)]="form.temperature" type="number" class="inp" placeholder="36.5" />
      </div>
      <div class="af-field">
        <label>Weight <small>kg</small></label>
        <input [(ngModel)]="form.weight" type="number" class="inp" placeholder="70" />
      </div>
    </div>
    <div class="err-box" *ngIf="addErr()">{{ addErr() }}</div>
    <div class="af-btns">
      <button class="btn-cancel" (click)="showAdd.set(false)">Cancel</button>
      <button class="btn-save" (click)="logVitals()" [disabled]="saving()">
        <span class="ring" *ngIf="saving()"></span>
        {{ saving() ? 'Saving…' : 'Save Vitals' }}
      </button>
    </div>
  </div>

  <!-- Loading -->
  <div class="loading" *ngIf="loading()"><div class="sp"></div></div>

  <!-- Latest vitals summary cards -->
  <div class="summary-grid" *ngIf="!loading() && vitals().length>0">
    <div class="sum-card" *ngIf="vitals()[0].bloodPressure">
      <div class="sum-ico" style="background:#FEF2F2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </div>
      <div class="sum-val">{{ vitals()[0].bloodPressure }}</div>
      <div class="sum-lbl">Blood Pressure<br><small>mmHg</small></div>
    </div>
    <div class="sum-card" *ngIf="vitals()[0].heartRate">
      <div class="sum-ico" style="background:#EFF6FF">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#185FA5" stroke-width="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      </div>
      <div class="sum-val">{{ vitals()[0].heartRate }}</div>
      <div class="sum-lbl">Heart Rate<br><small>bpm</small></div>
    </div>
    <div class="sum-card" *ngIf="vitals()[0].bloodSugarLevel">
      <div class="sum-ico" style="background:#FFFBEB">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d4a017" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <div class="sum-val">{{ vitals()[0].bloodSugarLevel }}</div>
      <div class="sum-lbl">Blood Sugar<br><small>mg/dL</small></div>
    </div>
    <div class="sum-card" *ngIf="vitals()[0].oxygenLevel">
      <div class="sum-ico" style="background:#ECFDF5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
        </svg>
      </div>
      <div class="sum-val">{{ vitals()[0].oxygenLevel }}%</div>
      <div class="sum-lbl">Oxygen<br><small>SpO2</small></div>
    </div>
    <div class="sum-card" *ngIf="vitals()[0].temperature">
      <div class="sum-ico" style="background:#FFF7ED">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c2410c" stroke-width="2">
          <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
        </svg>
      </div>
      <div class="sum-val">{{ vitals()[0].temperature }}°</div>
      <div class="sum-lbl">Temperature<br><small>Celsius</small></div>
    </div>
    <div class="sum-card" *ngIf="vitals()[0].weight">
      <div class="sum-ico" style="background:#F5F3FF">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B5BAD" stroke-width="2">
          <path d="M12 2a3 3 0 0 1 3 3c0 1.6-1 2.9-2.5 3.3L17 20H7l4.5-11.7C10 7.9 9 6.6 9 5a3 3 0 0 1 3-3z"/>
        </svg>
      </div>
      <div class="sum-val">{{ vitals()[0].weight }}</div>
      <div class="sum-lbl">Weight<br><small>kg</small></div>
    </div>
  </div>

  <!-- History list -->
  <div class="hist-title" *ngIf="vitals().length>1">All Readings</div>
  <div class="empty" *ngIf="!loading() && vitals().length===0">
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D0D5DD" stroke-width="1.5">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
    <p>No vitals recorded for this patient</p>
    <button class="btn-log-empty" (click)="showAdd.set(true)">+ Log first reading</button>
  </div>

  <div class="hist-list" *ngIf="!loading()">
    <div class="hist-row" *ngFor="let v of vitals()">
      <div class="hist-date">
        <div class="hd-day">{{ (v.recordedAt??v.createdAt) | date:'d MMM' }}</div>
        <div class="hd-year">{{ (v.recordedAt??v.createdAt) | date:'y' }}</div>
      </div>
      <div class="hist-vitals">
        <div class="hv" *ngIf="v.bloodPressure">
          <span class="hv-lbl">BP</span>
          <span class="hv-val">{{ v.bloodPressure }}</span>
        </div>
        <div class="hv" *ngIf="v.heartRate">
          <span class="hv-lbl">HR</span>
          <span class="hv-val">{{ v.heartRate }} <small>bpm</small></span>
        </div>
        <div class="hv" *ngIf="v.bloodSugarLevel">
          <span class="hv-lbl">BG</span>
          <span class="hv-val">{{ v.bloodSugarLevel }} <small>mg/dL</small></span>
        </div>
        <div class="hv" *ngIf="v.oxygenLevel">
          <span class="hv-lbl">O2</span>
          <span class="hv-val">{{ v.oxygenLevel }}%</span>
        </div>
        <div class="hv" *ngIf="v.temperature">
          <span class="hv-lbl">Temp</span>
          <span class="hv-val">{{ v.temperature }}°C</span>
        </div>
        <div class="hv" *ngIf="v.weight">
          <span class="hv-lbl">Wt</span>
          <span class="hv-val">{{ v.weight }} kg</span>
        </div>
      </div>
    </div>
  </div>

</div>
  `,
  styles: [`
    *{box-sizing:border-box;margin:0;padding:0;}
    .vwrap{font-family:'Cairo','Segoe UI',sans-serif;}
    .vhdr{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:14px;}
    h2{font-size:18px;font-weight:800;color:#111;}
    .sub{font-size:13px;color:#6B7280;margin-top:2px;}
    .btn-log{display:flex;align-items:center;gap:6px;padding:9px 16px;background:#2D4A8A;color:#fff;border:none;border-radius:11px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;flex-shrink:0;}
    /* Add form */
    .add-form{background:#fff;border-radius:16px;padding:18px;margin-bottom:14px;box-shadow:0 2px 12px rgba(0,0,0,.07);border:1px solid #E8ECF0;}
    .af-title{font-size:14px;font-weight:700;color:#111;margin-bottom:12px;}
    .af-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;}
    @media(max-width:600px){.af-grid{grid-template-columns:1fr 1fr;}}
    @media(max-width:400px){.af-grid{grid-template-columns:1fr;}}
    .af-field label{display:block;font-size:11px;font-weight:700;color:#374151;margin-bottom:5px;}
    .af-field label small{color:#9CA3AF;font-weight:400;}
    .inp{width:100%;padding:9px 12px;border:1.5px solid #E8ECF0;border-radius:10px;font-size:14px;font-family:inherit;outline:none;color:#111;}
    .inp:focus{border-color:#2D4A8A;box-shadow:0 0 0 3px rgba(45,74,138,.07);}
    .err-box{background:#FEF2F2;color:#D84040;border-radius:10px;padding:9px 12px;margin-top:10px;font-size:13px;}
    .af-btns{display:flex;gap:8px;margin-top:14px;}
    .btn-cancel{flex:1;padding:10px;border:1.5px solid #E8ECF0;background:#fff;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;color:#555;}
    .btn-save{flex:2;padding:10px;background:#2D4A8A;color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:6px;}
    .btn-save:disabled{opacity:.5;cursor:not-allowed;}
    .ring{width:13px;height:13px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:sp .6s linear infinite;}
    @keyframes sp{to{transform:rotate(360deg);}}
    .loading{display:flex;justify-content:center;padding:32px;}
    .sp{width:22px;height:22px;border:2.5px solid #f0f0f0;border-top-color:#2D4A8A;border-radius:50%;animation:sp .7s linear infinite;}
    /* Summary grid */
    .summary-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px;margin-bottom:16px;}
    .sum-card{background:#fff;border-radius:12px;padding:12px;text-align:center;box-shadow:0 1px 6px rgba(0,0,0,.05);border:1px solid #F0F2F5;}
    .sum-ico{width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;margin:0 auto 8px;}
    .sum-val{font-size:18px;font-weight:800;color:#111;line-height:1.1;}
    .sum-lbl{font-size:11px;color:#6B7280;margin-top:3px;line-height:1.3;}
    .sum-lbl small{color:#9CA3AF;}
    /* History */
    .hist-title{font-size:12px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;}
    .empty{display:flex;flex-direction:column;align-items:center;gap:8px;padding:40px;background:#fff;border-radius:14px;text-align:center;}
    .empty p{font-size:14px;color:#9CA3AF;}
    .btn-log-empty{padding:9px 18px;background:#2D4A8A;color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;margin-top:4px;}
    .hist-list{display:flex;flex-direction:column;gap:8px;}
    .hist-row{background:#fff;border-radius:12px;padding:12px 14px;display:flex;align-items:center;gap:14px;box-shadow:0 1px 5px rgba(0,0,0,.04);border:1px solid #F0F2F5;}
    .hist-date{text-align:center;flex-shrink:0;min-width:44px;}
    .hd-day{font-size:15px;font-weight:700;color:#111;}
    .hd-year{font-size:11px;color:#9CA3AF;}
    .hist-vitals{display:flex;flex-wrap:wrap;gap:8px;flex:1;}
    .hv{display:flex;align-items:center;gap:4px;background:#F8F9FC;border-radius:7px;padding:4px 9px;}
    .hv-lbl{font-size:10px;color:#9CA3AF;font-weight:600;}
    .hv-val{font-size:13px;font-weight:700;color:#111;}
    .hv-val small{font-size:10px;color:#9CA3AF;font-weight:400;}
  `]
})
export class PatientVitalsComponent implements OnInit {
  private http  = inject(HttpClient);
  private route = inject(ActivatedRoute);

  loading = signal(true);
  saving  = signal(false);
  showAdd = signal(false);
  addErr  = signal('');
  vitals  = signal<any[]>([]);
  pid     = '';

  form = { bloodPressure:'', heartRate:null, bloodSugarLevel:null, oxygenLevel:null, temperature:null, weight:null };

  ngOnInit(): void {
    this.pid = this.route.parent?.snapshot.paramMap.get('patientId') ?? '';
    this.load();
  }

  private load(): void {
    this.http.get<any>(`${environment.apiUrl}/Vital/patient/${this.pid}`, {
      params: { pageNumber:'1', pageSize:'50' }
    }).subscribe({
      next: (res:any) => {
        const items = toArr(res).sort((a:any,b:any) =>
          new Date(b.recordedAt??b.createdAt??0).getTime() -
          new Date(a.recordedAt??a.createdAt??0).getTime()
        );
        this.vitals.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  logVitals(): void {
    const body: any = {};
    if (this.form.bloodPressure)   body.bloodPressure    = this.form.bloodPressure;
    if (this.form.heartRate)       body.heartRate        = Number(this.form.heartRate);
    if (this.form.bloodSugarLevel) body.bloodSugarLevel  = Number(this.form.bloodSugarLevel);
    if (this.form.oxygenLevel)     body.oxygenLevel      = Number(this.form.oxygenLevel);
    if (this.form.temperature)     body.temperature      = Number(this.form.temperature);
    if (this.form.weight)          body.weight           = Number(this.form.weight);

    if (!Object.keys(body).length) { this.addErr.set('Enter at least one vital'); return; }
    this.saving.set(true);
    this.addErr.set('');

    // POST /api/Vital/patient/{patientId}
    this.http.post<any>(`${environment.apiUrl}/Vital/patient/${this.pid}`, body).subscribe({
      next: () => {
        this.saving.set(false);
        this.showAdd.set(false);
        this.form = { bloodPressure:'', heartRate:null, bloodSugarLevel:null, oxygenLevel:null, temperature:null, weight:null };
        this.load();
      },
      error: (e:any) => {
        this.saving.set(false);
        this.addErr.set(e?.error?.message ?? `Error ${e?.status}`);
      }
    });
  }
}
