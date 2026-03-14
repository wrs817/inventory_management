import { Html5Qrcode } from "html5-qrcode";

/**
 * Renders a scan-button + modal scanner into `container`.
 * Calls `onResult(barcode)` with the decoded string when a code is read.
 */
export function renderScanButton(
  container: HTMLElement,
  onResult: (barcode: string) => void,
) {
  // ── Modal markup ─────────────────────────────────────────────────────────
  const modal = document.createElement("div");
  modal.id = "scanner-modal";
  modal.className =
    "fixed inset-0 z-50 flex items-center justify-center bg-black/60 hidden";
  modal.innerHTML = `
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
      <div class="flex items-center justify-between px-5 py-4 border-b">
        <span class="font-semibold text-gray-800">扫描条形码 / 二维码</span>
        <button id="scanner-close" class="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
      </div>
      <div id="scanner-viewport" class="w-full aspect-square bg-black"></div>
      <p id="scanner-hint" class="text-xs text-gray-400 text-center py-3 px-4">
        将条形码或二维码对准摄像头
      </p>
    </div>
  `;
  document.body.appendChild(modal);

  // ── Scan button ───────────────────────────────────────────────────────────
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className =
    "flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium mt-1";
  btn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round"
        d="M3 7V5a2 2 0 012-2h2M3 17v2a2 2 0 002 2h2M17 3h2a2 2 0 012 2v2M17 21h2a2 2 0 002-2v-2
           M8 12h.01M12 12h.01M16 12h.01" />
    </svg>
    扫码选产品
  `;
  container.appendChild(btn);

  // ── Scanner lifecycle ─────────────────────────────────────────────────────
  let scanner: Html5Qrcode | null = null;

  const startScanner = async () => {
    modal.classList.remove("hidden");
    const viewportId = "scanner-viewport";
    scanner = new Html5Qrcode(viewportId);
    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          stopScanner();
          onResult(decodedText.trim());
        },
        () => {}, // suppress per-frame errors
      );
    } catch {
      document.getElementById("scanner-hint")!.textContent =
        "无法访问摄像头，请检查权限设置。";
    }
  };

  const stopScanner = async () => {
    if (scanner) {
      try {
        await scanner.stop();
      } catch { /* already stopped */ }
      scanner = null;
    }
    modal.classList.add("hidden");
  };

  btn.addEventListener("click", startScanner);
  document.getElementById("scanner-close")!.addEventListener("click", stopScanner);
  // Close on backdrop click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) stopScanner();
  });
}
