import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreguntasFrecuentesPage } from './preguntas-frecuentes-page';

describe('PreguntasFrecuentesPage', () => {
  let component: PreguntasFrecuentesPage;
  let fixture: ComponentFixture<PreguntasFrecuentesPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreguntasFrecuentesPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PreguntasFrecuentesPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
