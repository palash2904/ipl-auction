import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuctionStore } from '../../core/services/auction-store.service';
import { MultiplayerSessionService } from '../../core/services/multiplayer-session.service';

@Component({
  selector: 'app-join-room',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './join-room.component.html',
})
export class JoinRoomComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  protected readonly store = inject(AuctionStore);
  protected readonly session = inject(MultiplayerSessionService);
  protected joining = false;
  protected joinError = '';

  protected readonly form = this.fb.nonNullable.group({
    displayName: [''],
    teamId: ['', Validators.required],
  });

  protected async join(): Promise<void> {
    this.form.markAllAsTouched();
    this.joinError = '';
    if (!this.form.controls.teamId.value) {
      this.joinError = 'Select your franchise first.';
      return;
    }

    this.joining = true;
    const team = this.store.state().franchises.find((item) => item.id === this.form.controls.teamId.value);
    const displayName = this.form.controls.displayName.value || team?.ownerName || team?.franchiseName || 'Team Owner';
    try {
      await this.session.join(displayName, this.form.controls.teamId.value);
      this.router.navigateByUrl('/auction');
    } catch (error) {
      this.joinError = error instanceof Error ? error.message : 'Unable to join right now.';
    } finally {
      this.joining = false;
    }
  }
}
