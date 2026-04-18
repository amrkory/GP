import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'onboarding',      loadComponent: () => import('./onboarding/onboarding.component').then(c => c.OnboardingComponent) },
  { path: 'login',           loadComponent: () => import('./login/login.component').then(c => c.LoginComponent) },
  { path: 'register',        loadComponent: () => import('./register/register.component').then(c => c.RegisterComponent) },
  { path: 'register/patient', loadComponent: () => import('./register/patient/register-patient.component').then(c => c.RegisterPatientComponent) },
  { path: 'register/doctor',  loadComponent: () => import('./register/doctor/register-doctor.component').then(c => c.RegisterDoctorComponent) },
  { path: 'register/provider',loadComponent: () => import('./register/provider/register-provider.component').then(c => c.RegisterProviderComponent) },
  { path: 'forgot-password',  loadComponent: () => import('./forgot-password/forgot-password.component').then(c => c.ForgotPasswordComponent) },
  { path: 'verify-otp',       loadComponent: () => import('./verify-otp/verify-otp.component').then(c => c.VerifyOtpComponent) },
  { path: 'reset-password',   loadComponent: () => import('./reset-password/reset-password.component').then(c => c.ResetPasswordComponent) },
  { path: 'unauthorized',     loadComponent: () => import('./unauthorized/unauthorized.component').then(c => c.UnauthorizedComponent) },
  { path: '**',               loadComponent: () => import('./not-found/not-found.component').then(c => c.NotFoundComponent) },
];

@NgModule({ imports: [RouterModule.forChild(routes)], exports: [RouterModule] })
export class AuthRoutingModule {}
