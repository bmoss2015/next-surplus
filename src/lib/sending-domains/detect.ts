import "server-only";
import { promises as dns } from "node:dns";

export type DetectedProvider = {
  id: string;
  name: string;
  tier: "tier_a_direct" | "tier_b_domain_connect" | "tier_c_delegation";
  capabilities: string[];
};

const UNKNOWN_PROVIDER: DetectedProvider = {
  id: "unknown",
  name: "Other DNS Provider",
  tier: "tier_c_delegation",
  capabilities: ["subdomain_delegation"],
};

const NS_PATTERNS: Array<{
  match: RegExp;
  provider: DetectedProvider;
}> = [
  {
    match: /\.ns\.cloudflare\.com$/i,
    provider: {
      id: "cloudflare",
      name: "Cloudflare",
      tier: "tier_a_direct",
      capabilities: ["api_token", "subdomain_delegation"],
    },
  },
  {
    match: /\.vercel-dns\.com$/i,
    provider: {
      id: "vercel",
      name: "Vercel",
      tier: "tier_a_direct",
      capabilities: ["oauth", "subdomain_delegation"],
    },
  },
  {
    match: /\.domaincontrol\.com$/i,
    provider: {
      id: "godaddy",
      name: "GoDaddy",
      tier: "tier_b_domain_connect",
      capabilities: ["domain_connect", "subdomain_delegation"],
    },
  },
  {
    match: /\.registrar-servers\.com$/i,
    provider: {
      id: "namecheap",
      name: "Namecheap",
      tier: "tier_c_delegation",
      capabilities: ["subdomain_delegation"],
    },
  },
  {
    match: /\.ui-dns\.(com|org|biz|de)$/i,
    provider: {
      id: "ionos",
      name: "IONOS",
      tier: "tier_b_domain_connect",
      capabilities: ["domain_connect", "subdomain_delegation"],
    },
  },
  {
    match: /\.bluehost\.com$/i,
    provider: {
      id: "bluehost",
      name: "Bluehost",
      tier: "tier_c_delegation",
      capabilities: ["subdomain_delegation"],
    },
  },
  {
    match: /\.hostgator\.com$/i,
    provider: {
      id: "hostgator",
      name: "HostGator",
      tier: "tier_c_delegation",
      capabilities: ["subdomain_delegation"],
    },
  },
  {
    match: /\.hostinger\.com$/i,
    provider: {
      id: "hostinger",
      name: "Hostinger",
      tier: "tier_c_delegation",
      capabilities: ["subdomain_delegation"],
    },
  },
  {
    match: /\.siteground\.net$/i,
    provider: {
      id: "siteground",
      name: "SiteGround",
      tier: "tier_c_delegation",
      capabilities: ["subdomain_delegation"],
    },
  },
  {
    match: /\.worldnic\.com$/i,
    provider: {
      id: "network_solutions",
      name: "Network Solutions",
      tier: "tier_c_delegation",
      capabilities: ["subdomain_delegation"],
    },
  },
  {
    match: /\.awsdns-/i,
    provider: {
      id: "route53",
      name: "AWS Route 53",
      tier: "tier_c_delegation",
      capabilities: ["subdomain_delegation"],
    },
  },
  {
    match: /\.googledomains\.com$|\.google-dns\.com$/i,
    provider: {
      id: "google_domains",
      name: "Google Domains / Squarespace",
      tier: "tier_c_delegation",
      capabilities: ["subdomain_delegation"],
    },
  },
  {
    match: /\.squarespace\.com$|\.squarespacedns\.com$/i,
    provider: {
      id: "squarespace",
      name: "Squarespace",
      tier: "tier_c_delegation",
      capabilities: ["subdomain_delegation"],
    },
  },
  {
    match: /\.wixdns\.net$/i,
    provider: {
      id: "wix",
      name: "Wix",
      tier: "tier_c_delegation",
      capabilities: ["subdomain_delegation"],
    },
  },
  {
    match: /\.shopifydns\.com$/i,
    provider: {
      id: "shopify",
      name: "Shopify",
      tier: "tier_c_delegation",
      capabilities: ["subdomain_delegation"],
    },
  },
  {
    match: /\.dreamhost\.com$/i,
    provider: {
      id: "dreamhost",
      name: "DreamHost",
      tier: "tier_c_delegation",
      capabilities: ["subdomain_delegation"],
    },
  },
  {
    match: /\.porkbun\.com$/i,
    provider: {
      id: "porkbun",
      name: "Porkbun",
      tier: "tier_c_delegation",
      capabilities: ["subdomain_delegation"],
    },
  },
];

export type DetectResult = {
  domain: string;
  provider: DetectedProvider;
  nameservers: string[];
  error?: string;
};

export async function detectDnsProvider(domain: string): Promise<DetectResult> {
  const normalized = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (!isValidDomain(normalized)) {
    return {
      domain: normalized,
      provider: UNKNOWN_PROVIDER,
      nameservers: [],
      error: "That doesn't look like a valid domain.",
    };
  }

  let nameservers: string[];
  try {
    nameservers = await dns.resolveNs(normalized);
  } catch (e) {
    return {
      domain: normalized,
      provider: UNKNOWN_PROVIDER,
      nameservers: [],
      error: e instanceof Error ? e.message : String(e),
    };
  }

  for (const ns of nameservers) {
    for (const { match, provider } of NS_PATTERNS) {
      if (match.test(ns)) {
        return { domain: normalized, provider, nameservers };
      }
    }
  }

  return { domain: normalized, provider: UNKNOWN_PROVIDER, nameservers };
}

export function subdomainFor(domain: string): string {
  return `send.${domain}`;
}

function isValidDomain(d: string): boolean {
  if (!d || d.length > 253) return false;
  if (!d.includes(".")) return false;
  const labels = d.split(".");
  for (const label of labels) {
    if (!label || label.length > 63) return false;
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i.test(label)) return false;
  }
  return true;
}
