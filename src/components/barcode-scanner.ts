import { BrowserMultiFormatReader } from "@zxing/browser";

let instanceCount = 0;

export function renderScanButton(
  container: HTMLElement,
  onResult: (barcode: string) => void,
  label = "扫码选产品",
) {
  const uid = `scanner-video-${++instanceCount}`;

  const modal = document.createElement("div");
  modal.className = "fixed inset-0 z-50 flex items-center justify-center bg-black/60";
  modal.style.display = "none";

  const hint = document.createElement("p");
  hint.className = "text-xs text-gray-400 text-center py-3 px-4";
  hint.textContent = "将条形码对准摄像头";

  const video = document.createElement("video") as HTMLVideoElement;
  video.id = uid;
  video.setAttribute("playsinline", "");
  video.style.cssText = "width:100%;height:300px;object-fit:cover;background:#000;display:block;";

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "text-gray-400 hover:text-gray-600 text-2xl leading-none px-2";
  closeBtn.textContent = "×";

  const header = document.createElement("div");
  header.className = "flex items-center justify-between px-5 py-4 border-b";
  const titleEl = document.createElement("span");
  titleEl.className = "font-semibold text-gray-800";
  titleEl.textContent = "扫描条形码";
  header.appendChild(titleEl);
  header.appendChild(closeBtn);

  const card = document.createElement("div");
  card.className = "bg-white rounded-2xl shadow-xl overflow-hidden mx-4";
  card.style.width = "min(360px, 92vw)";
  card.appendChild(header);
  card.appendChild(video);
  card.appendChild(hint);
  modal.appendChild(card);
  document.body.appendChild(modal);

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium mt-2";
  btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
    <path stroke-linecap="round" stroke-linejoin="round" d="M3 7V5a2 2 0 012-2h2M3 17v2a2 2 0 002 2h2M17 3h2a2 2 0 012 2v2M17 21h2a2 2 0 002-2v-2"/>
    <line x1="8" y1="12" x2="16" y2="12" stroke-linecap="round"/>
  </svg> ${label}`;
  container.appendChild(btn);

  let reader: BrowserMultiFormatReader | null = null;

  const stopScanner = () => {
    if (reader) {
      BrowserMultiFormatReader.releaseAllStreams();
      reader = null;
    }
    modal.style.display = "none";
  };

  const startScanner = async () => {
    hint.textContent = "将条形码对准摄像头";
    modal.style.display = "flex";
    try {
      reader = new BrowserMultiFormatReader();
      await reader.decodeFromConstraints(
        { video: { facingMode: "environment" } },
        video,
        (result, err) => {
          if (result) {
            stopScanner();
            onResult(result.getText());
          }
          if (err && err.name !== "NotFoundException") {
            console.error("Scan error:", err);
          }
        },
      );
    } catch (err) {
      console.error("Camera error:", err);
      hint.textContent = "无法访问摄像头，请检查权限设置后重试。";
    }
  };

  btn.addEventListener("click", startScanner);
  closeBtn.addEventListener("click", stopScanner);
  modal.addEventListener("click", (e) => { if (e.target === modal) stopScanner(); });
}
