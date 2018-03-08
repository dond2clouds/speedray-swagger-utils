import { RequestOptions, Headers } from '@angular/http';
import { HttpCacheRequestOptionArgs } from './http-proxy.service';

export interface HttpCacheRequestOptions extends RequestOptions {
    doNotUseCachedResponse?: boolean;
    doNotCacheResponse?: boolean;
}
