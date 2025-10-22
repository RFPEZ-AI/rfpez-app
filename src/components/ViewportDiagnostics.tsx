// Copyright Mark Skiba, 2025 All rights reserved

import React, { useState, useEffect } from 'react';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonIcon, IonItem, IonLabel } from '@ionic/react';
import { copyOutline, refreshOutline } from 'ionicons/icons';
import { getPlatforms } from '@ionic/react';

interface ViewportInfo {
  windowWidth: number;
  windowHeight: number;
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  innerWidth: number;
  innerHeight: number;
  outerWidth: number;
  outerHeight: number;
  orientation: 'portrait' | 'landscape';
  detectedOrientation: 'portrait' | 'landscape';
  userAgent: string;
  platform: string;
  ionicPlatforms: string[];
  visualViewportWidth: number;
  visualViewportHeight: number;
  visualViewportScale: number;
  documentWidth: number;
  documentHeight: number;
  bodyWidth: number;
  bodyHeight: number;
  aspectRatio: number;
  zoom: number;
  timestamp: string;
}

const ViewportDiagnostics: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<ViewportInfo | null>(null);
  const [copied, setCopied] = useState(false);

  const collectDiagnostics = () => {
    const orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    const visualViewport = window.visualViewport || {
      width: window.innerWidth,
      height: window.innerHeight,
      scale: 1
    };

    // Estimate zoom level (devicePixelRatio / default DPR)
    const zoom = Math.round((window.outerWidth / window.innerWidth) * 100);

    const info: ViewportInfo = {
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      devicePixelRatio: window.devicePixelRatio,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      outerWidth: window.outerWidth,
      outerHeight: window.outerHeight,
      orientation: orientation,
      detectedOrientation: window.matchMedia('(orientation: portrait)').matches ? 'portrait' : 'landscape',
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      ionicPlatforms: getPlatforms(),
      visualViewportWidth: visualViewport.width,
      visualViewportHeight: visualViewport.height,
      visualViewportScale: visualViewport.scale,
      documentWidth: document.documentElement.clientWidth,
      documentHeight: document.documentElement.clientHeight,
      bodyWidth: document.body.clientWidth,
      bodyHeight: document.body.clientHeight,
      aspectRatio: Math.round((window.innerWidth / window.innerHeight) * 100) / 100,
      zoom: zoom,
      timestamp: new Date().toISOString()
    };

    setDiagnostics(info);
    return info;
  };

  const copyToClipboard = async () => {
    if (!diagnostics) return;

    const text = JSON.stringify(diagnostics, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback: Show in alert
      alert(text);
    }
  };

  useEffect(() => {
    collectDiagnostics();

    // Update on resize
    const handleResize = () => {
      collectDiagnostics();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  if (!diagnostics) return null;

  const getOrientationColor = () => {
    // If browser window is landscape but detected as portrait, highlight issue
    if (diagnostics.aspectRatio > 1 && diagnostics.orientation === 'portrait') {
      return 'danger';
    }
    return diagnostics.orientation === 'portrait' ? 'warning' : 'success';
  };

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>
          Viewport Diagnostics
          <IonButton 
            size="small" 
            fill="clear" 
            onClick={collectDiagnostics}
            style={{ float: 'right' }}
          >
            <IonIcon icon={refreshOutline} slot="icon-only" />
          </IonButton>
        </IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <div style={{ marginBottom: '12px' }}>
          <IonButton expand="block" onClick={copyToClipboard} disabled={copied}>
            <IonIcon icon={copyOutline} slot="start" />
            {copied ? 'Copied!' : 'Copy All Diagnostics'}
          </IonButton>
        </div>

        <IonItem>
          <IonLabel>
            <h3>Orientation Detection</h3>
            <p>
              <strong style={{ color: getOrientationColor() === 'danger' ? 'red' : 'inherit' }}>
                {diagnostics.orientation.toUpperCase()}
              </strong>
              {' '}(Height: {diagnostics.windowHeight}px {'>'} Width: {diagnostics.windowWidth}px)
            </p>
          </IonLabel>
        </IonItem>

        <IonItem>
          <IonLabel>
            <h3>Aspect Ratio</h3>
            <p>{diagnostics.aspectRatio} (Width/Height)</p>
          </IonLabel>
        </IonItem>

        <IonItem>
          <IonLabel>
            <h3>Window Size</h3>
            <p>{diagnostics.windowWidth} x {diagnostics.windowHeight}px</p>
          </IonLabel>
        </IonItem>

        <IonItem>
          <IonLabel>
            <h3>Screen Size</h3>
            <p>{diagnostics.screenWidth} x {diagnostics.screenHeight}px</p>
          </IonLabel>
        </IonItem>

        <IonItem>
          <IonLabel>
            <h3>Visual Viewport</h3>
            <p>{diagnostics.visualViewportWidth} x {diagnostics.visualViewportHeight}px (Scale: {diagnostics.visualViewportScale})</p>
          </IonLabel>
        </IonItem>

        <IonItem>
          <IonLabel>
            <h3>Estimated Zoom</h3>
            <p>{diagnostics.zoom}%</p>
          </IonLabel>
        </IonItem>

        <IonItem>
          <IonLabel>
            <h3>Device Pixel Ratio</h3>
            <p>{diagnostics.devicePixelRatio}</p>
          </IonLabel>
        </IonItem>

        <IonItem>
          <IonLabel>
            <h3>Ionic Platforms</h3>
            <p>{diagnostics.ionicPlatforms.join(', ')}</p>
          </IonLabel>
        </IonItem>

        <IonItem>
          <IonLabel>
            <h3>Browser Platform</h3>
            <p>{diagnostics.platform}</p>
          </IonLabel>
        </IonItem>

        <IonItem>
          <IonLabel>
            <h3>Media Query Orientation</h3>
            <p>{diagnostics.detectedOrientation}</p>
          </IonLabel>
        </IonItem>

        <IonItem>
          <IonLabel>
            <h3>User Agent</h3>
            <p style={{ fontSize: '0.8em', wordBreak: 'break-all' }}>{diagnostics.userAgent}</p>
          </IonLabel>
        </IonItem>

        <div style={{ marginTop: '12px', padding: '8px', background: 'var(--ion-color-light)', borderRadius: '4px' }}>
          <p style={{ margin: 0, fontSize: '0.85em' }}>
            <strong>Issue Detection:</strong>
            {diagnostics.aspectRatio > 1 && diagnostics.orientation === 'portrait' && (
              <span style={{ color: 'red', display: 'block', marginTop: '4px' }}>
                ⚠️ ISSUE: Browser window is landscape (aspect {diagnostics.aspectRatio}) but detected as PORTRAIT. 
                This will cause artifacts to appear at bottom instead of side panel.
              </span>
            )}
            {diagnostics.aspectRatio <= 1 && diagnostics.orientation === 'landscape' && (
              <span style={{ color: 'orange', display: 'block', marginTop: '4px' }}>
                ⚠️ ISSUE: Browser window is portrait (aspect {diagnostics.aspectRatio}) but detected as LANDSCAPE.
              </span>
            )}
            {((diagnostics.aspectRatio > 1 && diagnostics.orientation === 'landscape') ||
              (diagnostics.aspectRatio <= 1 && diagnostics.orientation === 'portrait')) && (
              <span style={{ color: 'green', display: 'block', marginTop: '4px' }}>
                ✅ Orientation detection is correct.
              </span>
            )}
          </p>
        </div>
      </IonCardContent>
    </IonCard>
  );
};

export default ViewportDiagnostics;
