import { Component, ElementRef, OnInit, ViewChild,inject  } from '@angular/core';
import { Chart, registerables, ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { SectionTitleComponent } from '../../components/section-title/section-title';
import { FinanceKpiService } from '../../services/finance-kpi.service';
import {
  FinanceKpiResponse,
  FinanceRevenueProfitTrendItem,
  FinanceCashFlowTrendItem,
  FinanceOutstandingInvoiceItem,
  FinanceLiabilityAssetItem,
  FinanceAssetDistributionItem,
} from '../../models/finance-kpi-response';
import { KpiCardComponent } from '../../components/kpi-card/kpi-card';
import { BiFormatService } from '../../services/bi-format.service';

Chart.register(...registerables);

type TrendType = 'positive' | 'negative' | 'neutral';

interface FinanceKpiCard {
  title: string;
  value: string;
  trend: string;
  icon: string;
  trendType: TrendType;
  highlight?: boolean;
  warning?: boolean;
  description?: string;
}

@Component({
  selector: 'app-finance-analytics',
  standalone: true,
  imports: [SectionTitleComponent, BaseChartDirective, KpiCardComponent],
  templateUrl: './finance-analytics.html',
  styleUrl: './finance-analytics.css',
})
export class FinanceAnalyticsComponent implements OnInit {
  @ViewChild('dashboardContent', { static: false }) dashboardContent!: ElementRef;

  isExportMenuOpen = false;
  loadingKpis = false;
  kpiErrorMessage = '';
  selectedPeriod: 'last30days' | 'last6months' | 'yearToDate' = 'last6months';

  startDate = '';
  endDate = '';
  private biFormat = inject(BiFormatService);
  currency = '';

  totalLiabilitiesDisplay = '0';
  assetValueDisplay = '0';

  assetDistributionLegend: {
    label: string;
    value: string;
    color: string;
  }[] = [];
  depreciationExpenseDisplay = '0';
  complianceStatus = 'Full Compliance';
  complianceStatusIcon = '◔';

  nextFilingDates: {
    label: string;
    date: string;
  }[] = [];
  constructor(private financeKpiService: FinanceKpiService) {}

  ngOnInit(): void {
    this.setPeriod('last6months');
  }

  overviewKpis: FinanceKpiCard[] = [];

  cashKpis: FinanceKpiCard[] = [];

  receivableKpis: FinanceKpiCard[] = [];

  taxKpis: FinanceKpiCard[] = [];

  outstandingInvoices: {
    client: string;
    reference: string;
    amount: string;
    dueDate: string;
    status: string;
  }[] = [];

  taxPayments: {
    code: string;
    label: string;
    amount: string;
  }[] = [];

  commonLineOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
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

  commonBarOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
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

  revenueTrendChartType: 'line' = 'line';
  revenueTrendChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Revenue',
        tension: 0.35,
        fill: true,
        borderColor: '#5b61f6',
        backgroundColor: 'rgba(91, 97, 246, 0.15)',
      },
      {
        data: [],
        label: 'Profit',
        tension: 0.35,
        fill: false,
        borderColor: '#7c8cff',
        borderDash: [5, 5],
      },
    ],
  };

  cashFlowChartType: 'bar' = 'bar';
  cashFlowChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Inflow',
        backgroundColor: '#5b61f6',
      },
      {
        data: [],
        label: 'Outflow',
        backgroundColor: '#c9c5f7',
      },
    ],
  };

  liabilityAssetsChartType: 'bar' = 'bar';
  liabilityAssetsChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Total Asset Value',
        backgroundColor: '#f6b04f',
      },
      {
        data: [],
        label: 'Total Liabilities',
        backgroundColor: '#f3c98c',
      },
    ],
  };

  assetDistributionChartType: 'doughnut' = 'doughnut';
  assetDistributionChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: ['#111827', '#cdd5df', '#5b61f6', '#f6b04f', '#c9c5f7', '#94a3b8'],
        borderWidth: 0,
      },
    ],
  };
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

    this.loadFinanceKpis();
    this.loadRevenueProfitTrend();
    this.loadCashFlowTrend();
    this.loadTopOutstandingInvoices();
    this.loadLiabilityVsAssets();
    this.loadAssetDistribution();
  }
  private loadFinanceKpis(): void {
    this.loadingKpis = true;
    this.kpiErrorMessage = '';

    this.financeKpiService.getFinanceKpis(this.startDate, this.endDate).subscribe({
      next: (data) => {
        console.log('Finance KPIs reçus:', data);
        console.log('Période utilisée:', this.startDate, this.endDate);

        this.currency = data.currency || '';

        this.applyFinanceKpis(data);
        this.loadingKpis = false;
      },
      error: (error) => {
        console.error('Erreur chargement KPIs Finance:', error);
        this.kpiErrorMessage = 'Impossible de charger les KPIs Finance.';
        this.loadingKpis = false;
      },
    });
  }

  private applyFinanceKpis(data: FinanceKpiResponse): void {
    this.overviewKpis = [
      {
        title: 'Total Revenue',
        value: this.formatCurrency(data.totalRevenue),
        trend: '',
        icon: '↗',
        trendType: 'positive' as const,
        highlight: true,
        description: 'Gross income generated before any deductions or expenses.',
      },
      {
        title: 'Net Profit',
        value: this.formatCurrency(data.netProfit),
        trend: '',
        icon: '◔',
        trendType: data.netProfit >= 0 ? 'positive' : 'negative',
        highlight: true,
        description: 'Remaining earnings after all operational costs and taxes.',
      },
      {
        title: 'Total Expenses',
        value: this.formatCurrency(data.totalExpenses),
        trend: '',
        icon: '▣',
        trendType: 'negative' as const,
        highlight: false,
        description: 'Sum of all operational, administrative, and financial costs.',
      },
      {
        title: 'Gross Margin %',
        value: this.formatPercent(data.grossMarginPercentage),
        trend: '',
        icon: '%',
        trendType: data.grossMarginPercentage >= 0 ? ('positive' as const) : ('negative' as const),
        highlight: false,
        description: 'Efficiency metric showing profit as a percentage of revenue.',
      },
    ];

    this.cashKpis = [
      {
        title: 'Cash Balance',
        value: this.formatCurrency(data.cashBalance),
        trend: '',
        icon: '▣',
        trendType: 'neutral' as const,
        description: 'Total liquid cash currently held across all internal accounts.',
      },
      {
        title: 'Bank Account Balance',
        value: this.formatCurrency(data.bankAccountBalance),
        trend: '',
        icon: '▥',
        trendType: 'neutral' as const,
        description: 'Consolidated balance from primary and secondary banking partners.',
      },
      {
        title: 'Liquidity Ratio',
        value: this.formatNumber(data.liquidityRatio),
        trend: '',
        icon: '⬡',
        trendType: data.liquidityRatio >= 1 ? ('positive' as const) : ('negative' as const),
        description: 'Ability to meet short-term obligations (Current Assets / Liabilities).',
      },
    ];

    this.receivableKpis = [
      {
        title: 'Total Accounts Receivable',
        value: this.formatCurrency(data.accountsReceivable),
        trend: '',
        icon: '↗',
        trendType: 'neutral' as const,
      },
      {
        title: 'Total Accounts Payable',
        value: this.formatCurrency(data.accountsPayable),
        trend: '',
        icon: '↘',
        trendType: 'neutral' as const,
      },
      {
        title: 'Number of Open Invoices',
        value: this.formatNumber(data.numberOfOpenInvoices),
        trend: '',
        icon: '▤',
        trendType: 'neutral' as const,
      },
      {
        title: 'Due Invoices',
        value: this.formatNumber(data.dueInvoices),
        trend: '',
        icon: '◷',
        trendType: data.dueInvoices > 0 ? ('negative' as const) : ('neutral' as const),
        warning: data.dueInvoices > 0,
      },
    ];

    this.taxKpis = [
      {
        title: 'VAT Collected',
        value: this.formatCurrency(data.vatCollected),
        trend: '',
        icon: '▣',
        trendType: 'neutral' as const,
      },
      {
        title: 'VAT Payable',
        value: this.formatCurrency(data.vatPayable),
        trend: '',
        icon: '▣',
        trendType: data.vatPayable > 0 ? 'negative' : 'positive',
      },
      {
        title: 'Depreciation Expense',
        value: this.formatCurrency(data.depreciationExpense),
        trend: '',
        icon: '◈',
        trendType: 'neutral' as const,
        highlight: true,
      },
    ];
    this.depreciationExpenseDisplay = this.formatCurrency(data.depreciationExpense);
    this.updateComplianceStatus(data);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private formatCurrency(value: number | null | undefined): string {
    return this.biFormat.formatCurrency(value, this.currency);
  }

  private formatPercent(value: number | null | undefined): string {
    const safeValue = value ?? 0;
    return `${safeValue.toFixed(1)}%`;
  }

  private formatNumber(value: number | null | undefined): string {
    const safeValue = value ?? 0;
    return new Intl.NumberFormat('en-US').format(safeValue);
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

    pdf.save('finance-analytics-dashboard.pdf');
  }

  exportAsExcel(): void {
    this.isExportMenuOpen = false;

    const rows = this.buildExportRows();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Finance Analytics');
    XLSX.writeFile(workbook, 'finance-analytics-data.xlsx');
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
    link.setAttribute('download', 'finance-analytics-data.csv');
    link.click();

    URL.revokeObjectURL(url);
  }

  private buildExportRows(): any[] {
    return [
      ...this.overviewKpis.map((item) => ({
        section: 'Financial Overview',
        title: item.title,
        value: item.value,
        trend: item.trend,
        description: item.description,
      })),
      ...this.cashKpis.map((item) => ({
        section: 'Cash and Treasury',
        title: item.title,
        value: item.value,
        trend: item.trend,
        description: item.description,
      })),
      ...this.receivableKpis.map((item) => ({
        section: 'Receivables and Payables',
        title: item.title,
        value: item.value,
        trend: item.trend,
      })),
      ...this.taxKpis.map((item) => ({
        section: 'Taxes and Compliance',
        title: item.title,
        value: item.value,
        trend: item.trend,
      })),
      ...this.outstandingInvoices.map((item) => ({
        section: 'Outstanding Invoices',
        client: item.client,
        reference: item.reference,
        amount: item.amount,
        due_date: item.dueDate,
        status: item.status,
      })),
      ...this.taxPayments.map((item) => ({
        section: 'Recent Tax Payments',
        code: item.code,
        label: item.label,
        amount: item.amount,
      })),
    ];
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Overdue':
        return 'status-overdue';
      case 'Pending':
        return 'status-pending';
      case 'Due Soon':
        return 'status-due-soon';
      case 'Paid':
        return 'status-paid';
      default:
        return '';
    }
  }
  private loadRevenueProfitTrend(): void {
    this.financeKpiService.getRevenueProfitTrend(this.startDate, this.endDate).subscribe({
      next: (data) => {
        this.applyRevenueProfitTrend(data);
      },
      error: (error) => {
        console.error('Erreur chargement Revenue vs Profit Trend:', error);
      },
    });
  }

  private applyRevenueProfitTrend(data: FinanceRevenueProfitTrendItem[]): void {
    this.revenueTrendChartData = {
      labels: data.map((item) => item.period),
      datasets: [
        {
          data: data.map((item) => item.revenue),
          label: 'Revenue',
          tension: 0.35,
          fill: true,
          borderColor: '#5b61f6',
          backgroundColor: 'rgba(91, 97, 246, 0.15)',
        },
        {
          data: data.map((item) => item.profit),
          label: 'Profit',
          tension: 0.35,
          fill: false,
          borderColor: '#7c8cff',
          borderDash: [5, 5],
        },
      ],
    };
  }
  private loadCashFlowTrend(): void {
    this.financeKpiService.getCashFlowTrend(this.startDate, this.endDate).subscribe({
      next: (data) => {
        this.applyCashFlowTrend(data);
      },
      error: (error) => {
        console.error('Erreur chargement Cash Flow Trend:', error);
      },
    });
  }

  private applyCashFlowTrend(data: FinanceCashFlowTrendItem[]): void {
    this.cashFlowChartData = {
      labels: data.map((item) => item.period),
      datasets: [
        {
          data: data.map((item) => item.inflow),
          label: 'Inflow',
          backgroundColor: '#5b61f6',
        },
        {
          data: data.map((item) => item.outflow),
          label: 'Outflow',
          backgroundColor: '#c9c5f7',
        },
      ],
    };
  }
  private loadTopOutstandingInvoices(): void {
    this.financeKpiService.getTopOutstandingInvoices(this.startDate, this.endDate).subscribe({
      next: (data) => {
        this.applyTopOutstandingInvoices(data);
      },
      error: (error) => {
        console.error('Erreur chargement Top Outstanding Invoices:', error);
      },
    });
  }

  private applyTopOutstandingInvoices(data: FinanceOutstandingInvoiceItem[]): void {
    this.outstandingInvoices = data.map((item) => ({
      client: item.client,
      reference: item.reference,
      amount: this.formatCurrency(item.amount),
      dueDate: this.formatDisplayDate(item.dueDate),
      status: this.normalizeInvoiceStatus(item.status),
    }));
  }

  private formatDisplayDate(dateValue: string | null | undefined): string {
    if (!dateValue) {
      return '-';
    }

    const date = new Date(dateValue);

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    }).format(date);
  }

  private normalizeInvoiceStatus(status: string): string {
    switch (status) {
      case 'Overdue':
        return 'Overdue';
      case 'Due Soon':
        return 'Due Soon';
      case 'UNPAID':
      case 'WAITING':
      case 'ACCEPTED':
      case 'PARTIALLY_PAID':
        return 'Pending';
      case 'PAID':
        return 'Paid';
      default:
        return status;
    }
  }
  private loadLiabilityVsAssets(): void {
    this.financeKpiService.getLiabilityVsAssets(this.startDate, this.endDate).subscribe({
      next: (data) => {
        this.applyLiabilityVsAssets(data);
      },
      error: (error) => {
        console.error('Erreur chargement Liability vs Assets:', error);
      },
    });
  }

  private applyLiabilityVsAssets(data: FinanceLiabilityAssetItem): void {
    this.liabilityAssetsChartData = {
      labels: ['Current', 'Fixed / Long Term', 'Total'],
      datasets: [
        {
          data: [
            this.toMillions(data.currentAssets),
            this.toMillions(data.fixedAssets),
            this.toMillions(data.totalAssets),
          ],
          label: 'Total Asset Value',
          backgroundColor: '#f6b04f',
        },
        {
          data: [
            this.toMillions(data.currentLiabilities),
            this.toMillions(data.longTermLiabilities),
            this.toMillions(data.totalLiabilities),
          ],
          label: 'Total Liabilities',
          backgroundColor: '#f3c98c',
        },
      ],
    };

    this.totalLiabilitiesDisplay = this.formatCompactCurrency(data.totalLiabilities);
    this.assetValueDisplay = this.formatCompactCurrency(data.totalAssets);
  }
  private toMillions(value: number | null | undefined): number {
    return Number(((value ?? 0) / 1_000_000).toFixed(2));
  }

  private formatCompactCurrency(value: number | null | undefined): string {
    const safeValue = value ?? 0;

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(safeValue);
  }

  private loadAssetDistribution(): void {
    this.financeKpiService.getAssetDistribution(this.endDate).subscribe({
      next: (data) => {
        this.applyAssetDistribution(data);
      },
      error: (error) => {
        console.error('Erreur chargement Asset Distribution:', error);
      },
    });
  }

  private applyAssetDistribution(data: FinanceAssetDistributionItem[]): void {
    const assetColors = [
      '#5b61f6',
      '#5797C2',
      '#94D1C0',
      '#efc46f',
      '#f59e0b',
      '#c9c5f7',
      '#9aa8bd',
    ];
    this.assetDistributionChartData = {
      labels: data.map((item) => item.assetType),
      datasets: [
        {
          data: data.map((item) => this.toMillions(item.assetValue)),
          backgroundColor: assetColors,
          borderWidth: 0,
        },
      ],
    };

    this.assetDistributionLegend = data.map((item, index) => ({
      label: item.assetType,
      value: this.formatCompactCurrency(item.assetValue),
      color: assetColors[index % assetColors.length],

    }));
  }

  private updateComplianceStatus(data: FinanceKpiResponse): void {
    if (data.dueInvoices > 0) {
      this.complianceStatus = 'Attention Required';
      this.complianceStatusIcon = '!';
      return;
    }

    if (data.vatPayable > 1000000) {
      this.complianceStatus = 'Tax Review Needed';
      this.complianceStatusIcon = '◷';
      return;
    }

    this.complianceStatus = 'Full Compliance';
    this.complianceStatusIcon = '◔';
  }
}

