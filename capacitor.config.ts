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
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ["google.com", "phone"],
      google: {
        // Web client ID from Firebase (OAuth client type 3)
        serverClientId: "533305529581-frij9q3gtu1jkj7hb3rtpqqsqb1mltkf.apps.googleusercontent.com",
        scopes: ["profile", "email"],
        forceCodeForRefreshToken: false
      },
    },
  },
};

export default config;