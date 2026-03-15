import "../style.css";
import { requireAuth } from "../auth";
import { renderNavbar } from "../components/navbar";
import { supabase } from "../lib/supabase";
import type { Product } from "../types";
import { CATEGORIES } from "../types";
import { url } from "../lib/navigate";

await requireAuth();
renderNavbar(document.getElementById("navbar")!, "产品");

const app = document.getElementById("app")!;

async function loadProducts(search = "", category = "") {
  app.innerHTML = `<p class="text-gray-400 text-sm">加载中…</p>`;

  let query = supabase.from("products").select("id, name, category, quantity, reward_multiplier, original_price, member_price").order("name");
  if (search) query = query.ilike("name", `%${search}%`);
  if (category) query = query.eq("category", category);
  const { data, error } = await query;

  if (error) {
    app.innerHTML = `<p class="text-red-500 text-sm">${error.message}</p>`;
    return;
  }
  const products = (data ?? []) as Product[];

  const categories = CATEGORIES;

  app.innerHTML = `
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">产品</h1>
      <a href="${url("/pages/products-new.html")}"
        class="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
        + 新增产品
      </a>
    </div>

    <div class="flex gap-3 mb-5">
      <input id="search" type="text" placeholder="按名称搜索…" value="${search}"
        class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-1" />
      <select id="category-filter"
        class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48 bg-white">
        <option value="">全部分类</option>
        ${categories.map((c) => `<option value="${c}" ${c === category ? "selected" : ""}>${c}</option>`).join("")}
      </select>
    </div>

    <div class="-mx-6 sm:mx-0 bg-white sm:rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      ${
        products.length === 0
          ? '<p class="text-sm text-gray-400 p-6">未找到产品。</p>'
          : `<!-- Mobile cards -->
            <ul class="sm:hidden divide-y divide-gray-100">
              ${products.map((p) => `
                <li class="px-4 py-4">
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="font-semibold text-gray-900">${p.name}</span>
                        <span class="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">${p.category}</span>
                      </div>
                      <div class="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                        <span>库存 <strong class="${p.quantity <= 5 ? "text-red-600" : "text-gray-700"}">${p.quantity}</strong></span>
                        ${p.original_price != null ? `<span>原价 <strong class="text-gray-700">¥${(p.original_price as number).toFixed(2)}</strong></span>` : ""}
                        ${p.member_price != null ? `<span>会员价 <strong class="text-gray-700">¥${(p.member_price as number).toFixed(2)}</strong></span>` : ""}
                        <span>积分 <strong class="text-gray-700">${p.reward_multiplier}×</strong></span>
                      </div>
                    </div>
                    <a href="${url("/pages/products-edit.html")}?id=${p.id}"
                      class="shrink-0 text-indigo-600 hover:underline text-xs font-medium pt-0.5">编辑</a>
                  </div>
                </li>`).join("")}
            </ul>
            <!-- Desktop table -->
            <table class="hidden sm:table w-full text-sm">
              <thead class="bg-gray-50 text-gray-500 text-left">
                <tr>
                  <th class="px-4 py-3 font-medium">名称</th>
                  <th class="px-4 py-3 font-medium">分类</th>
                  <th class="px-4 py-3 font-medium">库存</th>
                  <th class="px-4 py-3 font-medium">原价</th>
                  <th class="px-4 py-3 font-medium">会员价</th>
                  <th class="px-4 py-3 font-medium">积分倍率</th>
                  <th class="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                ${products.map((p) => `
                  <tr class="border-t border-gray-100 hover:bg-gray-50">
                    <td class="px-4 py-3 font-medium text-gray-900">${p.name}</td>
                    <td class="px-4 py-3 text-gray-500">${p.category}</td>
                    <td class="px-4 py-3 ${p.quantity <= 5 ? "text-red-600 font-semibold" : "text-gray-700"}">${p.quantity}</td>
                    <td class="px-4 py-3 text-gray-700">${p.original_price != null ? "¥" + (p.original_price as number).toFixed(2) : "—"}</td>
                    <td class="px-4 py-3 text-gray-700">${p.member_price != null ? "¥" + (p.member_price as number).toFixed(2) : "—"}</td>
                    <td class="px-4 py-3 text-gray-700">${p.reward_multiplier}×</td>
                    <td class="px-4 py-3 text-right">
                      <a href="${url("/pages/products-edit.html")}?id=${p.id}"
                        class="text-indigo-600 hover:underline text-xs font-medium">编辑</a>
                    </td>
                  </tr>`).join("")}
              </tbody>
            </table>`
      }
    </div>
  `;

  document.getElementById("search")?.addEventListener("input", (e) => {
    loadProducts(
      (e.target as HTMLInputElement).value,
      (document.getElementById("category-filter") as HTMLSelectElement).value,
    );
  });
  document
    .getElementById("category-filter")
    ?.addEventListener("change", (e) => {
      loadProducts(
        (document.getElementById("search") as HTMLInputElement).value,
        (e.target as HTMLSelectElement).value,
      );
    });
}

await loadProducts();
