import { Injectable } from '@angular/core';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FirebaseAppService {
  readonly enabled = environment.firebase.enabled && !!environment.firebase.config.projectId;

  get app(): FirebaseApp | null {
    if (!this.enabled) return null;
    return getApps().length ? getApp() : initializeApp(environment.firebase.config);
  }
}
