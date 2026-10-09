
const $ = (id) => document.getElementById(id);

const fileInput = $("fileInput");
const preview = $("previewContent");
const mediaList = $("mediaList");
const timeline = $("timeline");
const status = $("status");

let clips = [];
let activeClip = null;
let currentFilter = "none";
let overlayText = "";

function notify(message) {
  status.textContent = message;
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) seconds = 0;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

$("importBtn").addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", (event) => {
  const files = Array.from(event.target.files || []);

  for (const file of files) {
    if (!file.type.startsWith("video/") &&
        !file.type.startsWith("image/") &&
        !file.type.startsWith("audio/")) {
      continue;
    }

    clips.push({
      id: crypto.randomUUID ? crypto.randomUUID() :
        `${Date.now()}-${Math.random()}`,
      file,
      name: file.name,
      type: file.type,
      url: URL.createObjectURL(file)
    });
  }

  renderLists();

  if (!activeClip && clips.length) {
    selectClip(clips[0].id);
  } else {
    notify(`${files.length} archivo(s) procesado(s).`);
  }

  fileInput.value = "";
});

function renderLists() {
  mediaList.replaceChildren();
  timeline.replaceChildren();

  if (!clips.length) {
    const message = document.createElement("p");
    message.className = "muted";
    message.textContent = "Importa medios para comenzar.";
    mediaList.append(message);
    timeline.append(message.cloneNode(true));
    return;
  }

  clips.forEach((clip) => {
    const item = document.createElement("div");
    item.className = "media-item";
    item.textContent = `${iconFor(clip.type)} ${clip.name}`;
    mediaList.append(item);

    const button = document.createElement("button");
    button.className = "clip" +
      (activeClip && activeClip.id === clip.id ? " active" : "");
    button.textContent = `${iconFor(clip.type)} ${clip.name}`;
    button.addEventListener("click", () => selectClip(clip.id));
    timeline.append(button);
  });
}

function iconFor(type) {
  if (type.startsWith("video/")) return "▶";
  if (type.startsWith("image/")) return "▧";
  return "♫";
}

function selectClip(id) {
  const clip = clips.find((item) => item.id === id);
  if (!clip) return;

  activeClip = clip;
  preview.replaceChildren();

  let element;

  if (clip.type.startsWith("video/")) {
    element = document.createElement("video");
    element.src = clip.url;
    element.playsInline = true;
    element.preload = "metadata";
    element.addEventListener("loadedmetadata", updateTime);
    element.addEventListener("timeupdate", updateTime);
    element.addEventListener("ended", () => {
      $("playBtn").textContent = "▶ Reproducir";
    });
  } else if (clip.type.startsWith("image/")) {
    element = document.createElement("img");
    element.src = clip.url;
    element.alt = clip.name;
    $("timeDisplay").textContent = "Imagen";
  } else {
    element = document.createElement("audio");
    element.src = clip.url;
    element.controls = true;
    element.addEventListener("loadedmetadata", updateTime);
    element.addEventListener("timeupdate", updateTime);
  }

  element.id = "activeMedia";
  preview.append(element);

  applyEffects();
  renderLists();
  updateTime();
  notify(`Clip seleccionado: ${clip.name}`);
}

function updateTime() {
  const media = $("activeMedia");
  if (!media) return;

  $("timeDisplay").textContent =
    `${formatTime(media.currentTime)} / ${formatTime(media.duration)}`;
}

$("playBtn").addEventListener("click", async () => {
  const media = $("activeMedia");

  if (!media || !media.tagName.match(/VIDEO|AUDIO/)) {
    notify("Selecciona un vídeo o un audio.");
    return;
  }

  if (media.paused) {
    try {
      await media.play();
      $("playBtn").textContent = "Ⅱ Pausar";
    } catch {
      notify("No se pudo reproducir este archivo.");
    }
  } else {
    media.pause();
    $("playBtn").textContent = "▶ Reproducir";
  }
});

function applyEffects() {
  const media = $("activeMedia");
  if (!media) return;

  const brightness = Number($("brightness").value);
  const contrast = Number($("contrast").value);
  const saturation = Number($("saturation").value);
  const blur = Number($("blur").value);

  const presets = {
    none: "",
    bw: "grayscale(100%)",
    sepia: "sepia(100%)"
  };

  media.style.filter =
    `brightness(${brightness}%) contrast(${contrast}%) ` +
    `saturate(${saturation}%) blur(${blur}px) ${presets[currentFilter]}`;
}

[
  ["brightness", "brightnessValue", "%"],
  ["contrast", "contrastValue", "%"],
  ["saturation", "saturationValue", "%"],
  ["blur", "blurValue", " px"]
].forEach(([control, output, suffix]) => {
  $(control).addEventListener("input", () => {
    $(output).textContent = $(control).value + suffix;
    applyEffects();
  });
});

document.querySelectorAll(".filter").forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    applyEffects();
    notify(`Filtro seleccionado: ${button.textContent}`);
  });
});

$("addText").addEventListener("click", () => {
  overlayText = $("textInput").value.trim();
  $("textOverlay").textContent = overlayText;
  notify(overlayText ? "Texto añadido a la previsualización." : "Escribe un texto primero.");
});

$("removeText").addEventListener("click", () => {
  overlayText = "";
  $("textOverlay").textContent = "";
  $("textInput").value = "";
  notify("Texto eliminado.");
});

$("saveProject").addEventListener("click", () => {
  const project = {
    app: "XLIP Studio",
    version: "0.1",
    savedAt: new Date().toISOString(),
    clips: clips.map((clip) => ({
      name: clip.name,
      type: clip.type
    })),
    effects: {
      brightness: $("brightness").value,
      contrast: $("contrast").value,
      saturation: $("saturation").value,
      blur: $("blur").value,
      filter: currentFilter
    },
    text: overlayText
  };

  const blob = new Blob(
    [JSON.stringify(project, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "xlip-proyecto.json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  notify("Proyecto descargado como archivo JSON.");
});

renderLists();
