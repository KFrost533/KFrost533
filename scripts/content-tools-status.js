/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

function checkPath(targetPath, label, kind = 'any') {
  const exists = fs.existsSync(targetPath);
  const kindOk = !exists
    ? false
    : kind === 'dir'
      ? fs.statSync(targetPath).isDirectory()
      : kind === 'file'
        ? fs.statSync(targetPath).isFile()
        : true;

  const ok = exists && kindOk;
  const mark = ok ? 'OK' : 'NG';
  console.log(`[${mark}] ${label}: ${targetPath}`);
  return ok;
}

function main() {
  const KFrostRoot = path.resolve(__dirname, '..');
  const javaPracticeRoot = path.resolve(KFrostRoot, '..', 'java-practice');
  const gradlePath = path.join(javaPracticeRoot, process.platform === 'win32' ? 'gradlew.bat' : 'gradlew');

  const checks = [
    checkPath(KFrostRoot, 'KFrost533 root', 'dir'),
    checkPath(path.join(KFrostRoot, 'doc', 'career-data'), 'career-data directory', 'dir'),
    checkPath(path.join(KFrostRoot, 'doc', 'blog'), 'blog source directory', 'dir'),
    checkPath(javaPracticeRoot, 'java-practice root', 'dir'),
    checkPath(gradlePath, 'Gradle launcher', 'file'),
    checkPath(path.join(javaPracticeRoot, 'github_page', 'career', 'career_data_editor.java'), 'Career editor Java source', 'file'),
    checkPath(path.join(javaPracticeRoot, 'github_page', 'career', 'career_sections_generate.java'), 'Career generator Java source', 'file'),
    checkPath(path.join(javaPracticeRoot, 'github_page', 'blog', 'blog_pages_generate.java'), 'Blog generator Java source', 'file'),
  ];

  const allOk = checks.every(Boolean);
  console.log('');
  if (allOk) {
    console.log('All checks passed. You can run:');
    console.log('- npm run career:editor');
    console.log('- npm run career:update');
    console.log('- npm run blog:generate');
    process.exit(0);
  }

  console.error('One or more checks failed. Fix the path/layout above first.');
  process.exit(1);
}

main();
