/* eslint-disable @next/next/no-img-element */
import React from "react";
import { Report } from "@/types";

interface ReportTemplateProps {
  report: Report;
  reportDate: string;
}

export const ReportTemplate = React.forwardRef<
  HTMLDivElement,
  ReportTemplateProps
>(({ report, reportDate }, ref) => {
  const mosques = report.mosques;
  const issues = report.report_issues || [];
  const mapLikePhoto =
    report.map_photo_url ||
    (issues[0]?.issue_photos && issues[0].issue_photos[0]
      ? issues[0].issue_photos[0].photo_url
      : undefined);

  // =====  =====
  let itemsTotal = 0;
  const opExpenseRate = 0.1; // 10%
  const tableRows: {
    no: number;
    item: string;
    qty: number;
    unit: string;
    unit_price: string;
    total: string;
    isOperational?: boolean;
  }[] = [];
  let itemNumber = 1;

  issues.forEach((issue) => {
    (issue.issue_items || []).forEach((item) => {
      const quantity = item.quantity || 0;
      const unitPrice =
        typeof item.unit_price === "number" && !Number.isNaN(item.unit_price)
          ? item.unit_price
          : item.sub_items?.unit_price || 0;
      const itemTotal = quantity * unitPrice;
      itemsTotal += itemTotal;
      const itemName =
        item.sub_items?.name_table ??
        item.sub_items?.name_ar ??
        "غير محدد";

      tableRows.push({
        no: itemNumber,
        item: itemName,
        qty: quantity,
        unit: item.sub_items?.unit_ar || "غير محدد",
        unit_price: unitPrice.toFixed(2),
        total: itemTotal.toFixed(2),
      });

      itemNumber++;
    });
  });

  const operationalExpense = itemsTotal * opExpenseRate;
  const grandTotal = itemsTotal + operationalExpense;

  // 
  tableRows.push({
    no: itemNumber,
    item: "مصروفات تشغيلية (10%)",
    qty: 1,
    unit: "العملية",
    unit_price: operationalExpense.toFixed(2),
    total: operationalExpense.toFixed(2),
    isOperational: true,
  });

  // =====  =====
  const Header: React.FC = () => (
    <>
      <div className="top-line" />
      <div className="top-logoY">
        <img src="/logo/logo-topline.svg" alt="" />
      </div>
      <div className="top-logoM">
        <img
          src="/logo/Ministry_of_islamic_affairs_in_saudi_arabia_Logo.svg"
          alt=""
        />
      </div>
    </>
  );

  const Footer: React.FC = () => (
    <>
      <div className="date-row">
        <span className="tag">📅 تاريخ أعداد التقرير:</span>
        <span className="tag dateText">{reportDate}</span>
      </div>
      <div className="bottom-line" />
      <div className="footer">
        <div className="info" id="footerInfo">
          جمعية متخصصة في تلبيةاحتياج المساجد في البناء-الصيانة-التشغيل-العناية-السقيا وجميع مايخدم بيوت الله
        </div>
        <div className="footerinfo">
          <div className="imglogo" />
          <p id="footerSocial">Yaamur_org 📱</p>
        </div>
        <div className="footerinfo">
          <div className="imglogo" />
          <p id="footerSite">https://yaamur.org.sa 🌍</p>
        </div>
        <div className="footerinfo">
          <div className="imglogo" />
          <p id="footerEmail">info@yaamur.org.sa 📧</p>
        </div>
        <div className="footerinfo">
          <div className="imglogo" />
          <p id="footerStore">https://store.yaamur.org.sa 🛍️</p>
        </div>
      </div>
    </>
  );

  return (
    <div ref={ref} className="report-wrapper">
      <style>{`
        :root{
          --bg:#f3f7ee;
          --line:#2d6f5f;
          --accent:#005f46;
          --muted:#005B36;
          --ink:#1f2d2a;
        }

        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');

        @font-face{
          font-family:"NeoSansArabic";
          src:url("/fonts/DGShamael-Regular.ttf") format("truetype");
          font-display:swap;
        }

        .report-wrapper{
          margin:0;
          background:#fafafa;
          color:var(--ink);
          direction:rtl;
          font-family:"NeoSansArabic","Tajawal",system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif;
        }

        *{ box-sizing:border-box; }

        .doc{
          display:flex;
          flex-direction:column;
         
        }

        .page{
          width: 1123px;
          height: 794px;
              padding:0 0;
              margin:0 0;
              background:#f3f7ee;        /* نفس var(--bg) */
              border:1px solid #e0e7e4;
              position:relative;
              overflow:hidden;
            
        }

        
        .content{
          position:absolute;
          inset:105px 64px 110px 64px;
        }

        /* Header */
        .top-line{
          position:absolute;
          left:64px;
          right:64px;
          top:78px;
          height:2px;
          background:var(--line);
          opacity:.7;
        }

        .top-logoY,
        .top-logoM{
          position:absolute;
          top:78px;
          height:2px;
          background:#005f46;
        }

        .top-logoY{ left:700px; }
        .top-logoY img{
          position:absolute;
          left:39px;
          top:-39px;
          height:30px;
          max-width:300px;
        }

        .top-logoM{ left:190px; }
        .top-logoM img{
          position:absolute;
          top:-75px;
          height:70px;
          max-width:300px;
        }

        /* Footer */
        .date-row{
          position:absolute;
          right:64px;
          bottom:92px;
          display:flex;
         
          color:#0e4d3b;
        }

        .tag{
          padding:8px 14px;
          border-radius:8px;
          font-weight:700;
        }

        .bottom-line{
          position:absolute;
          left:64px;
          right:64px;
          bottom:88px;
          height:2px;
          background:#1f2d2a;
          opacity:.6;
        }

        .footer{
          position:absolute;
          left:64px;
          right:64px;
          bottom:25px;
          display:flex;
          justify-content:space-between;
          align-items:center;
          flex-wrap:wrap;
          gap:10px;
          color:var(--muted);
          font-size:12px;
          direction:rtl;
        }

        .footer > div{
          display:flex;
          align-items:center;
          gap:8px;
          padding-left:20px;
        }

        .footer .info{
          flex:3;
          max-width:600px;
          line-height:1.6;
        }

        .footerinfo{
          display:flex;
          flex-direction:column;
          align-items:center;
          gap:1px;
          padding-left:0;
          max-width:350px;
          text-align:center;
        }

        .footerinfo img{
          max-width:29px;
          max-height:29px;
        }

        .footerinfo p{
          margin:0;
        }

        /* Shared */
        .right{
          display:flex;
          flex-direction:column;
          gap:38px;
        }

        .brand img{
          width:400px;
          height:200px;
          object-fit:contain;
        }

        .title-card h1{
          margin:0;
          color:var(--accent);
          font-size:44px;
          font-weight:700;
        }

        .subtitle{
          margin-top:10px;
          font-size:28px;
          color:#0e4d3b;
        }

        .photo-wrap{
          border-radius:8px;
          overflow:hidden;
          display:flex;
          align-items:center;
          justify-content:center;
        }

        .photo-wrap img{
          width:80%;
          height:80%;
          object-fit:cover;
        }

        /* Page 2 blocks */
        .mosque-bnod{
          display:flex;
          align-items:center;
          justify-content:flex-start;
          gap:12px;
          margin:1px 0;
        }

        .mosque-bnod p{
          font-size:22px;
        }

        .mosque-bnod .label{
          margin:0;
          color:#0e4d3b;
          font-weight:600;
        }

        .mosque-bnod .name{
          margin:0;
          word-break: break-all;
          color:#1f2d2a;
          
        }

        /* Issue pages (page 3 & 4 style) */
        .p4-wrap{
          display:flex;
          flex-direction:column;
          align-items:center;
          gap:18px;
        }

        .p4-row{
          display:flex;
          justify-content:center;
          align-items:flex-start;
          gap:28px;
        }

        .p4-card{
          display:flex;
          flex-direction:column;
          align-items:center;
          gap:10px;
          width:312px;
        }

        .p4-card img{
          width:100%;
          height:380px;
          object-fit:cover;
          background:#fff;
        }

        .p4-sub{
          padding:6px 14px;
          font-size:18px;
          text-align:center;
          min-width:140px;
        }

        .p4-main{
          text-align:center;
          color:#0e4d3b;
          font-size:22px;
          font-weight:700;
        }

        /* Cost table page */
        .p5-wrap{
          display:flex;
          justify-content:center;
          align-items:flex-start;
          padding:20px;
        }

        table.cost{
          border-collapse:collapse;
          width:100%;
          max-width:1200px;
          font-size:14px;
          text-align:center;
          background:#fff;
          direction:rtl;
        }

        .cost th,
        .cost td{
          border:1px solid #2d6f5f;
          padding:6px 10px;
        }

        .cost th{
          background:#4a8c5f;
          color:#fff;
          font-weight:700;
        }

        .cost tr:nth-child(even) td{
          background:#f3f7ee;
        }

        .cost tfoot td{
          background:#d9f0e0;
          font-weight:bold;
        }

        @media print{
          @page{
            size:A4 landscape;
            margin:0;
          }
          .report-wrapper{
            background:var(--bg);
            padding:0;
          }
          .doc{
            gap:0;
          }
          .page{
            border:0 0;
            border-radius:0;
           width: 1123px;
           height: 794px;
          }
        }
      `}</style>
        
      <div className="doc">
        {/* */}
        <section className="page">
          <Header />
          <div
            className="content"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "48px",
            }}
          >
            <div className="right">
              <div className="brand">
                <img src="/logo/logo-brand.svg" alt="" />
              </div>
              <div className="title-card">
                <h1>تقرير المعاينة</h1>
                <div className="subtitle">
                  {mosques?.name || "غير محدد"}
                </div>
                <div className="subtitle" style={{ opacity: 0.9 }}>
                  {(mosques?.district || "") + (", ")+
                    (mosques?.city ? `${mosques.city}` : "")}
                </div>
              </div>
            </div>

            <div className="photo-wrap">
              {mosques?.main_photo_url && (
                <img
                  src={mosques.main_photo_url}
                  alt="صورة المسجد الاساسية"
                  crossOrigin="anonymous"
                />
              )}
            </div>
          </div>
          <Footer />
        </section>

        {/* */}
        <section className="page">
          <Header />
          <div
            className="content"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "48px",
            }}
          >
            <div className="right">
              <div className="title-card">
                <h1>بنود الطلب</h1>
              </div>

              <div className="mosque-bnod">
                <div>
                  <p className="label">👤 اسم مشرف المسجد:</p>
                  <p className="name">
                    {mosques?.supervisor_name || "غير محدد"}
                  </p>
                </div>
              </div>

              <div className="mosque-bnod">
                <div>
                  <p className="label">📞 رقم جوال مشرف المسجد:</p>
                  <p className="name">
                    {mosques?.supervisor_phone || "غير محدد"}
                  </p>
                </div>
              </div>

              <div className="mosque-bnod">
                <div>
                  <p className="label">📍 الموقع:</p>
                  <p className="name">
                    {mosques?.location_link ||
                      (mosques
                        ? `${mosques.district || ""} ${
                            mosques.city || ""
                          }`
                        : "غير محدد")}
                  </p>
                </div>
              </div>
            </div>

            <div className="photo-wrap">
              {/* \\*/}
              {mapLikePhoto ? (
                <img
                  src={mapLikePhoto}
                  alt="¯"
                  crossOrigin="anonymous"
                />
              ) : (
                <div
                  style={{
                    padding: 16,
                    textAlign: "center",
                    width: "100%",
                    fontSize: 20,
                  }}
                >
                  {mosques?.location_link || "غير محدد"}
                </div>
              )}
            </div>
          </div>
          <Footer />
        </section>

        {/* */}
        {issues.map((issue, issueIndex) => {
          const photos = issue.issue_photos || [];
          const items = issue.issue_items || [];

          // single
          if (issue.issue_type === "single" && photos.length >= 3) {
            return (
              <section key={`issue-${issueIndex}`} className="page">
                <Header />
                <div className="content p4-wrap">
                  <div className="p4-row">
                    {photos.slice(0, 3).map((photo, photoIndex) => (
                      <figure className="p4-card" key={photoIndex}>
                        <img
                          src={photo.photo_url}
                          alt={`بند 1 ${photoIndex + 1}`}
                          crossOrigin="anonymous"
                        />
                      </figure>
                    ))}
                  </div>
                  <div className="p4-main">
                    {issue.main_items?.name_ar || "بند اساسي غير محدد"}
                  </div>
                  {items[0] && (
                    <div className="p4-sub">
                      {items[0].sub_items?.name_ar || "بند فرعي غير محدد"}
                    </div>
                  )}
                </div>
                <Footer />
              </section>
            );
          }

          // multiple
          if (
            issue.issue_type === "multiple" &&
            photos.length >= 3 &&
            items.length >= 3
          ) {
            return (
              <section key={`issue-${issueIndex}`} className="page">
                <Header />
                <div className="content p4-wrap">
                  <div className="p4-row">
                    {photos.slice(0, 3).map((photo, photoIndex) => (
                      <figure className="p4-card" key={photoIndex}>
                        <img
                          src={photo.photo_url}
                          alt={`بند فرعي ${photoIndex + 1}`}
                          crossOrigin="anonymous"
                        />
                        <figcaption className="p4-sub">
                          {items[photoIndex]?.sub_items?.name_ar || ""}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                  <div className="p4-main">
                    {issue.main_items?.name_ar || "بند اساسي غير محدد"}
                  </div>
                </div>
                <Footer />
              </section>
            );
          }

          return null;
        })}

        {/*  */}
        <section className="page">
          <Header />
          <div className="content p5-wrap">
            <table className="cost">
              <thead>
                <tr>
                  <th>م</th>
                  <th>البند</th>
                  <th>العدد</th>
                  <th>الوحد</th>
                  <th>التكلفة الفردية بالريال</th>
                  <th>التكلفة الإجمالية بالريال</th>
                </tr>
                              </thead>
                              <tbody>
                  {tableRows.map((row, index) => {
                    const isOp = row.isOperational;

                    return (
                      <tr key={index}>
                        <td>{row.no}</td>

                        {isOp ? (
                          <>
                            {/* ندمج 4 أعمدة: البند + العدد + الوحدة + التكلفة الفردية */}
                            <td colSpan={4} style={{ textAlign: "center" }}>
                              {row.item}
                            </td>
                            <td>{row.total}</td>
                          </>
                        ) : (
                          <>
                            <td>{row.item}</td>
                            <td>{row.qty}</td>
                            <td>{row.unit}</td>
                            <td>{row.unit_price}</td>
                            <td>{row.total}</td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>

              <tfoot>
                <tr>
                  <td colSpan={5}>أجمالي التكلفة </td>
                  <td>{grandTotal.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <Footer />
        </section>
      </div>
    </div>
  );
});

ReportTemplate.displayName = "ReportTemplate";

