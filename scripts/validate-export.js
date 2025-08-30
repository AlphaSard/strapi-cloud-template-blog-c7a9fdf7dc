#!/usr/bin/env node
/*
 Simple validator for Strapi JSON-V2 exports.
 Usage:
   node scripts/validate-export.js <path-to-export.json> [--strict]
 Exits with code 1 if --strict is passed and missing references are found.
*/
const fs = require('fs');
const path = require('path');

function die(msg) {
  console.error(msg);
  process.exit(1);
}

const [, , fileArg, ...rest] = process.argv;
if (!fileArg) die('Usage: node scripts/validate-export.js <export.json> [--strict]');
const strict = rest.includes('--strict');

const p = path.resolve(process.cwd(), fileArg);
if (!fs.existsSync(p)) die(`File not found: ${p}`);

let json;
try {
  json = JSON.parse(fs.readFileSync(p, 'utf8'));
} catch (e) {
  die(`Invalid JSON: ${e.message}`);
}

if (json.version !== 2 || typeof json.data !== 'object') {
  die('Unsupported export format. Expected JSON-V2 with { version: 2, data: {...} }');
}

const data = json.data;

function ensureMap(key) {
  const m = data[key] || {};
  return m && typeof m === 'object' ? m : {};
}

const files = ensureMap('plugin::upload.file');
const articles = ensureMap('api::article.article');
const projects = ensureMap('api::project.project');
const authors = ensureMap('api::author.author');
const categories = ensureMap('api::category.category');
const tags = ensureMap('api::tag.tag');
const globals = ensureMap('api::global.global');

const missing = {
  articles: { cover: [], author: [], category: [] },
  projects: { cover: [], tags: [] },
  globals: { favicon: [] },
};

// Helper
const has = (map, id) => map && Object.prototype.hasOwnProperty.call(map, String(id));

// Articles
for (const k of Object.keys(articles)) {
  const a = articles[k];
  if (a.cover != null && !has(files, a.cover)) missing.articles.cover.push(a.id ?? +k);
  if (a.author != null && !has(authors, a.author)) missing.articles.author.push(a.id ?? +k);
  if (a.category != null && !has(categories, a.category)) missing.articles.category.push(a.id ?? +k);
}

// Projects
for (const k of Object.keys(projects)) {
  const pr = projects[k];
  if (pr.cover != null && !has(files, pr.cover)) missing.projects.cover.push(pr.id ?? +k);
  if (Array.isArray(pr.tags)) {
    for (const t of pr.tags) {
      if (!has(tags, t)) missing.projects.tags.push({ project: pr.id ?? +k, tag: t });
    }
  }
}

// Global favicon
for (const k of Object.keys(globals)) {
  const g = globals[k];
  if (g.favicon != null && !has(files, g.favicon)) missing.globals.favicon.push(g.id ?? +k);
}

const summary = {
  version: json.version,
  totals: {
    files: Object.keys(files).length,
    articles: Object.keys(articles).length,
    projects: Object.keys(projects).length,
    authors: Object.keys(authors).length,
    categories: Object.keys(categories).length,
    tags: Object.keys(tags).length,
    globals: Object.keys(globals).length,
  },
  missing,
};

console.log(JSON.stringify(summary, null, 2));

const hasMissing = Object.values(missing).some((obj) => {
  if (Array.isArray(obj)) return obj.length > 0;
  return Object.values(obj).some((arr) => Array.isArray(arr) ? arr.length > 0 : false);
});

if (hasMissing && strict) process.exit(1);

