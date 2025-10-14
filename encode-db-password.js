#!/usr/bin/env node
/* eslint-env node */
/* eslint-disable no-console, @typescript-eslint/no-var-requires */

/**
 * URL Encode Database Password for Supabase Connection String
 * 
 * Usage:
 *   node encode-db-password.js "yourPassword123"
 *   node encode-db-password.js    (will prompt for password)
 */

const readline = require('readline');

function encodePassword(password) {
  return encodeURIComponent(password);
}

function buildConnectionString(password) {
  const encoded = encodePassword(password);
  const projectRef = 'jxlutaztoukwbbgtoulc';
  return `postgresql://postgres:${encoded}@db.${projectRef}.supabase.co:5432/postgres`;
}

function showEncodingTable() {
  const specialChars = {
    '@': '%40',
    '#': '%23',
    '$': '%24',
    '%': '%25',
    '&': '%26',
    '+': '%2B',
    ':': '%3A',
    '/': '%2F',
    '?': '%3F',
    '=': '%3D',
    ' ': '%20',
    '!': '%21',
    '*': '%2A',
    '(': '%28',
    ')': '%29',
  };

  console.log('\n📋 Common Special Character Encodings:');
  console.log('┌────────────┬─────────────┐');
  console.log('│ Character  │ URL Encoded │');
  console.log('├────────────┼─────────────┤');
  Object.entries(specialChars).forEach(([char, encoded]) => {
    console.log(`│     ${char.padEnd(7)}│   ${encoded.padEnd(10)}│`);
  });
  console.log('└────────────┴─────────────┘\n');
}

async function promptForPassword() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('Enter your database password: ', (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  console.log('🔐 Supabase Password URL Encoder\n');
  
  let password = process.argv[2];

  if (!password) {
    password = await promptForPassword();
  }

  if (!password) {
    console.error('❌ Error: No password provided\n');
    console.log('Usage: node encode-db-password.js "yourPassword123"');
    process.exit(1);
  }

  const encoded = encodePassword(password);
  const connectionString = buildConnectionString(password);
  
  console.log('\n✅ Results:');
  console.log('─────────────────────────────────────────────────────────────');
  console.log('📝 Original password:', password);
  console.log('🔒 Encoded password:', encoded);
  console.log('─────────────────────────────────────────────────────────────');
  console.log('\n🔗 Full Connection String:');
  console.log(connectionString);
  console.log('─────────────────────────────────────────────────────────────');
  
  // Check if password contains special characters
  const hasSpecialChars = /[@#$%&+:/?=! *()]/.test(password);
  if (hasSpecialChars) {
    console.log('\n⚠️  Your password contains special characters that were encoded.');
    showEncodingTable();
  } else {
    console.log('\n✅ Your password has no special characters - no encoding needed!');
  }

  console.log('\n📋 Next Steps:');
  console.log('1. Copy the full connection string above');
  console.log('2. Go to: https://github.com/markesphere/rfpez-app/settings/secrets/actions/SUPABASE_DB_URL');
  console.log('3. Click "Update"');
  console.log('4. Paste the connection string');
  console.log('5. Click "Update secret"');
  console.log('\n✨ Done!\n');
}

main().catch(console.error);
