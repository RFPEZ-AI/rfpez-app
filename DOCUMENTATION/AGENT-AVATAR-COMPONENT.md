# AgentAvatar Component Usage Guide

## Overview

The `AgentAvatar` component is a reusable, responsive avatar component designed specifically for displaying AI agent representations throughout the RFPEZ.AI application. It features colorful cartoon robot designs that change based on agent type, providing consistent sizing, state visualization, and responsive scaling across all device types.

## Features

- **Colorful Cartoon Designs**: Unique robot designs for different agent types
- **Interactive Animations**: Agent-specific animations (pulsing, glowing, bouncing)
- **Responsive Design**: Automatically scales based on screen size
- **Multiple Sizes**: 4 predefined sizes (small, medium, large, xlarge)
- **State Indicators**: Visual indicators for active, default, premium, and free agents
- **Fallback Support**: Graceful fallback to cartoon robot when image fails to load
- **Click Handling**: Optional click interaction support
- **Accessibility**: Proper alt text, contrast support, and reduced motion preferences
- **Dark Mode**: Full dark mode support with enhanced glow effects

## Cartoon Robot Designs

### Default Agent (Orange Robot)
- Friendly orange robot with antenna
- Standard eyes and speaker grille mouth
- Side circuit patterns

### Active Agent (Green Robot)  
- Green robot with pulsing antenna animation
- Focused rectangular eyes
- Data stream visualizations
- Gentle pulsing animation

### Premium Agent (Purple Robot)
- Purple robot with golden crown
- Elegant larger eyes
- Premium speaker grille
- Glowing animation with sparkles

### Free Agent (Cyan Robot)
- Cyan robot with gift box antenna
- Large friendly eyes  
- Happy smile instead of grille
- Bouncing animation with sparkles

## Basic Usage

```tsx
import AgentAvatar from '../components/AgentAvatar';

// Simple usage with cartoon robot
<AgentAvatar 
  agentName="Assistant Agent"
  size="medium"
/>

// With custom image (shows cartoon on image error)
<AgentAvatar 
  agentName="Assistant Agent"
  avatarUrl="https://example.com/avatar.jpg"
  size="medium"
/>

// With state indicators and animations
<AgentAvatar 
  agentName="Premium Agent"
  avatarUrl="https://example.com/avatar.jpg"
  size="large"
  isPremium={true}
  isActive={true}
  onClick={() => handleAgentSelect()}
/>
```

## Props Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `agentName` | `string` | **Required** | Agent name for alt text |
| `avatarUrl` | `string \| null` | `undefined` | Avatar image URL |
| `size` | `'small' \| 'medium' \| 'large' \| 'xlarge'` | `'medium'` | Size variant |
| `className` | `string` | `''` | Additional CSS classes |
| `isActive` | `boolean` | `false` | Whether agent is currently active/selected |
| `isDefault` | `boolean` | `false` | Whether agent is the default agent |
| `isPremium` | `boolean` | `false` | Whether agent is premium/restricted |
| `isFree` | `boolean` | `false` | Whether agent is free |
| `customIcon` | `string` | `undefined` | Custom icon to use instead of default |
| `onClick` | `() => void` | `undefined` | Click handler |

## Size Guide

### Desktop Sizes
- **small**: 32px × 32px (icon: 16px)
- **medium**: 40px × 40px (icon: 20px) 
- **large**: 48px × 48px (icon: 24px)
- **xlarge**: 64px × 64px (icon: 32px)

### Responsive Scaling
- **Tablet** (≤768px): ~80% of desktop size
- **Mobile** (≤480px): ~75% of desktop size

## State Indicators

### Visual States
- **Active**: Green robot with pulsing animation and data streams
- **Default**: Orange robot with warning color theme and antenna
- **Premium**: Purple robot with golden crown and glowing effects  
- **Free**: Cyan robot with gift box and bouncing animation

### Animations
- **Active agents**: Gentle pulsing every 2 seconds
- **Premium agents**: Glowing effect that intensifies every 3 seconds
- **Free agents**: Happy bouncing motion every 2.5 seconds
- **Hover effects**: Scale up 5% on mouse over (when clickable)
- **Reduced Motion**: All animations disabled when user prefers reduced motion

## Usage Examples

### Agent Selector Cards
```tsx
<AgentAvatar 
  agentName="Claude Assistant"
  avatarUrl={agent.avatar_url}
  size="large"
  isActive={currentAgent?.id === agent.id}
  isPremium={agent.is_restricted}
  isFree={agent.is_free}
  onClick={() => selectAgent(agent)}
/>
```

### List Items
```tsx
<IonItem>
  <AgentAvatar 
    agentName="Helper Agent"
    avatarUrl={agent.avatar_url}
    size="medium"
    isDefault={agent.is_default}
  />
  <IonLabel>
    <h3>{agent.name}</h3>
    <p>{agent.description}</p>
  </IonLabel>
</IonItem>
```

### Header Indicators
```tsx
<AgentAvatar 
  agentName="Current Agent"
  avatarUrl={currentAgent.avatar_url}
  size="small"
  isActive={true}
  onClick={() => showAgentSelector()}
/>
```

## Integration with Existing Components

### Replacing Manual Avatar Implementation

**Before:**
```tsx
<IonAvatar className="agent-avatar">
  {agent.avatar_url ? (
    <img src={agent.avatar_url} alt={agent.name} />
  ) : (
    <IonIcon icon={personOutline} />
  )}
</IonAvatar>
```

**After:**
```tsx
<AgentAvatar 
  agentName={agent.name}
  avatarUrl={agent.avatar_url}
  size="medium"
  isActive={isCurrentAgent}
/>
```

## Accessibility Features

- Proper alt text using `agentName` prop
- High contrast mode support
- Reduced motion support for animations
- Keyboard navigation support when clickable
- Screen reader friendly status indicators

## Performance Considerations

- Images are lazy-loaded by the browser
- Graceful fallback prevents broken image displays
- CSS-based scaling reduces JavaScript overhead
- Optimized for mobile performance

## Customization

### Custom Styling
Add additional CSS classes via the `className` prop:

```tsx
<AgentAvatar 
  agentName="Special Agent"
  className="my-custom-avatar"
  size="large"
/>
```

### Custom Icons
Use custom icons instead of the default person outline:

```tsx
<AgentAvatar 
  agentName="Bot Agent"
  customIcon="construct-outline"
  size="medium"
/>
```

## Browser Support

- All modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Progressive enhancement for older browsers
- Graceful degradation without JavaScript

## Demo

Visit `/debug/avatars` in the application to see live examples of all avatar variants and responsive behavior.
