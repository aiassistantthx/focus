// Generate simple PNG icons for the extension
// Run with: node generate-icons.cjs

const fs = require('fs');
const path = require('path');

function createPNG(size) {
  // Create a minimal PNG with a red circle and white "F"
  // Using raw PNG construction (no external deps)

  const { createCanvas } = (() => {
    // Fallback: create a simple 1-bit PNG manually
    // We'll create a proper SVG-based approach instead
    return { createCanvas: null };
  })();

  // Since we can't use canvas in plain Node, create SVG and note that
  // for production, real PNGs should be generated.
  // For now, create minimal valid PNGs using raw bytes.

  // Minimal PNG: IHDR + IDAT + IEND
  // This creates a solid colored square
  const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function crc32(buf) {
    let crc = 0xFFFFFFFF;
    const table = new Int32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[i] = c;
    }
    for (let i = 0; i < buf.length; i++) {
      crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  function makeChunk(type, data) {
    const typeB = Buffer.from(type);
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const combined = Buffer.concat([typeB, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(combined));
    return Buffer.concat([len, combined, crc]);
  }

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type: RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // Image data: create a red circle on dark background
  const rawRows = [];
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 1;

  for (let y = 0; y < size; y++) {
    const row = [0]; // filter byte (none)
    for (let x = 0; x < size; x++) {
      const dx = x - cx + 0.5;
      const dy = y - cy + 0.5;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= radius) {
        // Inside circle - check if it's the "F" letter area
        const letterLeft = size * 0.32;
        const letterRight = size * 0.68;
        const letterTop = size * 0.22;
        const letterBottom = size * 0.78;
        const barWidth = size * 0.14;
        const midY = size * 0.48;

        const inVertBar = x >= letterLeft && x <= letterLeft + barWidth && y >= letterTop && y <= letterBottom;
        const inTopBar = y >= letterTop && y <= letterTop + barWidth && x >= letterLeft && x <= letterRight;
        const inMidBar = y >= midY && y <= midY + barWidth && x >= letterLeft && x <= letterRight * 0.88;

        if (inVertBar || inTopBar || inMidBar) {
          row.push(255, 255, 255); // White F
        } else {
          row.push(231, 76, 60); // #E74C3C red
        }
      } else {
        row.push(0, 0, 0); // Transparent (black for RGB)
      }
    }
    rawRows.push(Buffer.from(row));
  }

  const rawData = Buffer.concat(rawRows);

  // Compress with zlib
  const zlib = require('zlib');
  const compressed = zlib.deflateSync(rawData);

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([PNG_SIGNATURE, ihdrChunk, idatChunk, iendChunk]);
}

const sizes = [16, 32, 48, 128];
const outDir = path.join(__dirname, 'public', 'icons');

for (const size of sizes) {
  const png = createPNG(size);
  fs.writeFileSync(path.join(outDir, `icon-${size}.png`), png);
  console.log(`Created icon-${size}.png`);
}
