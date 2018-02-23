import { TestBed, inject } from '@angular/core/testing';
import { HttpCache, HttpProxy } from './index';
import { Http, BaseRequestOptions, Response, ResponseOptions, XHRBackend, RequestMethod } from '@angular/http';
import { MockBackend, MockConnection } from '@angular/http/testing';
import { ReflectiveInjector } from '@angular/core';

describe('Test HttpProxy service', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [MockBackend, BaseRequestOptions, HttpCache, HttpProxy,
        {
          provide: Http,
          deps: [MockBackend, BaseRequestOptions, HttpCache],
          useFactory: (backend: MockBackend, options: BaseRequestOptions, httpCache: HttpCache) => {
            return new HttpProxy(backend, options, httpCache);
          }
        },
      ]
    });
  });

  it('cached response for all methods handled', inject([Http, HttpCache, MockBackend], (http: Http, httpCache: HttpCache,
                                                                                        mockBackend: MockBackend) => {
    let counter = 0;
    ((http as HttpProxy).getBackend() as MockBackend).connections.subscribe((connection: MockConnection) => {
      connection.mockRespond(new Response(new ResponseOptions({status: 200, body: { callCounter: counter++ }})));
    });
    expect(http).toBeTruthy();
    expect(httpCache).toBeTruthy();
    httpCache.flush();
    httpCache.addInterestedService('http://www.mock.com/test-service-one');
    http.get('http://www.mock.com/test-service-one').subscribe((results) => {
        expect(results.ok).toBeTruthy();
    });
    http.get('http://www.mock.com/test-service-one').subscribe((results) => {
        expect(results.ok).toBeTruthy();
        expect(results.json().callCounter).toBe(0);
    });
    http.post('http://www.mock.com/test-service-one', { request: 'this is a post request' }).subscribe((results) => {
        expect(results.ok).toBeTruthy();
        expect(results.json().callCounter).toBe(1);
    });
    http.post('http://www.mock.com/test-service-one', { request: 'this is a post request' }).subscribe((results) => {
        expect(results.ok).toBeTruthy();
        expect(results.json().callCounter).toBe(1);
    });
    http.request('http://www.mock.com/test-service-one',
        { method: 'post', body: { request: 'this is a post request' } }).subscribe((results) => {
        expect(results.ok).toBeTruthy();
        expect(results.json().callCounter).toBe(2);
    });
  }));

  it('Force walking null handlers', inject([Http, HttpCache], (http: Http, httpCache: HttpCache) => {
    http.request('http://www.mock.com/test-service-one');
    httpCache.isServiceCacheable('http://www.mock.com/test-service-one');
  }));

  it('non cached response for method handled', inject([Http, HttpCache, MockBackend], (http: Http, httpCache: HttpCache,
                                                                                       mockBackend: MockBackend) => {
    let counter = 0;
    ((http as HttpProxy).getBackend() as MockBackend).connections.subscribe((connection: MockConnection) => {
      connection.mockRespond(new Response(new ResponseOptions({status: 200, body: { callCounter: counter++ }})));
    });
    expect(http).toBeTruthy();
    expect(httpCache).toBeTruthy();
    httpCache.flush();
    httpCache.addInterestedService('http://www.mock.com/test-service-one',
                                   ['put', 'delete', RequestMethod.Head, 'head', 'options', 'post', 'patch']);
    http.get('http://www.mock.com/test-service-one').subscribe((results) => {
      expect(results.ok).toBeTruthy();
    });
    http.get('http://www.mock.com/test-service-one').subscribe((results) => {
      expect(results.ok).toBeTruthy();
      expect(results.json().callCounter).toBe(1);
    });
  }));

  it('handle put correctly with multiple bodies', inject([Http, HttpCache, MockBackend], (http: Http, httpCache: HttpCache,
                                                                                          mockBackend: MockBackend) => {
    let counter = 0;
    ((http as HttpProxy).getBackend() as MockBackend).connections.subscribe((connection: MockConnection) => {
      connection.mockRespond(new Response(new ResponseOptions({status: 200, body: { callCounter: counter++ }})));
    });
    expect(http).toBeTruthy();
    expect(httpCache).toBeTruthy();
    httpCache.flush();
    httpCache.addInterestedService('http://www.mock.com/test-service-one');
    http.post('http://www.mock.com/test-service-one', { test: 1}).subscribe((results) => {
      expect(results.ok).toBeTruthy();
      expect(results.json().callCounter).toBe(0);
    });
    http.post('http://www.mock.com/test-service-one', { test: 2}).subscribe((results) => {
      expect(results.ok).toBeTruthy();
      expect(results.json().callCounter).toBe(1);
    });
    http.post('http://www.mock.com/test-service-one', { test: 2}).subscribe((results) => {
      expect(results.ok).toBeTruthy();
      expect(results.json().callCounter).toBe(1);
    });
    http.post('http://www.mock.com/test-service-one', { test: 1}).subscribe((results) => {
      expect(results.ok).toBeTruthy();
      expect(results.json().callCounter).toBe(0);
    });
  }));

  it('Invalid method registration', inject([Http, HttpCache, MockBackend], (http: Http, httpCache: HttpCache,
                                                                            mockBackend: MockBackend) => {
    let counter = 0;
    ((http as HttpProxy).getBackend() as MockBackend).connections.subscribe((connection: MockConnection) => {
      connection.mockRespond(new Response(new ResponseOptions({status: 200, body: { callCounter: counter++ }})));
    });
    expect(http).toBeTruthy();
    expect(httpCache).toBeTruthy();
    httpCache.flush();
    httpCache.addInterestedService('http://www.mock.com/test-service-one', ['get', 'somethingbad']);
    http.get('http://www.mock.com/test-service-one').subscribe((results) => {
      expect(results.ok).toBeTruthy();
      expect(results.json().callCounter).toBe(0);
    });
    http.get('http://www.mock.com/test-service-one').subscribe((results) => {
      expect(results.ok).toBeTruthy();
      expect(results.json().callCounter).toBe(1);
    });
    expect(() => { http.request('http://www.mock.com/test-service-one', { method: 'somethingbad'}); } )
      .toThrow();
  }));
});
