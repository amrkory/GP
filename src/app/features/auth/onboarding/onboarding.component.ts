import { Component, signal }      from '@angular/core';
import { Router, RouterLink }      from '@angular/router';
import { CommonModule }            from '@angular/common';

interface Slide {
  image:    string;   // SVG illustration inline
  title:    string;
  subtitle: string;
}

@Component({
  selector: 'app-onboarding',
styleUrls: ['./onboarding.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="onboard-wrap">

      <!-- Skip -->
      <div class="top-bar">
        <span></span>
        <button class="skip-btn" (click)="goLogin()">Skip</button>
      </div>

      <!-- Slide area -->
      <div class="slides">
        <div class="slide" *ngFor="let s of slides; let i = index"
             [class.active]="i === current()"
             [class.prev]="i < current()">

          <!-- Illustration -->
          <div class="illus-wrap">
            <div class="illus-circle">
              <div class="illus-inner" [innerHTML]="s.image"></div>
            </div>
          </div>

          <!-- Text -->
          <div class="slide-text">
            <h2>{{ s.title }}</h2>
            <p>{{ s.subtitle }}</p>
          </div>
        </div>
      </div>

      <!-- Dots -->
      <div class="dots">
        <span class="dot" *ngFor="let s of slides; let i = index"
              [class.active]="i === current()"></span>
      </div>

      <!-- Buttons -->
      <div class="onboard-actions">
        <button class="btn-next" (click)="next()">
          {{ current() === slides.length - 1 ? 'Get Started' : 'Next' }}
        </button>
        <button class="btn-signin" routerLink="/auth/login" *ngIf="current() === slides.length - 1">
          Already have an account? <strong>Sign In</strong>
        </button>
      </div>

    </div>
  `,

})
export class OnboardingComponent {

  current = signal(0);

  slides: Slide[] = [
    {
      title:    'Your Health, Our Priority',
      subtitle: 'Access top doctors, book appointments, and manage your health journey — all in one place.',
      image: `
        <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" fill="none">
          <!-- Doctor illustration -->
          <circle cx="80" cy="50" r="28" fill="#FBDCDC"/>
          <circle cx="80" cy="44" r="18" fill="#D84040"/>
          <!-- Head -->
          <circle cx="80" cy="44" r="14" fill="#FDDCB5"/>
          <!-- Body -->
          <rect x="58" y="68" width="44" height="50" rx="10" fill="#D84040"/>
          <!-- Stethoscope -->
          <path d="M72 80 Q72 95 85 95 Q98 95 98 80" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
          <circle cx="98" cy="80" r="4" fill="#fff"/>
          <!-- Cross on coat -->
          <rect x="76" y="74" width="8" height="3" rx="1.5" fill="#fff"/>
          <rect x="78.5" y="71.5" width="3" height="8" rx="1.5" fill="#fff"/>
          <!-- Legs -->
          <rect x="62" y="114" width="16" height="24" rx="6" fill="#2D4A8A"/>
          <rect x="82" y="114" width="16" height="24" rx="6" fill="#2D4A8A"/>
        </svg>
      `,
    },
    {
      title:    'Smart AI Health Assistant',
      subtitle: 'Describe your symptoms and get instant guidance. Our AI helps you find the right specialist.',
      image: `
        <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" fill="none">
          <!-- Phone -->
          <rect x="45" y="20" width="70" height="120" rx="14" fill="#1E293B"/>
          <rect x="50" y="28" width="60" height="104" rx="10" fill="#F8FAFC"/>
          <!-- Chat bubbles -->
          <rect x="56" y="38" width="40" height="18" rx="9" fill="#D84040"/>
          <rect x="64" y="62" width="36" height="18" rx="9" fill="#E2E8F0"/>
          <rect x="58" y="86" width="34" height="18" rx="9" fill="#D84040"/>
          <!-- AI pulse line -->
          <path d="M55 115 L65 115 L70 105 L75 125 L80 108 L85 122 L90 115 L100 115" stroke="#D84040" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          <!-- Stars -->
          <circle cx="130" cy="35" r="5" fill="#FCD34D"/>
          <circle cx="140" cy="60" r="3" fill="#FCD34D"/>
          <circle cx="25" cy="55" r="4" fill="#FCD34D"/>
        </svg>
      `,
    },
    {
      title:    'Home Healthcare Services',
      subtitle: 'Request certified nurses and caregivers to visit you at home for professional medical care.',
      image: `
        <svg viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg" fill="none">
          <!-- House -->
          <path d="M28 80 L80 30 L132 80" fill="#D84040"/>
          <rect x="38" y="80" width="84" height="65" rx="6" fill="#fff" stroke="#FBDCDC" stroke-width="2"/>
          <!-- Door -->
          <rect x="65" y="108" width="30" height="37" rx="4" fill="#FBDCDC"/>
          <circle cx="90" cy="128" r="2.5" fill="#D84040"/>
          <!-- Window left -->
          <rect x="44" y="88" width="22" height="20" rx="4" fill="#DBEAFE"/>
          <line x1="55" y1="88" x2="55" y2="108" stroke="#93C5FD" stroke-width="1.5"/>
          <line x1="44" y1="98" x2="66" y2="98" stroke="#93C5FD" stroke-width="1.5"/>
          <!-- Window right -->
          <rect x="94" y="88" width="22" height="20" rx="4" fill="#DBEAFE"/>
          <line x1="105" y1="88" x2="105" y2="108" stroke="#93C5FD" stroke-width="1.5"/>
          <line x1="94" y1="98" x2="116" y2="98" stroke="#93C5FD" stroke-width="1.5"/>
          <!-- Heart on roof -->
          <path d="M78 52 C78 49 74 46 74 49.5 C74 52 78 56 78 56 C78 56 82 52 82 49.5 C82 46 78 49 78 52Z" fill="#fff"/>
        </svg>
      `,
    },
  ];

  constructor(private router: Router) {}

  next(): void {
    if (this.current() < this.slides.length - 1) {
      this.current.update(v => v + 1);
    } else {
      this.goLogin();
    }
  }

  goLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
