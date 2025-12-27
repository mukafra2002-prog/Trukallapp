import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export function useDeviceFeatures() {
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online!');
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('You are offline. Some features may be limited.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Get GPS location
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const error = 'Geolocation is not supported by your device';
        setLocationError(error);
        reject(error);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          setLocation(locationData);
          setLocationError(null);
          resolve(locationData);
        },
        (error) => {
          let errorMessage = 'Unable to get your location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied. Please enable in settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }
          setLocationError(errorMessage);
          toast.error(errorMessage);
          reject(errorMessage);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };

  // Watch location continuously
  const watchLocation = (callback) => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return null;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed,
          heading: position.coords.heading
        };
        setLocation(locationData);
        callback(locationData);
      },
      (error) => {
        console.error('Location watch error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  };

  // Camera for document scanning
  const capturePhoto = async () => {
    try {
      // Check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Camera not available on this device');
        return null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      return stream;
    } catch (error) {
      console.error('Camera error:', error);
      toast.error('Unable to access camera. Please check permissions.');
      return null;
    }
  };

  // File picker for document upload
  const pickFile = () => {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,application/pdf';
      input.capture = 'environment'; // Use camera on mobile
      
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            resolve({
              file,
              dataUrl: event.target.result,
              name: file.name,
              type: file.type,
              size: file.size
            });
          };
          reader.readAsDataURL(file);
        } else {
          resolve(null);
        }
      };
      
      input.click();
    });
  };

  // Biometric authentication
  const authenticateWithBiometrics = async () => {
    try {
      // Check if WebAuthn is available
      if (!window.PublicKeyCredential) {
        toast.info('Biometric auth not available on this device');
        return false;
      }

      // Check if biometrics are available
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      
      if (!available) {
        toast.info('Biometric authentication not set up on this device');
        return false;
      }

      toast.success('Biometric authentication available!');
      return true;
    } catch (error) {
      console.error('Biometric check error:', error);
      return false;
    }
  };

  // Vibrate device for alerts
  const vibrate = (pattern = [200]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  // Request notification permission
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Notifications not supported on this device');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast.success('Notifications enabled!');
        return true;
      }
    }

    toast.error('Please enable notifications in your device settings');
    return false;
  };

  // Show local notification
  const showNotification = (title, options = {}) => {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/truck-icon-192.png',
        badge: '/truck-icon-192.png',
        vibrate: [200, 100, 200],
        ...options
      });
    }
  };

  // Check if running in standalone mode (installed as PWA)
  const isStandalone = () => {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    );
  };

  // Share functionality
  const shareContent = async (data) => {
    if (navigator.share) {
      try {
        await navigator.share(data);
        return true;
      } catch (error) {
        console.error('Share failed:', error);
        return false;
      }
    } else {
      toast.info('Share not supported on this device');
      return false;
    }
  };

  // Battery status
  const getBatteryInfo = async () => {
    if ('getBattery' in navigator) {
      const battery = await navigator.getBattery();
      return {
        level: Math.round(battery.level * 100),
        charging: battery.charging
      };
    }
    return null;
  };

  // Check device type
  const getDeviceType = () => {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  };

  // Check if iOS
  const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  };

  // Check if Android
  const isAndroid = () => {
    return /Android/.test(navigator.userAgent);
  };

  return {
    // Location
    location,
    locationError,
    getCurrentLocation,
    watchLocation,
    
    // Camera & Files
    capturePhoto,
    pickFile,
    
    // Biometric
    authenticateWithBiometrics,
    
    // Notifications
    requestNotificationPermission,
    showNotification,
    vibrate,
    
    // Device info
    isOnline,
    isStandalone: isStandalone(),
    deviceType: getDeviceType(),
    isIOS: isIOS(),
    isAndroid: isAndroid(),
    
    // Utilities
    shareContent,
    getBatteryInfo
  };
}
