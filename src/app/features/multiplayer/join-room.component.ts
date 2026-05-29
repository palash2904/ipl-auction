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

  protected readonly form = this.fb.nonNullable.group({
    displayName: ['', [Validators.required, Validators.minLength(2)]],
    teamId: ['', Validators.required],
  });

  protected async join(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.joining = true;
    await this.session.join(this.form.controls.displayName.value, this.form.controls.teamId.value);
    this.joining = false;
    this.router.navigateByUrl('/auction');
  }
}
