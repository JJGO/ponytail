#!/usr/bin/env node

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

test('pi exposes bundled skills only for explicit user invocation', () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.deepEqual(packageJson.pi.skills, ['./skills']);

  const skillNames = fs.readdirSync(path.join(root, 'skills'));
  for (const name of skillNames) {
    const skillPath = path.join(root, 'skills', name, 'SKILL.md');
    if (!fs.existsSync(skillPath)) continue;

    const frontmatter = fs.readFileSync(skillPath, 'utf8').match(/^---\n([\s\S]*?)\n---/)?.[1];
    assert.match(
      frontmatter || '',
      /^disable-model-invocation:\s*true$/m,
      `${name} must stay hidden from model invocation while remaining user-invokable`,
    );
  }
});
