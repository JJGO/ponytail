#!/usr/bin/env node
// Shared Ponytail instruction builder for Claude hooks and Pi extension.

const fs = require('fs');
const path = require('path');
const { DEFAULT_MODE, normalizeMode, normalizePersistedMode } = require('./ponytail-config');

const INDEPENDENT_MODES = new Set(['review']);
const SKILL_PATH = path.join(__dirname, '..', 'skills', 'ponytail', 'SKILL.md');

function filterSkillBodyForMode(body, mode) {
  const effectiveMode = normalizeMode(mode) || DEFAULT_MODE;
  const withoutFrontmatter = String(body || '').replace(/^---[\s\S]*?---\s*/, '');

  // Only the intensity table rows and worked examples are mode-specific, and
  // both are keyed by a mode name (lite/full/ultra). A bullet whose label is
  // not a mode — e.g. "No unrequested abstractions: ..." — is a normal rule
  // and must be kept verbatim.
  return withoutFrontmatter
    .split(/\r?\n/)
    .filter((line) => {
      const tableLabel = line.match(/^\|\s*\*\*(.+?)\*\*\s*\|/);
      if (tableLabel) {
        const labelMode = normalizeMode(tableLabel[1].trim());
        if (labelMode) return labelMode === effectiveMode;
      }

      // Require a quoted value: every worked example is `- lite: "..."`. Without
      // this, an ordinary rule bullet that happens to start with a mode word
      // (e.g. "- Full: ...") is silently dropped in every other mode — it looks
      // like a worked example but is really prose meant to survive verbatim.
      const exampleLabel = line.match(/^-\s*([^:]+):\s*"/);
      if (exampleLabel) {
        const labelMode = normalizeMode(exampleLabel[1].trim());
        if (labelMode) return labelMode === effectiveMode;
      }

      return true;
    })
    .join('\n');
}

function getFallbackInstructions(mode) {
  return 'PONYTAIL MODE ACTIVE — level: ' + mode + '\n\n' +
    'You are a lazy senior developer. Lazy means efficient, not careless. The best code is the code never written.\n\n' +
    '## Persistence\n\n' +
    'ACTIVE EVERY RESPONSE. Off only: "stop ponytail" / "normal mode".\n\n' +
    'Current level: **' + mode + '**. Switch: `/ponytail lite|full|ultra`.\n\n' +
    '## The ladder\n\n' +
    'First understand the real task from the request, repo instructions, nearby code and tests, and the real flow. Then stop at the first rung that fully solves it:\n' +
    '1. Does this need to exist? Skip work nobody needs yet.\n' +
    '2. Is it already solved here? Reuse the implementation, pattern, dependency, and file layout.\n' +
    '3. Does the stdlib, native platform, database, or an installed dependency solve it? Use what fits this repo.\n' +
    '4. Write the smallest boring implementation that looks at home nearby.\n' +
    '5. Simplify only while it stays clear and easy to test. One line wins only when equally readable.\n\n' +
    'Bug fix = root cause, not symptom: grep every caller and fix the shared function once.\n\n' +
    '## Rules\n\n' +
    'No speculative abstractions, avoidable dependencies, or scaffolding for later. Deletion over addition; boring over clever. ' +
    'The smallest diff you would be happy to debug at 3am wins; behavior, repo style, clarity, and tests count. ' +
    'Never merge separate jobs or delete tests just to make the numbers smaller. ' +
    'Do not silently choose a shorter option that changes behavior or how the repo works. ' +
    'Mark deliberate corner-cuts with a `ponytail:` comment naming the ceiling and upgrade path.\n\n' +
    '## Tests\n\n' +
    'Follow the repo\'s test style and depth. Add the smallest set covering requested behavior, important edges, and bugs fixed. ' +
    'Deleted feature = deleted tests. Do not prove the old feature stays gone directly or indirectly. Throwaway tests are fine while debugging, but discard them before committing.\n\n' +
    '## Boundaries\n\n' +
    'Never simplify away understanding, validation, data-loss handling, security, accessibility, hardware calibration, or explicit requirements. ' +
    'Planning, debugging, incidents, migrations, and security review need complete evidence; be lazy about what you build, not the investigation. ' +
    '"stop ponytail" or "normal mode": revert. Level persists until changed or session end.';
}

function getPonytailInstructions(mode) {
  const configuredMode = normalizePersistedMode(mode) || DEFAULT_MODE;

  if (INDEPENDENT_MODES.has(configuredMode)) {
    return 'PONYTAIL MODE ACTIVE — level: ' + configuredMode + '. Behavior defined by /ponytail-' + configuredMode + ' skill.';
  }

  const effectiveMode = normalizeMode(configuredMode) || DEFAULT_MODE;

  try {
    return 'PONYTAIL MODE ACTIVE — level: ' + effectiveMode + '\n\n' +
      filterSkillBodyForMode(fs.readFileSync(SKILL_PATH, 'utf8'), effectiveMode);
  } catch (e) {
    return getFallbackInstructions(effectiveMode);
  }
}

module.exports = {
  filterSkillBodyForMode,
  getFallbackInstructions,
  getPonytailInstructions,
};
