import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuctionStore } from '../../core/services/auction-store.service';

@Component({
  selector: 'app-setup-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './setup-page.component.html',
})
export class SetupPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  protected readonly store = inject(AuctionStore);

  protected readonly form = this.fb.group({
    teams: this.fb.array([
      this.createTeam('Dhoni Super Kings', 'Ananya', '\u{1F981}'),
      this.createTeam('Mumbai Legends', 'Rohan', '\u{1F499}'),
    ]),
  });

  protected readonly teams = this.form.controls.teams;

  protected canAdd(): boolean {
    return this.teams.length < 8;
  }

  protected canRemove(): boolean {
    return this.teams.length > 2;
  }

  addTeam(): void {
    if (this.teams.length >= 8) return;
    this.teams.push(this.createTeam(`Franchise ${this.teams.length + 1}`, '', '\u{1F3CF}'));
  }

  removeTeam(index: number): void {
    if (this.teams.length <= 2) return;
    this.teams.removeAt(index);
  }

  startAuction(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.hasDuplicates()) return;
    this.store.setupAuction(this.teams.getRawValue());
    this.router.navigateByUrl('/join');
  }

  loadSaved(): void {
    if (this.store.loadSavedState()) this.router.navigateByUrl('/auction');
  }

  reset(): void {
    this.store.resetAuction();
  }

  protected hasDuplicates(): boolean {
    return this.hasDuplicateValue('franchiseName') || this.hasDuplicateValue('ownerName');
  }

  protected duplicateMessage(): string {
    if (this.hasDuplicateValue('franchiseName')) return 'Franchise names must be unique.';
    if (this.hasDuplicateValue('ownerName')) return 'Owner names must be unique.';
    return '';
  }

  private createTeam(franchiseName = '', ownerName = '', logoEmoji = '\u{1F3CF}') {
    return this.fb.nonNullable.group({
      ownerName: [ownerName, [Validators.required, Validators.minLength(2)]],
      franchiseName: [franchiseName, [Validators.required, Validators.minLength(2)]],
      logoEmoji: [logoEmoji, Validators.required],
    });
  }

  private hasDuplicateValue(controlName: 'franchiseName' | 'ownerName'): boolean {
    const values = this.teams.controls.map((group) =>
      group.controls[controlName].value.trim().toLowerCase(),
    );
    return new Set(values).size !== values.length;
  }
}
