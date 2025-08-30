// Copyright Mark Skiba, 2025 All rights reserved

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Define copyright headers for different file types
const copyrightHeaders = {
  js: '// Copyright Mark Skiba, 2025 All rights reserved\n\n',
  ts: '// Copyright Mark Skiba, 2025 All rights reserved\n\n',
  tsx: '// Copyright Mark Skiba, 2025 All rights reserved\n\n',
  jsx: '// Copyright Mark Skiba, 2025 All rights reserved\n\n',
  css: '/* Copyright Mark Skiba, 2025 All rights reserved */\n\n',
  scss: '/* Copyright Mark Skiba, 2025 All rights reserved */\n\n'
};

// Files to skip (already processed or should not have copyright)
const skipFiles = [
  'src/App.tsx',
  'src/App.test.tsx', 
  'src/index.tsx',
  'src/supabaseClient.ts',
  'src/setupTests.ts',
  'src/components/AgentSelector.css',
  'src/react-app-env.d.ts', // TypeScript environment file
  'src/service-worker.ts',  // Generated file
  'src/serviceWorkerRegistration.ts' // Generated file
];

function shouldSkipFile(filePath) {
  const relativePath = path.relative('c:\\Dev\\RFPEZ.AI\\rfpez-app', filePath).replace(/\\/g, '/');
  return skipFiles.includes(relativePath);
}

function getFileExtension(filePath) {
  return path.extname(filePath).slice(1).toLowerCase();
}

function hasExistingCopyright(content) {
  const firstLines = content.split('\n').slice(0, 5).join('\n');
  return firstLines.includes('Copyright Mark Skiba, 2025') || 
         firstLines.includes('Copyright') ||
         firstLines.includes('All rights reserved');
}

function addCopyrightHeader(filePath) {
  try {
    if (shouldSkipFile(filePath)) {
      console.log(`Skipping ${filePath} (already processed)`);
      return;
    }

    const ext = getFileExtension(filePath);
    const header = copyrightHeaders[ext];
    
    if (!header) {
      console.log(`Skipping ${filePath} (unsupported file type: ${ext})`);
      return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    
    if (hasExistingCopyright(content)) {
      console.log(`Skipping ${filePath} (already has copyright)`);
      return;
    }

    const newContent = header + content;
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Added copyright to ${filePath}`);
  } catch (error) {
    console.error(`Error processing ${filePath}: ${error.message}`);
  }
}

function findSourceFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      files.push(...findSourceFiles(fullPath));
    } else if (entry.isFile()) {
      const ext = getFileExtension(fullPath);
      if (copyrightHeaders[ext]) {
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

// Main execution
const srcDir = path.join(__dirname, 'src');
const sourceFiles = findSourceFiles(srcDir);

console.log(`Found ${sourceFiles.length} source files`);
console.log('Adding copyright headers...\n');

sourceFiles.forEach(addCopyrightHeader);

console.log('\nCopyright header addition complete!');
