const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || 'https://reconcile.local'
const siteName = 'Reconcile'
const fullTitle = 'Reconcile — Payment Ops Puzzle Game'
const description =
  'A puzzle game about reconciling payment transactions across 3 systems — Payment Gateway, Internal DB, and Bank Settlement. Spot duplicates, partial refunds, chargebacks, and missing orders before customers riot.'
const keywords = [
  'reconcile game',
  'payment reconciliation',
  'payment ops',
  'puzzle game',
  'finance simulator',
  'chargeback',
  'settlement',
  'browser game',
  'payment gateway',
  'fintech game',
  'developer game',
].join(', ')

const ogImage = `${siteUrl}/og-image.svg`

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'VideoGame',
  name: fullTitle,
  alternateName: 'Reconcile',
  description,
  url: siteUrl,
  image: ogImage,
  applicationCategory: 'Game',
  genre: ['Puzzle', 'Simulation', 'Educational'],
  operatingSystem: 'Web Browser',
  inLanguage: 'en',
  isAccessibleForFree: true,
  gamePlatform: ['Web', 'Desktop', 'Mobile'],
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  author: {
    '@type': 'Person',
    name: 'maulana',
  },
}

export default defineNuxtConfig({
  compatibilityDate: '2025-05-13',
  devtools: { enabled: true },

  runtimeConfig: {
    public: {
      siteUrl,
    },
  },

  app: {
    head: {
      htmlAttrs: {
        lang: 'en',
      },
      title: fullTitle,
      titleTemplate: '%s',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: description },
        { name: 'keywords', content: keywords },
        { name: 'author', content: 'maulana' },
        { name: 'application-name', content: siteName },
        { name: 'generator', content: 'Nuxt 4' },
        { name: 'theme-color', content: '#0a0e1c' },
        { name: 'color-scheme', content: 'dark' },
        { name: 'format-detection', content: 'telephone=no' },
        { name: 'referrer', content: 'strict-origin-when-cross-origin' },
        // iOS/Mobile webapp
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: siteName },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'msapplication-TileColor', content: '#0a0e1c' },
        // Robots
        { name: 'robots', content: 'index, follow, max-image-preview:large, max-snippet:-1' },
        { name: 'googlebot', content: 'index, follow' },
        // Open Graph (Facebook, LinkedIn, etc.)
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: siteName },
        { property: 'og:title', content: fullTitle },
        { property: 'og:description', content: description },
        { property: 'og:url', content: siteUrl },
        { property: 'og:image', content: ogImage },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:alt', content: 'Reconcile — Payment Ops Puzzle Game' },
        { property: 'og:locale', content: 'en_US' },
        // Twitter / X
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: fullTitle },
        { name: 'twitter:description', content: description },
        { name: 'twitter:image', content: ogImage },
        { name: 'twitter:image:alt', content: 'Reconcile — Payment Ops Puzzle Game' },
      ],
      link: [
        // Favicons
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'mask-icon', href: '/favicon.svg', color: '#5ee0c4' },
        { rel: 'apple-touch-icon', href: '/icon-maskable.svg' },
        // PWA manifest
        { rel: 'manifest', href: '/site.webmanifest' },
        // Canonical
        { rel: 'canonical', href: siteUrl },
        // Fonts
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Space+Grotesk:wght@400;600;700&display=swap',
        },
      ],
      script: [
        {
          type: 'application/ld+json',
          innerHTML: JSON.stringify(jsonLd),
        },
      ],
    },
    pageTransition: { name: 'fade', mode: 'out-in' },
  },

  css: ['~/assets/css/main.css'],
})
