import '../style.css'
import { supabase } from '../lib/supabase'
import { navigate } from '../lib/navigate'

const app = document.getElementById('app')!

app.innerHTML = `
  <div class="bg-white rounded-2xl shadow-sm p-8 space-y-6">
    <div class="text-center">
      <h1 class="text-2xl font-bold text-gray-900">登录</h1>
      <p class="text-sm text-gray-500 mt-1">欢迎回到库存管理系统</p>
    </div>
    <div id="error-msg" class="hidden text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3"></div>
    <form id="login-form" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
        <input id="email" type="email" required autocomplete="email"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">密码</label>
        <input id="password" type="password" required autocomplete="current-password"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <button type="submit"
        class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg text-sm transition">
        登录
      </button>
    </form>
  </div>
`

const form = document.getElementById('login-form') as HTMLFormElement
const errorMsg = document.getElementById('error-msg')!

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  errorMsg.classList.add('hidden')

  const email = (document.getElementById('email') as HTMLInputElement).value
  const password = (document.getElementById('password') as HTMLInputElement).value

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    errorMsg.textContent = error.message
    errorMsg.classList.remove('hidden')
  } else {
    navigate('/index.html')
  }
})
