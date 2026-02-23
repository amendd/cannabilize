/** @type {import('next').NextConfig} */
const path = require('path');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  // Permitir acesso ao servidor de desenvolvimento pela rede local e por túnel (ngrok)
  // Sem isso, acessos por IP ou ngrok podem bloquear CSS/JS/imagens em dev.
  allowedDevOrigins: [
    'localhost',
    '127.0.0.1',
    '10.0.0.115', // IP da máquina na rede local — ajuste se seu IP for outro
    '*.ngrok-free.app',
    '*.ngrok-free.dev',
    '*.ngrok.io',
  ],

  // Otimizações de imagem (use remotePatterns; domains está obsoleto)
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: 'localhost', pathname: '/**' },
      { protocol: 'http', hostname: '127.0.0.1', pathname: '/**' },
      { protocol: 'https', hostname: 'cdn.clickagendamento.com', pathname: '/**' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Headers de segurança
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  
  // Rewrite: alguns clientes/caches pedem /next/ em vez de /_next/; redirecionar para o path correto
  async rewrites() {
    return [
      { source: '/next/:path*', destination: '/_next/:path*' },
    ];
  },

  // Compressão
  compress: true,
  
  // Otimizações de produção
  poweredByHeader: false,
  reactStrictMode: true,
  
  // Configurações de build
  swcMinify: true,

  // Se o build falhar só por erros de TypeScript, mude para true para desbloquear (veja ANALISE_ERROS_BUILD_VPS.md)
  typescript: {
    ignoreBuildErrors: false,
  },

  // Força o Next a resolver e transpilar next-auth (incluindo subpath /react)
  transpilePackages: ['next-auth'],

  // Output standalone para Docker (opcional)
  // output: 'standalone',

  // Nota: serverExternalPackages não está disponível no Next.js 14.2
  // A importação dinâmica do twilio em lib/whatsapp.ts já resolve o problema

  // Garantir resolução do subpath next-auth/react (evita "Module not found")
  webpack: (config, { isServer }) => {
    const alias = {
      ...config.resolve.alias,
      'next-auth/react': path.resolve(__dirname, 'node_modules/next-auth/react/index.js'),
    };
    config.resolve.alias = alias;
    config.resolve.fallback = { ...config.resolve.fallback };
    return config;
  },
};

module.exports = withBundleAnalyzer(nextConfig);
