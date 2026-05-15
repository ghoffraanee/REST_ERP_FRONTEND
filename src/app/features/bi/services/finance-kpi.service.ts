import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  FinanceKpiResponse,
  FinanceRevenueProfitTrendItem,
  FinanceCashFlowTrendItem,
  FinanceOutstandingInvoiceItem,
  FinanceLiabilityAssetItem,
  FinanceAssetDistributionItem,
  FinanceComplianceSummaryResponse,
} from '../models/finance-kpi-response';

export interface FinanceFilters {
  customerName?: string | null;
  customerCategory?: string | null;

  vendorName?: string | null;
  vendorIndustry?: string | null;

  invoiceStatus?: string | null;
  statusGroup?: string | null;

  accountName?: string | null;
  accountType?: string | null;
  transactionType?: string | null;

  assetType?: string | null;

  minAmount?: number | null;
  maxAmount?: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class FinanceKpiService {
  private readonly apiUrl = 'http://localhost:8080/api/bi/finance';

  constructor(private http: HttpClient) {}

  private buildParams(startDate?: string, endDate?: string, filters?: FinanceFilters): HttpParams {
    let params = new HttpParams();

    if (startDate) {
      params = params.set('startDate', startDate);
    }

    if (endDate) {
      params = params.set('endDate', endDate);
    }

    if (filters?.customerName) {
      params = params.set('customerName', filters.customerName);
    }

    if (filters?.customerCategory) {
      params = params.set('customerCategory', filters.customerCategory);
    }

    if (filters?.vendorName) {
      params = params.set('vendorName', filters.vendorName);
    }

    if (filters?.vendorIndustry) {
      params = params.set('vendorIndustry', filters.vendorIndustry);
    }

    if (filters?.invoiceStatus) {
      params = params.set('invoiceStatus', filters.invoiceStatus);
    }

    if (filters?.statusGroup) {
      params = params.set('statusGroup', filters.statusGroup);
    }

    if (filters?.accountName) {
      params = params.set('accountName', filters.accountName);
    }

    if (filters?.accountType) {
      params = params.set('accountType', filters.accountType);
    }

    if (filters?.transactionType) {
      params = params.set('transactionType', filters.transactionType);
    }

    if (filters?.assetType) {
      params = params.set('assetType', filters.assetType);
    }

    if (filters?.minAmount !== null && filters?.minAmount !== undefined) {
      params = params.set('minAmount', String(filters.minAmount));
    }

    if (filters?.maxAmount !== null && filters?.maxAmount !== undefined) {
      params = params.set('maxAmount', String(filters.maxAmount));
    }

    return params;
  }

  getFinanceKpis(
    startDate: string,
    endDate: string,
    filters?: FinanceFilters,
  ): Observable<FinanceKpiResponse> {
    const params = this.buildParams(startDate, endDate, filters);

    return this.http.get<FinanceKpiResponse>(`${this.apiUrl}/kpis`, { params });
  }

  getRevenueProfitTrend(
    startDate: string,
    endDate: string,
    filters?: FinanceFilters,
  ): Observable<FinanceRevenueProfitTrendItem[]> {
    const params = this.buildParams(startDate, endDate, filters);

    return this.http.get<FinanceRevenueProfitTrendItem[]>(`${this.apiUrl}/revenue-profit-trend`, {
      params,
    });
  }

  getCashFlowTrend(
    startDate: string,
    endDate: string,
    filters?: FinanceFilters,
  ): Observable<FinanceCashFlowTrendItem[]> {
    const params = this.buildParams(startDate, endDate, filters);

    return this.http.get<FinanceCashFlowTrendItem[]>(`${this.apiUrl}/cash-flow-trend`, { params });
  }

  getTopOutstandingInvoices(
    startDate: string,
    endDate: string,
    filters?: FinanceFilters,
  ): Observable<FinanceOutstandingInvoiceItem[]> {
    const params = this.buildParams(startDate, endDate, filters);

    return this.http.get<FinanceOutstandingInvoiceItem[]>(
      `${this.apiUrl}/top-outstanding-invoices`,
      { params },
    );
  }

  getLiabilityVsAssets(
    startDate: string,
    endDate: string,
    filters?: FinanceFilters,
  ): Observable<FinanceLiabilityAssetItem> {
    const params = this.buildParams(startDate, endDate, filters);

    return this.http.get<FinanceLiabilityAssetItem>(`${this.apiUrl}/liability-vs-assets`, {
      params,
    });
  }

  getAssetDistribution(
    endDate: string,
    filters?: FinanceFilters,
  ): Observable<FinanceAssetDistributionItem[]> {
    const params = this.buildParams(undefined, endDate, filters);

    return this.http.get<FinanceAssetDistributionItem[]>(`${this.apiUrl}/asset-distribution`, {
      params,
    });
  }

  getComplianceSummary(
    startDate: string,
    endDate: string,
    filters?: FinanceFilters,
  ): Observable<FinanceComplianceSummaryResponse> {
    const params = this.buildParams(startDate, endDate, filters);

    return this.http.get<FinanceComplianceSummaryResponse>(`${this.apiUrl}/compliance-summary`, {
      params,
    });
  }
}
