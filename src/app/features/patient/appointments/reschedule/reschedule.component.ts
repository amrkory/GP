import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router }    from '@angular/router';

@Component({
  selector: 'app-reschedule',
  standalone: true,
  template: ``
})
export class RescheduleComponent implements OnInit {
  private route  = inject(ActivatedRoute);
  private router = inject(Router);
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    // Redirect to book page with reschedule mode
    this.router.navigate(['/patient/appointments/reschedule-book', id], { replaceUrl: true });
  }
}
