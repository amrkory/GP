import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./admin-shell/admin-shell.component').then(c => c.AdminShellComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',    loadComponent: () => import('./dashboard/dashboard.component').then(c => c.AdminDashboardComponent) },
      { path: 'doctors',      loadComponent: () => import('./doctors/doctor-management/doctor-management.component').then(c => c.DoctorManagementComponent) },
      { path: 'doctors/pending', loadComponent: () => import('./doctors/pending-requests/pending-requests.component').then(c => c.PendingRequestsComponent) },
      { path: 'doctors/:id',  loadComponent: () => import('./doctors/doctor-detail/doctor-detail.component').then(c => c.AdminDoctorDetailComponent) },
      { path: 'patients',     loadComponent: () => import('./patients/patient-management/patient-management.component').then(c => c.PatientManagementComponent) },
      { path: 'patients/:id', loadComponent: () => import('./patients/patient-detail/patient-detail.component').then(c => c.AdminPatientDetailComponent) },
      { path: 'providers',    loadComponent: () => import('./providers/provider-management/provider-management.component').then(c => c.ProviderManagementComponent) },
      { path: 'providers/:id',loadComponent: () => import('./providers/provider-detail/provider-detail.component').then(c => c.AdminProviderDetailComponent) },
      { path: 'categories',   loadComponent: () => import('./categories/categories.component').then(c => c.CategoriesComponent) },
    ],
  },
];

@NgModule({ imports: [RouterModule.forChild(routes)], exports: [RouterModule] })
export class AdminRoutingModule {}
