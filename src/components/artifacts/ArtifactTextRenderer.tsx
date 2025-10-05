// Copyright Mark Skiba, 2025 All rights reserved

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Artifact } from '../../types/home';

interface ArtifactTextRendererProps {
  artifact: Artifact;
  isPortrait?: boolean;
}

const ArtifactTextRenderer: React.FC<ArtifactTextRendererProps> = ({ 
  artifact, 
  isPortrait = false 
}) => {
  let title: string;
  let description: string;
  let content: string;
  let content_type: string;
  let tags: string[] = [];

  try {
    // Check if content looks like JSON first to avoid parsing errors
    const contentStr = artifact.content || '';
    const trimmedContent = contentStr.trim();
    const looksLikeJSON = trimmedContent.startsWith('{') && trimmedContent.endsWith('}') && trimmedContent.length > 2;
    
    if (looksLikeJSON) {
      try {
        // Try to parse as structured JSON artifact
        const textSpec = JSON.parse(contentStr);
        if (textSpec && typeof textSpec === 'object' && textSpec.content && typeof textSpec.content === 'string') {
          // Structured text artifact
          title = textSpec.title || artifact.name;
          description = textSpec.description || '';
          content = textSpec.content;
          content_type = textSpec.content_type || 'markdown';
          tags = textSpec.tags || [];
        } else {
          throw new Error('Not a structured text artifact');
        }
      } catch (jsonError) {
        // JSON parsing failed, treat as raw content
        console.warn('Failed to parse artifact content as JSON, treating as raw content:', jsonError);
        title = artifact.name;
        description = 'Document content';
        content = contentStr;
        content_type = 'markdown';
        tags = [];
      }
    } else {
      // Raw content - treat as markdown
      title = artifact.name;
      description = 'Document content';
      content = contentStr;
      content_type = 'markdown';
      tags = [];
    }
  } catch (error) {
    // Fallback error handling
    console.error('Error in TextRenderer:', error);
    title = artifact.name || 'Document';
    description = 'Document content';
    content = (artifact.content as string) || 'Unable to display content';
    content_type = 'markdown';
    tags = [];
  }

  const formatContent = (text: string, type: string) => {
    switch (type) {
      case 'markdown':
        return (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Custom styling for markdown elements
              h1: ({ children }) => (
                <h1 style={{
                  fontSize: '1.8em',
                  fontWeight: 'bold',
                  marginBottom: '16px',
                  marginTop: '24px',
                  color: 'var(--ion-color-primary)',
                  borderBottom: '2px solid var(--ion-color-primary-tint)',
                  paddingBottom: '8px'
                }}>
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 style={{
                  fontSize: '1.5em',
                  fontWeight: 'bold',
                  marginBottom: '12px',
                  marginTop: '20px',
                  color: 'var(--ion-color-primary)'
                }}>
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 style={{
                  fontSize: '1.3em',
                  fontWeight: 'bold',
                  marginBottom: '10px',
                  marginTop: '16px',
                  color: 'var(--ion-color-primary)'
                }}>
                  {children}
                </h3>
              ),
              h4: ({ children }) => (
                <h4 style={{
                  fontSize: '1.1em',
                  fontWeight: 'bold',
                  marginBottom: '8px',
                  marginTop: '14px',
                  color: 'var(--ion-color-primary)'
                }}>
                  {children}
                </h4>
              ),
              p: ({ children }) => (
                <p style={{
                  lineHeight: '1.6',
                  marginBottom: '12px',
                  fontSize: '14px'
                }}>
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul style={{
                  marginBottom: '12px',
                  paddingLeft: '20px'
                }}>
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol style={{
                  marginBottom: '12px',
                  paddingLeft: '20px'
                }}>
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li style={{
                  marginBottom: '4px',
                  lineHeight: '1.5'
                }}>
                  {children}
                </li>
              ),
              code: ({ children, className }) => {
                const isInline = !className;
                if (isInline) {
                  return (
                    <code style={{
                      backgroundColor: 'var(--ion-color-light)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                      fontSize: '13px',
                      border: '1px solid var(--ion-color-light-shade)'
                    }}>
                      {children}
                    </code>
                  );
                }
                return (
                  <code style={{
                    fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                    fontSize: '13px'
                  }}>
                    {children}
                  </code>
                );
              },
              pre: ({ children }) => (
                <pre style={{
                  backgroundColor: 'var(--ion-color-light)',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid var(--ion-color-light-shade)',
                  overflow: 'auto',
                  marginBottom: '16px',
                  fontSize: '13px',
                  lineHeight: '1.4'
                }}>
                  {children}
                </pre>
              ),
              blockquote: ({ children }) => (
                <blockquote style={{
                  borderLeft: '4px solid var(--ion-color-primary)',
                  paddingLeft: '16px',
                  marginLeft: '0',
                  marginBottom: '16px',
                  fontStyle: 'italic',
                  color: 'var(--ion-color-medium)'
                }}>
                  {children}
                </blockquote>
              ),
              strong: ({ children }) => (
                <strong style={{
                  fontWeight: 'bold',
                  color: 'var(--ion-color-dark)'
                }}>
                  {children}
                </strong>
              ),
              em: ({ children }) => (
                <em style={{
                  fontStyle: 'italic'
                }}>
                  {children}
                </em>
              ),
              hr: () => (
                <hr style={{
                  border: 'none',
                  borderTop: '1px solid var(--ion-color-light-shade)',
                  margin: '24px 0'
                }} />
              ),
              table: ({ children }) => (
                <div style={{ overflow: 'auto', marginBottom: '16px' }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    border: '1px solid var(--ion-color-light-shade)'
                  }}>
                    {children}
                  </table>
                </div>
              ),
              th: ({ children }) => (
                <th style={{
                  padding: '8px 12px',
                  backgroundColor: 'var(--ion-color-light)',
                  border: '1px solid var(--ion-color-light-shade)',
                  fontWeight: 'bold',
                  textAlign: 'left'
                }}>
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td style={{
                  padding: '8px 12px',
                  border: '1px solid var(--ion-color-light-shade)'
                }}>
                  {children}
                </td>
              ),
              a: ({ children, href }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: 'var(--ion-color-primary)',
                    textDecoration: 'underline'
                  }}
                >
                  {children}
                </a>
              )
            }}
          >
            {text}
          </ReactMarkdown>
        );
      case 'html':
        return (
          <div
            style={{ fontSize: '14px', lineHeight: '1.6' }}
            dangerouslySetInnerHTML={{ __html: text }}
          />
        );
      case 'plain':
      default:
        return (
          <div style={{
            whiteSpace: 'pre-wrap',
            lineHeight: '1.6',
            fontSize: '14px',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            {text}
          </div>
        );
    }
  };

  return (
    <div style={{ 
      padding: '16px', 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'auto'
    }}>
      {/* Title and description */}
      <div style={{ marginBottom: '16px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <h3 style={{ margin: '0', color: 'var(--ion-color-primary)', flex: 1 }}>
            {title || artifact.name}
          </h3>
          <span style={{
            backgroundColor: 'var(--ion-color-primary)',
            color: 'white',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            {artifact.type.toUpperCase()}
          </span>
        </div>
        {description && description.trim() && (
          <p style={{ 
            margin: '0', 
            color: 'var(--ion-color-medium)', 
            fontSize: '14px',
            lineHeight: '1.4'
          }}>
            {description}
          </p>
        )}
        {tags.length > 0 && (
          <div style={{ marginTop: '8px' }}>
            {tags.map((tag: string, index: number) => (
              <span
                key={index}
                style={{
                  display: 'inline-block',
                  backgroundColor: 'var(--ion-color-primary-tint)',
                  color: 'var(--ion-color-primary-contrast)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  marginRight: '6px',
                  marginBottom: '4px'
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      
      {/* Content */}
      <div style={{ 
        flex: 1, 
        overflow: 'auto',
        backgroundColor: content_type === 'markdown' ? '#ffffff' : 'var(--ion-color-light)',
        padding: content_type === 'markdown' ? (isPortrait ? '12px' : '16px') : '12px',
        borderRadius: '8px',
        border: '1px solid var(--ion-color-light-shade)',
        fontSize: '14px',
        lineHeight: '1.6'
      }}
      className="markdown-content"
      >
        <style>{`
          .markdown-content {
            /* Override any global styles that might interfere */
            box-sizing: border-box;
          }
          .markdown-content * {
            box-sizing: border-box;
          }
          /* Ensure proper spacing for first and last elements */
          .markdown-content > :first-child {
            margin-top: 0 !important;
          }
          .markdown-content > :last-child {
            margin-bottom: 0 !important;
          }
          /* Improve table styling */
          .markdown-content table {
            font-size: 14px;
            margin: 16px 0;
          }
          /* Code block improvements */
          .markdown-content pre {
            font-size: 13px;
            line-height: 1.4;
            tab-size: 2;
          }
          /* List improvements */
          .markdown-content ul ul,
          .markdown-content ol ol,
          .markdown-content ul ol,
          .markdown-content ol ul {
            margin-top: 4px;
            margin-bottom: 4px;
          }
        `}</style>
        {formatContent(content, content_type)}
      </div>
    </div>
  );
};

export default ArtifactTextRenderer;