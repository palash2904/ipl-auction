import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AuctionStore } from '../../core/services/auction-store.service';
import { CrorePipe } from '../../shared/pipes/crore.pipe';

@Component({
  selector: 'app-auction-summary',
  standalone: true,
  imports: [CommonModule, CrorePipe],
  templateUrl: './auction-summary.component.html',
})
export class AuctionSummaryComponent {
  protected readonly store = inject(AuctionStore);
}
