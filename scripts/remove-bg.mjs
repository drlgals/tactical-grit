import sharp from 'sharp';

const INPUT  = 'public/images/dogtag.png';
const OUTPUT = 'public/images/dogtag.png';

const { data, info } = await sharp(INPUT)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width, height, channels } = info;
const px = new Uint8Array(data);

const idx  = (x, y) => (y * width + x) * channels;
const isWhitish = (i, tol) => px[i] > tol && px[i+1] > tol && px[i+2] > tol;
const setTransparent = (i) => { px[i+3] = 0; };

// ── Stage 1: BFS flood-fill from all four edges ──────────────────────────────
// Tolerance 228: slightly above metal highlights (~210-220) but below pure white
const TOL_BFS = 228;
const visited = new Uint8Array(width * height);
const queue   = [];

const enqueue = (x, y) => {
  if (x < 0 || x >= width || y < 0 || y >= height) return;
  const id = y * width + x;
  if (visited[id]) return;
  if (!isWhitish(idx(x, y), TOL_BFS)) return;
  visited[id] = 1;
  queue.push(id);
};

for (let x = 0; x < width;  x++) { enqueue(x, 0); enqueue(x, height - 1); }
for (let y = 0; y < height; y++) { enqueue(0, y); enqueue(width - 1, y); }

while (queue.length) {
  const id = queue.pop();
  const x  = id % width;
  const y  = (id - x) / width;
  setTransparent(idx(x, y));
  enqueue(x-1, y); enqueue(x+1, y);
  enqueue(x, y-1); enqueue(x, y+1);
}

// ── Stage 2: Global pass — remove enclosed white islands ─────────────────────
// Any fully-white pixel (>240 all channels) still opaque is interior background.
// Chain links create enclosed pockets unreachable from the border BFS.
const TOL_GLOBAL = 240;
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const i = idx(x, y);
    if (px[i+3] > 0 && isWhitish(i, TOL_GLOBAL)) {
      setTransparent(i);
    }
  }
}

// ── Stage 3: Grow transparency 2 pixels outward to clean anti-aliased edges ──
// For pixels adjacent to transparent area, blend alpha based on brightness.
for (let pass = 0; pass < 2; pass++) {
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = idx(x, y);
      if (px[i+3] === 0) continue; // already transparent

      // Check if any 8-neighbour is transparent
      const hasTransparentNeighbour =
        px[idx(x-1, y-1)+3] === 0 || px[idx(x, y-1)+3] === 0 || px[idx(x+1, y-1)+3] === 0 ||
        px[idx(x-1, y  )+3] === 0 ||                             px[idx(x+1, y  )+3] === 0 ||
        px[idx(x-1, y+1)+3] === 0 || px[idx(x, y+1)+3] === 0 || px[idx(x+1, y+1)+3] === 0;

      if (!hasTransparentNeighbour) continue;

      // Brightness 0-255
      const brightness = (px[i] * 0.299 + px[i+1] * 0.587 + px[i+2] * 0.114);

      // Pixels brighter than 200 on the border → fade alpha proportionally
      if (brightness > 200) {
        const fade = (brightness - 200) / 55; // 0 at 200, 1 at 255
        px[i+3] = Math.round(px[i+3] * (1 - fade));
      }
    }
  }
}

// ── Stage 4: Soft-matte — feather remaining near-white border pixels ─────────
// One more targeted pass: border pixels that are still near-white get
// partial alpha to avoid a hard jaggy edge.
for (let y = 1; y < height - 1; y++) {
  for (let x = 1; x < width - 1; x++) {
    const i = idx(x, y);
    if (px[i+3] === 0) continue;

    const brightness = (px[i] * 0.299 + px[i+1] * 0.587 + px[i+2] * 0.114);
    if (brightness > 215) {
      const hasTransparentNeighbour =
        px[idx(x-1, y-1)+3] === 0 || px[idx(x, y-1)+3] === 0 || px[idx(x+1, y-1)+3] === 0 ||
        px[idx(x-1, y  )+3] === 0 ||                             px[idx(x+1, y  )+3] === 0 ||
        px[idx(x-1, y+1)+3] === 0 || px[idx(x, y+1)+3] === 0 || px[idx(x+1, y+1)+3] === 0;
      if (hasTransparentNeighbour) {
        const fade = Math.min(1, (brightness - 215) / 40);
        px[i+3] = Math.round(px[i+3] * (1 - fade * 0.85));
      }
    }
  }
}

await sharp(Buffer.from(px), { raw: { width, height, channels } })
  .png({ compressionLevel: 9 })
  .toFile(OUTPUT);

console.log(`Done → ${OUTPUT}`);
