import { Injectable } from '@angular/core';
import { Api } from './api';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TokenApiService extends Api {
  constructor() {
    super();
  }

  /**
   * Method used to get all infos of a token
   * @param contractAddress The contract address of the token
   * @returns The infos about the token
   */
  public getToken(contractAddress: string) {
    return this.get(environment.apiUrl + '/tokens/' + contractAddress);
  }
}
