-- Knowledge Base: TMC-Specialist-Knowledge-Base
-- Generated on 2025-12-04T00:06:50.080Z
-- Source: TMC-Specialist-Knowledge-Base.md
-- Entries: 8
-- Agent: d6e83135-2b2d-47b7-91a0-5a3e138e7eb0 (UUID)

-- Insert knowledge base entries
-- TMC Service Categories (Detailed)
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  NULL, -- Global knowledge (not account-specific)
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmcspecialistknowledgebase_20251204000650$**Service Level Descriptions:**

**Online Booking Tool Only:**
- Self-service platform with minimal support
- Best for: Tech-savvy travelers, simple domestic travel
- Cost: Lowest (typically $0-5 per transaction)
- Support: Email/chat only, business hours

**Standard Service:**
- Online tools + phone agent access
- Best for: Mixed travel complexity, occasional support needs
- Cost: Mid-range ($8-15 per transaction)
- Support: Business hours phone, email response within 24 hours

**Full Service:**
- Dedicated travel counselors, proactive management
- Best for: Complex itineraries, international travel, policy enforcement
- Cost: Higher ($15-25 per transaction or management fee)
- Support: 24/7 phone, emergency assistance, dedicated account team

**VIP/Executive Service:**
- White-glove service for C-suite and executives
- Best for: Senior leadership, complex multi-leg trips, last-minute changes
- Cost: Premium ($30-50+ per transaction or dedicated counselor)
- Support: Personal travel counselor, concierge services, priority handling

**Key Performance Indicators:**
- **Cost savings**: 8-15% below benchmark (full service), 5-8% (online only)
- **Adoption rate**: 85-95% target for effective programs
- **Policy compliance**: 90%+ with automated enforcement
- **Booking fees**: $8-18 average for mixed service model
- **Customer satisfaction**: 4.0+ out of 5.0 target
- **Response time**: <30 min emergency, <4 hours standard changes

**Metadata:**
```json
{
  "knowledge_id": "tmc-service-categories",
  "category": "tmc-specialist",
  "importance": 0.85,
  "tags": ["tmc", "service-levels", "kpis", "pricing"]
}
```$kb_tmcspecialistknowledgebase_20251204000650$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-service-categories",
  "category": "tmc-specialist",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-service-categories'
);

-- TMC Requirements Gathering Questionnaire
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  NULL, -- Global knowledge (not account-specific)
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmcspecialistknowledgebase_20251204000650$**Travel Program Assessment Questions:**

1. **Current State:**
   - Annual travel spend (air, hotel, car, rail)?
   - Number of trips/bookings per year?
   - Current TMC or booking method?
   - What's working well vs. pain points?
   - Existing travel policy (attached or describe)?

2. **Traveler Profile:**
   - Total number of active travelers?
   - Traveler types: Frequent (>10 trips/year), Occasional (2-10), Rare (<2)?
   - Geographic distribution of travelers?
   - Domestic vs. international split (%)?
   - VIP/executive travelers requiring special handling?

3. **Booking Patterns:**
   - Preferred booking method: Online, phone agent, mobile app, combination?
   - Average advance booking window?
   - Typical trip length (days)?
   - Common destinations (top 10)?
   - Preferred airlines, hotel chains, car rental companies?
   - Existing loyalty programs to maintain?

4. **Service Requirements:**
   - Support hours needed: Business hours, extended hours, 24/7?
   - Languages required for traveler support?
   - Emergency assistance expectations?
   - Policy enforcement: Hard stop vs. soft warning vs. manager approval?
   - Approval workflow complexity (how many approval levels)?

5. **Technology & Integration:**
   - Current expense system: Concur, Expensify, SAP, Oracle, Workday, other?
   - HRIS system for traveler data: Workday, ADP, BambooHR, other?
   - Single sign-on (SSO) provider: Okta, Azure AD, other?
   - Reporting requirements: Monthly reports, ad-hoc analysis, data warehouse access?
   - Mobile app importance: Critical, nice-to-have, not needed?
   - API access needed for custom integrations?

6. **Financial Model:**
   - Preferred fee structure: Per-transaction, management fee, percentage of spend, hybrid?
   - Budget for TMC fees (annual)?
   - Savings target: X% below benchmark, $X annual savings?
   - Contract length preference: 1 year, 2 years, 3+ years?
   - Payment terms: Net 30, Net 60, credit card?
   - Invoice format: Itemized per booking, monthly summary, consolidated?

7. **Duty of Care & Risk:**
   - Traveler tracking requirements: Real-time location, itinerary-based?
   - Emergency assistance: 24/7 hotline, mobile app alerts, SMS?
   - Risk management: Travel alerts, country risk ratings, health advisories?
   - Crisis response expectations: Evacuation support, alternative routing?
   - Unused ticket tracking and utilization?
   - Travel insurance requirements?

8. **Compliance & Reporting:**
   - Regulatory requirements: Government travel, FCPA, SOX, other?
   - Carbon reporting: GHG emissions tracking, sustainability goals?
   - Diversity supplier preferences: Minority-owned, women-owned TMCs?
   - Data residency requirements: Data must stay in specific country/region?
   - Audit trail needs: Who booked, why, approvals, policy exceptions?

**Metadata:**
```json
{
  "knowledge_id": "tmc-requirements-gathering",
  "category": "tmc-specialist",
  "importance": 0.90,
  "tags": ["tmc", "requirements", "questionnaire", "discovery"]
}
```$kb_tmcspecialistknowledgebase_20251204000650$,
  NULL, -- Embedding will be generated later
  0.9,
  '{
  "knowledge_id": "tmc-requirements-gathering",
  "category": "tmc-specialist",
  "importance": 0.9,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-requirements-gathering'
);

-- TMC RFP Structure Templates
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  NULL, -- Global knowledge (not account-specific)
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmcspecialistknowledgebase_20251204000650$**Section 1: Executive Summary**
- Company overview (industry, size, locations)
- Travel program description (spend, volume, complexity)
- Current TMC relationship and contract end date
- Key challenges driving TMC selection
- Objectives and success criteria for new partnership
- Expected timeline for selection and implementation

**Section 2: Travel Program Profile**
- Annual travel spend by category (air $X, hotel $X, car $X, other $X)
- Transaction volume (X air tickets, X hotel nights, X car rentals)
- Traveler demographics:
  - Total travelers: X
  - Frequent travelers: X
  - VIP/executive travelers: X
  - International travelers: X
- Geographic scope (countries with regular travel)
- Typical trip profiles:
  - Domestic: X% of trips, avg X days, avg $X per trip
  - International: X% of trips, avg X days, avg $X per trip
- Preferred suppliers and loyalty programs
- Current adoption rate (if existing TMC): X%

**Section 3: Service Requirements**
- Booking channels:
  - Online booking tool: Required/Preferred/Not needed
  - Phone agents: 24/7 / Business hours / Occasional
  - Mobile app: Required/Preferred/Not needed
  - Email booking: Required/Preferred/Not needed
- Support model:
  - Dedicated account manager: Yes/No
  - Implementation support: Timeline and requirements
  - Ongoing training: Frequency and format
  - QBR frequency: Monthly/Quarterly/Semi-annual
- Policy enforcement:
  - Hard blocks for out-of-policy bookings: Yes/No
  - Soft warnings with override capability: Yes/No
  - Manager approval workflow: Describe levels
  - Preferred supplier steering: Automatic/Suggested/None
- VIP/executive service requirements (if applicable)

**Section 4: Technology Requirements**
- Online booking tool features:
  - Trip approval workflows
  - Unused ticket tracking
  - Fare comparison and lowest logical fare
  - Mobile-responsive design
  - Accessibility compliance (WCAG)
- Mobile app capabilities:
  - iOS and Android required
  - Offline itinerary access
  - Real-time flight alerts
  - Easy changes/cancellations
  - Expense receipt capture
- Integration requirements:
  - Expense system: [Name], version, integration type (API/SFTP/Manual)
  - HRIS: [Name], version, integration type
  - SSO: [Provider], SAML 2.0 required
  - Credit card program: [Provider], virtual card support
- Reporting and analytics:
  - Standard monthly reports required
  - Ad-hoc report access: Self-service portal/Request-based
  - Data warehouse access: Direct API/Data export
  - Dashboards: Executive summary, travel manager, traveler
  - KPI tracking: Savings, compliance, adoption, satisfaction

**Section 5: Duty of Care & Risk Management**
- Traveler tracking:
  - Real-time location services: Yes/No
  - Itinerary-based tracking: Yes/No
  - Privacy considerations and opt-out options
- Emergency assistance:
  - 24/7 hotline required
  - Average response time expectation: X minutes
  - Mobile app emergency button
  - SMS/email alerts for trip disruptions
- Risk management:
  - Travel alerts for destination risks
  - Country risk ratings and travel restrictions
  - Health advisory integration (CDC, WHO)
  - Weather and natural disaster alerts
- Crisis response:
  - Evacuation coordination and support
  - Alternative routing and rebooking
  - Communication with HR/Security teams
  - After-hours emergency contact escalation
- Unused ticket management:
  - Automatic tracking of unused tickets
  - Proactive alerts for expiring tickets
  - Rebooking assistance for credit utilization

**Section 6: Financial & Pricing**
- Fee structure preferences:
  - Per-transaction fees (specify by transaction type)
  - Management fees (monthly/annual retainer)
  - Percentage of spend model
  - Hybrid model (combination)
- Savings methodology:
  - Benchmark source and calculation
  - Guaranteed savings vs. best-effort
  - Preferred supplier discounts and rebates
  - Negotiated rate programs
- Implementation costs:
  - One-time setup fees
  - Training costs
  - Integration fees
  - Data migration costs
- Contract terms:
  - Initial contract length: X years
  - Auto-renewal: Yes/No, notice period
  - Early termination: Conditions and penalties
  - Price escalation: Cap at X% per year
- Payment terms:
  - Invoice frequency: Weekly/Monthly
  - Payment terms: Net 30/Net 60
  - Credit card acceptance for fees
  - Currency preferences (if multi-country)

**Section 7: Vendor Qualifications**
- TMC background:
  - Years in business
  - Ownership structure (public/private, parent company)
  - Financial stability (credit rating, revenue)
  - Industry certifications (IATA, ARC, etc.)
- Experience:
  - Similar-sized client examples
  - Industry expertise relevant to buyer
  - Geographic coverage (countries with offices)
  - Languages supported
- Technology:
  - Owned vs. white-label booking platform
  - Technology roadmap and innovation plans
  - Uptime guarantee and disaster recovery
  - Cybersecurity certifications (SOC 2, ISO 27001)
- Account management:
  - Account manager qualifications
  - Implementation team structure
  - Average tenure of account managers
  - Client retention rate
- References:
  - 3-5 similar client references required
  - Include: Company name, contact, years as client, program size
  - Permission to contact for reference calls

**Section 8: Evaluation Criteria**
- **Cost & Savings (30-35%):**
  - Total 3-year cost of ownership
  - Transaction fees competitiveness
  - Negotiated rate savings potential
  - Implementation costs
- **Technology & User Experience (25-30%):**
  - Booking tool usability (demo evaluation)
  - Mobile app functionality
  - Integration capabilities
  - Reporting and analytics
- **Service Quality (20-25%):**
  - SLA commitments and penalties
  - Account management structure
  - 24/7 support model
  - Client satisfaction scores
- **Implementation & Transition (10-15%):**
  - Implementation timeline and plan
  - Training approach and resources
  - Data migration capabilities
  - Change management support
- **Innovation & Partnership (5-10%):**
  - Technology roadmap
  - Strategic partnership approach
  - Industry thought leadership
  - Continuous improvement process

**Metadata:**
```json
{
  "knowledge_id": "tmc-rfp-structure",
  "category": "tmc-specialist",
  "importance": 0.88,
  "tags": ["tmc", "rfp-structure", "sections", "templates"]
}
```$kb_tmcspecialistknowledgebase_20251204000650$,
  NULL, -- Embedding will be generated later
  0.88,
  '{
  "knowledge_id": "tmc-rfp-structure",
  "category": "tmc-specialist",
  "importance": 0.88,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-rfp-structure'
);

-- TMC Conversation Patterns & Scenarios
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  NULL, -- Global knowledge (not account-specific)
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmcspecialistknowledgebase_20251204000650$**Scenario 1: First-Time TMC Buyer**

**User:** "We spend about $2M annually on travel but have no TMC. Employees book direct and we have no visibility or control."

**Response Pattern:**
"Starting a TMC program is a great move for gaining visibility and savings. Let's establish your baseline:

First, help me understand your current booking landscape:
- How many employees travel regularly?
- What's your mix of air, hotel, and car rental spend?
- Do you have a travel policy today (even informal)?
- What's your biggest pain point: cost control, policy compliance, or traveler experience?

[We have about 150 travelers](prompt:complete)
[No formal travel policy yet](prompt:complete)
[Biggest issue is lack of visibility into spend](prompt:complete)
[Tell me typical TMC fees for our size](prompt:complete)"

**Follow-up Discovery:**
- Adoption expectations and change management readiness
- Technology preferences (self-service vs. agent support)
- Budget for TMC fees (typical 1-2% of spend for full service)
- Timeline for implementation (typically 60-90 days)

**Key Considerations for First-Timers:**
- Start with standard service, can upgrade later
- Focus on adoption strategy and training
- Simple travel policy initially, refine over time
- Set realistic savings expectations (5-10% year 1)$kb_tmcspecialistknowledgebase_20251204000650$,
  NULL, -- Embedding will be generated later
  0.85,
  '{
  "knowledge_id": "tmc-conversation-patterns",
  "category": "tmc-specialist",
  "importance": 0.85,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-conversation-patterns'
);

-- TMC Handoff Process
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  NULL, -- Global knowledge (not account-specific)
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmcspecialistknowledgebase_20251204000650$**Handoff Trigger Detection:**

**COMPLETE Package (Bid Form + Email Letter):**
```
✨ Your TMC RFP package is complete! You have:
- TMC Supplier Bid Form (comprehensive requirements)
- TMC RFP Request Email (vendor outreach template)

**Next Stage:** Vendor selection and tender management

The TMC Tender agent will help you:
✅ Identify and select qualified TMC vendors
✅ Distribute RFP and manage vendor communications
✅ Track bid submissions and coordinate Q&A
✅ Evaluate proposals against your criteria
✅ Support your award decision

[Switch to TMC Tender agent](prompt:complete) to start the tender process
[Review the bid form one more time](prompt:complete)
[I need to modify some requirements](prompt:complete)
[Tell me about the tender process](prompt:complete)
```

**PARTIAL Package (Questionnaire Only):**
```
Great progress! We've captured your TMC requirements.

Next step: Transform this into a complete RFP package with:
- Supplier bid form (structured requirements for vendor responses)
- Email template (professional RFP distribution letter)

[Create supplier bid form and email letter](prompt:complete)
[I want to review requirements first](prompt:complete)
[Add more requirements before creating package](prompt:complete)
```

**Handoff Context to Provide:**

When switching to TMC Tender, include:
- RFP name/title
- Key requirements summary (spend, travelers, must-haves)
- Timeline expectations if discussed
- Budget constraints if mentioned
- Geographic scope
- Preferred TMC service level (online tool, full service, VIP)

**Return Handoff (TMC Tender → TMC Specialist):**

If buyer needs RFP revisions during tender:
```
I see you need to revise TMC requirements. Let me connect you with the TMC Specialist.

[Switch to TMC Specialist](prompt:complete) to modify RFP content
[Continue with current requirements](prompt:complete)
```

**Context TMC Specialist receives:**
- What needs revision (service requirements, evaluation criteria, pricing, etc.)
- Why revision needed (vendor feedback, stakeholder input, budget change)
- Tender status (not yet issued, issued with deadline, bids received)

**Cross-Agent Coordination:**

TMC Specialist should be aware of:
- Tender process has specific timelines
- RFP revisions after distribution require addendum process
- Major changes may require deadline extension
- TMC Tender handles all vendor communications during active tender

**Metadata:**
```json
{
  "knowledge_id": "tmc-handoff-process",
  "category": "tmc-specialist",
  "importance": 0.90,
  "tags": ["tmc", "handoff", "transitions", "tender-agent"]
}
```$kb_tmcspecialistknowledgebase_20251204000650$,
  NULL, -- Embedding will be generated later
  0.9,
  '{
  "knowledge_id": "tmc-handoff-process",
  "category": "tmc-specialist",
  "importance": 0.9,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-handoff-process'
);

-- TMC Pricing Models Explained
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  NULL, -- Global knowledge (not account-specific)
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmcspecialistknowledgebase_20251204000650$**TMC Fee Structures:**

**1. Per-Transaction Model:**
- Fee charged for each booking (air ticket, hotel night, car rental)
- **Typical Ranges:**
  - Online booking only: $0-8 per transaction
  - Agent-assisted: $15-35 per transaction
  - International: +$10-20 premium
  - VIP/executive: $30-60+ per transaction
- **Pros:** Pay only for what you use, predictable per-booking cost, easy to understand
- **Cons:** Can be expensive for high-volume programs, fees add up quickly
- **Best for:** Mid-volume programs (500-5,000 transactions/year), predictable travel patterns

**2. Management Fee Model:**
- Monthly or annual retainer regardless of transaction volume
- **Typical Ranges:**
  - Small programs (<$2M spend): $3K-8K/month
  - Mid programs ($2M-10M spend): $8K-20K/month
  - Large programs ($10M+ spend): $20K-50K+/month
- **Pros:** Predictable budgeting, no penalty for high volume, includes strategic consulting
- **Cons:** Pay even during low-travel periods, needs volume to be cost-effective
- **Best for:** High-volume programs (5,000+ transactions/year), stable travel patterns

**3. Percentage of Spend Model:**
- Fee as percentage of total travel spend (typically 1-3%)
- **Typical Ranges:**
  - Full service: 1.5-2.5% of spend
  - Standard service: 1.0-1.5% of spend
  - Online tool only: 0.5-1.0% of spend
- **Pros:** Scales with business, aligns TMC incentives with cost control
- **Cons:** TMC benefits from higher spending, may not incentivize savings
- **Best for:** Variable spend patterns, rapid growth companies

**4. Hybrid Model:**
- Combination of management fee + reduced per-transaction fees
- **Example:** $5K/month + $5 per transaction (vs. $18 transaction-only)
- **Pros:** Balances predictability and usage-based, can be most cost-effective
- **Cons:** More complex to budget and understand, requires negotiation
- **Best for:** Programs wanting service commitment with volume flexibility

**Cost Comparison Example ($5M annual spend, 3,500 transactions/year):**

| Model | Calculation | Annual Cost | Notes |
|-------|-------------|-------------|-------|
| Per-transaction ($18) | 3,500 × $18 | $63,000 | Standard agent-assisted rate |
| Management fee | $12K/month × 12 | $144,000 | Includes consulting, higher service |
| Percentage (1.5%) | $5M × 1.5% | $75,000 | Scales with spend |
| Hybrid ($6K + $8) | ($6K × 12) + (3,500 × $8) | $100,000 | Balanced approach |

**Additional Costs to Consider:**
- **Implementation fees:** $10K-50K one-time (may be waived)
- **Training costs:** Often included, or $1K-5K
- **Technology fees:** Online booking tool access, mobile app, API usage
- **Integration fees:** Expense system, HRIS integration setup
- **Reporting fees:** Custom reports, data warehouse access (often included)
- **After-hours fees:** Premium for 24/7 support (built into pricing or separate)

**Savings Methodology:**
- **Benchmark-based:** Compare actual spend vs. industry benchmark
- **Pre/post comparison:** Savings vs. pre-TMC spending patterns
- **Lowest logical fare:** Savings by booking better fares within policy
- **Unused ticket management:** Recovered value from unused tickets
- **Negotiated rates:** Discounts from preferred suppliers

**Typical Savings Expectations:**
- **First year:** 5-12% below benchmark (includes implementation impact)
- **Steady state:** 8-15% below benchmark (full adoption, optimized policy)
- **Advanced programs:** 12-18% below benchmark (strong negotiated rates, high compliance)

**Red Flags in TMC Pricing:**
- Guaranteed savings that seem too good (>20% without specifics)
- Hidden fees not disclosed upfront
- Transaction fees that vary unpredictably
- No SLA penalty structure for poor service
- Unclear definition of "transaction" (is change/cancel separate?)
- Technology fees that escalate significantly year-over-year

**Metadata:**
```json
{
  "knowledge_id": "tmc-pricing-models",
  "category": "tmc-specialist",
  "importance": 0.87,
  "tags": ["tmc", "pricing", "fees", "cost-comparison"]
}
```$kb_tmcspecialistknowledgebase_20251204000650$,
  NULL, -- Embedding will be generated later
  0.87,
  '{
  "knowledge_id": "tmc-pricing-models",
  "category": "tmc-specialist",
  "importance": 0.87,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-pricing-models'
);

-- TMC Technology Requirements
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  NULL, -- Global knowledge (not account-specific)
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmcspecialistknowledgebase_20251204000650$**Online Booking Tool Requirements:**

**Core Functionality:**
- Air, hotel, car rental, rail booking in single tool
- Lowest logical fare display with options
- Policy enforcement (hard block, soft warning, or approval required)
- Unused ticket tracking and alert
- Traveler profiles with preferences (aisle seat, Marriott Rewards #, etc.)
- Trip approval workflows (pre-trip and expense)
- Mobile-responsive design (not just mobile app)
- Accessibility compliance (WCAG 2.1 AA minimum)

**User Experience:**
- Search speed: Results in <3 seconds
- Intuitive interface: Minimal training required for occasional travelers
- Comparison shopping: Side-by-side flight/hotel options
- Flexible search: +/- days, alternate airports, multi-city
- Visual indicators: Preferred suppliers, out-of-policy warnings
- One-click rebooking for frequent travelers
- Saved trip templates for common routes

**Advanced Features:**
- AI-powered recommendations based on traveler preferences
- Fare alerts: Price drops for upcoming trips
- Ancillary upsells: Seat selection, Wi-Fi, baggage within booking flow
- Social features: Colleague travel visibility for meeting coordination
- Carbon footprint display per trip option
- Traveler reviews/ratings of hotels and airlines

**Integration Capabilities:**
- **Expense Systems:** Concur, Expensify, Chrome River, SAP, Oracle
  - Real-time booking data sync (no manual entry)
  - Receipt/e-ticket automatic attachment
  - Per diem calculation based on trip location
  - Split billing for personal vs. business travel
- **HRIS Systems:** Workday, ADP, BambooHR, UltiPro
  - Automatic new hire provisioning
  - Termination access removal
  - Cost center and org hierarchy sync
  - Manager approval routing
- **SSO Providers:** Okta, Azure AD, Ping Identity, OneLogin
  - SAML 2.0 support required
  - Multi-factor authentication (MFA)
  - Just-in-time (JIT) provisioning
- **Calendar Integration:** Outlook, Google Calendar, iCal
  - Automatic itinerary addition to calendar
  - Meeting invite reconciliation with travel plans
- **Credit Card Programs:** Virtual cards, corporate card integration
  - Automatic card number generation for bookings
  - Spend limit enforcement
  - Transaction coding for reconciliation

**Mobile App Requirements:**

**Must-Have Features:**
- iOS (latest 2 versions) and Android (latest 2 versions)
- Offline itinerary access (no connectivity needed)
- Real-time flight status and gate changes
- Push notifications for trip alerts
- Easy changes/cancellations with agent chat
- Expense receipt capture with OCR
- Maps and directions to hotel/meeting
- Traveler location sharing (duty of care)

**Nice-to-Have Features:**
- Voice commands for hands-free booking
- Augmented reality (AR) airport navigation
- In-app messaging with travel counselor
- Loyalty program balance display
- Same-day change optimization
- Hotel room upgrade requests
- Ground transportation booking (Uber/Lyft integration)

**Reporting & Analytics:**

**Standard Reports (Monthly):**
- **Spend Summary:** Total spend by category (air, hotel, car), cost center, traveler
- **Transaction Volume:** Bookings by type, booking channel (online vs. phone)
- **Savings Report:** Actual vs. benchmark, lowest logical fare compliance
- **Policy Compliance:** Out-of-policy rate, most common violations, waiver trends
- **Adoption Report:** % travelers using TMC, online vs. agent booking ratio
- **Supplier Performance:** On-time performance, service issues, traveler ratings
- **Unused Tickets:** Open tickets, expiring soon, recovered value

**Ad-Hoc Analysis Capabilities:**
- Self-service report builder (drag-and-drop)
- Custom date ranges and filters
- Export to Excel, PDF, CSV
- Schedule automated report delivery
- Drill-down from summary to transaction detail

**Advanced Analytics:**
- **Predictive Modeling:** Forecast future spend based on historical patterns
- **Benchmarking:** Compare to industry peers by size, industry, geography
- **Carbon Footprint:** GHG emissions by trip, traveler, route
- **Route Analysis:** Most expensive routes, opportunities for negotiation
- **Traveler Behavior:** Advance purchase patterns, booking channel preferences
- **Savings Opportunities:** Alternate airports, flexible dates, policy adjustments

**Data Warehouse Access:**
- Direct API for BI tools (Tableau, Power BI, Looker)
- Data export (full historical extract)
- Real-time data feeds vs. batch (daily, weekly)
- Data dictionary and schema documentation

**Technology Uptime & Support:**
- **SLA Targets:**
  - Booking tool uptime: 99.5%+ (max 4 hours downtime/month)
  - Mobile app uptime: 99.0%+
  - API availability: 99.9%+
  - Planned maintenance windows: Off-peak hours, advance notice
- **Disaster Recovery:**
  - Recovery time objective (RTO): <4 hours
  - Recovery point objective (RPO): <1 hour
  - Geographic redundancy (multiple data centers)
  - Regular DR testing and reporting
- **Cybersecurity:**
  - SOC 2 Type II certification required
  - ISO 27001 compliance
  - PCI DSS for payment card data
  - Regular penetration testing (annual minimum)
  - Vulnerability scanning and patching (monthly)
  - Encryption: TLS 1.2+ in transit, AES-256 at rest
  - Data privacy: GDPR, CCPA compliance

**Technology Roadmap:**
- Request 12-24 month product roadmap
- Assess investment in R&D (% of revenue)
- Customer advisory board participation
- Beta program access for new features
- Technology refresh cycle (how often major updates)

**Metadata:**
```json
{
  "knowledge_id": "tmc-technology-requirements",
  "category": "tmc-specialist",
  "importance": 0.86,
  "tags": ["tmc", "technology", "integrations", "booking-tool", "mobile-app"]
}
```$kb_tmcspecialistknowledgebase_20251204000650$,
  NULL, -- Embedding will be generated later
  0.86,
  '{
  "knowledge_id": "tmc-technology-requirements",
  "category": "tmc-specialist",
  "importance": 0.86,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-technology-requirements'
);

-- TMC Evaluation Criteria & Scoring
INSERT INTO account_memories (
  account_id,
  user_id,
  memory_type,
  content,
  embedding,
  importance_score,
  metadata
)
SELECT 
  NULL, -- Global knowledge (not account-specific)
  NULL, -- System knowledge (no specific user)
  'knowledge',
  $kb_tmcspecialistknowledgebase_20251204000650$**Evaluation Framework:**

**Category 1: Cost & Savings (30-35% weight)**

**Subcriteria:**
1. **Total Cost of Ownership (40% of category)**
   - 3-year projected cost (fees + implementation + technology)
   - Transaction fee competitiveness vs. market
   - Management fee value (if applicable)
   - Scoring: Lowest cost = 100 pts, others pro-rated

2. **Savings Potential (35% of category)**
   - Methodology clarity and credibility
   - Negotiated rate programs offered
   - Historical savings delivery (references)
   - Unused ticket management capability
   - Scoring: Most credible savings = 100 pts, qualitative assessment

3. **Implementation Costs (15% of category)**
   - One-time setup fees
   - Training and change management included
   - Integration costs (expense, HRIS, SSO)
   - Data migration costs
   - Scoring: $0 = 100 pts, >$50K = 0 pts, linear scale

4. **Pricing Transparency (10% of category)**
   - Clear fee structure with no hidden costs
   - Predictable cost escalation (max % per year)
   - Technology fees included vs. separate
   - Scoring: Fully transparent = 100 pts, unclear = 0 pts

**Category 2: Technology & User Experience (25-30% weight)**

**Subcriteria:**
1. **Booking Tool Usability (30% of category)**
   - Demo evaluation (travel manager + traveler perspective)
   - Search speed and accuracy
   - Interface intuitiveness (minimal clicks to book)
   - Visual design and modern feel
   - Scoring: Live demo scoring by evaluation team

2. **Mobile App Functionality (25% of category)**
   - iOS and Android feature parity
   - Offline itinerary access
   - Real-time alerts and notifications
   - Ease of changes/cancellations
   - User ratings in app stores
   - Scoring: App store rating (weighted 40%) + demo (60%)

3. **Integration Capabilities (25% of category)**
   - Expense system integration depth
   - HRIS integration for provisioning
   - SSO support (SAML 2.0)
   - Calendar integration
   - API availability for custom integrations
   - Scoring: All integrations native = 100 pts, manual = 0 pts

4. **Reporting & Analytics (20% of category)**
   - Standard reports comprehensiveness
   - Ad-hoc report builder capabilities
   - Data warehouse access
   - Advanced analytics (predictive, benchmarking)
   - Carbon footprint tracking
   - Scoring: Self-service + advanced analytics = 100 pts, basic only = 40 pts

**Category 3: Service Quality (20-25% weight)**

**Subcriteria:**
1. **SLA Commitments (30% of category)**
   - Booking tool uptime guarantee (99.5%+ target)
   - Response time commitments (emergency, standard)
   - Financial penalties for SLA misses
   - Scoring: 99.9% uptime + penalties = 100 pts, 99.0% no penalties = 40 pts

2. **Account Management (25% of category)**
   - Dedicated account manager (yes/no)
   - Account manager seniority and experience
   - Quarterly business review commitment
   - Implementation team structure
   - Average account manager tenure
   - Scoring: Dedicated senior AM + QBR = 100 pts, shared/junior = 50 pts

3. **Traveler Support Model (25% of category)**
   - 24/7 phone support availability
   - Average hold time and response time
   - Phone, email, chat channel options
   - Language support (specify languages)
   - Call center location and agents (US-based, offshore, mixed)
   - Scoring: 24/7 all channels + <2 min hold = 100 pts, business hours only = 40 pts

4. **Client Satisfaction (20% of category)**
   - NPS or CSAT scores from references
   - Client retention rate (>90% target)
   - Online reviews and ratings
   - Industry awards and recognition
   - Scoring: NPS 50+ or CSAT 4.5+ = 100 pts, below 4.0 = 50 pts

**Category 4: Implementation & Transition (10-15% weight)**

**Subcriteria:**
1. **Implementation Timeline (35% of category)**
   - Proposed go-live date
   - Phased rollout plan (pilot, then full deployment)
   - Buffer for testing and user acceptance
   - Scoring: 60-day timeline = 100 pts, >120 days = 50 pts

2. **Training & Change Management (35% of category)**
   - Training plan (online, in-person, train-the-trainer)
   - Training materials quality (videos, guides, FAQs)
   - Change management support (communications, adoption tracking)
   - Traveler support during transition (extra hours, resources)
   - Scoring: Comprehensive plan + dedicated support = 100 pts, basic = 50 pts

3. **Data Migration (20% of category)**
   - Traveler profile migration from current TMC
   - Historical data import (1-3 years)
   - Unused ticket import and tracking
   - Preferred supplier program setup
   - Scoring: Automated migration all data = 100 pts, manual = 40 pts

4. **Risk Mitigation (10% of category)**
   - Contingency plans for delays
   - Overlap period with current TMC (if needed)
   - Rollback plan if critical issues
   - Dedicated implementation resources
   - Scoring: Detailed risk plan = 100 pts, minimal = 50 pts

**Category 5: Innovation & Strategic Partnership (5-10% weight)**

**Subcriteria:**
1. **Technology Roadmap (40% of category)**
   - 12-24 month product roadmap
   - R&D investment (% of revenue)
   - AI/ML capabilities (current and planned)
   - Beta program access for clients
   - Scoring: Clear roadmap + high R&D investment = 100 pts, vague = 50 pts

2. **Industry Thought Leadership (30% of category)**
   - White papers, research, webinars
   - Speaking at industry conferences
   - Best practice sharing and benchmarking
   - Scoring: Active thought leader = 100 pts, minimal = 60 pts

3. **Continuous Improvement (30% of category)**
   - Regular product updates and releases
   - Customer advisory board
   - Feedback loop and responsiveness
   - Innovation examples from current clients
   - Scoring: Quarterly releases + advisory board = 100 pts, annual updates = 60 pts

**Scoring Methodology:**

**Step 1: Score Each Subcriterion (0-100 points)**
- Evaluate each vendor against defined scoring rubric
- Use demo evaluations, reference checks, proposal content
- Document rationale for each score

**Step 2: Calculate Category Scores**
- Multiply subcriterion score by its weight within category
- Sum weighted subcriteria to get category score (0-100)

**Step 3: Calculate Overall Score**
- Multiply category score by its overall weight
- Sum weighted categories to get total score (0-100)

**Example Calculation:**

| Category | Weight | Vendor A Score | Vendor B Score |
|----------|--------|----------------|----------------|
| Cost & Savings | 35% | 85 | 92 |
| Technology & UX | 30% | 92 | 78 |
| Service Quality | 20% | 88 | 85 |
| Implementation | 10% | 90 | 88 |
| Innovation | 5% | 85 | 82 |
| **Total** | **100%** | **88.4** | **85.3** |

**Step 4: Sensitivity Analysis**
- Test impact of changing category weights
- Identify close scores requiring deeper evaluation
- Consider qualitative factors (culture fit, strategic alignment)

**Step 5: Finalist Selection**
- Typically select top 2-3 vendors for:
  - In-depth demos (2-3 hours with multiple user personas)
  - Reference calls (3-5 references per vendor)
  - Best and Final Offer (BAFO) round if needed

**Red Flags in Evaluation:**
- Vendor scores high on cost but very low on service (may under-deliver)
- Vendor avoids specific SLA commitments or penalties
- References are all small/dissimilar clients
- Technology is white-label with limited control
- Implementation timeline seems rushed for complexity
- Unwilling to participate in finalist demos or BAFO

**Metadata:**
```json
{
  "knowledge_id": "tmc-evaluation-criteria",
  "category": "tmc-specialist",
  "importance": 0.89,
  "tags": ["tmc", "evaluation", "scoring", "vendor-selection"]
}
```$kb_tmcspecialistknowledgebase_20251204000650$,
  NULL, -- Embedding will be generated later
  0.89,
  '{
  "knowledge_id": "tmc-evaluation-criteria",
  "category": "tmc-specialist",
  "importance": 0.89,
  "tags": []
}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM account_memories 
  WHERE metadata->>'knowledge_id' = 'tmc-evaluation-criteria'
);

-- Verify insertions
SELECT 
  memory_type,
  metadata->>'knowledge_id' as knowledge_id,
  metadata->>'category' as category,
  LEFT(content, 100) as content_preview,
  importance_score,
  created_at
FROM account_memories
WHERE memory_type = 'knowledge'
  AND metadata->>'knowledge_id' IN ('tmc-service-categories', 'tmc-requirements-gathering', 'tmc-rfp-structure', 'tmc-conversation-patterns', 'tmc-handoff-process', 'tmc-pricing-models', 'tmc-technology-requirements', 'tmc-evaluation-criteria')
ORDER BY importance_score DESC;

-- Summary
SELECT 
  COUNT(*) as total_knowledge_entries,
  AVG(importance_score) as avg_importance,
  MAX(importance_score) as max_importance
FROM account_memories
WHERE memory_type = 'knowledge';
