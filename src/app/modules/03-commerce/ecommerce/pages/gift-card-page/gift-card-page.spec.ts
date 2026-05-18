import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GiftCardPage } from './gift-card-page';

describe('GiftCardPage', () => {
  let component: GiftCardPage;
  let fixture: ComponentFixture<GiftCardPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GiftCardPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GiftCardPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
