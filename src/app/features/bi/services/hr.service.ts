import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HrKpiResponse } from '../models/hr-kpi-response';

@Injectable({
  providedIn: 'root'
})
export class HrService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/bi/hr';

  getHrKpis(startDate?: string, endDate?: string): Observable<HrKpiResponse> {
    let params = new HttpParams();

    if (startDate) {
      params = params.set('startDate', startDate);
    }

    if (endDate) {
      params = params.set('endDate', endDate);
    }

    return this.http.get<HrKpiResponse>(`${this.apiUrl}/kpis`, { params });
  }

  getHeadcountTrend(startDate?: string, endDate?: string) {
  let params = new HttpParams();

  if (startDate) {
    params = params.set('startDate', startDate);
  }

  if (endDate) {
    params = params.set('endDate', endDate);
  }

  return this.http.get<any[]>(
    `${this.apiUrl}/headcount-trend`,
    { params }
  );
}

getAttendanceTrend(startDate?: string, endDate?: string) {
  let params = new HttpParams();

  if (startDate) {
    params = params.set('startDate', startDate);
  }

  if (endDate) {
    params = params.set('endDate', endDate);
  }

  return this.http.get<any[]>(
    `${this.apiUrl}/attendance-trend`,
    { params }
  );
}

getTenureDistribution() {
  return this.http.get<any[]>(
    `${this.apiUrl}/tenure-distribution`
  );
}

getEmployeesByDepartment(startDate?: string, endDate?: string) {
  let params = new HttpParams();

  if (startDate) {
    params = params.set('startDate', startDate);
  }

  if (endDate) {
    params = params.set('endDate', endDate);
  }

  return this.http.get<any[]>(
    `${this.apiUrl}/employees-by-department`,
    { params }
  );
}

getSalaryBenchmarking(startDate?: string, endDate?: string) {
  let params = new HttpParams();

  if (startDate) {
    params = params.set('startDate', startDate);
  }

  if (endDate) {
    params = params.set('endDate', endDate);
  }

  return this.http.get<any[]>(
    `${this.apiUrl}/salary-benchmarking`,
    { params }
  );
}

getHiringFunnel(startDate?: string, endDate?: string) {
  let params = new HttpParams();

  if (startDate) {
    params = params.set('startDate', startDate);
  }

  if (endDate) {
    params = params.set('endDate', endDate);
  }

  return this.http.get<any[]>(
    `${this.apiUrl}/hiring-funnel`,
    { params }
  );
}

getUpcomingBirthdays() {
  return this.http.get<any[]>(
    `${this.apiUrl}/upcoming-birthdays`
  );
}
}