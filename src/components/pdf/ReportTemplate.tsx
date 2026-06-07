/* eslint-disable @next/next/no-img-element */
import React from "react";
import { Report } from "@/types";

interface ReportTemplateProps {
  report: Report;
  reportDate: string;
  includeTerms?: boolean;
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

export const ReportTemplate = React.forwardRef<
  HTMLDivElement,
  ReportTemplateProps
>(({ report, reportDate, includeTerms = true }, ref) => {
  const chunkRows = <T,>(rows: T[], size: number): T[][] => {
    const chunks: T[][] = [];

    for (let index = 0; index < rows.length; index += size) {
      chunks.push(rows.slice(index, index + size));
    }

    return chunks;
  };

  const getTableTitle = (baseTitle: string, pageIndex: number) =>
    pageIndex === 0 ? baseTitle : `استكمال ${baseTitle}`;

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
  const specRows: {
    no: number;
    sub_item: string;
    spec: string;
    cause: string;
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

      specRows.push({
        no: itemNumber,
        sub_item: item.sub_items?.name_ar || "غير محدد",
        cause: item.causes?.name_ar || "لا يوجد",
        spec: item.specs?.name || "لا يوجد",
      });

      itemNumber++;
    });
  });

  // حساب المصروفات التشغيلية بحد أقصى 20,000 ريال
  const calculatedExpense = itemsTotal * opExpenseRate;
  const operationalExpense = Math.min(calculatedExpense, 20000);
  const grandTotal = itemsTotal + operationalExpense;

  const termsPageOne = [
    {
      title: "1. المساهمة في الترويج",
      body: "يتعهد مشرف المسجد بالمساهمة في جمع التبرعات والترويج للفرصة عبر قنواته المتاحة، بما يعزز من فرص نجاحها.",
    },
    {
      title: "2. ضوابط الاستمرار أو الإزالة للفرصة من المتجر",
      body: "سيتم إغلاق الفرصة من المتجر تلقائياً في حال عدم تحقيق نسب التقدم التالية خلال الفترة الزمنية المحددة:",
      bullets: [
        "أ- إذا كانت قيمة الفرصة أكثر من (50,000 ريال) — المدة القصوى: 60 يوم",
        "• بعد 30 يوم: إذا لم تتجاوز التبرعات نسبة 50%",
        "ب- إذا كانت قيمة الفرصة أقل من (50,000 ريال) — المدة القصوى: 45 يوم",
        "• بعد 20 يوم: إذا لم تتجاوز التبرعات نسبة 50%",
      ],
    },
    {
      title: "3. ثبات المواصفات والسعر بعد اعتماد الفرصة",
      body: "لا يجوز المطالبة بتغيير أو حذف أي بند من بنود المشروع بعد إدراجه في المتجر، وذلك لتأثيره على السعر المعتمد والفرصة المنشورة.",
    },
    {
      title: "4. تنفيذ المشروع فقط بإشراف الجمعية",
      body: "يُمنع تنفيذ أو تعديل أي بند من بنود المشروع دون إشراف الجمعية أو التنسيق معها، وفي حال المخالفة يتحمل مشرف المسجد كامل المسؤولية القانونية والإدارية.",
    },
    {
      title: "5. الامتناع عن التدخل في تنفيذ المشروع",
      body: "يُمنع التدخل أو تعطيل عمل الشركات المنفذة أو المتعاقدة مع الجمعية أثناء التنفيذ.",
    },
  ];

  const termsPageTwo = [
    {
      title: "6. ضوابط النشر والتسويق",
      body: "جميع الرسائل أو المواد التسويقية التي يُروّج لها من قبل المشرف لا تُعبّر عن الجمعية، إلا ما تم اعتماده رسمياً من فريق التسويق في الجمعية.",
    },
    {
      title: "7. تنظيم عرض الفرص في المتجر",
      body: "تُقسّم الفرصة حسب البنود والمبالغ، وتُدرج البنود وفقاً لأولويات يتم تحديدها من قبل مشرف المسجد.",
    },
    {
      title: "8. تحديد الأولويات",
      body: "مشرف المسجد هو المسؤول عن تحديد أولوية البنود المراد تسويقها وتنفيذها، ولا تُعرض البنود التالية إلا بعد اكتمال البنود ذات الأولوية.",
    },
    {
      title: "9. التصرف بالمبالغ في حال عدم اكتمال التمويل",
      body: "في حال انتهاء المدة المحددة دون اكتمال المبلغ، يتم تخصيص المبلغ لبند آخر داخل المشروع أو حسب الاتفاق.",
    },
    {
      title: "10. الرسوم التشغيلية",
      body: "جميع المبالغ تشمل رسوم تشغيل بنسبة 10% (مثل رسوم الدفع الإلكتروني وتشغيل المنصة).",
    },
  ];

  // 
  tableRows.push({
    no: itemNumber,
    item: "مصروفات تشغيلية بنسبة 10%",
    qty: 1,
    unit: "عملية",
    unit_price: operationalExpense.toFixed(2),
    total: operationalExpense.toFixed(2),
    isOperational: true,
  });

  // ===== Pagination =====
  // ارتفاع الصف التقريبي: 14px خط + 12px padding + 1px border ≈ 32px
  // مساحة المحتوى: 794 - 105 - 110 - 40(padding) = 539px
  const ROWS_PER_COST_PAGE = 13; // (539 - 32 header - 32 يتبع) / 32 ≈ 14, نحافظ على 13 هامشاً
  const ROWS_PER_SPEC_PAGE = 7; // 7 بنود لكل صفحة في جدول المواصفات
  const costPageChunks = chunkArray(tableRows, ROWS_PER_COST_PAGE);
  const specPageChunks = chunkArray(specRows, ROWS_PER_SPEC_PAGE);

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
        <span className="tag">📅 تاريخ إعداد التقرير:</span>
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

        @font-face{
          font-family:"NeoSansArabicMedium";
          src:url("/fonts/NeoSansArabicMedium.ttf") format("truetype");
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
          flex-direction:column;
          align-items:center;
          padding:20px;
          gap:6px;
        }

        .table-title{
          margin:0;
          color:#0e4d3b;
          font-size:18px;
          font-weight:800;
          line-height:1.2;
        }

        .table-continuation-header{
          align-self:flex-end;
          display:flex;
          align-items:center;
          gap:10px;
          background:#e8f5e9;
          border-right:3px solid #005f46;
          border-radius:4px;
          padding:5px 14px;
          color:#005f46;
          font-size:13px;
          font-weight:700;
          direction:rtl;
        }

        .table-continuation-header .page-badge{
          background:#005f46;
          color:#fff;
          padding:2px 9px;
          border-radius:10px;
          font-size:12px;
          font-weight:700;
        }

        .table-page-title{
          position:absolute;
          left:64px;
          right:64px;
          top:82px;
          text-align:center;
          font-size:14px;
          font-weight:700;
          color:#005f46;
          letter-spacing:0.5px;
          direction:rtl;
        }

        .continues-indicator td{
          background:#e8f5e9 !important;
          color:#005f46 !important;
          font-weight:700;
          text-align:center;
          font-size:13px;
          padding:5px 10px;
          letter-spacing:0.3px;
          border-top:1px dashed #4a8c5f;
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
          vertical-align:middle;
          line-height:1.2;
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

        table.specs{
          border-collapse:collapse;
          width:100%;
          max-width:1200px;
          font-size:16px;
          text-align:right;
          background:#fff;
          direction:rtl;
        }

        .specs th,
        .specs td{
          border:1px solid #2d6f5f;
          padding:8px 10px;
          vertical-align:middle;
          line-height:1.25;
        }

        .specs th{
          background:#4a8c5f;
          color:#fff;
          font-weight:700;
          text-align:center;
        }

        .specs tr:nth-child(even) td{
          background:#f3f7ee;
        }

        .terms-wrap{
          display:flex;
          flex-direction:column;
          gap:14px;
          padding:8px 0;
          line-height:1.55;
          color:#1f2d2a;
        }

        .content.terms-wrap{
          inset:105px 64px 132px 64px;
        }

        .terms-page-one{
          line-height:1.45;
        }

        .terms-page-one .terms-list{
          gap:8px;
        }

        .terms-page-one .terms-item-title{
          font-size:17px;
        }

        .terms-page-one .terms-item-body{
          font-size:14px;
        }

        .terms-page-one .terms-bullets{
          gap:2px;
          margin-right:10px;
        }

        .terms-title{
          margin:0;
          color:var(--accent);
          font-size:23px;
          font-weight:800;
        }

        .terms-intro{
          margin:0;
          font-size:16px;
          color:#0e4d3b;
          font-weight:600;
        }

        .terms-list{
          display:flex;
          flex-direction:column;
          gap:10px;
        }

        .terms-item{
          display:flex;
          flex-direction:column;
          gap:4px;
        }

        .terms-item-title{
          margin:0;
          font-size:18px;
          font-weight:700;
          color:#0e4d3b;
        }

        .terms-item-body{
          margin:0;
          font-size:15px;
        }

        .terms-bullets{
          display:flex;
          flex-direction:column;
          gap:4px;
          margin-right:12px;
          font-size:15px;
        }

        .terms-signature{
          margin-top:4px;
          border-top:1px solid #2d6f5f;
          padding-top:10px;
          display:flex;
          flex-direction:column;
          gap:8px;
        }

        .signature-title{
          margin:0;
          color:#0e4d3b;
          font-size:17px;
          font-weight:700;
        }

        .signature-line{
          margin:0;
          font-size:16px;
          font-weight:600;
        }

        .thanks-wrap{
          display:flex;
          align-items:center;
          justify-content:center;
          text-align:center;
        }

        .thanks-page{
          background:#007248;
        }

        .thanks-text{
          margin:0;
          color:#ffffff;
          font-size:54px;
          font-family:"NeoSansArabicMedium","Tajawal",sans-serif;
          font-weight:500;
          letter-spacing:normal;
          direction:rtl;
          unicode-bidi:plaintext;
          white-space:nowrap;
          line-height:1.2;
          text-rendering:optimizeLegibility;
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
                      {(items[0].sub_items?.name_ar || "بند فرعي غير محدد") +
                        " " +
                        (items[0].causes?.name_ar || "لا يوجد")}
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
                          {(items[photoIndex]?.sub_items?.name_ar || "") +
                            " " +
                            (items[photoIndex]?.causes?.name_ar || "لا يوجد")}
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

<<<<<<< HEAD
        {/* جدول التكاليف — تقسيم تلقائي على صفحات */}
        {costPageChunks.map((pageRows, pageIndex) => {
          const isLastCostPage = pageIndex === costPageChunks.length - 1;
          const isCostContinuation = pageIndex > 0;
          const totalCostPages = costPageChunks.length;

          return (
            <section key={`cost-page-${pageIndex}`} className="page">
              <Header />
              <div className="table-page-title">جدول التكاليف</div>
              <div className="content p5-wrap">
                {isCostContinuation && (
                  <div className="table-continuation-header">
                    <span>تابع ←</span>
                    <span>جدول التكاليف</span>
                    <span className="page-badge">{pageIndex + 1} / {totalCostPages}</span>
                  </div>
                )}
                <table className="cost">
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
                    {pageRows.map((row, index) => {
                      const isOp = row.isOperational;
                      return (
                        <tr key={index}>
                          <td>{row.no}</td>
                          {isOp ? (
                            <>
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
                    {!isLastCostPage && (
                      <tr className="continues-indicator">
                        <td colSpan={6}>← يتبع في الصفحة التالية</td>
                      </tr>
                    )}
                  </tbody>
                  {isLastCostPage && (
                    <tfoot>
                      <tr>
                        <td colSpan={5}>إجمالي التكلفة</td>
                        <td>{grandTotal.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
              <Footer />
            </section>
          );
        })}

        {/* جدول المواصفات — تقسيم تلقائي على صفحات */}
        {specPageChunks.map((pageRows, pageIndex) => {
          const isLastSpecPage = pageIndex === specPageChunks.length - 1;
          const isSpecContinuation = pageIndex > 0;
          const totalSpecPages = specPageChunks.length;

          return (
            <section key={`spec-page-${pageIndex}`} className="page">
              <Header />
              <div className="table-page-title">جدول المواصفات</div>
              <div className="content p5-wrap">
                {isSpecContinuation && (
                  <div className="table-continuation-header">
                    <span>تابع ←</span>
                    <span>جدول المواصفات</span>
                    <span className="page-badge">{pageIndex + 1} / {totalSpecPages}</span>
                  </div>
                )}
                <table className="specs">
                  <thead>
                    <tr>
                      <th>رقم البند</th>
                      <th>البند الفرعي</th>
                      <th>المسبب</th>
                      <th>المواصفات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((row) => (
                      <tr key={`spec-${row.no}`}>
                        <td style={{ textAlign: "center" }}>{row.no}</td>
                        <td>{row.sub_item}</td>
                        <td>{row.cause}</td>
                        <td>{row.spec}</td>
                      </tr>
                    ))}
                    {!isLastSpecPage && (
                      <tr className="continues-indicator">
                        <td colSpan={4}>← يتبع في الصفحة التالية</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Footer />
            </section>
          );
        })}

        {includeTerms && (
          <>
            <section className="page">
              <Header />
              <div className="content terms-wrap terms-page-one">
                <h2 className="terms-title">الشروط والأحكام الخاصة بفتح فرص التبرع عبر متجر جمعية يعمر:</h2>
                <p className="terms-intro">
                  لضمان جودة تنفيذ المشاريع وتحقيق الأثر المستدام في خدمة المساجد، يشترط قبل فتح أي فرصة تبرع عبر متجر جمعية يعمر، موافقة مشرف المسجد والتزامه بالشروط التالية:
                </p>

                <div className="terms-list">
                  {termsPageOne.map((term) => (
                    <div className="terms-item" key={term.title}>
                      <p className="terms-item-title">{term.title}</p>
                      <p className="terms-item-body">{term.body}</p>
                      {term.bullets && (
                        <div className="terms-bullets">
                          {term.bullets.map((bullet) => (
                            <p className="terms-item-body" key={bullet}>{bullet}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <Footer />
            </section>

            <section className="page">
              <Header />
              <div className="content terms-wrap terms-page-two">
                <div className="terms-list">
                  {termsPageTwo.map((term) => (
                    <div className="terms-item" key={term.title}>
                      <p className="terms-item-title">{term.title}</p>
                      <p className="terms-item-body">{term.body}</p>
                    </div>
                  ))}
                </div>

                <div className="terms-signature">
                  <p className="signature-title">يرجى التوقيع أدناه للإقرار بالاطلاع والموافقة على هذه الشروط:</p>
                  <p className="signature-line">الاسم: ______________________</p>
                  <p className="signature-line">الصفة: ______________________ (إمام / مؤذن / مشرف مسجد)</p>
                  <p className="signature-line">التوقيع: ____________________</p>
                  <p className="signature-line">التاريخ: ____/____/____</p>
                </div>
              </div>
              <Footer />
            </section>
          </>
        )}

        <section className="page thanks-page">
         
          <div className="content thanks-wrap">
            <p className="thanks-text">شكراً لكم</p>
          </div>
          
        </section>
      </div>
    </div>
  );
});

ReportTemplate.displayName = "ReportTemplate";

