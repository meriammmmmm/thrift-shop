/**
 * Checks the garment-type mapping against the LIVE Space APIs.
 *
 * The bug this guards against: the mapping used to read the parameter's
 * DEFAULT as the vocabulary. Every CatVTON Space defaults to "upper",
 * so every dress was fitted to the torso and came back as a top.
 *
 * Run:  node scripts/check-tryon-mask.mjs
 */

import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Client } from '@gradio/client';

// Compile the shared module to plain JS so this script needs no test runner.
const outDir = mkdtempSync(join(tmpdir(), 'tryon-mask-'));
try {
  execFileSync(
    'npx',
    [
      'tsc',
      'lib/tryon-mask.ts',
      '--outDir',
      outDir,
      '--module',
      'commonjs',
      '--target',
      'es2020',
      '--skipLibCheck',
      '--moduleResolution',
      'node',
    ],
    { stdio: 'inherit' },
  );
} finally {
  // The compiled file is read below; the folder is removed at the end.
}

const require = createRequire(import.meta.url);
const { resolveGarmentType, literalChoices, resultMatchesType } = require(
  join(outDir, 'tryon-mask.js'),
);

const SPACES = [
  'swarnaverma1234/visionmirror-catvton',
  'swarnaverma1234/catvton',
  'multimodalart/CatVTON-zerogpu',
  'melikfiratai/seetudio-catvton',
  'yisol/IDM-VTON',
  'Nymbo/Virtual-Try-On',
  'Kwai-Kolors/Kolors-Virtual-Try-On',
];

// What each vocabulary MUST produce for each mask.
const EXPECT = {
  catvton: { upper: 'upper', lower: 'lower', overall: 'overall' },
  idm: { upper: 'upper_body', lower: 'lower_body', overall: 'dress' },
};

let failures = 0;

function fail(msg) {
  failures += 1;
  console.log(`  ✗ ${msg}`);
}

for (const space of SPACES) {
  console.log(`\n=== ${space}`);
  let client;
  try {
    client = await Client.connect(space);
  } catch (e) {
    console.log(`  (unreachable: ${String(e.message || e).slice(0, 90)})`);
    continue;
  }

  let info;
  try {
    info = await client.view_api();
  } catch (e) {
    console.log(`  (api unreadable: ${String(e.message || e).slice(0, 90)})`);
    continue;
  }

  const named = info?.named_endpoints || {};
  let checked = false;

  for (const [name, endpoint] of Object.entries(named)) {
    const parameters = endpoint.parameters || [];
    const param =
      parameters.find((p) => p.parameter_name === 'cloth_type') ||
      parameters.find((p) => p.parameter_name === 'category');
    if (!param) continue;

    const choices = literalChoices(param);
    const defaultValue = param.parameter_default;
    const vocab = choices.some((c) => /body/.test(c)) ? 'idm' : 'catvton';

    console.log(`  endpoint ${name} -> ${param.parameter_name}`);
    console.log(`    default (${vocab === 'idm' ? 'the old trap' : 'the old trap'}): "${defaultValue}"`);
    console.log(`    choices: ${choices.length ? choices.join(', ') : '(not published)'}`);

    for (const mask of ['upper', 'lower', 'overall']) {
      const resolved = resolveGarmentType(parameters, mask);
      const want = EXPECT[vocab][mask];
      const ok = resolved && resolved.value === want;
      if (!ok) {
        fail(
          `${name}: mask "${mask}" resolved to "${resolved?.value}" (parameter ${resolved?.parameter}), expected "${want}"`,
        );
      }
      console.log(
        `    mask ${mask.padEnd(8)} -> ${resolved?.parameter}=${resolved?.value} ${ok ? '✓' : '✗'}`,
      );
    }
    checked = true;
    break;
  }

  if (!checked) console.log('  (no garment-type parameter on any endpoint)');
}

// The guard that stops a result fitted to the wrong part of the body from
// being shown to the customer.
console.log('\n=== result-type guard ===');
const GUARD_CASES = [
  ['overall', 'overall', true],
  ['overall', 'dress', true],
  ['overall', 'upper', false],
  ['overall', 'upper_body', false],
  ['overall', undefined, false],
  ['overall', null, false],
  ['upper', 'upper', true],
  ['upper', 'overall', false],
  ['lower', 'lower_body', true],
  ['lower', 'lower', true],
];
for (const [requested, applied, want] of GUARD_CASES) {
  const got = resultMatchesType(requested, applied);
  if (got !== want) {
    failures += 1;
    console.log(`  ✗ requested ${requested}, applied ${applied} => ${got} (want ${want})`);
  } else {
    console.log(`  ok requested ${requested}, applied ${applied} => ${got}`);
  }
}

console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`}`);
rmSync(outDir, { recursive: true, force: true });
process.exit(failures === 0 ? 0 : 1);
