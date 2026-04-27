import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div><h1>Medical Specialties</h1><p class="page-sub">Manage doctor specialties</p></div>
        <button class="btn-add" (click)="showAdd=true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Specialty
        </button>
      </div>

      <!-- Add form -->
      <div class="add-card" *ngIf="showAdd">
        <h3>New Specialty</h3>
        <div class="field-row">
          <input [(ngModel)]="newName" placeholder="Specialty name e.g. Cardiology" class="text-input" />
          <input [(ngModel)]="newDesc" placeholder="Short description" class="text-input" />
          <button class="btn-save" (click)="addSpecialty()" [disabled]="!newName.trim()">Add</button>
          <button class="btn-cancel" (click)="showAdd=false; newName=''; newDesc=''">Cancel</button>
        </div>
      </div>

      <!-- List -->
      <div class="spec-grid">
        <div class="spec-card" *ngFor="let s of specialties">
          <div class="spec-icon" [style.background]="s.color + '22'" [style.color]="s.color">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.5 16h.42Z"/>
            </svg>
          </div>
          <div class="spec-info">
            <div class="spec-name">{{ s.name }}</div>
            <div class="spec-desc">{{ s.description }}</div>
            <div class="spec-count">{{ s.doctorCount }} doctors</div>
          </div>
          <button class="delete-btn" (click)="deleteSpecialty(s.id)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page{padding:24px;max-width:1100px;}@media(max-width:768px){.page{padding:16px;}}
    .page-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;flex-wrap:wrap;gap:10px;}
    .page-header h1{font-size:22px;font-weight:800;color:#111;margin-bottom:2px;}
    .page-sub{font-size:14px;color:#888;}
    .btn-add{display:flex;align-items:center;gap:6px;background:#1E293B;color:#fff;border:none;border-radius:10px;padding:10px 16px;font-size:14px;font-weight:600;cursor:pointer;}
    .add-card{background:#fff;border-radius:14px;padding:18px;margin-bottom:16px;box-shadow:0 1px 8px rgba(0,0,0,.05);}
    .add-card h3{font-size:15px;font-weight:700;color:#111;margin-bottom:12px;}
    .field-row{display:flex;gap:10px;flex-wrap:wrap;}
    .text-input{flex:1;min-width:140px;padding:10px 14px;border:1.5px solid #e8e8e8;border-radius:10px;font-size:14px;font-family:'Inter',sans-serif;outline:none;}
    .text-input:focus{border-color:#1E293B;}
    .btn-save{padding:10px 18px;background:#1E293B;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;}
    .btn-cancel{padding:10px 14px;border:1.5px solid #e8e8e8;background:#fff;border-radius:10px;font-size:14px;cursor:pointer;color:#555;}
    .spec-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px;}
    .spec-card{background:#fff;border-radius:14px;padding:16px;display:flex;align-items:flex-start;gap:12px;box-shadow:0 1px 8px rgba(0,0,0,.05);transition:transform .15s;}
    .spec-card:hover{transform:translateY(-2px);}
    .spec-icon{width:48px;height:48px;border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
    .spec-info{flex:1;}
    .spec-name{font-size:15px;font-weight:700;color:#111;margin-bottom:2px;}
    .spec-desc{font-size:12px;color:#888;margin-bottom:4px;}
    .spec-count{font-size:12px;color:#185FA5;font-weight:500;}
    .delete-btn{background:none;border:none;cursor:pointer;color:#ccc;padding:4px;border-radius:6px;}
    .delete-btn:hover{color:#D84040;background:#FEF2F2;}
  `],
})
export class CategoriesComponent implements OnInit {
  showAdd = false; newName = ''; newDesc = '';
  colors = ['#D84040','#185FA5','#0F6E56','#6B5BAD','#d4a017','#0891b2','#7C3AED','#EA580C'];
  specialties: any[] = [];
  ngOnInit(): void {
    this.specialties = [
      { id:'sp-001', name:'Cardiology',       description:'Heart and cardiovascular system',    doctorCount:12, color:this.colors[0] },
      { id:'sp-002', name:'Neurology',         description:'Brain and nervous system disorders', doctorCount:8,  color:this.colors[1] },
      { id:'sp-003', name:'Endocrinology',     description:'Diabetes, thyroid, hormones',        doctorCount:6,  color:this.colors[2] },
      { id:'sp-004', name:'Orthopedics',       description:'Bones, joints, and muscles',         doctorCount:9,  color:this.colors[3] },
      { id:'sp-005', name:'Dermatology',       description:'Skin, hair, and nail conditions',    doctorCount:5,  color:this.colors[4] },
      { id:'sp-006', name:'General Practice',  description:'Primary healthcare and prevention',  doctorCount:18, color:this.colors[5] },
      { id:'sp-007', name:'Psychiatry',        description:'Mental health and behavioral',       doctorCount:4,  color:this.colors[6] },
      { id:'sp-008', name:'Ophthalmology',     description:'Eye diseases and vision care',       doctorCount:7,  color:this.colors[7] },
    ];
  }
  addSpecialty(): void {
    if (!this.newName.trim()) return;
    this.specialties.unshift({ id: 'sp-' + Date.now(), name: this.newName, description: this.newDesc, doctorCount: 0, color: this.colors[this.specialties.length % this.colors.length] });
    this.showAdd = false; this.newName = ''; this.newDesc = '';
  }
  deleteSpecialty(id: string): void { this.specialties = this.specialties.filter(s => s.id !== id); }
}
