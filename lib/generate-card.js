const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function generateCardSVG(text, outputPath) {
  const maxChars = 180;
  const displayText = text.length > maxChars ? text.substring(0, maxChars) + '...' : text;
  const lines = [];
  let current = '';
  for (const word of displayText.split(' ')) {
    if ((current + ' ' + word).length > 42) { lines.push(current); current = word; }
    else current = (current ? current + ' ' : '') + word;
  }
  if (current) lines.push(current);

  const lineHeight = 28;
  const padding = 36;
  const textStartY = 90;
  const cardH = Math.max(320, textStartY + lines.length * lineHeight + 80);
  const cardW = 600;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${cardW}" height="${cardH}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0515"/>
      <stop offset="50%" style="stop-color:#15082e"/>
      <stop offset="100%" style="stop-color:#0a0515"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#00d4ff"/>
      <stop offset="100%" style="stop-color:#8b5cf6"/>
    </linearGradient>
    <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:rgba(0,212,255,0.15)"/>
      <stop offset="100%" style="stop-color:rgba(139,92,246,0.15)"/>
    </linearGradient>
  </defs>
  <rect width="${cardW}" height="${cardH}" rx="16" fill="url(#bg)"/>
  <rect x="12" y="12" width="${cardW-24}" height="${cardH-24}" rx="12" fill="none" stroke="url(#glow)" stroke-width="1"/>
  <rect x="0" y="0" width="${cardW}" height="4" fill="url(#accent)" rx="2"/>
  <text x="30" y="52" font-family="Georgia,serif" font-size="20" fill="#fbbf24" font-weight="bold">SOULVERSE</text>
  <text x="${cardW-30}" y="52" font-family="monospace" font-size="11" fill="#665577" text-anchor="end">buyasoul.online</text>
  <line x1="30" y1="66" x2="${cardW-30}" y2="66" stroke="#1a1a2e" stroke-width="1"/>
  ${lines.map((l, i) => `<text x="${padding}" y="${textStartY + i * lineHeight}" font-family="'Helvetica Neue',Arial,sans-serif" font-size="17" fill="#e2e8f0">${escapeXml(l)}</text>`).join('\n')}
  <rect x="30" y="${cardH-56}" width="${cardW-60}" height="28" rx="14" fill="url(#accent)" opacity="0.15"/>
  <text x="${cardW/2}" y="${cardH-38}" font-family="monospace" font-size="11" fill="#8b5cf6" text-anchor="middle">PLT · Profit + Love - Tax · ${new Date().toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'})}</text>
</svg>`;

  fs.writeFileSync(outputPath, svg);
  return outputPath;
}

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function convertSVGtoPNG(svgPath, pngPath) {
  try {
    execSync(`rsvg-convert "${svgPath}" -o "${pngPath}"`, { stdio: 'pipe', timeout: 10000 });
    return true;
  } catch {
    try {
      execSync(`convert "${svgPath}" "${pngPath}"`, { stdio: 'pipe', timeout: 10000 });
      return true;
    } catch {
      return false;
    }
  }
}

function generateCard(text, outputDir) {
  const svgPath = path.join(outputDir, 'card.svg');
  const pngPath = path.join(outputDir, 'card.png');
  generateCardSVG(text, svgPath);
  const ok = convertSVGtoPNG(svgPath, pngPath);
  if (!ok) return null;
  return pngPath;
}

module.exports = { generateCardSVG, generateCard, convertSVGtoPNG };
