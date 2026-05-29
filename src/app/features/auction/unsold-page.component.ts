import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AuctionStore } from '../../core/services/auction-store.service';
import { CrorePipe } from '../../shared/pipes/crore.pipe';

@Component({
  selector: 'app-unsold-page',
  standalone: true,
  imports: [CommonModule, CrorePipe],
  templateUrl: './unsold-page.component.html',
})
export class UnsoldPageComponent {
  protected readonly store = inject(AuctionStore);
}
