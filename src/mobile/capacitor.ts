import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { App } from '@capacitor/app';

export const initializeMobileApp = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      // Hide splash screen
      await SplashScreen.hide();
      
      // Configure status bar
      await StatusBar.setStyle({ style: Style.Light });
      await StatusBar.setBackgroundColor({ color: '#8B008B' });
      
      // Handle app state changes
      App.addListener('appStateChange', ({ isActive }) => {
        console.log('📱 App state changed. Is active:', isActive);
      });

      // Handle back button (Android)
      App.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack) {
          App.exitApp();
        } else {
          window.history.back();
        }
      });
      
      console.log('📱 Mobile app initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing mobile app:', error);
    }
  } else {
    console.log('🌐 Running in web browser');
  }
};

export const isMobile = () => {
  return Capacitor.isNativePlatform();
};

export const getPlatform = () => {
  return Capacitor.getPlatform();
};