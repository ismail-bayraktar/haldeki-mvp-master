#!/usr/bin/env node

/**
 * Documentation Sync Script
 *
 * Scans src/ for JSDoc comments and generates API documentation.
 * Creates a docs index and maintains documentation structure.
 *
 * Usage: node scripts/sync-docs.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');
const DOCS_DIR = path.join(ROOT_DIR, 'docs');
const API_DOCS_DIR = path.join(DOCS_DIR, 'api');

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  gray: '\x1b[90m'
};

/**
 * Log message with color
 */
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Ensure directory exists
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log(`Created directory: ${path.relative(ROOT_DIR, dirPath)}`, 'gray');
  }
}

/**
 * Extract JSDoc comments from TypeScript/JavaScript files
 */
function extractJSDocComments(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const jsDocPattern = /\/\*\*[\s\S]*?\*\//g;
  const matches = content.match(jsDocPattern) || [];

  return matches.map(comment => {
    // Clean up the comment
    return comment
      .replace(/\/\*\*/, '')
      .replace(/\*\//g, '')
      .split('\n')
      .map(line => line.replace(/^\s*\*\s?/, '').trim())
      .filter(line => line.length > 0)
      .join('\n');
  });
}

/**
 * Parse JSDoc to extract structured information
 */
function parseJSDoc(comment) {
  const lines = comment.split('\n');
  const result = {
    description: '',
    params: [],
    returns: '',
    example: ''
  };

  let currentSection = 'description';

  for (const line of lines) {
    if (line.startsWith('@param')) {
      currentSection = 'params';
      const paramMatch = line.match(/@param\s+(\w+)\s*-\s*(.+)/);
      if (paramMatch) {
        result.params.push({ name: paramMatch[1], description: paramMatch[2] });
      }
    } else if (line.startsWith('@returns') || line.startsWith('@return')) {
      currentSection = 'returns';
      result.returns = line.replace(/@(returns?)\s*/, '');
    } else if (line.startsWith('@example')) {
      currentSection = 'example';
    } else if (line.startsWith('@')) {
      // Skip other tags
    } else {
      if (currentSection === 'description') {
        result.description += (result.description ? '\n' : '') + line;
      } else if (currentSection === 'example') {
        result.example += (result.example ? '\n' : '') + line;
      }
    }
  }

  return result;
}

/**
 * Scan directory recursively for TS/TSX files
 */
function scanDirectory(dir, baseDir = dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules and test files
      if (!['node_modules', '__tests__', '.test', '.spec'].some(skip => fullPath.includes(skip))) {
        files.push(...scanDirectory(fullPath, baseDir));
      }
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Generate API documentation for a file
 */
function generateAPIForFile(filePath) {
  const comments = extractJSDocComments(filePath);
  if (comments.length === 0) return null;

  const relativePath = path.relative(SRC_DIR, filePath);
  const parsed = parseJSDoc(comments[0]); // Use first comment as summary

  return `## ${relativePath}

\`\`\`typescript
// Path: ${relativePath}
\`\`\`

${parsed.description ? parsed.description : '*No description available*'}`;

  // Note: This is a simplified version. For full API docs, consider using TypeDoc.
}

/**
 * Generate the main docs index
 */
function generateDocsIndex() {
  const sections = [];

  // Core Documentation
  sections.push('# Haldeki Dokümantasyon İndeksi');
  sections.push('');
  sections.push('> Otomatik oluşturulmuş dokümantasyon dizini');
  sections.push('');
  sections.push('## 📚 Ana Dokümantasyon');
  sections.push('');
  sections.push('| Doküman | Açıklama |');
  sections.push('|---------|----------|');
  sections.push('| [README](./README.md) | Proje genel bakış ve hızlı başlangıç |');
  sections.push('| [ROADMAP](./ROADMAP.md) | Yol haritası ve faz takibi |');
  sections.push('| [CURRENT_STATUS](./CURRENT_STATUS.md) | Mevcut durum ve devam eden işler |');
  sections.push('| [PRD](./prd.md) | Ürün gereksinimleri dokümanı |');
  sections.push('');

  // Architecture
  sections.push('## 🏗️ Mimari');
  sections.push('');
  const archDir = path.join(DOCS_DIR, 'architecture');
  if (fs.existsSync(archDir)) {
    const archFiles = fs.readdirSync(archDir).filter(f => f.endsWith('.md'));
    for (const file of archFiles) {
      const name = file.replace('.md', '').replace(/-/g, ' ');
      sections.push(`- [${name}](./architecture/${file})`);
    }
  }
  sections.push('');

  // Business Logic
  sections.push('## 💼 İş Mantığı');
  sections.push('');
  const businessDir = path.join(DOCS_DIR, 'business');
  if (fs.existsSync(businessDir)) {
    const businessFiles = fs.readdirSync(businessDir).filter(f => f.endsWith('.md'));
    for (const file of businessFiles) {
      const name = file.replace('.md', '').replace(/-/g, ' ');
      sections.push(`- [${name}](./business/${file})`);
    }
  }
  sections.push('');

  // Guides
  sections.push('## 📖 Rehberler');
  sections.push('');
  const guidesDir = path.join(DOCS_DIR, 'guides');
  if (fs.existsSync(guidesDir)) {
    const guideFiles = fs.readdirSync(guidesDir).filter(f => f.endsWith('.md'));
    for (const file of guideFiles) {
      const name = file.replace('.md', '').replace(/^\d+-/, '').replace(/-/g, ' ');
      sections.push(`- [${name}](./guides/${file})`);
    }
  }
  sections.push('');

  // Phases
  sections.push('## 🔄 Fazlar');
  sections.push('');
  const phasesDir = path.join(DOCS_DIR, 'phases');
  if (fs.existsSync(phasesDir)) {
    const phaseFiles = fs.readdirSync(phasesDir).filter(f => f.endsWith('.md'));
    for (const file of phaseFiles) {
      const name = file.replace('.md', '').replace(/-/g, ' ');
      sections.push(`- [${name}](./phases/${file})`);
    }
  }
  sections.push('');

  // API Docs
  sections.push('## 🔌 API Dokümantasyonu');
  sections.push('');
  sections.push('> Bu bölüm otomatik olarak JSDoc yorumlarından oluşturulur.');
  sections.push('');
  sections.push(`\`\`\bash`);
  sections.push(`# API dokümantasyonunu oluşturmak için:`);
  sections.push(`npm run docs:api`);
  sections.push(`\`\`\``);
  sections.push('');

  // Meta
  sections.push('---');
  sections.push('');
  sections.push(`**Son güncelleme:** ${new Date().toISOString()}`);
  sections.push('');
  sections.push(`**Otomatik oluşturuldu:** sync-docs.js tarafından`);

  return sections.join('\n');
}

/**
 * Main execution
 */
function main() {
  log('\n📚 Haldeki Documentation Sync\n', 'blue');
  log('─────────────────────────────\n', 'blue');

  // Ensure directories exist
  ensureDir(API_DOCS_DIR);

  // Scan source files
  log('Scanning source files...', 'gray');
  const sourceFiles = scanDirectory(SRC_DIR);
  log(`Found ${sourceFiles.length} TypeScript files\n`, 'green');

  // Generate API docs index
  log('Generating API documentation...', 'gray');
  const apiDocs = [];

  for (const file of sourceFiles) {
    const doc = generateAPIForFile(file);
    if (doc) {
      apiDocs.push(doc);
    }
  }

  // Write API documentation
  if (apiDocs.length > 0) {
    const apiIndexPath = path.join(API_DOCS_DIR, 'index.md');
    const apiContent = [
      '# API Dokümantasyonu',
      '',
      '> Bu bölüm API fonksiyonlarının ve bileşenlerinin dokümantasyonunu içerir.',
      '',
      '## İçerik',
      '',
      ...apiDocs,
      '',
      '---',
      '',
      `**Son güncelleme:** ${new Date().toISOString()}`
    ].join('\n');

    fs.writeFileSync(apiIndexPath, apiContent, 'utf-8');
    log(`Created: ${path.relative(ROOT_DIR, apiIndexPath)}`, 'green');
  }

  // Generate main index
  log('\nGenerating docs index...', 'gray');
  const indexContent = generateDocsIndex();
  const indexPath = path.join(DOCS_DIR, 'INDEX.md');
  fs.writeFileSync(indexPath, indexContent, 'utf-8');
  log(`Created: ${path.relative(ROOT_DIR, indexPath)}`, 'green');

  // Generate docs tree
  log('\nGenerating documentation tree...', 'gray');
  const tree = generateDocsTree();
  const treePath = path.join(DOCS_DIR, 'TREE.md');
  fs.writeFileSync(treePath, tree, 'utf-8');
  log(`Created: ${path.relative(ROOT_DIR, treePath)}`, 'green');

  // Summary
  log('\n✅ Documentation sync complete!\n', 'green');
  log(`📊 Statistics:`, 'blue');
  log(`   - Source files scanned: ${sourceFiles.length}`, 'gray');
  log(`   - API docs generated: ${apiDocs.length}`, 'gray');
  log(`   - Docs index: ${path.relative(ROOT_DIR, indexPath)}`, 'gray');
  log(`   - Docs tree: ${path.relative(ROOT_DIR, treePath)}`, 'gray');
  log('');
}

/**
 * Generate ASCII tree of docs directory
 */
function generateDocsTree() {
  const lines = [];
  lines.push('# Dokümantasyon Yapısı');
  lines.push('');
  lines.push('```');
  lines.push('docs/');
  lines.push(generateTree(DOCS_DIR, '', true));
  lines.push('```');
  lines.push('');
  lines.push(`**Son güncelleme:** ${new Date().toISOString()}`);
  return lines.join('\n');
}

/**
 * Recursive tree generator
 */
function generateTree(dir, prefix = '', isRoot = false) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
    .filter(e => !e.name.startsWith('.'));

  const tree = [];
  const sorted = entries.sort((a, b) => {
    // Directories first
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
  });

  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];
    const isLast = i === sorted.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    const childPrefix = prefix + (isLast ? '    ' : '│   ');

    if (entry.isDirectory()) {
      tree.push(`${prefix}${connector}${entry.name}/`);
      if (!isRoot || entry.name !== 'node_modules') {
        tree.push(generateTree(path.join(dir, entry.name), childPrefix));
      }
    } else {
      tree.push(`${prefix}${connector}${entry.name}`);
    }
  }

  return tree.join('\n');
}

// Run the script
main();
