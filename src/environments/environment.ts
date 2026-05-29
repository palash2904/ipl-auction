import { FirebaseOptions } from 'firebase/app';

export interface AppEnvironment {
  production: boolean;
  firebase: {
    enabled: boolean;
    aiEnabled: boolean;
    roomId: string;
    aiModel: string;
    config: FirebaseOptions;
  };
}

export const environment: AppEnvironment = {
  production: false,
  firebase: {
    enabled: true,
    aiEnabled: true,
    roomId: 'main-room',
    aiModel: 'gemini-2.0-flash',
    config: {
      apiKey: 'AIzaSyAAVFDpEgPy38Ca66daNLEprPiW7Av_J-c',
      authDomain: 'pl-auction-bff1c.firebaseapp.com',
      projectId: 'pl-auction-bff1c',
      storageBucket: 'pl-auction-bff1c.firebasestorage.app',
      messagingSenderId: '686559393103',
      appId: '1:686559393103:web:d860f47d605318c287c13a',
      measurementId: 'G-6JNR891ETL',
    },
  },
};
