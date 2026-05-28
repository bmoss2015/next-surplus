import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Mail template uploads (.docx / .pdf with embedded images and
      // attachments) can comfortably exceed the 1 MB Server Action
      // default. The upload handler itself caps at 25 MB per file.
      bodySizeLimit: "30mb",
    },
  },
};

export default nextConfig;
