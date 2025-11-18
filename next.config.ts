/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://obep-erp.vercel.app"
      ],
    },
  },
  reactCompiler: true,
}

module.exports = nextConfig
