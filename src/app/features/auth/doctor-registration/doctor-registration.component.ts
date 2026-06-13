import { Component, signal }          from '@angular/core';
import { FormBuilder, Validators,
         ReactiveFormsModule }         from '@angular/forms';
import { Router, RouterLink }          from '@angular/router';
import { CommonModule }                from '@angular/common';
import { inject }                      from '@angular/core';
import { HttpClient }                  from '@angular/common/http';
import { environment }                 from '../../../../environments/environment';

@Component({
  selector: 'app-register-doctor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">
      <div class="auth-card">

        <button class="back-btn" (click)="prevStep()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          {{ step() === 1 ? 'Back to role selection' : 'Back' }}
        </button>

        <div class="steps">
          <div class="step" *ngFor="let s of [1,2,3,4]"
               [class.done]="step() > s" [class.active]="step() === s"></div>
        </div>
        <p class="step-label">Step <strong>{{ step() }} of 4</strong> — {{ stepTitles[step()-1] }}</p>
        <h1 class="auth-title">Doctor Registration</h1>

        <div class="alert-error" *ngIf="errorMsg()">{{ errorMsg() }}</div>

        <!-- STEP 1 -->
        <form [formGroup]="step1Form" *ngIf="step() === 1">
          <div class="form-section">
            <h3>Account Information</h3>
            <div class="row-2">
              <div class="field">
                <label>First Name <span class="req">*</span></label>
                <div class="input-wrap" [class.invalid]="s1['firstName'].touched && s1['firstName'].invalid">
                  <span class="input-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
                  <input formControlName="firstName" placeholder="First name" />
                </div>
              </div>
              <div class="field">
                <label>Last Name <span class="req">*</span></label>
                <div class="input-wrap" [class.invalid]="s1['lastName'].touched && s1['lastName'].invalid">
                  <span class="input-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
                  <input formControlName="lastName" placeholder="Last name" />
                </div>
              </div>
            </div>
            <div class="field">
              <label>Email <span class="req">*</span></label>
              <div class="input-wrap" [class.invalid]="s1['email'].touched && s1['email'].invalid">
                <span class="input-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></span>
                <input formControlName="email" type="email" placeholder="doctor@hospital.com" />
              </div>
              <div class="field-error" *ngIf="s1['email'].touched && s1['email'].errors?.['email']">Invalid email</div>
            </div>
            <div class="field">
              <label>Password <span class="req">*</span></label>
              <div class="input-wrap">
                <span class="input-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>
                <input formControlName="password" [type]="showPw() ? 'text' : 'password'" placeholder="Min. 8 characters" />
                <button type="button" class="eye-btn" (click)="togglePw()">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
              </div>
              <div class="field-error" *ngIf="s1['password'].touched && s1['password'].errors?.['minlength']">Min. 8 characters</div>
            </div>
            <div class="field">
              <label>Confirm Password <span class="req">*</span></label>
              <div class="input-wrap" [class.invalid]="s1['confirmPassword'].touched && s1['confirmPassword'].invalid">
                <span class="input-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></span>
                <input formControlName="confirmPassword" type="password" placeholder="Repeat your password" />
              </div>
              <div class="field-error" *ngIf="s1['confirmPassword'].touched && s1['confirmPassword'].invalid">Please confirm your password</div>
            </div>
            <div class="field">
              <label>Phone <span class="req">*</span></label>
              <div class="input-wrap" [class.invalid]="s1['phone'].touched && s1['phone'].invalid">
                <span class="input-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.5 16h.42l.08.92z"/></svg></span>
                <input formControlName="phone" type="tel" placeholder="+20 1xx xxx xxxx" />
              </div>
            </div>
          </div>
          <button class="btn-primary" type="button" (click)="nextStep()">Continue</button>
        </form>

        <!-- STEP 2 -->
        <form [formGroup]="step2Form" *ngIf="step() === 2">
          <div class="form-section">
            <h3>Professional Information</h3>
            <div class="field">
              <label>Specialization <span class="req">*</span></label>
              <div class="input-wrap" [class.invalid]="s2['specialty'].touched && s2['specialty'].invalid">
                <span class="input-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></span>
                <select formControlName="specialty" class="has-icon">
                  <option value="">Select specialization</option>
                  <option *ngFor="let sp of specialties" [value]="sp">{{ sp }}</option>
                </select>
              </div>
              <div class="field-error" *ngIf="s2['specialty'].touched && s2['specialty'].invalid">Required</div>
            </div>
            <div class="field">
              <label>Medical License Number <span class="req">*</span></label>
              <div class="input-wrap" [class.invalid]="s2['licenseNumber'].touched && s2['licenseNumber'].invalid">
                <span class="input-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg></span>
                <input formControlName="licenseNumber" placeholder="Enter license number" />
              </div>
            </div>
            <div class="field">
              <label>Years of Experience <span class="req">*</span></label>
              <div class="input-wrap">
                <span class="input-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></span>
                <input formControlName="experience" type="number" min="0" placeholder="e.g., 5" />
              </div>
            </div>
            <div class="field">
              <label>Hospital / Clinic <span class="req">*</span></label>
              <div class="input-wrap" [class.invalid]="s2['clinicName'].touched && s2['clinicName'].invalid">
                <span class="input-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg></span>
                <input formControlName="clinicName" placeholder="Current workplace" />
              </div>
            </div>
            <div class="field">
              <label>Location / City (optional)</label>
              <div class="input-wrap">
                <span class="input-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg></span>
                <input formControlName="location" placeholder="City or area" />
              </div>
            </div>
            <div class="field">
              <label>Consultation Fee (EGP)</label>
              <div class="input-wrap">
                <span class="input-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></span>
                <input formControlName="fee" type="number" min="0" placeholder="e.g., 300" />
              </div>
            </div>
            <label class="toggle-row" (click)="toggleHomeVisits()">
              <div class="toggle-info">
                <strong>Available for Home Visits</strong>
                <span>Check this if you provide home visit services</span>
              </div>
              <div class="toggle-switch" [class.on]="s2['homeVisits'].value">
                <div class="toggle-knob"></div>
              </div>
            </label>
          </div>
          <button class="btn-primary" type="button" (click)="nextStep()">Continue</button>
        </form>

        <!-- STEP 3 -->
        <div *ngIf="step() === 3">
          <div class="form-section">
            <h3>Upload Documents</h3>
            <p class="doc-note">Documents reviewed by admin within 24 hours.</p>
            <div class="field">
              <label>Medical License <span class="req">*</span></label>
              <div class="upload-box" (click)="licenseInput.click()" [class.has-file]="licenseFile()">
                <input #licenseInput type="file" accept=".pdf,.jpg,.jpeg,.png" style="display:none" (change)="onFile($event, 'license')" />
                <svg *ngIf="!licenseFile()" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#bbb" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <span *ngIf="!licenseFile()" class="upload-hint">Click to upload license<br><small>PDF, JPG, PNG up to 5MB</small></span>
                <span *ngIf="licenseFile()" class="upload-done">Done: {{ licenseFile() }}</span>
              </div>
            </div>
            <div class="field">
              <label>Medical Degree</label>
              <div class="upload-box" (click)="degreeInput.click()" [class.has-file]="degreeFile()">
                <input #degreeInput type="file" accept=".pdf,.jpg,.jpeg,.png" style="display:none" (change)="onFile($event, 'degree')" />
                <svg *ngIf="!degreeFile()" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#bbb" stroke-width="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <span *ngIf="!degreeFile()" class="upload-hint">Click to upload degree<br><small>PDF, JPG, PNG up to 5MB</small></span>
                <span *ngIf="degreeFile()" class="upload-done">Done: {{ degreeFile() }}</span>
              </div>
            </div>
          </div>
          <button class="btn-primary" type="button" (click)="nextStep()">Continue</button>
        </div>

        <!-- STEP 4 -->
        <div *ngIf="step() === 4">
          <div class="form-section">
            <h3>Review and Submit</h3>
            <div class="review-row"><span>Name</span><strong>{{ step1Form.value.firstName }} {{ step1Form.value.lastName }}</strong></div>
            <div class="review-row"><span>Email</span><strong>{{ step1Form.value.email }}</strong></div>
            <div class="review-row"><span>Specialty</span><strong>{{ step2Form.value.specialty }}</strong></div>
            <div class="review-row"><span>License</span><strong>{{ step2Form.value.licenseNumber }}</strong></div>
            <div class="review-row"><span>Clinic</span><strong>{{ step2Form.value.clinicName }}</strong></div>
          </div>
          <div class="notice-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#854F0B" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p>Your application will be reviewed within 24 hours. You will receive an email once approved.</p>
          </div>
          <button class="btn-primary" type="button" (click)="submit()" [disabled]="loading()">
            <span class="spinner" *ngIf="loading()"></span>
            {{ loading() ? 'Submitting...' : 'Submit Application' }}
          </button>
        </div>

        <div class="auth-footer" *ngIf="step() === 1">Already have an account? <a routerLink="/auth/login">Sign In</a></div>
      </div>
    </div>
  `,
  styles: [`
    
    .auth-page{min-height:100vh;background:#F7F8FA;display:flex;align-items:center;justify-content:center;padding:24px 16px}
    .auth-card{background:#fff;border-radius:20px;padding:36px 28px;width:100%;max-width:520px;box-shadow:0 4px 32px rgba(0,0,0,0.07)}
    .back-btn{display:flex;align-items:center;gap:6px;background:none;border:none;color:#888;font-size:14px;cursor:pointer;padding:0;margin-bottom:16px;font-family:'Cairo',sans-serif}
    .steps{display:flex;gap:6px;margin-bottom:12px}
    .step{flex:1;height:4px;border-radius:4px;background:#E8E8E8;transition:background .3s}
    .step.done,.step.active{background:#D84040}
    .step-label{font-size:13px;color:#888;margin-bottom:16px}
    .step-label strong{color:#111}
    .auth-title{font-size:24px;font-weight:700;color:#111;margin-bottom:16px}
    .alert-error{background:#D84040-light;border:1px solid #FBDCDC;color:#B83030;border-radius:10px;padding:10px 14px;font-size:13px;margin-bottom:16px}
    .form-section{background:#FAFAFA;border:1px solid #E8E8E8;border-radius:14px;padding:20px;margin-bottom:16px}
    .form-section h3{font-size:15px;font-weight:700;color:#111;margin-bottom:16px}
    .field{margin-bottom:14px}
    .field label{display:block;font-size:13px;font-weight:600;color:#111;margin-bottom:6px}
    .req{color:#D84040}
    .input-wrap{position:relative}
    .input-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:#bbb;display:flex;pointer-events:none}
    .eye-btn{position:absolute;right:14px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#bbb;padding:0;display:flex}
    .input-wrap input,.input-wrap select{width:100%;padding:11px 14px 11px 42px;border:1.5px solid #E8E8E8;border-radius:10px;font-size:14px;font-family:'Cairo',sans-serif;color:#111;background:#fff;outline:none;transition:border-color .2s;box-sizing:border-box;appearance:none}
    .input-wrap input::placeholder{color:#c0c0c0}
    .input-wrap input:focus,.input-wrap select:focus{border-color:#D84040;box-shadow:0 0 0 3px rgba(216,64,64,0.08)}
    .input-wrap.invalid input,.input-wrap.invalid select{border-color:#D84040}
    .field-error{font-size:12px;color:#D84040;margin-top:4px}
    .row-2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .toggle-row{display:flex;align-items:center;justify-content:space-between;padding:12px;background:#F0F0F0;border-radius:10px;cursor:pointer;user-select:none}
    .toggle-info strong{display:block;font-size:14px;color:#111}
    .toggle-info span{font-size:12px;color:#888}
    .toggle-switch{width:44px;height:24px;background:#E8E8E8;border-radius:12px;position:relative;transition:background .2s;flex-shrink:0}
    .toggle-switch.on{background:#D84040}
    .toggle-knob{position:absolute;top:2px;left:2px;width:20px;height:20px;border-radius:50%;background:#fff;transition:transform .2s}
    .toggle-switch.on .toggle-knob{transform:translateX(20px)}
    .doc-note{font-size:13px;color:#888;margin-bottom:16px}
    .upload-box{border:2px dashed #E8E8E8;border-radius:12px;padding:24px;text-align:center;cursor:pointer;transition:border-color .2s,background .2s}
    .upload-box:hover{border-color:#D84040;background:#D84040-light}
    .upload-box.has-file{border-color:#22c55e;background:#f0fdf4}
    .upload-hint{font-size:13px;color:#888;display:block;margin-top:8px}
    .upload-hint small{display:block;margin-top:4px}
    .upload-done{font-size:14px;color:#16a34a;font-weight:600}
    .review-row{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #E8E8E8;font-size:14px}
    .review-row:last-child{border-bottom:none}
    .review-row span{color:#888}
    .review-row strong{color:#111}
    .notice-box{display:flex;gap:10px;align-items:flex-start;background:#FAEEDA;border:1px solid #FAC775;border-radius:10px;padding:12px 14px;margin-bottom:16px}
    .notice-box p{font-size:13px;color:#854F0B;line-height:1.5}
    .btn-primary{width:100%;padding:14px;background:#D84040;color:#fff;border:none;border-radius:14px;font-size:16px;font-weight:700;font-family:'Cairo',sans-serif;cursor:pointer;margin-top:8px;transition:opacity .15s}
    .btn-primary:disabled{opacity:0.55;cursor:not-allowed}
    .spinner{display:inline-block;width:16px;height:16px;border:2px solid rgba(255,255,255,0.4);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;vertical-align:middle;margin-right:6px}
    @keyframes spin{to{transform:rotate(360deg)}}
    .auth-footer{text-align:center;font-size:14px;color:#888;margin-top:20px}
    .auth-footer a{color:#D84040;font-weight:600;text-decoration:none}
  `],
})
export class RegisterDoctorComponent {
  private fb     = inject(FormBuilder);
  private http   = inject(HttpClient);
  private router = inject(Router);

  step        = signal(1);
  showPw      = signal(false);
  loading     = signal(false);
  errorMsg    = signal('');
  licenseFile = signal('');
  degreeFile  = signal('');

  stepTitles = ['Account Info', 'Professional Info', 'Documents', 'Review'];

  specialties = [
    'General Practitioner','Cardiologist','Dermatologist','Endocrinologist',
    'Gastroenterologist','Neurologist','Obstetrician','Oncologist',
    'Ophthalmologist','Orthopedic Surgeon','Pediatrician','Psychiatrist',
    'Pulmonologist','Radiologist','Rheumatologist','Urologist',
  ];

  step1Form = this.fb.group({
    firstName: ['', Validators.required],
    lastName:  ['', Validators.required],
    email:     ['', [Validators.required, Validators.email]],
    password:        ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
    phone:           ['', Validators.required],
  });

  step2Form = this.fb.group({
    specialty:     ['', Validators.required],
    licenseNumber: ['', Validators.required],
    experience:    ['', Validators.required],
    clinicName:    ['', Validators.required],
    location:      [''],
    fee:           [''],
    homeVisits:    [false],
  });

  get s1() { return this.step1Form.controls; }
  get s2() { return this.step2Form.controls; }

  // ── Template-safe methods ──────────────────────────────────────────────────
  togglePw():         void { this.showPw.set(!this.showPw()); }
  toggleHomeVisits(): void { this.s2['homeVisits'].setValue(!this.s2['homeVisits'].value); }

  nextStep(): void {
    if (this.step() === 1 && this.step1Form.invalid) { this.step1Form.markAllAsTouched(); return; }
    if (this.step() === 2 && this.step2Form.invalid) { this.step2Form.markAllAsTouched(); return; }
    this.step.set(Math.min(this.step() + 1, 4));
  }

  prevStep(): void {
    if (this.step() === 1) this.router.navigate(['/auth/register']);
    else this.step.set(this.step() - 1);
  }

  onFile(event: Event, field: 'license' | 'degree'): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (field === 'license') this.licenseFile.set(file.name);
    else                     this.degreeFile.set(file.name);
  }

  submit(): void {
    this.loading.set(true);
    this.errorMsg.set('');
    const v1 = this.step1Form.value;
    const v2 = this.step2Form.value;
    const body: any = {
      firstName:       v1.firstName,
      lastName:        v1.lastName,
      email:           v1.email,
      password:        v1.password,
      confirmPassword: v1.confirmPassword,
      phoneNumber:     v1.phone,
      specialization:  v2.specialty,
      licenseNumber:   v2.licenseNumber,
      experienceYears: Number(v2.experience ?? 0),
      workPlace:       v2.clinicName ?? '',
      location:        v2.location   ?? v2.clinicName ?? '',
    };
    this.http.post<any>(`${environment.apiUrl}/Auth/register/doctor`, body).subscribe({
      next: () => this.router.navigate(['/auth/login'], { queryParams: { registered: 'doctor' } }),
      error: (err: any) => {
        this.loading.set(false);
        const errs = err?.error?.errors;
        const msg = errs
          ? Object.entries(errs).map(([f,m]) => `${f}: ${(m as string[]).join(', ')}`).join(' | ')
          : err?.error?.message ?? err?.error?.title ?? 'Registration failed.';
        this.errorMsg.set(msg);
      },
    });
  }
}
