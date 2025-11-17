import { defineConfig } from 'vite';

export default defineConfig({
  // Base public path для production
  base: './',

  // Настройки dev сервера
  server: {
    port: 8000,
    open: true,
    host: true, // Для доступа с других устройств
  },

  // Настройки build
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Отключаем sourcemap для production

    // Оптимизация
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Удаляем console.log в production
        drop_debugger: true
      }
    },

    // Разбиение на чанки
    rollupOptions: {
      output: {
        manualChunks: {
          // Вендорные библиотеки
          vendor: ['@supabase/supabase-js'],

          // Боевая система
          battle: [
            './battle/core.js',
            './battle/opponent-selection.js',
            './battle/leaderboard.js'
          ],

          // Система заклинаний
          spells: [
            './spells/library_ui.js'
          ],

          // Город
          city: [
            './city/city-view-system.js',
            './city/city-clickable-system.js'
          ]
        }
      }
    },

    // Порог предупреждения о размере (500 КБ)
    chunkSizeWarningLimit: 500
  },

  // Разрешение путей
  resolve: {
    alias: {
      '@': '/src',
      '@battle': '/battle',
      '@spells': '/spells',
      '@city': '/city',
      '@assets': '/assets'
    }
  }
});
