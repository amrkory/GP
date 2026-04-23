import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }                        from '@angular/common';
import { ActivatedRoute, Router, RouterLink }  from '@angular/router';
import { AppointmentService }                  from '../../../../core/services/appointment.service';
import { Appointment }                         from '../../../../core/models/api.models';

@Component({
  selector: 'app-appointment-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <div class="top-bar">
        <button class="back-btn" (click)="router.navigate(['/patient/appointments'])">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1>Appointment Details</h1>
        <span></span>
      </div>

      <div class="loading" *ngIf="loading()"><div class="spinner-lg"></div></div>

      <ng-container *ngIf="!loading() && appt()">

        <!-- Doctor card -->
        <div class="doctor-card">
          <div class="doc-avatar-lg">{{ initials(appt()!.doctorName) }}</div>
          <div class="doc-details">
            <h2>{{ appt()!.doctorName }}</h2>
            <p>{{ appt()!.specialtyName }}</p>
          </div>
          <span class="status-badge" [class]="appt()!.status.toLowerCase()">{{ appt()!.status }}</span>
        </div>

        <!-- Info rows -->
        <div class="info-card">
          <div class="info-row">
            <div class="info-icon">📅</div>
            <div>
              <div class="info-label">Date & Time</div>
              <div class="info-val">{{ appt()!.scheduledAt | date:'EEEE, MMMM d, y' }}<br>{{ appt()!.scheduledAt | date:'h:mm a' }}</div>
            </div>
          </div>
          <div class="info-row">
            <div class="info-icon">{{ appt()!.type === 'Video' ? '📹' : appt()!.type === 'HomeVisit' ? '🏠' : '🏥' }}</div>
            <div>
              <div class="info-label">Type</div>
              <div class="info-val">{{ appt()!.type }}</div>
            </div>
          </div>
          <div class="info-row">
            <div class="info-icon">⏱️</div>
            <div>
              <div class="info-label">Duration</div>
              <div class="info-val">{{ appt()!.durationMinutes }} minutes</div>
            </div>
          </div>
          <div class="info-row" *ngIf="appt()!.notes">
            <div class="info-icon">📝</div>
            <div>
              <div class="info-label">Notes</div>
              <div class="info-val">{{ appt()!.notes }}</div>
            </div>
          </div>
          <div class="info-row" *ngIf="appt()!.meetingLink">
            <div class="info-icon">🔗</div>
            <div>
              <div class="info-label">Meeting Link</div>
              <a class="meeting-link" [href]="appt()!.meetingLink!">Join Video Call</a>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="actions" *ngIf="appt()!.status === 'Confirmed' || appt()!.status === 'Pending'">
          <button class="btn-reschedule" [routerLink]="['/patient/appointments', appt()!.id, 'reschedule']">
            Reschedule
          </button>
          <button class="btn-cancel" (click)="cancelAppt()" [disabled]="cancelling()">
            <span class="mini-spinner" *ngIf="cancelling()"></span>
            {{ cancelling() ? 'Cancelling...' : 'Cancel Appointment' }}
          </button>
        </div>

        <div class="cancel-reason" *ngIf="appt()!.cancellationReason">
          <strong>Cancellation reason:</strong> {{ appt()!.cancellationReason }}
        </div>

      </ng-container>
    </div>
  `,
  styles: [`
    .page    { padding: 16px; max-width: 640px; margin: 0 auto; }
    .top-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
    .top-bar h1 { font-size: 18px; font-weight: 700; color: #111; }
    .back-btn { background: none; border: none; cursor: pointer; color: #555; padding: 4px; display: flex; }

    .loading { display: flex; justify-content: center; padding: 40px; }
    .spinner-lg { width: 32px; height: 32px; border: 3px solid #f0f0f0; border-top-color: #D84040; border-radius: 50%; animation: spin .7s linear infinite; }
    .mini-spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: spin .7s linear infinite; vertical-align: middle; margin-right: 6px; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .doctor-card { background: #fff; border-radius: 14px; padding: 16px; display: flex; align-items: center; gap: 14px; margin-bottom: 12px; box-shadow: 0 1px 8px rgba(0,0,0,0.06); }
    .doc-avatar-lg { width: 56px; height: 56px; border-radius: 50%; background: #D84040; color: #fff; font-size: 18px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .doc-details { flex: 1; }
    .doc-details h2 { font-size: 17px; font-weight: 700; color: #111; }
    .doc-details p  { font-size: 13px; color: #888; }

    .status-badge { font-size: 12px; padding: 4px 10px; border-radius: 10px; font-weight: 600; }
    .status-badge.confirmed { background: #E1F5EE; color: #0F6E56; }
    .status-badge.pending   { background: #FEF9E7; color: #d4a017; }
    .status-badge.cancelled { background: #FEF2F2; color: #D84040; }
    .status-badge.completed { background: #E6F1FB; color: #185FA5; }

    .info-card { background: #fff; border-radius: 14px; padding: 4px 0; margin-bottom: 16px; box-shadow: 0 1px 8px rgba(0,0,0,0.06); }
    .info-row  { display: flex; align-items: flex-start; gap: 14px; padding: 14px 16px; border-bottom: 1px solid #f5f5f5; }
    .info-row:last-child { border-bottom: none; }
    .info-icon { font-size: 20px; flex-shrink: 0; }
    .info-label { font-size: 12px; color: #888; margin-bottom: 3px; }
    .info-val   { font-size: 14px; color: #111; font-weight: 500; line-height: 1.5; }
    .meeting-link { color: #D84040; font-weight: 600; text-decoration: none; font-size: 14px; }

    .actions { display: flex; gap: 10px; margin-bottom: 12px; }
    .btn-reschedule { flex: 1; padding: 13px; border: 1.5px solid #D84040; background: #fff; color: #D84040; border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer; }
    .btn-cancel     { flex: 1; padding: 13px; border: none; background: #FEF2F2; color: #D84040; border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer; }
    .btn-cancel:disabled { opacity: 0.6; }

    .cancel-reason { background: #FEF2F2; border-radius: 10px; padding: 12px 14px; font-size: 13px; color: #888; }
  `],
})
export class AppointmentDetailComponent implements OnInit {
  private svc   = inject(AppointmentService);
  readonly router = inject(Router);
  private route = inject(ActivatedRoute);

  loading    = signal(true);
  cancelling = signal(false);
  appt       = signal<Appointment | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.svc.getById(id).subscribe(res => {
      this.appt.set(res.data);
      this.loading.set(false);
    });
  }

  cancelAppt(): void {
    if (!confirm('Cancel this appointment?')) return;
    this.cancelling.set(true);
    this.svc.cancel(this.appt()!.id, 'Patient requested cancellation').subscribe(res => {
      this.appt.set(res.data);
      this.cancelling.set(false);
    });
  }

  initials(name: string): string {
    return name.replace('Dr. ','').split(' ').map((n:string)=>n[0]).join('').slice(0,2).toUpperCase();
  }
}
