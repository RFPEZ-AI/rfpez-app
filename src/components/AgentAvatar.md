# Agent Avatar Component

A responsive, reusable avatar component for displaying agent profiles throughout the application.

## Features

- **Responsive scaling**: Automatically adjusts size based on screen width
- **Multiple size variants**: `small`, `medium`, `large`, `xlarge`
- **Visual state indicators**: Active, default, premium, free status
- **Automatic fallback**: Image failure gracefully falls back to icon
- **Accessibility**: Proper alt text and high contrast support
- **Dark mode support**: Automatic theme adaptation
- **Reduced motion support**: Respects user motion preferences

## Usage

### Basic Usage

```tsx
import AgentAvatar from './AgentAvatar';

// Simple avatar with fallback icon
<AgentAvatar
  agentName="Assistant"
  size="medium"
/>

// Avatar with image
<AgentAvatar
  agentName="Research Agent"
  avatarUrl="https://example.com/avatar.jpg"
  size="large"
/>
```

### With Status Indicators

```tsx
// Active agent
<AgentAvatar
  agentName="Current Agent"
  avatarUrl="https://example.com/avatar.jpg"
  size="large"
  isActive={true}
/>

// Default agent
<AgentAvatar
  agentName="Default Agent"
  size="medium"
  isDefault={true}
/>

// Premium agent
<AgentAvatar
  agentName="Premium Agent"
  avatarUrl="https://example.com/avatar.jpg"
  size="medium"
  isPremium={true}
/>

// Free agent
<AgentAvatar
  agentName="Free Agent"
  avatarUrl="https://example.com/avatar.jpg"
  size="medium"
  isFree={true}
/>
```

### Interactive Avatar

```tsx
<AgentAvatar
  agentName="Clickable Agent"
  avatarUrl="https://example.com/avatar.jpg"
  size="large"
  onClick={() => console.log('Avatar clicked!')}
/>
```

## Size Reference

### Desktop (>768px)
- **small**: 32px container, 16px icon
- **medium**: 40px container, 20px icon  
- **large**: 48px container, 24px icon
- **xlarge**: 64px container, 32px icon

### Tablet (≤768px)
- **small**: 28px container, 14px icon
- **medium**: 32px container, 16px icon
- **large**: 40px container, 20px icon
- **xlarge**: 56px container, 28px icon

### Mobile (≤480px)
- **small**: 24px container, 12px icon
- **medium**: 28px container, 14px icon
- **large**: 36px container, 18px icon
- **xlarge**: 48px container, 24px icon

## Props API

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `agentName` | `string` | **required** | Agent name for alt text |
| `avatarUrl` | `string \| null` | `undefined` | Avatar image URL |
| `size` | `'small' \| 'medium' \| 'large' \| 'xlarge'` | `'medium'` | Size variant |
| `className` | `string` | `''` | Additional CSS classes |
| `isActive` | `boolean` | `false` | Whether agent is currently active |
| `isDefault` | `boolean` | `false` | Whether agent is the default |
| `isPremium` | `boolean` | `false` | Whether agent is premium/restricted |
| `isFree` | `boolean` | `false` | Whether agent is free |
| `customIcon` | `string` | `undefined` | Custom icon instead of default |
| `onClick` | `() => void` | `undefined` | Click handler |

## Integration Examples

### In Agent Selector Cards
```tsx
<AgentAvatar
  agentName={agent.name}
  avatarUrl={agent.avatar_url}
  size="large"
  isActive={isCurrentAgent}
  isDefault={agent.is_default}
  isFree={agent.is_free}
  isPremium={agent.is_restricted}
/>
```

### In Compact Indicators
```tsx
<AgentAvatar
  agentName={agent.agent_name}
  avatarUrl={agent.agent_avatar_url}
  size="small"
/>
```

### In Lists
```tsx
<IonItem>
  <AgentAvatar
    agentName={agent.name}
    avatarUrl={agent.avatar_url}
    size="medium"
    onClick={() => selectAgent(agent)}
  />
  <IonLabel style={{ marginLeft: '12px' }}>
    <h3>{agent.name}</h3>
    <p>{agent.description}</p>
  </IonLabel>
</IonItem>
```

## Accessibility

- Always provide meaningful `agentName` for alt text
- Component supports high contrast mode
- Interactive avatars have proper cursor states
- Respects reduced motion preferences

## Demo

Visit `/debug/avatars` to see all size variants and states in action.
