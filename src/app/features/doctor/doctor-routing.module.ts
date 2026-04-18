import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./doctor-shell/doctor-shell.component').then(c => c.DoctorShellComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',   loadComponent: () => import('./dashboard/dashboard.component').then(c => c.DoctorDashboardComponent) },
      { path: 'patients',    loadComponent: () => import('./patients/patient-list/patient-list.component').then(c => c.PatientListComponent) },
      {
        path: 'patients/:patientId',
        loadComponent: () => import('./patients/patient-detail/patient-detail.component').then(c => c.PatientDetailComponent),
        children: [
          { path: '', redirectTo: 'overview', pathMatch: 'full' },
          { path: 'overview',      loadComponent: () => import('./patients/patient-overview/patient-overview.component').then(c => c.PatientOverviewComponent) },
          { path: 'vitals',        loadComponent: () => import('./patients/patient-vitals/patient-vitals.component').then(c => c.PatientVitalsComponent) },
          { path: 'prescriptions', loadComponent: () => import('./patients/patient-prescriptions/patient-prescriptions.component').then(c => c.PatientPrescriptionsComponent) },
          { path: 'checklist',     loadComponent: () => import('./patients/patient-checklist/patient-checklist.component').then(c => c.PatientChecklistComponent) },
        ],
      },
      { path: 'prescriptions/new/:patientId', loadComponent: () => import('./prescriptions/write-prescription/write-prescription.component').then(c => c.WritePrescriptionComponent) },
      { path: 'prescriptions/:id/edit',       loadComponent: () => import('./prescriptions/edit-prescription/edit-prescription.component').then(c => c.EditPrescriptionComponent) },
      { path: 'checklist/assign/:patientId',  loadComponent: () => import('./checklist/assign-checklist/assign-checklist.component').then(c => c.AssignChecklistComponent) },
      { path: 'appointments',    loadComponent: () => import('./appointments/appointment-list/appointment-list.component').then(c => c.DoctorAppointmentListComponent) },
      { path: 'appointments/:id', loadComponent: () => import('./appointments/appointment-detail/appointment-detail.component').then(c => c.DoctorAppointmentDetailComponent) },
      { path: 'chat',            loadComponent: () => import('./chat/chat-list/chat-list.component').then(c => c.ChatListComponent) },
      { path: 'chat/:patientId', loadComponent: () => import('./chat/chat-room/chat-room.component').then(c => c.ChatRoomComponent) },
      { path: 'schedule',        loadComponent: () => import('./schedule/schedule.component').then(c => c.ScheduleComponent) },
      { path: 'profile',         loadComponent: () => import('./profile/profile.component').then(c => c.DoctorProfileComponent) },
    ],
  },
];

@NgModule({ imports: [RouterModule.forChild(routes)], exports: [RouterModule] })
export class DoctorRoutingModule {}
