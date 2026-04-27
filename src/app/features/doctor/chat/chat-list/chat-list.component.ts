import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { RouterLink }     from '@angular/router';
import { DoctorService }  from '../../../../core/services/doctor.service';
import { PatientProfile } from '../../../../core/models/api.models';

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header"><h1>Messages</h1></div>
      <div class="loading" *ngIf="loading()"><div class="spinner"></div></div>
      <div class="chat-list" *ngIf="!loading()">
        <a class="chat-item" *ngFor="let p of patients()" [routerLink]="['/doctor/chat', p.id]">
          <div class="avatar" [style.background]="color(p.bloodType || '')">{{ initials(p.firstName, p.lastName) }}</div>
          <div class="chat-info">
            <div class="chat-name">{{ p.firstName }} {{ p.lastName }}</div>
            <div class="chat-sub">Tap to open conversation</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </a>
        <div class="empty" *ngIf="patients().length === 0">
          <div class="empty-icon"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>
          <p>No conversations yet</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { padding:16px; max-width:640px; margin:0 auto; }
    .page-header h1 { font-size:22px; font-weight:700; color:#111; margin-bottom:14px; }
    .loading { display:flex; justify-content:center; padding:40px; }
    .spinner { width:28px; height:28px; border:3px solid #f0f0f0; border-top-color:#2D4A8A; border-radius:50%; animation:spin .7s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .chat-list { display:flex; flex-direction:column; }
    .chat-item { display:flex; align-items:center; gap:12px; padding:14px; background:#fff; border-bottom:1px solid #f5f5f5; text-decoration:none; color:inherit; }
    .chat-item:first-child { border-radius:14px 14px 0 0; }
    .chat-item:last-child  { border-radius:0 0 14px 14px; border-bottom:none; }
    .avatar { width:46px; height:46px; border-radius:50%; color:#fff; font-size:15px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .chat-info { flex:1; }
    .chat-name { font-size:15px; font-weight:600; color:#111; }
    .chat-sub  { font-size:12px; color:#aaa; margin-top:2px; }
    .empty { display:flex; flex-direction:column; align-items:center; gap:10px; padding:40px; background:#fff; border-radius:14px; }
    .empty-icon { width:64px; height:64px; background:#f0f0f0; border-radius:50%; display:flex; align-items:center; justify-content:center; }
    .empty p { color:#888; font-size:14px; }
  `],
})
export class ChatListComponent implements OnInit {
  private svc = inject(DoctorService);
  loading  = signal(true);
  patients = signal<PatientProfile[]>([]);
  ngOnInit(): void { this.svc.getPatients().subscribe(res => { this.patients.set(res.data.items); this.loading.set(false); }); }
  initials(f: string, l: string): string { return (f[0] + l[0]).toUpperCase(); }
  color(bt: string): string {
    const m: Record<string,string> = { 'O+':'#2D4A8A','A+':'#185FA5','B+':'#0F6E56','AB+':'#6B5BAD' };
    return m[bt] ?? '#2D4A8A';
  }
}
