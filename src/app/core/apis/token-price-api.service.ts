import { Injectable } from '@angular/core';
import { Api } from './api';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TokenPriceApiService extends Api {
  constructor() {
    super();
  }

  /**
   * Method used to get all the prices of a token
   * @param contractAddress The contract address of the token
   * @returns The array of prices of the token
   */
  public getPrices(contractAddress: string) {
    return this.get(environment.apiUrl + '/token_prices/' + contractAddress);
  }
}
