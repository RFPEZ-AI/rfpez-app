// Copyright Mark Skiba, 2025 All rights reserved

export type AvatarSize = 'small' | 'medium' | 'large' | 'xlarge';

export interface AgentAvatarProps {
  /** Avatar image URL */
  avatarUrl?: string | null;
  /** Agent name for alt text */
  agentName: string;
  /** Size variant */
  size?: AvatarSize;
  /** Additional CSS classes */
  className?: string;
  /** Whether the agent is currently active/selected */
  isActive?: boolean;
  /** Whether the agent is the default agent */
  isDefault?: boolean;
  /** Whether the agent is a premium/restricted agent */
  isPremium?: boolean;
  /** Whether the agent is free */
  isFree?: boolean;
  /** Custom icon to use instead of default person icon */
  customIcon?: string;
  /** Click handler */
  onClick?: () => void;
}

export interface AvatarSizeConfig {
  container: {
    desktop: string;
    tablet: string;
    mobile: string;
  };
  icon: {
    desktop: string;
    tablet: string;
    mobile: string;
  };
}

export const AVATAR_SIZE_CONFIG: Record<AvatarSize, AvatarSizeConfig> = {
  small: {
    container: { desktop: '32px', tablet: '28px', mobile: '24px' },
    icon: { desktop: '16px', tablet: '14px', mobile: '12px' }
  },
  medium: {
    container: { desktop: '40px', tablet: '32px', mobile: '28px' },
    icon: { desktop: '20px', tablet: '16px', mobile: '14px' }
  },
  large: {
    container: { desktop: '48px', tablet: '40px', mobile: '36px' },
    icon: { desktop: '24px', tablet: '20px', mobile: '18px' }
  },
  xlarge: {
    container: { desktop: '64px', tablet: '56px', mobile: '48px' },
    icon: { desktop: '32px', tablet: '28px', mobile: '24px' }
  }
} as const;
