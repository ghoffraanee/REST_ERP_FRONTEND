import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Chart, registerables, ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

import { PageFilters } from '../../../../layout/page-filters/page-filters';
import { SectionTitleComponent } from '../../components/section-title/section-title';
import { KpiCardComponent } from '../../components/kpi-card/kpi-card';
import { OverviewKpiService } from '../../services/overview-kpi.service';
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
} from '../../models/overview-kpi-response';
import { RouterLink } from '@angular/router';

Chart.register(...registerables);
type TrendType = 'positive' | 'negative' | 'neutral';

interface OverviewKpiCard {
  title: string;
  value: string;
  trend: string;
  icon: string;
  trendType: TrendType;
}

@Component({
  selector: 'app-overview',
  imports: [SectionTitleComponent, KpiCardComponent, BaseChartDirective, RouterLink],
  templateUrl: './overview.html',
  styleUrl: './overview.css',
  standalone: true,
})
export class OverviewComponent implements OnInit {
  @ViewChild('dashboardContent', { static: false }) dashboardContent!: ElementRef;
  companyCurrency = 'USD';
  isExportMenuOpen = false;
  loadingKpis = false;
  kpiErrorMessage = '';

  selectedPeriod: 'last30days' | 'last6months' | 'yearToDate' = 'last6months';

  startDate = '';
  endDate = '';

  cashBalanceDisplay = '';
  avgMonthlyNetProfitDisplay = '';
  onTimeRateDisplay = '0%';
  lateCheckinsDisplay = '0';
  retentionRateDisplay = '0%';

  cashBalanceBars = [
    { label: 'Inflow', value: '$0', width: 0, color: 'green' },
    { label: 'Outflow', value: '$0', width: 0, color: 'red' },
  ];
  dealStatusLegend: {
    label: string;
    percentage: string;
  }[] = [];

  retentionNote = 'Customer retention based on active customers.';
  constructor(private overviewKpiService: OverviewKpiService) {}

  ngOnInit(): void {
    this.setPeriod('last6months');
  }

  topKpis: OverviewKpiCard[] = [];

  topSalesPerformers: {
    name: string;
    amount: string;
    dealsCount: number;
  }[] = [];

  departmentDistribution: {
    name: string;
    value: number;
  }[] = [];
  customerRevenue = [
    { name: 'Enterprise', value: 92 },
    { name: 'Mid-Market', value: 64 },
    { name: 'SME', value: 38 },
    { name: 'Startup', value: 20 },
  ];

  alertCards: {
    category: string;
    status: string;
    title: string;
    value: string;
    color: string;
  }[] = [];

  executiveLedger: {
    period: string;
    revenue: string;
    expenses: string;
    profit: string;
    deals: number;
    pipeline: string;
    employees: string;
    presence: string;
    customers: string;
  }[] = [];

  commonLineOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
      },
    },
  };

  minimalLineOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        display: false,
        grid: {
          display: false,
        },
      },
      y: {
        display: false,
        grid: {
          display: false,
        },
      },
    },
    elements: {
      point: {
        radius: 0,
      },
    },
  };

  doughnutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  financialChartType: 'bar' = 'bar';
  financialChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Revenue',
        backgroundColor: '#7c83ff',
      },
      {
        data: [],
        label: 'Expenses',
        backgroundColor: '#d9dcf2',
      },
    ],
  };

  financialLineType: 'line' = 'line';
  financialLineData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Net Profit',
        tension: 0.35,
        fill: false,
        borderColor: '#4f46e5',
      },
    ],
  };

  pipelineFunnelType: 'bar' = 'bar';
  pipelineFunnelData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Pipeline Value',
        backgroundColor: '#f59e0b',
      },
    ],
  };

  dealStatusType: 'doughnut' = 'doughnut';
  dealStatusData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: ['#f59e0b', '#f7c98f', '#f3e1c6'],
        borderWidth: 0,
      },
    ],
  };

  attendanceTrendType: 'line' = 'line';
  attendanceTrendData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Presence Rate',
        tension: 0.4,
        fill: false,
        borderColor: '#4f46e5',
      },
    ],
  };

  attendanceTrendMiniData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Late Check-ins',
        tension: 0.4,
        fill: false,
        borderColor: '#b4b1ff',
      },
    ],
  };

  retentionType: 'doughnut' = 'doughnut';
  retentionData: ChartData<'doughnut'> = {
    labels: ['Retention', 'Inactive'],
    datasets: [
      {
        data: [0, 100],
        backgroundColor: ['#e58e2b', '#f8e0c3'],
        hoverBackgroundColor: ['#e58e2b', '#f8e0c3'],
        borderWidth: 0,
      },
    ],
  };

  customerRevenueType: 'bar' = 'bar';
  customerRevenueData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Revenue',
        backgroundColor: '#f59e0b',
      },
    ],
  };

  private loadFinancialTrend(): void {
    this.overviewKpiService.getFinancialTrend(this.startDate, this.endDate).subscribe({
      next: (data) => {
        this.applyFinancialTrend(data);
      },
      error: (error) => {
        console.error('Erreur chargement Financial Trend:', error);
      },
    });
  }

  private applyFinancialTrend(data: OverviewFinancialTrendItem[]): void {
    this.financialChartData = {
      labels: data.map((item) => item.period),
      datasets: [
        {
          data: data.map((item) => this.toMillions(item.revenue)),
          label: 'Revenue',
          backgroundColor: '#7c83ff',
        },
        {
          data: data.map((item) => this.toMillions(item.expenses)),
          label: 'Expenses',
          backgroundColor: '#d9dcf2',
        },
      ],
    };

    this.financialLineData = {
      labels: data.map((item) => item.period),
      datasets: [
        {
          data: data.map((item) => this.toMillions(item.netProfit)),
          label: 'Net Profit',
          tension: 0.35,
          fill: false,
          borderColor: '#4f46e5',
        },
      ],
    };

    const totalNetProfit = data.reduce((sum, item) => sum + (item.netProfit ?? 0), 0);

    const avgMonthlyNetProfit = data.length > 0 ? totalNetProfit / data.length : 0;

    this.avgMonthlyNetProfitDisplay = this.formatCompactCurrency(avgMonthlyNetProfit);
  }

  private toMillions(value: number | null | undefined): number {
    return Number(((value ?? 0) / 1_000_000).toFixed(2));
  }
  private loadCashSummary(): void {
    this.overviewKpiService.getCashSummary(this.startDate, this.endDate).subscribe({
      next: (data) => {
        this.applyCashSummary(data);
      },
      error: (error) => {
        console.error('Erreur chargement Cash Summary:', error);
      },
    });
  }

  private applyCashSummary(data: OverviewCashSummaryItem): void {
    this.cashBalanceDisplay = this.formatCompactCurrency(data.cashBalance);

    const maxValue = Math.max(data.inflow, data.outflow, 1);

    this.cashBalanceBars = [
      {
        label: 'Inflow',
        value: `+${this.formatCompactCurrency(data.inflow)}`,
        width: Math.round((data.inflow / maxValue) * 100),
        color: 'green',
      },
      {
        label: 'Outflow',
        value: `-${this.formatCompactCurrency(data.outflow)}`,
        width: Math.round((data.outflow / maxValue) * 100),
        color: 'red',
      },
    ];
  }
  private loadSalesPipelineFunnel(): void {
    this.overviewKpiService.getSalesPipelineFunnel(this.startDate, this.endDate).subscribe({
      next: (data) => {
        this.applySalesPipelineFunnel(data);
      },
      error: (error) => {
        console.error('Erreur chargement Sales Pipeline Funnel:', error);
      },
    });
  }

  private applySalesPipelineFunnel(data: OverviewPipelineFunnelItem[]): void {
    this.pipelineFunnelData = {
      labels: data.map((item) => item.stage),
      datasets: [
        {
          data: data.map((item) => this.toMillions(item.pipelineValue)),
          label: 'Pipeline Value',
          backgroundColor: '#f59e0b',
        },
      ],
    };
  }
  private loadAttendanceTrend(): void {
    this.overviewKpiService.getAttendanceTrend(this.startDate, this.endDate).subscribe({
      next: (data) => {
        this.applyAttendanceTrend(data);
      },
      error: (error) => {
        console.error('Erreur chargement Attendance Trend:', error);
      },
    });
  }

  private applyAttendanceTrend(data: OverviewAttendanceTrendItem[]): void {
    this.attendanceTrendData = {
      labels: data.map((item) => item.period),
      datasets: [
        {
          data: data.map((item) => item.presenceRate),
          label: 'Presence Rate',
          tension: 0.4,
          fill: false,
          borderColor: '#4f46e5',
        },
      ],
    };

    this.attendanceTrendMiniData = {
      labels: data.map((item) => item.period),
      datasets: [
        {
          data: data.map((item) => item.lateCheckins),
          label: 'Late Check-ins',
          tension: 0.4,
          fill: false,
          borderColor: '#b4b1ff',
        },
      ],
    };

    const latest = data.length > 0 ? data[data.length - 1] : null;

    this.onTimeRateDisplay = latest ? this.formatPercent(latest.onTimeRate) : '0%';

    this.lateCheckinsDisplay = latest ? this.formatNumber(latest.lateCheckins) : '0';
  }

  private loadDepartmentDistribution(): void {
    this.overviewKpiService.getDepartmentDistribution().subscribe({
      next: (data) => {
        this.applyDepartmentDistribution(data);
      },
      error: (error) => {
        console.error('Erreur chargement Department Distribution:', error);
      },
    });
  }

  private applyDepartmentDistribution(data: OverviewDepartmentDistributionItem[]): void {
    this.departmentDistribution = data.map((item) => ({
      name: item.departmentName,
      value: item.employeeCount,
    }));
  }

  private loadCustomerRetention(): void {
    this.overviewKpiService.getCustomerRetention().subscribe({
      next: (data) => {
        this.applyCustomerRetention(data);
      },
      error: (error) => {
        console.error('Erreur chargement Customer Retention:', error);
      },
    });
  }

  private applyCustomerRetention(data: OverviewCustomerRetentionItem): void {
    const retentionRate = data.retentionRate ?? 0;
    const inactiveRate = Math.max(0, 100 - retentionRate);

    this.retentionData = {
      labels: ['Retention', 'Inactive'],
      datasets: [
        {
          data: [retentionRate, inactiveRate],
          backgroundColor: ['#e58e2b', '#f8e0c3'],
          hoverBackgroundColor: ['#e58e2b', '#f8e0c3'],
          borderWidth: 0,
        },
      ],
    };

    this.retentionRateDisplay = `${retentionRate.toFixed(2)}%`;

    this.retentionNote = `${this.formatNumber(data.activeCustomers)} active customers out of ${this.formatNumber(data.totalCustomers)} total customers.`;
  }

  private loadTopCustomersByRevenue(): void {
    this.overviewKpiService.getTopCustomersByRevenue(this.startDate, this.endDate).subscribe({
      next: (data) => {
        this.applyTopCustomersByRevenue(data);
      },
      error: (error) => {
        console.error('Erreur chargement Top Customers by Revenue:', error);
      },
    });
  }

  private applyTopCustomersByRevenue(data: OverviewTopCustomerItem[]): void {
    this.customerRevenue = data.map((item) => ({
      name: item.customerName,
      value: this.toMillions(item.revenue),
    }));

    this.customerRevenueData = {
      labels: data.map((item) => item.customerName),
      datasets: [
        {
          data: data.map((item) => this.toMillions(item.revenue)),
          label: 'Revenue',
          backgroundColor: '#f59e0b',
        },
      ],
    };
  }

  private loadOperationalAlerts(): void {
    this.overviewKpiService.getOperationalAlerts(this.startDate, this.endDate).subscribe({
      next: (data) => {
        this.applyOperationalAlerts(data);
      },
      error: (error) => {
        console.error('Erreur chargement Operational Alerts:', error);
      },
    });
  }

  private applyOperationalAlerts(data: OverviewOperationalAlertItem[]): void {
    this.alertCards = data.map((item) => ({
      category: item.category,
      status: item.status,
      title: item.title,
      value: this.formatAlertValue(item),
      color: item.color,
    }));
  }

  private formatAlertValue(item: OverviewOperationalAlertItem): string {
    const suffix = item.valueSuffix ?? '';

    if (item.title === 'Overdue Invoices') {
      return this.formatCompactCurrency(item.value);
    }

    if (item.title === 'Operational Burn') {
      return `${this.formatCompactCurrency(item.value)}${suffix}`;
    }

    if (item.title === 'Unscheduled Late') {
      return `${item.value.toFixed(2)}${suffix}`;
    }

    if (item.title === 'Lead Drop-off Rate') {
      return `${item.value.toFixed(2)}${suffix}`;
    }

    return `${item.value}${suffix}`;
  }
  private loadExecutiveLedger(): void {
    this.overviewKpiService.getExecutiveLedger(this.startDate, this.endDate).subscribe({
      next: (data) => {
        this.applyExecutiveLedger(data);
      },
      error: (error) => {
        console.error('Erreur chargement Executive Ledger:', error);
      },
    });
  }

  private applyExecutiveLedger(data: OverviewExecutiveLedgerItem[]): void {
    this.executiveLedger = data.map((item) => ({
      period: item.period,
      revenue: this.formatCompactCurrency(item.revenue),
      expenses: this.formatCompactCurrency(item.expenses),
      profit: this.formatSignedCompactCurrency(item.netProfit),
      deals: item.dealsWon,
      pipeline: this.formatCompactCurrency(item.pipeline),
      employees: this.formatNumber(item.employees),
      presence: this.formatPercent(item.presenceRate),
      customers: this.formatNumber(item.customers),
    }));
  }
  toggleExportMenu(): void {
    this.isExportMenuOpen = !this.isExportMenuOpen;
  }

  async exportAsPDF(): Promise<void> {
    const element = this.dashboardContent?.nativeElement;
    if (!element) return;

    this.isExportMenuOpen = false;

    await new Promise((resolve) => setTimeout(resolve, 150));

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#f5f7fb',
    });

    const imageData = canvas.toDataURL('image/png');

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imageData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imageData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save('overview-dashboard.pdf');
  }
  exportAsExcel(): void {
    this.isExportMenuOpen = false;

    const rows = this.buildExportRows();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Overview');
    XLSX.writeFile(workbook, 'overview-dashboard-data.xlsx');
  }

  exportAsCSV(): void {
    this.isExportMenuOpen = false;

    const rows = this.buildExportRows();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const csv = XLSX.utils.sheet_to_csv(worksheet);

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', 'overview-dashboard-data.csv');
    link.click();

    URL.revokeObjectURL(url);
  }

  private buildExportRows(): any[] {
    return [
      ...this.topKpis.map((item) => ({
        section: 'Top KPIs',
        title: item.title,
        value: item.value,
        trend: item.trend,
      })),
      ...this.topSalesPerformers.map((item) => ({
        section: 'Top Sales Performers',
        name: item.name,
        amount: item.amount,
        dealsCount: item.dealsCount,
      })),
      ...this.departmentDistribution.map((item) => ({
        section: 'Department Distribution',
        department: item.name,
        employees: item.value,
      })),
      ...this.customerRevenue.map((item) => ({
        section: 'Customer Revenue',
        customer_type: item.name,
        revenue_index: item.value,
      })),
      ...this.alertCards.map((item) => ({
        section: 'Operational Alerts',
        category: item.category,
        status: item.status,
        title: item.title,
        value: item.value,
      })),
      ...this.executiveLedger.map((item) => ({
        section: 'Executive Ledger',
        period: item.period,
        revenue: item.revenue,
        expenses: item.expenses,
        profit: item.profit,
        deals: item.deals,
        pipeline: item.pipeline,
        employees: item.employees,
        presence: item.presence,
        customers: item.customers,
      })),
    ];
  }

  getAlertClass(color: string): string {
    if (color === 'red') return 'alert-red';
    if (color === 'orange') return 'alert-orange';
    if (color === 'green') return 'alert-green';
    return '';
  }

  getDeptWidth(value: number): string {
    const max = Math.max(...this.departmentDistribution.map((item) => item.value), 1);

    return `${Math.round((value / max) * 100)}%`;
  }

  setPeriod(period: 'last30days' | 'last6months' | 'yearToDate'): void {
    this.selectedPeriod = period;

    const today = new Date();
    const start = new Date(today);

    if (period === 'last30days') {
      start.setDate(today.getDate() - 30);
    }

    if (period === 'last6months') {
      start.setMonth(today.getMonth() - 6);
    }

    if (period === 'yearToDate') {
      start.setMonth(0);
      start.setDate(1);
    }

    this.startDate = this.formatDate(start);
    this.endDate = this.formatDate(today);

    this.loadOverviewKpis();
    this.loadFinancialTrend();
    this.loadCashSummary();
    this.loadSalesPipelineFunnel();
    this.loadDealStatus();
    this.loadTopSalesPerformers();
    this.loadAttendanceTrend();
    this.loadDepartmentDistribution();
    this.loadCustomerRetention();
    this.loadTopCustomersByRevenue();
    this.loadOperationalAlerts();
    this.loadExecutiveLedger();
  }

  private loadOverviewKpis(): void {
    this.loadingKpis = true;
    this.kpiErrorMessage = '';

    this.overviewKpiService.getOverviewKpis(this.startDate, this.endDate).subscribe({
      next: (data) => {
        console.log('Overview KPIs reçus:', data);
        console.log('Période utilisée:', this.startDate, this.endDate);

        this.applyOverviewKpis(data);
        this.loadingKpis = false;
      },
      error: (error) => {
        console.error('Erreur chargement Overview KPIs:', error);
        this.kpiErrorMessage = 'Impossible de charger les KPIs Overview.';
        this.loadingKpis = false;
      },
    });
  }

  private applyOverviewKpis(data: OverviewKpiResponse): void {
    this.companyCurrency = data.currency || 'USD';
    this.topKpis = [
      {
        title: 'Total Employees',
        value: this.formatNumber(data.totalEmployees),
        trend: '',
        icon: 'groups',
        trendType: 'positive',
      },
      {
        title: 'Presence Rate',
        value: this.formatPercent(data.presenceRate),
        trend: '',
        icon: 'check_circle',
        trendType: data.presenceRate >= 80 ? 'positive' : 'negative',
      },
      {
        title: 'Total Revenue',
        value: this.formatCompactCurrency(data.totalRevenue),
        trend: '',
        icon: 'attach_money',
        trendType: 'positive',
      },
      {
        title: 'Net Profit',
        value: this.formatCompactCurrency(data.netProfit),
        trend: '',
        icon: 'receipt_long',
        trendType: data.netProfit >= 0 ? 'positive' : 'negative',
      },
      {
        title: 'Win Rate',
        value: this.formatPercent(data.winRate),
        trend: '',
        icon: 'account_balance',
        trendType: data.winRate >= 50 ? 'positive' : 'negative',
      },
      {
        title: 'Pipeline Value',
        value: this.formatCompactCurrency(data.pipelineValue),
        trend: '',
        icon: 'apartment',
        trendType: 'positive',
      },
    ];
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private formatNumber(value: number | null | undefined): string {
    const safeValue = value ?? 0;
    return new Intl.NumberFormat('en-US').format(safeValue);
  }

  private formatPercent(value: number | null | undefined): string {
    const safeValue = value ?? 0;
    return `${safeValue.toFixed(2)}%`;
  }

  private getCurrencyDisplay(currency: string): string {
    const value = (currency || '').trim().toUpperCase();

    if (value === 'TND' || value === 'DT') {
      return 'DT';
    }

    if (value === 'USD' || value === '$') {
      return '$';
    }

    if (value === 'EUR' || value === '€') {
      return '€';
    }

    if (value === 'SAR') {
      return 'SAR';
    }

    return value || 'USD';
  }

  private formatCompactCurrency(value: number | null | undefined): string {
    const safeValue = value ?? 0;
    const absValue = Math.abs(safeValue);

    let formattedValue: string;

    if (absValue >= 1_000_000_000) {
      formattedValue = `${(absValue / 1_000_000_000).toFixed(2)}B`;
    } else if (absValue >= 1_000_000) {
      formattedValue = `${(absValue / 1_000_000).toFixed(2)}M`;
    } else if (absValue >= 1_000) {
      formattedValue = `${(absValue / 1_000).toFixed(2)}K`;
    } else {
      formattedValue = absValue.toFixed(0);
    }

    const sign = safeValue < 0 ? '-' : '';
    const currencyDisplay = this.getCurrencyDisplay(this.companyCurrency);

    if (currencyDisplay === '$' || currencyDisplay === '€') {
      return `${sign}${currencyDisplay}${formattedValue}`;
    }

    return `${sign}${formattedValue} ${currencyDisplay}`;
  }

  private loadDealStatus(): void {
    this.overviewKpiService.getDealStatus(this.startDate, this.endDate).subscribe({
      next: (data) => {
        this.applyDealStatus(data);
      },
      error: (error) => {
        console.error('Erreur chargement Deal Status:', error);
      },
    });
  }

  private applyDealStatus(data: OverviewDealStatusItem[]): void {
    this.dealStatusData = {
      labels: data.map((item) => item.status),
      datasets: [
        {
          data: data.map((item) => item.percentage),
          backgroundColor: ['#f59e0b', '#f7c98f', '#f3e1c6'],
          borderWidth: 0,
        },
      ],
    };

    this.dealStatusLegend = data.map((item) => ({
      label: item.status,
      percentage: `${item.percentage.toFixed(2)}%`,
    }));
  }
  private loadTopSalesPerformers(): void {
    this.overviewKpiService.getTopSalesPerformers(this.startDate, this.endDate).subscribe({
      next: (data) => {
        this.applyTopSalesPerformers(data);
      },
      error: (error) => {
        console.error('Erreur chargement Top Sales Performers:', error);
      },
    });
  }

  private applyTopSalesPerformers(data: OverviewTopSalespersonItem[]): void {
    this.topSalesPerformers = data.map((item) => ({
      name: item.salespersonName,
      amount: this.formatCompactCurrency(item.totalRevenue),
      dealsCount: item.dealsCount,
    }));
  }

  private formatSignedCompactCurrency(value: number | null | undefined): string {
    const safeValue = value ?? 0;
    const formatted = this.formatCompactCurrency(Math.abs(safeValue));

    if (safeValue > 0) {
      return `+${formatted}`;
    }

    if (safeValue < 0) {
      return `-${formatted}`;
    }

    return '$0';
  }
}
