import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(__dirname, "../..");

/** @type {import("next").NextConfig} */
const nextConfig = {
  output: "standalone",
  outputFileTracingRoot: monorepoRoot,
  serverExternalPackages: ["ioredis"],
  outputFileTracingIncludes: {
    "/*": [
      "../../node_modules/.pnpm/@prisma+client@*/node_modules/.prisma/client/**/*",
      "../../node_modules/.pnpm/prisma@*/node_modules/prisma/libquery_engine-*"
    ]
  },
  transpilePackages: ["@radevu/db", "@radevu/shared"],
  images: {
    remotePatterns: []
  },
  env: {
    NEXT_PUBLIC_BOOKING_BASE_DOMAIN:
      process.env.BOOKING_BASE_DOMAIN ?? "localhost",
    NEXT_PUBLIC_ROUTING_MODE: process.env.ROUTING_MODE ?? "subpath"
  },
  webpack(config, { isServer }) {
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
      ".mjs": [".mts", ".mjs"],
      ".cjs": [".cts", ".cjs"]
    };

    if (isServer) {
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : []),
        ({ request }, callback) => {
          if (request === "ioredis") {
            callback(null, "commonjs ioredis");
            return;
          }

          callback();
        }
      ];
    }

    return config;
  }
};

export default nextConfig;
