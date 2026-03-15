import "../style.css";
import { requireAuth } from "../auth";
import { renderNavbar } from "../components/navbar";
import { supabase } from "../lib/supabase";
import type { Product } from "../types";
import { CATEGORIES } from "../types";
import { url, navigate } from "../lib/navigate";
import { renderScanButton } from "../components/barcode-scanner";

await requireAuth();
renderNavbar(document.getElementById("navbar")!, "产品");

const app = document.getElementById("app")!;
const id = new URLSearchParams(window.location.search).get("id");

if (!id) {
  navigate("/pages/products.html");
}

const { data, error: fetchError } = await supabase
  .from("products")
  .select("*")
  .eq("id", id!)
  .single();

if (fetchError || !data) {
  app.innerHTML = `<p class="text-red-500 text-sm">未找到产品。</p>`;
} else {
  const product = data as Product;

  app.innerHTML = `
    <div class="mb-6">
      <a href="${url("/pages/products.html")}" class="text-sm text-indigo-600 hover:underline">← 返回产品列表</a>
      <h1 class="text-2xl font-bold text-gray-900 mt-2">编辑产品</h1>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div id="error-msg" class="hidden text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4"></div>
      <form id="product-form" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">名称 <span class="text-red-500">*</span></label>
          <input id="name" type="text" required value="${product.name}"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">分类</label>
          <select id="category"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
            ${CATEGORIES.map((c) => `<option value="${c}" ${c === product.category ? "selected" : ""}>${c}</option>`).join("")}
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">积分倍率</label>
          <input id="reward_multiplier" type="number" step="0.01" min="0" value="${product.reward_multiplier}"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">原价（¥）</label>
            <input id="original_price" type="number" step="0.01" min="0" value="${product.original_price ?? ""}"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">会员价（¥）</label>
            <input id="member_price" type="number" step="0.01" min="0" value="${product.member_price ?? ""}"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">条形码 / 二维码</label>
          <input id="barcode" type="text" value="${product.barcode ?? ""}" placeholder="可选，用于扫码快速选产品"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <div id="barcode-scan-btn"></div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">库存（只读）</label>
          <input type="number" value="${product.quantity}" disabled
            class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
          <p class="text-xs text-gray-400 mt-1">库存由入库和销售记录自动管理。</p>
        </div>
        <div class="flex gap-3 pt-2">
          <button type="submit"
            class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2 rounded-lg text-sm transition">
            保存修改
          </button>
          <button type="button" id="delete-btn"
            class="bg-white hover:bg-red-50 text-red-600 border border-red-200 font-semibold px-6 py-2 rounded-lg text-sm transition">
            删除
          </button>
        </div>
      </form>
    </div>
  `;

  const form = document.getElementById("product-form") as HTMLFormElement;
  const errorMsg = document.getElementById("error-msg")!;

  // Scan button populates the barcode field
  renderScanButton(document.getElementById("barcode-scan-btn")!, (barcode) => {
    (document.getElementById("barcode") as HTMLInputElement).value = barcode;
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorMsg.classList.add("hidden");

    const { error } = await supabase
      .from("products")
      .update({
        name: (
          document.getElementById("name") as HTMLInputElement
        ).value.trim(),
        category: (document.getElementById("category") as HTMLSelectElement)
          .value,
        reward_multiplier: parseFloat(
          (document.getElementById("reward_multiplier") as HTMLInputElement)
            .value,
        ),
        original_price: (document.getElementById("original_price") as HTMLInputElement).value
          ? parseFloat((document.getElementById("original_price") as HTMLInputElement).value)
          : null,
        member_price: (document.getElementById("member_price") as HTMLInputElement).value
          ? parseFloat((document.getElementById("member_price") as HTMLInputElement).value)
          : null,
        barcode: (document.getElementById("barcode") as HTMLInputElement).value.trim() || null,
      })
      .eq("id", id!);

    if (error) {
      errorMsg.textContent = error.message;
      errorMsg.classList.remove("hidden");
    } else {
      navigate("/pages/products.html");
    }
  });

  document.getElementById("delete-btn")?.addEventListener("click", async () => {
    if (!confirm(`删除"${product.name}"？此操作无法撤销。`)) return;
    const { error } = await supabase.from("products").delete().eq("id", id!);
    if (error) {
      alert(error.message);
    } else {
      navigate("/pages/products.html");
    }
  });
}
