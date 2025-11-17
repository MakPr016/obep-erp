const bcrypt = require('bcryptjs');

const passwords = {
  'admin@all#123': 'Admin',
  'hod@cse#123': 'CSE HOD',
  'hod@ise#123': 'ISE HOD',
  'hod@ece#123': 'ECE HOD',
  'hod@mch#123': 'MECH HOD',
};

async function generateHashes() {
  console.log('\n=== OBEP Password Hashes ===\n');
  
  for (const [password, label] of Object.entries(passwords)) {
    const hash = await bcrypt.hash(password, 10);
    console.log(`${label}:`);
    console.log(`  Password: ${password}`);
    console.log(`  Hash: ${hash}`);
    console.log();
  }
  
  console.log('=== Copy these hashes into your seed SQL ===\n');
}

generateHashes();
