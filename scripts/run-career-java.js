/* eslint-disable no-console */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const mode = process.argv[2];
if (!mode || !['update', 'editor'].includes(mode)) {
  console.error('Usage: node scripts/run-career-java.js <update|editor>');
  process.exit(1);
}

const KFrostRoot = path.resolve(__dirname, '..');
const javaPracticeRoot = path.resolve(KFrostRoot, '..', 'java-practice');
const isWindows = process.platform === 'win32';
const gradlePath = path.join(javaPracticeRoot, isWindows ? 'gradlew.bat' : 'gradlew');
const gradleTask = mode === 'update' ? 'runCareerGenerator' : 'runCareerEditor';

console.log(`[career] Running Java task: ${gradleTask}`);

if (!fs.existsSync(gradlePath)) {
  console.error(`[career] Gradle launcher not found: ${gradlePath}`);
  console.error('[career] Skip this step or restore the sibling java-practice repository.');
  process.exit(1);
}

const result = spawnSync(
  gradlePath,
  [gradleTask, '--args', KFrostRoot],
  {
    cwd: javaPracticeRoot,
    stdio: 'inherit',
  }
);

if (result.error) {
  console.error(`Failed to run Java task: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
