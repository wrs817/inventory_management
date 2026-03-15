import "../style.css";
import { requireAuth } from "../auth";
import { renderNavbar } from "../components/navbar";
import { supabase } from "../lib/supabase";
import { url } from "../lib/navigate";

await requireAuth();
renderNavbar(document.getElementById("navbar")!, "首页");

const app = document.getElementById("app")!;
app.innerHTML = `<p class="text-gray-400 text-sm">加载中…</p>`;

// Current month date range
const now = new Date();
const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
const monthEnd = new Date(
  now.getFullYear(),
  now.getMonth() + 1,
  1,
).toISOString();
const monthLabel = now.toLocaleDateString("zh-CN", {
  year: "numeric",
  month: "long",
});

const userId = (await supabase.auth.getUser()).data.user!.id;

const [productsRes, totalsRes, salesMonthRes, goodsInMonthRes, borrowingsRes] = await Promise.all([
  supabase.from("products").select("id, quantity"),
  // Aggregate all-time totals via RPC — avoids fetching every row
  supabase.rpc("get_dashboard_totals", { p_user_id: userId }),
  // month-only for the dashboard tables
  supabase
    .from("sales")
    .select("id, sell_price, quantity, sale_date, products(name)")
    .gte("sale_date", monthStart)
    .lt("sale_date", monthEnd)
    .order("sale_date", { ascending: false }),
  supabase
    .from("goods_in")
    .select("id, purchase_price, quantity, reward_points, created_at, products(name)")
    .gte("created_at", monthStart)
    .lt("created_at", monthEnd)
    .order("created_at", { ascending: false }),
  // borrowings from borrows table
  supabase
    .from("borrows")
    .select("id, borrower, quantity, return_quantity, borrow_date, is_returned, products(name, id)")
    .order("borrow_date", { ascending: false }),
]);

const products = productsRes.data ?? [];
const totals = (totalsRes.data ?? {}) as { total_sales_income: number; total_goods_in_spend: number };
const sales = (salesMonthRes.data ?? []) as unknown as {
  id: string;
  sell_price: number;
  quantity: number;
  sale_date: string;
  products: { name: string } | null;
}[];
const goodsIn = (goodsInMonthRes.data ?? []) as unknown as {
  id: string;
  purchase_price: number;
  quantity: number;
  reward_points: number;
  created_at: string;
  products: { name: string } | null;
}[];

const lowStock = products.filter((p) => p.quantity <= 5);

type BorrowRow = { id: string; borrower: string; quantity: number; return_quantity: number; borrow_date: string; is_returned: boolean; products: { name: string; id: string } | null };
const borrowRows = (borrowingsRes.data ?? []) as unknown as BorrowRow[];

const totalSalesIncome = totals.total_sales_income ?? 0;
const totalGoodsInSpend = totals.total_goods_in_spend ?? 0;

const monthSalesTotal = sales.reduce(
  (sum, s) => sum + s.sell_price * s.quantity,
  0,
);
const monthGoodsInTotal = goodsIn.reduce(
  (sum, g) => sum + g.purchase_price * g.quantity,
  0,
);
const monthGoodsInReward = goodsIn.reduce(
  (sum, g) => sum + g.reward_points,
  0,
);

app.innerHTML = `
  <h1 class="text-2xl font-bold text-gray-900 mb-6">首页</h1>

  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
    <div class="bg-white rounded-xl shadow-sm p-5 border ${lowStock.length > 0 ? "border-red-200 bg-red-50" : "border-gray-100"}">
      <p class="text-sm ${lowStock.length > 0 ? "text-red-500" : "text-gray-500"}">库存预警（≤ 5）</p>
      <div class="flex items-baseline gap-3 mt-1">
        <p class="text-3xl font-bold ${lowStock.length > 0 ? "text-red-600" : "text-gray-900"}">${lowStock.length}</p>
        ${lowStock.length > 0 ? `<a href="${url("/pages/products.html")}" class="text-xs text-red-500 hover:underline">查看低库存产品 →</a>` : ""}
      </div>
    </div>
    <div class="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
      <p class="text-sm text-gray-500">累计销售额</p>
      <p class="text-3xl font-bold text-gray-900 mt-1">¥${totalSalesIncome.toFixed(2)}</p>
    </div>
    <div class="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
      <p class="text-sm text-gray-500">累计入库成本</p>
      <p class="text-3xl font-bold text-gray-900 mt-1">¥${totalGoodsInSpend.toFixed(2)}</p>
    </div>
    <div class="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
      <p class="text-sm text-gray-500">历史收支</p>
      <p class="text-3xl font-bold ${totalSalesIncome - totalGoodsInSpend >= 0 ? "text-green-600" : "text-red-600"} mt-1">¥${(totalSalesIncome - totalGoodsInSpend).toFixed(2)}</p>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="font-semibold text-gray-800">本月销售</h2>
          <p class="text-xs text-gray-400 mt-0.5">${monthLabel}</p>
        </div>
        <a href="${url("/pages/sales.html")}" class="text-sm text-indigo-600 hover:underline">查看全部</a>
      </div>
      ${
        sales.length === 0
          ? '<p class="text-sm text-gray-400">本月暂无销售记录。</p>'
          : `<table class="w-full text-sm">
              <thead><tr class="text-left text-gray-400 border-b">
                <th class="pb-2">产品</th><th class="pb-2">数量</th><th class="pb-2">日期</th><th class="pb-2 text-right">金额</th>
              </tr></thead>
              <tbody>
                ${sales
                  .map(
                    (s) => `<tr class="border-b last:border-0">
                  <td class="py-2" style="width:5em"><div style="width:5em;word-break:break-all">${s.products?.name ?? "—"}</div></td>
                  <td class="py-2 text-center">${s.quantity}</td>
                  <td class="py-2 text-gray-400">${new Date(s.sale_date).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })}</td>
                  <td class="py-2 text-right text-gray-700">¥${(s.sell_price * s.quantity).toFixed(2)}</td>
                </tr>`,
                  )
                  .join("")}
              </tbody>
              <tfoot><tr class="border-t-2 border-gray-200">
                <td class="pt-2 text-gray-500 text-xs" colspan="3">合计</td>
                <td class="pt-2 text-right font-semibold text-gray-900">¥${monthSalesTotal.toFixed(2)}</td>
              </tr></tfoot>
            </table>`
      }
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="font-semibold text-gray-800">本月入库</h2>
          <p class="text-xs text-gray-400 mt-0.5">${monthLabel}</p>
        </div>
        <a href="${url("/pages/goods-in.html")}" class="text-sm text-indigo-600 hover:underline">查看全部</a>
      </div>
      ${
        goodsIn.length === 0
          ? '<p class="text-sm text-gray-400">本月暂无入库记录。</p>'
          : `<table class="w-full text-sm">
              <thead><tr class="text-left text-gray-400 border-b">
                <th class="pb-2">产品</th><th class="pb-2">数量</th><th class="pb-2">日期</th><th class="pb-2 text-right">成本</th><th class="pb-2 text-right text-indigo-400">积分</th>
              </tr></thead>
              <tbody>
                ${goodsIn
                  .map((g) => {
                    return `<tr class="border-b last:border-0">
                  <td class="py-2" style="width:5em"><div style="width:5em;word-break:break-all">${g.products?.name ?? "—"}</div></td>
                  <td class="py-2 text-center">${g.quantity}</td>
                  <td class="py-2 text-gray-400">${new Date(g.created_at).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })}</td>
                  <td class="py-2 text-right text-gray-700">¥${(g.purchase_price * g.quantity).toFixed(2)}</td>
                  <td class="py-2 text-right text-indigo-600">${g.reward_points.toFixed(1)}</td>
                </tr>`;
                  })
                  .join("")}
              </tbody>
              <tfoot><tr class="border-t-2 border-gray-200">
                <td class="pt-2 text-gray-500 text-xs" colspan="3">合计</td>
                <td class="pt-2 text-right font-semibold text-gray-900">¥${monthGoodsInTotal.toFixed(2)}</td>
                <td class="pt-2 text-right font-semibold text-indigo-600">${monthGoodsInReward.toFixed(1)}</td>
              </tr></tfoot>
            </table>`
      }
    </div>
  </div>

  ${borrowRows.length > 0 ? `
  <div class="mt-6 bg-white rounded-xl shadow-sm border border-amber-200 p-5">
    <div class="flex items-center gap-2 mb-4">
      <span class="text-amber-500">⚠</span>
      <h2 class="font-semibold text-gray-800">借货记录（${borrowRows.length} 笔）</h2>
    </div>
    <table class="w-full text-sm">
      <thead><tr class="text-left text-gray-400 border-b">
        <th class="pb-2">借货人</th>
        <th class="pb-2">产品</th>
        <th class="pb-2 text-center">数量</th>
        <th class="pb-2 text-right">借货日期</th>
        <th class="pb-2 text-right">状态</th>
      </tr></thead>
      <tbody>
        ${borrowRows.map((b) => `
        <tr class="border-b last:border-0">
          <td class="py-2 font-medium text-gray-900">${b.borrower}</td>
          <td class="py-2 text-gray-700">${b.products?.name ?? "—"}</td>
          <td class="py-2 text-center text-gray-700">${b.quantity}${b.return_quantity > 0 && !b.is_returned ? ` <span class="text-xs text-gray-400">（剩 ${b.quantity - b.return_quantity}）</span>` : ""}</td>
          <td class="py-2 text-right text-gray-400">${new Date(b.borrow_date).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })}</td>
          <td class="py-2 text-right">
            ${b.is_returned
              ? '<span class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">已还</span>'
              : '<span class="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">未还</span>'}
          </td>
        </tr>`).join("")}
      </tbody>
    </table>
  </div>` : ""}
`;
