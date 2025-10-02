import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { App } from '@capacitor/app';
import { Keyboard } from '@capacitor/keyboard';

export const initializeMobileApp = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      // Hide splash screen with smooth fade
      await SplashScreen.hide();
      
  // Configure Status Bar
  if (StatusBar) {
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setBackgroundColor({ color: '#8B008B' });
    console.log('✅ Status bar configured');
  }
      
      // Handle app state changes
      App.addListener('appStateChange', ({ isActive }) => {
        console.log('📱 App state changed. Is active:', isActive);
      });

      // Enhanced back button handling (Android)
      App.addListener('backButton', ({ canGoBack }) => {
        // Check if on home page
        const isHomePage = window.location.hash === '#/' || window.location.hash === '';
        
        if (!canGoBack || isHomePage) {
          // Exit app from home page
          App.exitApp();
        } else {
          // Navigate back
          window.history.back();
        }
      });
      
      // Keyboard handling
      if (Keyboard) {
        Keyboard.setAccessoryBarVisible({ isVisible: true });
        
        Keyboard.addListener('keyboardWillShow', () => {
          document.body.classList.add('keyboard-open');
        });
        
        Keyboard.addListener('keyboardWillHide', () => {
          document.body.classList.remove('keyboard-open');
        });
      }
      
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