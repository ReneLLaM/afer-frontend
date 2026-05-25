import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PoliticaDePrivacidadPage } from './politica-de-privacidad-page';

describe('PoliticaDePrivacidadPage', () => {
  let component: PoliticaDePrivacidadPage;
  let fixture: ComponentFixture<PoliticaDePrivacidadPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PoliticaDePrivacidadPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PoliticaDePrivacidadPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
