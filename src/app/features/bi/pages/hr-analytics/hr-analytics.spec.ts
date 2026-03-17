import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HrAnalytics } from './hr-analytics';

describe('HrAnalytics', () => {
  let component: HrAnalytics;
  let fixture: ComponentFixture<HrAnalytics>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HrAnalytics],
    }).compileComponents();

    fixture = TestBed.createComponent(HrAnalytics);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
