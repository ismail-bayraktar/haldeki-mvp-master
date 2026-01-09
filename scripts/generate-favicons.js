import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple SVG to favicon converter
const svgContent = fs.readFileSync(
  path.join(__dirname, '../public/haldeki-logo.svg'),
  'utf-8'
);

// Extract the viewBox and dimensions
const viewBoxMatch = svgContent.match(/viewBox="([^"]+)"/);
const viewBox = viewBoxMatch ? viewBoxMatch[1].split(' ').map(Number) : [0, 0, 450, 362];

// Create a simple HTML file for manual favicon generation
const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
  <title>Haldeki Favicon Generator</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 { color: #004631; }
    .instructions {
      background: #e8f5e9;
      padding: 15px;
      border-radius: 4px;
      margin: 20px 0;
    }
    canvas {
      border: 1px solid #ddd;
      margin: 10px;
      background: white;
    }
    .download-btn {
      background: #22c55e;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      margin: 5px;
    }
    .download-btn:hover {
      background: #16a34a;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🥬 Haldeki Favicon Generator</h1>

    <div class="instructions">
      <h3>Nasıl Kullanılır?</h3>
      <ol>
        <li>Aşağıdaki ikonlar otomatik olarak oluşturulur</li>
        <li>Her "İndir" butonuna tıklayarak dosyaları kaydedin</li>
        <li>Dosyaları <code>public/</code> klasörüne koyun:</li>
        <ul>
          <li><code>apple-touch-icon.png</code> (180x180)</li>
          <li><code>favicon-16x16.png</code> (16x16)</li>
          <li><code>favicon-32x32.png</code> (32x32)</li>
        </ul>
      </ol>
    </div>

    <h2>Oluşturulan Faviconlar</h2>
    <div id="favicons"></div>

    <script>
      const svgContent = ${JSON.stringify(svgContent)};

      function createFavicon(size, name) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        const img = new Image();
        const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        img.onload = function() {
          ctx.clearRect(0, 0, size, size);
          ctx.drawImage(img, 0, 0, size, size);
          URL.revokeObjectURL(url);

          const container = document.getElementById('favicons');
          const div = document.createElement('div');
          div.style.margin = '20px 0';
          div.innerHTML = \`
            <h3>\${name} (\${size}x\${size})</h3>
            <canvas id="\${name}" width="\${size}" height="\${size}"></canvas>
            <button class="download-btn" onclick="downloadFavicon('\${name}', \${size})">İndir</button>
          \`;
          container.appendChild(div);

          const faviconCanvas = document.getElementById(name);
          const faviconCtx = faviconCanvas.getContext('2d');
          faviconCtx.drawImage(img, 0, 0, size, size);
        };

        img.src = url;
      }

      function downloadFavicon(name, size) {
        const canvas = document.getElementById(name);
        const link = document.createElement('a');
        link.download = name + '.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
      }

      // Create favicons on load
      window.onload = function() {
        createFavicon(180, 'apple-touch-icon');
        createFavicon(32, 'favicon-32x32');
        createFavicon(16, 'favicon-16x16');
      };
    </script>
  </div>
</body>
</html>
`;

fs.writeFileSync(
  path.join(__dirname, 'favicon-generator.html'),
  htmlTemplate
);

console.log('✅ Favicon generator created: scripts/favicon-generator.html');
console.log('📖 Open this file in your browser to download the favicons');
