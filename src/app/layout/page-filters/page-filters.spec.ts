import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PageFilters } from './page-filters';

describe('PageFilters', () => {
  let component: PageFilters;
  let fixture: ComponentFixture<PageFilters>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageFilters],
    }).compileComponents();

    fixture = TestBed.createComponent(PageFilters);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
