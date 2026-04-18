import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComponentesModalComponent } from './componentes-modal.component';

describe('ComponentesModalComponent', () => {
  let component: ComponentesModalComponent;
  let fixture: ComponentFixture<ComponentesModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComponentesModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ComponentesModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
