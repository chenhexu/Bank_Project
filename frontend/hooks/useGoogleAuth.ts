import { useState, useEffect } from 'react';

interface GoogleConfig {
  client_id: string;
  redirect_uri: string;
}

interface GoogleUser {
  email: string;
  username: string;
  display_name: string;
  is_new: boolean;
  linked_account?: boolean;
}

interface GoogleAuthResponse {
  message: string;
  user_profile: GoogleUser;
  access_token: string;
}

declare global {
  interface Window {
    google: any;
    googleSignInCallback: (response: any) => void;
    googleAuthResolver: ((result: GoogleAuthResponse | null) => void) | null;
  }
}

export const useGoogleAuth = () => {
  console.log("🔵 useGoogleAuth hook initialized");
  
  const [isGoogleReady, setIsGoogleReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<GoogleConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Enhanced configuration validation
  const validateConfig = (configData: any): boolean => {
    if (!configData?.client_id) {
      setError('Missing Google OAuth client ID');
      return false;
    }
    
    if (!configData?.redirect_uri) {
      setError('Missing Google OAuth redirect URI');
      return false;
    }
    
    // Validate redirect URI format
    try {
      new URL(configData.redirect_uri);
    } catch {
      setError('Invalid redirect URI format');
      return false;
    }
    
    return true;
  };

  // Simplified configuration loading with basic retry
  const loadConfigWithRetry = async (attempt = 0): Promise<void> => {
    const maxRetries = 2; // Reduced from 3
    const baseDelay = 1000;
    
    try {
      const runtimeOrigin = typeof window !== 'undefined' ? window.location.origin : '';
      const base = runtimeOrigin || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const url = `${base}/api/auth/google/config`;
      console.log(`🔵 useGoogleAuth: Loading config (attempt ${attempt + 1}/${maxRetries + 1}) from:`, url);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Config request failed with status ${response.status}`);
      }
      
      const configData = await response.json();
      console.log('🔵 useGoogleAuth: Raw config response:', configData);
      
      if (!validateConfig(configData)) {
        throw new Error('Invalid configuration received from server');
      }
      
      setConfig(configData);
      setIsGoogleReady(true);
      setError(null);
      setRetryCount(0);
      console.log('🔵 useGoogleAuth: Google OAuth configuration loaded successfully');
      
    } catch (err: any) {
      console.error(`🔴 useGoogleAuth: Config loading error (attempt ${attempt + 1}):`, err);
      
      if (err.name === 'AbortError') {
        setError('Configuration request timed out');
      } else if (!navigator.onLine) {
        setError('No internet connection');
      } else {
        setError(err.message || 'Failed to load OAuth configuration');
      }
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`🔄 useGoogleAuth: Retrying in ${delay}ms...`);
        setRetryCount(attempt + 1);
        
        setTimeout(() => {
          loadConfigWithRetry(attempt + 1);
        }, delay);
      } else {
        console.error('🔴 useGoogleAuth: Max retries exceeded for config loading');
        setIsGoogleReady(false);
      }
    }
  };

  // Load Google OAuth configuration
  useEffect(() => {
    console.log("🔵 useGoogleAuth: useEffect triggered for config loading");
    loadConfigWithRetry();
  }, []);

  // Load Google OAuth SDK
  useEffect(() => {
    if (!config) return;

    const loadGoogleSDK = () => {
      // Check if Google SDK is already loaded
      if (window.google) {
        initializeGoogle();
        return;
      }

      // Load Google SDK script
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogle;
      document.head.appendChild(script);
    };

    const initializeGoogle = () => {
      if (!window.google || !config) return;

      try {
        console.log('Initializing Google OAuth with client_id:', config.client_id);
        
        // Set up the callback function first
        window.googleSignInCallback = async (response: any) => {
          console.log("🔵 Google callback triggered with response:", response);
          try {
            console.log("🔵 Sending credential to backend...");
            // Send the credential to our backend
            const runtimeOrigin = typeof window !== 'undefined' ? window.location.origin : '';
            const base = runtimeOrigin || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            const authResponse = await fetch(`${base}/api/auth/google`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                credential: response.credential,
              }),
            });

            if (authResponse.ok) {
              const data: GoogleAuthResponse = await authResponse.json();
              console.log("🔵 Backend response:", data);
              // Resolve the current promise if one exists
              if (window.googleAuthResolver) {
                window.googleAuthResolver(data);
              }
            } else {
              const errorData = await authResponse.json();
              console.error('🔴 Google authentication failed:', errorData);
              if (window.googleAuthResolver) {
                window.googleAuthResolver(null);
              }
            }
          } catch (error) {
            console.error('🔴 Error during Google authentication:', error);
            if (window.googleAuthResolver) {
              window.googleAuthResolver(null);
            }
          } finally {
            setIsLoading(false);
          }
        };
        
        window.google.accounts.id.initialize({
          client_id: config.client_id,
          callback: window.googleSignInCallback,
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: false, // Disable FedCM to avoid CORS issues
          allowed_parent_origin: window.location.origin, // Add this for localhost
        });
        console.log('Google OAuth initialized successfully');
        setIsGoogleReady(true);
      } catch (error) {
        console.error('Failed to initialize Google OAuth:', error);
      }
    };

    loadGoogleSDK();
  }, [config]);

  const signInWithGoogle = async (): Promise<GoogleAuthResponse | null> => {
    console.log("🔵 signInWithGoogle called");
    console.log("🔵 isGoogleReady:", isGoogleReady);
    console.log("🔵 config:", config);
    console.log("🔵 error:", error);
    
    if (error) {
      console.error('🔴 Google OAuth has configuration errors:', error);
      throw new Error(error);
    }
    
    if (!isGoogleReady || !config) {
      console.error('🔴 Google OAuth not ready - isReady:', isGoogleReady, 'hasConfig:', !!config);
      throw new Error('Google OAuth is not ready. Please wait or refresh the page.');
    }

    setIsLoading(true);

    try {
      // Generate simple state parameter (optional for compatibility)
      const state = btoa(JSON.stringify({
        timestamp: Date.now(),
        nonce: Math.random().toString(36).substring(2, 15),
        flow: 'redirect'
      }));
      
      // Store state in sessionStorage for validation later (optional)
      try {
        sessionStorage.setItem('oauth_state', state);
      } catch (e) {
        console.warn('🟡 Could not store OAuth state - continuing anyway');
      }
      
      // Use authorization code flow for better security
      const oauth2Endpoint = 'https://accounts.google.com/o/oauth2/v2/auth';
      const params = new URLSearchParams({
        client_id: config.client_id,
        redirect_uri: config.redirect_uri,
        response_type: 'code', // Use authorization code flow
        scope: 'openid email profile',
        prompt: 'select_account',
        state: state,
        access_type: 'offline', // For better security
        include_granted_scopes: 'true'
      });

      const authUrl = `${oauth2Endpoint}?${params.toString()}`;
      
      console.log('🔵 Redirecting to Google OAuth with secure parameters');
      console.log('🔵 State parameter:', state.substring(0, 20) + '...');
      console.log('🔵 Redirect URI:', config.redirect_uri);
      
      // Validate the redirect URI before redirecting
      try {
        const redirectUrl = new URL(config.redirect_uri);
        if (redirectUrl.origin !== window.location.origin) {
          throw new Error('Redirect URI origin mismatch');
        }
      } catch (urlError) {
        console.error('🔴 Invalid redirect URI:', config.redirect_uri);
        throw new Error('Invalid OAuth configuration');
      }
      
      // Use redirect flow with timeout protection
      const redirectTimeout = setTimeout(() => {
        console.error('🔴 OAuth redirect timeout');
        setIsLoading(false);
      }, 5000);
      
      // Clear timeout if page unloads (redirect successful)
      window.addEventListener('beforeunload', () => {
        clearTimeout(redirectTimeout);
      });
      
      // Perform redirect
      window.location.href = authUrl;
      
      // This return will never be reached due to the redirect
      return null;

    } catch (error: any) {
      console.error('🔴 signInWithGoogle error:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const renderGoogleButton = (elementId: string) => {
    if (!isGoogleReady || !window.google) return;

    window.google.accounts.id.renderButton(
      document.getElementById(elementId),
      {
        theme: 'outline',
        size: 'large',
        width: '100%',
        text: 'signin_with',
      }
    );
  };

  return {
    isGoogleReady,
    isLoading,
    signInWithGoogle,
    renderGoogleButton,
    config,
    error,
    retryCount
  };
};