import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { Chart, registerables, ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

import { PageFilters } from '../../../../layout/page-filters/page-filters';
import { SectionTitleComponent } from '../../components/section-title/section-title';
import { KpiCardComponent } from '../../components/kpi-card/kpi-card';

import { HrService } from '../../services/hr.service';
import { HrKpiResponse } from '../../models/hr-kpi-response';
import { BiFormatService } from '../../services/bi-format.service';

Chart.register(...registerables);

@Component({
  selector: 'app-hr-analytics',
  imports: [SectionTitleComponent, KpiCardComponent, BaseChartDirective],
  templateUrl: './hr-analytics.html',
  styleUrl: './hr-analytics.css',
  standalone: true,
})
export class HrAnalyticsComponent implements OnInit {
  @ViewChild('dashboardContent', { static: false }) dashboardContent!: ElementRef;

  private hrService = inject(HrService);
  private biFormat = inject(BiFormatService);
  currency = '';

  selectedPeriod: '30days' | '6months' | 'ytd' = '6months';
  startDate = '';
  endDate = '';

  isExportMenuOpen = false;

  workforceKpis: Array<{
    title: string;
    value: string;
    trend: string;
    icon: string;
    trendType: 'positive' | 'negative' | 'neutral';
  }> = [];

  attendanceKpis: any[] = [];

  payrollKpis: any[] = [];

  recruitmentKpis: any[] = [];

  footerKpis: any[] = [];

  upcomingBirthdays: {
    employee: string;
    department: string;
    remainingDays: number;
  }[] = [];

  commonChartOptions: ChartConfiguration['options'] = {
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

  headcountChartType: 'line' = 'line';

  headcountChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Headcount',
        fill: true,
        tension: 0.4,
        borderColor: '#5b61f6',
        backgroundColor: 'rgba(91,97,246,0.2)',
      },
    ],
  };
  headcountChartOptions: ChartConfiguration<'line'>['options'] = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      callbacks: {
        label: (context) => {
          return `Headcount: ${context.parsed.y}`;
        },
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        precision: 0,
      },
    },
    x: {
      ticks: {
        autoSkip: false,
      },
    },
  },
};

  tenureChartType: 'doughnut' = 'doughnut';

  tenureChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [
      {
        data: [],
        backgroundColor: ['#5b61f6', '#818cf8', '#38bdf8', '#f59e0b'],
      },
    ],
  };

  tenureChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  attendanceChartType: 'line' = 'line';
  attendanceChartData: ChartData<'line'> = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    datasets: [
      {
        data: [120, 145, 160, 130, 90],
        label: 'Presence',
        tension: 0.35,
        fill: true,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.16)',
      },
      {
        data: [92, 94, 93, 95, 89],
        label: 'Overtime',
        tension: 0.35,
        fill: false,
        borderColor: '#5b61f6',
      },
    ],
  };

  attendanceTrendChartType: 'line' = 'line';

  attendanceTrendChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Presence Rate',
        fill: false,
        tension: 0.4,
        borderColor: '#5b61f6',
      },
      {
        data: [],
        label: 'Absence Rate',
        fill: false,
        tension: 0.4,
        borderColor: '#ef4444',
      },
    ],
  };

  salaryBenchmarkChartType: 'bar' = 'bar';

  salaryBenchmarkChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Average Salary',
        backgroundColor: '#5b61f6',
      },
      {
        data: [],
        label: 'Maximum Salary',
        backgroundColor: '#a78bfa',
      },
    ],
  };

  salaryBenchmarkChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  hiringFunnelChartType: 'bar' = 'bar';

  hiringFunnelChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Hiring Funnel',
        backgroundColor: '#f59e0b',
      },
    ],
  };

 hiringFunnelChartOptions: ChartConfiguration<'bar'>['options'] = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      callbacks: {
        label: (context) => {
          return `${context.parsed.y} applications`;
        },
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        precision: 0,
      },
    },
    x: {
      ticks: {
        autoSkip: false,
      },
    },
  },
};

  employeesByDepartmentChartType: 'bar' = 'bar';

  employeesByDepartmentChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Employees',
        backgroundColor: '#5b61f6',
      },
    ],
  };
  employeesByDepartmentChartHeight = 500;

  employeesByDepartmentChartOptions: ChartConfiguration<'bar'>['options'] = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      callbacks: {
        label: (context) => {
          return `Employees: ${context.parsed.x}`;
        },
      },
    },
  },
  scales: {
    x: {
      beginAtZero: true,
      ticks: {
        precision: 0,
      },
    },
    y: {
      ticks: {
        autoSkip: false,
        font: {
          size: 12,
        },
      },
    },
  },
};
  ngOnInit(): void {
    this.setPeriod('6months');
  }

  setPeriod(period: '30days' | '6months' | 'ytd'): void {
    this.selectedPeriod = period;
    this.updateDateRange(period);

    console.log('RH period:', period, this.startDate, this.endDate);

    this.loadHrKpis();
    this.loadHeadcountTrend();
    this.loadAttendanceTrend();
    this.loadTenureDistribution();
    this.loadEmployeesByDepartment();
    this.loadSalaryBenchmarking();
    this.loadHiringFunnel();
    this.loadUpcomingBirthdays();
  }

  private updateDateRange(period: '30days' | '6months' | 'ytd'): void {
    const today = new Date();
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    let start: Date;

    if (period === '30days') {
      start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      start.setDate(start.getDate() - 30);
    } else if (period === '6months') {
      start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      start.setMonth(start.getMonth() - 6);
    } else {
      start = new Date(today.getFullYear(), 0, 1);
    }

    this.startDate = this.formatDateForApi(start);
    this.endDate = this.formatDateForApi(end);
  }

  private formatDateForApi(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  loadHrKpis(): void {
    console.log('CALL API HR 🔥', this.startDate, this.endDate);

    this.hrService.getHrKpis(this.startDate, this.endDate).subscribe({
      next: (data: HrKpiResponse) => {
        console.log('DATA HR =', data);
        this.currency = data.currency || '';

        this.workforceKpis = [
          {
            title: 'Total Employees',
            value: String(data.totalEmployees),
            trend: '',
            icon: 'groups',
            trendType: 'positive',
          },
          {
            title: 'Active Employees',
            value: String(data.activeEmployees),
            trend: '',
            icon: 'badge',
            trendType: 'positive',
          },
          {
            title: 'Inactive Employees',
            value: String(data.inactiveEmployees),
            trend: '',
            icon: 'person_off',
            trendType: 'negative',
          },
          {
            title: 'Employees Onboarding',
            value: String(data.onboardingEmployees),
            trend: '',
            icon: 'person_add',
            trendType: 'positive',
          },
          {
            title: 'Employees Offboarding',
            value: String(data.offboardingEmployees),
            trend: '',
            icon: 'person_remove',
            trendType: 'negative',
          },
          {
            title: 'Average Tenure',
            value: `${this.formatNumber(data.averageTenure)} yrs`,
            trend: '',
            icon: 'schedule',
            trendType: 'positive',
          },
          {
            title: 'Attrition Rate',
            value: `${this.formatNumber(data.attritionRate)}%`,
            trend: '',
            icon: 'trending_down',
            trendType: 'negative',
          },
        ];
        this.attendanceKpis = [
          {
            title: 'Presence Rate',
            value: `${this.formatNumber(data.presenceRate)}%`,
            trend: '',
            icon: 'check_circle',
            trendType: 'positive',
          },
          {
            title: 'Absence Rate',
            value: `${this.formatNumber(data.absenceRate)}%`,
            trend: '',
            icon: 'cancel',
            trendType: 'negative',
          },
          {
            title: 'Late Check-ins',
            value: String(data.lateCheckins),
            trend: '',
            icon: 'schedule',
            trendType: 'negative',
          },
          {
            title: 'Overtime Hours',
            value: `${this.formatNumber(data.overtimeHours)} h`,
            trend: '',
            icon: 'timer',
            trendType: 'positive',
          },
        ];
        this.payrollKpis = [
          {
            title: 'Total Payroll',
            value: this.formatCurrency(data.totalPayroll),
            trend: '',
            icon: 'payments',
            trendType: 'positive',
          },
          {
            title: 'Average Salary',
            value: this.formatCurrency(data.averageSalary),
            trend: '',
            icon: 'account_balance_wallet',
            trendType: 'positive',
          },
          {
            title: 'Avg Cost / Employee',
            value: this.formatCurrency(data.averageCostPerEmployee),
            trend: '',
            icon: 'paid',
            trendType: 'neutral',
          },
        ];
        this.attendanceKpis = [
          {
            title: 'Presence Rate',
            value: `${this.formatNumber(data.presenceRate)}%`,
            trend: '',
            icon: 'event_available',
            trendType: 'positive',
          },
          {
            title: 'Attendance Rate',
            value: `${this.formatNumber(100 - (data.absenceRate ?? 0))}%`,
            trend: '',
            icon: 'check_circle',
            trendType: 'positive',
          },
          {
            title: 'Absence Rate',
            value: `${this.formatNumber(data.absenceRate)}%`,
            trend: '',
            icon: 'event_busy',
            trendType: 'negative',
          },
          {
            title: 'Late Check-ins',
            value: String(data.lateCheckins ?? 0),
            trend: '',
            icon: 'schedule',
            trendType: 'negative',
          },
          {
            title: 'Overtime Hours',
            value: `${this.formatNumber(data.overtimeHours)} h`,
            trend: '',
            icon: 'bolt',
            trendType: 'positive',
          },
          {
            title: 'Absenteeism Volatility',
            value: this.formatNumber(data.absenteeismVolatilityIndex),
            trend: '',
            icon: 'monitoring',
            trendType: 'neutral',
          },
        ];
        this.recruitmentKpis = [
          {
            title: 'Active Job Offers',
            value: String(data.activeJobOffers ?? 0),
            trend: '',
            icon: 'work',
            trendType: 'positive',
          },
          {
            title: 'Total Applications',
            value: String(data.totalApplications ?? 0),
            trend: '',
            icon: 'description',
            trendType: 'positive',
          },
          {
            title: 'Conversion Rate',
            value: `${this.formatNumber(data.conversionRate)}%`,
            trend: '',
            icon: 'trending_up',
            trendType: 'positive',
          },
        ];
        this.footerKpis = [
          {
            title: 'Hired Applications',
            value: String(data.hiredApplications ?? 0),
            trend: '',
            icon: 'how_to_reg',
            trendType: 'positive',
          },
          {
            title: 'Late Arrival Penalty',
            value: this.formatCurrency(data.lateArrivalPenalty),
            trend: '',
            icon: 'paid',
            trendType: 'negative',
          },
          {
            title: 'Application Quality',
            value: data.applicationQuality || 'No Data',
            trend: '',
            icon: 'analytics',
            trendType: 'neutral',
          },
          {
            title: 'Efficiency Index',
            value: `${this.formatNumber(data.efficiencyIndex)} / 10`,
            trend: '',
            icon: 'bolt',
            trendType: 'positive',
          },
        ];
      },
      error: (err: unknown) => {
        console.error('Erreur KPI RH', err);
      },
    });
  }

  loadHeadcountTrend(): void {
  this.hrService.getHeadcountTrend(this.startDate, this.endDate).subscribe({
    next: (data: any[]) => {
      console.log('Headcount trend:', data);

      this.headcountChartData = {
        labels: data.map((item) => item.period),
        datasets: [
          {
            data: data.map((item) => Number(item.headcount ?? 0)),
            label: 'Headcount',
            fill: true,
            tension: 0.4,
            borderColor: '#5b61f6',
            backgroundColor: 'rgba(91,97,246,0.2)',
          },
        ],
      };
    },
    error: (err) => console.error('Erreur headcount trend', err),
  });
}

  loadAttendanceTrend(): void {
    this.hrService.getAttendanceTrend(this.startDate, this.endDate).subscribe({
      next: (data: any[]) => {
        this.attendanceTrendChartData = {
          labels: data.map((item) => item.label),
          datasets: [
            {
              data: data.map((item) => item.presenceRate),
              label: 'Presence Rate',
              fill: false,
              tension: 0.4,
              borderColor: '#5b61f6',
            },
            {
              data: data.map((item) => item.absenceRate),
              label: 'Absence Rate',
              fill: false,
              tension: 0.4,
              borderColor: '#ef4444',
            },
          ],
        };
      },
      error: (err: unknown) => {
        console.error('Erreur attendance trend', err);
      },
    });
  }

  loadTenureDistribution(): void {
    this.hrService.getTenureDistribution().subscribe({
      next: (data: any[]) => {
        this.tenureChartData = {
          labels: data.map((item) => item.label),
          datasets: [
            {
              data: data.map((item) => item.value),
              backgroundColor: ['#5b61f6', '#818cf8', '#e8bc70', '#f59e0b'],
            },
          ],
        };
      },
      error: (err: unknown) => {
        console.error('Erreur tenure distribution', err);
      },
    });
  }

loadEmployeesByDepartment(): void {
  this.hrService.getEmployeesByDepartment(this.startDate, this.endDate).subscribe({
    next: (data: any[]) => {
      this.employeesByDepartmentChartHeight = Math.max(500, data.length * 38);

      this.employeesByDepartmentChartData = {
        labels: data.map((item) => item.department),
        datasets: [
          {
            data: data.map((item) => Number(item.count ?? 0)),
            label: 'Employees',
            backgroundColor: '#5b61f6',
          },
        ],
      };
    },
    error: (err: unknown) => {
      console.error('Erreur employees by department', err);
    },
  });
}

  loadSalaryBenchmarking(): void {
    console.log('CALL SALARY BENCHMARKING', this.startDate, this.endDate);

    this.hrService.getSalaryBenchmarking(this.startDate, this.endDate).subscribe({
      next: (data: any[]) => {
        console.log('SALARY BENCHMARKING DATA =', data);

        const labels = data.map((item: any) => item.department);
        const averageSalaries = data.map((item: any) => Number(item.averageSalary ?? 0));
        const maximumSalaries = data.map((item: any) => Number(item.maximumSalary ?? 0));

        console.log('SALARY LABELS =', labels);
        console.log('AVG SALARIES =', averageSalaries);
        console.log('MAX SALARIES =', maximumSalaries);

        this.salaryBenchmarkChartData = {
          labels,
          datasets: [
            {
              data: averageSalaries,
              label: 'Average Salary',
              backgroundColor: '#5b61f6',
            },
            {
              data: maximumSalaries,
              label: 'Maximum Salary',
              backgroundColor: '#a78bfa',
            },
          ],
        };
      },
      error: (err: unknown) => {
        console.error('Erreur salary benchmarking', err);
      },
    });
  }

  loadHiringFunnel(): void {
    this.hrService.getHiringFunnel(this.startDate, this.endDate).subscribe({
      next: (data: any[]) => {
        this.hiringFunnelChartData = {
          labels: data.map((item: any) => item.stage),
          datasets: [
            {
              data: data.map((item: any) => Number(item.count ?? 0)),
              label: 'Hiring Funnel',
              backgroundColor: '#f59e0b',
            },
          ],
        };
      },
      error: (err: unknown) => {
        console.error('Erreur hiring funnel', err);
      },
    });
  }

  loadUpcomingBirthdays(): void {
    this.hrService.getUpcomingBirthdays().subscribe({
      next: (data: any[]) => {
        this.upcomingBirthdays = data.map((item: any) => ({
          employee: item.employee,
          department: item.department,
          remainingDays: item.remainingDays,
        }));
      },
      error: (err: unknown) => {
        console.error('Erreur upcoming birthdays', err);
      },
    });
  }

  formatNumber(value: number | null | undefined): string {
    return this.biFormat.formatNumber(value);
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

    XLSX.utils.book_append_sheet(workbook, worksheet, 'HR Analytics');
    XLSX.writeFile(workbook, 'hr-analytics-data.xlsx');
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
    link.setAttribute('download', 'hr-analytics-data.csv');
    link.click();

    URL.revokeObjectURL(url);
  }

  private buildExportRows(): any[] {
    return [
      ...this.workforceKpis.map((item) => ({
        section: 'Workforce Overview',
        title: item.title,
        value: item.value,
        trend: item.trend,
      })),
      ...this.attendanceKpis.map((item) => ({
        section: 'Attendance & Presence',
        title: item.title,
        value: item.value,
        trend: item.trend,
      })),
      ...this.payrollKpis.map((item) => ({
        section: 'Payroll',
        title: item.title,
        value: item.value,
        trend: item.trend,
      })),
      ...this.recruitmentKpis.map((item) => ({
        section: 'Recruitment',
        title: item.title,
        value: item.value,
        trend: item.trend,
      })),
      ...this.footerKpis.map((item) => ({
        section: 'Summary KPIs',
        title: item.title,
        value: item.value,
        trend: item.trend,
      })),
      ...this.upcomingBirthdays.map((item, index) => ({
      section: 'Upcoming Birthdays',
      rank: index + 1,
      employee: item.employee,
      department: item.department,
      remaining_days: item.remainingDays,
    })),
    ];
  }
  formatCurrency(value: number | null | undefined): string {
    return this.biFormat.formatCurrency(value, this.currency);
  }
}
