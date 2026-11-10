import type { NextConfig } from "next";
import path from "node:path";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Pins the workspace root explicitly: a stray package.json in a parent
  // directory outside this git repository otherwise makes Turbopack guess.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default withNextIntl(nextConfig);
