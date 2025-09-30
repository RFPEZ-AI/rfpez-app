// Copyright Mark Skiba, 2025 All rights reserved
/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * Global AbortController monitoring utility for debugging cancellation issues
 * This module provides comprehensive tracking and logging of AbortController lifecycle
 */

interface AbortControllerInfo {
  id: string;
  createdAt: number;
  createdBy: string;
  controller: AbortController;
  isAborted: boolean;
  abortedAt?: number;
  abortReason?: string;
  stackTrace: string;
}

class AbortControllerMonitor {
  private controllers = new Map<string, AbortControllerInfo>();
  private originalAbortController: typeof AbortController;
  private isMonitoring = false;

  constructor() {
    this.originalAbortController = window.AbortController;
  }

  startMonitoring() {
    if (this.isMonitoring) return;
    
    console.log('🔧 Starting global AbortController monitoring');
    this.isMonitoring = true;

    // Override AbortController constructor
    window.AbortController = class extends this.originalAbortController {
      constructor() {
        super();
        
        const id = `ac_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const stack = new Error().stack || '';
        const caller = AbortControllerMonitor.extractCaller(stack);
        
        const info: AbortControllerInfo = {
          id,
          createdAt: Date.now(),
          createdBy: caller,
          controller: this,
          isAborted: false,
          stackTrace: stack
        };
        
        AbortControllerMonitor.instance.controllers.set(id, info);
        
        console.log('🆕 New AbortController created:', {
          id,
          caller,
          totalActive: AbortControllerMonitor.instance.getActiveCount()
        });
        
        // Monitor abort events
        this.signal.addEventListener('abort', () => {
          info.isAborted = true;
          info.abortedAt = Date.now();
          info.abortReason = this.signal.reason;
          
          // const duration = endTime - startTime; // Variables not available in this scope
          
          // DISABLED: Verbose logging causes memory pressure
          // console.group('🚨 AbortController aborted - Global Monitor');
          // console.log('📋 Controller ID:', id);
          // console.log('👤 Created by:', caller);
          // console.log('⏱️ Duration:', duration + 'ms');
          // console.log('💬 Reason:', this.signal.reason || 'No reason');
          // console.log('📊 Active controllers remaining:', AbortControllerMonitor.instance.getActiveCount() - 1);
          // console.groupEnd();
        });
        
        return this;
      }
    };
  }

  stopMonitoring() {
    if (!this.isMonitoring) return;
    
    console.log('🛑 Stopping global AbortController monitoring');
    window.AbortController = this.originalAbortController;
    this.isMonitoring = false;
  }

  getActiveCount(): number {
    return Array.from(this.controllers.values()).filter(info => !info.isAborted).length;
  }

  getAllControllers(): AbortControllerInfo[] {
    return Array.from(this.controllers.values());
  }

  getActiveControllers(): AbortControllerInfo[] {
    return Array.from(this.controllers.values()).filter(info => !info.isAborted);
  }

  printReport() {
    const all = this.getAllControllers();
    const active = this.getActiveControllers();
    
    console.group('📊 AbortController Monitor Report');
    console.log('Total created:', all.length);
    console.log('Currently active:', active.length);
    console.log('Aborted:', all.length - active.length);
    
    if (active.length > 0) {
      console.log('\n🟢 Active controllers:');
      active.forEach(info => {
        const age = Date.now() - info.createdAt;
        console.log(`  - ${info.id} (${age}ms old) created by ${info.createdBy}`);
      });
    }
    
    const recentAborts = all
      .filter(info => info.isAborted && info.abortedAt && (Date.now() - info.abortedAt < 10000))
      .sort((a, b) => (b.abortedAt || 0) - (a.abortedAt || 0));
    
    if (recentAborts.length > 0) {
      console.log('\n🔴 Recently aborted (last 10s):');
      recentAborts.forEach(info => {
        const duration = (info.abortedAt || 0) - info.createdAt;
        console.log(`  - ${info.id} (lived ${duration}ms) created by ${info.createdBy}, reason: ${info.abortReason || 'none'}`);
      });
    }
    
    console.groupEnd();
  }

  private static extractCaller(stack: string): string {
    const lines = stack.split('\n');
    // Skip the first few lines (Error constructor, our constructor, etc.)
    for (let i = 3; i < Math.min(lines.length, 8); i++) {
      const line = lines[i];
      if (line && !line.includes('AbortController') && !line.includes('chrome-extension')) {
        const match = line.match(/at\s+(.+?)\s+\(/);
        if (match) {
          return match[1];
        }
        // Fallback to just the function location
        const fallback = line.trim().replace(/^at\s+/, '');
        if (fallback) {
          return fallback.substring(0, 50);
        }
      }
    }
    return 'unknown';
  }

  // Singleton instance
  private static _instance: AbortControllerMonitor;
  static get instance(): AbortControllerMonitor {
    if (!this._instance) {
      this._instance = new AbortControllerMonitor();
    }
    return this._instance;
  }
}

// Global functions for easy access
declare global {
  interface Window {
    startAbortMonitoring?: () => void;
    stopAbortMonitoring?: () => void;
    abortReport?: () => void;
  }
}

(window as Window).startAbortMonitoring = () => AbortControllerMonitor.instance.startMonitoring();
(window as Window).stopAbortMonitoring = () => AbortControllerMonitor.instance.stopMonitoring();
(window as Window).abortReport = () => AbortControllerMonitor.instance.printReport();

export { AbortControllerMonitor };