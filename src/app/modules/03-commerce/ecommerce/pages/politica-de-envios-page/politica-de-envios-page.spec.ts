import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PoliticaDeEnviosPage } from './politica-de-envios-page';

describe('PoliticaDeEnviosPage', () => {
  let component: PoliticaDeEnviosPage;
  let fixture: ComponentFixture<PoliticaDeEnviosPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PoliticaDeEnviosPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PoliticaDeEnviosPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
