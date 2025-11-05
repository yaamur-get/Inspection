import React from "react";
import { Report } from "@/types";

interface ReportTemplateProps {
  report: Report;
  reportDate: string;
}

export const ReportTemplate = React.forwardRef<HTMLDivElement, ReportTemplateProps>(
  ({ report, reportDate }, ref) => {
    const mosques = report.mosques;
    const issues = report.report_issues || [];

    // Calculate totals
    const operationalExpense = 10;
    let grandTotal = operationalExpense;
    const tableRows: any[] = [];
    let itemNumber = 1;

    issues.forEach((issue) => {
      (issue.issue_items || []).forEach((item) => {
        const quantity = item.quantity || 0;
        const unitPrice = item.sub_items?.unit_price || 0;
        const itemTotal = quantity * unitPrice;
        grandTotal += itemTotal;

        tableRows.push({
          no: itemNumber,
          item: item.sub_items?.name_ar || "غير محدد",
          qty: quantity,
          unit: item.sub_items?.unit_ar || "وحدة",
          unit_price: unitPrice.toFixed(2),
          total: itemTotal.toFixed(2),
        });
        itemNumber++;
      });
    });

    // Add operational expense
    tableRows.push({
      no: itemNumber,
      item: "المصاريف التشغيلية",
      qty: 1,
      unit: "مرة",
      unit_price: operationalExpense.toFixed(2),
      total: operationalExpense.toFixed(2),
    });

    return (
      <div ref={ref} className="report-wrapper">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');

          .report-wrapper {
            width: 1400px;
            margin: 0 0;
            background: #fafafa;
            font-family: 'Tajawal', system-ui, -apple-system, sans-serif;
            direction: rtl;
          }

          .pdf-report-root {
            width: 1123px;
            margin: 0 0;
            background: #fafafa;
          }

          .pdf-page {
  width: 1123px;
  height: 787px;   /* بدل 794px */
  background: #f3f7ee;
  position: relative;
}


          .pdf-page:last-child {
            margin-bottom: 0;
          }

          .pdf-content {
  position: absolute;
  top: 80px;        /* بدل 110 */
  left: 64px;
  right: 64px;
  bottom: 80px;     /* بدل 110 */
}


          /* Header */
          .pdf-header {
            position: absolute;
            top: 78px;
            left: 64px;
            right: 64px;
            height: 2px;
            background: #2d6f5f;
            opacity: 0.7;
          }

          .pdf-header-text {
            position: absolute;
            right: 64px;
            top: 55px;
            font-size: 20px;
            font-weight: 700;
            color: #2d6f5f;
          }
            .pdf-header-image {
            position: absolute;
            right: 64px;
            top: 55px;
            font-size: 20px;
            font-weight: 700;
            color: #2d6f5f;
          }

          /* Footer */
          .pdf-date-tags {
            position: absolute;
            right: 64px;
            bottom: 92px;
            display: flex;
            gap: 10px;
            color: #0e4d3b;
          }

          .pdf-tag {
            padding: 8px 14px;
            border-radius: 8px;
            font-weight: 700;
            background: #e9f7f1;
            white-space: nowrap;
          }

          .pdf-footer-line {
            position: absolute;
            left: 64px;
            right: 64px;
            bottom: 88px;
            height: 2px;
            background: #2d6f5f;
            opacity: 0.6;
          }

          .pdf-footer {
            position: absolute;
            left: 64px;
            right: 64px;
            bottom: 40px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 20px;
            color: #005B36;
            font-size: 15px;
            flex-wrap: nowrap;
          }

          .pdf-footer-item {
            white-space: nowrap;
          }

          /* Cover Page */
          .cover-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 48px;
            height: 100%;
            align-items: center;
          }

          .cover-text {
            display: flex;
            flex-direction: column;
            gap: 20px;
            padding-right: 40px;
          }

          .cover-title {
            font-size: 44px;
            font-weight: 700;
            color: #005f46;
            margin: 0;
            line-height: 1.2;
          }

          .cover-subtitle {
            font-size: 28px;
            color: #0e4d3b;
            margin: 10px 0 0 0;
            line-height: 1.3;
          }

          .cover-photo {
            width: 100%;
            height: 550px;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.15);
          }

          .cover-photo img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          /* Details Page */
          .details-grid {
            display: grid;
            grid-template-columns: 1.2fr 0.8fr;
            gap: 48px;
            height: 100%;
          }

          .details-info {
            display: flex;
            flex-direction: column;
            gap: 24px;
            padding-top: 40px;
          }

          .details-title {
            font-size: 32px;
            font-weight: 700;
            color: #005f46;
            margin: 0 0 20px 0;
          }

          .info-row {
            background: #e9f7f1;
            padding: 16px 20px;
            border-radius: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .info-label {
            font-size: 16px;
            font-weight: 600;
            color: #0e4d3b;
          }

          .info-value {
            font-size: 16px;
            font-weight: 700;
            color: #1f2d2a;
            text-align: left;
          }

          .map-placeholder {
            background: #e9f7f1;
            border-radius: 12px;
            padding: 40px;
            text-align: center;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100%;
          }

          .map-title {
            font-size: 18px;
            color: #005B36;
            margin-bottom: 10px;
          }

          .map-link {
            font-size: 12px;
            color: #2980b9;
            word-break: break-all;
            max-width: 90%;
          }

          /* Photos Page (Case 1) */
          .photos-container {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100%;
            gap: 24px;
          }

          .photos-grid {
            display: flex;
            gap: 20px;
            justify-content: center;
            align-items: center;
          }

          .photo-item {
            width: 380px;
            height: 450px;
            border-radius: 8px;
            overflow: hidden;
            border: 2px solid #2d6f5f;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }

          .photo-item img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .photos-title {
            text-align: center;
            padding: 0 40px;
          }

          .photos-main {
            font-size: 24px;
            font-weight: 700;
            color: #0e4d3b;
            margin: 0 0 8px 0;
          }

          .photos-sub {
            font-size: 18px;
            color: #1f2d2a;
            margin: 0;
          }

          /* Gallery Page (Case 2) */
          .gallery-container {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100%;
            gap: 20px;
          }

          .gallery-row {
            display: flex;
            gap: 28px;
            justify-content: center;
            align-items: flex-start;
          }

          .gallery-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            width: 380px;
          }

          .gallery-photo {
            width: 380px;
            height: 470px;
            border-radius: 8px;
            overflow: hidden;
            border: 2px solid #2d6f5f;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }

          .gallery-photo img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .gallery-caption {
            padding: 8px 16px;
            border: 2px solid #2d6f5f;
            border-radius: 8px;
            font-size: 16px;
            text-align: center;
            min-width: 160px;
            background: white;
          }

          .gallery-main-title {
            text-align: center;
            font-size: 22px;
            font-weight: 700;
            color: #0e4d3b;
            margin: 0;
          }

          /* Table Page */
          .table-container {
            display: flex;
            justify-content: center;
            align-items: flex-start;
            height: 100%;
            padding-top: 60px;
          }

          .table-title {
            text-align: center;
            font-size: 28px;
            font-weight: 700;
            color: #005f46;
            margin: 0 0 30px 0;
          }

          .cost-table {
            border-collapse: collapse;
            width: 100%;
            max-width: 1200px;
            font-size: 15px;
            text-align: center;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }

          .cost-table th,
          .cost-table td {
            border: 1px solid #2d6f5f;
            padding: 12px 16px;
          }

          .cost-table th {
            background: #4a8c5f;
            color: white;
            font-weight: 700;
            font-size: 16px;
          }

          .cost-table tbody tr:nth-child(even) {
            background: #f3f7ee;
          }

          .cost-table tfoot td {
            background: #d9f0e0;
            font-weight: bold;
            font-size: 16px;
            color: #0e4d3b;
          }

          /* ======= طباعة مبسّطة تماماً ======= */
                        @media print {
                  @page {
                    size: A4 landscape;
                    margin: 0;
                  }

                  html, body {
                    margin: 0;
                    padding: 0;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                  }

                  .pdf-report-root {
                    width: 100%;
                    margin: 0 auto;
                  }

                  .pdf-page {
                    width: 100%;
                    height: 720px !important;   /* نفس القيمة اللي فوق */
                    page-break-after: always;
                    page-break-inside: avoid;
                  }

                  .pdf-page:last-child {
                    page-break-after: auto;
                  }
                }

        `}</style>

        <div className="pdf-report-root">
          {/* Page 1: Cover */}
          <div className="pdf-page">
            <div className="pdf-header"></div>
            <div className="pdf-header-image"><img  className="pdf-header-image" src="..\public\logo\logo-topline.svg" alt="" /></div>

            <div className="pdf-content">
              <div className="cover-grid">
                <div className="cover-text">
                  <h1 className="cover-title">تقرير معاينة</h1>
                  <div className="cover-subtitle">{mosques?.name || ""}</div>
                  <div className="cover-subtitle" style={{ opacity: 0.9 }}>
                    {mosques?.district || ""}, {mosques?.city || ""}
                  </div>
                </div>
                <div className="cover-photo">
                  {mosques?.main_photo_url && (
                    <img
                      src={mosques.main_photo_url}
                      alt="صورة المسجد"
                      crossOrigin="anonymous"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="pdf-date-tags">
              <span className="pdf-tag">تاريخ إعداد التقرير:</span>
              <span className="pdf-tag">{reportDate}</span>
            </div>
            <div className="pdf-footer-line"></div>
            <div className="pdf-footer">
              <span className="pdf-footer-item">جمعية متخصصة في تلبية احتياج المساجد</span>
              <span className="pdf-footer-item">Yaamur_org</span>
              <span className="pdf-footer-item">https://yaamur.org.sa</span>
              <span className="pdf-footer-item">info@yaamur.org.sa</span>
            </div>
          </div>

          {/* Page 2: Details */}
          <div className="pdf-page">
            <div className="pdf-header"></div>
            <div className="pdf-header-text">جمعية يعمر الخيرية</div>

            <div className="pdf-content">
              <div className="details-grid">
                <div className="details-info">
                  <h2 className="details-title">بنود الطلب</h2>

                  <div className="info-row">
                    <span className="info-label">اسم مشرف المسجد:</span>
                    <span className="info-value">
                      {mosques?.supervisor_name || "غير محدد"}
                    </span>
                  </div>

                  <div className="info-row">
                    <span className="info-label">رقم جوال المشرف:</span>
                    <span className="info-value">
                      {mosques?.supervisor_phone || "غير محدد"}
                    </span>
                  </div>

                  <div className="info-row">
                    <span className="info-label">الموقع:</span>
                    <span className="info-value">
                      {mosques?.district || ""}, {mosques?.city || ""}
                    </span>
                  </div>
                </div>

                <div className="map-placeholder">
                  <div className="map-title">موقع المسجد - Google Maps</div>
                  {mosques?.location_link && (
                    <div className="map-link">{mosques.location_link}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="pdf-date-tags">
              <span className="pdf-tag">تاريخ إعداد التقرير:</span>
              <span className="pdf-tag">{reportDate}</span>
            </div>
            <div className="pdf-footer-line"></div>
            <div className="pdf-footer">
              <span className="pdf-footer-item">جمعية متخصصة في تلبية احتياج المساجد</span>
              <span className="pdf-footer-item">Yaamur_org</span>
              <span className="pdf-footer-item">https://yaamur.org.sa</span>
              <span className="pdf-footer-item">info@yaamur.org.sa</span>
            </div>
          </div>

          {/* Issue Pages */}
          {issues.map((issue, issueIndex) => {
            const photos = issue.issue_photos || [];
            const items = issue.issue_items || [];

            if (issue.issue_type === "single" && photos.length >= 3) {
              return (
                <div key={`issue-${issueIndex}`} className="pdf-page">
                  <div className="pdf-header"></div>
                  <div className="pdf-header-text">جمعية يعمر الخيرية</div>

                  <div className="pdf-content">
                    <div className="photos-container">
                      <div className="photos-grid">
                        {photos.slice(0, 3).map((photo, photoIndex) => (
                          <div key={photoIndex} className="photo-item">
                            <img
                              src={photo.photo_url}
                              alt={`صورة ${photoIndex + 1}`}
                              crossOrigin="anonymous"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="photos-title">
                        <p className="photos-main">
                          {issue.main_items?.name_ar || "غير محدد"}
                        </p>
                        {items[0] && (
                          <p className="photos-sub">
                            {items[0].sub_items?.name_ar || ""}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pdf-date-tags">
                    <span className="pdf-tag">تاريخ إعداد التقرير:</span>
                    <span className="pdf-tag">{reportDate}</span>
                  </div>
                  <div className="pdf-footer-line"></div>
                  <div className="pdf-footer">
                    <span className="pdf-footer-item">
                      جمعية متخصصة في تلبية احتياج المساجد
                    </span>
                    <span className="pdf-footer-item">Yaamur_org</span>
                    <span className="pdf-footer-item">https://yaamur.org.sa</span>
                    <span className="pdf-footer-item">info@yaamur.org.sa</span>
                  </div>
                </div>
              );
            } else if (
              issue.issue_type === "multiple" &&
              photos.length >= 3 &&
              items.length >= 3
            ) {
              return (
                <div key={`issue-${issueIndex}`} className="pdf-page">
                  <div className="pdf-header"></div>
                  <div className="pdf-header-text">جمعية يعمر الخيرية</div>

                  <div className="pdf-content">
                    <div className="gallery-container">
                      <div className="gallery-row">
                        {photos.slice(0, 3).map((photo, photoIndex) => (
                          <div key={photoIndex} className="gallery-card">
                            <div className="gallery-photo">
                              <img
                                src={photo.photo_url}
                                alt={`صورة ${photoIndex + 1}`}
                                crossOrigin="anonymous"
                              />
                            </div>
                            <div className="gallery-caption">
                              {items[photoIndex]?.sub_items?.name_ar || ""}
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="gallery-main-title">
                        {issue.main_items?.name_ar || "غير محدد"}
                      </p>
                    </div>
                  </div>

                  <div className="pdf-date-tags">
                    <span className="pdf-tag">تاريخ إعداد التقرير:</span>
                    <span className="pdf-tag">{reportDate}</span>
                  </div>
                  <div className="pdf-footer-line"></div>
                  <div className="pdf-footer">
                    <span className="pdf-footer-item">
                      جمعية متخصصة في تلبية احتياج المساجد
                    </span>
                    <span className="pdf-footer-item">Yaamur_org</span>
                    <span className="pdf-footer-item">https://yaamur.org.sa</span>
                    <span className="pdf-footer-item">info@yaamur.org.sa</span>
                  </div>
                </div>
              );
            }

            return null;
          })}

          {/* Page: Cost Table */}
          <div className="pdf-page">
            <div className="pdf-header"></div>
            <div className="pdf-header-text">جمعية يعمر الخيرية</div>

            <div className="pdf-content">
              <div className="table-container">
                <div style={{ width: "100%" }}>
                  <h2 className="table-title">بنود الصيانة والتكاليف</h2>
                  <table className="cost-table">
                    <thead>
                      <tr>
                        <th>م</th>
                        <th>البند</th>
                        <th>العدد</th>
                        <th>الوحدة</th>
                        <th>التكلفة الفردية بالريال</th>
                        <th>التكلفة الإجمالية بالريال</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableRows.map((row, index) => (
                        <tr key={index}>
                          <td>{row.no}</td>
                          <td>{row.item}</td>
                          <td>{row.qty}</td>
                          <td>{row.unit}</td>
                          <td>{row.unit_price}</td>
                          <td>{row.total}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={5}>إجمالي التكلفة</td>
                        <td>{grandTotal.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            <div className="pdf-date-tags">
              <span className="pdf-tag">تاريخ إعداد التقرير:</span>
              <span className="pdf-tag">{reportDate}</span>
            </div>
            <div className="pdf-footer-line"></div>
            <div className="pdf-footer">
              <span className="pdf-footer-item">جمعية متخصصة في تلبية احتياج المساجد</span>
              <span className="pdf-footer-item">Yaamur_org</span>
              <span className="pdf-footer-item">https://yaamur.org.sa</span>
              <span className="pdf-footer-item">info@yaamur.org.sa</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ReportTemplate.displayName = "ReportTemplate";
