/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  env: {
    NEXT_PUBLIC_SOCKET_URL: "https://beatmatch-jbss.onrender.com",
    SPOTIFY_CLIENT_ID: "6505035b2eb34f5ab9abecf157a93ae1",
    SPOTIFY_CLIENT_SECRET: "473b90d3fb4b4d75a68808271870585d",
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
