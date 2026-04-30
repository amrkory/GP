// src/app/core/services/ai.service.ts
import { Injectable }  from '@angular/core';
import { HttpClient }  from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AiService {
  private api = environment.apiUrl;
  constructor(private http: HttpClient) {}
  getCalories(food: string): Observable<any> {
    return this.http.get<any>(`${this.api}/AI/GetAICalories`, { params: { food } }).pipe(
      catchError(e => of({ success: false, message: e?.error?.message ?? 'AI not available' }))
    );
  }
  getDiagnosis(symptoms: string): Observable<any> {
    return this.http.get<any>(`${this.api}/AI/GetAiDiagnose`, { params: { symptoms } }).pipe(
      catchError(e => of({ success: false, message: e?.error?.message ?? 'AI not available' }))
    );
  }
  chat(dto: { message: string; conversationId?: string }): Observable<any> { return this.getDiagnosis(dto.message); }
  calories(food: string): Observable<any> { return this.getCalories(food); }
}
