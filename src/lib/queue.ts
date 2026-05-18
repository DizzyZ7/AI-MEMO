import { Client } from "@upstash/qstash";

const qstash = process.env.QSTASH_TOKEN ? new Client({ token: process.env.QSTASH_TOKEN }) : null;

export async function enqueueMemoProcessing(memoId: string) {
  if (!qstash) {
    return { queued: false, reason: "QSTASH_TOKEN is not configured" };
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!baseUrl) {
    return { queued: false, reason: "NEXT_PUBLIC_APP_URL is not configured" };
  }

  const message = await qstash.publishJSON({
    url: `${baseUrl}/api/webhooks/qstash`,
    body: {
      type: "processMemo",
      memoId,
    },
  });

  return { queued: true, message };
}
