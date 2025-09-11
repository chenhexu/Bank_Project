/**
 * Session Recovery Utility
 * Provides robust mechanisms to recover from broken or corrupted OAuth sessions
 */

export interface SessionData {
  authToken?: string;
  user?: any;
  email?: string;
  password?: string;
  timestamp?: number;
  version?: string;
}

export interface RecoveryResult {
  success: boolean;
  data?: SessionData;
  error?: string;
  source?: 'primary' | 'backup' | 'localStorage' | 'none';
}

/**
 * Attempts to recover OAuth session from multiple sources with enhanced validation
 */
export const recoverOAuthSession = (): RecoveryResult => {
  console.log('🔄 Attempting comprehensive OAuth session recovery...');
  
  try {
    // Method 1: Check primary session storage with enhanced validation
    const primaryCheck = checkPrimarySessionEnhanced();
    if (primaryCheck.success) {
      console.log('✅ Session recovered from primary storage with validation');
      return primaryCheck;
    }
    
    // Method 2: Check backup session storage
    const backupCheck = checkBackupSession();
    if (backupCheck.success) {
      console.log('✅ Session recovered from backup storage, restoring primary...');
      restorePrimarySessionEnhanced(backupCheck.data!);
      return { ...backupCheck, source: 'backup' };
    }
    
    // Method 3: Check localStorage for last successful OAuth with validation
    const localStorageCheck = checkLocalStorageSessionEnhanced();
    if (localStorageCheck.success) {
      console.log('⚠️ Partial session recovered from localStorage with validation');
      return localStorageCheck;
    }
    
    // Method 4: Attempt recovery from browser memory (if page refresh)
    const memoryCheck = checkBrowserMemorySession();
    if (memoryCheck.success) {
      console.log('🔄 Session recovered from browser memory');
      return memoryCheck;
    }
    
    console.log('❌ No recoverable OAuth session found after comprehensive check');
    return { success: false, error: 'No recoverable session found', source: 'none' };
    
  } catch (error: any) {
    console.error('🔴 Session recovery failed:', error);
    return { success: false, error: error.message, source: 'none' };
  }
};

/**
 * Enhanced primary session check with validation
 */
const checkPrimarySessionEnhanced = (): RecoveryResult => {
  try {
    const authToken = sessionStorage.getItem('authToken');
    const email = sessionStorage.getItem('email');
    const password = sessionStorage.getItem('password');
    const userStr = sessionStorage.getItem('user');
    const timestamp = sessionStorage.getItem('timestamp');
    const provider = sessionStorage.getItem('provider');
    const version = sessionStorage.getItem('version');
    
    // Enhanced validation
    if (!authToken || !email || !password || !userStr) {
      console.log('🔴 Primary session missing required fields');
      return { success: false, error: 'Incomplete primary session', source: 'primary' };
    }
    
    // Validate OAuth session markers
    const isOAuthUser = password === 'GOOGLE_OAUTH_USER_NO_PASSWORD' || password === 'FACEBOOK_OAUTH_USER_NO_PASSWORD';
    
    let user;
    try {
      user = JSON.parse(userStr);
    } catch {
      console.log('🔴 Primary session has invalid user data');
      return { success: false, error: 'Invalid user data in session', source: 'primary' };
    }
    
    // Additional validation for OAuth users
    if (isOAuthUser && (!user.email || user.email !== email)) {
      console.log('🔴 OAuth session validation failed');
      return { success: false, error: 'OAuth session validation failed', source: 'primary' };
    }
    
    // Check session age (max 24 hours)
    if (timestamp) {
      const sessionAge = Date.now() - parseInt(timestamp);
      if (sessionAge > 24 * 60 * 60 * 1000) { // 24 hours
        console.log('🔴 Session expired (age check)');
        return { success: false, error: 'Session expired', source: 'primary' };
      }
    }
    
    // Validate provider for OAuth sessions
    if (isOAuthUser && provider !== 'google' && provider !== 'facebook') {
      console.log('🔴 Invalid OAuth provider');
      return { success: false, error: 'Invalid OAuth provider', source: 'primary' };
    }
    
    console.log('✅ Primary session validation passed');
    return {
      success: true,
      data: { authToken, email, password, user, timestamp: timestamp ? parseInt(timestamp) : Date.now() },
      source: 'primary'
    };
    
  } catch (error: any) {
    console.error('🔴 Primary session check error:', error);
    return { success: false, error: error.message, source: 'primary' };
  }
};

/**
 * Browser memory session check (for page refreshes)
 */
const checkBrowserMemorySession = (): RecoveryResult => {
  try {
    // Check if there's a recent OAuth result in memory
    const oauthResult = localStorage.getItem('oauth_result');
    if (oauthResult) {
      const result = JSON.parse(oauthResult);
      const resultAge = Date.now() - result.timestamp;
      
      // Only use if less than 5 minutes old
      if (resultAge < 5 * 60 * 1000) {
        console.log('🔄 Found recent OAuth result in browser memory');
        return {
          success: true,
          data: {
            email: result.email,
            authToken: result.accessToken,
            user: result.user,
            password: 'GOOGLE_OAUTH_USER_NO_PASSWORD'
          },
          source: 'localStorage'
        };
      }
    }
    
    return { success: false, error: 'No recent browser memory session', source: 'none' };
  } catch (error: any) {
    return { success: false, error: error.message, source: 'none' };
  }
};

/**
 * Enhanced localStorage session check
 */
const checkLocalStorageSessionEnhanced = (): RecoveryResult => {
  try {
    const authToken = localStorage.getItem('authToken');
    const email = localStorage.getItem('email');
    const userStr = localStorage.getItem('user');
    
    if (authToken && email && userStr) {
      try {
        const user = JSON.parse(userStr);
        
        // Validate data integrity
        if (user.email === email) {
          console.log('✅ localStorage session validation passed');
          return {
            success: true,
            data: { 
              authToken, 
              email, 
              user,
              password: 'GOOGLE_OAUTH_USER_NO_PASSWORD'
            },
            source: 'localStorage'
          };
        }
      } catch {
        console.log('🔴 localStorage has invalid user data');
      }
    }
    
    // Check for partial data that might be useful
    if (email) {
      console.log('⚠️ Found partial localStorage session');
      return {
        success: false,
        data: { email },
        error: 'Partial localStorage session',
        source: 'localStorage'
      };
    }
    
    return { success: false, error: 'No localStorage session', source: 'localStorage' };
  } catch (error: any) {
    return { success: false, error: error.message, source: 'localStorage' };
  }
};

/**
 * Enhanced session restoration
 */
const restorePrimarySessionEnhanced = (data: SessionData): void => {
  try {
    console.log('🔄 Restoring session with enhanced validation...');
    
    // Validate required data before restoration
    if (!data.email || !data.authToken) {
      throw new Error('Cannot restore session: missing required data');
    }
    
    // Restore with timestamp and validation markers
    sessionStorage.setItem('authToken', data.authToken);
    sessionStorage.setItem('email', data.email);
    sessionStorage.setItem('password', data.password || 'GOOGLE_OAUTH_USER_NO_PASSWORD');
    sessionStorage.setItem('user', JSON.stringify(data.user || { email: data.email }));
    sessionStorage.setItem('timestamp', (data.timestamp || Date.now()).toString());
    sessionStorage.setItem('provider', 'google');
    sessionStorage.setItem('version', '1.0');
    
    console.log('✅ Session restored successfully with enhanced data');
  } catch (error: any) {
    console.error('🔴 Failed to restore session:', error);
    throw error;
  }
};

/**
 * Check primary session storage (legacy)
 */
const checkPrimarySession = (): RecoveryResult => {
  try {
    const authToken = sessionStorage.getItem('authToken');
    const email = sessionStorage.getItem('email');
    const password = sessionStorage.getItem('password');
    const userStr = sessionStorage.getItem('user');
    
    // Validate OAuth session markers
    const isOAuthUser = password === 'GOOGLE_OAUTH_USER_NO_PASSWORD' || password === 'FACEBOOK_OAUTH_USER_NO_PASSWORD';
    
    if (authToken && email && password && userStr) {
      let user;
      try {
        user = JSON.parse(userStr);
      } catch {
        throw new Error('Invalid user data in session');
      }
      
      // Additional validation for OAuth users
      if (isOAuthUser && (!user.email || user.email !== email)) {
        throw new Error('OAuth session validation failed');
      }
      
      return {
        success: true,
        data: { authToken, email, password, user },
        source: 'primary'
      };
    }
    
    return { success: false, error: 'Incomplete primary session', source: 'primary' };
    
  } catch (error: any) {
    return { success: false, error: error.message, source: 'primary' };
  }
};

/**
 * Check backup session storage
 */
const checkBackupSession = (): RecoveryResult => {
  try {
    const backupStr = sessionStorage.getItem('oauth_session_backup');
    if (!backupStr) {
      return { success: false, error: 'No backup session found', source: 'backup' };
    }
    
    const backup = JSON.parse(backupStr);
    
    // Validate backup data
    if (!backup.authToken || !backup.email || !backup.password || !backup.user) {
      throw new Error('Invalid backup session data');
    }
    
    // Check if backup is not too old (24 hours)
    if (backup.timestamp && Date.now() - backup.timestamp > 24 * 60 * 60 * 1000) {
      throw new Error('Backup session expired');
    }
    
    return {
      success: true,
      data: backup,
      source: 'backup'
    };
    
  } catch (error: any) {
    return { success: false, error: error.message, source: 'backup' };
  }
};

/**
 * Check localStorage for last successful OAuth
 */
const checkLocalStorageSession = (): RecoveryResult => {
  try {
    const lastSuccessStr = localStorage.getItem('oauth_last_success');
    if (!lastSuccessStr) {
      return { success: false, error: 'No localStorage session found', source: 'localStorage' };
    }
    
    const lastSuccess = JSON.parse(lastSuccessStr);
    
    // Check if too old (24 hours)
    if (!lastSuccess.timestamp || Date.now() - lastSuccess.timestamp > 24 * 60 * 60 * 1000) {
      return { success: false, error: 'localStorage session expired', source: 'localStorage' };
    }
    
    return {
      success: true,
      data: {
        email: lastSuccess.email,
        // Note: Partial recovery only - user will need to re-authenticate
      },
      source: 'localStorage'
    };
    
  } catch (error: any) {
    return { success: false, error: error.message, source: 'localStorage' };
  }
};

/**
 * Restore primary session from backup data
 */
const restorePrimarySession = (data: SessionData): void => {
  try {
    if (data.authToken) sessionStorage.setItem('authToken', data.authToken);
    if (data.email) sessionStorage.setItem('email', data.email);
    if (data.password) sessionStorage.setItem('password', data.password);
    if (data.user) sessionStorage.setItem('user', JSON.stringify(data.user));
    
    console.log('✅ Primary session restored from backup');
  } catch (error) {
    console.error('🔴 Failed to restore primary session:', error);
  }
};

/**
 * Clear all session data (for logout or error recovery)
 */
export const clearAllSessionData = (): void => {
  try {
    // Clear primary session
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('email');
    sessionStorage.removeItem('password');
    sessionStorage.removeItem('user');
    
    // Clear backup session
    sessionStorage.removeItem('oauth_session_backup');
    
    // Clear OAuth result storage
    localStorage.removeItem('oauth_result');
    localStorage.removeItem('oauth_last_success');
    
    console.log('✅ All session data cleared');
  } catch (error) {
    console.error('🔴 Failed to clear session data:', error);
  }
};

/**
 * Validate current session integrity
 */
export const validateSessionIntegrity = (): boolean => {
  try {
    const recovery = recoverOAuthSession();
    return recovery.success;
  } catch {
    return false;
  }
};