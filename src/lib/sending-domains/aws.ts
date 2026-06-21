import "server-only";
import {
  Route53Client,
  CreateHostedZoneCommand,
  ChangeResourceRecordSetsCommand,
  DeleteHostedZoneCommand,
  ListResourceRecordSetsCommand,
} from "@aws-sdk/client-route-53";
import {
  SESv2Client,
  CreateEmailIdentityCommand,
  GetEmailIdentityCommand,
  DeleteEmailIdentityCommand,
} from "@aws-sdk/client-sesv2";

const REGION = process.env.AWS_REGION ?? "us-east-1";

function hasCredentials(): boolean {
  return Boolean(
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
  );
}

function route53(): Route53Client {
  return new Route53Client({
    region: REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}

function ses(): SESv2Client {
  return new SESv2Client({
    region: REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
}

export function awsConfigured(): boolean {
  return hasCredentials();
}

export type HostedZoneResult = {
  zoneId: string;
  nameservers: string[];
};

export async function createHostedZone(
  subdomain: string
): Promise<HostedZoneResult> {
  if (!hasCredentials()) throw new Error("AWS credentials not configured");

  const callerRef = `next-surplus-${subdomain}-${Date.now()}`;
  const res = await route53().send(
    new CreateHostedZoneCommand({
      Name: subdomain,
      CallerReference: callerRef,
      HostedZoneConfig: {
        Comment: `Next Surplus sending subdomain for ${subdomain}`,
        PrivateZone: false,
      },
    })
  );

  const rawZoneId = res.HostedZone?.Id;
  if (!rawZoneId) throw new Error("Route 53 did not return a hosted zone id");
  const zoneId = rawZoneId.replace(/^\/hostedzone\//, "");
  const nameservers = res.DelegationSet?.NameServers ?? [];
  if (nameservers.length === 0) {
    throw new Error("Route 53 did not return delegation set nameservers");
  }

  return { zoneId, nameservers };
}

export async function createOrGetEmailIdentity(
  subdomain: string
): Promise<{ dkimTokens: string[] }> {
  if (!hasCredentials()) throw new Error("AWS credentials not configured");

  try {
    const created = await ses().send(
      new CreateEmailIdentityCommand({
        EmailIdentity: subdomain,
      })
    );
    const tokens = created.DkimAttributes?.Tokens ?? [];
    if (tokens.length === 0) {
      throw new Error("SES did not return DKIM tokens on identity create");
    }
    return { dkimTokens: tokens };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!/already exists|AlreadyExists/i.test(msg)) throw e;
  }

  const got = await ses().send(
    new GetEmailIdentityCommand({
      EmailIdentity: subdomain,
    })
  );
  const tokens = got.DkimAttributes?.Tokens ?? [];
  if (tokens.length === 0) {
    throw new Error("SES returned an identity with no DKIM tokens");
  }
  return { dkimTokens: tokens };
}

export async function writeDkimCnames(
  zoneId: string,
  subdomain: string,
  dkimTokens: string[]
): Promise<void> {
  if (!hasCredentials()) throw new Error("AWS credentials not configured");

  await route53().send(
    new ChangeResourceRecordSetsCommand({
      HostedZoneId: zoneId,
      ChangeBatch: {
        Changes: dkimTokens.map((token) => ({
          Action: "UPSERT",
          ResourceRecordSet: {
            Name: `${token}._domainkey.${subdomain}.`,
            Type: "CNAME",
            TTL: 1800,
            ResourceRecords: [{ Value: `${token}.dkim.amazonses.com` }],
          },
        })),
      },
    })
  );
}

export type IdentityStatus = {
  verified: boolean;
  dkimStatus: string;
};

export async function getIdentityVerificationStatus(
  subdomain: string
): Promise<IdentityStatus> {
  if (!hasCredentials()) throw new Error("AWS credentials not configured");

  const res = await ses().send(
    new GetEmailIdentityCommand({
      EmailIdentity: subdomain,
    })
  );

  const dkimStatus = String(res.DkimAttributes?.Status ?? "NOT_STARTED");
  const verified = dkimStatus === "SUCCESS";

  return { verified, dkimStatus };
}

export async function deleteSendingDomainResources(
  subdomain: string,
  zoneId: string | null
): Promise<void> {
  if (!hasCredentials()) return;

  try {
    await ses().send(
      new DeleteEmailIdentityCommand({ EmailIdentity: subdomain })
    );
  } catch (e) {
    console.error("SES identity delete failed", e);
  }

  if (!zoneId) return;

  try {
    const recs = await route53().send(
      new ListResourceRecordSetsCommand({ HostedZoneId: zoneId })
    );
    const deletable = (recs.ResourceRecordSets ?? []).filter(
      (rs) => rs.Type !== "NS" && rs.Type !== "SOA"
    );
    if (deletable.length > 0) {
      await route53().send(
        new ChangeResourceRecordSetsCommand({
          HostedZoneId: zoneId,
          ChangeBatch: {
            Changes: deletable.map((rs) => ({
              Action: "DELETE",
              ResourceRecordSet: rs,
            })),
          },
        })
      );
    }
    await route53().send(new DeleteHostedZoneCommand({ Id: zoneId }));
  } catch (e) {
    console.error("Route 53 zone cleanup failed", e);
  }
}
