import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/observable';
import { RequestOptionsArgs, Request, RequestMethod, Response, ResponseOptions, RequestOptions } from '@angular/http';
import { HttpCacheRequestOptionArgs } from './http-proxy.service';
import { isNullOrUndefined } from 'util';

interface HttpCacheConfig {
    ttl: number;
    ttlCheckInterval: number;
}

interface HttpCacheEntry {
    created: number;
    response: Response;
}

const ALL_DOTS_REGEX = new RegExp('\\.', 'g');
export const HTTP_CACHE_CONFIG_KEY = 'com.xtivia.speedray.http.cache.config';
export const HTTP_CACHE_ENTRY_KEY = 'com.xtivia.speedray.http.cache.entry.';
export const HTTP_CACHE_SERVICE_KEY = 'com.xtivia.speedray.http.cache.service.';
export const HTTP_CACHE_ENTRY_REGEX = new RegExp(HTTP_CACHE_ENTRY_KEY.replace(ALL_DOTS_REGEX, '\\.'));
export const HTTP_CACHE_SERVICE_REGEX = new RegExp(HTTP_CACHE_SERVICE_KEY.replace(ALL_DOTS_REGEX, '\\.'));

@Injectable()
export class HttpCache {

    public static setTtl(ttl: number) {
        HttpCache.config.ttl = ttl;
    }

    public static setTtlCheckInterval(ttlCheckInterval: number) {
        HttpCache.config.ttlCheckInterval = ttlCheckInterval;
        if (HttpCache.ttlTimer) {
            clearInterval(HttpCache.ttlTimer);
        }
        HttpCache.ttlTimer = HttpCache.startTtlCheckTimer();
    }

    public static flush() {
        Object.keys(sessionStorage)
            .forEach((key) => {
                if (HTTP_CACHE_ENTRY_REGEX.test(key)) {
                    sessionStorage.removeItem(key);
                }
            });
    }

    public static flushServices() {
        Object.keys(sessionStorage)
            .forEach((key) => {
                if (HTTP_CACHE_SERVICE_REGEX.test(key)) {
                    sessionStorage.removeItem(key);
                }
            });
    }

    private static config: HttpCacheConfig = HttpCache.getConfig() || {
        ttl: 360000,
        ttlCheckInterval: 5000
    };

    private static ttlTimer = HttpCache.startTtlCheckTimer();

    private static startTtlCheckTimer() {
        return setInterval(() => {
            Object.keys(sessionStorage).forEach((key) => {
                if (HTTP_CACHE_ENTRY_REGEX.test(key)) {
                    const entry = JSON.parse(sessionStorage.getItem(key)) as HttpCacheEntry;
                    if (entry && entry.created + HttpCache.config.ttl < Date.now()) {
                        sessionStorage.removeItem(key);
                    }
                }
            });
        }, HttpCache.config.ttlCheckInterval);
    }

    private static getConfig(): HttpCacheConfig {
        const conf = sessionStorage.getItem(HTTP_CACHE_CONFIG_KEY);
        if (conf) {
            return JSON.parse(conf);
        }
        return null;
    }

    public lookup(url: string | Request, options: HttpCacheRequestOptionArgs): Response {
        if (!(options && options.doNotUseCachedResponse)) {
            const cacheKey = this.createCacheKey(url, options);
            if (cacheKey) {
                const entry = sessionStorage.getItem(cacheKey.toString());
                if (entry) {
                    const results = JSON.parse(entry) as HttpCacheEntry;
                    if (Date.now() < results.created + HttpCache.config.ttl) {
                        return this.createResponseFromJson(results.response);
                    }
                }

            }
        }
        return null;
    }

    public addInterestedService(url: string, methods?: Array<string|RequestMethod>) {
        const entry = this.getCacheServicesEntry(url, methods);
        if (methods) {
            for ( let i = 0; i < methods.length; i++) {
                const method = this.getMethodForString(methods[i]);
                if (method) {
                    const index = method.valueOf();
                    entry[index] = true;
                }
            }
        } else {
            for ( let i = 0; i < entry.length; i++) {
                entry[i] = true;
            }
        }
        sessionStorage.setItem(HTTP_CACHE_SERVICE_KEY + url.toString(), JSON.stringify(entry));
    }

    public isServiceCacheable(url: string | Request, options?: HttpCacheRequestOptionArgs): boolean {
        const urlKey = url ? typeof url === 'string' ? url.toString() : (url as Request).url.toString() : null;
        const serviceEntry = sessionStorage.getItem(HTTP_CACHE_SERVICE_KEY + urlKey);
        const service = serviceEntry ? JSON.parse(serviceEntry) : null;
        const methodValue = this.getMethodForString(url instanceof Request ? url.method : options ? options.method : null);
        return  !isNullOrUndefined(methodValue) && service && service[methodValue.valueOf()];
    }

    public cacheServiceResponse(url: string | Request, response: Response, options?: HttpCacheRequestOptionArgs) {
        if (!(options && options.doNotCacheResponse) && this.isServiceCacheable(url, options)) {
            const cacheKey = this.createCacheKey(url, options);
            if (cacheKey) {
                sessionStorage.setItem(cacheKey.toString(), JSON.stringify({
                    created: Date.now(),
                    response: response
                }));
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
        let key = '..';
        if (typeof body === 'object') {
            body = JSON.stringify(body);
        }
        if (typeof body === 'string') {
            key = '.' + body.length;
            key += '.' + this.hashString(body);
        }
        return key;
    }

    private createCacheKey(url: string | Request, options: HttpCacheRequestOptionArgs): string {
        let key = HTTP_CACHE_ENTRY_KEY;
        const method = this.getMethod(url, options);
        if (isNullOrUndefined(method)) {
            return null;
        }
        key += method;
        key += this.createCacheKeyBody(this.getBody(url, options));
        key += '.' + this.getUrl(url);
        return key;
    }

    private getUrl(url: string | Request): string {
        return typeof url === 'string' ? url : url.url;
    }

    private getMethod(url: string | Request, options?: HttpCacheRequestOptionArgs): RequestMethod {
        if (typeof url === 'string') {
            return options ? this.getMethodForString(options.method) : null;
        }
        return this.getMethodForString(url.method);
    }

    private getBody(url: string | Request, options?: HttpCacheRequestOptionArgs): string {
        if (typeof url === 'string') {
            return options ? options.body : null;
        }
        return (url as Request).text();
    }

    private getCacheServicesEntry(url: string, methods?: Array<string|RequestMethod>): boolean[] {
        const serviceEntry = sessionStorage.getItem(HTTP_CACHE_SERVICE_KEY + url.toString());
        const entryMethods = serviceEntry ? JSON.parse(serviceEntry) : [false, false, false, false, false, false, false];
        if (methods) {
            methods.forEach((method) => {
                if (typeof method === 'string') {
                    const methodValue = this.getMethodForString(method);
                    if (methodValue) {
                        entryMethods[methodValue.valueOf()] = true;
                    } else {
                        return null;
                    }
                } else {
                    entryMethods[method.valueOf()] = true;
                }
            });
        } else {
            for (let i = 0; i < entryMethods.length; i++) {
                entryMethods[i]  = true;
            }
        }
        return entryMethods;
    }

    private createResponseFromJson(object: any): Response {
        const response = object ? new Response(new ResponseOptions({
            body: object._body,
            status: object.status,
            headers: object.headers,
            url: object.url
        })) : null;
        return response;
    }
}
