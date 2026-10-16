/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@mezo-org/passport", "@mezo-org/orangekit", "@mezo-org/orangekit-smart-account", "@mezo-org/orangekit-contracts"],
  webpack: (config) => {
    // wallet libs pull optional node-only deps
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
};
export default nextConfig;
