// Copyright Mark Skiba, 2025 All rights reserved
/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */

import React, { useState, useEffect } from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonItem,
  IonLabel,
  IonBadge,
  IonProgressBar,
  IonText,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonChip,
  IonNote,
  IonAlert
} from '@ionic/react';
import {
  refreshOutline,
  analyticsOutline,
  speedometerOutline,
  cloudUploadOutline,
  warningOutline,
  checkmarkCircleOutline,
  timeOutline,
  flashOutline,
  barChartOutline,
  pulseOutline
} from 'ionicons/icons';
import { claudeAPIProxy } from '../services/claudeAPIProxy';
import { streamManager } from '../services/claudeAPIProxy';

interface PerformanceData {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p95ResponseTime: number;
  requestsPerMinute: number;
  throughputBytesPerSecond: number;
  errorRate: number;
}

interface StreamingHealth {
  activeStreams: number;
  healthyConnections: number;
  maxConcurrentStreams: number;
  streamIds: string[];
  healthStatus: string;
  lastCleanup: string;
  performanceMetrics: any;
  poolUtilization: string;
  connectionAgeDistribution: { [key: string]: number };
  memoryHealth: {
    totalAllocated: string;
    totalUsed: string;
    bufferCount: number;
    poolUtilization: string;
    memoryPressure: string;
    memoryLeakRisk: string;
    gcCount: number;
    averageBufferSize: string;
  };
}

const PerformanceMonitoringDashboard: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [streamingHealth, setStreamingHealth] = useState<StreamingHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const refreshData = async () => {
    try {
      setLoading(true);
      
      // Get performance metrics from ClaudeAPIProxy
      const perfData = claudeAPIProxy.getPerformanceMetrics();
      setPerformanceData(perfData);
      
      // Get streaming health metrics from StreamManager
      const healthData = streamManager.getStreamingHealthMetrics();
      setStreamingHealth(healthData);
      
      setLastUpdated(new Date());
      
      console.log('📊 Performance Dashboard Data Updated:', { perfData, healthData });
    } catch (error) {
      console.error('❌ Failed to refresh performance data:', error);
      setAlertMessage(`Failed to refresh performance data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial load
    refreshData();
    
    // Set up auto refresh
    if (autoRefresh) {
      const interval = setInterval(refreshData, 5000); // Refresh every 5 seconds
      setRefreshInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [autoRefresh]);

  const formatBytes = (bytes: number | string): string => {
    const numBytes = typeof bytes === 'string' ? parseFloat(bytes) : bytes;
    if (numBytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(numBytes) / Math.log(k));
    return parseFloat((numBytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatResponseTime = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getHealthColor = (value: number, thresholds: { good: number; warning: number }): string => {
    if (value <= thresholds.good) return 'success';
    if (value <= thresholds.warning) return 'warning';
    return 'danger';
  };

  const parsePercentage = (value: string): number => {
    return parseFloat(value.replace('%', ''));
  };

  const toggleAutoRefresh = () => {
    if (autoRefresh && refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
    setAutoRefresh(!autoRefresh);
  };

  const handleRefresh = (event: CustomEvent) => {
    refreshData().then(() => {
      event.detail.complete();
    });
  };

  if (loading && !performanceData) {
    return (
      <IonCard>
        <IonCardContent>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <IonSpinner name="crescent" />
            <p>Loading performance metrics...</p>
          </div>
        </IonCardContent>
      </IonCard>
    );
  }

  return (
    <>
      <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
        <IonRefresherContent></IonRefresherContent>
      </IonRefresher>

      {/* Header Controls */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IonIcon icon={analyticsOutline} />
              Performance Dashboard
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IonChip 
                color={autoRefresh ? 'success' : 'medium'} 
                onClick={toggleAutoRefresh}
                style={{ cursor: 'pointer' }}
              >
                <IonIcon icon={pulseOutline} />
                <IonLabel>{autoRefresh ? 'Auto' : 'Manual'}</IonLabel>
              </IonChip>
              <IonButton fill="outline" size="small" onClick={refreshData} disabled={loading}>
                {loading ? <IonSpinner name="crescent" /> : <IonIcon icon={refreshOutline} />}
              </IonButton>
            </div>
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          {lastUpdated && (
            <IonNote>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </IonNote>
          )}
        </IonCardContent>
      </IonCard>

      {/* Key Performance Metrics */}
      <IonGrid>
        <IonRow>
          <IonCol size="12" sizeMd="6">
            <IonCard>
              <IonCardHeader>
                <IonCardTitle style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IonIcon icon={speedometerOutline} />
                  Response Times
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                {performanceData && (
                  <>
                    <IonItem lines="none">
                      <IonLabel>Average Response Time</IonLabel>
                      <IonBadge color={getHealthColor(performanceData.averageResponseTime, { good: 500, warning: 1000 })}>
                        {formatResponseTime(performanceData.averageResponseTime)}
                      </IonBadge>
                    </IonItem>
                    <IonItem lines="none">
                      <IonLabel>P95 Response Time</IonLabel>
                      <IonBadge color={getHealthColor(performanceData.p95ResponseTime, { good: 1000, warning: 2000 })}>
                        {formatResponseTime(performanceData.p95ResponseTime)}
                      </IonBadge>
                    </IonItem>
                    <IonItem lines="none">
                      <IonLabel>Min / Max</IonLabel>
                      <IonText>
                        {formatResponseTime(performanceData.minResponseTime)} / {formatResponseTime(performanceData.maxResponseTime)}
                      </IonText>
                    </IonItem>
                  </>
                )}
              </IonCardContent>
            </IonCard>
          </IonCol>

          <IonCol size="12" sizeMd="6">
            <IonCard>
              <IonCardHeader>
                <IonCardTitle style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IonIcon icon={barChartOutline} />
                  Request Statistics
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                {performanceData && (
                  <>
                    <IonItem lines="none">
                      <IonLabel>Total Requests</IonLabel>
                      <IonBadge color="primary">{performanceData.totalRequests}</IonBadge>
                    </IonItem>
                    <IonItem lines="none">
                      <IonLabel>Success Rate</IonLabel>
                      <IonBadge color={getHealthColor(performanceData.errorRate, { good: 1, warning: 5 })}>
                        {((performanceData.successfulRequests / Math.max(performanceData.totalRequests, 1)) * 100).toFixed(1)}%
                      </IonBadge>
                    </IonItem>
                    <IonItem lines="none">
                      <IonLabel>Requests per Minute</IonLabel>
                      <IonBadge color="secondary">{performanceData.requestsPerMinute}</IonBadge>
                    </IonItem>
                  </>
                )}
              </IonCardContent>
            </IonCard>
          </IonCol>
        </IonRow>

        <IonRow>
          <IonCol size="12" sizeMd="6">
            <IonCard>
              <IonCardHeader>
                <IonCardTitle style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IonIcon icon={cloudUploadOutline} />
                  Throughput
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                {performanceData && (
                  <>
                    <IonItem lines="none">
                      <IonLabel>Data Throughput</IonLabel>
                      <IonBadge color="tertiary">
                        {formatBytes(performanceData.throughputBytesPerSecond)}/s
                      </IonBadge>
                    </IonItem>
                    <IonProgressBar 
                      value={Math.min(performanceData.throughputBytesPerSecond / 1000000, 1)} // Scale to MB/s
                      color="tertiary"
                    />
                    <IonNote>Throughput visualization (max 1MB/s scale)</IonNote>
                  </>
                )}
              </IonCardContent>
            </IonCard>
          </IonCol>

          <IonCol size="12" sizeMd="6">
            <IonCard>
              <IonCardHeader>
                <IonCardTitle style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IonIcon icon={flashOutline} />
                  Connection Health
                </IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                {streamingHealth && (
                  <>
                    <IonItem lines="none">
                      <IonLabel>Active Streams</IonLabel>
                      <IonBadge color={streamingHealth.activeStreams > 0 ? 'success' : 'medium'}>
                        {streamingHealth.activeStreams}
                      </IonBadge>
                    </IonItem>
                    <IonItem lines="none">
                      <IonLabel>Pool Utilization</IonLabel>
                      <IonBadge color={getHealthColor(parsePercentage(streamingHealth.poolUtilization), { good: 50, warning: 80 })}>
                        {streamingHealth.poolUtilization}
                      </IonBadge>
                    </IonItem>
                    <IonProgressBar 
                      value={parsePercentage(streamingHealth.poolUtilization) / 100}
                      color={getHealthColor(parsePercentage(streamingHealth.poolUtilization), { good: 50, warning: 80 })}
                    />
                    <IonItem lines="none">
                      <IonLabel>Health Status</IonLabel>
                      <IonBadge color={streamingHealth.healthStatus === 'healthy' ? 'success' : 'warning'}>
                        {streamingHealth.healthStatus}
                      </IonBadge>
                    </IonItem>
                  </>
                )}
              </IonCardContent>
            </IonCard>
          </IonCol>
        </IonRow>

        {/* Memory Health */}
        {streamingHealth?.memoryHealth && (
          <IonRow>
            <IonCol size="12">
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <IonIcon icon={analyticsOutline} />
                    Memory Health
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonGrid>
                    <IonRow>
                      <IonCol size="6" sizeMd="3">
                        <IonItem lines="none">
                          <IonLabel>
                            <h3>Total Allocated</h3>
                            <p>{streamingHealth.memoryHealth.totalAllocated}</p>
                          </IonLabel>
                        </IonItem>
                      </IonCol>
                      <IonCol size="6" sizeMd="3">
                        <IonItem lines="none">
                          <IonLabel>
                            <h3>Memory Used</h3>
                            <p>{streamingHealth.memoryHealth.totalUsed}</p>
                          </IonLabel>
                        </IonItem>
                      </IonCol>
                      <IonCol size="6" sizeMd="3">
                        <IonItem lines="none">
                          <IonLabel>
                            <h3>Buffer Count</h3>
                            <p>{streamingHealth.memoryHealth.bufferCount}</p>
                          </IonLabel>
                        </IonItem>
                      </IonCol>
                      <IonCol size="6" sizeMd="3">
                        <IonItem lines="none">
                          <IonLabel>
                            <h3>GC Count</h3>
                            <p>{streamingHealth.memoryHealth.gcCount}</p>
                          </IonLabel>
                        </IonItem>
                      </IonCol>
                    </IonRow>
                    
                    <IonRow>
                      <IonCol size="12">
                        <IonItem lines="none">
                          <IonLabel>Memory Pressure</IonLabel>
                          <IonBadge color={getHealthColor(parsePercentage(streamingHealth.memoryHealth.memoryPressure), { good: 50, warning: 80 })}>
                            {streamingHealth.memoryHealth.memoryPressure}
                          </IonBadge>
                        </IonItem>
                        <IonProgressBar 
                          value={parsePercentage(streamingHealth.memoryHealth.memoryPressure) / 100}
                          color={getHealthColor(parsePercentage(streamingHealth.memoryHealth.memoryPressure), { good: 50, warning: 80 })}
                        />
                      </IonCol>
                    </IonRow>
                  </IonGrid>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        )}

        {/* Connection Age Distribution */}
        {streamingHealth?.connectionAgeDistribution && (
          <IonRow>
            <IonCol size="12">
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <IonIcon icon={timeOutline} />
                    Connection Age Distribution
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonGrid>
                    <IonRow>
                      {Object.entries(streamingHealth.connectionAgeDistribution).map(([age, count]) => (
                        <IonCol key={age} size="6" sizeMd="3">
                          <IonItem lines="none">
                            <IonLabel>
                              <h3>{age.replace('under', '<').replace('over', '>')}</h3>
                              <p>{count} connections</p>
                            </IonLabel>
                          </IonItem>
                        </IonCol>
                      ))}
                    </IonRow>
                  </IonGrid>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        )}
      </IonGrid>

      <IonAlert
        isOpen={showAlert}
        onDidDismiss={() => setShowAlert(false)}
        header="Performance Dashboard"
        message={alertMessage}
        buttons={['OK']}
      />
    </>
  );
};

export default PerformanceMonitoringDashboard;