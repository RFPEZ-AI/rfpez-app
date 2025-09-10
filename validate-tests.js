// Simple validation test
const { execSync } = require('child_process');
const fs = require('fs');

// Check if required test dependencies exist
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

console.log('📦 Checking test dependencies...');

const testDeps = [
  '@testing-library/jest-dom',
  '@testing-library/react', 
  '@types/jest',
  'react-scripts'
];

const missing = testDeps.filter(dep => 
  !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]
);

if (missing.length > 0) {
  console.log('❌ Missing dependencies:', missing);
} else {
  console.log('✅ All test dependencies present');
}

// Check if Jest config exists
if (packageJson.jest) {
  console.log('✅ Jest configuration found');
} else {
  console.log('❌ No Jest configuration found');
}

// Try to run TypeScript compilation
try {
  console.log('🔧 Checking TypeScript compilation...');
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  console.log('✅ TypeScript compilation successful');
} catch (error) {
  console.log('❌ TypeScript compilation failed');
  console.log(error.stdout.toString());
}

console.log('🧪 Test environment validation complete');
