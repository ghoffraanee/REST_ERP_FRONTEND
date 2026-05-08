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

  isExportMenuOpen = false;
  loadingKpis = false;
  kpiErrorMessage = '';

  selectedPeriod: 'last30days' | 'last6months' | 'yearToDate' = 'last6months';

  startDate = '';
  endDate = '';

  cashBalanceDisplay = '$0';

  avgMonthlyNetProfitDisplay = '$0';
  cashBalanceBars = [
    { label: 'Inflow', value: '$0', width: 0, color: 'green' },
    { label: 'Outflow', value: '$0', width: 0, color: 'red' },
  ];
  constructor(private overviewKpiService: OverviewKpiService) {}

  ngOnInit(): void {
    this.setPeriod('last6months');
  }

  topKpis: OverviewKpiCard[] = [
    {
      title: 'Total Employees',
      value: '897',
      trend: '+12',
      icon: 'groups',
      trendType: 'positive',
    },
    {
      title: 'Presence Rate',
      value: '94.2%',
      trend: '+0.5%',
      icon: 'check_circle',
      trendType: 'positive',
    },
    {
      title: 'Total Revenue',
      value: '$4.28M',
      trend: '+18.4%',
      icon: 'attach_money',
      trendType: 'positive',
    },
    {
      title: 'Net Profit',
      value: '$1.12M',
      trend: '+22.1%',
      icon: 'receipt_long',
      trendType: 'positive',
    },
    {
      title: 'Win Rate',
      value: '68%',
      trend: '+4.4%',
      icon: 'account_balance',
      trendType: 'positive',
    },
    {
      title: 'Pipeline Value',
      value: '$12.4M',
      trend: '+44%',
      icon: 'apartment',
      trendType: 'positive',
    },
  ];

  topSalesPerformers = [
    { name: 'Sarah Connor', amount: '$450k', trend: '+12%' },
    { name: 'Alex Rivera', amount: '$380k', trend: '+8%' },
    { name: 'Jordan Belfort', amount: '$310k', trend: '+5%' },
    { name: 'Mia Wallace', amount: '$240k', trend: '-2%' },
  ];

  departmentDistribution = [
    { name: 'Sales & Marketing', value: 240 },
    { name: 'Research & Dev', value: 180 },
    { name: 'Operations', value: 320 },
    { name: 'Customer Support', value: 120 },
    { name: 'HR & Admin', value: 37 },
  ];

  customerRevenue = [
    { name: 'Enterprise', value: 92 },
    { name: 'Mid-Market', value: 64 },
    { name: 'SME', value: 38 },
    { name: 'Startup', value: 20 },
  ];

  alertCards = [
    {
      category: 'Finance',
      status: 'Critical',
      title: 'Overdue Invoices',
      value: '$42,400',
      color: 'red',
    },
    {
      category: 'HR',
      status: 'Warning',
      title: 'Unscheduled Late',
      value: '12.4% Avg',
      color: 'orange',
    },
    {
      category: 'Sales',
      status: 'Warning',
      title: 'Lead Drop-off Rate',
      value: '+5.2% Weekly',
      color: 'orange',
    },
    {
      category: 'Finance',
      status: 'Normal',
      title: 'Operational Burn',
      value: '$18k / Daily',
      color: 'green',
    },
  ];

  executiveLedger = [
    {
      period: 'Q2 2024',
      revenue: '$1.08M',
      expenses: '$1.16M',
      profit: '$720K',
      deals: 84,
      pipeline: '$2.37M',
      employees: 897,
      presence: '94.2%',
      customers: 1240,
    },
    {
      period: 'Q1 2024',
      revenue: '$1.45M',
      expenses: '$0.97M',
      profit: '$480K',
      deals: 77,
      pipeline: '$1.92M',
      employees: 882,
      presence: '92.6%',
      customers: 1180,
    },
    {
      period: 'Q4 2023',
      revenue: '$1.72M',
      expenses: '$1.08M',
      profit: '$640K',
      deals: 78,
      pipeline: '$2.15M',
      employees: 875,
      presence: '93.6%',
      customers: 1150,
    },
    {
      period: 'Q3 2023',
      revenue: '$1.38M',
      expenses: '$0.92M',
      profit: '$460K',
      deals: 65,
      pipeline: '$1.84M',
      employees: 860,
      presence: '91.2%',
      customers: 1090,
    },
    {
      period: 'Q2 2023',
      revenue: '$1.22M',
      expenses: '$0.85M',
      profit: '$370K',
      deals: 58,
      pipeline: '$1.62M',
      employees: 845,
      presence: '90.5%',
      customers: 1020,
    },
  ];

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
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        data: [450, 520, 480, 610, 590, 690],
        label: 'Revenue',
        backgroundColor: '#7c83ff',
      },
      {
        data: [150, 190, 180, 230, 225, 270],
        label: 'Expenses',
        backgroundColor: '#d9dcf2',
      },
    ],
  };

  financialLineType: 'line' = 'line';
  financialLineData: ChartData<'line'> = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        data: [320, 340, 315, 385, 370, 410],
        label: 'Net Profit',
        tension: 0.35,
        fill: false,
        borderColor: '#4f46e5',
      },
    ],
  };

  pipelineFunnelType: 'bar' = 'bar';
  pipelineFunnelData: ChartData<'bar'> = {
    labels: ['Prospects', 'Qualified', 'Proposal', 'Negotiation', 'Closed'],
    datasets: [
      {
        data: [96, 68, 49, 37, 25],
        label: 'Deals',
        backgroundColor: '#f59e0b',
      },
    ],
  };

  dealStatusType: 'doughnut' = 'doughnut';
  dealStatusData: ChartData<'doughnut'> = {
    labels: ['Won', 'Progress', 'Lost'],
    datasets: [
      {
        data: [45, 40, 15],
        backgroundColor: ['#f59e0b', '#f7c98f', '#f3e1c6'],
        borderWidth: 0,
      },
    ],
  };

  attendanceTrendType: 'line' = 'line';
  attendanceTrendData: ChartData<'line'> = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    datasets: [
      {
        data: [74, 82, 76, 95, 91, 104],
        label: 'Attendance',
        tension: 0.4,
        fill: false,
        borderColor: '#4f46e5',
      },
    ],
  };

  attendanceTrendMiniData: ChartData<'line'> = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    datasets: [
      {
        data: [28, 34, 31, 39, 37, 44],
        label: 'Check-ins',
        tension: 0.4,
        fill: false,
        borderColor: '#b4b1ff',
      },
    ],
  };

  retentionType: 'doughnut' = 'doughnut';
  retentionData: ChartData<'doughnut'> = {
    labels: ['Retention', 'Gap'],
    datasets: [
      {
        data: [92, 8],
        backgroundColor: ['#e58e2b', '#f8e0c3'],
        hoverBackgroundColor: ['#e58e2b', '#f8e0c3'],
        borderWidth: 0,
      },
    ],
  };

  customerRevenueType: 'bar' = 'bar';
  customerRevenueData: ChartData<'bar'> = {
    labels: this.customerRevenue.map((item) => item.name),
    datasets: [
      {
        data: this.customerRevenue.map((item) => item.value),
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
        trend: item.trend,
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
    const max = 320;
    return `${(value / max) * 100}%`;
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

  private formatCompactCurrency(value: number | null | undefined): string {
    const safeValue = value ?? 0;

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 2,
    }).format(safeValue);
  }
}
