import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient }     from '@angular/common/http';
import { environment }    from '../../../../../environments/environment';

@Component({
  selector: 'app-visit-report',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="page-header"><h1>Visit Report</h1></div>
      <div class="report-card">
        <div class="report-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0F6E56" stroke-width="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        </div>
        <h2>Report generated</h2>
        <p>Visit report for request ID: <code>{{ visitId }}</code></p>
      </div>
    </div>
  `,
  styles: [`
    .page{padding:24px;max-width:640px;}@media(max-width:768px){.page{padding:16px;}}
    .page-header{margin-bottom:16px;}.page-header h1{font-size:22px;font-weight:700;color:#111;}
    .report-card{background:#fff;border-radius:14px;padding:40px 24px;text-align:center;box-shadow:0 1px 8px rgba(0,0,0,.05);}
    .report-icon{width:72px;height:72px;background:#E1F5EE;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;}
    .report-card h2{font-size:18px;font-weight:700;color:#111;margin-bottom:8px;}
    .report-card p{font-size:14px;color:#888;}
    code{background:#f0f0f0;padding:2px 6px;border-radius:4px;font-size:13px;}
  `]
})
export class VisitReportComponent implements OnInit {
  private route = inject(ActivatedRoute);
  visitId = '';
  ngOnInit(){ this.visitId = this.route.snapshot.paramMap.get('id') ?? ''; }
}
