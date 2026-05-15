import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeroSlideItem } from './hero-slide-item';

describe('HeroSlideItem', () => {
  let component: HeroSlideItem;
  let fixture: ComponentFixture<HeroSlideItem>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeroSlideItem]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeroSlideItem);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
