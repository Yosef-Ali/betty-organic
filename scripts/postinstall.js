const { execSync } = require('child_process');

try {
  execSync('prisma generate', { stdio: 'inherit' });
} catch (error) {
  console.error('Error during prisma generate:', error);
  process.exit(1);
}
