import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/admin/donations", destination: "/admin/donate", permanent: false },
      { source: "/admin/volunteers", destination: "/admin/team", permanent: false },
      { source: "/admin/users", destination: "/admin/team", permanent: false },
      { source: "/team", destination: "/our-family", permanent: false },
      { source: "/projects", destination: "/works", permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  webpack: (config) => {
    config.watchOptions = {
      ignored: /edge-functions/,
    };
    return config;
  },
  turbopack: {},
};

export default nextConfig;
