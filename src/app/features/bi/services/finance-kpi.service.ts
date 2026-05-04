import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  FinanceKpiResponse,
  FinanceRevenueProfitTrendItem,
  FinanceCashFlowTrendItem,
} from '../models/finance-kpi-response';
@Injectable({
  providedIn: 'root',
})
export class FinanceKpiService {
  private readonly apiUrl = 'http://localhost:8080/api/bi/finance';

  constructor(private http: HttpClient) {}

  getFinanceKpis(startDate: string, endDate: string): Observable<FinanceKpiResponse> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);

    return this.http.get<FinanceKpiResponse>(`${this.apiUrl}/kpis`, { params });
  }
  getRevenueProfitTrend(
    startDate: string,
    endDate: string,
  ): Observable<FinanceRevenueProfitTrendItem[]> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);

    return this.http.get<FinanceRevenueProfitTrendItem[]>(`${this.apiUrl}/revenue-profit-trend`, {
      params,
    });
  }
  getCashFlowTrend(startDate: string, endDate: string): Observable<FinanceCashFlowTrendItem[]> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);

    return this.http.get<FinanceCashFlowTrendItem[]>(`${this.apiUrl}/cash-flow-trend`, { params });
  }
}
