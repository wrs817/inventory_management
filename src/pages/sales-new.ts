import "../style.css";
import { requireAuth, getUser } from "../auth";
import { renderNavbar } from "../components/navbar";
import { supabase } from "../lib/supabase";
import type { Product } from "../types";
import { url, navigate } from "../lib/navigate";
import { renderScanButton } from "../components/barcode-scanner";

await requireAuth();
renderNavbar(document.getElementById("navbar")!, "销售");

const app = document.getElementById("app")!;

const { data: products } = await supabase
  .from("products")
  .select("id, name, quantity, barcode, member_price, original_price")
  .order("name");
const productList = (products ?? []) as Pick<
  Product,
  "id" | "name" | "quantity" | "barcode" | "member_price" | "original_price"
>[];

const today = new Date().toISOString().split("T")[0];

app.innerHTML = `
  <div class="mb-6">
    <a href="${url("/pages/sales.html")}" class="text-sm text-indigo-600 hover:underline">← 返回销售列表</a>
    <h1 class="text-2xl font-bold text-gray-900 mt-2">记录销售</h1>
  </div>

  <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
    <div id="error-msg" class="hidden text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4"></div>
    <form id="sale-form" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">产品 <span class="text-red-500">*</span></label>
        <select id="product_id" required
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">— 请选择产品 —</option>
          ${productList.map((p) => `<option value="${p.id}">${p.name}（库存：${p.quantity}）</option>`).join("")}
        </select>
        <div id="scan-btn-container"></div>
      </div>
      <div>
        <label class="text-sm font-medium text-gray-700">客户 <span class="text-red-500">*</span></label>
        <input id="customer" type="text" required
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-1" />
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">数量 <span class="text-red-500">*</span></label>
          <input id="quantity" type="number" min="1" required
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">售价（¥）<span class="text-red-500">*</span></label>
          <input id="sell_price" type="number" step="0.01" min="0" required
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <div id="price-picker" class="hidden flex gap-2 mt-1.5"></div>
        </div>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">销售日期 <span class="text-red-500">*</span></label>
        <input id="sale_date" type="date" required value="${today}"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">备注</label>
        <textarea id="notes" rows="2"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          placeholder="可选"></textarea>
      </div>
      <div class="pt-2">
        <button type="submit"
          class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2 rounded-lg text-sm transition">
          记录销售
        </button>
      </div>
    </form>
  </div>
`;

const form = document.getElementById("sale-form") as HTMLFormElement;
const errorMsg = document.getElementById("error-msg")!;
const productSelect = document.getElementById("product_id") as HTMLSelectElement;
const sellPriceInput = document.getElementById("sell_price") as HTMLInputElement;
const pricePicker = document.getElementById("price-picker")!;

const updatePricePicker = (productId: string) => {
  const match = productList.find((p) => p.id === productId);
  pricePicker.innerHTML = "";
  if (!match) { pricePicker.classList.add("hidden"); return; }

  const options: { label: string; value: number | null }[] = [
    { label: "会员价", value: match.member_price },
    { label: "原价", value: match.original_price },
  ];

  const hasAny = options.some((o) => o.value != null);
  if (!hasAny) { pricePicker.classList.add("hidden"); return; }

  pricePicker.classList.remove("hidden");
  options.forEach(({ label, value }) => {
    if (value == null) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "text-xs px-2 py-1 rounded border border-indigo-300 text-indigo-600 hover:bg-indigo-50 transition";
    btn.textContent = `${label} ¥${value.toFixed(2)}`;
    btn.addEventListener("click", () => { sellPriceInput.value = value.toString(); });
    pricePicker.appendChild(btn);
  });

  // Auto-fill member price by default
  if (match.member_price != null) sellPriceInput.value = match.member_price.toString();
};

productSelect.addEventListener("change", () => updatePricePicker(productSelect.value));

// Wire up scan button
renderScanButton(document.getElementById("scan-btn-container")!, (barcode) => {
  const match = productList.find((p) => p.barcode === barcode);
  if (match) {
    productSelect.value = match.id;
    updatePricePicker(match.id);
  } else {
    errorMsg.textContent = `未找到条形码对应的产品：${barcode}`;
    errorMsg.classList.remove("hidden");
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorMsg.classList.add("hidden");

  const user = await getUser();
  if (!user) return;

  const productId = (document.getElementById("product_id") as HTMLSelectElement)
    .value;
  const quantity = parseInt(
    (document.getElementById("quantity") as HTMLInputElement).value,
  );

  // Check there's enough stock
  const product = productList.find((p) => p.id === productId);
  if (product && quantity > product.quantity) {
    errorMsg.textContent = `库存不足，当前库存：${product.quantity}`;
    errorMsg.classList.remove("hidden");
    return;
  }

  const { error } = await supabase.from("sales").insert({
    user_id: user.id,
    product_id: productId,
    customer: (document.getElementById("customer") as HTMLInputElement).value.trim(),
    quantity,
    sell_price: parseFloat((document.getElementById("sell_price") as HTMLInputElement).value),
    sale_date: (document.getElementById("sale_date") as HTMLInputElement).value,
    notes: (document.getElementById("notes") as HTMLTextAreaElement).value.trim() || null,
  });

  if (error) {
    errorMsg.textContent = error.message;
    errorMsg.classList.remove("hidden");
  } else {
    navigate("/pages/sales.html");
  }
});
