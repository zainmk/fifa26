import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' *",
              "style-src 'self' 'unsafe-inline' *",
              "img-src * data: blob:",
              "media-src * data: blob:",
              "frame-src *",
              "connect-src 'self' https://streamed.pk *",
              "worker-src 'self' blob:",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
