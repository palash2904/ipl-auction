import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import emailjs from '@emailjs/browser';
import { SetupAuthService } from '../../core/services/setup-auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './login-page.component.html',
})
export class LoginPageComponent {
  private readonly router = inject(Router);
  private readonly setupAuth = inject(SetupAuthService);

  protected loginError = '';
  protected otpSent = false;
  protected enteredOtp = '';

  formData = {
    from_name: '',
    from_email: ''
  };

  sendEmail() {
    this.loginError = '';
    this.otpSent = false;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    this.setupAuth.setGeneratedOtp(otp);

    const expiryTime = new Date(
      Date.now() + 15 * 60 * 1000
    ).toLocaleTimeString();

    emailjs.send(
      'service_3rf05ne',
      'template_947c63i',
      {
        passcode: otp,
        time: expiryTime,
        email: this.formData.from_email
      },
      'ytNS73UeBqMxeuJvB'
    )
      .then((response) => {
        console.log('SUCCESS!', response);
        this.otpSent = true;
        this.enteredOtp = '';
        alert('OTP sent successfully');
      })
      .catch((error) => {
        this.setupAuth.setGeneratedOtp('');
        this.loginError = 'Enter a valid email and password.';
        console.error('FAILED!', error);
        alert('Failed to send OTP');
      });
  }

  verifyOtp(): void {
    this.loginError = '';
    if (this.setupAuth.verifyOtp(this.enteredOtp)) {
      this.router.navigateByUrl('/setup');
      return;
    }

    this.loginError = 'Invalid OTP. Please enter the OTP sent to your email.';
  }

}
