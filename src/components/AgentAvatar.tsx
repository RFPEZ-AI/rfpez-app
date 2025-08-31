// Copyright Mark Skiba, 2025 All rights reserved

import React from 'react';
import { IonAvatar, IonIcon } from '@ionic/react';
import type { AgentAvatarProps } from './AgentAvatar.types';
import './AgentAvatar.css';

// Colorful cartoon robot icon component
const CartoonAgentIcon: React.FC<{ agentType?: string }> = ({ agentType = 'default' }) => {
  const getColorTheme = () => {
    switch (agentType) {
      case 'premium':
        return {
          primary: '#9C27B0',
          secondary: '#E1BEE7',
          accent: '#FF6B6B',
          highlight: '#FFD700'
        };
      case 'free':
        return {
          primary: '#00BCD4',
          secondary: '#B2EBF2',
          accent: '#FFC107',
          highlight: '#4CAF50'
        };
      case 'default':
        return {
          primary: '#FF9800',
          secondary: '#FFE0B2',
          accent: '#4CAF50',
          highlight: '#2196F3'
        };
      case 'active':
        return {
          primary: '#4CAF50',
          secondary: '#C8E6C9',
          accent: '#2196F3',
          highlight: '#FFD700'
        };
      default:
        return {
          primary: '#2196F3',
          secondary: '#BBDEFB',
          accent: '#FF5722',
          highlight: '#9C27B0'
        };
    }
  };

  const colors = getColorTheme();
  
  // Different robot designs for different types
  if (agentType === 'premium') {
    return (
      <svg width="100%" height="100%" viewBox="0 0 64 64" className="cartoon-agent-icon">
        {/* Premium robot with crown */}
        <circle cx="32" cy="32" r="28" fill={colors.secondary} stroke={colors.primary} strokeWidth="3" />
        <circle cx="32" cy="32" r="22" fill={colors.primary} opacity="0.8" />
        
        {/* Crown */}
        <polygon points="22,12 26,18 32,14 38,18 42,12 32,8" fill={colors.highlight} stroke="#FFD700" strokeWidth="1" />
        <circle cx="32" cy="10" r="2" fill="#FFD700" />
        
        {/* Fancy eyes */}        
        <ellipse cx="24" cy="26" rx="5" ry="4" fill="white" />
        <ellipse cx="40" cy="26" rx="5" ry="4" fill="white" />
        <circle cx="24" cy="26" r="2" fill="#333" />
        <circle cx="40" cy="26" r="2" fill="#333" />
        <circle cx="25" cy="25" r="1" fill="white" />
        <circle cx="41" cy="25" r="1" fill="white" />
        
        {/* Premium mouth */}
        <rect x="24" y="38" width="16" height="8" rx="4" fill={colors.accent} />
        <rect x="26" y="40" width="12" height="1" fill="white" opacity="0.8" />
        <rect x="26" y="42" width="12" height="1" fill="white" opacity="0.8" />
        <rect x="26" y="44" width="12" height="1" fill="white" opacity="0.8" />
        
        {/* Decorative circuits */}
        <circle cx="16" cy="32" r="3" fill="none" stroke={colors.accent} strokeWidth="2" />
        <circle cx="48" cy="32" r="3" fill="none" stroke={colors.accent} strokeWidth="2" />
        
        <ellipse cx="28" cy="20" rx="6" ry="8" fill="white" opacity="0.3" />
      </svg>
    );
  }
  
  if (agentType === 'free') {
    return (
      <svg width="100%" height="100%" viewBox="0 0 64 64" className="cartoon-agent-icon">
        {/* Friendly free robot */}
        <circle cx="32" cy="32" r="28" fill={colors.secondary} stroke={colors.primary} strokeWidth="3" />
        <circle cx="32" cy="32" r="22" fill={colors.primary} opacity="0.8" />
        
        {/* Happy antenna with gift */}
        <line x1="32" y1="8" x2="32" y2="15" stroke={colors.accent} strokeWidth="2" strokeLinecap="round" />
        <rect x="29" y="6" width="6" height="4" fill={colors.highlight} stroke="#4CAF50" strokeWidth="1" />
        <line x1="29" y1="8" x2="35" y2="8" stroke="white" strokeWidth="1" />
        
        {/* Big friendly eyes */}
        <circle cx="24" cy="26" r="5" fill="white" />
        <circle cx="40" cy="26" r="5" fill="white" />
        <circle cx="24" cy="26" r="3" fill="#333" />
        <circle cx="40" cy="26" r="3" fill="#333" />
        <circle cx="25" cy="24" r="1.5" fill="white" />
        <circle cx="41" cy="24" r="1.5" fill="white" />
        
        {/* Happy smile */}
        <path d="M 22 40 Q 32 48 42 40" fill="none" stroke={colors.accent} strokeWidth="3" strokeLinecap="round" />
        
        {/* Cheek sparkles */}
        <path d="M 14 28 L 16 30 L 14 32 L 12 30 Z" fill={colors.highlight} />
        <path d="M 50 28 L 52 30 L 50 32 L 48 30 Z" fill={colors.highlight} />
        
        <ellipse cx="26" cy="18" rx="5" ry="7" fill="white" opacity="0.3" />
      </svg>
    );
  }
  
  if (agentType === 'active') {
    return (
      <svg width="100%" height="100%" viewBox="0 0 64 64" className="cartoon-agent-icon">
        {/* Active working robot */}
        <circle cx="32" cy="32" r="28" fill={colors.secondary} stroke={colors.primary} strokeWidth="3" />
        <circle cx="32" cy="32" r="22" fill={colors.primary} opacity="0.8" />
        
        {/* Pulsing antenna */}
        <line x1="32" y1="8" x2="32" y2="15" stroke={colors.accent} strokeWidth="2" strokeLinecap="round" />
        <circle cx="32" cy="8" r="3" fill={colors.accent}>
          <animate attributeName="r" values="3;4;3" dur="1s" repeatCount="indefinite" />
        </circle>
        
        {/* Focused eyes */}
        <rect x="20" y="24" width="8" height="4" rx="2" fill="white" />
        <rect x="36" y="24" width="8" height="4" rx="2" fill="white" />
        <rect x="22" y="25" width="4" height="2" fill={colors.accent} />
        <rect x="38" y="25" width="4" height="2" fill={colors.accent} />
        
        {/* Working mouth */}
        <rect x="26" y="38" width="12" height="6" rx="3" fill={colors.accent} />
        <circle cx="29" cy="41" r="1" fill={colors.highlight} />
        <circle cx="32" cy="41" r="1" fill={colors.highlight} />
        <circle cx="35" cy="41" r="1" fill={colors.highlight} />
        
        {/* Data streams */}
        <path d="M 12 28 Q 8 32 12 36" fill="none" stroke={colors.highlight} strokeWidth="1.5" />
        <path d="M 52 28 Q 56 32 52 36" fill="none" stroke={colors.highlight} strokeWidth="1.5" />
        
        <ellipse cx="30" cy="20" rx="6" ry="8" fill="white" opacity="0.2" />
      </svg>
    );
  }
  
  // Default robot design
  return (
    <svg width="100%" height="100%" viewBox="0 0 64 64" className="cartoon-agent-icon">
      {/* Standard friendly robot */}
      <circle cx="32" cy="32" r="28" fill={colors.secondary} stroke={colors.primary} strokeWidth="3" />
      <circle cx="32" cy="32" r="22" fill={colors.primary} opacity="0.8" />
      
      {/* Simple antenna */}
      <line x1="32" y1="8" x2="32" y2="15" stroke={colors.accent} strokeWidth="2" strokeLinecap="round" />
      <circle cx="32" cy="8" r="3" fill={colors.accent} />
      
      {/* Friendly eyes */}
      <circle cx="24" cy="26" r="4" fill="white" />
      <circle cx="40" cy="26" r="4" fill="white" />
      <circle cx="24" cy="26" r="2" fill="#333" />
      <circle cx="40" cy="26" r="2" fill="#333" />
      <circle cx="25" cy="25" r="1" fill="white" />
      <circle cx="41" cy="25" r="1" fill="white" />
      
      {/* Standard mouth */}
      <rect x="26" y="38" width="12" height="6" rx="3" fill={colors.accent} />
      <line x1="28" y1="40" x2="36" y2="40" stroke="white" strokeWidth="1" />
      <line x1="28" y1="42" x2="36" y2="42" stroke="white" strokeWidth="1" />
      
      {/* Side circuits */}
      <path d="M 12 32 Q 16 28 20 32 Q 16 36 12 32" fill="none" stroke={colors.accent} strokeWidth="1.5" />
      <path d="M 44 32 Q 48 28 52 32 Q 48 36 44 32" fill="none" stroke={colors.accent} strokeWidth="1.5" />
      
      {/* Head shine */}
      <ellipse cx="28" cy="22" rx="8" ry="12" fill="white" opacity="0.2" />
    </svg>
  );
};

const AgentAvatar: React.FC<AgentAvatarProps> = ({
  avatarUrl,
  agentName,
  size = 'medium',
  className = '',
  isActive = false,
  isDefault = false,
  isPremium = false,
  isFree = false,
  customIcon,
  onClick
}) => {
  const avatarClasses = [
    'agent-avatar',
    `agent-avatar--${size}`,
    isActive && 'agent-avatar--active',
    isDefault && 'agent-avatar--default',
    isPremium && 'agent-avatar--premium',
    isFree && 'agent-avatar--free',
    onClick && 'agent-avatar--clickable',
    className
  ].filter(Boolean).join(' ');

  // Determine agent type for cartoon icon coloring
  const getAgentType = () => {
    if (isActive) return 'active';
    if (isPremium) return 'premium';
    if (isFree) return 'free';
    if (isDefault) return 'default';
    return 'default';
  };

  // Get size for cartoon icon
  const getIconSize = () => {
    switch (size) {
      case 'small': return '32px';
      case 'medium': return '40px';
      case 'large': return '48px';
      case 'xlarge': return '64px';
      default: return '40px';
    }
  };

  return (
    <IonAvatar 
      className={avatarClasses}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {avatarUrl ? (
        <img 
          src={avatarUrl} 
          alt={`${agentName} avatar`}
          onError={(e) => {
            // Fallback to cartoon icon if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              const iconElement = parent.querySelector('.fallback-icon');
              if (iconElement) {
                (iconElement as HTMLElement).style.display = 'flex';
              }
            }
          }}
        />
      ) : null}
      
      {/* Fallback cartoon icon */}
      <div 
        className="fallback-icon cartoon-icon-container"
        style={{ 
          display: avatarUrl ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%'
        }}
      >
        {customIcon ? (
          <IonIcon 
            icon={customIcon} 
            style={{ 
              fontSize: getIconSize(),
              color: 'var(--ion-color-medium)'
            }}
          />
        ) : (
          <CartoonAgentIcon agentType={getAgentType()} />
        )}
      </div>
    </IonAvatar>
  );
};

export default AgentAvatar;
