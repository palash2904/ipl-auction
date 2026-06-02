import { Injectable, signal } from '@angular/core';

const SETUP_ACCESS_KEY = 'ipl-auction-setup-access';

@Injectable({ providedIn: 'root' })
export class SetupAuthService {
  private generatedOtp = '';
  private readonly setupAccessSignal = signal(this.loadSetupAccess());

  readonly setupAccess = this.setupAccessSignal.asReadonly();

  setGeneratedOtp(otp: string): void {
    this.generatedOtp = otp;
  }

  verifyOtp(otp: string): boolean {
    const isValid = !!this.generatedOtp && otp.trim() === this.generatedOtp;
    if (!isValid) return false;

    this.setupAccessSignal.set(true);
    localStorage.setItem(SETUP_ACCESS_KEY, 'true');
    this.generatedOtp = '';
    return true;
  }

  logout(): void {
    this.generatedOtp = '';
    this.setupAccessSignal.set(false);
    localStorage.removeItem(SETUP_ACCESS_KEY);
  }

  private loadSetupAccess(): boolean {
    return localStorage.getItem(SETUP_ACCESS_KEY) === 'true';
  }
}
