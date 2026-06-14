import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack in Next.js 16 does not inline NEXT_PUBLIC_ values into the
  // client bundle automatically (vercel/next.js discussion #74624). Declaring
  // them here forces inlining via config substitution.
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },
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
