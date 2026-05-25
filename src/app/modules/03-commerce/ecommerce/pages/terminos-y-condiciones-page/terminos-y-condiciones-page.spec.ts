import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TerminosYCondicionesPage } from './terminos-y-condiciones-page';

describe('TerminosYCondicionesPage', () => {
  let component: TerminosYCondicionesPage;
  let fixture: ComponentFixture<TerminosYCondicionesPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TerminosYCondicionesPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TerminosYCondicionesPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
