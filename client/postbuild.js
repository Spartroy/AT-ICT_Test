const { execSync } = require('child_process');

if (process.env.VERCEL || process.env.CI) {
  console.log('CI/Vercel environment detected: skipping react-snap.');
  process.exit(0);
}

try {
  console.log('Running react-snap...');
  execSync('react-snap', { stdio: 'inherit', shell: true });
} catch (error) {
  console.error('react-snap execution failed:', error.message);
  process.exit(1);
}
