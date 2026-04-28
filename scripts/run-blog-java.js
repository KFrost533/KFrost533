/* eslint-disable no-console */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const mode = process.argv[2] || 'generate';
if (!['generate', 'verbose', 'check'].includes(mode)) {
  console.error('Usage: node scripts/run-blog-java.js <generate|verbose|check>');
  process.exit(1);
}

const kentafrostRoot = path.resolve(__dirname, '..');
const javaPracticeRoot = path.resolve(kentafrostRoot, '..', 'java-practice');
const isWindows = process.platform === 'win32';
const gradlePath = path.join(javaPracticeRoot, isWindows ? 'gradlew.bat' : 'gradlew');

const env = {
  ...process.env,
  BLOG_VERBOSE: mode === 'verbose' ? '1' : '',
  BLOG_DRY_RUN: mode === 'check' ? '1' : '',
};

console.log('[blog] Running Java task: runBlogGenerator');

if (!fs.existsSync(gradlePath)) {
  console.error(`[blog] Gradle launcher not found: ${gradlePath}`);
  console.error('[blog] Skip this step or restore the sibling java-practice repository.');
  process.exit(1);
}

const result = spawnSync(
  gradlePath,
  ['runBlogGenerator', `--args=${kentafrostRoot}`],
  {
    cwd: javaPracticeRoot,
    stdio: 'inherit',
    env,
  }
);

if (result.error) {
  console.error(`Failed to run Java blog generator: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
