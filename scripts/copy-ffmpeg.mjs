import fs from "node:fs";
import path from "node:path";

const source = path.resolve("node_modules/@ffmpeg/core/dist/umd");
const target = path.resolve("public/ffmpeg");
fs.mkdirSync(target, { recursive: true });

for (const name of ["ffmpeg-core.js", "ffmpeg-core.wasm"]) {
  const from = path.join(source, name);
  if (!fs.existsSync(from)) {
    throw new Error(`Missing ${from}. Check the @ffmpeg/core package installation.`);
  }
  fs.copyFileSync(from, path.join(target, name));
}
console.log("FFmpeg core files copied.");
