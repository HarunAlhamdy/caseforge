/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    // Avoid Windows OOM during static generation of many auth-gated pages
    cpus: 1,
  },
};

export default nextConfig;
