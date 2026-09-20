import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const cwd = process.cwd();
const vitestCli = join(cwd, 'node_modules', 'vitest', 'vitest.mjs');
const outputFile = join(cwd, '.vitest-results.json');

const vitestResult = spawnSync(
  process.execPath,
  [
    vitestCli,
    'run',
    '--reporter=default',
    '--reporter=json',
    `--outputFile=${outputFile}`,
  ],
  {
    cwd,
    stdio: 'inherit',
  }
);

let totalRan = 0;
let totalPassed = 0;
let totalFailed = 0;

if (existsSync(outputFile)) {
  try {
    const report = JSON.parse(readFileSync(outputFile, 'utf-8'));

    totalRan = report.numTotalTests ?? 0;
    totalPassed = report.numPassedTests ?? 0;
    totalFailed = report.numFailedTests ?? 0;

    if (!totalRan && Array.isArray(report.testResults)) {
      for (const suite of report.testResults) {
        const assertions = suite.assertionResults ?? [];
        for (const assertion of assertions) {
          totalRan += 1;
          if (assertion.status === 'passed') totalPassed += 1;
          if (assertion.status === 'failed') totalFailed += 1;
        }
      }
    }
  } catch {
    // If parsing fails, keep defaults and still return Vitest exit code.
  } finally {
    unlinkSync(outputFile);
  }
}

console.log('');
console.log('Test Summary');
console.log(`Total Ran: ${totalRan}`);
console.log(`Total Passed: ${totalPassed}`);
console.log(`Total Failed: ${totalFailed}`);

process.exit(vitestResult.status ?? 1);
