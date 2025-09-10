// Copyright Mark Skiba, 2025 All rights reserved

import React, { useState, useEffect } from 'react';
import { IonChip, IonIcon, IonLabel } from '@ionic/react';
import { warningOutline, timeOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { APIRetryHandler } from '../utils/apiRetry';

interface RateLimitStatusProps {
  className?: string;
  style?: React.CSSProperties;
}

const RateLimitStatus: React.FC<RateLimitStatusProps> = ({ className, style }) => {
  const [rateLimitInfo, setRateLimitInfo] = useState(APIRetryHandler.getRateLimitStatus());
  const [timeUntilReset, setTimeUntilReset] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentInfo = APIRetryHandler.getRateLimitStatus();
      setRateLimitInfo(currentInfo);

      if (currentInfo && currentInfo.resetTime > Date.now()) {
        setTimeUntilReset(Math.max(0, currentInfo.resetTime - Date.now()));
      } else {
        setTimeUntilReset(0);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Don't render if no rate limit info or if reset time has passed
  if (!rateLimitInfo || timeUntilReset <= 0) {
    return null;
  }

  const seconds = Math.ceil(timeUntilReset / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  const timeString = minutes > 0 
    ? `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    : `${seconds}s`;

  return (
    <IonChip 
      className={className}
      style={style}
      color="warning"
      outline
    >
      <IonIcon icon={timeOutline} />
      <IonLabel>
        Rate limit active: {timeString}
      </IonLabel>
    </IonChip>
  );
};

/**
 * Simple status indicator without countdown
 */
export const SimpleRateLimitStatus: React.FC<RateLimitStatusProps> = ({ className, style }) => {
  const [hasRateLimit, setHasRateLimit] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const rateLimitInfo = APIRetryHandler.getRateLimitStatus();
      setHasRateLimit(rateLimitInfo !== null && rateLimitInfo.resetTime > Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!hasRateLimit) {
    return (
      <IonChip 
        className={className}
        style={style}
        color="success"
        outline
      >
        <IonIcon icon={checkmarkCircleOutline} />
        <IonLabel>API Ready</IonLabel>
      </IonChip>
    );
  }

  return (
    <IonChip 
      className={className}
      style={style}
      color="warning"
      outline
    >
      <IonIcon icon={warningOutline} />
      <IonLabel>Rate Limited</IonLabel>
    </IonChip>
  );
};

export default RateLimitStatus;
