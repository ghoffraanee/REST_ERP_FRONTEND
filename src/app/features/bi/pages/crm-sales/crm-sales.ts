import {
  Component, ElementRef, OnInit, OnDestroy,
  ViewChild, inject, signal, computed
} from '@angular/core';
import { Chart, registerables, ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

import { PageFilters } from '../../../../layout/page-filters/page-filters';
import { SectionTitleComponent } from '../../components/section-title/section-title';
import { KpiCardComponent } from '../../components/kpi-card/kpi-card';
import { SalesService } from '../../services/sales.service';
import { SalesKpiResponse } from '../../models/sales-kpi-response';

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface KpiCard {
  title: string;
  value: string;
  trend: string;
  icon: string;
  trendType: 'positive' | 'negative';
}

interface RegionalConversion {
  region: string;
  value: string;
  trend: string;
  progress: number;
  trendType: 'positive' | 'negative';
}

interface TopSale {
  name: string;
  amount: string;
}

interface SalesOrder {
  id: string;
  customer: string;
  date: string;
  amount: string;
  status: string;
}

interface HighValueDeal {
  name: string;
  value: string;
}

// ─── Constantes ──────────────────────────────────────────────────────────────

const REGIONAL_CONVERSIONS: RegionalConversion[] = [
  { region: 'North America', value: '24.5%', trend: '+1.2%', progress: 78, trendType: 'positive' },
  { region: 'Europe / EMEA',  value: '18.2%', trend: '+0.5%', progress: 58, trendType: 'positive' },
  { region: 'Asia Pacific',   value: '21.8%', trend: '-2.1%', progress: 66, trendType: 'negative' },
  { region: 'Latin America',  value: '14.9%', trend: '+3.4%', progress: 46, trendType: 'positive' },
];

const CHART_DEFAULTS = {
  primaryColor:   '#5b61f6',
  secondaryColor: '#c9c5f7',
  amberColor:     '#f59e0b',
  greenColor:     '#10b981',
  greenAlpha:     'rgba(16,185,129,0.2)',
} as const;

// ─── Composant ───────────────────────────────────────────────────────────────

Chart.register(...registerables);

@Component({
  selector: 'app-crm-sales',
  standalone: true,
  imports: [PageFilters, SectionTitleComponent, KpiCardComponent, BaseChartDirective, CommonModule],
  templateUrl: './crm-sales.html',
  styleUrl: './crm-sales.css',
})
export class CrmSalesComponent implements OnInit, OnDestroy {

  // ── Refs & DI ──────────────────────────────────────────────────────────────
  @ViewChild('dashboardContent', { static: false }) dashboardContent!: ElementRef;
  private readonly salesService = inject(SalesService);
  private readonly destroy$ = new Subject<void>();

  // ── State ──────────────────────────────────────────────────────────────────
  selectedPeriod: '30days' | '6months' | 'ytd' = '6months';
  startDate = '';
  endDate = '';
  isExportMenuOpen = false;
  isLoading = false;

  // ── Data ───────────────────────────────────────────────────────────────────
  kpis: KpiCard[] = [];
  topSales: TopSale[] = [];
  salesOrders: SalesOrder[] = [];
  highValueDeals: HighValueDeal[] = [];
  readonly regionalConversions: RegionalConversion[] = REGIONAL_CONVERSIONS;

  // ── Chart configs ──────────────────────────────────────────────────────────
  readonly commonChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true, position: 'top' } },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true },
    },
  };

  readonly simpleBarOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: { legend: { display: false } },
    scales: {
      x: { beginAtZero: true, grid: { display: false } },
      y: { grid: { display: false } },
    },
  };

  readonly lineOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: false },
    },
  };

  readonly revenueByProductChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: { legend: { display: false } },
  };

  // ── Chart data (initialisé vide — rempli par les loaders) ──────────────────
  revenueChartType:         'bar'  = 'bar';
  pipelineChartType:        'bar'  = 'bar';
  retentionChartType:       'line' = 'line';
  revenueByProductChartType:'bar'  = 'bar';

  revenueChartData: ChartData<'bar'> = this.emptyBarData('Revenue');
  pipelineChartData: ChartData<'bar'> = this.emptyBarData('Pipeline Deals', CHART_DEFAULTS.amberColor);
  retentionChartData: ChartData<'line'> = this.emptyLineData();
  revenueByProductChartData: ChartData<'bar'> = this.emptyBarData('Revenue by Product');

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.updateDateRange(this.selectedPeriod);
    this.reloadAll();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Période ────────────────────────────────────────────────────────────────

  setPeriod(period: '30days' | '6months' | 'ytd'): void {
    this.selectedPeriod = period;
    this.updateDateRange(period);
    this.reloadAll();
  }

  // ── Reload central ─────────────────────────────────────────────────────────

  /**
   * Centralise tous les appels dépendants de la période.
   * Les appels indépendants (retention, highValueDeals) sont lancés en parallèle.
   */
  private reloadAll(): void {
    this.isLoading = true;

    forkJoin({
      kpis:           this.salesService.getSalesKpis(this.startDate, this.endDate),
      revenueTrend:   this.salesService.getRevenueTrend(this.startDate, this.endDate),
      pipeline:       this.salesService.getPipelineDistribution(),
      topSales:       this.salesService.getTopSalespersons(this.startDate, this.endDate),
      revenueProduct: this.salesService.getRevenueByProduct(this.startDate, this.endDate),
      orders:         this.salesService.getRecentOrders(this.startDate, this.endDate),
      retention:      this.salesService.getCustomerRetention(),
      highDeals:      this.salesService.getHighValueDeals(),
    })
    .pipe(
      takeUntil(this.destroy$),
      finalize(() => (this.isLoading = false)),
    )
    .subscribe({
      next: (results) => {
        this.applySalesKpis(results.kpis);
        this.applyRevenueTrend(results.revenueTrend);
        this.applyPipelineDistribution(results.pipeline);
        this.applyTopSalespersons(results.topSales);
        this.applyRevenueByProduct(results.revenueProduct);
        this.applyRecentOrders(results.orders);
        this.applyCustomerRetention(results.retention);
        this.applyHighValueDeals(results.highDeals);
      },
      error: (err) => console.error('Erreur chargement dashboard sales :', err),
    });
  }

  // ── Appliqueurs de données ─────────────────────────────────────────────────

  private applySalesKpis(data: SalesKpiResponse): void {
    const pos = 'positive' as const;
    const neg = 'negative' as const;

    this.kpis = [
      { title: 'Total Revenue',           value: this.formatCurrency(data.totalRevenue),        trend: '', icon: 'payments',         trendType: pos },
      { title: 'Number of Deals',         value: String(data.numberOfDeals),                    trend: '', icon: 'handshake',         trendType: pos },
      { title: 'Win Rate',                value: `${this.formatNumber(data.winRate)}%`,          trend: '', icon: 'emoji_events',      trendType: pos },
      { title: 'Avg Deal Value',          value: this.formatCurrency(data.averageDealValue),     trend: '', icon: 'monitoring',        trendType: pos },
      { title: 'Sales Orders Count',      value: String(data.salesOrdersCount),                 trend: '', icon: 'shopping_cart',     trendType: pos },
      { title: 'Outstanding Receivables', value: this.formatCurrency(data.outstandingReceivables), trend: '', icon: 'receipt_long',   trendType: neg },
      { title: 'Active Customers',        value: String(data.activeCustomers),                  trend: '', icon: 'groups',            trendType: pos },
      { title: 'Inactive Customers',      value: String(data.inactiveCustomers),                trend: '', icon: 'person_off',        trendType: neg },
      { title: 'Avg Customer Value',      value: this.formatCurrency(data.averageCustomerValue),trend: '', icon: 'paid',              trendType: pos },
      { title: 'Pipeline Deals',          value: String(data.pipelineDealsCount),               trend: '', icon: 'conversion_path',  trendType: pos },
      { title: 'Pipeline Value',          value: this.formatCurrency(data.pipelineValue),       trend: '', icon: 'stacked_line_chart',trendType: pos },
      { title: 'Conversion Rate',         value: `${this.formatNumber(data.conversionRate)}%`,  trend: '', icon: 'trending_up',       trendType: pos },
    ];
  }

  private applyRevenueTrend(data: { label: string; value: number }[]): void {
    this.revenueChartData = {
      labels: data.map(i => i.label),
      datasets: [{ data: data.map(i => i.value), label: 'Revenue' }],
    };
  }

  private applyPipelineDistribution(data: { label: string; value: number }[]): void {
    this.pipelineChartData = {
      labels: data.map(i => i.label),
      datasets: [{ data: data.map(i => i.value), label: 'Pipeline Deals' }],
    };
  }

  private applyTopSalespersons(data: { name: string; amount: number }[]): void {
    this.topSales = data.map(i => ({ name: i.name, amount: this.formatCurrency(i.amount) }));
  }

  private applyRecentOrders(data: { id: string; customer: string; date: string; amount: number; status: string }[]): void {
    this.salesOrders = data.map(i => ({
      id:       i.id,
      customer: i.customer,
      date:     i.date,
      amount:   this.formatCurrency(i.amount),
      status:   i.status,
    }));
  }

  getOrderStatusClass(status: string): string {
  const normalizedStatus = (status || '').toLowerCase();

  if (normalizedStatus === 'close' ) {
    return 'status-close';
  }

  if (normalizedStatus === 'open') {
    return 'status-open';
  }

  return 'status-default';
}

  private applyRevenueByProduct(data: { name: string; amount: number }[]): void {
    this.revenueByProductChartData = {
      labels: data.map(i => i.name),
      datasets: [{ data: data.map(i => i.amount), backgroundColor: CHART_DEFAULTS.primaryColor }],
    };
  }

  private applyCustomerRetention(data: { label: string; value: number }[]): void {
    this.retentionChartData = {
      labels: data.map(i => i.label),
      datasets: [{
        data: data.map(i => i.value),
        label: 'Customer Retention Rate',
        fill: true,
        tension: 0.4,
        borderColor: CHART_DEFAULTS.greenColor,
        backgroundColor: CHART_DEFAULTS.greenAlpha,
      }],
    };
  }

  private applyHighValueDeals(data: { name: string; value: number }[]): void {
    this.highValueDeals = data.map(i => ({ name: i.name, value: this.formatCurrency(i.value) }));
  }

  // ── Utilitaires de date ────────────────────────────────────────────────────

  private updateDateRange(period: '30days' | '6months' | 'ytd'): void {
    const today = new Date();
    let start: Date;

    switch (period) {
      case '30days':  start = new Date(today); start.setDate(today.getDate() - 30);     break;
      case '6months': start = new Date(today); start.setMonth(today.getMonth() - 6);    break;
      case 'ytd':     start = new Date(today.getFullYear(), 0, 1);                       break;
    }

    this.startDate = this.toIsoDate(start);
    this.endDate   = this.toIsoDate(today);
  }

  private toIsoDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // ── Formatage ──────────────────────────────────────────────────────────────

  formatCurrency(value: number | null | undefined): string {
    const n = value ?? 0;
    if (n >= 1e9) return `${this.toShort(n / 1e9)} B DT`;
    if (n >= 1e6) return `${this.toShort(n / 1e6)} M DT`;
    if (n >= 1e3) return `${this.toShort(n / 1e3)} K DT`;
    return `${this.toShort(n)} DT`;
  }

  private toShort(value: number): string {
    return value.toFixed(2).replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1 ');
  }

  formatNumber(value: number | null | undefined): string {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value ?? 0);
  }

  // ── Export ─────────────────────────────────────────────────────────────────

  toggleExportMenu(): void {
    this.isExportMenuOpen = !this.isExportMenuOpen;
  }

  async exportAsPDF(): Promise<void> {
    const element = this.dashboardContent?.nativeElement;
    if (!element) return;

    this.isExportMenuOpen = false;
    await new Promise(r => setTimeout(r, 150));

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#f5f7fb',
    });

    const pdf       = new jsPDF('p', 'mm', 'a4');
    const pageW     = pdf.internal.pageSize.getWidth();
    const pageH     = pdf.internal.pageSize.getHeight();
    const imgW      = pageW;
    const imgH      = (canvas.height * imgW) / canvas.width;
    const imageData = canvas.toDataURL('image/png');

    let remaining = imgH;
    let pos       = 0;

    pdf.addImage(imageData, 'PNG', 0, pos, imgW, imgH);
    remaining -= pageH;

    while (remaining > 0) {
      pos = remaining - imgH;
      pdf.addPage();
      pdf.addImage(imageData, 'PNG', 0, pos, imgW, imgH);
      remaining -= pageH;
    }

    pdf.save('crm-sales-dashboard.pdf');
  }

  exportAsExcel(): void {
    this.isExportMenuOpen = false;
    this.downloadWorkbook('crm-sales-data.xlsx', 'xlsx');
  }

  exportAsCSV(): void {
    this.isExportMenuOpen = false;

    const ws  = XLSX.utils.json_to_sheet(this.buildExportRows());
    const csv = XLSX.utils.sheet_to_csv(ws);
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a   = Object.assign(document.createElement('a'), { href: url, download: 'crm-sales-data.csv' });

    a.click();
    URL.revokeObjectURL(url);
  }

  private downloadWorkbook(filename: string, format: 'xlsx'): void {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(this.buildExportRows()), 'CRM Sales');
    XLSX.writeFile(wb, filename);
  }

  private buildExportRows(): object[] {
    return [
      ...this.kpis.map(i => ({ section: 'KPIs', title: i.title, value: i.value, trend: i.trend })),
      ...this.topSales.map((item, index) => ({
        section: 'Top Sales Representatives',
        rank: index + 1,
        name: item.name,
        amount: item.amount
      })),
      ...this.highValueDeals.map(i => ({ section: 'High Value Deals', name: i.name, value: i.value })),
      ...this.salesOrders.map(i => ({ section: 'Orders and Invoices', ...i })),
      ...this.regionalConversions.map(i => ({ section: 'Regional Conversion Rates', region: i.region, value: i.value, trend: i.trend })),
    ];
  }

  // ── Helpers charts ─────────────────────────────────────────────────────────

  private emptyBarData(label: string, color : string = CHART_DEFAULTS.primaryColor): ChartData<'bar'> {
    return { labels: [], datasets: [{ data: [], label, backgroundColor: color }] };
  }

  private emptyLineData(): ChartData<'line'> {
    return {
      labels: [],
      datasets: [{
        data: [],
        label: 'Customer Retention Rate',
        fill: true,
        tension: 0.4,
        borderColor: CHART_DEFAULTS.greenColor,
        backgroundColor: CHART_DEFAULTS.greenAlpha,
      }],
    };
  }
}