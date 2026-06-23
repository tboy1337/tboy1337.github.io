import fs from 'node:fs';
import path from 'node:path';
import libCoverage from 'istanbul-lib-coverage';
import libReport from 'istanbul-lib-report';
import reports from 'istanbul-reports';

const { createCoverageMap } = libCoverage;
const { createContext } = libReport;

const COVERAGE_DIR = path.resolve('coverage-e2e');
const OUTPUT_DIR = path.resolve('coverage-merged');

/**
 * @param {string} directory
 * @returns {Record<string, unknown>[]}
 */
function readCoverageFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs.readdirSync(directory)
    .filter((file) => file.endsWith('.json'))
    .map((file) => {
      try {
        return JSON.parse(fs.readFileSync(path.join(directory, file), 'utf8'));
      } catch (error) {
        console.warn(`Failed to parse coverage file ${file}:`, error);
        return null;
      }
    })
    .filter(Boolean);
}

/**
 * @param {import('istanbul-lib-coverage').CoverageMap} map
 */
function printSummary(map) {
  const summary = map.getCoverageSummary();
  const metrics = ['lines', 'statements', 'functions', 'branches'];
  const rows = metrics.map((metric) => {
    const data = summary[metric];
    return `${metric}: ${data.pct}% (${data.covered}/${data.total})`;
  });
  console.log(rows.join('\n'));
}

/**
 * @param {import('istanbul-lib-coverage').CoverageMap} map
 * @param {(file: string) => boolean} predicate
 * @returns {import('istanbul-lib-coverage').CoverageMap}
 */
function filterCoverageMap(map, predicate) {
  const filtered = createCoverageMap({});
  for (const file of map.files()) {
    if (predicate(file)) {
      filtered.addFileCoverage(map.fileCoverageFor(file));
    }
  }
  return filtered;
}

/**
 * @param {import('istanbul-lib-coverage').CoverageMap} map
 * @param {(file: string) => boolean} predicate
 * @param {number} threshold
 * @param {string} label
 * @param {string[]} metrics
 */
function assertGroupThresholds(map, predicate, threshold, label, metrics) {
  const filtered = filterCoverageMap(map, predicate);
  if (filtered.files().length === 0) {
    throw new Error(`No files matched coverage group: ${label}`);
  }

  const summary = filtered.getCoverageSummary();
  const failures = [];
  for (const metric of metrics) {
    const pct = summary[metric].pct;
    if (pct < threshold) {
      failures.push(`${label} ${metric} ${pct}% < ${threshold}%`);
    }
  }

  if (failures.length > 0) {
    throw new Error(`Coverage thresholds not met:\n${failures.join('\n')}`);
  }
}

function main() {
  const mergedMap = createCoverageMap({});
  const unitMap = createCoverageMap({});
  const unitCoveragePath = path.resolve('coverage/coverage-final.json');
  const e2eChunks = readCoverageFiles(COVERAGE_DIR);

  if (fs.existsSync(unitCoveragePath)) {
    try {
      const unitCoverage = JSON.parse(fs.readFileSync(unitCoveragePath, 'utf8'));
      unitMap.merge(JSON.parse(JSON.stringify(unitCoverage)));
      mergedMap.merge(unitCoverage);
    } catch (error) {
      console.warn(`Failed to parse unit coverage file ${unitCoveragePath}:`, error);
    }
  }

  for (const chunk of e2eChunks) {
    mergedMap.merge(chunk);
  }

  for (const file of mergedMap.files()) {
    if (file.endsWith('translation.js')) {
      mergedMap.removeFileCoverage(file);
    }
  }

  if (mergedMap.files().length === 0) {
    throw new Error('No coverage data found. Run unit and e2e tests first.');
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const context = createContext({
    dir: OUTPUT_DIR,
    coverageMap: mergedMap
  });

  reports.create('text', {}).execute(context);

  console.log('\nMerged coverage summary:');
  printSummary(mergedMap);
  const allMetrics = ['lines', 'statements', 'functions', 'branches'];
  assertGroupThresholds(unitMap, (file) => file.includes('/lib/'), 90, 'lib', allMetrics);
  assertGroupThresholds(mergedMap, (file) => file.endsWith('games.js'), 89, 'games.js', ['lines']);
  assertGroupThresholds(mergedMap, (file) => file.endsWith('games.js'), 87, 'games.js', ['statements', 'functions']);
  assertGroupThresholds(mergedMap, () => true, 90, 'project', ['lines', 'functions']);
  assertGroupThresholds(mergedMap, () => true, 88, 'project', ['statements']);

  reports.create('html', {}).execute(context);
  reports.create('json', {}).execute(context);
}

main();
