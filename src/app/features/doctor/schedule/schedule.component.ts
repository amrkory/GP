import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { FormsModule }    from '@angular/forms';
import { DoctorService }  from '../../../core/services/doctor.service';

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header"><h1>My Schedule</h1></div>

      <!-- Working hours -->
      <div class="section-card">
        <h3>Working Hours</h3>
        <div class="day-row" *ngFor="let d of days">
          <div class="day-toggle" (click)="d.enabled = !d.enabled">
            <div class="toggle-sw" [class.on]="d.enabled"><div class="toggle-knob"></div></div>
            <span class="day-name" [class.active]="d.enabled">{{ d.label }}</span>
          </div>
          <ng-container *ngIf="d.enabled">
            <input type="time" [(ngModel)]="d.start" class="time-input" />
            <span class="time-sep">to</span>
            <input type="time" [(ngModel)]="d.end" class="time-input" />
          </ng-container>
          <span class="day-off" *ngIf="!d.enabled">Day off</span>
        </div>
      </div>

      <!-- Consultation settings -->
      <div class="section-card">
        <h3>Consultation Settings</h3>
        <div class="field">
          <label>Appointment Duration</label>
          <select [(ngModel)]="duration" class="select-input">
            <option value="15">15 minutes</option>
            <option value="20">20 minutes</option>
            <option value="30">30 minutes</option>
            <option value="45">45 minutes</option>
            <option value="60">60 minutes</option>
          </select>
        </div>
        <div class="field">
          <label>Break Between Appointments</label>
          <select [(ngModel)]="breakTime" class="select-input">
            <option value="0">No break</option>
            <option value="5">5 minutes</option>
            <option value="10">10 minutes</option>
            <option value="15">15 minutes</option>
          </select>
        </div>
        <div class="field">
          <label>Max Appointments Per Day</label>
          <input type="number" [(ngModel)]="maxPerDay" min="1" max="30" class="text-input" />
        </div>
      </div>

      <!-- Video consultation -->
      <div class="section-card">
        <h3>Video Consultation</h3>
        <div class="toggle-row" (click)="videoEnabled = !videoEnabled">
          <div>
            <div class="toggle-title">Enable Video Appointments</div>
            <div class="toggle-sub">Allow patients to book video calls</div>
          </div>
          <div class="toggle-sw" [class.on]="videoEnabled"><div class="toggle-knob"></div></div>
        </div>
        <div class="field" *ngIf="videoEnabled" style="margin-top:12px">
          <label>Calendly / Meeting Link</label>
          <input [(ngModel)]="calendlyUrl" placeholder="https://calendly.com/your-link" class="text-input" />
        </div>
      </div>

      <div class="alert-success" *ngIf="saved()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        Schedule saved successfully!
      </div>

      <button class="btn-primary" (click)="save()" [disabled]="saving() || saved()">
        <span class="mini-spinner" *ngIf="saving()"></span>
        {{ saving() ? 'Saving...' : saved() ? 'Saved!' : 'Save Schedule' }}
      </button>
    </div>
  `,
  styles: [`
    .page { padding:24px; max-width:900px; }
    @media (max-width:768px) { .page { padding:16px; } }
    .page-header h1 { font-size:22px; font-weight:700; color:#111; margin-bottom:16px; }
    .section-card { background:#fff; border-radius:14px; padding:18px; margin-bottom:14px; box-shadow:0 1px 8px rgba(0,0,0,0.05); }
    .section-card h3 { font-size:15px; font-weight:700; color:#111; margin-bottom:14px; }
    .day-row { display:flex; align-items:center; gap:10px; padding:8px 0; border-bottom:1px solid #f5f5f5; flex-wrap:wrap; }
    .day-row:last-child { border-bottom:none; }
    .day-toggle { display:flex; align-items:center; gap:8px; cursor:pointer; }
    .day-name   { font-size:13px; color:#888; width:42px; }
    .day-name.active { color:#111; font-weight:600; }
    .day-off    { font-size:12px; color:#ccc; margin-left:auto; }
    .toggle-sw  { width:36px; height:20px; background:#e0e0e0; border-radius:10px; position:relative; transition:background .2s; cursor:pointer; }
    .toggle-sw.on { background:#2D4A8A; }
    .toggle-knob { position:absolute; top:2px; left:2px; width:16px; height:16px; border-radius:50%; background:#fff; transition:transform .2s; }
    .toggle-sw.on .toggle-knob { transform:translateX(16px); }
    .time-input  { padding:6px 10px; border:1.5px solid #e8e8e8; border-radius:8px; font-size:13px; font-family:'Cairo',sans-serif; outline:none; }
    .time-input:focus { border-color:#2D4A8A; }
    .time-sep   { font-size:12px; color:#888; }
    .field { margin-bottom:12px; }
    .field label { display:block; font-size:13px; font-weight:600; color:#111; margin-bottom:5px; }
    .text-input  { width:100%; padding:10px 12px; border:1.5px solid #e8e8e8; border-radius:10px; font-size:14px; font-family:'Cairo',sans-serif; outline:none; box-sizing:border-box; }
    .select-input { width:100%; padding:10px 12px; border:1.5px solid #e8e8e8; border-radius:10px; font-size:14px; font-family:'Cairo',sans-serif; outline:none; appearance:none; background:#fff; box-sizing:border-box; }
    .toggle-row { display:flex; align-items:center; justify-content:space-between; cursor:pointer; }
    .toggle-title { font-size:14px; font-weight:600; color:#111; }
    .toggle-sub   { font-size:12px; color:#888; margin-top:2px; }
    .alert-success { display:flex; align-items:center; gap:8px; background:#E1F5EE; color:#0F6E56; border-radius:10px; padding:12px 14px; margin-bottom:12px; font-size:14px; font-weight:600; }
    .btn-primary { width:100%; padding:14px; background:#2D4A8A; color:#fff; border:none; border-radius:14px; font-size:16px; font-weight:700; cursor:pointer; font-family:'Cairo',sans-serif; }
    .btn-primary:disabled { opacity:0.55; cursor:not-allowed; }
    .mini-spinner { display:inline-block; width:14px; height:14px; border:2px solid rgba(255,255,255,0.4); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; vertical-align:middle; margin-right:6px; }
    @keyframes spin { to { transform:rotate(360deg); } }
  `],
})
export class ScheduleComponent implements OnInit {
  private svc = inject(DoctorService);
  saving = signal(false); saved = signal(false);
  duration = '30'; breakTime = '5'; maxPerDay = 15;
  videoEnabled = false; calendlyUrl = '';
  days = [
    { key:'Mon', label:'Mon', enabled:true,  start:'09:00', end:'17:00' },
    { key:'Tue', label:'Tue', enabled:true,  start:'09:00', end:'17:00' },
    { key:'Wed', label:'Wed', enabled:true,  start:'09:00', end:'17:00' },
    { key:'Thu', label:'Thu', enabled:true,  start:'09:00', end:'17:00' },
    { key:'Fri', label:'Fri', enabled:true,  start:'09:00', end:'14:00' },
    { key:'Sat', label:'Sat', enabled:false, start:'10:00', end:'14:00' },
    { key:'Sun', label:'Sun', enabled:false, start:'10:00', end:'14:00' },
  ];
  ngOnInit(): void {
    this.svc.getProfile().subscribe((res: any) => {
      if (res.data.calendlyEventUrl) { this.videoEnabled = true; this.calendlyUrl = res.data.calendlyEventUrl; }
    });
  }
  save(): void {
    this.saving.set(true);
    this.svc.updateSchedule({ days: this.days, duration: this.duration, breakTime: this.breakTime, maxPerDay: this.maxPerDay, calendlyEventUrl: this.videoEnabled ? this.calendlyUrl : null })
      .subscribe({ next: () => { this.saving.set(false); this.saved.set(true); }, error: () => this.saving.set(false) });
  }
}
