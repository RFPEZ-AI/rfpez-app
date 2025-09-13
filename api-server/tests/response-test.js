// Quick test script to check specific API responses
const http = require('http');

function testPrompt(prompt) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            prompt: prompt,
            context: {}
        });

        const options = {
            hostname: 'localhost',
            port: 3001,
            path: '/api/agent/prompt',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    console.log('='.repeat(50));
                    console.log('PROMPT:', prompt.substring(0, 80) + '...');
                    console.log('ACTIONS:', response.actions);
                    console.log('ARTIFACT CALLS:', response.artifactCalls?.map(c => c.operation));
                    console.log('DATABASE CALLS:', response.databaseCalls?.map(c => c.operation));
                    resolve(response);
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });

        req.write(postData);
        req.end();
    });
}

async function runTests() {
    console.log('🧪 Testing API Response Analysis');
    
    try {
        await testPrompt("I'd like to fill out a comprehensive questionnaire to provide all the details needed for this LED bulb procurement.");
        await testPrompt("I've completed the questionnaire form with the following details: Project Information: - Project Name: LED Lighting Retrofit");
        await testPrompt("Great! Now that we have all our requirements defined, can you create the supplier bid form");
        await testPrompt("Can you show me a complete summary of everything we've created for this LED bulb procurement RFP?");
        await testPrompt("This LED lighting procurement process worked well. Can you save this as a template");
    } catch (error) {
        console.error('Test error:', error.message);
    }
}

runTests();