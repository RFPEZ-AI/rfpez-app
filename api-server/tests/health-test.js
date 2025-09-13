// Simple health check test for API server
const http = require('http');

function testHealth() {
    return new Promise((resolve, reject) => {
        const req = http.get('http://localhost:3001/health', (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                console.log('Health check response:', data);
                resolve(data);
            });
        });
        
        req.on('error', (err) => {
            console.error('Health check failed:', err.message);
            reject(err);
        });
        
        req.setTimeout(5000, () => {
            req.destroy();
            reject(new Error('Health check timeout'));
        });
    });
}

testHealth()
    .then(() => console.log('✅ API server is responding'))
    .catch(() => console.log('❌ API server is not responding'));