import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import mkcert from 'vite-plugin-mkcert'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/kucun/' : '/',
  plugins: [tailwindcss(), mkcert()],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        login: 'pages/login.html',
        register: 'pages/register.html',
        products: 'pages/products.html',
        'products-new': 'pages/products-new.html',
        'products-edit': 'pages/products-edit.html',
        sales: 'pages/sales.html',
        'sales-new': 'pages/sales-new.html',
        'goods-in': 'pages/goods-in.html',
        'goods-in-new': 'pages/goods-in-new.html',
        'borrow': 'pages/borrow.html',
        'borrow-new': 'pages/borrow-new.html',
      },
    },
  },
}))
