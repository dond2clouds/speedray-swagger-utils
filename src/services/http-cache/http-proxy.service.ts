import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/observable';
import { Http, XHRBackend, ConnectionBackend, RequestOptions, RequestOptionsArgs,
    Response, Headers, URLSearchParams, RequestMethod } from '@angular/http';
import { HttpCache } from './http-cache.service';
import 'rxjs/add/operator/map';

export function httpFactory(backend: XHRBackend, options: RequestOptions, httpCache: HttpCache): HttpProxy {
    return new HttpProxy(backend, options, httpCache);
}

export const HTTP_FACTORY_DEPENDENCIES = [XHRBackend, RequestOptions, HttpCache];

@Injectable()
export class HttpProxy extends Http {
    protected backend: ConnectionBackend;

    constructor(backend: ConnectionBackend, defaultOptions: RequestOptions,
                private httpCache: HttpCache) {
        super(backend, defaultOptions);
        this.backend = backend;
    }

    public getBackend(): ConnectionBackend {
        return this.backend;
    }

    public request(url: string, options?: RequestOptionsArgs): Observable<Response> {
        const results = this.httpCache.lookup(url, options);
        if (results) {
            return new Observable<Response>((observer) => {
                observer.next(results);
            });
        }
        return super.request(url, options).map((response) => {
            this.httpCache.cacheServiceResponse(url, response, options);
            return response;
        });
    }
}
