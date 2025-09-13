// Quick test script to verify RJSF form rendering
// Run this in the browser console once the app loads

// Test form spec (simplified version of what's in the database)
const testFormSpec = {
  version: "rfpez-form@1",
  schema: {
    title: "Hotel Bid Proposal",
    type: "object",
    required: ["hotelName", "nightlyRate"],
    properties: {
      hotelName: {
        type: "string",
        title: "Hotel Name"
      },
      nightlyRate: {
        type: "number",
        title: "Nightly Rate (USD)",
        minimum: 50
      },
      amenities: {
        type: "array",
        title: "Amenities",
        items: {
          type: "string",
          enum: ["WiFi", "Parking", "Breakfast", "Gym", "Pool"]
        }
      }
    }
  },
  uiSchema: {
    hotelName: {
      "ui:placeholder": "e.g., Oceanview Suites"
    },
    amenities: {
      "ui:widget": "checkboxes"
    }
  },
  defaults: {
    amenities: ["WiFi"]
  }
};

console.log('Test form spec ready:', testFormSpec);

// Test if RfpForm component is available
if (window.RfpForm) {
  console.log('✅ RfpForm component is available');
} else {
  console.log('❌ RfpForm component not found in window object');
}

// You can copy this testFormSpec to test form creation manually
