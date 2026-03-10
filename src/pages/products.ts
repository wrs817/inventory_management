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

  let query = supabase.from("products").select("*").order("name");
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

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      ${
        products.length === 0
          ? '<p class="text-sm text-gray-400 p-6">未找到产品。</p>'
          : `<table class="w-full text-sm">
              <thead class="bg-gray-50 text-gray-500 text-left">
                <tr>
                  <th class="px-4 py-3 font-medium">名称</th>
                  <th class="px-4 py-3 font-medium">分类</th>
                  <th class="px-4 py-3 font-medium">库存</th>
                  <th class="px-4 py-3 font-medium">积分倍率</th>
                  <th class="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                ${products
                  .map(
                    (p) => `
                  <tr class="border-t border-gray-100 hover:bg-gray-50">
                    <td class="px-4 py-3 font-medium text-gray-900">${p.name}</td>
                    <td class="px-4 py-3 text-gray-500">${p.category}</td>
                    <td class="px-4 py-3 ${p.quantity <= 5 ? "text-red-600 font-semibold" : "text-gray-700"}">${p.quantity}</td>
                    <td class="px-4 py-3 text-gray-700">${p.reward_multiplier}×</td>
                    <td class="px-4 py-3 text-right">
                      <a href="${url("/pages/products-edit.html")}?id=${p.id}"
                        class="text-indigo-600 hover:underline text-xs font-medium">编辑</a>
                    </td>
                  </tr>
                `,
                  )
                  .join("")}
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
