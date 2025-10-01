// Copyright Mark Skiba, 2025 All rights reserved
/* eslint-disable @typescript-eslint/no-explicit-any */
// Memory Stress Test Component - Moved from Unit Tests

import React, { useState } from 'react';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonLabel,
  IonSpinner,
  IonIcon,
  IonList,
  IonCheckbox
} from '@ionic/react';
import { warning, checkmarkCircle, closeCircle, flash, trash } from 'ionicons/icons';
import { streamManager } from '../services/claudeAPIProxy';

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

const MemoryStressTest: React.FC = () => {
  const [stressTesting, setStressTesting] = useState(false);
  const [stressTestResults, setStressTestResults] = useState<StressTestResults | null>(null);
  const [selectedStressTests, setSelectedStressTests] = useState({
    memoryPressure: false,
    aggressiveCleanup: false,
    memoryLeakRisk: false,
    highMemoryAllocation: false
  });

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
          Memory Stress Tests (Moved from Unit Tests)
        </IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <div style={{ marginBottom: '16px' }}>
          <IonLabel>
            <h3 style={{ color: 'var(--ion-color-warning)' }}>⚠️ Warning</h3>
            <p>These are the disruptive memory pressure tests that were moved from unit testing. 
               They are resource-intensive and may temporarily impact system performance. Run sparingly for debugging memory issues.</p>
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

export default MemoryStressTest;