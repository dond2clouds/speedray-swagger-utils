import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/observable';
import { RequestOptionsArgs, Request, RequestMethod, Response } from '@angular/http';
import { isNullOrUndefined } from 'util';

export interface HttpCacheEntry {
    results: Response;
}

export interface HttpCacheEntries {
    [key: string]: HttpCacheEntry;
}

export interface HttpCacheServiceEntry {
    url: string;
    methods: boolean[];
}

export interface HttpCacheServices {
    [key: string]: HttpCacheServiceEntry;
}

@Injectable()
export class HttpCache {

    public flush() {
        delete window['com_xtivia_speedray_http_cache'];
    }

    public lookup(url: string | Request, options: RequestOptionsArgs): Response {
        const entries = this.getCache().cache;
        const cacheKey = this.createCacheKey(url, options);
        if (cacheKey) {
            const entry = entries[cacheKey];
            if (entry) {
                return entry.results;
            }
        }
        return null;
    }

    public addInterestedService(url: string, methods?: Array<string|RequestMethod>) {
        const services = this.getCache().services;
        const service = services[url];
        const entry = this.getCacheServicesEntry(url, methods);
        if (service) {
            for ( let i = 0; i < service.methods.length; i++) {
                service.methods[i] = service.methods[i] || entry.methods[i];
            }
        } else {
            services[url] = entry;
        }
    }

    public isServiceCacheable(url: string | Request, options?: RequestOptionsArgs): boolean {
        const service = this.getCache().services[this.getUrl(url)];
        const methodValue = this.getMethodForString(url instanceof Request ? url.method : options ? options.method : null);
        return  !isNullOrUndefined(methodValue) && service && service.methods && service.methods[methodValue.valueOf()];
    }

    public cacheServiceResponse(url: string | Request, response: Response, options?: RequestOptionsArgs) {
        if (this.isServiceCacheable(url, options)) {
            const entries = this.getCache().cache;
            const cacheKey = this.createCacheKey(url, options);
            if (cacheKey) {
                entries[cacheKey] = {
                    results: response
                };
            }
        }
    }

    private hashString(value: string): number {
        let hash = 0;
        if (value === null || value === undefined || value.length === 0) {
            return hash;
        }
        for (let i = 0; i < value.length; i++) {
            hash  = hash * 31 + value.charCodeAt(i);
            hash  = hash & hash;
        }
        return hash;
    }

    private getCache(): HttpCacheEntries {
        let cache = window['com_xtivia_speedray_http_cache'];
        if (cache === undefined || cache === null) {
            cache = window['com_xtivia_speedray_http_cache'] = {
                cache: {},
                services: {}
            };
        }
        return cache;
    }

    private getMethodForString(method: string|RequestMethod): RequestMethod {
        if (typeof method === 'string') {
            switch (method.toUpperCase()) {
                case 'GET':
                    return RequestMethod.Get;
                case 'PUT':
                    return RequestMethod.Put;
                case 'POST':
                    return RequestMethod.Post;
                case 'DELETE':
                    return RequestMethod.Delete;
                case 'PATCH':
                    return RequestMethod.Patch;
                case 'HEAD':
                    return RequestMethod.Head;
                case 'OPTIONS':
                    return RequestMethod.Options;
                default:
                    return null;
            }
        }
        return method;
    }

    private createCacheKeyBody(body: any) {
        let key = '::';
        if (typeof body === 'object') {
            body = JSON.stringify(body);
        }
        if (typeof body === 'string') {
            key = ':' + body.length;
            key += ':' + this.hashString(body);
        }
        return key;
    }

    private createCacheKey(url: string | Request, options: RequestOptionsArgs): string {
        let key = '';
        const method = this.getMethod(url, options);
        if (isNullOrUndefined(method)) {
            return null;
        }
        key += method;
        key += this.createCacheKeyBody(this.getBody(url, options));
        key += ':' + this.getUrl(url);
        return key;
    }

    private getUrl(url: string | Request): string {
        return typeof url === 'string' ? url : url.url;
    }

    private getMethod(url: string | Request, options?: RequestOptionsArgs): RequestMethod {
        if (typeof url === 'string') {
            return options ? this.getMethodForString(options.method) : null;
        }
        return this.getMethodForString(url.method);
    }

    private getBody(url: string | Request, options?: RequestOptionsArgs): string {
        if (typeof url === 'string') {
            return options ? options.body : null;
        }
        return (url as Request).text();
    }

    private getCacheServicesEntry(url: string, methods?: Array<string|RequestMethod>): HttpCacheServiceEntry {
        const entry = {
            url: url,
            methods: [false, false, false, false, false, false, false],
        };
        if (methods) {
            methods.forEach((method) => {
                if (typeof method === 'string') {
                    const methodValue = this.getMethodForString(method);
                    if (methodValue) {
                        entry.methods[methodValue.valueOf()] = true;
                    } else {
                        return null;
                    }
                } else {
                    entry.methods[method.valueOf()] = true;
                }
            });
        } else {
            for (let i = 0; i < entry.methods.length; i++) {
                entry.methods[i]  = true;
            }
        }
        return entry;
    }

}
