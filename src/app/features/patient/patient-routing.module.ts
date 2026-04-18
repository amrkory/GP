import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./patient-shell/patient-shell.component').then(c => c.PatientShellComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',       loadComponent: () => import('./dashboard/dashboard.component').then(c => c.PatientDashboardComponent) },
      { path: 'ai-assistant',    loadComponent: () => import('./ai-assistant/ai-assistant.component').then(c => c.AiAssistantComponent) },
      { path: 'appointments',    loadComponent: () => import('./appointments/appointment-list/appointment-list.component').then(c => c.AppointmentListComponent) },
      { path: 'appointments/book', loadComponent: () => import('./appointments/book-appointment/book-appointment.component').then(c => c.BookAppointmentComponent) },
      { path: 'appointments/:id',  loadComponent: () => import('./appointments/appointment-detail/appointment-detail.component').then(c => c.AppointmentDetailComponent) },
      { path: 'appointments/:id/reschedule', loadComponent: () => import('./appointments/reschedule/reschedule.component').then(c => c.RescheduleComponent) },
      { path: 'vitals',          loadComponent: () => import('./vitals/vitals.component').then(c => c.VitalsComponent) },
      { path: 'vitals/add',      loadComponent: () => import('./vitals/add-vitals/add-vitals.component').then(c => c.AddVitalsComponent) },
      { path: 'checklist',       loadComponent: () => import('./checklist/checklist.component').then(c => c.ChecklistComponent) },
      { path: 'checklist/:id',   loadComponent: () => import('./checklist/task-detail/task-detail.component').then(c => c.TaskDetailComponent) },
      { path: 'prescriptions',   loadComponent: () => import('./prescriptions/prescriptions.component').then(c => c.PrescriptionsComponent) },
      { path: 'records',         loadComponent: () => import('./medical-records/medical-records.component').then(c => c.MedicalRecordsComponent) },
      { path: 'nutrition',       loadComponent: () => import('./nutrition/nutrition.component').then(c => c.NutritionComponent) },
      { path: 'home-service',    loadComponent: () => import('./home-service/home-service.component').then(c => c.HomeServiceComponent) },
      { path: 'home-service/nurses', loadComponent: () => import('./home-service/available-nurses/available-nurses.component').then(c => c.AvailableNursesComponent) },
      { path: 'family',          loadComponent: () => import('./family/family.component').then(c => c.FamilyComponent) },
      { path: 'chat/:doctorId',  loadComponent: () => import('./chat/chat.component').then(c => c.PatientChatComponent) },
      { path: 'profile',         loadComponent: () => import('./profile/profile.component').then(c => c.PatientProfileComponent) },
    ],
  },
];

@NgModule({ imports: [RouterModule.forChild(routes)], exports: [RouterModule] })
export class PatientRoutingModule {}
