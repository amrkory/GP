import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard }             from './core/guards/auth.guard';
import { RoleGuard }             from './core/guards/role.guard';
import { NoAuthGuard }           from './core/guards/no-auth.guard';
import { ProfileCompletedGuard } from './core/guards/profile-completed.guard';
import { Role }                  from './core/models/role.enum';

export const routes: Routes = [
  // Root
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },

  // ── Public (redirect away if already logged in) ───────────────────────────
  {
    path: 'auth',
    canActivate: [NoAuthGuard],
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule),
  },

  // ── Patient ───────────────────────────────────────────────────────────────
  {
    path: 'patient',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [Role.Patient] },
    loadChildren: () => import('./features/patient/patient.module').then(m => m.PatientModule),
  },

  // ── Doctor ────────────────────────────────────────────────────────────────
  {
    path: 'doctor',
    canActivate: [AuthGuard, RoleGuard, ProfileCompletedGuard],
    data: { roles: [Role.Doctor] },
    loadChildren: () => import('./features/doctor/doctor.module').then(m => m.DoctorModule),
  },

  // ── Home Service Provider ─────────────────────────────────────────────────
  {
    path: 'provider',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [Role.Nurse] },
    loadChildren: () =>
      import('./features/service-provider/service-provider.module')
        .then(m => m.ServiceProviderModule),
  },

  // ── Admin ─────────────────────────────────────────────────────────────────
  {
    path: 'admin',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: [Role.Admin] },
    loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule),
  },

  // ── Utility ───────────────────────────────────────────────────────────────
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./features/auth/unauthorized/unauthorized.component')
        .then(c => c.UnauthorizedComponent),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./features/auth/not-found/not-found.component')
        .then(c => c.NotFoundComponent),
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    scrollPositionRestoration: 'enabled',
    paramsInheritanceStrategy: 'always',
  })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
