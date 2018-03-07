import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/observable';
import { RequestOptionsArgs, Request, RequestMethod, Response, ResponseOptions } from '@angular/http';
import { isNullOrUndefined } from 'util';

@Injectable()
export class HttpCache {

    public flush() {
        Object.keys(sessionStorage)
            .forEach((key) => {
                if (/^(com\.xtivia\.speedray\.http\.cache\.entry\.)/.test(key)) {
                    sessionStorage.removeItem(key);
                }
            });
    }

    public flushServices() {
        Object.keys(sessionStorage)
            .forEach((key) => {
                if (/^(com\.xtivia\.speedray\.http\.cache\.service\.)/.test(key)) {
                    sessionStorage.removeItem(key);
                }
            });
    }

    public lookup(url: string | Request, options: RequestOptionsArgs): Response {
        const cacheKey = this.createCacheKey(url, options);
        if (cacheKey) {
            const entry = sessionStorage.getItem('com.xtivia.speedray.http.cache.entry.' + cacheKey.toString());
            if (entry) {
                return this.createResponseFromJson(entry);
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
        }
        sessionStorage.setItem('com.xtivia.speedray.http.cache.service.' + url.toString(), JSON.stringify(entry));
    }

    public isServiceCacheable(url: string | Request, options?: RequestOptionsArgs): boolean {
        const urlKey = url ? typeof url === 'string' ? url.toString() : (url as Request).url.toString() : null;
        const serviceEntry = sessionStorage.getItem('com.xtivia.speedray.http.cache.service.' + urlKey);
        const service = serviceEntry ? JSON.parse(serviceEntry) : null;
        const methodValue = this.getMethodForString(url instanceof Request ? url.method : options ? options.method : null);
        return  !isNullOrUndefined(methodValue) && service && service[methodValue.valueOf()];
    }

    public cacheServiceResponse(url: string | Request, response: Response, options?: RequestOptionsArgs) {
        if (this.isServiceCacheable(url, options)) {
            const cacheKey = this.createCacheKey(url, options);
            if (cacheKey) {
                sessionStorage.setItem('com.xtivia.speedray.http.cache.entry.' + cacheKey.toString(), JSON.stringify(response));
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

    private createCacheKey(url: string | Request, options: RequestOptionsArgs): string {
        let key = 'com.xtivia.speedray.http.cache.entry.';
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

    private getCacheServicesEntry(url: string, methods?: Array<string|RequestMethod>): boolean[] {
        const serviceEntry = sessionStorage.getItem('com.xtivia.speedray.http.cache.service.' + url.toString());
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

    private createResponseFromJson(json: string): Response {
        const jsonObject = json ? JSON.parse(json) : null;
        const response = jsonObject ? new Response(new ResponseOptions({
            body: jsonObject._body,
            status: jsonObject.status,
            headers: jsonObject.headers,
            url: jsonObject.url
        })) : null;
        return response;
    }
}
