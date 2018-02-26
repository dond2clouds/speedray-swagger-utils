import { NgModule } from '@angular/core';
import { HttpProxy, HttpCache } from './services';
import { Http, XHRBackend, RequestOptions } from '@angular/http';

export function httpFactory(backend: XHRBackend, options: RequestOptions, httpCache: HttpCache): HttpProxy {
  return new HttpProxy(backend, options, httpCache);
}

@NgModule({
  providers: [
    HttpProxy,
    HttpCache,
    { provide: Http, useFactory: httpFactory, deps: [XHRBackend, RequestOptions, HttpCache] },
  ]
})
export class SwaggerUtilsModule {
}
