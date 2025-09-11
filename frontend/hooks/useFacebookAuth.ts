import { useState, useEffect } from 'react';

interface FacebookConfig {
  app_id: string;
  redirect_uri: string;
}

interface FacebookUser {
  email: string;
  username: string;
  display_name: string;
  is_new: boolean;
  linked_account?: boolean;
}

interface FacebookAuthResponse {
  message: string;
  user_profile: FacebookUser;
}

interface FacebookLoginResponse {
  authResponse: {
    accessToken: string;
    userID: string;
    expiresIn: number;
    signedRequest: string;
  };
  status: string;
}

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
    facebookAuthResolver: {
      resolve: (result: FacebookAuthResponse | null) => void;
      reject: (error: any) => void;
    } | null;
  }
}

export const useFacebookAuth = () => {
  const [isFacebookReady, setIsFacebookReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<FacebookConfig | null>(null);
  
  // Check if we're on HTTP (Facebook requires HTTPS)
  const isHttpOnly = typeof window !== 'undefined' && window.location.protocol === 'http:';

  // Load Facebook OAuth configuration
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || window.location.origin}/api/auth/facebook/config`);
        if (response.ok) {
          const configData = await response.json();
          console.log('Facebook OAuth config loaded:', configData);
          setConfig(configData);
        } else {
          console.error('Failed to load Facebook config, status:', response.status);
        }
      } catch (error) {
        console.error('Failed to load Facebook OAuth config:', error);
      }
    };

    loadConfig();
  }, []);

  // Initialize Facebook SDK
  useEffect(() => {
    if (!config) return;

    const initializeFacebook = async () => {
      try {
        console.log('Initializing Facebook SDK...');
        
        // Load Facebook SDK
        if (!window.FB) {
          await loadFacebookSDK();
        }

        // Initialize Facebook SDK
        window.FB.init({
          appId: config.app_id,
          cookie: true,
          xfbml: true,
          version: 'v18.0'
        });

        console.log('Facebook SDK initialized successfully');
        setIsFacebookReady(true);

      } catch (error) {
        console.error('Facebook SDK initialization failed:', error);
        setIsFacebookReady(false);
      }
    };

    initializeFacebook();
  }, [config]);

  const loadFacebookSDK = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.FB) {
        resolve();
        return;
      }

      // Create script element
      const script = document.createElement('script');
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';

      script.onload = () => {
        console.log('Facebook SDK script loaded');
        resolve();
      };

      script.onerror = () => {
        console.error('Failed to load Facebook SDK script');
        reject(new Error('Failed to load Facebook SDK'));
      };

      document.head.appendChild(script);
    });
  };

  const signInWithFacebook = (): Promise<FacebookAuthResponse | null> => {
    return new Promise((resolve, reject) => {
      // Check if we're on HTTP - Facebook requires HTTPS
      const isHttp = window.location.protocol === 'http:';
      
      if (isHttp) {
        console.warn('⚠️ Facebook OAuth requires HTTPS and is not available on HTTP.');
        setIsLoading(false);
        reject(new Error('Facebook OAuth requires HTTPS. Please use HTTPS to access Facebook login.'));
        return;
      }

      if (!isFacebookReady || !window.FB) {
        reject(new Error('Facebook SDK not ready'));
        return;
      }

      console.log('Starting Facebook login...');
      setIsLoading(true);

      // Store resolver for callback
      window.facebookAuthResolver = { resolve, reject };

      // Start Facebook login flow
      window.FB.login((response: FacebookLoginResponse) => {
        console.log('Facebook login response:', response);
        
        if (response.status === 'connected') {
          // User logged in and authorized app
          const accessToken = response.authResponse.accessToken;
          console.log('Facebook login successful, access token received');

          // Send access token to backend
          sendTokenToBackend(accessToken)
            .then((backendResponse) => {
              console.log('Backend authentication successful:', backendResponse);
              if (window.facebookAuthResolver) {
                window.facebookAuthResolver.resolve(backendResponse);
                window.facebookAuthResolver = null;
              }
            })
            .catch((error) => {
              console.error('Backend authentication failed:', error);
              if (window.facebookAuthResolver) {
                window.facebookAuthResolver.reject(error);
                window.facebookAuthResolver = null;
              }
            })
            .finally(() => {
              setIsLoading(false);
            });

        } else {
          // User cancelled login or didn't fully authorize
          console.log('Facebook login cancelled or failed');
          if (window.facebookAuthResolver) {
            window.facebookAuthResolver.resolve(null);
            window.facebookAuthResolver = null;
          }
          setIsLoading(false);
        }
      }, { scope: 'email,public_profile' });
    });
  };

  const sendTokenToBackend = async (accessToken: string): Promise<FacebookAuthResponse> => {
    console.log('Sending Facebook access token to backend...');
    
    try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || window.location.origin}/api/auth/facebook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: accessToken
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Backend authentication failed: ${response.status} ${errorData}`);
      }

      const result = await response.json();
      console.log('Backend response:', result);
      return result;

    } catch (error) {
      console.error('Error sending token to backend:', error);
      throw error;
    }
  };

  return {
    isFacebookReady: isFacebookReady && !isHttpOnly, // Only ready if HTTPS
    isLoading,
    signInWithFacebook,
    config,
    isHttpOnly, // Expose HTTP-only status for UI messages
    requiresHttps: isHttpOnly // Clear flag indicating HTTPS requirement
  };
};