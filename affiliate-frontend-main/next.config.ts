import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return ["/.well-known/apple-app-site-association", "/.well-known/assetlinks.json"].map((source) => ({
      source,
      headers: [{ key: "Content-Type", value: "application/json" }],
    }));
  },
  /* Allow dev access over 127.0.0.1 / LAN IP (not just localhost) so Next does
     not block its dev resources cross-origin — otherwise client JS (the
     scroll-reveal observer) can stall and sections stay hidden. */
  allowedDevOrigins: ["127.0.0.1", "127.0.0.2", "localhost", "arab-availability-music-holdings.trycloudflare.com"],
};

export default nextConfig;
