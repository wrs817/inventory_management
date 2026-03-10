import "../style.css";
import { requireAuth, getUser } from "../auth";
import { renderNavbar } from "../components/navbar";
import { supabase } from "../lib/supabase";
import { url, navigate } from "../lib/navigate";
import { CATEGORIES } from "../types";

await requireAuth();
renderNavbar(document.getElementById("navbar")!, "产品");

const app = document.getElementById("app")!;

app.innerHTML = `
  <div class="mb-6">
    <a href="${url("/pages/products.html")}" class="text-sm text-indigo-600 hover:underline">← 返回产品列表</a>
    <h1 class="text-2xl font-bold text-gray-900 mt-2">新增产品</h1>
  </div>

  <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
    <div id="error-msg" class="hidden text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4"></div>
    <form id="product-form" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">名称 <span class="text-red-500">*</span></label>
        <input id="name" type="text" required
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">分类</label>
        <select id="category"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
          ${CATEGORIES.map((c) => `<option value="${c}">${c}</option>`).join("")}
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">积分倍率</label>
        <input id="reward_multiplier" type="number" step="0.01" min="0" value="1"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div class="pt-2">
        <button type="submit"
          class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2 rounded-lg text-sm transition">
          保存产品
        </button>
      </div>
    </form>
  </div>
`;

const form = document.getElementById("product-form") as HTMLFormElement;
const errorMsg = document.getElementById("error-msg")!;

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorMsg.classList.add("hidden");

  const user = await getUser();
  if (!user) return;

  const { error } = await supabase.from("products").insert({
    user_id: user.id,
    name: (document.getElementById("name") as HTMLInputElement).value.trim(),
    category: (document.getElementById("category") as HTMLSelectElement).value,
    reward_multiplier: parseFloat(
      (document.getElementById("reward_multiplier") as HTMLInputElement).value,
    ),
    quantity: 0,
  });

  if (error) {
    errorMsg.textContent = error.message;
    errorMsg.classList.remove("hidden");
  } else {
    navigate("/pages/products.html");
  }
});
