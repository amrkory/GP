import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./provider-shell/provider-shell.component').then(c => c.ProviderShellComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard',             loadComponent: () => import('./dashboard/dashboard.component').then(c => c.ProviderDashboardComponent) },
      { path: 'requests',              loadComponent: () => import('./requests/request-list/request-list.component').then(c => c.RequestListComponent) },
      { path: 'requests/:id',          loadComponent: () => import('./requests/request-detail/request-detail.component').then(c => c.RequestDetailComponent) },
      { path: 'visits/record/:reqId',  loadComponent: () => import('./visits/record-visit/record-visit.component').then(c => c.RecordVisitComponent) },
      { path: 'visits/:id/report',     loadComponent: () => import('./visits/visit-report/visit-report.component').then(c => c.VisitReportComponent) },
      { path: 'profile',               loadComponent: () => import('./profile/profile.component').then(c => c.ProviderProfileComponent) },
    ],
  },
];

@NgModule({ imports: [RouterModule.forChild(routes)], exports: [RouterModule] })
export class ServiceProviderRoutingModule {}
