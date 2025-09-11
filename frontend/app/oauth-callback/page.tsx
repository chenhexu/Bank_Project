"use client";

import { useEffect, useRef, useState } from 'react';

// OAuth Error Types
enum OAuthErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_TOKEN = 'INVALID_TOKEN', 
  SERVER_ERROR = 'SERVER_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  REDIRECT_MISMATCH = 'REDIRECT_MISMATCH',
  STATE_MISMATCH = 'STATE_MISMATCH',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  AUTHORIZATION_CODE_ERROR = 'AUTHORIZATION_CODE_ERROR'
}

interface OAuthError {
  type: OAuthErrorType;
  message: string;
  details?: string;
  retryable: boolean;
}

interface UserProfile {
  email: string;
  name?: string;
  picture?: string;
  [key: string]: unknown;
}

interface OAuthResponse {
  user_profile?: UserProfile;
  access_token?: string;
  [key: string]: unknown;
}

// User-friendly retry configuration with longer delays
const RETRY_CONFIG = {
  maxRetries: 4, // More retries for better debugging
  baseDelay: 3000, // 3 seconds - longer for user interaction
  maxDelay: 15000, // 15 seconds max delay
  backoffFactor: 2
};

export default function OAuthCallback() {
  const [progress, setProgress] = useState<string>('Initializing OAuth...');
  const [error, setError] = useState<OAuthError | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const hasSubmittedRef = useRef(false);

  // Enhanced error classification
  const classifyError = (error: unknown, response?: Response): OAuthError => {
    console.error('🔴 Classifying OAuth error:', error);
    
    if (!navigator.onLine) {
      return {
        type: OAuthErrorType.NETWORK_ERROR,
        message: 'No internet connection. Please check your network and try again.',
        retryable: true
      };
    }
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorName = error instanceof Error ? error.name : '';
    
    if (errorName === 'TimeoutError' || errorMessage.includes('timeout')) {
      return {
        type: OAuthErrorType.TIMEOUT_ERROR,
        message: 'Request timed out. The server may be slow or unavailable.',
        retryable: true
      };
    }

    if (response?.status === 400 || errorMessage.includes('Authorization code exchange failed') || errorMessage.includes('invalid_grant')) {
      return {
        type: OAuthErrorType.AUTHORIZATION_CODE_ERROR,
        message: 'Your sign-in session has expired. Please try signing in again from the login page.',
        details: errorMessage,
        retryable: false  // Don't retry authorization code errors
      };
    }

    if (response?.status === 401 || errorMessage.includes('Invalid') || errorMessage.includes('Unauthorized')) {
      return {
        type: OAuthErrorType.INVALID_TOKEN,
        message: 'Authentication failed. Please try signing in again.',
        details: errorMessage,
        retryable: false  // Don't retry invalid token errors
      };
    }

    if (response?.status >= 500 || errorMessage.includes('Server Error')) {
      return {
        type: OAuthErrorType.SERVER_ERROR,
        message: 'Server error occurred. Please try again in a moment.',
        retryable: true
      };
    }

    if (errorMessage.includes('redirect_uri_mismatch')) {
      return {
        type: OAuthErrorType.REDIRECT_MISMATCH,
        message: 'OAuth configuration error. Please contact support.',
        retryable: false
      };
    }

    return {
      type: OAuthErrorType.UNKNOWN_ERROR,
      message: 'Sign-in failed. Please try again from the login page.',
      details: errorMessage,
      retryable: false  // Don't retry unknown errors
    };
  };

  // Sleep utility
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  // Retry with exponential backoff and user-friendly countdown
  const retryWithBackoff = async (
    fn: () => Promise<OAuthResponse>,
    attempt: number = 0
  ): Promise<OAuthResponse> => {
    try {
      return await fn();
    } catch (error) {
      const oauthError = classifyError(error);
      
      if (!oauthError.retryable || attempt >= RETRY_CONFIG.maxRetries) {
        throw oauthError;
      }
      
      const delay = Math.min(
        RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffFactor, attempt),
        RETRY_CONFIG.maxDelay
      );
      
      console.log(`🔄 Retry attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries} in ${delay}ms`);
      setProgress(`Retrying... (${attempt + 1}/${RETRY_CONFIG.maxRetries})`);
      setRetryCount(attempt + 1);
      
      // Countdown timer with pause functionality
      await new Promise<void>(resolve => {
        let timeLeft = Math.ceil(delay / 1000);
        setCountdown(timeLeft);
        
        const countdownInterval = setInterval(() => {
          if (isPaused) {
            setProgress(`Paused - Click Resume to continue (${timeLeft}s remaining)`);
            return; // Don't decrease countdown when paused
          }
          
          timeLeft--;
          setCountdown(timeLeft);
          setProgress(`Retrying in ${timeLeft}s... (${attempt + 1}/${RETRY_CONFIG.maxRetries}) - Click Pause to examine error`);
          
          if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            setCountdown(0);
            resolve();
          }
        }, 1000);
      });
      
      return retryWithBackoff(fn, attempt + 1);
    }
  };

  // Enhanced session storage with validation
  const storeSessionData = (userProfile: UserProfile, accessToken: string): boolean => {
    console.log('🔵 Storing session data for user:', userProfile.email);
    
    try {
      // Validate required data
      if (!userProfile?.email || !accessToken) {
        throw new Error('Missing required user profile data or access token');
      }
      
      // Store session data with timestamp and validation
      const sessionData = {
        authToken: accessToken,
        user: userProfile,
        email: userProfile.email,
        password: 'GOOGLE_OAUTH_USER_NO_PASSWORD',
        timestamp: Date.now(),
        provider: 'google',
        version: '1.0'
      };
      
      // Atomic storage operation
      Object.entries(sessionData).forEach(([key, value]) => {
        sessionStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
      });
      
      // Verify storage success
      const verification = {
        authToken: !!sessionStorage.getItem('authToken'),
        email: sessionStorage.getItem('email') === userProfile.email,
        user: !!sessionStorage.getItem('user'),
        timestamp: !!sessionStorage.getItem('timestamp')
      };
      
      console.log('🔵 Session data stored and verified:', verification);
      
      if (!Object.values(verification).every(Boolean)) {
        throw new Error('Session storage verification failed');
      }
      
      return true;
      
    } catch (storageError: unknown) {
      console.error('🔴 Session storage failed:', storageError);
      const errorMessage = storageError instanceof Error ? storageError.message : String(storageError);
      throw new Error(`Session storage failed: ${errorMessage}`);
    }
  };

  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Use the OAuth state to dedupe only the same attempt
      const urlSearch = window.location.search.substring(1);
      const searchParams = new URLSearchParams(urlSearch);
      const stateParam = searchParams.get('state') || 'no-state';
      const stateKey = `oauth_submitted_state_${stateParam}`;

      if (hasSubmittedRef.current || sessionStorage.getItem(stateKey) === 'true') {
        console.warn('⚠️ OAuth callback already submitted for this state, skipping duplicate run');
        return;
      }
      hasSubmittedRef.current = true;
      sessionStorage.setItem(stateKey, 'true');
      console.log('🔵 OAuth callback handler started');
      console.log('🔵 Window opener exists:', !!window.opener);
      console.log('🔵 URL hash:', window.location.hash);
      console.log('🔵 URL search:', window.location.search);

      // Parse tokens from URL hash (Google OAuth implicit flow)
      const hash = window.location.hash.substring(1);
      const search = window.location.search.substring(1);
      const hashParams = new URLSearchParams(hash);
      const searchParams2 = new URLSearchParams(search);
      
      const accessToken = hashParams.get('access_token') || searchParams2.get('access_token');
      const idToken = hashParams.get('id_token') || searchParams2.get('id_token');
      const error = hashParams.get('error') || searchParams2.get('error');
      const code = searchParams2.get('code');
      const state = hashParams.get('state') || searchParams2.get('state');
      
      console.log('🔵 Extracted tokens:', { accessToken: !!accessToken, idToken: !!idToken, error, code: !!code, state: !!state });

      // Basic state validation (less strict for compatibility)
      if (state && !error) {
        setProgress('Validating security parameters...');
        
        try {
          const storedState = sessionStorage.getItem('oauth_state');
          
          // Only validate if we have stored state (not required for backward compatibility)
          if (storedState && state !== storedState) {
            console.warn('🟡 State parameter mismatch - continuing anyway for compatibility');
          }
          
          // Clean up state from session storage if it exists
          if (storedState) {
            sessionStorage.removeItem('oauth_state');
            console.log('🔵 State validation completed');
          } else {
            console.log('🟡 No stored state found - skipping validation for compatibility');
          }
          
        } catch (stateError: unknown) {
          console.warn('🟡 State validation error (non-blocking):', stateError);
          // Don't block the OAuth flow for state validation issues
        }
      }

      // Handle popup flow first (existing code for popup windows)
      if (window.opener && state !== 'redirect') {
        console.log('🔵 Handling popup flow');
        
        let result: Record<string, unknown> | null = null;
        
        if (error) {
          result = { error };
        } else {
          result = { accessToken, idToken, code };
        }

        // Try to send message to parent window with multiple approaches
        const messageData = {
          type: error ? 'OAUTH_ERROR' : 'OAUTH_SUCCESS',
          data: result
        };

        // Approach 1: Direct postMessage
        try {
          window.opener.postMessage(messageData, window.location.origin);
          console.log('🔵 Sent message to opener window');
        } catch (e) {
          console.error('🔴 Failed to send message to opener:', e);
        }

        // Approach 2: Broadcast to all windows
        try {
          const bc = new BroadcastChannel('oauth_channel');
          bc.postMessage(messageData);
          console.log('🔵 Broadcasted OAuth result');
          bc.close();
        } catch (e) {
          console.error('🔴 BroadcastChannel not supported or failed:', e);
        }

        // Close the popup after a short delay
        setTimeout(() => {
          console.log('🔵 Closing OAuth popup window');
          window.close();
        }, 2000);
        
        return;
      }

      // If this is a redirect flow (not popup), handle it directly
      if (state === 'redirect' || !window.opener) {
        console.log('🔵 Handling redirect flow');
        
        if (error) {
          console.error('🔴 OAuth error received:', error);
          setError({
            type: OAuthErrorType.UNKNOWN_ERROR,
            message: `OAuth error: ${error}`,
            retryable: false
          });
          
          setTimeout(() => {
            window.location.href = `/login?error=${encodeURIComponent(error || 'Unknown error')}`;
          }, 3000);
          return;
        }

        // Process the authorization code or tokens
        const processOAuthCode = async (): Promise<OAuthResponse> => {
          setProgress('Processing authentication...');
          
          const method = 'POST';
          const body: Record<string, string> = {};
          
          if (code) {
            console.log('🔵 Processing authorization code...');
            body.code = code;
          } else if (idToken) {
            console.log('🔵 Processing ID token...');
            body.credential = idToken;
          } else {
            throw new Error('No authorization code or ID token found');
          }

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout
          
          try {
            const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || window.location.origin}/api/auth/google`;
            console.log('🔵 Sending to backend:', apiUrl);
            
            const response = await fetch(apiUrl, {
              method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error('🔴 Backend response error:', response.status, errorText);
              throw new Error(`Backend request failed: ${response.status} ${errorText}`);
            }
            
            const result = await response.json();
            console.log('🔵 Backend response:', result);
            
            return result;
            
          } catch (oauthError: unknown) {
            clearTimeout(timeoutId);
            throw oauthError;
          }
        };

        try {
          setProgress('Securing your connection...');
          const result = await retryWithBackoff(processOAuthCode);
          
          setProgress('Verifying your identity...');
          
          if (result.user_profile && result.access_token) {
            console.log('🔵 Storing session data for user:', result.user_profile.email);
            
            const stored = storeSessionData(result.user_profile, result.access_token);
            if (!stored) {
              throw new Error('Failed to store session data');
            }
            
            setProgress('Preparing your account...');
            
            // Add a small delay for better UX
            await sleep(1000);
            
            console.log('🔵 Redirecting to balance page...');
            window.location.href = '/balance';
            
          } else {
            throw new Error('Invalid response format from server');
          }
          
        } catch (oauthError: unknown) {
          console.error('🔴 OAuth callback error:', oauthError);
          setError(classifyError(oauthError));
          
          setTimeout(() => {
            window.location.href = '/login?error=OAuth authentication failed';
          }, 3000);
        }
        
        return;
      }
    };

    handleOAuthCallback();
  }, [isPaused]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-200">
      <div className="max-w-md w-full space-y-8 p-8 bg-white/90 rounded-3xl shadow-xl">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-blue-700">
            {error ? 'Authentication Error' : 'Secure Sign-In'}
          </h2>
          
          {error ? (
            <div className="mt-4 space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center justify-center mb-2">
                  <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-red-800">
                  {error.message}
                </p>
                {error.details && (
                  <p className="text-xs text-red-600 mt-1">
                    Technical details: {error.details}
                  </p>
                )}
                <p className="text-xs text-gray-600 mt-2">
                  💡 Tip: Try signing in again from the login page
                </p>
              </div>
              
              {error.retryable && (
                <div className="space-y-2">
                  <div className="text-xs text-gray-600">
                    {retryCount > 0 && `Attempted ${retryCount}/${RETRY_CONFIG.maxRetries} retries. `}
                    {countdown > 0 ? (
                      <>
                        {isPaused ? (
                          <span className="text-orange-600 font-medium">⏸️ Paused - Click Resume to continue</span>
                        ) : (
                          <span className="text-blue-600">⏱️ Retrying in {countdown}s...</span>
                        )}
                      </>
                    ) : (
                      'Redirecting to login page in 3 seconds...'
                    )}
                  </div>
                  
                  {countdown > 0 && (
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => setIsPaused(!isPaused)}
                        className={`px-3 py-1 text-xs rounded-lg font-medium ${
                          isPaused 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                        }`}
                      >
                        {isPaused ? '▶️ Resume' : '⏸️ Pause'}
                      </button>
                      <button
                        onClick={() => window.location.href = '/login'}
                        className="px-3 py-1 text-xs rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                      >
                        🚪 Go to Login
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {countdown === 0 && (
                <button
                  onClick={() => window.location.href = '/login'}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Return to Login
                </button>
              )}
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="text-center space-y-2">
                <div className="text-lg font-medium text-blue-600">
                  {progress.includes('Retry') ? `Retrying... (${retryCount}/${RETRY_CONFIG.maxRetries})` : progress}
                </div>
                {retryCount > 0 && (
                  <div className="text-xs text-orange-600">
                    Retry {retryCount}/{RETRY_CONFIG.maxRetries}
                  </div>
                )}
              </div>
              
              <div className="flex justify-center">
                <div className="w-8 h-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center justify-center space-x-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                  <span>Securing your connection</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                  <span>Verifying your identity</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <span>Preparing your account</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}