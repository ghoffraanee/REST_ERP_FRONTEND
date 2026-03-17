import { Routes } from '@angular/router';
import { MainLayout } from './layout/main-layout/main-layout';
import { OverviewComponent } from './features/bi/pages/overview/overview';
import { HrAnalytics } from './features/bi/pages/hr-analytics/hr-analytics';
import { FinanceAnalytics } from './features/bi/pages/finance-analytics/finance-analytics';
import { CrmSales } from './features/bi/pages/crm-sales/crm-sales';

export const routes: Routes = [
  {
    path: '',
    component: MainLayout,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { path: 'overview', component: OverviewComponent },
      { path: 'hr-analytics', component: HrAnalytics },
      { path: 'finance-analytics', component: FinanceAnalytics },
      { path: 'crm-sales', component: CrmSales }
    ]
  }
];