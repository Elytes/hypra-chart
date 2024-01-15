import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Api {
  public httpClient = inject(HttpClient);
  constructor() {}

  public get(url: string) {
    return this.httpClient.get(url, {
      params: {
        // Easy fix of Angular's caching issue
        cache: Math.random(),
      },
    });
  }
}
