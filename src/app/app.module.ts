import { NgModule }               from '@angular/core';
import { BrowserModule }           from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule,
         HTTP_INTERCEPTORS }       from '@angular/common/http';

import { AppRoutingModule }  from './app-routing.module';
import { AppComponent }      from './app.component';

// ── REAL BACKEND: JWT interceptor ─────────────────────────────────────────────
import { JwtInterceptor }    from './core/interceptors/jwt.interceptor';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AppRoutingModule,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
