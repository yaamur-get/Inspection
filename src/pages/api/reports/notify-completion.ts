import type { NextApiRequest, NextApiResponse } from "next";

type SuccessResponse = { success: true; id?: string };
type ErrorResponse = { error: string };

type RequestBody = {
  reportName?: string;
  reportAddress?: string;
  reportId?: string;
};

const DEFAULT_PROJECT_ADMIN_EMAIL = "M.alkarri@yaamur.org.sa";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.REPORT_NOTIFICATION_FROM_EMAIL;
  const toEmail =
    process.env.REPORT_NOTIFICATION_TO_EMAIL || DEFAULT_PROJECT_ADMIN_EMAIL;

  if (!resendApiKey) {
    return res.status(500).json({
      error: "RESEND_API_KEY is missing in environment variables",
    });
  }

  if (!fromEmail) {
    return res.status(500).json({
      error: "REPORT_NOTIFICATION_FROM_EMAIL is missing in environment variables",
    });
  }

  const { reportName, reportAddress, reportId } = (req.body || {}) as RequestBody;

  const safeName = (reportName || "تقرير معاينة").toString().trim();
  const safeAddress = (reportAddress || "غير متوفر").toString().trim();
  const safeReportId = (reportId || "-").toString().trim();

  const subject = `تم الانتهاء من تقرير المعاينة: ${safeName}`;
  const html = `
    <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; line-height: 1.8; color: #1f2937;">
      <h2 style="margin: 0 0 12px;">تم الانتهاء من تقرير المعاينة</h2>
      <p style="margin: 0 0 8px;"><strong>اسم التقرير:</strong> ${safeName}</p>
      <p style="margin: 0 0 8px;"><strong>عنوان التقرير:</strong> ${safeAddress}</p>
      <p style="margin: 0;"><strong>رقم التقرير:</strong> ${safeReportId}</p>
    </div>
  `;

  const text = [
    "تم الانتهاء من تقرير المعاينة",
    `اسم التقرير: ${safeName}`,
    `عنوان التقرير: ${safeAddress}`,
    `رقم التقرير: ${safeReportId}`,
  ].join("\n");

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        subject,
        html,
        text,
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | { id?: string; message?: string; error?: unknown }
      | null;

    if (!response.ok) {
      const upstreamMessage =
        (payload && typeof payload.message === "string" && payload.message) ||
        "Failed to send email";
      return res.status(502).json({ error: upstreamMessage });
    }

    return res.status(200).json({ success: true, id: payload?.id });
  } catch (error: unknown) {
    console.error("notify-completion error", error);
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return res.status(500).json({ error: message });
  }
}
