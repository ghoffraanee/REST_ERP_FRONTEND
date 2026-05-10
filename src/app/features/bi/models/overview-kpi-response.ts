export interface OverviewKpiResponse {
  totalEmployees: number;
  presenceRate: number;
  totalRevenue: number;
  netProfit: number;
  winRate: number;
  pipelineValue: number;
}
export interface OverviewFinancialTrendItem {
  period: string;
  revenue: number;
  expenses: number;
  netProfit: number;
}
export interface OverviewCashSummaryItem {
  cashBalance: number;
  inflow: number;
  outflow: number;
}
export interface OverviewPipelineFunnelItem {
  stage: string;
  dealCount: number;
  pipelineValue: number;
}
export interface OverviewDealStatusItem {
  status: string;
  dealCount: number;
  percentage: number;
}
export interface OverviewTopSalespersonItem {
  salespersonName: string;
  totalRevenue: number;
  dealsCount: number;
}
export interface OverviewAttendanceTrendItem {
  period: string;
  presenceRate: number;
  lateCheckins: number;
  onTimeRate: number;
}
export interface OverviewDepartmentDistributionItem {
  departmentName: string;
  employeeCount: number;
}

export interface OverviewCustomerRetentionItem {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  retentionRate: number;
}
export interface OverviewTopCustomerItem {
  customerName: string;
  revenue: number;
}

export interface OverviewOperationalAlertItem {
  category: string;
  status: string;
  title: string;
  value: number;
  valueSuffix: string;
  color: string;
}

export interface OverviewExecutiveLedgerItem {
  period: string;
  revenue: number;
  expenses: number;
  netProfit: number;
  dealsWon: number;
  pipeline: number;
  employees: number;
  presenceRate: number;
  customers: number;
}
