import { NgModule }               from '@angular/core';
import { BrowserModule }           from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule,
         HTTP_INTERCEPTORS }       from '@angular/common/http';

import { AppRoutingModule }  from './app-routing.module';
import { AppComponent }      from './app.component';

// ── MOCK MODE: use MockInterceptor until backend is ready ─────────────────────
import { MockInterceptor }   from './core/interceptors/mock.interceptor';

// ── REAL MODE: uncomment this + comment out MockInterceptor above ─────────────
// import { JwtInterceptor } from './core/interceptors/jwt.interceptor';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AppRoutingModule,
  ],
  providers: [
    // ── MOCK MODE ──────────────────────────────────────────────────────────
    { provide: HTTP_INTERCEPTORS, useClass: MockInterceptor, multi: true },

    // ── REAL MODE (uncomment when backend is ready) ────────────────────────
    // { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
