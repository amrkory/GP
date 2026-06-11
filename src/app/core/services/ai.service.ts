// src/app/core/services/ai.service.ts
import { Injectable }  from '@angular/core';
import { HttpClient }  from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AiService {
  private api = environment.apiUrl;
  constructor(private http: HttpClient) {}

  /** GET /api/AI/GetAICalories?food= */
  getCalories(food: string): Observable<any> {
    return this.http.get<any>(`${this.api}/AI/GetAICalories`, { params: { food } }).pipe(
      catchError(e => of({ success: false, message: e?.error?.message ?? 'AI not available' }))
    );
  }

  /** POST /api/AI/GetAICaloriesByImage — multipart: image + optional message */
  getCaloriesByImage(image: File, message?: string): Observable<any> {
    const form = new FormData();
    form.append('image', image);
    if (message) form.append('message', message);
    return this.http.post<any>(`${this.api}/AI/GetAICaloriesByImage`, form).pipe(
      catchError(e => of({ success: false, message: e?.error?.message ?? 'Image AI not available' }))
    );
  }

  /** GET /api/AI/GetAiDiagnose?symptoms= */
  getDiagnosis(symptoms: string): Observable<any> {
    return this.http.get<any>(`${this.api}/AI/GetAiDiagnose`, { params: { symptoms } }).pipe(
      catchError(e => of({ success: false, message: e?.error?.message ?? 'AI not available' }))
    );
  }

  // Aliases
  getDiagnose    = (s: string) => this.getDiagnosis(s);
  calories       = (f: string) => this.getCalories(f);
  chat           = (dto: { message: string }) => this.getDiagnosis(dto.message);
}
