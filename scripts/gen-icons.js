const fs = require('fs');
const path = require('path');

function createIcon(size) {
  const fontSize = Math.round(size * 0.32);
  const subSize = Math.round(size * 0.12);
  const rx = Math.round(size * 0.18);
  return `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'>
  <rect width='${size}' height='${size}' fill='#18181b' rx='${rx}'/>
  <text x='50%' y='44%' text-anchor='middle' dominant-baseline='middle' font-family='system-ui,-apple-system,sans-serif' font-size='${fontSize}' font-weight='900' fill='white' letter-spacing='-1'>WOX</text>
  <text x='50%' y='66%' text-anchor='middle' dominant-baseline='middle' font-family='system-ui,-apple-system,sans-serif' font-size='${subSize}' font-weight='500' fill='#a1a1aa'>.11</text>
</svg>`;
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const dir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

sizes.forEach(s => {
  fs.writeFileSync(path.join(dir, `icon-${s}x${s}.png`), createIcon(s));
  console.log(`Created icon-${s}x${s}.png`);
});

const ssDir = path.join(__dirname, '..', 'public', 'screenshots');
if (!fs.existsSync(ssDir)) fs.mkdirSync(ssDir, { recursive: true });

const desktop = `<svg xmlns='http://www.w3.org/2000/svg' width='1280' height='720' viewBox='0 0 1280 720'>
  <rect width='1280' height='720' fill='#ffffff'/>
  <rect width='1280' height='64' fill='#18181b'/>
  <text x='640' y='40' text-anchor='middle' font-family='system-ui' font-size='28' font-weight='900' fill='white' letter-spacing='2'>WOX.11</text>
  <rect x='80' y='120' width='280' height='360' rx='12' fill='#f4f4f5'/>
  <rect x='400' y='120' width='280' height='360' rx='12' fill='#f4f4f5'/>
  <rect x='720' y='120' width='280' height='360' rx='12' fill='#f4f4f5'/>
  <text x='640' y='560' text-anchor='middle' font-family='system-ui' font-size='20' fill='#71717a'>Premium Fashion Store</text>
</svg>`;

const mobile = `<svg xmlns='http://www.w3.org/2000/svg' width='390' height='844' viewBox='0 0 390 844'>
  <rect width='390' height='844' fill='#ffffff' rx='20'/>
  <rect width='390' height='56' fill='#18181b' rx='20'/>
  <rect y='20' width='390' height='36' fill='#18181b'/>
  <text x='195' y='42' text-anchor='middle' font-family='system-ui' font-size='20' font-weight='900' fill='white'>WOX.11</text>
  <rect x='24' y='80' width='342' height='200' rx='12' fill='#f4f4f5'/>
  <rect x='24' y='300' width='166' height='240' rx='12' fill='#f4f4f5'/>
  <rect x='200' y='300' width='166' height='240' rx='12' fill='#f4f4f5'/>
  <text x='195' y='600' text-anchor='middle' font-family='system-ui' font-size='16' fill='#71717a'>Shop Premium Fashion</text>
</svg>`;

fs.writeFileSync(path.join(ssDir, 'desktop.svg'), desktop);
fs.writeFileSync(path.join(ssDir, 'mobile.svg'), mobile);
console.log('Screenshots created');
