import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NuestrosServiciosPage } from './nuestros-servicios-page';

describe('NuestrosServiciosPage', () => {
  let component: NuestrosServiciosPage;
  let fixture: ComponentFixture<NuestrosServiciosPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NuestrosServiciosPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NuestrosServiciosPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
