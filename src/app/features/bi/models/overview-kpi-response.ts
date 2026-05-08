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
