import "../style.css";
import { requireAuth } from "../auth";
import { renderNavbar } from "../components/navbar";
import { supabase } from "../lib/supabase";
import type { GoodsIn } from "../types";
import { url } from "../lib/navigate";

await requireAuth();
renderNavbar(document.getElementById("navbar")!, "入库");

const app = document.getElementById("app")!;
app.innerHTML = `<p class="text-gray-400 text-sm">Loading…</p>`;

const { data, error } = await supabase
  .from("goods_in")
  .select("*, products(name)")
  .order("created_at", { ascending: false });

if (error) {
  app.innerHTML = `<p class="text-red-500 text-sm">${error.message}</p>`;
} else {
  const records = (data ?? []) as GoodsIn[];

  app.innerHTML = `
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">入库记录</h1>
      <a href="${url("/pages/goods-in-new.html")}"
        class="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
        + 记录入库
      </a>
    </div>

    <div class="-mx-6 sm:mx-0 bg-white sm:rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
      ${
        records.length === 0
          ? '<p class="text-sm text-gray-400 p-6">暂无入库记录。</p>'
          : `<table class="min-w-full text-sm whitespace-nowrap">
              <thead class="bg-gray-50 text-gray-500 text-left">
                <tr>
                  <th class="px-4 py-3 font-medium">日期</th>
                  <th class="px-4 py-3 font-medium">产品</th>
                  <th class="px-4 py-3 font-medium">数量</th>
                  <th class="px-4 py-3 font-medium">进价</th>
                  <th class="px-4 py-3 font-medium">总成本</th>
                  <th class="px-4 py-3 font-medium">积分价值</th>
                  <th class="px-4 py-3 font-medium">可积分</th>
                  <th class="px-4 py-3 font-medium">备注</th>
                </tr>
              </thead>
              <tbody>
                ${records
                  .map(
                    (g) => `
                  <tr class="border-t border-gray-100 hover:bg-gray-50">
                    <td class="px-4 py-3 text-gray-500">${new Date(g.created_at).toLocaleDateString("zh-CN")}</td>
                    <td class="px-4 py-3 font-medium text-gray-900">${(g.products as unknown as { name: string } | null)?.name ?? "—"}</td>
                    <td class="px-4 py-3 text-gray-700">${g.quantity}</td>
                    <td class="px-4 py-3 text-gray-700">¥${g.purchase_price.toFixed(2)}</td>
                    <td class="px-4 py-3 font-medium text-gray-900">¥${(g.purchase_price * g.quantity).toFixed(2)}</td>
                    <td class="px-4 py-3 text-indigo-600 font-medium">${g.reward_points}</td>
                    <td class="px-4 py-3">${g.can_collect_reward_points ? '<span class="text-green-600">✓</span>' : '<span class="text-gray-300">—</span>'}</td>
                    <td class="px-4 py-3 text-gray-500 whitespace-normal max-w-xs">${g.notes ?? ""}</td>
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
