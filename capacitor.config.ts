import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gradsync.app',
  appName: 'Grad Sync', 
  webDir: 'dist',
  server: {
    androidScheme: 'http',
    url: 'http://10.0.2.2:8080',
    cleartext: true,
    allowNavigation: [
      '10.0.2.2',
      'accounts.google.com',
      'datingapp-275cb.firebaseapp.com',
      'datingapp-275cb.web.app'
    ]
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#8B008B",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
      androidSpinnerStyle: "large",
      spinnerColor: "#ffffff",
    },
    StatusBar: {
      style: 'LIGHT_CONTENT',
      backgroundColor: '#8B008B',
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;