#!/usr/bin/env node

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (relPath) => fs.readFileSync(path.join(root, relPath), 'utf8');

test('rules optimize for maintainability instead of line count', () => {
  const skill = read('skills/ponytail/SKILL.md');

  assert.match(skill, /happy to debug at 3am/i);
  assert.match(skill, /How this repo already works/i);
  assert.match(skill, /One line wins only when it is at least as clear and easy to verify/i);
  assert.doesNotMatch(skill, /Can it be one line\?\*\* One line/);
  assert.doesNotMatch(skill, /Fewest files possible/);
});

test('rules preserve repository test depth and discard removed-behavior tests', () => {
  for (const relPath of ['skills/ponytail/SKILL.md', 'AGENTS.md']) {
    const rules = read(relPath);
    assert.match(rules, /Follow the repo's test style and depth/i, relPath);
    assert.match(rules, /Deleted feature = deleted tests/i, relPath);
    assert.match(rules, /directly or through (?:its )?old side effects/i, relPath);
    assert.match(rules, /Throwaway tests[\s\S]*discard\s+them\s+before\s+committing/i, relPath);
  }
});
