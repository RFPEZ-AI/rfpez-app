/**
 * Test script for dev.rfpez.ai deployment
 * Tests complete RFP workflow: specification, bid form, RFP email, and supplier bids
 * 
 * Usage: Run this with Chrome MCP browser tools
 */

const TEST_CONFIG = {
  baseUrl: 'https://dev.rfpez.ai',
  testUser: {
    email: 'mskiba@esphere.com',
    password: 'thisisatest'
  },
  rfpScenario: {
    name: 'Office Furniture Procurement',
    description: 'Complete office furniture set for new 50-person office space',
    specifications: {
      items: [
        'Executive desks (10 units)',
        'Standard workstations (40 units)',
        'Conference tables (3 units)',
        'Office chairs - ergonomic (50 units)',
        'Filing cabinets (15 units)'
      ],
      requirements: [
        'BIFMA certified furniture',
        'Warranty minimum 5 years',
        'Delivery within 6 weeks',
        'Installation included'
      ]
    },
    suppliers: [
      {
        name: 'Premier Office Solutions',
        bidAmount: 125000,
        deliveryTime: '4 weeks',
        warranty: '7 years',
        notes: 'Includes white-glove installation and 2-year maintenance'
      },
      {
        name: 'Corporate Workspace Inc',
        bidAmount: 118000,
        deliveryTime: '5 weeks',
        warranty: '5 years',
        notes: 'Volume discount applied, standard installation included'
      },
      {
        name: 'Modern Office Outfitters',
        bidAmount: 135000,
        deliveryTime: '3 weeks',
        warranty: '10 years',
        notes: 'Premium furniture line, expedited delivery, extended warranty'
      }
    ]
  }
};

/**
 * Test workflow steps
 */
const TEST_STEPS = [
  {
    step: 1,
    name: 'Navigate to dev.rfpez.ai',
    action: 'navigate',
    url: TEST_CONFIG.baseUrl
  },
  {
    step: 2,
    name: 'Take initial screenshot',
    action: 'screenshot',
    filename: '01-homepage'
  },
  {
    step: 3,
    name: 'Click login button',
    action: 'click',
    selector: '[data-testid="login-button"]'
  },
  {
    step: 4,
    name: 'Fill email',
    action: 'fill',
    selector: 'input[type="email"]',
    value: TEST_CONFIG.testUser.email
  },
  {
    step: 5,
    name: 'Fill password',
    action: 'fill',
    selector: 'input[type="password"]',
    value: TEST_CONFIG.testUser.password
  },
  {
    step: 6,
    name: 'Submit login',
    action: 'keyboard',
    selector: 'input[type="password"]',
    keys: 'Enter'
  },
  {
    step: 7,
    name: 'Wait for login and screenshot',
    action: 'screenshot',
    filename: '02-logged-in'
  },
  {
    step: 8,
    name: 'Create new session',
    action: 'click',
    selector: '[data-testid="new-session-button"]'
  },
  {
    step: 9,
    name: 'Screenshot new session',
    action: 'screenshot',
    filename: '03-new-session'
  },
  {
    step: 10,
    name: 'Request RFP creation',
    action: 'fill',
    selector: '[data-testid="message-input"]',
    value: `Create a new RFP for ${TEST_CONFIG.rfpScenario.name}. ${TEST_CONFIG.rfpScenario.description}`
  },
  {
    step: 11,
    name: 'Submit RFP creation message',
    action: 'keyboard',
    selector: '[data-testid="message-input"]',
    keys: 'Enter'
  },
  {
    step: 12,
    name: 'Wait for RFP creation response',
    action: 'wait',
    duration: 5000
  },
  {
    step: 13,
    name: 'Screenshot RFP created',
    action: 'screenshot',
    filename: '04-rfp-created',
    fullPage: true
  },
  {
    step: 14,
    name: 'Request technical specifications',
    action: 'fill',
    selector: '[data-testid="message-input"]',
    value: `Generate detailed technical specifications including: ${TEST_CONFIG.rfpScenario.specifications.items.join(', ')}. Requirements: ${TEST_CONFIG.rfpScenario.specifications.requirements.join(', ')}`
  },
  {
    step: 15,
    name: 'Submit specifications request',
    action: 'keyboard',
    selector: '[data-testid="message-input"]',
    keys: 'Enter'
  },
  {
    step: 16,
    name: 'Wait for specifications',
    action: 'wait',
    duration: 8000
  },
  {
    step: 17,
    name: 'Screenshot specifications',
    action: 'screenshot',
    filename: '05-specifications-generated',
    fullPage: true
  },
  {
    step: 18,
    name: 'Request bid form',
    action: 'fill',
    selector: '[data-testid="message-input"]',
    value: 'Create a bid submission form for suppliers to respond to this RFP'
  },
  {
    step: 19,
    name: 'Submit bid form request',
    action: 'keyboard',
    selector: '[data-testid="message-input"]',
    keys: 'Enter'
  },
  {
    step: 20,
    name: 'Wait for bid form',
    action: 'wait',
    duration: 6000
  },
  {
    step: 21,
    name: 'Screenshot bid form',
    action: 'screenshot',
    filename: '06-bid-form-created',
    fullPage: true
  },
  {
    step: 22,
    name: 'Request RFP email',
    action: 'fill',
    selector: '[data-testid="message-input"]',
    value: 'Generate an RFP announcement email to send to potential suppliers'
  },
  {
    step: 23,
    name: 'Submit RFP email request',
    action: 'keyboard',
    selector: '[data-testid="message-input"]',
    keys: 'Enter'
  },
  {
    step: 24,
    name: 'Wait for RFP email',
    action: 'wait',
    duration: 5000
  },
  {
    step: 25,
    name: 'Screenshot RFP email',
    action: 'screenshot',
    filename: '07-rfp-email-generated',
    fullPage: true
  },
  // Add first supplier bid
  {
    step: 26,
    name: 'Add first supplier bid',
    action: 'fill',
    selector: '[data-testid="message-input"]',
    value: `Record a bid from ${TEST_CONFIG.rfpScenario.suppliers[0].name}: Total bid $${TEST_CONFIG.rfpScenario.suppliers[0].bidAmount}, Delivery: ${TEST_CONFIG.rfpScenario.suppliers[0].deliveryTime}, Warranty: ${TEST_CONFIG.rfpScenario.suppliers[0].warranty}. Notes: ${TEST_CONFIG.rfpScenario.suppliers[0].notes}`
  },
  {
    step: 27,
    name: 'Submit first bid',
    action: 'keyboard',
    selector: '[data-testid="message-input"]',
    keys: 'Enter'
  },
  {
    step: 28,
    name: 'Wait for bid processing',
    action: 'wait',
    duration: 4000
  },
  {
    step: 29,
    name: 'Screenshot first bid',
    action: 'screenshot',
    filename: '08-first-bid-recorded',
    fullPage: true
  },
  // Add second supplier bid
  {
    step: 30,
    name: 'Add second supplier bid',
    action: 'fill',
    selector: '[data-testid="message-input"]',
    value: `Record a bid from ${TEST_CONFIG.rfpScenario.suppliers[1].name}: Total bid $${TEST_CONFIG.rfpScenario.suppliers[1].bidAmount}, Delivery: ${TEST_CONFIG.rfpScenario.suppliers[1].deliveryTime}, Warranty: ${TEST_CONFIG.rfpScenario.suppliers[1].warranty}. Notes: ${TEST_CONFIG.rfpScenario.suppliers[1].notes}`
  },
  {
    step: 31,
    name: 'Submit second bid',
    action: 'keyboard',
    selector: '[data-testid="message-input"]',
    keys: 'Enter'
  },
  {
    step: 32,
    name: 'Wait for bid processing',
    action: 'wait',
    duration: 4000
  },
  {
    step: 33,
    name: 'Screenshot second bid',
    action: 'screenshot',
    filename: '09-second-bid-recorded',
    fullPage: true
  },
  // Add third supplier bid
  {
    step: 34,
    name: 'Add third supplier bid',
    action: 'fill',
    selector: '[data-testid="message-input"]',
    value: `Record a bid from ${TEST_CONFIG.rfpScenario.suppliers[2].name}: Total bid $${TEST_CONFIG.rfpScenario.suppliers[2].bidAmount}, Delivery: ${TEST_CONFIG.rfpScenario.suppliers[2].deliveryTime}, Warranty: ${TEST_CONFIG.rfpScenario.suppliers[2].warranty}. Notes: ${TEST_CONFIG.rfpScenario.suppliers[2].notes}`
  },
  {
    step: 35,
    name: 'Submit third bid',
    action: 'keyboard',
    selector: '[data-testid="message-input"]',
    keys: 'Enter'
  },
  {
    step: 36,
    name: 'Wait for bid processing',
    action: 'wait',
    duration: 4000
  },
  {
    step: 37,
    name: 'Screenshot third bid',
    action: 'screenshot',
    filename: '10-third-bid-recorded',
    fullPage: true
  },
  // Request bid comparison
  {
    step: 38,
    name: 'Request bid comparison',
    action: 'fill',
    selector: '[data-testid="message-input"]',
    value: 'Create a comparison table of all received bids with recommendations'
  },
  {
    step: 39,
    name: 'Submit comparison request',
    action: 'keyboard',
    selector: '[data-testid="message-input"]',
    keys: 'Enter'
  },
  {
    step: 40,
    name: 'Wait for comparison',
    action: 'wait',
    duration: 6000
  },
  {
    step: 41,
    name: 'Screenshot bid comparison',
    action: 'screenshot',
    filename: '11-bid-comparison',
    fullPage: true
  },
  {
    step: 42,
    name: 'Final screenshot',
    action: 'screenshot',
    filename: '12-final-state',
    fullPage: true
  }
];

module.exports = {
  TEST_CONFIG,
  TEST_STEPS
};
