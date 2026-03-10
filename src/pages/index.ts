import '../style.css'
import { requireAuth } from '../auth'
import { renderNavbar } from '../components/navbar'
import { supabase } from '../lib/supabase'
import { url } from '../lib/navigate'

await requireAuth()
renderNavbar(document.getElementById('navbar')!, '控制台')

const app = document.getElementById('app')!
app.innerHTML = `<p class="text-gray-400 text-sm">加载中…</p>`

const [productsRes, salesRes, goodsInRes] = await Promise.all([
  supabase.from('products').select('id, quantity'),
  supabase.from('sales').select('id, sell_price, quantity, sale_date, products(name)').order('sale_date', { ascending: false }).limit(5),
  supabase.from('goods_in').select('id, quantity, created_at, products(name)').order('created_at', { ascending: false }).limit(5),
])

const products = productsRes.data ?? []
const sales = salesRes.data ?? []
const goodsIn = goodsInRes.data ?? []

const totalProducts = products.length
const lowStock = products.filter((p) => p.quantity <= 5)
const totalValue = sales.reduce((sum, s) => sum + s.sell_price * s.quantity, 0)

app.innerHTML = `
  <h1 class="text-2xl font-bold text-gray-900 mb-6">控制台</h1>

  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
    <div class="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
      <p class="text-sm text-gray-500">产品总数</p>
      <p class="text-3xl font-bold text-gray-900 mt-1">${totalProducts}</p>
    </div>
    <div class="bg-white rounded-xl shadow-sm p-5 border ${lowStock.length > 0 ? 'border-red-200 bg-red-50' : 'border-gray-100'}">
      <p class="text-sm ${lowStock.length > 0 ? 'text-red-500' : 'text-gray-500'}">库存预警（≤ 5）</p>
      <p class="text-3xl font-bold ${lowStock.length > 0 ? 'text-red-600' : 'text-gray-900'} mt-1">${lowStock.length}</p>
    </div>
    <div class="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
      <p class="text-sm text-gray-500">近期销售额</p>
      <p class="text-3xl font-bold text-gray-900 mt-1">¥${totalValue.toFixed(2)}</p>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-semibold text-gray-800">最近销售</h2>
        <a href="${url('/pages/sales.html')}" class="text-sm text-indigo-600 hover:underline">查看全部</a>
      </div>
      ${
        sales.length === 0
          ? '<p class="text-sm text-gray-400">暂无销售记录。</p>'
          : `<table class="w-full text-sm">
              <thead><tr class="text-left text-gray-400 border-b">
                <th class="pb-2">产品</th><th class="pb-2">数量</th><th class="pb-2">日期</th>
              </tr></thead>
              <tbody>
                ${sales
                  .map(
                    (s) => `<tr class="border-b last:border-0">
                  <td class="py-2">${(s.products as unknown as { name: string } | null)?.name ?? '—'}</td>
                  <td class="py-2">${s.quantity}</td>
                  <td class="py-2 text-gray-400">${new Date(s.sale_date).toLocaleDateString('zh-CN')}</td>
                </tr>`,
                  )
                  .join('')}
              </tbody>
            </table>`
      }
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-semibold text-gray-800">最近入库</h2>
        <a href="${url('/pages/goods-in.html')}" class="text-sm text-indigo-600 hover:underline">查看全部</a>
      </div>
      ${
        goodsIn.length === 0
          ? '<p class="text-sm text-gray-400">暂无入库记录。</p>'
          : `<table class="w-full text-sm">
              <thead><tr class="text-left text-gray-400 border-b">
                <th class="pb-2">产品</th><th class="pb-2">数量</th><th class="pb-2">日期</th>
              </tr></thead>
              <tbody>
                ${goodsIn
                  .map(
                    (g) => `<tr class="border-b last:border-0">
                  <td class="py-2">${(g.products as unknown as { name: string } | null)?.name ?? '—'}</td>
                  <td class="py-2">${g.quantity}</td>
                  <td class="py-2 text-gray-400">${new Date(g.created_at).toLocaleDateString('zh-CN')}</td>
                </tr>`,
                  )
                  .join('')}
              </tbody>
            </table>`
      }
    </div>
  </div>
`
