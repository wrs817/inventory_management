import "../style.css";
import { requireAuth, getUser } from "../auth";
import { renderNavbar } from "../components/navbar";
import { supabase } from "../lib/supabase";
import type { Product } from "../types";
import { url, navigate } from "../lib/navigate";

await requireAuth();
renderNavbar(document.getElementById("navbar")!, "入库");

const app = document.getElementById("app")!;

const { data: products } = await supabase
  .from("products")
  .select("id, name")
  .order("name");
const productList = (products ?? []) as Pick<Product, "id" | "name">[];

app.innerHTML = `
  <div class="mb-6">
    <a href="${url("/pages/goods-in.html")}" class="text-sm text-indigo-600 hover:underline">← 返回入库列表</a>
    <h1 class="text-2xl font-bold text-gray-900 mt-2">记录入库</h1>
  </div>

  <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
    <div id="error-msg" class="hidden text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4"></div>
    <form id="goods-in-form" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">产品 <span class="text-red-500">*</span></label>
        <select id="product_id" required
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">— 请选择产品 —</option>
          ${productList.map((p) => `<option value="${p.id}">${p.name}</option>`).join("")}
        </select>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">数量 <span class="text-red-500">*</span></label>
          <input id="quantity" type="number" min="1" required
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">进价（¥）<span class="text-red-500">*</span></label>
          <input id="purchase_price" type="number" step="0.01" min="0" required
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
      </div>
      <div class="pt-2">
        <button type="submit"
          class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2 rounded-lg text-sm transition">
          记录入库
        </button>
      </div>
    </form>
  </div>
`;

const form = document.getElementById("goods-in-form") as HTMLFormElement;
const errorMsg = document.getElementById("error-msg")!;

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorMsg.classList.add("hidden");

  const user = await getUser();
  if (!user) return;

  const { error } = await supabase.from("goods_in").insert({
    user_id: user.id,
    product_id: (document.getElementById("product_id") as HTMLSelectElement)
      .value,
    quantity: parseInt(
      (document.getElementById("quantity") as HTMLInputElement).value,
    ),
    purchase_price: parseFloat(
      (document.getElementById("purchase_price") as HTMLInputElement).value,
    ),
  });

  if (error) {
    errorMsg.textContent = error.message;
    errorMsg.classList.remove("hidden");
  } else {
    navigate("/pages/goods-in.html");
  }
});
