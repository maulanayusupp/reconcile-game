export default defineNuxtConfig({
  compatibilityDate: '2025-05-13',
  devtools: { enabled: true },
  app: {
    head: {
      title: 'Reconcile — Payment Ops Puzzle',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'A puzzle game about reconciling payment transactions across systems.' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Space+Grotesk:wght@400;600;700&display=swap',
        },
      ],
    },
    pageTransition: { name: 'fade', mode: 'out-in' },
  },
  css: ['~/assets/css/main.css'],
})
