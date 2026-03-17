import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrmSales } from './crm-sales';

describe('CrmSales', () => {
  let component: CrmSales;
  let fixture: ComponentFixture<CrmSales>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrmSales],
    }).compileComponents();

    fixture = TestBed.createComponent(CrmSales);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
