import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BrandCard } from './brand-card';

describe('BrandCard', () => {
  let component: BrandCard;
  let fixture: ComponentFixture<BrandCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrandCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BrandCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
