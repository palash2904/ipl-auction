import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SetupPageComponent } from './setup-page.component';

describe('SetupPageComponent', () => {
  let fixture: ComponentFixture<SetupPageComponent>;
  let component: SetupPageComponent;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [SetupPageComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SetupPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('starts with the minimum two valid teams', () => {
    expect((component as unknown as { teams: { length: number } }).teams.length).toBe(2);
    expect((component as unknown as { form: { valid: boolean } }).form.valid).toBeTrue();
  });

  it('detects duplicate franchise names', () => {
    const form = (component as unknown as { form: { controls: { teams: { at: (index: number) => { patchValue: (value: object) => void } } } } }).form;
    form.controls.teams.at(1).patchValue({ franchiseName: 'Dhoni Super Kings' });

    expect((component as unknown as { hasDuplicates: () => boolean }).hasDuplicates()).toBeTrue();
  });
});
