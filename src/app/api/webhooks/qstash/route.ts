import { Receiver } from "@upstash/qstash";
import { processMemo } from "@/server/services/ai.service";
import { sendWeeklyDigest } from "@/server/services/digest.service";

const receiver =
  process.env.QSTASH_CURRENT_SIGNING_KEY && process.env.QSTASH_NEXT_SIGNING_KEY
    ? new Receiver({
        currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
        nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY,
      })
    : null;

type QStashPayload =
  | {
      type: "processMemo";
      memoId: string;
    }
  | {
      type: "sendWeeklyDigest";
      userId: string;
    };

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("upstash-signature");
  const region = req.headers.get("upstash-region") ?? undefined;

  if (receiver && signature) {
    await receiver.verify({
      signature,
      body,
      url: req.url,
      upstashRegion: region,
      clockTolerance: 30,
    });
  }

  const payload = JSON.parse(body) as QStashPayload;

  if (payload.type === "processMemo") {
    const result = await processMemo(payload.memoId);
    return Response.json({ ok: true, result });
  }

  if (payload.type === "sendWeeklyDigest") {
    const result = await sendWeeklyDigest(payload.userId);
    return Response.json({ ok: true, result });
  }

  return Response.json({ ok: false, error: "Unknown QStash job" }, { status: 400 });
}
