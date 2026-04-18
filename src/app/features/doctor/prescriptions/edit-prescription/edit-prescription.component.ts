import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';

@Component({
  selector: 'app-edit-rx',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  template: `<router-outlet></router-outlet><p style="padding:24px;color:#888">EditPrescriptionComponent</p>`,
})
export class EditPrescriptionComponent {}
