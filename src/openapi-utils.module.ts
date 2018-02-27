import { NgModule, ModuleWithProviders } from '@angular/core';
import { HttpProxy, HttpCache, httpFactory, HTTP_FACTORY_DEPENDENCIES } from './services';
import { Http, XHRBackend, RequestOptions } from '@angular/http';

@NgModule({
})
export class OpenApiUtilsModule {
  public static forRoot() {
    return {
      ngModule: OpenApiUtilsModule,
      providers: [
        HttpCache,
        HttpProxy,
        { provide: Http, useFactory: httpFactory, deps: HTTP_FACTORY_DEPENDENCIES }
      ]
    };
  }
}
