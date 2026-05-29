import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AuctionStore } from '../../core/services/auction-store.service';
import { Franchise } from '../../models/auction.models';
import { CrorePipe } from '../../shared/pipes/crore.pipe';

@Component({
  selector: 'app-team-dashboard',
  standalone: true,
  imports: [CommonModule, CrorePipe],
  templateUrl: './team-dashboard.component.html',
})
export class TeamDashboardComponent {
  protected readonly store = inject(AuctionStore);

  roleCount(team: Franchise, role: string): number {
    return this.store.playersForTeam(team.id).filter((player) => player.role === role).length;
  }
}
