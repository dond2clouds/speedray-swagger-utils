import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/observable';
import { Http, XHRBackend, ConnectionBackend, RequestOptions, RequestOptionsArgs,
    Response, Headers, URLSearchParams, RequestMethod, Request } from '@angular/http';
import { HttpCache } from './http-cache.service';
import 'rxjs/add/operator/map';
import { inherits } from 'util';
import { HttpCacheRequestOptions } from './http-cache-request-options';

export function httpFactory(backend: XHRBackend, options: RequestOptions, httpCache: HttpCache): HttpProxy {
    return new HttpProxy(backend, options, httpCache);
}

export const HTTP_FACTORY_DEPENDENCIES = [XHRBackend, RequestOptions, HttpCache];

export interface HttpCacheRequestOptionArgs extends RequestOptionsArgs {
    doNotUseCachedResponse?: boolean;
    doNotCacheResponse?: boolean;
}

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

    public request(url: string | Request, options?: HttpCacheRequestOptionArgs): Observable<Response> {
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

    public get(url: string, options?: HttpCacheRequestOptionArgs): Observable<Response> {
        return this.request(new Request(this.mergeOptions(this._defaultOptions, options, RequestMethod.Get, url)) as any, options);
    }

    public post(url: string, body: any, options?: HttpCacheRequestOptionArgs): Observable<Response> {
        return this.request(new Request(this.mergeOptions(this._defaultOptions.merge({ body: body }), options,
                            RequestMethod.Post, url)) as any);
    }

    public put(url: string, body: any, options?: HttpCacheRequestOptionArgs): Observable<Response> {
        return this.request(new Request(this.mergeOptions(this._defaultOptions.merge({ body: body }), options,
                            RequestMethod.Put, url)) as any, options);
    }

    public delete(url: string, options?: HttpCacheRequestOptionArgs): Observable<Response> {
        return this.request(new Request(this.mergeOptions(this._defaultOptions,
                             options, RequestMethod.Put, url)) as any, options);
    }

    public patch(url: string, body: any, options?: HttpCacheRequestOptionArgs): Observable<Response> {
        return this.request(new Request(this.mergeOptions(this._defaultOptions.merge({ body: body }),
                             options, RequestMethod.Patch, url)) as any, options);
    }

    public head(url: string, options?: HttpCacheRequestOptionArgs): Observable<Response> {
        return this.request(new Request(this.mergeOptions(this._defaultOptions,
                             options, RequestMethod.Head, url)) as any, options);
    }

    public options(url: string, options?: HttpCacheRequestOptionArgs): Observable<Response> {
        return this.request(new Request(this.mergeOptions(this._defaultOptions,
                             options, RequestMethod.Options, url)) as any, options);
    }

    private mergeOptions(defaultOpts: HttpCacheRequestOptions, providedOpts: HttpCacheRequestOptionArgs, method: string | RequestMethod,
                         url: string): HttpCacheRequestOptions {
        const newOptions = defaultOpts;
        if (providedOpts) {
            return (newOptions.merge({
                method: providedOpts.method || method,
                url: providedOpts.url || url,
                search: providedOpts.search,
                params: providedOpts.params,
                headers: providedOpts.headers,
                body: providedOpts.body,
                withCredentials: providedOpts.withCredentials,
                responseType: providedOpts.responseType
            }));
        }
        return (newOptions.merge(new RequestOptions({ method: method, url: url })));
    }
}
