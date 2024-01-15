import { TestBed } from '@angular/core/testing';

import { TokenPriceApiService } from './token-price-api.service';

describe('TokenPriceApiService', () => {
  let service: TokenPriceApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TokenPriceApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
