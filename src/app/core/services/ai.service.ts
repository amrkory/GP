import { Injectable }  from '@angular/core';
import { HttpClient }  from '@angular/common/http';
import { Observable }  from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AiService {
  private api = environment.apiUrl;
  constructor(private http: HttpClient) {}

  /** GET /api/AI/GetAICalories?food=... */
  getCalories(food: string): Observable<any> {
    return this.http.get<any>(`${this.api}/AI/GetAICalories`, { params: { food } });
  }

  /** GET /api/AI/GetAiDiagnose?symptoms=... */
  getDiagnosis(symptoms: string): Observable<any> {
    return this.http.get<any>(`${this.api}/AI/GetAiDiagnose`, { params: { symptoms } });
  }

  // Legacy compat used by ai-assistant.component
  chat(dto: { message: string; conversationId?: string }): Observable<any> {
    return this.getDiagnosis(dto.message);
  }

  // Legacy compat used by nutrition.component
  calories(food: string): Observable<any> {
    return this.getCalories(food);
  }
}
