const test = require('node:test');
const assert = require('node:assert/strict');
const { relativePath, toBrowserUrl } = require('../src/path-utils');

test('relativePath returns a slash-separated relative path', () => {
  assert.equal(relativePath('/project', '/project/src/index.js'), 'src/index.js');
});

test('toBrowserUrl normalizes common SSH and HTTPS Git remotes', () => {
  assert.equal(toBrowserUrl('git@github.com:octo/example.git'), 'https://github.com/octo/example');
  assert.equal(toBrowserUrl('ssh://git@gitlab.example.com/team/project.git'), 'https://gitlab.example.com/team/project');
  assert.equal(toBrowserUrl('https://github.com/octo/example.git'), 'https://github.com/octo/example');
});
