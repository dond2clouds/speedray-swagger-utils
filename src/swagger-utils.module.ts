import { NgModule } from '@angular/core';
import { HttpProxy, HttpCache } from './services';
import { HttpModule, Http, XHRBackend, RequestOptions } from '@angular/http';

export function HttpFactory(backend: XHRBackend, options: RequestOptions,
                            httpCache: HttpCache): HttpProxy {
  return new HttpProxy(backend, options, httpCache);
}

@NgModule({
  providers: [
    HttpProxy,
    HttpCache,
    {
         provide: Http,
         deps: [XHRBackend, RequestOptions, HttpCache],
         useFactory: HttpProxy
    }
  ],
  declarations: [
  ],
  exports: [
  ]
})
export class SwaggerUtilsModule {
}
