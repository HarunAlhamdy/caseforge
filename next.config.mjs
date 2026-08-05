/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    cpus: 1,
    // Externalize so native query engines load from node_modules/.prisma
    serverComponentsExternalPackages: ["@prisma/client", "bcryptjs"],
    outputFileTracingIncludes: {
      "/api/**/*": [
        "./node_modules/.prisma/client/**/*",
        "./node_modules/@prisma/client/**/*",
        "./prisma/**/*",
      ],
      "/dashboard": [
        "./node_modules/.prisma/client/**/*",
        "./node_modules/@prisma/client/**/*",
      ],
      "/dashboard/**/*": [
        "./node_modules/.prisma/client/**/*",
        "./node_modules/@prisma/client/**/*",
      ],
      "/(app)/**/*": [
        "./node_modules/.prisma/client/**/*",
        "./node_modules/@prisma/client/**/*",
      ],
    },
  },
};

export default nextConfig;
