/**
 * Robust API Client with retry logic and error handling
 */

export interface ApiOptions {
  maxRetries?: number;
  timeout?: number;
  retryDelay?: number;
  showErrors?: boolean;
}

export interface ApiResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
  attempts?: number;
}

/**
 * Get the appropriate password for API calls (handles OAuth users)
 */
export const getApiPassword = (password: string): string => {
  const isOAuthUser = password === 'GOOGLE_OAUTH_USER_NO_PASSWORD' || password === 'FACEBOOK_OAUTH_USER_NO_PASSWORD';
  return isOAuthUser ? "google_oauth_token" : password;
};

/**
 * Robust API call with retry logic and comprehensive error handling
 */
export const robustApiCall = async <T = any>(
  url: string,
  options: RequestInit,
  apiOptions: ApiOptions = {}
): Promise<ApiResult<T>> => {
  const {
    maxRetries = 3,
    timeout = 10000,
    retryDelay = 1000,
    showErrors = true
  } = apiOptions;

  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔵 API call attempt ${attempt}/${maxRetries} to ${url}`);
      
      // Add timeout to request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // Handle HTTP errors
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage += `: ${errorData.detail || errorData.message || 'Request failed'}`;
        } catch {
          errorMessage += ': Request failed';
        }
        throw new Error(errorMessage);
      }
      
      // Parse response
      const data = await response.json();
      
      console.log(`✅ API call successful on attempt ${attempt}`);
      return {
        success: true,
        data,
        status: response.status,
        attempts: attempt
      };
      
    } catch (error: any) {
      lastError = error;
      console.error(`🔴 API call attempt ${attempt} failed:`, error.message);
      
      // Don't retry on certain errors
      if (error.name === 'AbortError') {
        console.error('Request timed out');
        break;
      }
      
      if (error.message.includes('401') || error.message.includes('403')) {
        console.error('Authentication error - not retrying');
        break;
      }
      
      // If this was the last attempt, break
      if (attempt === maxRetries) {
        break;
      }
      
      // Exponential backoff with jitter
      const delay = retryDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      console.log(`⏳ Retrying in ${Math.round(delay)}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // All attempts failed
  const errorMessage = lastError?.message || 'Unknown API error';
  
  if (showErrors) {
    console.error(`❌ API call failed after ${maxRetries} attempts: ${errorMessage}`);
  }
  
  return {
    success: false,
    error: errorMessage,
    attempts: maxRetries
  };
};

/**
 * Specialized API call for authenticated endpoints
 */
export const authenticatedApiCall = async <T = any>(
  endpoint: string,
  email: string,
  password: string,
  additionalData: Record<string, any> = {},
  apiOptions: ApiOptions = {}
): Promise<ApiResult<T>> => {
  const url = `${process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')}${endpoint}`;
  
  const body = {
    email,
    password: getApiPassword(password),
    ...additionalData
  };
  
  return robustApiCall<T>(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }, apiOptions);
};

/**
 * Balance API call with error handling
 */
export const fetchBalance = async (email: string, password: string): Promise<ApiResult<{ balance: string }>> => {
  return authenticatedApiCall('/api/balance', email, password);
};

/**
 * Transactions API call with error handling
 */
export const fetchTransactions = async (email: string, password: string): Promise<ApiResult<any[]>> => {
  return authenticatedApiCall('/api/transactions', email, password);
};

/**
 * Deposit API call with error handling
 */
export const makeDeposit = async (email: string, password: string, amount: number): Promise<ApiResult<{ message: string; new_balance: string }>> => {
  return authenticatedApiCall('/api/deposit', email, password, { amount });
};

/**
 * Withdraw API call with error handling
 */
export const makeWithdraw = async (email: string, password: string, amount: number): Promise<ApiResult<{ message: string; new_balance: string }>> => {
  return authenticatedApiCall('/api/withdraw', email, password, { amount });
};

/**
 * Transfer API call with error handling
 */
export const makeTransfer = async (
  fromEmail: string, 
  password: string, 
  toEmail: string, 
  amount: number
): Promise<ApiResult<{ message: string; new_balance: string }>> => {
  const url = `${process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')}/api/transfer`;
  
  const body = {
    from_email: fromEmail,
    password: getApiPassword(password),
    to_email: toEmail,
    amount
  };
  
  return robustApiCall(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
};