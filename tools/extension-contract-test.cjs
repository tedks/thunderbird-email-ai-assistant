const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.dirname(__dirname);
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
const webpack = require(path.join(root, 'webpack.config.js'));

function attribute(tag, name) {
  const pattern = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i');
  const match = tag.match(pattern);
  return match?.slice(1).find(value => value !== undefined);
}

assert.equal(webpack.output.filename, '[name]-bundle.js');
assert.equal(webpack.output.path, root);
assert.deepEqual(Object.keys(webpack.entry).sort(), ['background', 'options']);

for (const [name, page] of [
  ['background', manifest.background.page],
  ['options', manifest.options_ui.page],
]) {
  assert.equal(page, `${name}.html`, `${name} manifest page`);
  const html = fs.readFileSync(path.join(root, page), 'utf8')
    .replace(/<!--[\s\S]*?-->/g, '');
  const scripts = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi)]
    .map(match => match[1]);
  assert.deepEqual(scripts, [`${name}-bundle.js`], `${name} bundle reference`);
  const entry = path.resolve(root, webpack.entry[name]);
  assert.equal(entry, path.join(root, `${name}.js`), `${name} source entry`);
  assert.ok(fs.existsSync(entry), `missing entry: ${webpack.entry[name]}`);

  for (const tag of html.matchAll(/<link\b[^>]*>/gi)) {
    const rel = attribute(tag[0], 'rel');
    if (!rel?.toLowerCase().split(/\s+/).includes('stylesheet')) continue;
    const asset = attribute(tag[0], 'href');
    assert.ok(asset, `${name} stylesheet link has no href`);
    const assetPath = path.resolve(root, asset);
    assert.ok(assetPath.startsWith(root + path.sep), `nonlocal asset: ${asset}`);
    assert.ok(fs.existsSync(assetPath), `missing asset: ${asset}`);
  }
}

console.log('Extension manifest, pages, bundle names, and local assets agree');
