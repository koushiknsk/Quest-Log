// Kurogane Tactical Assistant - Master Automated Test Runner
// Runs all permanent tests in the workspace and validates 100% pass rate.

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const testsDir = __dirname;
const testFiles = fs.readdirSync(testsDir)
  .filter(f => f.endsWith('.test.js'))
  .sort();

console.log('===========================================================');
console.log(`KUROGANE TEST RUNNER: Executing ${testFiles.length} Permanent Suites`);
console.log('===========================================================\n');

let totalPassed = 0;
let totalFailed = 0;
const failures = [];

testFiles.forEach((file, index) => {
  const filePath = path.join(testsDir, file);
  console.log(`[SUITE ${index + 1}/${testFiles.length}] ${file}`);
  
  const result = spawnSync('node', [filePath], {
    cwd: path.resolve(__dirname, '..'),
    encoding: 'utf8',
    stdio: 'pipe'
  });

  if (result.status === 0) {
    console.log(result.stdout);
    totalPassed++;
  } else {
    console.error(`FAILED: ${file}`);
    console.error(result.stdout);
    console.error(result.stderr);
    totalFailed++;
    failures.push({ file, error: result.stderr || result.stdout });
  }
});

console.log('===========================================================');
console.log(`TEST SUMMARY: ${totalPassed} Passed, ${totalFailed} Failed out of ${testFiles.length} Suites`);
console.log('===========================================================');

if (totalFailed > 0) {
  console.error('\nFAILED SUITES:');
  failures.forEach(f => console.error(` - ${f.file}`));
  process.exit(1);
} else {
  console.log('\nALL TEST SUITES PASSED CLEANLY (100% SUCCESS).');
  process.exit(0);
}
