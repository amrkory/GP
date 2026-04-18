import { NgModule }               from '@angular/core';
import { BrowserModule }           from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule,
         HTTP_INTERCEPTORS }       from '@angular/common/http';

import { AppRoutingModule }  from './app-routing.module';
import { AppComponent }      from './app.component';
import { JwtInterceptor }    from './core/interceptors/jwt.interceptor';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,  // Required by Angular Material
    HttpClientModule,
    AppRoutingModule,
  ],
  providers: [
    {
      provide:  HTTP_INTERCEPTORS,
      useClass: JwtInterceptor,
      multi:    true,           // Stacks with any other interceptors
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
