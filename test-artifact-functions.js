// Test file for the new Artifact Functions
// This demonstrates how to use the new artifact functions for form presentation

const { claudeAPIHandler } = require('./src/services/claudeAPIFunctions');

async function testArtifactFunctions() {
  console.log('🧪 Testing Artifact Functions...\n');

  try {
    // Test 1: Create a simple form artifact
    console.log('1. Creating a simple contact form artifact...');
    
    const contactFormResult = await claudeAPIHandler.executeFunction('create_form_artifact', {
      title: 'Contact Information Form',
      description: 'A form to collect user contact information',
      form_schema: {
        type: 'object',
        title: 'Contact Information',
        properties: {
          firstName: {
            type: 'string',
            title: 'First Name',
            description: 'Your first name'
          },
          lastName: {
            type: 'string',
            title: 'Last Name',
            description: 'Your last name'
          },
          email: {
            type: 'string',
            format: 'email',
            title: 'Email Address',
            description: 'Your email address'
          },
          phone: {
            type: 'string',
            title: 'Phone Number',
            description: 'Your phone number (optional)'
          },
          message: {
            type: 'string',
            title: 'Message',
            description: 'Your message or inquiry'
          }
        },
        required: ['firstName', 'lastName', 'email', 'message']
      },
      ui_schema: {
        message: {
          'ui:widget': 'textarea',
          'ui:options': {
            rows: 4
          }
        },
        phone: {
          'ui:placeholder': '(555) 123-4567'
        }
      },
      form_data: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        message: ''
      },
      submit_action: {
        type: 'function_call',
        function_name: 'store_contact_form',
        success_message: 'Thank you for your message! We will get back to you soon.'
      }
    });
    
    console.log('✅ Contact form created:', {
      artifact_id: contactFormResult.artifact_id,
      title: contactFormResult.title,
      message: contactFormResult.message
    });

    const contactFormId = contactFormResult.artifact_id;

    // Test 2: Create an RFP requirements form
    console.log('\n2. Creating an RFP requirements form artifact...');
    
    const rfpFormResult = await claudeAPIHandler.executeFunction('create_form_artifact', {
      title: 'RFP Requirements Form',
      description: 'Define requirements for a new Request for Proposal',
      form_schema: {
        type: 'object',
        title: 'RFP Requirements',
        properties: {
          projectTitle: {
            type: 'string',
            title: 'Project Title',
            description: 'The title of your project'
          },
          projectDescription: {
            type: 'string',
            title: 'Project Description',
            description: 'Detailed description of what you need'
          },
          budget: {
            type: 'number',
            title: 'Budget',
            description: 'Project budget in USD',
            minimum: 0
          },
          timeline: {
            type: 'string',
            title: 'Project Timeline',
            description: 'Expected project duration'
          },
          industry: {
            type: 'string',
            title: 'Industry',
            enum: ['Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing', 'Other'],
            description: 'Industry sector'
          },
          requirements: {
            type: 'array',
            title: 'Key Requirements',
            description: 'List of key project requirements',
            items: {
              type: 'string'
            }
          },
          deliverables: {
            type: 'string',
            title: 'Expected Deliverables',
            description: 'What should be delivered at project completion'
          }
        },
        required: ['projectTitle', 'projectDescription', 'budget', 'timeline', 'industry']
      },
      ui_schema: {
        projectDescription: {
          'ui:widget': 'textarea',
          'ui:options': { rows: 5 }
        },
        deliverables: {
          'ui:widget': 'textarea',
          'ui:options': { rows: 4 }
        },
        requirements: {
          'ui:options': {
            addable: true,
            removable: true
          }
        },
        budget: {
          'ui:placeholder': '50000'
        }
      },
      submit_action: {
        type: 'function_call',
        function_name: 'create_rfp_from_requirements',
        success_message: 'RFP requirements saved! We will generate your RFP document.'
      }
    });
    
    console.log('✅ RFP form created:', {
      artifact_id: rfpFormResult.artifact_id,
      title: rfpFormResult.title
    });

    // Test 3: Validate form data
    console.log('\n3. Testing form data validation...');
    
    const validationTest = await claudeAPIHandler.executeFunction('validate_form_data', {
      form_schema: contactFormResult.form_schema,
      form_data: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '(555) 123-4567',
        message: 'I am interested in your services.'
      }
    });
    
    console.log('✅ Validation result:', {
      valid: validationTest.valid,
      errors: validationTest.errors,
      message: validationTest.message
    });

    // Test 4: Test validation with invalid data
    console.log('\n4. Testing validation with invalid data...');
    
    const invalidValidationTest = await claudeAPIHandler.executeFunction('validate_form_data', {
      form_schema: contactFormResult.form_schema,
      form_data: {
        firstName: 'John',
        // lastName missing (required)
        email: 'invalid-email', // invalid format
        phone: '(555) 123-4567',
        message: '' // required but empty
      }
    });
    
    console.log('✅ Invalid validation result:', {
      valid: invalidValidationTest.valid,
      errors: invalidValidationTest.errors,
      message: invalidValidationTest.message
    });

    // Test 5: Create a template
    console.log('\n5. Creating a form template...');
    
    const templateResult = await claudeAPIHandler.executeFunction('create_artifact_template', {
      template_name: 'Basic Contact Form',
      template_type: 'form',
      description: 'A reusable template for basic contact forms',
      template_schema: contactFormResult.form_schema,
      template_ui: contactFormResult.ui_schema,
      tags: ['contact', 'basic', 'form']
    });
    
    console.log('✅ Template created:', {
      template_id: templateResult.template_id,
      template_name: templateResult.template_name,
      message: templateResult.message
    });

    // Test 6: List templates
    console.log('\n6. Listing form templates...');
    
    const templatesResult = await claudeAPIHandler.executeFunction('list_artifact_templates', {
      template_type: 'form'
    });
    
    console.log('✅ Templates listed:', {
      total_found: templatesResult.total_found,
      templates: templatesResult.templates.map(t => ({
        name: t.name,
        type: t.type,
        tags: t.tags
      }))
    });

    // Test 7: Get artifact status
    console.log('\n7. Getting artifact status...');
    
    const statusResult = await claudeAPIHandler.executeFunction('get_artifact_status', {
      artifact_id: contactFormId
    });
    
    console.log('✅ Artifact status:', {
      artifact_id: statusResult.artifact_id,
      status: statusResult.status,
      title: statusResult.title,
      submission_count: statusResult.submission_count,
      message: statusResult.message
    });

    console.log('\n🎉 All artifact function tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
}

// Run the tests
if (require.main === module) {
  testArtifactFunctions().catch(console.error);
}

module.exports = { testArtifactFunctions };
