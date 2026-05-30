import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink }   from '@angular/router';
import { HttpClient }   from '@angular/common/http';
import { AuthService }  from '../../../core/services/auth.service';
import { environment }  from '../../../../environments/environment';

/** Extract array from any backend response shape */
function toArr(res: any): any[] {
  if (Array.isArray(res))                  return res;
  if (Array.isArray(res?.data?.items))     return res.data.items;
  if (Array.isArray(res?.data))            return res.data;
  if (Array.isArray(res?.items))           return res.items;
  if (Array.isArray(res?.result?.items))   return res.result.items;
  if (Array.isArray(res?.result))          return res.result;
  return [];
}

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<div class="dash">

  <!-- ── Page header ──────────────────────────────────────────────────── -->
  <div class="dash-header">
    <div>
      <h1 class="dash-title">Good {{ greeting() }}, {{ firstName() }}</h1>
      <p class="dash-sub">{{ today | date:'EEEE, MMMM d, y' }}</p>
    </div>
    <a routerLink="/patient/appointments/book" class="btn-book">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
      Book Appointment
    </a>
  </div>

  <!-- ── KPI cards ─────────────────────────────────────────────────────── -->
  <div class="kpi-grid">

    <div class="kpi-card">
      <div class="kpi-icon" style="background:#EEF4FF">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#185FA5" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </div>
      <div class="kpi-body">
        <div class="kpi-value">
          <span *ngIf="!loadingAppts()">{{ upcoming().length }}</span>
          <span class="kpi-skeleton" *ngIf="loadingAppts()"></span>
        </div>
        <div class="kpi-label">Upcoming Appointments</div>
      </div>
      <a routerLink="/patient/appointments" class="kpi-arrow">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </a>
    </div>

    <div class="kpi-card">
      <div class="kpi-icon" style="background:#ECFDF5">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
        </svg>
      </div>
      <div class="kpi-body">
        <div class="kpi-value">
          <span *ngIf="!loadingMeds()">{{ activeMeds().length }}</span>
          <span class="kpi-skeleton" *ngIf="loadingMeds()"></span>
        </div>
        <div class="kpi-label">Active Medications</div>
      </div>
      <a routerLink="/patient/prescriptions" class="kpi-arrow">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </a>
    </div>

    <div class="kpi-card">
      <div class="kpi-icon" style="background:#FEF2F2">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      </div>
      <div class="kpi-body">
        <div class="kpi-value">
          <span *ngIf="!loadingTasks()">{{ pendingTasks().length }}</span>
          <span class="kpi-skeleton" *ngIf="loadingTasks()"></span>
        </div>
        <div class="kpi-label">Pending Tasks</div>
      </div>
      <a routerLink="/patient/checklist" class="kpi-arrow">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </a>
    </div>



  </div>

  <!-- ── Two-column body ───────────────────────────────────────────────── -->
  <div class="dash-body">

    <!-- ══ LEFT COLUMN ════════════════════════════════════════════════════ -->
    <div class="col">

      <!-- Upcoming Appointments -->
      <div class="card">
        <div class="card-hdr">
          <div class="card-hdr-left">
            <div class="card-ico-wrap" style="background:#EEF4FF">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#185FA5" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <h2>Upcoming Appointments</h2>
          </div>
          <a routerLink="/patient/appointments" class="see-all">
            See all
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </a>
        </div>

        <!-- Loading skeletons -->
        <div *ngIf="loadingAppts()" class="skeleton-list">
          <div class="skel-row" *ngFor="let i of [1,2,3]">
            <div class="skel-date"></div>
            <div class="skel-lines"><div class="skel-line w70"></div><div class="skel-line w45 mt4"></div></div>
            <div class="skel-badge"></div>
          </div>
        </div>

        <!-- Empty -->
        <div class="empty-block" *ngIf="!loadingAppts() && upcoming().length === 0">
          <div class="empty-ico-wrap">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <p>No appointments yet</p>
          <a routerLink="/patient/appointments/book" class="empty-action">Book an appointment</a>
        </div>

        <!-- Appointments list — ALL shown, no slice -->
        <div class="appt-list" *ngIf="!loadingAppts() && upcoming().length > 0">
          <div class="appt-row" *ngFor="let a of upcoming()">
            <div class="appt-date-col">
              <span class="appt-d">{{ (a.appointmentTime ?? a.scheduledAt) | date:'d' }}</span>
              <span class="appt-m">{{ (a.appointmentTime ?? a.scheduledAt) | date:'MMM' }}</span>
            </div>
            <div class="appt-sep"></div>
            <div class="appt-info">
              <p class="appt-doc">Dr. {{ a.doctorName ?? a.doctor?.firstName + ' ' + a.doctor?.lastName ?? '—' }}</p>
              <p class="appt-meta">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                {{ (a.appointmentTime ?? a.scheduledAt) | date:'h:mm a' }}
                <span class="dot" *ngIf="a.specialtyName">·</span>
                <span *ngIf="a.specialtyName">{{ a.specialtyName }}</span>
              </p>
              <p class="appt-notes" *ngIf="a.notes">{{ a.notes }}</p>
            </div>
            <div class="appt-right">
              <span class="appt-badge" [class]="sCls(a.status)">{{ sLabel(a.status) }}</span>
              <span class="appt-type-chip" *ngIf="a.type">{{ a.type }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Active Medications -->
      <div class="card">
        <div class="card-hdr">
          <div class="card-hdr-left">
            <div class="card-ico-wrap" style="background:#ECFDF5">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
              </svg>
            </div>
            <h2>Active Medications</h2>
            <span class="count-badge green" *ngIf="activeMeds().length > 0">{{ activeMeds().length }}</span>
          </div>
          <a routerLink="/patient/prescriptions" class="see-all">
            See all
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </a>
        </div>

        <div *ngIf="loadingMeds()" class="skeleton-list">
          <div class="skel-row" *ngFor="let i of [1,2,3]">
            <div class="skel-med-ico"></div>
            <div class="skel-lines"><div class="skel-line w60"></div><div class="skel-line w40 mt4"></div></div>
            <div class="skel-badge"></div>
          </div>
        </div>

        <div class="empty-block" *ngIf="!loadingMeds() && activeMeds().length === 0">
          <div class="empty-ico-wrap">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="1.5">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
            </svg>
          </div>
          <p>No active medications</p>
          <p class="empty-sub">Your doctor will prescribe medications here</p>
        </div>

        <!-- ALL medications shown, no slice -->
        <div class="med-list" *ngIf="!loadingMeds() && activeMeds().length > 0">
          <div class="med-row" *ngFor="let m of activeMeds()">
            <div class="med-ico-box">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
              </svg>
            </div>
            <div class="med-info">
              <p class="med-name">{{ m.name ?? m.medicationName }}</p>
              <p class="med-sub">
                {{ m.dosage }}
                <span class="dot" *ngIf="m.frequency">·</span>
                {{ m.frequency }}
                <span class="dot" *ngIf="m.duration">·</span>
                <span *ngIf="m.duration">{{ m.duration }}</span>
              </p>
              <p class="med-instr" *ngIf="m.instructions">{{ m.instructions }}</p>
              <p class="med-dates" *ngIf="m.startDate || m.endDate">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span *ngIf="m.startDate">{{ m.startDate | date:'MMM d' }}</span>
                <span *ngIf="m.startDate && m.endDate"> → </span>
                <span *ngIf="m.endDate">{{ m.endDate | date:'MMM d, y' }}</span>
              </p>
            </div>
            <span class="med-badge">Active</span>
          </div>
        </div>
      </div>

    </div>

    <!-- ══ RIGHT COLUMN ═══════════════════════════════════════════════════ -->
    <div class="col">

      <!-- Latest Vitals -->
      <div class="card">
        <div class="card-hdr">
          <div class="card-hdr-left">
            <div class="card-ico-wrap" style="background:#FEF2F2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <h2>Latest Vitals</h2>
          </div>
          <a routerLink="/patient/vitals" class="see-all">
            See all
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </a>
        </div>

        <div *ngIf="loadingVitals()" class="vitals-skel">
          <div class="vs-tile" *ngFor="let i of [1,2,3,4,5,6]">
            <div class="skel-vico"></div>
            <div class="skel-lines"><div class="skel-line w50"></div><div class="skel-line w35 mt4"></div></div>
          </div>
        </div>

        <div class="empty-block" *ngIf="!loadingVitals() && !latestVital()">
          <div class="empty-ico-wrap">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="1.5">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <p>No vitals recorded yet</p>
          <a routerLink="/patient/vitals/add" class="empty-action">Log first reading</a>
        </div>

        <ng-container *ngIf="!loadingVitals() && latestVital()">
          <!-- Timestamp -->
          <div class="vitals-ts">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            Last recorded: {{ (latestVital().recordedAt ?? latestVital().createdAt) | date:'MMM d, y · h:mm a' }}
          </div>

          <!-- Vitals tiles — show all available readings -->
          <div class="vitals-grid">

            <div class="vital-tile" *ngIf="latestVital().bloodPressure">
              <div class="vt-ico" style="background:#FEF2F2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </div>
              <div class="vt-body">
                <div class="vt-value">{{ latestVital().bloodPressure }}</div>
                <div class="vt-label">Blood Pressure</div>
                <div class="vt-unit">mmHg</div>
              </div>
              <div class="vt-status" [class]="bpStatus(latestVital().bloodPressure).cls">
                {{ bpStatus(latestVital().bloodPressure).label }}
              </div>
            </div>

            <div class="vital-tile" *ngIf="latestVital().heartRate">
              <div class="vt-ico" style="background:#FFF1F2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e11d48" stroke-width="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              </div>
              <div class="vt-body">
                <div class="vt-value">{{ latestVital().heartRate }}</div>
                <div class="vt-label">Heart Rate</div>
                <div class="vt-unit">bpm</div>
              </div>
              <div class="vt-status" [class]="hrStatus(latestVital().heartRate).cls">
                {{ hrStatus(latestVital().heartRate).label }}
              </div>
            </div>

            <div class="vital-tile" *ngIf="latestVital().bloodSugarLevel">
              <div class="vt-ico" style="background:#FFFBEB">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d4a017" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <div class="vt-body">
                <div class="vt-value">{{ latestVital().bloodSugarLevel }}</div>
                <div class="vt-label">Blood Sugar</div>
                <div class="vt-unit">mg/dL</div>
              </div>
              <div class="vt-status" [class]="bsStatus(latestVital().bloodSugarLevel).cls">
                {{ bsStatus(latestVital().bloodSugarLevel).label }}
              </div>
            </div>

            <div class="vital-tile" *ngIf="latestVital().oxygenLevel">
              <div class="vt-ico" style="background:#EFF6FF">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#185FA5" stroke-width="2">
                  <path d="M12 2a10 10 0 0 1 10 10c0 4.19-2.57 7.8-6.25 9.33"/>
                  <path d="M12 2a10 10 0 0 0-10 10c0 4.19 2.57 7.8 6.25 9.33"/>
                  <line x1="12" y1="6" x2="12" y2="12"/>
                </svg>
              </div>
              <div class="vt-body">
                <div class="vt-value">{{ latestVital().oxygenLevel }}</div>
                <div class="vt-label">Oxygen Level</div>
                <div class="vt-unit">%</div>
              </div>
              <div class="vt-status" [class]="o2Status(latestVital().oxygenLevel).cls">
                {{ o2Status(latestVital().oxygenLevel).label }}
              </div>
            </div>

            <div class="vital-tile" *ngIf="latestVital().temperature">
              <div class="vt-ico" style="background:#ECFDF5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2">
                  <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/>
                </svg>
              </div>
              <div class="vt-body">
                <div class="vt-value">{{ latestVital().temperature }}</div>
                <div class="vt-label">Temperature</div>
                <div class="vt-unit">°C</div>
              </div>
              <div class="vt-status" [class]="tempStatus(latestVital().temperature).cls">
                {{ tempStatus(latestVital().temperature).label }}
              </div>
            </div>

            <div class="vital-tile" *ngIf="latestVital().weight">
              <div class="vt-ico" style="background:#F3E8FF">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" stroke-width="2">
                  <circle cx="12" cy="5" r="3"/>
                  <path d="M6.5 8a2 2 0 0 0-1.905 1.46L2.1 17.5A2 2 0 0 0 4 20h16a2 2 0 0 0 1.9-2.5l-2.495-8.04A2 2 0 0 0 17.5 8Z"/>
                </svg>
              </div>
              <div class="vt-body">
                <div class="vt-value">{{ latestVital().weight }}</div>
                <div class="vt-label">Weight</div>
                <div class="vt-unit">kg</div>
              </div>
              <div class="vt-status vt-ok">Recorded</div>
            </div>

          </div>

          <a routerLink="/patient/vitals/add" class="btn-add-vitals">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add New Reading
          </a>
        </ng-container>
      </div>

      <!-- Quick Actions -->
      <div class="card">
        <div class="card-hdr">
          <div class="card-hdr-left">
            <div class="card-ico-wrap" style="background:#F4F6FA">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
            </div>
            <h2>Quick Actions</h2>
          </div>
        </div>
        <div class="qa-grid">
          <a routerLink="/patient/appointments/book" class="qa-item">
            <div class="qa-ico" style="background:#EEF4FF">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#185FA5" stroke-width="2">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
                <line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/>
              </svg>
            </div>
            <span>Book Appointment</span>
          </a>
          <a routerLink="/patient/vitals/add" class="qa-item">
            <div class="qa-ico" style="background:#FEF2F2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D84040" stroke-width="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <span>Log Vitals</span>
          </a>
          <a routerLink="/patient/records" class="qa-item">
            <div class="qa-ico" style="background:#F3E8FF">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <span>Medical Records</span>
          </a>
          <a routerLink="/patient/checklist" class="qa-item">
            <div class="qa-ico" style="background:#ECFDF5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="2">
                <polyline points="9 11 12 14 22 4"/>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
            </div>
            <span>My Tasks</span>
          </a>
          <a routerLink="/patient/messages" class="qa-item">
            <div class="qa-ico" style="background:#FFF7ED">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c2410c" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <span>Messages</span>
          </a>
          <a routerLink="/patient/ai-assistant" class="qa-item">
            <div class="qa-ico" style="background:#EFF6FF">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#185FA5" stroke-width="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
              </svg>
            </div>
            <span>AI Assistant</span>
          </a>
        </div>
      </div>

    </div>
  </div>
</div>
  `,
  styles: [`
    *{box-sizing:border-box;margin:0;padding:0;}
    .dash{padding:28px;max-width:1200px;font-family:'Cairo','Segoe UI',sans-serif;}
    @media(max-width:768px){.dash{padding:16px;}}

    /* Header */
    .dash-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;gap:12px;flex-wrap:wrap;}
    .dash-title{font-size:22px;font-weight:800;color:#111;letter-spacing:-.3px;}
    .dash-sub{font-size:13px;color:#6B7280;margin-top:3px;}
    .btn-book{display:flex;align-items:center;gap:7px;padding:10px 18px;background:#2D4A8A;color:#fff;border-radius:12px;text-decoration:none;font-size:13px;font-weight:700;font-family:inherit;white-space:nowrap;}
    .btn-book:hover{background:#1E3A6E;}

    /* KPI */
    .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:24px;}
    @media(max-width:900px){.kpi-grid{grid-template-columns:repeat(2,1fr);}}
    @media(max-width:480px){.kpi-grid{grid-template-columns:1fr 1fr;gap:10px;}}
    .kpi-card{background:#fff;border-radius:16px;padding:16px;display:flex;align-items:center;gap:12px;box-shadow:0 1px 4px rgba(0,0,0,.06);border:1px solid #F0F2F5;}
    .kpi-icon{width:44px;height:44px;border-radius:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .kpi-body{flex:1;min-width:0;}
    .kpi-value{font-size:22px;font-weight:800;color:#111;line-height:1;display:flex;align-items:baseline;gap:4px;}
    .kpi-unit{font-size:11px;font-weight:500;color:#9CA3AF;}
    .kpi-label{font-size:11px;color:#6B7280;margin-top:3px;}
    .kpi-skeleton{display:inline-block;width:40px;height:22px;background:#F0F2F5;border-radius:6px;animation:pulse 1.4s ease-in-out infinite;}
    .kpi-arrow{width:26px;height:26px;background:#F4F6FA;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#9CA3AF;text-decoration:none;flex-shrink:0;}
    .kpi-arrow:hover{background:#E8ECF0;color:#111;}

    /* Body */
    .dash-body{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
    @media(max-width:960px){.dash-body{grid-template-columns:1fr;}}
    .col{display:flex;flex-direction:column;gap:16px;}

    /* Card */
    .card{background:#fff;border-radius:18px;padding:20px;box-shadow:0 1px 4px rgba(0,0,0,.06);border:1px solid #F0F2F5;}
    .card-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;}
    .card-hdr-left{display:flex;align-items:center;gap:9px;}
    .card-ico-wrap{width:30px;height:30px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .card-hdr h2{font-size:14px;font-weight:700;color:#111;}
    .count-badge{font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px;}
    .count-badge.blue{background:#EEF4FF;color:#185FA5;}
    .count-badge.green{background:#ECFDF5;color:#0F6E56;}
    .see-all{display:flex;align-items:center;gap:3px;font-size:12px;font-weight:600;color:#2D4A8A;text-decoration:none;}
    .see-all:hover{text-decoration:underline;}

    /* Skeletons */
    @keyframes pulse{0%,100%{opacity:1;}50%{opacity:.5;}}
    .skeleton-list{display:flex;flex-direction:column;gap:10px;}
    .skel-row{display:flex;align-items:center;gap:12px;padding:8px 0;}
    .skel-date{width:38px;height:44px;background:#F0F2F5;border-radius:10px;flex-shrink:0;animation:pulse 1.4s ease-in-out infinite;}
    .skel-lines{flex:1;display:flex;flex-direction:column;gap:6px;}
    .skel-line{height:11px;background:#F0F2F5;border-radius:6px;animation:pulse 1.4s ease-in-out infinite;}
    .skel-line.w70{width:70%;}.skel-line.w60{width:60%;}.skel-line.w50{width:50%;}.skel-line.w45{width:45%;}.skel-line.w40{width:40%;}.skel-line.w35{width:35%;}
    .mt4{margin-top:4px;}
    .skel-badge{width:56px;height:22px;background:#F0F2F5;border-radius:12px;flex-shrink:0;animation:pulse 1.4s ease-in-out infinite;}
    .skel-med-ico{width:36px;height:36px;border-radius:10px;background:#F0F2F5;flex-shrink:0;animation:pulse 1.4s ease-in-out infinite;}
    .vitals-skel{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
    .vs-tile{display:flex;align-items:center;gap:8px;padding:10px;background:#F8F9FC;border-radius:12px;}
    .skel-vico{width:30px;height:30px;border-radius:9px;background:#E8ECF0;flex-shrink:0;animation:pulse 1.4s ease-in-out infinite;}

    /* Empty */
    .empty-block{display:flex;flex-direction:column;align-items:center;gap:8px;padding:24px 0;text-align:center;}
    .empty-ico-wrap{width:52px;height:52px;background:#F4F6FA;border-radius:50%;display:flex;align-items:center;justify-content:center;}
    .empty-block p{font-size:13px;color:#9CA3AF;}
    .empty-sub{font-size:12px;color:#C9CDD4 !important;}
    .empty-action{font-size:13px;font-weight:600;color:#2D4A8A;text-decoration:none;margin-top:2px;}
    .empty-action:hover{text-decoration:underline;}

    /* Appointments */
    .appt-list{display:flex;flex-direction:column;gap:8px;}
    .appt-row{display:flex;align-items:flex-start;gap:10px;padding:11px 12px;background:#F8F9FC;border-radius:13px;border:1px solid #F0F2F5;}
    .appt-date-col{text-align:center;min-width:34px;flex-shrink:0;padding-top:1px;}
    .appt-d{display:block;font-size:18px;font-weight:800;color:#2D4A8A;line-height:1;}
    .appt-m{display:block;font-size:10px;color:#6B7280;text-transform:uppercase;margin-top:1px;}
    .appt-sep{width:1px;background:#E8ECF0;align-self:stretch;flex-shrink:0;}
    .appt-info{flex:1;min-width:0;padding-left:2px;}
    .appt-doc{font-size:14px;font-weight:600;color:#111;margin-bottom:3px;}
    .appt-meta{display:flex;align-items:center;gap:4px;font-size:12px;color:#6B7280;flex-wrap:wrap;}
    .appt-notes{font-size:11px;color:#9CA3AF;margin-top:3px;font-style:italic;}
    .dot{color:#D0D5DD;}
    .appt-right{display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0;}
    .appt-badge{font-size:10px;font-weight:700;padding:3px 8px;border-radius:20px;white-space:nowrap;}
    .appt-badge.pending{background:#FFFBEB;color:#d4a017;}
    .appt-badge.confirmed{background:#ECFDF5;color:#0F6E56;}
    .appt-badge.cancelled{background:#FEF2F2;color:#D84040;}
    .appt-badge.completed{background:#F4F6FA;color:#6B7280;}
    .appt-badge.rescheduled{background:#F3E8FF;color:#7C3AED;}
    .appt-type-chip{font-size:10px;color:#9CA3AF;background:#F4F6FA;padding:2px 7px;border-radius:8px;}

    /* Medications */
    .med-list{display:flex;flex-direction:column;gap:8px;}
    .med-row{display:flex;align-items:flex-start;gap:10px;padding:11px 12px;background:#F8F9FC;border-radius:13px;border:1px solid #F0F2F5;}
    .med-ico-box{width:36px;height:36px;background:#ECFDF5;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;}
    .med-info{flex:1;min-width:0;}
    .med-name{font-size:14px;font-weight:600;color:#111;margin-bottom:3px;}
    .med-sub{font-size:12px;color:#6B7280;}
    .med-instr{font-size:11px;color:#9CA3AF;font-style:italic;margin-top:3px;}
    .med-dates{display:flex;align-items:center;gap:4px;font-size:11px;color:#9CA3AF;margin-top:3px;}
    .med-badge{font-size:10px;font-weight:700;padding:3px 8px;border-radius:20px;background:#ECFDF5;color:#0F6E56;flex-shrink:0;white-space:nowrap;margin-top:1px;}

    /* Vitals */
    .vitals-ts{display:flex;align-items:center;gap:5px;font-size:11px;color:#9CA3AF;margin-bottom:12px;}
    .vitals-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
    @media(max-width:480px){.vitals-grid{grid-template-columns:1fr;}}
    .vital-tile{display:flex;align-items:center;gap:10px;padding:12px;background:#F8F9FC;border-radius:13px;border:1px solid #F0F2F5;}
    .vt-ico{width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .vt-body{flex:1;min-width:0;}
    .vt-value{font-size:17px;font-weight:800;color:#111;line-height:1;}
    .vt-label{font-size:11px;color:#6B7280;margin-top:2px;}
    .vt-unit{font-size:10px;color:#9CA3AF;}
    .vt-status{font-size:10px;font-weight:700;padding:2px 7px;border-radius:10px;white-space:nowrap;flex-shrink:0;}
    .vt-ok{background:#ECFDF5;color:#0F6E56;}
    .vt-warn{background:#FFFBEB;color:#d4a017;}
    .vt-bad{background:#FEF2F2;color:#D84040;}
    .btn-add-vitals{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;margin-top:12px;padding:10px;background:#F4F6FA;border-radius:12px;text-decoration:none;font-size:13px;font-weight:600;color:#374151;border:1px dashed #D1D5DB;}
    .btn-add-vitals:hover{background:#EEF2FF;border-color:#93C5FD;color:#2D4A8A;}

    /* Quick actions */
    .qa-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
    @media(max-width:1100px){.qa-grid{grid-template-columns:repeat(2,1fr);}}
    .qa-item{display:flex;flex-direction:column;align-items:center;gap:7px;padding:14px 10px;background:#F8F9FC;border-radius:14px;text-decoration:none;color:#374151;font-size:12px;font-weight:600;text-align:center;border:1px solid #F0F2F5;transition:all .15s;}
    .qa-item:hover{background:#EEF2FF;border-color:#c7d2fe;color:#2D4A8A;transform:translateY(-1px);}
    .qa-ico{width:38px;height:38px;border-radius:11px;display:flex;align-items:center;justify-content:center;}
  `]
})
export class PatientDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  loadingAppts  = signal(true);
  loadingMeds   = signal(true);
  loadingVitals = signal(true);
  loadingTasks  = signal(true);

  upcoming     = signal<any[]>([]);
  allApptCount = signal(0);
  activeMeds   = signal<any[]>([]);
  latestVital  = signal<any>(null);
  pendingTasks = signal<any[]>([]);

  today = new Date();

  firstName(): string {
    const u = this.auth.currentUser() as any;
    return u?.given_name ?? u?.firstName ?? 'there';
  }
  greeting(): string {
    const h = new Date().getHours();
    return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
  }
  latestBP(): string { return this.latestVital()?.bloodPressure ?? ''; }

  private statusMap: Record<number,string> = {0:'pending',1:'confirmed',2:'completed',3:'cancelled',4:'rescheduled'};
  sCls(s: any): string {
    if (typeof s === 'number') return this.statusMap[s] ?? 'pending';
    const sl = (s ?? '').toLowerCase();
    if (sl.includes('confirm'))   return 'confirmed';
    if (sl.includes('cancel'))    return 'cancelled';
    if (sl.includes('complet'))   return 'completed';
    if (sl.includes('reschedul')) return 'rescheduled';
    return 'pending';
  }
  sLabel(s: any): string {
    const k = this.sCls(s);
    return k.charAt(0).toUpperCase() + k.slice(1);
  }

  /* Vital status helpers */
  bpStatus(bp: string): {cls:string;label:string} {
    const sys = parseInt((bp ?? '').split('/')[0]) || 0;
    if (sys < 90)   return {cls:'vt-bad',  label:'Low'};
    if (sys <= 120) return {cls:'vt-ok',   label:'Normal'};
    if (sys <= 140) return {cls:'vt-warn', label:'Elevated'};
    return              {cls:'vt-bad',  label:'High'};
  }
  hrStatus(hr: number): {cls:string;label:string} {
    if (hr < 60)  return {cls:'vt-warn', label:'Low'};
    if (hr <= 100) return {cls:'vt-ok',  label:'Normal'};
    return             {cls:'vt-bad',  label:'High'};
  }
  bsStatus(bs: number): {cls:string;label:string} {
    if (bs < 70)   return {cls:'vt-bad',  label:'Low'};
    if (bs <= 100) return {cls:'vt-ok',   label:'Normal'};
    if (bs <= 125) return {cls:'vt-warn', label:'Pre-diabetic'};
    return              {cls:'vt-bad',  label:'High'};
  }
  o2Status(o2: number): {cls:string;label:string} {
    if (o2 >= 95) return {cls:'vt-ok',   label:'Normal'};
    if (o2 >= 90) return {cls:'vt-warn', label:'Low'};
    return             {cls:'vt-bad',  label:'Critical'};
  }
  tempStatus(t: number): {cls:string;label:string} {
    if (t < 36)     return {cls:'vt-warn', label:'Low'};
    if (t <= 37.4)  return {cls:'vt-ok',   label:'Normal'};
    if (t <= 38.4)  return {cls:'vt-warn', label:'Mild fever'};
    return               {cls:'vt-bad',  label:'Fever'};
  }

  ngOnInit(): void {
    /* ── Appointments ──────────────────────────────────────────────────── */
    this.http.get<any>(`${environment.apiUrl}/Appointment/Patient`, {
      params: { pageNumber: '1', pageSize: '100' }
    }).subscribe({
      next: (res: any) => {
        const all = toArr(res);
        // Show upcoming: future only, sorted ascending, status as number or string
        const now = Date.now();
        const stStr = (s: any): string => {
          if (typeof s === 'number') {
            return ({0:'pending',1:'confirmed',2:'completed',3:'cancelled',4:'rescheduled'} as any)[s] ?? 'pending';
          }
          return (s ?? '').toString().toLowerCase();
        };
        const upList = all
          .filter((a: any) => {
            const t = new Date(a.appointmentTime ?? a.scheduledAt ?? 0).getTime();
            const st = stStr(a.status);
            return t > now && st !== 'cancelled' && st !== 'completed';
          })
          .sort((a: any, b: any) =>
            new Date(a.appointmentTime ?? a.scheduledAt ?? 0).getTime() -
            new Date(b.appointmentTime ?? b.scheduledAt ?? 0).getTime()
          );
        this.upcoming.set(upList);
        this.allApptCount.set(all.length);
        this.loadingAppts.set(false);
      },
      error: () => this.loadingAppts.set(false)
    });

    /* ── Medications ───────────────────────────────────────────────────── */
    this.http.get<any>(`${environment.apiUrl}/Medication/my`, {
      params: { isActive: 'true', pageNumber: '1', pageSize: '100' }
    }).subscribe({
      next: (res: any) => {
        const all = toArr(res);
        // Extra client-side filter: remove expired by endDate
        const nowMs = Date.now();
        this.activeMeds.set(
          all.filter((m: any) => {
            if (m.isActive === false) return false;
            if (m.endDate && new Date(m.endDate).getTime() < nowMs) return false;
            return true;
          })
        );
        this.loadingMeds.set(false);
      },
      error: () => this.loadingMeds.set(false)
    });

    /* ── Vitals — get latest reading ───────────────────────────────────── */
    this.http.get<any>(`${environment.apiUrl}/Vital/my`, {
      params: { pageNumber: '1', pageSize: '10' }
    }).subscribe({
      next: (res: any) => {
        const items = toArr(res);
        if (items.length) {
          // Sort descending by date, pick latest
          const sorted = [...items].sort((a: any, b: any) =>
            new Date(b.recordedAt ?? b.createdAt ?? 0).getTime() -
            new Date(a.recordedAt ?? a.createdAt ?? 0).getTime()
          );
          this.latestVital.set(sorted[0]);
        }
        this.loadingVitals.set(false);
      },
      error: () => this.loadingVitals.set(false)
    });

    /* ── Tasks ─────────────────────────────────────────────────────────── */
    this.http.get<any>(`${environment.apiUrl}/MedicalTask/my`, {
      params: { isCompleted: 'false' }
    }).subscribe({
      next: (res: any) => {
        this.pendingTasks.set(toArr(res));
        this.loadingTasks.set(false);
      },
      error: () => this.loadingTasks.set(false)
    });
  }
}
