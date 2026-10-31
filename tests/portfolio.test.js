const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

test('portfolio links use the Jekyll base URL and point to standalone HTML', () => {
  const homepage = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const layouts = ['default.html', 'blog.html'].map((name) =>
    fs.readFileSync(path.join(root, '_layouts', name), 'utf8'));

  for (const [locale, language] of [['jp', 'ja'], ['en', 'en']]) {
    const link = `{{ '/career/${locale}/' | relative_url }}`;
    assert.ok(homepage.includes(link), `Homepage is missing the ${locale} portfolio link.`);
    const html = fs.readFileSync(path.join(root, 'career', locale, 'index.html'), 'utf8');
    assert.ok(/^<!doctype html>/i.test(html), `${locale} portfolio must be standalone static HTML.`);
    assert.ok(html.includes(`<html lang="${language}">`), `${locale} portfolio has an incorrect language.`);
  }
  for (const layout of layouts) {
    assert.ok(layout.includes("{{ '/career/jp/' | relative_url }}"), 'Navigation is missing the Japanese portfolio link.');
  }
});
