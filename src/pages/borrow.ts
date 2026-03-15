import "../style.css";
import { requireAuth } from "../auth";
import { renderNavbar } from "../components/navbar";
import { supabase } from "../lib/supabase";
import type { Borrow } from "../types";
import { url } from "../lib/navigate";

await requireAuth();
renderNavbar(document.getElementById("navbar")!, "借货");

const app = document.getElementById("app")!;
app.innerHTML = `<p class="text-gray-400 text-sm">加载中…</p>`;

const render = async () => {
  const { data, error } = await supabase
    .from("borrows")
    .select("*, products(name)")
    .order("borrow_date", { ascending: false });

  if (error) {
    app.innerHTML = `<p class="text-red-500 text-sm">${error.message}</p>`;
    return;
  }

  const borrows = (data ?? []) as Borrow[];

  app.innerHTML = `
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">借货</h1>
      <a href="${url("/pages/borrow-new.html")}"
        class="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition">
        + 记录借货
      </a>
    </div>

    <div class="-mx-6 sm:mx-0 bg-white sm:rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
      ${
        borrows.length === 0
          ? '<p class="text-sm text-gray-400 p-6">暂无借货记录。</p>'
          : `<table class="min-w-full text-sm whitespace-nowrap">
              <thead class="bg-gray-50 text-gray-500 text-left">
                <tr>
                  <th class="px-4 py-3 font-medium">日期</th>
                  <th class="px-4 py-3 font-medium">产品</th>
                  <th class="px-4 py-3 font-medium">借货人</th>
                  <th class="px-4 py-3 font-medium">数量</th>
                  <th class="px-4 py-3 font-medium">状态</th>
                  <th class="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                ${borrows.map((b) => {
                  const remaining = b.quantity - (b.return_quantity ?? 0);
                  return `
                  <tr class="border-t border-gray-100 hover:bg-gray-50" id="row-${b.id}">
                    <td class="px-4 py-3 text-gray-500">${new Date(b.borrow_date).toLocaleDateString("zh-CN")}</td>
                    <td class="px-4 py-3 font-medium text-gray-900">${(b.products as unknown as { name: string } | null)?.name ?? "—"}</td>
                    <td class="px-4 py-3 text-gray-700">${b.borrower}</td>
                    <td class="px-4 py-3 text-gray-700">${b.quantity}${b.return_quantity > 0 && !b.is_returned ? ` <span class="text-xs text-gray-400">（已还 ${b.return_quantity}，剩 ${remaining}）</span>` : ""}</td>
                    <td class="px-4 py-3">
                      ${b.is_returned
                        ? `<span class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">已还</span>`
                        : `<span class="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">未还</span>`}
                    </td>
                    <td class="px-4 py-3">
                      ${!b.is_returned ? `
                        <div class="flex items-center gap-2">
                          <input type="number" min="1" max="${remaining}" value="${remaining}"
                            id="return-qty-${b.id}"
                            class="w-16 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                          <button data-id="${b.id}" data-product="${b.product_id}" data-max="${remaining}"
                            class="return-btn text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium px-3 py-1 rounded-lg transition">
                            还货
                          </button>
                        </div>` : ""}
                    </td>
                  </tr>`;
                }).join("")}
              </tbody>
            </table>`
      }
    </div>
  `;

  // Wire up return buttons
  document.querySelectorAll(".return-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = (btn as HTMLElement).dataset.id!;
      const productId = (btn as HTMLElement).dataset.product!;
      const max = parseInt((btn as HTMLElement).dataset.max!);
      const input = document.getElementById(`return-qty-${id}`) as HTMLInputElement;
      const qty = parseInt(input.value);

      if (!qty || qty < 1 || qty > max) {
        alert(`请输入有效还货数量（1 ~ ${max}）`);
        return;
      }

      (btn as HTMLButtonElement).disabled = true;
      (btn as HTMLButtonElement).textContent = "处理中…";

      const { error } = await supabase.rpc("restore_stock", {
        p_borrow_id: id,
        p_product_id: productId,
        p_quantity: qty,
      });

      if (error) {
        alert(`还货失败：${error.message}`);
        (btn as HTMLButtonElement).disabled = false;
        (btn as HTMLButtonElement).textContent = "还货";
      } else {
        await render();
      }
    });
  });
};

await render();
