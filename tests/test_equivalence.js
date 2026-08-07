/**
 * SkillSpectorWeb Functional Equivalence Test Suite
 * Executes SkillSpectorEngine on test skill fixtures and verifies rule detections & verdicts.
 */

const fs = require('fs');
const path = require('path');
const SkillSpectorEngine = require('../docs/js/skillspector-engine.js');

const engine = new SkillSpectorEngine();

// Fixtures directory from SkillSpector-2.5.1
const FIXTURES_DIR = path.resolve(__dirname, '../../SkillSpector-2.5.1/tests/fixtures');

function loadDirectoryFilesMap(dirPath, baseDir = dirPath) {
  let map = {};
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      Object.assign(map, loadDirectoryFilesMap(fullPath, baseDir));
    } else if (entry.isFile()) {
      map[relPath] = fs.readFileSync(fullPath, 'utf8');
    }
  }

  return map;
}

const TEST_CASES = [
  {
    id: 'malicious_skill',
    fixtureDir: path.join(FIXTURES_DIR, 'malicious_skill'),
    expectedRules: ['E2'], // Data Exfiltration from environment variables
    expectedVerdict: 'FAIL'
  },
  {
    id: 'safe_skill',
    fixtureDir: path.join(FIXTURES_DIR, 'safe_skill'),
    expectedRules: [],
    expectedVerdict: 'PASS'
  },
  {
    id: 'mcp_poisoned_tool',
    fixtureDir: path.join(FIXTURES_DIR, 'mcp_poisoned_tool'),
    expectedRules: ['P1', 'E1'], // Prompt injection & exfiltration URL
    expectedVerdict: 'FAIL'
  },
  {
    id: 'sqp_vague_triggers',
    fixtureDir: path.join(FIXTURES_DIR, 'sqp/sqp1_vague_triggers'),
    expectedRules: ['TR1'], // Trigger Abuse
    expectedVerdict: 'WARN'
  }
];

async function runEquivalenceTests() {
  console.log('==================================================');
  console.log('🧪 SkillSpectorWeb Functional Equivalence Test Suite');
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;
  const results = [];

  for (const testCase of TEST_CASES) {
    if (!fs.existsSync(testCase.fixtureDir)) {
      console.warn(`[SKIP] Fixture directory not found: ${testCase.fixtureDir}`);
      continue;
    }

    const filesMap = loadDirectoryFilesMap(testCase.fixtureDir);
    const report = await engine.inspect(testCase.id, filesMap);
    const detectedRuleIds = report.findings.map(f => f.ruleId);

    // Check if expected rules were detected
    let matchesRules = true;
    for (const reqRule of testCase.expectedRules) {
      if (!detectedRuleIds.includes(reqRule)) {
        matchesRules = false;
        break;
      }
    }

    const verdictMatches = (report.verdict === testCase.expectedVerdict);

    if (matchesRules && verdictMatches) {
      console.log(`✓ [PASS] ${testCase.id}: Verdict=${report.verdict}, RiskScore=${report.riskScore}, Rules=[${detectedRuleIds.join(', ')}]`);
      passed++;
    } else {
      console.error(`✗ [FAIL] ${testCase.id}:`);
      console.error(`  Expected Rules: [${testCase.expectedRules.join(', ')}] | Got: [${detectedRuleIds.join(', ')}]`);
      console.error(`  Expected Verdict: ${testCase.expectedVerdict} | Got: ${report.verdict}`);
      failed++;
    }

    results.push({
      testId: testCase.id,
      verdict: report.verdict,
      riskScore: report.riskScore,
      findingsCount: report.findings.length,
      detectedRules: detectedRuleIds
    });
  }

  console.log('\n--------------------------------------------------');
  console.log(`Summary: ${passed} Passed, ${failed} Failed`);
  console.log('--------------------------------------------------');

  if (process.argv.includes('--json')) {
    console.log('\n--- JSON RESULT ---');
    console.log(JSON.stringify(results, null, 2));
  }

  if (failed > 0) {
    process.exit(1);
  }
}

runEquivalenceTests().catch(err => {
  console.error('Fatal Test Harness Error:', err);
  process.exit(1);
});
