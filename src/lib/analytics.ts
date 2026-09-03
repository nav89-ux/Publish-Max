import { createHmac } from "node:crypto";

export function hashVisitor(visitorId: string) {
  const pepper = process.env.ANALYTICS_VISITOR_PEPPER;
  if (!pepper) throw new Error("Missing ANALYTICS_VISITOR_PEPPER");
  if (!/^[0-9a-f-]{36}$/i.test(visitorId)) throw new Error("Invalid visitor identifier");
  return createHmac("sha256", pepper).update(visitorId).digest("hex");
}

export function safeText(value: unknown, maxLength = 120) {
  return typeof value === "string" && value.length <= maxLength ? value || null : null;
}
