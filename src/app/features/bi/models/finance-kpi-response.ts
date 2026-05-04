export interface FinanceKpiResponse {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  grossMarginPercentage: number;

  cashBalance: number;
  bankAccountBalance: number;
  totalLiabilities: number;
  liquidityRatio: number;

  accountsReceivable: number;
  accountsPayable: number;
  numberOfOpenInvoices: number;
  dueInvoices: number;

  assetValue: number;
  depreciationExpense: number;

  vatCollected: number;
  vatPayable: number;
}

export interface FinanceRevenueProfitTrendItem {
  period: string;
  revenue: number;
  profit: number;
}
export interface FinanceCashFlowTrendItem {
  period: string;
  inflow: number;
  outflow: number;
  netCashFlow: number;
}
