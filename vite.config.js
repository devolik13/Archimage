import { defineConfig } from 'vite';
import { execSync } from 'child_process';

const gitHash = execSync('git rev-parse --short HEAD').toString().trim();
const buildTime = new Date().toISOString().slice(0, 16).replace('T', ' ');

export default defineConfig(({ mode }) => ({
  // Глобальные константы, доступные в коде как __GIT_HASH__ и __BUILD_TIME__
  define: {
    __GIT_HASH__: JSON.stringify(gitHash),
    __BUILD_TIME__: JSON.stringify(buildTime),
  },
  // Базовый путь (для Telegram WebApp или GitHub Pages)
  base: './',

  // Dev server
  server: {
    port: 3000,
    open: true,
    // Для Telegram WebApp
    host: true
  },

  // Build конфигурация
  build: {
    outDir: 'dist',
    // Минификация и tree-shaking
    minify: 'esbuild',
    // Source maps для дебага (отключить в продакшене если не нужны)
    sourcemap: mode !== 'production',
    // Целевые браузеры
    target: 'es2020',
    rollupOptions: {
      output: {
        // Структура выходных файлов
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js'
      }
    }
  },

  // Удаление console.log в продакшене
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : []
  },

  // Resolve алиасы для удобства импортов (на будущее)
  resolve: {
    alias: {
      '@': '/src',
      '@core': '/core',
      '@city': '/city',
      '@battle': '/battle',
      '@wizards': '/wizards',
      '@spells': '/spells',
      '@animations': '/animations'
    }
  },

  // Оптимизация зависимостей
  optimizeDeps: {
    include: ['pixi.js']
  }
}));
