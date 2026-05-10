import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  OverviewKpiResponse,
  OverviewFinancialTrendItem,
  OverviewCashSummaryItem,
  OverviewPipelineFunnelItem,
  OverviewDealStatusItem,
  OverviewTopSalespersonItem,
  OverviewAttendanceTrendItem,
  OverviewDepartmentDistributionItem,
  OverviewCustomerRetentionItem,
  OverviewTopCustomerItem,
  OverviewOperationalAlertItem,
  OverviewExecutiveLedgerItem,
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

  getSalesPipelineFunnel(
    startDate: string,
    endDate: string,
  ): Observable<OverviewPipelineFunnelItem[]> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);

    return this.http.get<OverviewPipelineFunnelItem[]>(`${this.apiUrl}/sales-pipeline-funnel`, {
      params,
    });
  }

  getDealStatus(startDate: string, endDate: string): Observable<OverviewDealStatusItem[]> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);

    return this.http.get<OverviewDealStatusItem[]>(`${this.apiUrl}/deal-status`, { params });
  }

  getTopSalesPerformers(
    startDate: string,
    endDate: string,
  ): Observable<OverviewTopSalespersonItem[]> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);

    return this.http.get<OverviewTopSalespersonItem[]>(`${this.apiUrl}/top-sales-performers`, {
      params,
    });
  }
  getAttendanceTrend(
    startDate: string,
    endDate: string,
  ): Observable<OverviewAttendanceTrendItem[]> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);

    return this.http.get<OverviewAttendanceTrendItem[]>(`${this.apiUrl}/attendance-trend`, {
      params,
    });
  }

  getDepartmentDistribution(): Observable<OverviewDepartmentDistributionItem[]> {
    return this.http.get<OverviewDepartmentDistributionItem[]>(
      `${this.apiUrl}/department-distribution`,
    );
  }

  getCustomerRetention(): Observable<OverviewCustomerRetentionItem> {
    return this.http.get<OverviewCustomerRetentionItem>(`${this.apiUrl}/customer-retention`);
  }

  getTopCustomersByRevenue(
    startDate: string,
    endDate: string,
  ): Observable<OverviewTopCustomerItem[]> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);

    return this.http.get<OverviewTopCustomerItem[]>(`${this.apiUrl}/top-customers-revenue`, {
      params,
    });
  }

  getOperationalAlerts(
    startDate: string,
    endDate: string,
  ): Observable<OverviewOperationalAlertItem[]> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);

    return this.http.get<OverviewOperationalAlertItem[]>(`${this.apiUrl}/operational-alerts`, {
      params,
    });
  }
  getExecutiveLedger(
    startDate: string,
    endDate: string,
  ): Observable<OverviewExecutiveLedgerItem[]> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);

    return this.http.get<OverviewExecutiveLedgerItem[]>(`${this.apiUrl}/executive-ledger`, {
      params,
    });
  }
}
