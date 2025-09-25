import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gradsync.app',
  appName: 'Grad Sync',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
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
    // ✅ GoogleAuth plugin removed because we’re using Firebase SDK directly
  },
};

export default config;
