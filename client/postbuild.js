const { execSync } = require('child_process');

if (process.env.VERCEL || process.env.CI) {
  console.log('CI/Vercel environment detected: skipping react-snap.');
  process.exit(0);
}

try {
  console.log('Running react-snap...');
  execSync('react-snap', { stdio: 'inherit', shell: true });
} catch (error) {
  console.warn('\n⚠️  Warning: react-snap pre-rendering failed.');
  console.warn('The build will continue, but static pre-rendered HTML files will not be generated.');
  console.warn('Reason:', error.message, '\n');
  process.exit(0);
}
