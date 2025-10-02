import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

/**
 * Haptic feedback utility for better Android experience
 */

export const hapticLight = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      // Silently fail if haptics not available
    }
  }
};

export const hapticMedium = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (error) {
      // Silently fail if haptics not available
    }
  }
};

export const hapticHeavy = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (error) {
      // Silently fail if haptics not available
    }
  }
};

export const hapticSuccess = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch (error) {
      // Silently fail if haptics not available
    }
  }
};

export const hapticError = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch (error) {
      // Silently fail if haptics not available
    }
  }
};

export const hapticWarning = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      await Haptics.notification({ type: NotificationType.Warning });
    } catch (error) {
      // Silently fail if haptics not available
    }
  }
};

