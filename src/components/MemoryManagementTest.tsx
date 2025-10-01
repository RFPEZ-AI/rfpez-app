// Copyright Mark Skiba, 2025 All rights reserved
/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
// Memory Management Test Component

import React, { useState, useEffect } from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonGrid,
  IonRow,
  IonCol,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonProgressBar,
  IonText,
  IonToggle,
  IonAlert,
  IonCheckbox,
  IonSpinner,
  IonIcon
} from '@ionic/react';
import { warning, checkmarkCircle, closeCircle, flash, trash } from 'ionicons/icons';
import { streamManager } from '../services/claudeAPIProxy';

// MemoryBuffer interface for type safety
interface MemoryBuffer {
  id: string;
  size: number;
  data: ArrayBuffer;
  isInUse: boolean;
  createdAt: number;
  lastUsed: number;
  useCount: number;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface MemoryManagementTestProps {
  // Add props as needed
}

interface StressTestResult {
  testName: string;
  passed: boolean;
  details: string;
  duration: number;
  warning?: string;
}

interface StressTestResults {
  results: StressTestResult[];
  totalDuration: number;
  overallStatus: 'passed' | 'failed' | 'warning';
}

interface MemoryTestMetrics {
  allocatedBuffers: number;
  totalMemoryAllocated: number;
  totalMemoryUsed: number;
  poolUtilization: number;
  gcCount: number;
  memoryLeakRisk: number;
  averageBufferSize: number;
  testOperations: number;
  memoryPressureEvents: number;
}

const MemoryManagementTest: React.FC<MemoryManagementTestProps> = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [metrics, setMetrics] = useState<MemoryTestMetrics>({
    allocatedBuffers: 0,
    totalMemoryAllocated: 0,
    totalMemoryUsed: 0,
    poolUtilization: 0,
    gcCount: 0,
    memoryLeakRisk: 0,
    averageBufferSize: 0,
    testOperations: 0,
    memoryPressureEvents: 0,
  });
  const [logs, setLogs] = useState<string[]>([]);
  const [enableStressTest, setEnableStressTest] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  
  // Stress test state
  const [, setStressTesting] = useState(false);
  const [, setStressTestResults] = useState<StressTestResults | null>(null);
  const [selectedStressTests, setSelectedStressTests] = useState({
    memoryPressure: false,
    aggressiveCleanup: false,
    memoryLeakRisk: false,
    highMemoryAllocation: false
  });

  // Update metrics periodically
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      const memoryMetrics = streamManager.getMemoryMetrics();
      
      setMetrics(prev => ({
        allocatedBuffers: memoryMetrics.bufferCount,
        totalMemoryAllocated: memoryMetrics.totalAllocated,
        totalMemoryUsed: memoryMetrics.totalUsed,
        poolUtilization: memoryMetrics.poolUtilization,
        gcCount: memoryMetrics.gcCount,
        memoryLeakRisk: memoryMetrics.memoryLeakRisk,
        averageBufferSize: memoryMetrics.averageBufferSize,
        testOperations: prev.testOperations,
        memoryPressureEvents: prev.memoryPressureEvents,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const addLog = (message: string) => {
    setLogs(prev => [`${new Date().toLocaleTimeString()}: ${message}`, ...prev.slice(0, 99)]);
  };

  const startMemoryTest = () => {
    setIsRunning(true);
    setMetrics(prev => ({ ...prev, testOperations: 0, memoryPressureEvents: 0 }));
    setLogs([]);
    addLog('Started memory management test');
  };

  const stopMemoryTest = () => {
    setIsRunning(false);
    addLog('Stopped memory management test');
  };

  const testBufferAllocation = () => {
    try {
      const sizes = [1024, 2048, 4096, 8192]; // Various buffer sizes
      const allocatedBuffers = [];
      
      for (let i = 0; i < 5; i++) {
        const size = sizes[Math.floor(Math.random() * sizes.length)];
        const buffer = streamManager.allocateBuffer(size);
        allocatedBuffers.push(buffer);
        addLog(`Allocated buffer ${buffer.id} (${(buffer.size / 1024).toFixed(1)} KB)`);
      }
      
      // Release some buffers randomly
      for (let i = 0; i < 2; i++) {
        if (allocatedBuffers.length > 0) {
          const index = Math.floor(Math.random() * allocatedBuffers.length);
          const buffer = allocatedBuffers.splice(index, 1)[0];
          streamManager.releaseBuffer(buffer.id);
          addLog(`Released buffer ${buffer.id}`);
        }
      }
      
      setMetrics(prev => ({ ...prev, testOperations: prev.testOperations + 1 }));
    } catch (error) {
      addLog(`Error during buffer allocation: ${error}`);
    }
  };

  const testTokenBatchingWithMemory = () => {
    try {
      const streamId = `test-stream-${Date.now()}`;
      const tokens = ['Hello', 'world', 'this', 'is', 'a', 'test', 'of', 'memory', 'management'];
      
      // Add tokens to batch
      tokens.forEach((token, index) => {
        streamManager.addTokenToBatch(streamId, token, { index });
        addLog(`Added token "${token}" to batch ${streamId}`);
      });
      
      // Clean up batch
      setTimeout(() => {
        streamManager.cleanupBatches(streamId);
        addLog(`Cleaned up batch ${streamId}`);
      }, 2000);
      
      setMetrics(prev => ({ ...prev, testOperations: prev.testOperations + 1 }));
    } catch (error) {
      addLog(`Error during token batching test: ${error}`);
    }
  };

  const testMemoryPressure = () => {
    try {
      const buffers: MemoryBuffer[] = [];
      addLog('Creating memory pressure...');
      
      // Allocate many buffers to create pressure
      for (let i = 0; i < 45; i++) {
        const buffer = streamManager.allocateBuffer(1024);
        buffers.push(buffer);
      }
      
      addLog(`Created ${buffers.length} buffers for pressure test`);
      
      // Try to allocate more (should trigger pressure handling)
      const streamId = `pressure-test-${Date.now()}`;
      streamManager.addTokenToBatch(streamId, 'pressure test token', {});
      
      setMetrics(prev => ({ 
        ...prev, 
        testOperations: prev.testOperations + 1,
        memoryPressureEvents: prev.memoryPressureEvents + 1
      }));
      
      // Clean up after delay
      setTimeout(() => {
        buffers.forEach(buffer => streamManager.releaseBuffer(buffer.id));
        streamManager.cleanupBatches(streamId);
        addLog('Cleaned up pressure test buffers');
      }, 3000);
      
    } catch (error) {
      addLog(`Error during pressure test: ${error}`);
    }
  };

  const performStressTest = async () => {
    if (!enableStressTest) {
      setAlertMessage('Stress testing is disabled. Enable it first to run comprehensive stress tests.');
      setShowAlert(true);
      return;
    }
    
    addLog('Starting comprehensive stress test...');
    
    const stressTestPromises = [];
    
    // Stress test 1: Rapid allocation/deallocation
    stressTestPromises.push(new Promise<void>((resolve) => {
      let operations = 0;
      const rapidTest = setInterval(() => {
        testBufferAllocation();
        operations++;
        if (operations >= 10) {
          clearInterval(rapidTest);
          resolve();
        }
      }, 100);
    }));
    
    // Stress test 2: Multiple concurrent token batches
    stressTestPromises.push(new Promise<void>((resolve) => {
      const streams = Array.from({ length: 5 }, (_, i) => `stress-stream-${i}`);
      let batchOperations = 0;
      
      const batchTest = setInterval(() => {
        const streamId = streams[Math.floor(Math.random() * streams.length)];
        streamManager.addTokenToBatch(streamId, `stress-token-${batchOperations}`, {});
        batchOperations++;
        
        if (batchOperations >= 50) {
          clearInterval(batchTest);
          streams.forEach(id => streamManager.cleanupBatches(id));
          resolve();
        }
      }, 50);
    }));
    
    try {
      await Promise.all(stressTestPromises);
      addLog('Completed comprehensive stress test');
      setMetrics(prev => ({ ...prev, testOperations: prev.testOperations + 1 }));
    } catch (error) {
      addLog(`Stress test error: ${error}`);
    }
  };

  const forceGarbageCollection = () => {
    (streamManager as any).performMemoryGarbageCollection();
    addLog('Forced garbage collection');
    setMetrics(prev => ({ ...prev, testOperations: prev.testOperations + 1 }));
  };

  const getMemoryPressureColor = (utilization: number) => {
    if (utilization < 50) return 'success';
    if (utilization < 80) return 'warning';
    return 'danger';
  };

  const getMemoryLeakRiskColor = (risk: number) => {
    if (risk < 0.2) return 'success';
    if (risk < 0.5) return 'warning';
    return 'danger';
  };
  
  // Stress test functions
  const runMemoryPressureTest = async (): Promise<StressTestResult> => {
    const startTime = Date.now();
    const mockStreamId = 'stress-test-stream';
    
    try {
      // Fill up memory pool to create pressure
      const buffers = [];
      for (let i = 0; i < 45; i++) { // Close to maxPoolSize of 50
        buffers.push(streamManager.allocateBuffer(1024));
      }
      
      // Add token should trigger pressure handling
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      streamManager.addTokenToBatch(mockStreamId, 'test token', {});
      
      const warningCalled = consoleSpy.mock.calls.some(call => 
        call[0] && call[0].includes('High memory pressure')
      );
      
      consoleSpy.mockRestore();
      
      // Clean up allocated buffers
      buffers.forEach(buffer => streamManager.releaseBuffer(buffer.id));
      
      const duration = Date.now() - startTime;
      
      return {
        testName: 'Memory Pressure Handling',
        passed: warningCalled,
        details: warningCalled 
          ? 'Memory pressure warning triggered successfully'
          : 'Memory pressure warning not triggered',
        duration,
        warning: 'This test temporarily allocates significant memory'
      };
    } catch (error) {
      return {
        testName: 'Memory Pressure Handling',
        passed: false,
        details: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        warning: 'This test temporarily allocates significant memory'
      };
    }
  };
  
  const runAggressiveCleanupTest = async (): Promise<StressTestResult> => {
    const startTime = Date.now();
    
    try {
      // Fill up memory pool completely
      const buffers = [];
      for (let i = 0; i < 50; i++) { // maxPoolSize
        buffers.push(streamManager.allocateBuffer(1024));
      }
      
      // Release some buffers
      for (let i = 0; i < 10; i++) {
        streamManager.releaseBuffer(buffers[i].id);
      }
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Trigger aggressive cleanup
      (streamManager as any).performAggressiveMemoryCleanup();
      
      const cleanupCalled = consoleSpy.mock.calls.some(call => 
        call[0] && call[0].includes('Aggressive cleanup')
      );
      
      consoleSpy.mockRestore();
      
      // Clean up remaining buffers
      buffers.forEach(buffer => streamManager.releaseBuffer(buffer.id));
      
      const duration = Date.now() - startTime;
      
      return {
        testName: 'Aggressive Memory Cleanup',
        passed: cleanupCalled,
        details: cleanupCalled 
          ? 'Aggressive cleanup triggered successfully'
          : 'Aggressive cleanup not triggered',
        duration,
        warning: 'This test fills the entire memory pool'
      };
    } catch (error) {
      return {
        testName: 'Aggressive Memory Cleanup',
        passed: false,
        details: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        warning: 'This test fills the entire memory pool'
      };
    }
  };
  
  const runMemoryLeakRiskTest = async (): Promise<StressTestResult> => {
    const startTime = Date.now();
    
    try {
      // Create high memory pressure situation
      const buffers = [];
      for (let i = 0; i < 48; i++) { // 96% of maxPoolSize
        buffers.push(streamManager.allocateBuffer(1024));
      }
      
      // Force memory pressure monitoring to update leak risk
      (streamManager as any).monitorMemoryPressure();
      
      const healthMetrics = streamManager.getStreamingHealthMetrics();
      const memoryLeakRisk = healthMetrics.memoryHealth.memoryLeakRisk;
      
      const isHighRisk = memoryLeakRisk === 'HIGH' || memoryLeakRisk === 'MEDIUM';
      
      // Clean up allocated buffers
      buffers.forEach(buffer => streamManager.releaseBuffer(buffer.id));
      
      const duration = Date.now() - startTime;
      
      return {
        testName: 'Memory Leak Risk Detection',
        passed: isHighRisk,
        details: `Memory leak risk detected as: ${memoryLeakRisk}`,
        duration,
        warning: 'This test creates high memory pressure to trigger leak detection'
      };
    } catch (error) {
      return {
        testName: 'Memory Leak Risk Detection',
        passed: false,
        details: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        warning: 'This test creates high memory pressure to trigger leak detection'
      };
    }
  };
  
  const runHighMemoryAllocationTest = async (): Promise<StressTestResult> => {
    const startTime = Date.now();
    
    try {
      // Allocate large buffers to test memory handling
      const largeBuffers = [];
      for (let i = 0; i < 10; i++) {
        largeBuffers.push(streamManager.allocateBuffer(100 * 1024)); // 100KB each
      }
      
      const metrics = streamManager.getMemoryMetrics();
      const totalAllocated = metrics.totalAllocated;
      
      // Clean up allocated buffers
      largeBuffers.forEach(buffer => streamManager.releaseBuffer(buffer.id));
      
      const duration = Date.now() - startTime;
      
      return {
        testName: 'High Memory Allocation',
        passed: totalAllocated > 1000000, // > 1MB
        details: `Total allocated: ${(totalAllocated / 1024 / 1024).toFixed(2)} MB`,
        duration,
        warning: 'This test allocates large memory buffers'
      };
    } catch (error) {
      return {
        testName: 'High Memory Allocation',
        passed: false,
        details: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        warning: 'This test allocates large memory buffers'
      };
    }
  };
  
  const runSelectedStressTests = async () => {
    setStressTesting(true);
    const startTime = Date.now();
    const results: StressTestResult[] = [];
    
    try {
      if (selectedStressTests.memoryPressure) {
        results.push(await runMemoryPressureTest());
      }
      
      if (selectedStressTests.aggressiveCleanup) {
        results.push(await runAggressiveCleanupTest());
      }
      
      if (selectedStressTests.memoryLeakRisk) {
        results.push(await runMemoryLeakRiskTest());
      }
      
      if (selectedStressTests.highMemoryAllocation) {
        results.push(await runHighMemoryAllocationTest());
      }
      
      const totalDuration = Date.now() - startTime;
      const passedCount = results.filter(r => r.passed).length;
      const warningCount = results.filter(r => r.warning).length;
      
      let overallStatus: 'passed' | 'failed' | 'warning';
      if (passedCount === results.length) {
        overallStatus = warningCount > 0 ? 'warning' : 'passed';
      } else {
        overallStatus = 'failed';
      }
      
      setStressTestResults({
        results,
        totalDuration,
        overallStatus
      });
    } catch (error) {
      console.error('Memory management stress test suite failed:', error);
      setStressTestResults({
        results: [{
          testName: 'Test Suite',
          passed: false,
          details: `Suite failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          duration: Date.now() - startTime
        }],
        totalDuration: Date.now() - startTime,
        overallStatus: 'failed'
      });
    } finally {
      setStressTesting(false);
    }
  };
  
  const clearStressTestResults = () => {
    setStressTestResults(null);
  };
  
  const hasSelectedStressTests = Object.values(selectedStressTests).some(selected => selected);

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>🧠 Memory Management Performance Test</IonCardTitle>
      </IonCardHeader>
      
      <IonCardContent>
        <IonGrid>
          <IonRow>
            <IonCol size="12" sizeMd="6">
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>Test Controls</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <div style={{ marginBottom: '16px' }}>
                    <IonButton 
                      expand="block" 
                      color={isRunning ? 'danger' : 'primary'}
                      onClick={isRunning ? stopMemoryTest : startMemoryTest}
                    >
                      {isRunning ? 'Stop Test' : 'Start Memory Test'}
                    </IonButton>
                  </div>
                  
                  <IonItem>
                    <IonLabel>Enable Stress Testing</IonLabel>
                    <IonToggle 
                      checked={enableStressTest}
                      onIonChange={(e) => setEnableStressTest(e.detail.checked)}
                      disabled={isRunning}
                    />
                  </IonItem>
                  
                  {isRunning && (
                    <div style={{ marginTop: '16px', display: 'grid', gap: '8px' }}>
                      <IonButton 
                        expand="block" 
                        fill="outline" 
                        onClick={testBufferAllocation}
                      >
                        Test Buffer Allocation
                      </IonButton>
                      
                      <IonButton 
                        expand="block" 
                        fill="outline" 
                        onClick={testTokenBatchingWithMemory}
                      >
                        Test Token Batching + Memory
                      </IonButton>
                      
                      <IonButton 
                        expand="block" 
                        fill="outline" 
                        color="warning"
                        onClick={testMemoryPressure}
                      >
                        Test Memory Pressure
                      </IonButton>
                      
                      <IonButton 
                        expand="block" 
                        fill="outline" 
                        color="secondary"
                        onClick={performStressTest}
                      >
                        Comprehensive Stress Test
                      </IonButton>
                      
                      <IonButton 
                        expand="block" 
                        fill="outline" 
                        color="medium"
                        onClick={forceGarbageCollection}
                      >
                        Force Garbage Collection
                      </IonButton>
                    </div>
                  )}
                </IonCardContent>
              </IonCard>
            </IonCol>
            
            <IonCol size="12" sizeMd="6">
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>Memory Metrics</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonList>
                    <IonItem>
                      <IonLabel>
                        <h3>Buffer Pool Status</h3>
                        <p>{metrics.allocatedBuffers} / 50 buffers allocated</p>
                      </IonLabel>
                      <IonBadge color={metrics.allocatedBuffers < 40 ? 'success' : 'warning'}>
                        {metrics.poolUtilization.toFixed(1)}%
                      </IonBadge>
                    </IonItem>
                    
                    <IonItem>
                      <IonLabel>
                        <h3>Memory Usage</h3>
                        <p>Allocated: {(metrics.totalMemoryAllocated / 1024 / 1024).toFixed(2)} MB</p>
                        <p>Used: {(metrics.totalMemoryUsed / 1024 / 1024).toFixed(2)} MB</p>
                      </IonLabel>
                    </IonItem>
                    
                    <IonItem>
                      <IonLabel>
                        <h3>Memory Pressure</h3>
                        <IonProgressBar 
                          value={metrics.poolUtilization / 100} 
                          color={getMemoryPressureColor(metrics.poolUtilization)}
                        />
                        <p>{metrics.poolUtilization.toFixed(1)}% pool utilization</p>
                      </IonLabel>
                    </IonItem>
                    
                    <IonItem>
                      <IonLabel>
                        <h3>Memory Leak Risk</h3>
                        <p>Risk Level: {(metrics.memoryLeakRisk * 100).toFixed(1)}%</p>
                      </IonLabel>
                      <IonBadge color={getMemoryLeakRiskColor(metrics.memoryLeakRisk)}>
                        {metrics.memoryLeakRisk < 0.2 ? 'LOW' : metrics.memoryLeakRisk < 0.5 ? 'MEDIUM' : 'HIGH'}
                      </IonBadge>
                    </IonItem>
                    
                    <IonItem>
                      <IonLabel>
                        <h3>Performance Stats</h3>
                        <p>GC Count: {metrics.gcCount}</p>
                        <p>Avg Buffer: {(metrics.averageBufferSize / 1024).toFixed(1)} KB</p>
                        <p>Test Operations: {metrics.testOperations}</p>
                        <p>Memory Pressure Events: {metrics.memoryPressureEvents}</p>
                      </IonLabel>
                    </IonItem>
                  </IonList>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
          
          <IonRow>
            <IonCol size="12">
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>Activity Log</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <div style={{
                    height: '300px',
                    overflowY: 'auto',
                    border: '1px solid var(--ion-color-medium)',
                    padding: '12px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    backgroundColor: 'var(--ion-color-light)',
                  }}>
                    {logs.length === 0 ? (
                      <IonText color="medium">Activity log will appear here...</IonText>
                    ) : (
                      logs.map((log, index) => (
                        <div key={index} style={{ marginBottom: '4px' }}>
                          {log}
                        </div>
                      ))
                    )}
                  </div>
                  
                  <div style={{ marginTop: '16px' }}>
                    <IonText color="medium">
                      <p>
                        <strong>Total Operations:</strong> {metrics.testOperations} | 
                        <strong> Memory Efficiency:</strong> {metrics.totalMemoryUsed > 0 ? ((metrics.totalMemoryUsed / metrics.totalMemoryAllocated) * 100).toFixed(1) : 0}% | 
                        <strong> Buffer Reuse Rate:</strong> {metrics.allocatedBuffers > 0 ? (100 - (metrics.gcCount / metrics.allocatedBuffers * 100)).toFixed(1) : 0}%
                      </p>
                    </IonText>
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>
        
        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="Memory Test Notice"
          message={alertMessage}
          buttons={['OK']}
        />
      </IonCardContent>
    </IonCard>
  );
};

// Stress test component that can be added to Debug page
export const MemoryStressTest: React.FC = () => {
  const [stressTesting, setStressTesting] = useState(false);
  const [stressTestResults, setStressTestResults] = useState<StressTestResults | null>(null);
  const [selectedStressTests, setSelectedStressTests] = useState({
    memoryPressure: false,
    aggressiveCleanup: false,
    memoryLeakRisk: false,
    highMemoryAllocation: false
  });

  // Stress test functions
  const runMemoryPressureTest = async (): Promise<StressTestResult> => {
    const startTime = Date.now();
    const mockStreamId = 'stress-test-stream';
    
    try {
      // Fill up memory pool to create pressure
      const buffers = [];
      for (let i = 0; i < 45; i++) { // Close to maxPoolSize of 50
        buffers.push(streamManager.allocateBuffer(1024));
      }
      
      // Add token should trigger pressure handling
      const originalWarn = console.warn;
      const warnings: string[] = [];
      console.warn = (...args: any[]) => warnings.push(args.join(' '));
      
      streamManager.addTokenToBatch(mockStreamId, 'test token', {});
      
      const warningCalled = warnings.some(warning => 
        warning.includes('High memory pressure')
      );
      
      console.warn = originalWarn;
      
      // Clean up allocated buffers
      buffers.forEach(buffer => streamManager.releaseBuffer(buffer.id));
      
      const duration = Date.now() - startTime;
      
      return {
        testName: 'Memory Pressure Handling',
        passed: warningCalled,
        details: warningCalled 
          ? 'Memory pressure warning triggered successfully'
          : 'Memory pressure warning not triggered',
        duration,
        warning: 'This test temporarily allocates significant memory'
      };
    } catch (error) {
      return {
        testName: 'Memory Pressure Handling',
        passed: false,
        details: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        warning: 'This test temporarily allocates significant memory'
      };
    }
  };
  
  const runAggressiveCleanupTest = async (): Promise<StressTestResult> => {
    const startTime = Date.now();
    
    try {
      // Fill up memory pool completely
      const buffers = [];
      for (let i = 0; i < 50; i++) { // maxPoolSize
        buffers.push(streamManager.allocateBuffer(1024));
      }
      
      // Release some buffers
      for (let i = 0; i < 10; i++) {
        streamManager.releaseBuffer(buffers[i].id);
      }
      
      const originalLog = console.log;
      const logs: string[] = [];
      console.log = (...args: any[]) => logs.push(args.join(' '));
      
      // Trigger aggressive cleanup
      (streamManager as any).performAggressiveMemoryCleanup();
      
      const cleanupCalled = logs.some(log => 
        log.includes('Aggressive cleanup')
      );
      
      console.log = originalLog;
      
      // Clean up remaining buffers
      buffers.forEach(buffer => streamManager.releaseBuffer(buffer.id));
      
      const duration = Date.now() - startTime;
      
      return {
        testName: 'Aggressive Memory Cleanup',
        passed: cleanupCalled,
        details: cleanupCalled 
          ? 'Aggressive cleanup triggered successfully'
          : 'Aggressive cleanup not triggered',
        duration,
        warning: 'This test fills the entire memory pool'
      };
    } catch (error) {
      return {
        testName: 'Aggressive Memory Cleanup',
        passed: false,
        details: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        warning: 'This test fills the entire memory pool'
      };
    }
  };
  
  const runMemoryLeakRiskTest = async (): Promise<StressTestResult> => {
    const startTime = Date.now();
    
    try {
      // Create high memory pressure situation
      const buffers = [];
      for (let i = 0; i < 48; i++) { // 96% of maxPoolSize
        buffers.push(streamManager.allocateBuffer(1024));
      }
      
      // Force memory pressure monitoring to update leak risk
      (streamManager as any).monitorMemoryPressure();
      
      const healthMetrics = streamManager.getStreamingHealthMetrics();
      const memoryLeakRisk = healthMetrics.memoryHealth.memoryLeakRisk;
      
      const isHighRisk = memoryLeakRisk === 'HIGH' || memoryLeakRisk === 'MEDIUM';
      
      // Clean up allocated buffers
      buffers.forEach(buffer => streamManager.releaseBuffer(buffer.id));
      
      const duration = Date.now() - startTime;
      
      return {
        testName: 'Memory Leak Risk Detection',
        passed: isHighRisk,
        details: `Memory leak risk detected as: ${memoryLeakRisk}`,
        duration,
        warning: 'This test creates high memory pressure to trigger leak detection'
      };
    } catch (error) {
      return {
        testName: 'Memory Leak Risk Detection',
        passed: false,
        details: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        warning: 'This test creates high memory pressure to trigger leak detection'
      };
    }
  };
  
  const runHighMemoryAllocationTest = async (): Promise<StressTestResult> => {
    const startTime = Date.now();
    
    try {
      // Allocate large buffers to test memory handling
      const largeBuffers = [];
      for (let i = 0; i < 10; i++) {
        largeBuffers.push(streamManager.allocateBuffer(100 * 1024)); // 100KB each
      }
      
      const metrics = streamManager.getMemoryMetrics();
      const totalAllocated = metrics.totalAllocated;
      
      // Clean up allocated buffers
      largeBuffers.forEach(buffer => streamManager.releaseBuffer(buffer.id));
      
      const duration = Date.now() - startTime;
      
      return {
        testName: 'High Memory Allocation',
        passed: totalAllocated > 1000000, // > 1MB
        details: `Total allocated: ${(totalAllocated / 1024 / 1024).toFixed(2)} MB`,
        duration,
        warning: 'This test allocates large memory buffers'
      };
    } catch (error) {
      return {
        testName: 'High Memory Allocation',
        passed: false,
        details: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime,
        warning: 'This test allocates large memory buffers'
      };
    }
  };
  
  const runSelectedStressTests = async () => {
    setStressTesting(true);
    const startTime = Date.now();
    const results: StressTestResult[] = [];
    
    try {
      if (selectedStressTests.memoryPressure) {
        results.push(await runMemoryPressureTest());
      }
      
      if (selectedStressTests.aggressiveCleanup) {
        results.push(await runAggressiveCleanupTest());
      }
      
      if (selectedStressTests.memoryLeakRisk) {
        results.push(await runMemoryLeakRiskTest());
      }
      
      if (selectedStressTests.highMemoryAllocation) {
        results.push(await runHighMemoryAllocationTest());
      }
      
      const totalDuration = Date.now() - startTime;
      const passedCount = results.filter(r => r.passed).length;
      const warningCount = results.filter(r => r.warning).length;
      
      let overallStatus: 'passed' | 'failed' | 'warning';
      if (passedCount === results.length) {
        overallStatus = warningCount > 0 ? 'warning' : 'passed';
      } else {
        overallStatus = 'failed';
      }
      
      setStressTestResults({
        results,
        totalDuration,
        overallStatus
      });
    } catch (error) {
      console.error('Memory management stress test suite failed:', error);
      setStressTestResults({
        results: [{
          testName: 'Test Suite',
          passed: false,
          details: `Suite failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          duration: Date.now() - startTime
        }],
        totalDuration: Date.now() - startTime,
        overallStatus: 'failed'
      });
    } finally {
      setStressTesting(false);
    }
  };
  
  const clearStressTestResults = () => {
    setStressTestResults(null);
  };
  
  const hasSelectedStressTests = Object.values(selectedStressTests).some(selected => selected);

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>
          <IonIcon icon={flash} style={{ marginRight: '8px' }} />
          Memory Stress Tests (Former Unit Tests)
        </IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <div style={{ marginBottom: '16px' }}>
          <IonLabel>
            <h3 style={{ color: 'var(--ion-color-warning)' }}>⚠️ Warning</h3>
            <p>These are the memory pressure tests moved from unit testing because they were too disruptive for regular test runs. 
               They are resource-intensive and may temporarily impact system performance.</p>
          </IonLabel>
        </div>

        <IonList>
          <IonItem>
            <IonCheckbox 
              checked={selectedStressTests.memoryPressure}
              onIonChange={e => setSelectedStressTests(prev => ({
                ...prev,
                memoryPressure: e.detail.checked
              }))}
            />
            <IonLabel style={{ marginLeft: '12px' }}>
              <h3>Memory Pressure Handling</h3>
              <p>Tests high memory pressure detection and warning systems</p>
            </IonLabel>
          </IonItem>

          <IonItem>
            <IonCheckbox 
              checked={selectedStressTests.aggressiveCleanup}
              onIonChange={e => setSelectedStressTests(prev => ({
                ...prev,
                aggressiveCleanup: e.detail.checked
              }))}
            />
            <IonLabel style={{ marginLeft: '12px' }}>
              <h3>Aggressive Memory Cleanup</h3>
              <p>Tests critical memory pressure cleanup mechanisms</p>
            </IonLabel>
          </IonItem>

          <IonItem>
            <IonCheckbox 
              checked={selectedStressTests.memoryLeakRisk}
              onIonChange={e => setSelectedStressTests(prev => ({
                ...prev,
                memoryLeakRisk: e.detail.checked
              }))}
            />
            <IonLabel style={{ marginLeft: '12px' }}>
              <h3>Memory Leak Risk Detection</h3>
              <p>Tests memory leak risk detection in health metrics</p>
            </IonLabel>
          </IonItem>

          <IonItem>
            <IonCheckbox 
              checked={selectedStressTests.highMemoryAllocation}
              onIonChange={e => setSelectedStressTests(prev => ({
                ...prev,
                highMemoryAllocation: e.detail.checked
              }))}
            />
            <IonLabel style={{ marginLeft: '12px' }}>
              <h3>High Memory Allocation</h3>
              <p>Tests large memory buffer allocation and tracking</p>
            </IonLabel>
          </IonItem>
        </IonList>

        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <IonButton 
            expand="block" 
            fill="solid"
            disabled={stressTesting || !hasSelectedStressTests}
            onClick={runSelectedStressTests}
            color="warning"
          >
            {stressTesting ? (
              <>
                <IonSpinner name="crescent" style={{ marginRight: '8px' }} />
                Running Stress Tests...
              </>
            ) : (
              <>
                <IonIcon icon={flash} slot="start" />
                Run Selected Stress Tests
              </>
            )}
          </IonButton>

          {stressTestResults && (
            <IonButton 
              fill="outline" 
              onClick={clearStressTestResults}
              color="medium"
            >
              <IonIcon icon={trash} slot="start" />
              Clear Results
            </IonButton>
          )}
        </div>

        {stressTestResults && (
          <div style={{ marginTop: '16px' }}>
            <IonItem lines="none">
              <IonIcon 
                icon={
                  stressTestResults.overallStatus === 'passed' ? checkmarkCircle :
                  stressTestResults.overallStatus === 'warning' ? warning :
                  closeCircle
                }
                color={
                  stressTestResults.overallStatus === 'passed' ? 'success' :
                  stressTestResults.overallStatus === 'warning' ? 'warning' :
                  'danger'
                }
                slot="start"
              />
              <IonLabel>
                <h3>Stress Test Results</h3>
                <p>
                  {stressTestResults.results.filter(r => r.passed).length} / {stressTestResults.results.length} tests passed
                  {' '}in {stressTestResults.totalDuration}ms
                </p>
              </IonLabel>
            </IonItem>

            {stressTestResults.results.map((result, index) => (
              <IonItem key={index} lines="inset">
                <IonIcon 
                  icon={result.passed ? checkmarkCircle : closeCircle}
                  color={result.passed ? 'success' : 'danger'}
                  slot="start"
                />
                <IonLabel>
                  <h3>{result.testName}</h3>
                  <p>{result.details}</p>
                  <p style={{ fontSize: '12px', opacity: 0.7 }}>
                    Duration: {result.duration}ms
                    {result.warning && (
                      <span style={{ color: 'var(--ion-color-warning)', marginLeft: '8px' }}>
                        ⚠️ {result.warning}
                      </span>
                    )}
                  </p>
                </IonLabel>
              </IonItem>
            ))}
          </div>
        )}
      </IonCardContent>
    </IonCard>
  );
};

export default MemoryManagementTest;