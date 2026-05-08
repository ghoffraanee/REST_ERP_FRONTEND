import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  OverviewKpiResponse,
  OverviewFinancialTrendItem,
  OverviewCashSummaryItem,
} from '../models/overview-kpi-response';
@Injectable({
  providedIn: 'root',
})
export class OverviewKpiService {
  private readonly apiUrl = 'http://localhost:8080/api/bi/overview';

  constructor(private http: HttpClient) {}

  getOverviewKpis(startDate: string, endDate: string): Observable<OverviewKpiResponse> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);

    return this.http.get<OverviewKpiResponse>(`${this.apiUrl}/kpis`, { params });
  }
  getFinancialTrend(startDate: string, endDate: string): Observable<OverviewFinancialTrendItem[]> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);

    return this.http.get<OverviewFinancialTrendItem[]>(`${this.apiUrl}/financial-trend`, {
      params,
    });
  }
  getCashSummary(startDate: string, endDate: string): Observable<OverviewCashSummaryItem> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);

    return this.http.get<OverviewCashSummaryItem>(`${this.apiUrl}/cash-summary`, { params });
  }
}
