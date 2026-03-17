import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinanceAnalytics } from './finance-analytics';

describe('FinanceAnalytics', () => {
  let component: FinanceAnalytics;
  let fixture: ComponentFixture<FinanceAnalytics>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FinanceAnalytics],
    }).compileComponents();

    fixture = TestBed.createComponent(FinanceAnalytics);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
