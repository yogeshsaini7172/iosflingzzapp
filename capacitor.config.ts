import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.922cf03d2d724442a9bd1ac1382ad995',
  appName: 'FLINGZZ',
  webDir: 'dist',
  server: {
    url: 'https://922cf03d-2d72-4442-a9bd-1ac1382ad995.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#8B008B',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false
    },
    StatusBar: {
      style: 'LIGHT_CONTENT',
      backgroundColor: '#8B008B'
    }
  }
};

export default config;