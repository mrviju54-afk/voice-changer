import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";
import "./style.css";

const fileInput = document.querySelector("#file");
const effectSelect = document.querySelector("#effect");
const preview = document.querySelector("#preview");
const fileInfo = document.querySelector("#fileInfo");
const statusBox = document.querySelector("#status");
const progressBar = document.querySelector("#progress");
const downloadButton = document.querySelector("#download");

const ffmpeg = new FFmpeg();
let loaded = false;
let selectedFile = null;
let previewUrl = null;
let busy = false;

const base = import.meta.env.BASE_URL;

function setStatus(message) {
  statusBox.textContent = message;
}
function setProgress(value) {
  progressBar.style.width = `${Math.max(0, Math.min(100, value))}%`;
}
function safeName(name) {
  return name.replace(/\.[^.]+$/, "").replace(/[^\w-]+/g, "_").slice(0, 60) || "converted";
}
function filterFor(effect) {
  const filters = {
    none: "",
    male: "asetrate=44100*0.88,aresample=44100,atempo=1.136",
    female: "asetrate=44100*1.18,aresample=44100,atempo=0.847",
    deep: "asetrate=44100*0.72,aresample=44100,atempo=1.389",
    robot: "aecho=0.8:0.88:60:0.4,acrusher=bits=8:mode= log",
    cartoon: "asetrate=44100*1.35,aresample=44100,atempo=0.741",
    echo: "aecho=0.8:0.9:700|900:0.35|0.25",
    alien: "asetrate=44100*1.28,aresample=44100,atempo=0.781,aecho=0.8:0.7:80:0.3",
    monster: "asetrate=44100*0.65,aresample=44100,atempo=1.538,aecho=0.8:0.8:100:0.25",
    helium: "asetrate=44100*1.5,aresample=44100,atempo=0.667",
    telephone: "highpass=f=500,lowpass=f=3000",
    slow: "atempo=0.75",
    fast: "atempo=1.25"
  };
  return filters[effect] ?? "";
}
async function ensureLoaded() {
  if (loaded) return;
  setStatus("Loading audio engine. Please wait...");
  const coreBase = `${base}ffmpeg/`;
  await ffmpeg.load({
    coreURL: await toBlobURL(`${coreBase}ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${coreBase}ffmpeg-core.wasm`, "application/wasm")
  });
  loaded = true;
}
function inputExtension(file) {
  const ext = file.name.toLowerCase().split(".").pop();
  return ext === "mp4" ? "mp4" : "mp3";
}
async function writeInput(file) {
  const ext = inputExtension(file);
  const inputName = `input.${ext}`;
  await ffmpeg.writeFile(inputName, new Uint8Array(await file.arrayBuffer()));
  return { ext, inputName };
}
async function createPreview() {
  if (!selectedFile || busy) return;
  busy = true;
  downloadButton.disabled = true;
  preview.pause();
  preview.removeAttribute("src");
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = null;
  setProgress(0);

  try {
    await ensureLoaded();
    const { inputName } = await writeInput(selectedFile);
    const outputName = "preview.wav";
    const filter = filterFor(effectSelect.value);
    const args = ["-y", "-i", inputName, "-t", "20", "-vn"];
    if (filter) args.push("-af", filter);
    args.push("-c:a", "pcm_s16le", outputName);
    setStatus("Creating 20-second preview...");
    await ffmpeg.exec(args);
    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data], { type: "audio/wav" });
    previewUrl = URL.createObjectURL(blob);
    preview.src = previewUrl;
    preview.load();
    downloadButton.disabled = false;
    setProgress(100);
    setStatus("Preview ready. Listen, then download the full converted file.");
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);
  } catch (error) {
    console.error(error);
    setStatus(`Preview failed: ${error?.message || "Unknown error"}. Try a smaller MP3/MP4 file or another browser.`);
    downloadButton.disabled = true;
  } finally {
    busy = false;
  }
}

fileInput.addEventListener("change", async () => {
  const file = fileInput.files?.[0];
  selectedFile = null;
  downloadButton.disabled = true;
  preview.pause();
  preview.removeAttribute("src");
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = null;
  setProgress(0);

  if (!file) {
    fileInfo.textContent = "No file selected";
    return;
  }
  const ext = inputExtension(file);
  if (!["mp3", "mp4"].includes(ext) || !/\.(mp3|mp4)$/i.test(file.name)) {
    fileInfo.textContent = "Unsupported file. Please choose MP3 or MP4.";
    setStatus("Only MP3 and MP4 files are supported.");
    return;
  }
  selectedFile = file;
  fileInfo.textContent = `${file.name} • ${(file.size / 1024 / 1024).toFixed(2)} MB`;
  await createPreview();
});

effectSelect.addEventListener("change", async () => {
  if (selectedFile) await createPreview();
});

downloadButton.addEventListener("click", async () => {
  if (!selectedFile || busy) return;
  busy = true;
  downloadButton.disabled = true;
  setProgress(0);
  try {
    await ensureLoaded();
    const { ext, inputName } = await writeInput(selectedFile);
    const effect = filterFor(effectSelect.value);
    const outputName = `${safeName(selectedFile.name)}_voice_changed.${ext}`;
    let args = ["-y", "-i", inputName];
    if (ext === "mp3") {
      args.push("-vn");
      if (effect) args.push("-af", effect);
      args.push("-c:a", "libmp3lame", "-q:a", "2", outputName);
    } else {
      if (effect) args.push("-af", effect);
      args.push("-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", outputName);
    }
    setStatus("Converting the full file. Keep this page open...");
    ffmpeg.on("progress", ({ progress }) => setProgress(progress * 100));
    await ffmpeg.exec(args);
    const data = await ffmpeg.readFile(outputName);
    const mime = ext === "mp4" ? "video/mp4" : "audio/mpeg";
    const url = URL.createObjectURL(new Blob([data], { type: mime }));
    const link = document.createElement("a");
    link.href = url;
    link.download = outputName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);
    setProgress(100);
    setStatus("Conversion finished. Your browser should start downloading the file.");
  } catch (error) {
    console.error(error);
    setStatus(`Conversion failed: ${error?.message || "Unknown error"}. The file or codec may not be supported by this browser build.`);
  } finally {
    busy = false;
    downloadButton.disabled = !selectedFile || !previewUrl;
  }
});

window.addEventListener("beforeunload", () => {
  if (previewUrl) URL.revokeObjectURL(previewUrl);
});
