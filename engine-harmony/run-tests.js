/**
 * Engine Harmony - Dedicated Test Runner
 * Executes all independent unit and integration suites for Engine Harmony.
 */

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const suites = [
  { name: '1. Color Science & Harmonies', file: 'tests/color.test.js' },
  { name: '2. Compatibility & Style Matching', file: 'tests/compatibility.test.js' },
  { name: '3. Outfit Generation & Diversity', file: 'tests/generator.test.js' },
  { name: '4. Multi-Factor Scoring & Explanations', file: 'tests/scoring.test.js' },
  { name: '5. End-to-End Engine Harmony Orchestration', file: 'tests/engine-harmony.test.js' }
];

console.log('======================================================');
console.log('       ENGINE HARMONY - MASTER TEST SUITE EXECUTION   ');
console.log('======================================================\n');

let totalPassed = 0;
let totalFailed = 0;

for (const suite of suites) {
  const fullPath = path.join(__dirname, suite.file);
  process.stdout.write(`Executing: ${suite.name}... `);

  const res = spawnSync(process.execPath, ['--test', fullPath], {
    encoding: 'utf8',
    env: process.env
  });

  if (res.status === 0) {
    console.log('PASS');
    totalPassed++;
  } else {
    console.log('FAIL');
    totalFailed++;
    console.error(res.stdout || res.stderr);
  }
}

console.log('\n======================================================');
console.log(`TOTAL SUITES: ${suites.length} | PASSED: ${totalPassed} | FAILED: ${totalFailed}`);
console.log('======================================================\n');

if (totalFailed > 0) {
  process.exit(1);
}

