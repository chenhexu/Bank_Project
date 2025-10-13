export interface SessionStatus {
  timeRemaining: number; // in milliseconds
  showWarning: boolean;
  formattedTime: string;
  showStillActivePrompt: boolean;
}

class SessionManager {
  private inactivityTimer: NodeJS.Timeout | null = null;
  private checkInterval: NodeJS.Timeout | null = null;
  private testLogInterval: NodeJS.Timeout | null = null;
  private fastCountdownInterval: NodeJS.Timeout | null = null;
  private lastActivity: number = Date.now();
  private isActive: boolean = false;
  private onSessionUpdate?: (status: SessionStatus) => void;
  private onSessionExpired?: () => void;
  
  // 15 minutes = 900,000ms, show warning in last 2 minutes = 120,000ms
  private readonly SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes
  private readonly WARNING_THRESHOLD = 2 * 60 * 1000; // 2 minutes


  constructor() {
    this.bindActivityListeners();
  }

  public start(onUpdate?: (status: SessionStatus) => void, onExpired?: () => void): void {
    if (this.isActive) return;
    
    this.isActive = true;
    this.onSessionUpdate = onUpdate;
    this.onSessionExpired = onExpired;
    this.lastActivity = Date.now();
    
    // Start activity timer
    this.resetInactivityTimer();
    
    // Start periodic status updates (every 5 seconds for responsiveness)
    this.checkInterval = setInterval(() => {
      this.updateSessionStatus();
    }, 5000);

    // Add testing logs - every 30 seconds with clean numbers
    this.testLogInterval = setInterval(() => {
      const now = Date.now();
      const timeRemaining = this.SESSION_TIMEOUT - (now - this.lastActivity);
      const minutesLeft = Math.floor(timeRemaining / (60 * 1000));
      const secondsLeft = Math.floor((timeRemaining % (60 * 1000)) / 1000);
      
      // Only log when we have clean numbers (multiples of 30 seconds)
      const totalSeconds = Math.floor(timeRemaining / 1000);
      const isCleanNumber = totalSeconds % 30 === 0;
      
      // Log every 30 seconds, but only show clean numbers
      if (isCleanNumber && totalSeconds > 0) {
        const isWarningPeriod = timeRemaining <= this.WARNING_THRESHOLD;
        console.log(`🕐 Session Status: ${minutesLeft}:${secondsLeft.toString().padStart(2, '0')} remaining (${this.isActive ? 'ACTIVE' : 'INACTIVE'})${isWarningPeriod ? ' ⚠️ WARNING' : ''}`);
      }
    }, 5000); // Check every 5 seconds to catch the 30-second marks


    
    console.log('🔵 Session manager started - 15 min timeout with button-click detection');
    console.log('🕐 Session Status: 15:00 remaining (ACTIVE) - Logs every 30s, 1s countdown in last 30s');
  }

  public stop(): void {
    this.isActive = false;
    
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    if (this.testLogInterval) {
      clearInterval(this.testLogInterval);
      this.testLogInterval = null;
    }
    
    if (this.fastCountdownInterval) {
      clearInterval(this.fastCountdownInterval);
      this.fastCountdownInterval = null;
    }
    
    this.removeActivityListeners();
    
    console.log('🔵 Session manager stopped');
  }

  public getSessionStatus(): SessionStatus {
    const now = Date.now();
    const elapsed = now - this.lastActivity;
    const timeRemaining = Math.max(0, this.SESSION_TIMEOUT - elapsed);
    const showWarning = timeRemaining <= this.WARNING_THRESHOLD && timeRemaining > 0;
    const showStillActivePrompt = showWarning; // Show "Still active?" when warning is shown
    
    return {
      timeRemaining,
      showWarning,
      formattedTime: this.formatTime(timeRemaining),
      showStillActivePrompt
    };
  }

  private updateSessionStatus(): void {
    if (!this.isActive || !this.onSessionUpdate) return;
    
    const status = this.getSessionStatus();
    this.onSessionUpdate(status);
    
    // Start fast countdown if we're in the last 30 seconds
    const isLastThirtySeconds = status.timeRemaining <= 30000 && status.timeRemaining > 0;
    
    if (isLastThirtySeconds && !this.fastCountdownInterval) {
      console.log('🚀 Starting 1-second countdown for last 30 seconds');
      this.startFastCountdown();
    } else if (!isLastThirtySeconds && this.fastCountdownInterval) {
      console.log('⏹️ Stopping fast countdown');
      this.stopFastCountdown();
    }
    
    // Auto-logout if time expired
    if (status.timeRemaining === 0) {
      this.logout('Session expired due to inactivity');
    }
  }

  public resetInactivityTimer(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
    
    // Stop fast countdown when timer resets
    this.stopFastCountdown();
    
    this.lastActivity = Date.now();
    
    this.inactivityTimer = setTimeout(() => {
      this.logout('Session expired due to inactivity');
    }, this.SESSION_TIMEOUT);
  }

  private formatTime(milliseconds: number): string {
    const totalSeconds = Math.ceil(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  private startFastCountdown(): void {
    if (this.fastCountdownInterval) return;
    
    this.fastCountdownInterval = setInterval(() => {
      if (!this.isActive || !this.onSessionUpdate) return;
      
      const status = this.getSessionStatus();
      this.onSessionUpdate(status);
      
      // Log every second during fast countdown
      const totalSeconds = Math.ceil(status.timeRemaining / 1000);
      console.log(`⏱️ Fast countdown: ${totalSeconds}s remaining`);
      
      // Stop if we're out of the last 30 seconds or time expired
      if (status.timeRemaining > 30000 || status.timeRemaining <= 0) {
        this.stopFastCountdown();
      }
    }, 1000); // Every second
  }

  private stopFastCountdown(): void {
    if (this.fastCountdownInterval) {
      clearInterval(this.fastCountdownInterval);
      this.fastCountdownInterval = null;
    }
  }

  private bindActivityListeners(): void {
    // Only listen for button clicks to reset session timer
    document.addEventListener('click', this.handleButtonClick, true);
    
    // Listen for visibility changes (but don't reset timer)
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  private removeActivityListeners(): void {
    // Remove button click listener
    document.removeEventListener('click', this.handleButtonClick, true);
    
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  private handleButtonClick = (event: Event): void => {
    // Only reset timer if a button or interactive element was clicked
    const target = event.target as HTMLElement;
    if (target && (
      target.tagName === 'BUTTON' ||
      target.tagName === 'A' ||
      target.tagName === 'INPUT' ||
      target.role === 'button' ||
      target.classList.contains('btn') ||
      target.classList.contains('button') ||
      target.closest('button') ||
      target.closest('a') ||
      target.closest('[role="button"]')
    )) {
      if (this.isActive) {
        console.log('🔄 Button clicked - resetting session timer immediately');
        this.resetInactivityTimer();
        
        // Immediate status update for responsive UI
        if (this.onSessionUpdate) {
          const status = this.getSessionStatus();
          this.onSessionUpdate(status);
        }
      }
    }
  };

  private handleVisibilityChange = (): void => {
    // Don't reset timer on visibility change - only button clicks reset timer
    // This just logs the event for debugging
    if (!document.hidden && this.isActive) {
      console.log('🔍 Page became visible (timer not reset - button clicks only)');
    }
  };



  private logout(reason: string): void {
    console.log('🔴 Auto-logout triggered:', reason);
    
    // Stop the session manager first
    this.stop();
    
    // Call the expired callback if provided
    if (this.onSessionExpired) {
      this.onSessionExpired();
    } else {
      // Fallback: clear session and redirect
      sessionStorage.clear();
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('email');
      localStorage.removeItem('password');
      
      // Redirect to login
      window.location.href = `/login?message=${encodeURIComponent(reason)}`;
    }
  }
}

// Global session manager instance
let globalSessionManager: SessionManager | null = null;

export function initSessionManager(onUpdate?: (status: SessionStatus) => void, onExpired?: () => void): void {
  if (!globalSessionManager) {
    globalSessionManager = new SessionManager();
  }
  globalSessionManager.start(onUpdate, onExpired);
}

export function stopSessionManager(): void {
  if (globalSessionManager) {
    globalSessionManager.stop();
  }
}

export function getSessionStatus(): SessionStatus | null {
  if (!globalSessionManager) return null;
  return globalSessionManager.getSessionStatus();
}

export function resetSessionTimer(): void {
  if (globalSessionManager) {
    globalSessionManager.resetInactivityTimer();
  }
}

