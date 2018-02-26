import { Component, OnInit } from '@angular/core';
import { Http } from '@angular/http';
import { HttpCache } from 'speedray-swagger-utils';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'app';

  constructor(public http: Http, public httpCache: HttpCache) {
    // empty
  }

  ngOnInit() {

    this.httpCache.addInterestedService('https://jsonplaceholder.typicode.com/posts');

    this.http.get('https://jsonplaceholder.typicode.com/posts').subscribe((results) => {
      console.log(results);
      this.http.get('https://jsonplaceholder.typicode.com/posts').subscribe((results1) => {
        console.log(results1);
        this.http.get('https://jsonplaceholder.typicode.com/posts/1').subscribe((results2) => {
          console.log(results1);
        });
      });
    });
    this.http.post('https://jsonplaceholder.typicode.com/posts', { test: 'test value 1'}).subscribe((results) => {
      console.log(results);
      this.http.post('https://jsonplaceholder.typicode.com/posts', { test: 'test value 1'}).subscribe((results1) => {
        console.log(results1);
      });
    });
  }
}
