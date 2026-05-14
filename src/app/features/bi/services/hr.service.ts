import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HrKpiResponse } from '../models/hr-kpi-response';

export interface HrFilters {
  departmentName?: string | null;
  employeeName?: string | null;
  gender?: string | null;
  position?: string | null;
  employeeType?: string | null;
  active?: boolean | null;
  workstatusLabel?: string | null;
}

export interface HrFilterOption {
  value: any;
  label: string;
}

@Injectable({
  providedIn: 'root'
})
export class HrService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/bi/hr';

  private buildParams(
    startDate?: string,
    endDate?: string,
    filters?: HrFilters
  ): HttpParams {
    let params = new HttpParams();

    if (startDate) {
      params = params.set('startDate', startDate);
    }

    if (endDate) {
      params = params.set('endDate', endDate);
    }

    if (filters?.departmentName) {
      params = params.set('departmentName', filters.departmentName);
    }

    if (filters?.employeeName) {
      params = params.set('employeeName', filters.employeeName);
    }

    if (filters?.gender) {
      params = params.set('gender', filters.gender);
    }

    if (filters?.position) {
      params = params.set('position', filters.position);
    }

    if (filters?.employeeType) {
      params = params.set('employeeType', filters.employeeType);
    }

    if (filters?.active !== null && filters?.active !== undefined) {
      params = params.set('active', String(filters.active));
    }

    if (filters?.workstatusLabel) {
      params = params.set('workstatusLabel', filters.workstatusLabel);
    }

    return params;
  }

  getHrKpis(
    startDate?: string,
    endDate?: string,
    filters?: HrFilters
  ): Observable<HrKpiResponse> {
    const params = this.buildParams(startDate, endDate, filters);

    return this.http.get<HrKpiResponse>(`${this.apiUrl}/kpis`, { params });
  }

  getHeadcountTrend(
    startDate?: string,
    endDate?: string,
    filters?: HrFilters
  ): Observable<any[]> {
    const params = this.buildParams(startDate, endDate, filters);

    return this.http.get<any[]>(`${this.apiUrl}/headcount-trend`, { params });
  }

  getAttendanceTrend(
    startDate?: string,
    endDate?: string,
    filters?: HrFilters
  ): Observable<any[]> {
    const params = this.buildParams(startDate, endDate, filters);

    return this.http.get<any[]>(`${this.apiUrl}/attendance-trend`, { params });
  }

  getTenureDistribution(
    filters?: HrFilters
  ): Observable<any[]> {
    const params = this.buildParams(undefined, undefined, filters);

    return this.http.get<any[]>(`${this.apiUrl}/tenure-distribution`, { params });
  }

  getEmployeesByDepartment(
    startDate?: string,
    endDate?: string,
    filters?: HrFilters
  ): Observable<any[]> {
    const params = this.buildParams(startDate, endDate, filters);

    return this.http.get<any[]>(`${this.apiUrl}/employees-by-department`, { params });
  }

  getSalaryBenchmarking(
    startDate?: string,
    endDate?: string,
    filters?: HrFilters
  ): Observable<any[]> {
    const params = this.buildParams(startDate, endDate, filters);

    return this.http.get<any[]>(`${this.apiUrl}/salary-benchmarking`, { params });
  }

  getHiringFunnel(
    startDate?: string,
    endDate?: string,
    filters?: HrFilters
  ): Observable<any[]> {
    const params = this.buildParams(startDate, endDate, filters);

    return this.http.get<any[]>(`${this.apiUrl}/hiring-funnel`, { params });
  }

  getUpcomingBirthdays(
    filters?: HrFilters
  ): Observable<any[]> {
    const params = this.buildParams(undefined, undefined, filters);

    return this.http.get<any[]>(`${this.apiUrl}/upcoming-birthdays`, { params });
  }

  getDepartmentOptions(): Observable<HrFilterOption[]> {
    return this.http.get<HrFilterOption[]>(`${this.apiUrl}/filter-options/departments`);
  }

  getEmployeeOptions(): Observable<HrFilterOption[]> {
    return this.http.get<HrFilterOption[]>(`${this.apiUrl}/filter-options/employees`);
  }

  getGenderOptions(): Observable<HrFilterOption[]> {
    return this.http.get<HrFilterOption[]>(`${this.apiUrl}/filter-options/genders`);
  }

  getPositionOptions(): Observable<HrFilterOption[]> {
    return this.http.get<HrFilterOption[]>(`${this.apiUrl}/filter-options/positions`);
  }

  getEmployeeTypeOptions(): Observable<HrFilterOption[]> {
    return this.http.get<HrFilterOption[]>(`${this.apiUrl}/filter-options/employee-types`);
  }

  getWorkstatusOptions(): Observable<HrFilterOption[]> {
    return this.http.get<HrFilterOption[]>(`${this.apiUrl}/filter-options/workstatus`);
  }
}