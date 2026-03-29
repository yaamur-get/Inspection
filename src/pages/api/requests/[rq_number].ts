import type { NextApiRequest, NextApiResponse } from "next";

type RequestResponse = {
  mosque_name: string;
  applicant_name: string;
  phone: string;
  district: string;
  city: string;
};

type ErrorResponse = { error: string };

type AnyObject = Record<string, unknown>;

const toText = (value: unknown) => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
};

const normalizeResponse = (payload: unknown): RequestResponse | null => {
  if (!payload || typeof payload !== "object") return null;
  const raw = payload as AnyObject;

  const direct: RequestResponse = {
    mosque_name: toText(raw.mosque_name),
    applicant_name: toText(raw.applicant_name),
    phone: toText(raw.phone),
    district: toText(raw.district),
    city: toText(raw.city),
  };

  if (
    direct.mosque_name ||
    direct.applicant_name ||
    direct.phone ||
    direct.district ||
    direct.city
  ) {
    return direct;
  }

  const requestObj =
    raw.request && typeof raw.request === "object"
      ? (raw.request as AnyObject)
      : raw;

  const mosqueObj =
    requestObj.mosque && typeof requestObj.mosque === "object"
      ? (requestObj.mosque as AnyObject)
      : requestObj.mosques && typeof requestObj.mosques === "object"
        ? (requestObj.mosques as AnyObject)
        : ({} as AnyObject);

  const fromRelations: RequestResponse = {
    mosque_name: toText(mosqueObj.name_ar || mosqueObj.name || raw.mosque_name),
    applicant_name: toText(
      requestObj.beneficiary_name || requestObj.applicant_name || raw.applicant_name
    ),
    phone: toText(requestObj.beneficiary_phone || requestObj.phone || raw.phone),
    district: toText(mosqueObj.district || raw.district),
    city: toText(mosqueObj.city || raw.city),
  };

  if (
    !fromRelations.mosque_name &&
    !fromRelations.applicant_name &&
    !fromRelations.phone
  ) {
    return null;
  }

  return fromRelations;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RequestResponse | ErrorResponse>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const rqParam = req.query.rq_number;
  const rqNumber = Array.isArray(rqParam) ? rqParam[0] : rqParam;

  if (!rqNumber || !rqNumber.trim()) {
    return res.status(400).json({ error: "rq_number is required" });
  }

  const baseUrl =
    process.env.MAINTENANCE_API_BASE_URL ||
    process.env.NEXT_PUBLIC_MAINTENANCE_API_BASE_URL;

  if (!baseUrl) {
    return res.status(500).json({
      error: "MAINTENANCE_API_BASE_URL is missing in environment variables",
    });
  }

  const normalizedBase = baseUrl.replace(/\/$/, "");

  try {
    const upstreamResponse = await fetch(
      `${normalizedBase}/api/requests/${encodeURIComponent(rqNumber.trim())}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      }
    );

    const payload = await upstreamResponse.json().catch(() => null);

    if (!upstreamResponse.ok) {
      return res.status(upstreamResponse.status).json({ error: "رقم الطلب غير صحيح" });
    }

    const normalized = normalizeResponse(payload);
    if (!normalized) {
      return res.status(404).json({ error: "رقم الطلب غير صحيح" });
    }

    return res.status(200).json(normalized);
  } catch (error: unknown) {
    console.error("request lookup api error", error);
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return res.status(500).json({ error: message });
  }
}
