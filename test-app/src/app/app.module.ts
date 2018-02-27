import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpCache, HttpProxy, OpenApiUtilsModule } from '@speedray/openapi-utils';
import { HttpModule, Http, XHRBackend, RequestOptions } from '@angular/http';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    HttpModule,
    OpenApiUtilsModule.forRoot()
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
