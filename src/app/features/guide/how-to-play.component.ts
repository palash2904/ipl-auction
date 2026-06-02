import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SetupAuthService } from '../../core/services/setup-auth.service';

@Component({
  selector: 'app-how-to-play',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './how-to-play.component.html',
})
export class HowToPlayComponent {
  protected readonly setupAuth = inject(SetupAuthService);
}
