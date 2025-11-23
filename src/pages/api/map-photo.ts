import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "https://dugvorikvxmjicapftmp.supabase.co";
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL is required");
}
if (!supabaseServiceKey) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY (server key) is required for map-photo upload"
  );
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

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

  const apiKey = process.env.GMAPS_KEY;
  if (!apiKey) {
    return res
      .status(500)
      .json({ error: "GMAPS_KEY is missing in environment variables" });
  }

  const { lat, lng, reportId, userId } = req.body || {};
  const latNum = typeof lat === "string" ? parseFloat(lat) : lat;
  const lngNum = typeof lng === "string" ? parseFloat(lng) : lng;

  if (
    typeof latNum !== "number" ||
    typeof lngNum !== "number" ||
    !reportId ||
    Number.isNaN(latNum) ||
    Number.isNaN(lngNum)
  ) {
    return res
      .status(400)
      .json({ error: "lat, lng (number) and reportId are required" });
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
    const path = `map-photos/${reportId}.jpg`;

    const { data: uploadData, error: uploadError } = await supabase.storage
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
  } catch (error: any) {
    console.error("map-photo error", error);
    return res
      .status(500)
      .json({ error: error?.message || "Unexpected server error" });
  }
}
