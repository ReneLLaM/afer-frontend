import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AcercaDeNosotrosPage } from './acerca-de-nosotros-page';

describe('AcercaDeNosotrosPage', () => {
  let component: AcercaDeNosotrosPage;
  let fixture: ComponentFixture<AcercaDeNosotrosPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AcercaDeNosotrosPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AcercaDeNosotrosPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
