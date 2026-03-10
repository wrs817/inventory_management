import { supabase } from "../lib/supabase";
import { url, navigate } from "../lib/navigate";

export function renderNavbar(container: HTMLElement, activePage: string): void {
  const links = [
    { href: url("/index.html"), label: "首页", icon: "🏠" },
    { href: url("/pages/products.html"), label: "产品", icon: "📦" },
    { href: url("/pages/sales.html"), label: "销售", icon: "💰" },
    { href: url("/pages/goods-in.html"), label: "入库", icon: "📥" },
  ];

  container.innerHTML = `
    <nav class="bg-gray-900 text-white shadow-md">
      <div class="px-4 py-3 flex items-center justify-between">
        <span class="text-base font-bold tracking-tight whitespace-nowrap">📦 库存管理</span>

        <!-- Desktop links -->
        <div class="hidden sm:flex items-center gap-1">
          ${links
            .map(
              (l) => `
            <a href="${l.href}"
              class="text-sm font-medium px-3 py-1.5 rounded transition
                ${activePage === l.label ? "bg-indigo-600 text-white" : "text-gray-300 hover:text-white hover:bg-gray-700"}">
              ${l.label}
            </a>
          `,
            )
            .join("")}
          <button id="logout-btn"
            class="text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 px-3 py-1.5 rounded transition ml-2">
            退出登录
          </button>
        </div>

        <!-- Mobile hamburger -->
        <button id="menu-btn" class="sm:hidden p-2 rounded hover:bg-gray-700 transition" aria-label="菜单">
          <svg id="icon-open" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
          <svg id="icon-close" class="w-5 h-5 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Mobile menu -->
      <div id="mobile-menu" class="hidden sm:hidden border-t border-gray-700 px-4 py-2 space-y-1">
        ${links
          .map(
            (l) => `
          <a href="${l.href}"
            class="flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition
              ${activePage === l.label ? "bg-indigo-600 text-white" : "text-gray-300 hover:text-white hover:bg-gray-700"}">
            <span>${l.icon}</span>${l.label}
          </a>
        `,
          )
          .join("")}
        <button id="logout-btn-mobile"
          class="flex items-center gap-3 w-full px-3 py-2.5 rounded text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 transition">
          <span>🚪</span>退出登录
        </button>
      </div>
    </nav>
  `;

  // Hamburger toggle
  const menuBtn = document.getElementById("menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");
  const iconOpen = document.getElementById("icon-open");
  const iconClose = document.getElementById("icon-close");

  menuBtn?.addEventListener("click", () => {
    const isOpen = !mobileMenu?.classList.contains("hidden");
    mobileMenu?.classList.toggle("hidden", isOpen);
    iconOpen?.classList.toggle("hidden", !isOpen);
    iconClose?.classList.toggle("hidden", isOpen);
  });

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/pages/login.html");
  };

  document.getElementById("logout-btn")?.addEventListener("click", logout);
  document
    .getElementById("logout-btn-mobile")
    ?.addEventListener("click", logout);
}
