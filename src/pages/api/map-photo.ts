import type { NextApiRequest, NextApiResponse } from "next";
import { mapPhotoConfig } from "../../config/mapPhoto";
import { supabase } from "@/integrations/supabase/client";

type SuccessResponse = { url: string; path: string };
type ErrorResponse = { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = mapPhotoConfig.gmapsKey || process.env.GMAPS_KEY;
  if (!apiKey) {
    return res
      .status(500)
      .json({ error: "GMAPS_KEY is missing in environment variables" });
  }

  const { lat, lng, reportId, targetId, targetType } = req.body || {};
  const latNum = typeof lat === "string" ? parseFloat(lat) : lat;
  const lngNum = typeof lng === "string" ? parseFloat(lng) : lng;
  const resolvedId = targetId || reportId;
  const resolvedType =
    typeof targetType === "string" && targetType.length > 0
      ? targetType
      : reportId
        ? "report"
        : "mosque";

  if (
    typeof latNum !== "number" ||
    typeof lngNum !== "number" ||
    !resolvedId ||
    Number.isNaN(latNum) ||
    Number.isNaN(lngNum)
  ) {
    return res
      .status(400)
      .json({ error: "lat, lng (number) and targetId are required" });
  }

  try {
    const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${latNum},${lngNum}&zoom=17&size=800x600&maptype=satellite&key=${apiKey}`;

    const mapResponse = await fetch(mapUrl);
    if (!mapResponse.ok) {
      const text = await mapResponse.text();
      return res.status(502).json({
        error: `Failed to fetch static map from Google: ${mapResponse.status} ${mapResponse.statusText} ${text}`,
      });
    }

    const buffer = Buffer.from(await mapResponse.arrayBuffer());
    const safeType = resolvedType.replace(/[^a-zA-Z0-9_-]/g, "") || "map";
    const path = `map-photos/${safeType}-${resolvedId}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from("mosque-photos")
      .upload(path, buffer, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      return res.status(500).json({ error: uploadError.message });
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("mosque-photos").getPublicUrl(path);

    return res.status(200).json({ url: publicUrl, path });
  } catch (error: unknown) {
    console.error("map-photo error", error);
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return res.status(500).json({ error: message });
  }
}
