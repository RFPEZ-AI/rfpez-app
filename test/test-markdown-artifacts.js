// Text Artifact Markdown Demonstration
// This script demonstrates the enhanced markdown formatting in text artifacts

const sampleMarkdownContent = `# Enhanced Proposal Document

## Executive Summary
This **proposal** demonstrates the new *markdown formatting* capabilities of our text artifact system.

### Key Features
- **Bold text** for emphasis
- *Italic text* for subtle emphasis  
- \`inline code\` for technical terms
- [External links](https://example.com) that open in new tabs

### Technical Specifications

#### Code Blocks
\`\`\`javascript
function createTextArtifact(title, content) {
  return {
    id: generateId(),
    title,
    content,
    type: 'text',
    content_type: 'markdown'
  };
}
\`\`\`

#### Tables
| Feature | Status | Priority |
|---------|--------|----------|
| Markdown Rendering | ✅ Complete | High |
| Syntax Highlighting | ✅ Complete | High |
| Table Support | ✅ Complete | Medium |
| Link Handling | ✅ Complete | Medium |

### Quotation Support
> "The new markdown rendering provides a much better reading experience for proposal documents and technical specifications."
> 
> — Development Team

### Lists and Organization

#### Ordered Lists
1. **Phase 1**: Requirements gathering
2. **Phase 2**: Design and development
3. **Phase 3**: Testing and validation
4. **Phase 4**: Deployment and monitoring

#### Nested Lists
- **Frontend Development**
  - React components
  - TypeScript integration
  - Responsive design
- **Backend Development**
  - API endpoints
  - Database integration
  - Authentication
- **Testing**
  - Unit tests
  - Integration tests
  - User acceptance testing

### Technical Details

The implementation includes:

- **ReactMarkdown** with GitHub-flavored markdown support
- **Custom styling** that integrates with Ionic design system
- **Responsive layout** that works on all screen sizes
- **Proper spacing** and typography for readability

---

### Conclusion

This enhanced markdown support provides:

1. ✅ **Professional presentation** of proposal documents
2. ✅ **Rich formatting** without complex editing tools
3. ✅ **Consistent styling** across all text artifacts
4. ✅ **Improved readability** for technical content

*Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}*`;

// Demo function to show how to create a text artifact with markdown
async function createMarkdownDemo() {
  // This would be called by Claude to create a text artifact
  const textArtifact = {
    title: "Enhanced Markdown Proposal",
    content: sampleMarkdownContent,
    content_type: "markdown",
    description: "A demonstration of rich markdown formatting in text artifacts",
    tags: ["demo", "markdown", "proposal", "formatting"]
  };
  
  console.log("📝 Sample text artifact with markdown formatting:");
  console.log("Title:", textArtifact.title);
  console.log("Content Type:", textArtifact.content_type);
  console.log("Tags:", textArtifact.tags.join(", "));
  console.log("Content Length:", textArtifact.content.length, "characters");
  console.log("\nThe artifact will render with:");
  console.log("- Styled headings with proper hierarchy");
  console.log("- Bold and italic text formatting");
  console.log("- Syntax-highlighted code blocks");
  console.log("- Professional table layouts");
  console.log("- Styled blockquotes");
  console.log("- Properly formatted lists");
  console.log("- External links that open in new tabs");
  console.log("- Consistent spacing and typography");
  
  return textArtifact;
}

// How Claude would call this through the API
const claudeFunction = {
  function: "create_text_artifact",
  parameters: {
    title: "Enhanced Markdown Proposal",
    content: sampleMarkdownContent,
    content_type: "markdown",
    description: "A demonstration of rich markdown formatting in text artifacts",
    tags: ["demo", "markdown", "proposal", "formatting"]
  }
};

console.log("=== MARKDOWN TEXT ARTIFACT DEMO ===");
console.log("Claude can now create rich text artifacts using the create_text_artifact function:");
console.log(JSON.stringify(claudeFunction, null, 2));

// Run the demo
createMarkdownDemo().then(artifact => {
  console.log("\n✅ Demo completed successfully!");
  console.log("When this artifact is displayed in the app, it will show:");
  console.log("- Professional markdown rendering with proper typography");
  console.log("- Styled headings, lists, tables, and code blocks");
  console.log("- Responsive design that adapts to the artifact window");
  console.log("- Integration with Ionic's design system");
});

module.exports = { createMarkdownDemo, sampleMarkdownContent };