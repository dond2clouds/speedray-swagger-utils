import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { SwaggerUtilsModule, HttpCache, HttpProxy } from 'speedray-swagger-utils';
import { HttpModule, Http, XHRBackend, RequestOptions } from '@angular/http';
import { AppComponent } from './app.component';

export function httpFactory(backend: XHRBackend, options: RequestOptions, httpCache: HttpCache): HttpProxy {
  return new HttpProxy(backend, options, httpCache);
}

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    HttpModule,
    SwaggerUtilsModule,
  ],
  providers: [{ provide: Http, useFactory: httpFactory, deps: [XHRBackend, RequestOptions, HttpCache] },],
  bootstrap: [AppComponent]
})
export class AppModule { }
