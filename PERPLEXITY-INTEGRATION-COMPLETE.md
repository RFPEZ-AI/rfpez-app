# Perplexity AI Integration - Complete Implementation

## Overview
Successfully integrated Perplexity AI search and research capabilities into RFPEZ.AI, making four powerful tools available to all agents:
- **perplexity_search**: Direct web search with ranked results
- **perplexity_ask**: Conversational AI with real-time web search  
- **perplexity_research**: Deep comprehensive research
- **perplexity_reason**: Advanced reasoning and problem-solving

## Implementation Components

### 1. MCP Configuration (`.vscode/mcp.json`)
Added Perplexity MCP server configuration using the official `@perplexity-ai/mcp-server` package:
```json
"perplexity": {
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@perplexity-ai/mcp-server"],
  "env": {
    "PERPLEXITY_API_KEY": "${PERPLEXITY_API_KEY}",
    "PERPLEXITY_TIMEOUT_MS": "600000"
  }
}
```

### 2. Environment Configuration (`.env.local`)
Added Perplexity API key placeholder:
```bash
# Perplexity AI Configuration (for web search and research)
# Get your API key from: https://www.perplexity.ai/account/api/group
PERPLEXITY_API_KEY=your_perplexity_api_key_here
```

**ACTION REQUIRED**: Replace `your_perplexity_api_key_here` with your actual Perplexity API key.

### 3. Tool Implementation (`supabase/functions/claude-api-v3/tools/perplexity.ts`)
Created complete wrapper for all four Perplexity tools:
- Direct API calls to Perplexity endpoints
- Proper error handling and timeout management
- TypeScript interfaces for all parameters
- Comprehensive logging and debugging support
- 5-minute default timeout (configurable via environment variable)

### 4. Tool Definitions (`tools/definitions.ts`)
Added four new tool definitions with:
- Detailed descriptions for each tool's use case
- Complete input schemas with validation
- Enum constraints for recency filters
- Clear documentation of when to use each tool

### 5. Tool Execution Integration (`services/claude.ts`)
Added execution cases in the `executeTool` method:
- Type-safe parameter handling
- Tool invocation tracking for analytics
- Proper error propagation
- Consistent return type handling

### 6. Agent Instructions Updates
Updated two key agents with Perplexity capabilities:

**RFP Design Agent** (`Agent Instructions/RFP Design Agent.md`):
- Market research and pricing data
- Vendor information and supplier discovery
- Industry standards and specifications
- Product availability and trends

**Solutions Agent** (`Agent Instructions/Solutions Agent.md`):
- Competitive sourcing trends
- Procurement best practices
- RFP platform comparisons
- Industry-specific sourcing guidance

## Tool Usage Guide

### perplexity_search
**Best For**: Quick fact-finding and current information
```typescript
perplexity_search({
  query: "LED bulb wholesale suppliers USA",
  recency_filter: "month",  // Optional: day, week, month, year
  return_images: false,
  return_related_questions: true
})
```

**Returns**:
- `results`: Search results content
- `citations`: Source URLs
- `related_questions`: Suggested follow-up queries
- `images`: Relevant images (if requested)

### perplexity_ask
**Best For**: Conversational questions and quick answers
```typescript
perplexity_ask({
  query: "What are typical lead times for industrial LED bulbs?",
  search_recency_filter: "week"  // Optional
})
```

**Returns**:
- `answer`: Conversational response with sources
- `citations`: Source URLs

### perplexity_research
**Best For**: Deep analysis and comprehensive reports
```typescript
perplexity_research({
  query: "Compare energy efficiency standards for commercial LED lighting in North America",
  search_recency_filter: "month"  // Optional
})
```

**Returns**:
- `research_report`: Detailed analytical report
- `citations`: Source URLs

### perplexity_reason
**Best For**: Complex decision-making and trade-off analysis
```typescript
perplexity_reason({
  query: "Compare pros and cons of bulk vs just-in-time LED bulb purchasing for a 500-office deployment"
})
```

**Returns**:
- `reasoning`: Advanced analytical reasoning
- `citations`: Source URLs

## API Endpoints Used

All tools call the official Perplexity API:
- **Search API**: `https://api.perplexity.ai/search`
- **Chat Completions API**: `https://api.perplexity.ai/chat/completions`

Models used:
- `sonar-pro`: For perplexity_ask (conversational queries)
- `sonar-deep-research`: For perplexity_research (comprehensive analysis)
- `sonar-reasoning-pro`: For perplexity_reason (advanced reasoning)

## Deployment Steps

### Local Testing (CURRENT STEP)
1. ✅ **Add API Key**: Update `.env.local` with your Perplexity API key
2. **Test Tools**: Use the development server to test each tool
3. **Verify Integration**: Ensure all four tools work correctly with agents

### Remote Deployment (AFTER TESTING)
1. **Add Environment Variable**: Add `PERPLEXITY_API_KEY` to Supabase Edge Function secrets
2. **Deploy Edge Function**: Deploy `claude-api-v3` function with updated code
3. **Update Agent Instructions**: Deploy agent instruction updates via migrations
4. **Verify Production**: Test in production environment

## Testing Checklist

- [ ] Replace placeholder API key in `.env.local`
- [ ] Test `perplexity_search` with market research query
- [ ] Test `perplexity_ask` with product specification question
- [ ] Test `perplexity_research` with comprehensive analysis request
- [ ] Test `perplexity_reason` with decision-making scenario
- [ ] Verify error handling with invalid API key
- [ ] Verify timeout handling with complex queries
- [ ] Test integration with RFP Design agent
- [ ] Test integration with Solutions agent

## Example Test Queries

### RFP Design Agent
1. "Research current LED bulb wholesale pricing in the US market"
2. "Find suppliers for industrial-grade LED lighting"
3. "What are the standard specifications for commercial LED bulbs?"
4. "Compare options for LED bulb procurement: bulk vs just-in-time"

### Solutions Agent
1. "What are current trends in e-procurement platforms?"
2. "Compare RFP software solutions for mid-size companies"
3. "What are best practices for supplier evaluation in 2025?"
4. "How does EZRFP compare to other RFP management tools?"

## Configuration Reference

### Environment Variables
- `PERPLEXITY_API_KEY`: Your Perplexity API key (required)
- `PERPLEXITY_TIMEOUT_MS`: Request timeout in milliseconds (default: 300000 = 5 minutes)

### MCP Server
- Package: `@perplexity-ai/mcp-server`
- Installation: Automatic via `npx -y` on first use
- Documentation: https://github.com/perplexityai/modelcontextprotocol

### API Documentation
- Official Docs: https://docs.perplexity.ai/
- API Portal: https://www.perplexity.ai/account/api/group
- DeepWiki: https://deepwiki.com/ppl-ai/modelcontextprotocol

## Next Steps

1. **Immediate**: Add your Perplexity API key to `.env.local`
2. **Testing**: Follow the testing checklist above
3. **Deployment**: After successful local testing, deploy to production
4. **Documentation**: Update user-facing docs to mention research capabilities
5. **Analytics**: Monitor tool usage to understand which research features are most valuable

## Files Modified

### New Files
- `supabase/functions/claude-api-v3/tools/perplexity.ts` (363 lines)

### Modified Files
- `.vscode/mcp.json` - Added Perplexity MCP server configuration
- `.env.local` - Added PERPLEXITY_API_KEY environment variable
- `supabase/functions/claude-api-v3/tools/definitions.ts` - Added 4 tool definitions
- `supabase/functions/claude-api-v3/services/claude.ts` - Added 4 execution cases
- `Agent Instructions/RFP Design Agent.md` - Added Perplexity capabilities section
- `Agent Instructions/Solutions Agent.md` - Added Perplexity capabilities section

## Support

For issues or questions:
- Perplexity API: https://community.perplexity.ai/
- GitHub Issues: https://github.com/perplexityai/modelcontextprotocol/issues
- Internal: Check edge function logs for detailed error messages
