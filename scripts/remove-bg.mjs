import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';

const INPUT  = 'public/images/dogtag.png';
const OUTPUT = 'public/images/dogtag.png';

const image  = sharp(INPUT);
const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });

const { width, height, channels } = info; // channels = 4 (RGBA)
const pixels = new Uint8Array(data);

// --- BFS flood-fill from the four corners to mark white/near-white pixels as transparent ---
const isWhitish = (i) => {
  const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
  // tolerance: pixels brighter than 220 em todos os canais
  return r > 210 && g > 210 && b > 210;
};

const visited  = new Uint8Array(width * height);
const queue    = [];

const enqueue = (x, y) => {
  if (x < 0 || x >= width || y < 0 || y >= height) return;
  const idx = y * width + x;
  if (visited[idx]) return;
  const pi = idx * channels;
  if (!isWhitish(pi)) return;
  visited[idx] = 1;
  queue.push(idx);
};

// Seed from all four edges
for (let x = 0; x < width; x++)  { enqueue(x, 0); enqueue(x, height - 1); }
for (let y = 0; y < height; y++) { enqueue(0, y); enqueue(width - 1, y); }

// BFS
while (queue.length) {
  const idx = queue.pop();
  const x   = idx % width;
  const y   = (idx - x) / width;
  const pi  = idx * channels;

  // Make fully transparent
  pixels[pi + 3] = 0;

  enqueue(x - 1, y);
  enqueue(x + 1, y);
  enqueue(x,     y - 1);
  enqueue(x,     y + 1);
}

// Soft-edge: for pixels on the border of the removed region, feather alpha
for (let y = 1; y < height - 1; y++) {
  for (let x = 1; x < width - 1; x++) {
    const idx = y * width + x;
    const pi  = idx * channels;
    if (pixels[pi + 3] === 255 && isWhitish(pi)) {
      // neighbour that was flood-filled? feather it
      const neighbors = [
        visited[(y-1)*width + x],
        visited[(y+1)*width + x],
        visited[y*width + (x-1)],
        visited[y*width + (x+1)],
      ];
      if (neighbors.some(Boolean)) {
        pixels[pi + 3] = 0;
        visited[idx] = 1;
      }
    }
  }
}

await sharp(Buffer.from(pixels), { raw: { width, height, channels } })
  .png({ compressionLevel: 9 })
  .toFile(OUTPUT);

console.log(`Done → ${OUTPUT}`);
