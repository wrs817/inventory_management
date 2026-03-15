import "../style.css";
import { requireAuth } from "../auth";
import { renderNavbar } from "../components/navbar";
import { supabase } from "../lib/supabase";
import type { Sale } from "../types";
import { url } from "../lib/navigate";

await requireAuth();
renderNavbar(document.getElementById("navbar")!, "销售");

const app = document.getElementById("app")!;
app.innerHTML = `<p class="text-gray-400 text-sm">Loading…</p>`;

const { data, error } = await supabase
  .from("sales")
  .select("id, product_id, customer, sell_price, quantity, sale_date, notes, products(name)")
  .order("sale_date", { ascending: false });

if (error) {
  app.innerHTML = `<p class="text-red-500 text-sm">${error.message}</p>`;
} else {
  const sales = (data ?? []) as unknown as Sale[];

  app.innerHTML = `
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">销售</h1>
      <a href="${url("/pages/sales-new.html")}"
        class="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
        + 记录销售
      </a>
    </div>

    <div class="-mx-6 sm:mx-0 bg-white sm:rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
      ${
        sales.length === 0
          ? '<p class="text-sm text-gray-400 p-6">暂无销售记录。</p>'
          : `<table class="min-w-full text-sm whitespace-nowrap">
              <thead class="bg-gray-50 text-gray-500 text-left">
                <tr>
                  <th class="px-4 py-3 font-medium">日期</th>
                  <th class="px-4 py-3 font-medium">产品</th>
                  <th class="px-4 py-3 font-medium">客户</th>
                  <th class="px-4 py-3 font-medium">数量</th>
                  <th class="px-4 py-3 font-medium">单价</th>
                  <th class="px-4 py-3 font-medium">总计</th>
                  <th class="px-4 py-3 font-medium">备注</th>
                </tr>
              </thead>
              <tbody>
                ${sales
                  .map(
                    (s) => `
                  <tr class="border-t border-gray-100 hover:bg-gray-50">
                    <td class="px-4 py-3 text-gray-500">${new Date(s.sale_date).toLocaleDateString("zh-CN")}</td>
                    <td class="px-4 py-3 font-medium text-gray-900">${(s.products as unknown as { name: string } | null)?.name ?? "—"}</td>
                    <td class="px-4 py-3 text-gray-700">${s.customer}</td>
                    <td class="px-4 py-3 text-gray-700">${s.quantity}</td>
                    <td class="px-4 py-3 text-gray-700">¥${s.sell_price.toFixed(2)}</td>
                    <td class="px-4 py-3 font-medium text-gray-900">¥${(s.sell_price * s.quantity).toFixed(2)}</td>
                    <td class="px-4 py-3 text-gray-500 whitespace-normal max-w-xs">${s.notes ?? ""}</td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>`
      }
    </div>
  `;
}
