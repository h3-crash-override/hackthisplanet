/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow CSS from node_modules (needed for swagger-ui-react)
  transpilePackages: ['swagger-ui-react'],
  images: {
    domains: ['images.unsplash.com'],
  },
  // Intentionally permissive headers - A05
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Authorization,Content-Type' },
          { key: 'X-Powered-By', value: 'Next.js/14.0.4' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
