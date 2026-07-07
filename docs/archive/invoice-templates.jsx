import { useState } from "react";

const sampleData = {
  company: { name: "شركة مسار للمقاولات", nameEn: "Masar Construction Co.", taxNumber: "300123456789003", address: "الرياض، المملكة العربية السعودية", phone: "+966 55 123 4567", email: "info@masar.sa", cr: "1010234567" },
  invoice: { number: "INV-2026-0042", type: "فاتورة ضريبية", issueDate: "2026/02/15", dueDate: "2026/03/15", status: "صادرة" },
  client: { name: "مؤسسة الأفق للتطوير العقاري", taxNumber: "300987654321003", address: "جدة، حي الروضة", phone: "+966 50 987 6543", email: "finance@alofuq.sa" },
  items: [
    { no: 1, desc: "أعمال حفر وتسوية الأرض", unit: "م³", qty: 250, price: 45.00, total: 11250.00 },
    { no: 2, desc: "توريد وصب خرسانة مسلحة", unit: "م³", qty: 120, price: 850.00, total: 102000.00 },
    { no: 3, desc: "أعمال حديد التسليح T16", unit: "طن", qty: 15, price: 3200.00, total: 48000.00 },
    { no: 4, desc: "أعمال البلوك والبناء", unit: "م²", qty: 800, price: 65.00, total: 52000.00 },
    { no: 5, desc: "أعمال اللياسة الداخلية والخارجية", unit: "م²", qty: 1200, price: 35.00, total: 42000.00 },
  ],
  subtotal: 255250.00,
  discount: 5105.00,
  discountPercent: 2,
  taxable: 250145.00,
  vat: 37521.75,
  vatPercent: 15,
  total: 287666.75,
  paid: 100000.00,
  remaining: 187666.75,
  payments: [
    { date: "2026/02/20", method: "تحويل بنكي", ref: "TRF-8834", amount: 100000.00 }
  ],
  bank: { name: "البنك الأهلي السعودي", iban: "SA03 8000 0000 6080 1016 7519", account: "شركة مسار للمقاولات" },
  terms: "يستحق الدفع خلال 30 يوماً من تاريخ الإصدار. غرامة تأخير 1.5% شهرياً على المبالغ المتأخرة.",
  notes: "شاملة جميع المواد والعمالة. الأسعار لا تشمل أي تعديلات إضافية خارج نطاق العقد."
};

const fmt = (n) => new Intl.NumberFormat("en-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

// ─── TEMPLATE 1: الكلاسيكي الفاخر ───
function Template1() {
  const d = sampleData;
  return (
    <div style={{ width: 595, minHeight: 842, background: "#fff", fontFamily: "'Noto Naskh Arabic', serif", fontSize: 10, color: "#1a1a2e", position: "relative", overflow: "hidden" }}>
      {/* Top accent line */}
      <div style={{ height: 4, background: "linear-gradient(90deg, #1a1a2e, #c9a84c)" }} />
      
      {/* Header */}
      <div style={{ padding: "20px 28px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ textAlign: "right" }}>
          <div style={{ width: 56, height: 56, borderRadius: 8, background: "linear-gradient(135deg, #1a1a2e, #2d2d5e)", display: "flex", alignItems: "center", justifyContent: "center", color: "#c9a84c", fontSize: 18, fontWeight: 800, marginLeft: "auto" }}>م</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#1a1a2e", marginTop: 6 }}>{d.company.name}</div>
          <div style={{ fontSize: 8, color: "#666", letterSpacing: 1 }}>{d.company.nameEn}</div>
          <div style={{ fontSize: 8, color: "#888", marginTop: 3 }}>س.ت: {d.company.cr} | ض: {d.company.taxNumber}</div>
          <div style={{ fontSize: 8, color: "#888" }}>{d.company.address} | {d.company.phone}</div>
        </div>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#1a1a2e", letterSpacing: -0.5 }}>فاتورة</div>
          <div style={{ fontSize: 7, color: "#c9a84c", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>TAX INVOICE</div>
          <div style={{ marginTop: 10, fontSize: 9 }}>
            <div style={{ display: "flex", gap: 16, justifyContent: "flex-start" }}>
              <div><span style={{ color: "#888" }}>الرقم:</span> <strong>{d.invoice.number}</strong></div>
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 3 }}>
              <div><span style={{ color: "#888" }}>التاريخ:</span> {d.invoice.issueDate}</div>
              <div><span style={{ color: "#888" }}>الاستحقاق:</span> {d.invoice.dueDate}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: "#e5e5e5", margin: "0 28px" }} />

      {/* Client Info */}
      <div style={{ margin: "12px 28px", padding: "12px 16px", background: "#f8f7f4", borderRight: "3px solid #c9a84c", borderRadius: "0 6px 6px 0" }}>
        <div style={{ fontSize: 8, color: "#c9a84c", fontWeight: 700, marginBottom: 6 }}>معلومات العميل</div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 700, fontSize: 11 }}>{d.client.name}</div>
            <div style={{ fontSize: 8, color: "#666", marginTop: 2 }}>{d.client.address}</div>
          </div>
          <div style={{ textAlign: "left", fontSize: 8, color: "#666" }}>
            <div>الرقم الضريبي: {d.client.taxNumber}</div>
            <div>{d.client.phone} | {d.client.email}</div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div style={{ margin: "8px 28px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}>
          <thead>
            <tr style={{ background: "#1a1a2e", color: "#fff" }}>
              <th style={{ padding: "8px 6px", textAlign: "center", width: 30, borderRadius: "0 4px 0 0" }}>#</th>
              <th style={{ padding: "8px 6px", textAlign: "right" }}>الوصف</th>
              <th style={{ padding: "8px 6px", textAlign: "center", width: 40 }}>الوحدة</th>
              <th style={{ padding: "8px 6px", textAlign: "center", width: 45 }}>الكمية</th>
              <th style={{ padding: "8px 6px", textAlign: "center", width: 65 }}>سعر الوحدة</th>
              <th style={{ padding: "8px 6px", textAlign: "left", width: 75, borderRadius: "4px 0 0 0" }}>المجموع</th>
            </tr>
          </thead>
          <tbody>
            {d.items.map((item, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? "#fafaf8" : "#fff", borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "7px 6px", textAlign: "center", color: "#c9a84c", fontWeight: 700 }}>{item.no}</td>
                <td style={{ padding: "7px 6px", textAlign: "right", fontWeight: 500 }}>{item.desc}</td>
                <td style={{ padding: "7px 6px", textAlign: "center", color: "#888" }}>{item.unit}</td>
                <td style={{ padding: "7px 6px", textAlign: "center" }}>{item.qty}</td>
                <td style={{ padding: "7px 6px", textAlign: "center" }}>{fmt(item.price)}</td>
                <td style={{ padding: "7px 6px", textAlign: "left", fontWeight: 600 }}>{fmt(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div style={{ margin: "8px 28px", display: "flex", justifyContent: "flex-start" }}>
        <div style={{ width: 220 }}>
          {[
            ["المجموع الفرعي", fmt(d.subtotal), false],
            [`الخصم (${d.discountPercent}%)`, `- ${fmt(d.discount)}`, false],
            [`ضريبة القيمة المضافة (${d.vatPercent}%)`, fmt(d.vat), false],
          ].map(([label, val], i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #f0f0f0", fontSize: 9 }}>
              <span style={{ color: "#888" }}>{label}</span>
              <span>{val}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", background: "#1a1a2e", color: "#fff", borderRadius: 4, marginTop: 4, fontSize: 11, fontWeight: 700 }}>
            <span>الإجمالي</span>
            <span style={{ color: "#c9a84c" }}>{fmt(d.total)} ر.س</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 9, marginTop: 4 }}>
            <span style={{ color: "#888" }}>المدفوع</span>
            <span style={{ color: "#16a34a" }}>{fmt(d.paid)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 9 }}>
            <span style={{ color: "#888" }}>المتبقي</span>
            <span style={{ color: "#dc2626", fontWeight: 700 }}>{fmt(d.remaining)} ر.س</span>
          </div>
        </div>
      </div>

      {/* Bank & Terms */}
      <div style={{ margin: "12px 28px", display: "flex", gap: 16, fontSize: 8 }}>
        <div style={{ flex: 1, padding: "10px 12px", background: "#f8f7f4", borderRadius: 6 }}>
          <div style={{ fontWeight: 700, color: "#1a1a2e", marginBottom: 4, fontSize: 9 }}>البيانات البنكية</div>
          <div style={{ color: "#666" }}>{d.bank.name}</div>
          <div style={{ color: "#666", direction: "ltr", textAlign: "right" }}>{d.bank.iban}</div>
          <div style={{ color: "#666" }}>باسم: {d.bank.account}</div>
        </div>
        <div style={{ flex: 1, padding: "10px 12px", background: "#f8f7f4", borderRadius: 6 }}>
          <div style={{ fontWeight: 700, color: "#1a1a2e", marginBottom: 4, fontSize: 9 }}>شروط الدفع</div>
          <div style={{ color: "#666", lineHeight: 1.6 }}>{d.terms}</div>
        </div>
      </div>

      {/* QR + Signature */}
      <div style={{ margin: "8px 28px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 70, height: 70, background: "#f0f0f0", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, color: "#aaa", border: "1px solid #e5e5e5" }}>ZATCA QR</div>
          <div style={{ fontSize: 7, color: "#aaa", marginTop: 3 }}>رمز الفاتورة الضريبية</div>
        </div>
        <div style={{ textAlign: "center", borderTop: "1px solid #1a1a2e", paddingTop: 4, width: 140 }}>
          <div style={{ fontSize: 8, color: "#888" }}>التوقيع والختم</div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
        <div style={{ height: 1, background: "#e5e5e5" }} />
        <div style={{ padding: "6px 28px", display: "flex", justifyContent: "space-between", fontSize: 7, color: "#aaa" }}>
          <span>{d.company.name} — {d.company.address}</span>
          <span>صفحة 1 من 1</span>
        </div>
        <div style={{ height: 3, background: "linear-gradient(90deg, #c9a84c, #1a1a2e)" }} />
      </div>
    </div>
  );
}

// ─── TEMPLATE 2: العصري البسيط ───
function Template2() {
  const d = sampleData;
  return (
    <div style={{ width: 595, minHeight: 842, background: "#fff", fontFamily: "'Noto Sans Arabic', sans-serif", fontSize: 10, color: "#1e293b", position: "relative", overflow: "hidden" }}>
      {/* Sidebar accent */}
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 6, background: "linear-gradient(180deg, #f97316, #ea580c)" }} />

      {/* Header */}
      <div style={{ padding: "24px 28px 16px 36px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ textAlign: "right" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "flex-end" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800 }}>{d.company.name}</div>
              <div style={{ fontSize: 7, color: "#94a3b8", letterSpacing: 1.5 }}>{d.company.nameEn}</div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: "#f97316", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 18, fontWeight: 900 }}>م</div>
          </div>
          <div style={{ fontSize: 8, color: "#94a3b8", marginTop: 6 }}>{d.company.address} | {d.company.phone} | {d.company.email}</div>
          <div style={{ fontSize: 8, color: "#94a3b8" }}>الرقم الضريبي: {d.company.taxNumber}</div>
        </div>
        <div style={{ textAlign: "left" }}>
          <div style={{ display: "inline-block", padding: "3px 10px", background: "#fff7ed", color: "#ea580c", borderRadius: 20, fontSize: 8, fontWeight: 700 }}>{d.invoice.type}</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#0f172a", marginTop: 4, lineHeight: 1 }}>فاتورة</div>
        </div>
      </div>

      {/* Invoice Meta + Client */}
      <div style={{ margin: "0 28px 0 36px", display: "flex", gap: 16 }}>
        <div style={{ flex: 1, padding: "12px 14px", background: "#fafafa", borderRadius: 8 }}>
          <div style={{ fontSize: 7, color: "#f97316", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>بيانات الفاتورة</div>
          {[
            ["رقم الفاتورة", d.invoice.number],
            ["تاريخ الإصدار", d.invoice.issueDate],
            ["تاريخ الاستحقاق", d.invoice.dueDate],
          ].map(([l, v], i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 9 }}>
              <span style={{ color: "#94a3b8" }}>{l}</span>
              <span style={{ fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ flex: 1.3, padding: "12px 14px", background: "#fff7ed", borderRadius: 8, borderRight: "3px solid #f97316" }}>
          <div style={{ fontSize: 7, color: "#f97316", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>فاتورة إلى</div>
          <div style={{ fontWeight: 700, fontSize: 11 }}>{d.client.name}</div>
          <div style={{ fontSize: 8, color: "#64748b", marginTop: 3 }}>{d.client.address}</div>
          <div style={{ fontSize: 8, color: "#64748b" }}>ض: {d.client.taxNumber}</div>
          <div style={{ fontSize: 8, color: "#64748b" }}>{d.client.phone}</div>
        </div>
      </div>

      {/* Items */}
      <div style={{ margin: "14px 28px 8px 36px" }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 3px", fontSize: 9 }}>
          <thead>
            <tr>
              <th style={{ padding: "8px 8px", textAlign: "center", width: 28, color: "#94a3b8", fontWeight: 600, fontSize: 8, borderBottom: "2px solid #f97316" }}>#</th>
              <th style={{ padding: "8px 8px", textAlign: "right", color: "#94a3b8", fontWeight: 600, fontSize: 8, borderBottom: "2px solid #f97316" }}>البند</th>
              <th style={{ padding: "8px 8px", textAlign: "center", width: 38, color: "#94a3b8", fontWeight: 600, fontSize: 8, borderBottom: "2px solid #f97316" }}>الوحدة</th>
              <th style={{ padding: "8px 8px", textAlign: "center", width: 44, color: "#94a3b8", fontWeight: 600, fontSize: 8, borderBottom: "2px solid #f97316" }}>الكمية</th>
              <th style={{ padding: "8px 8px", textAlign: "center", width: 60, color: "#94a3b8", fontWeight: 600, fontSize: 8, borderBottom: "2px solid #f97316" }}>السعر</th>
              <th style={{ padding: "8px 8px", textAlign: "left", width: 72, color: "#94a3b8", fontWeight: 600, fontSize: 8, borderBottom: "2px solid #f97316" }}>المجموع</th>
            </tr>
          </thead>
          <tbody>
            {d.items.map((item, i) => (
              <tr key={i}>
                <td style={{ padding: "7px 8px", textAlign: "center", background: i % 2 ? "#fff" : "#fafafa", borderRadius: "0 4px 4px 0" }}>
                  <span style={{ display: "inline-block", width: 18, height: 18, borderRadius: "50%", background: "#fff7ed", color: "#f97316", fontSize: 8, lineHeight: "18px", fontWeight: 700 }}>{item.no}</span>
                </td>
                <td style={{ padding: "7px 8px", textAlign: "right", fontWeight: 500, background: i % 2 ? "#fff" : "#fafafa" }}>{item.desc}</td>
                <td style={{ padding: "7px 8px", textAlign: "center", color: "#94a3b8", background: i % 2 ? "#fff" : "#fafafa" }}>{item.unit}</td>
                <td style={{ padding: "7px 8px", textAlign: "center", background: i % 2 ? "#fff" : "#fafafa" }}>{item.qty}</td>
                <td style={{ padding: "7px 8px", textAlign: "center", background: i % 2 ? "#fff" : "#fafafa" }}>{fmt(item.price)}</td>
                <td style={{ padding: "7px 8px", textAlign: "left", fontWeight: 600, background: i % 2 ? "#fff" : "#fafafa", borderRadius: "4px 0 0 4px" }}>{fmt(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div style={{ margin: "4px 28px 4px 36px", display: "flex", justifyContent: "flex-start" }}>
        <div style={{ width: 230, background: "#fafafa", borderRadius: 8, padding: "10px 14px" }}>
          {[
            ["المجموع الفرعي", fmt(d.subtotal)],
            [`الخصم ${d.discountPercent}%`, `- ${fmt(d.discount)}`],
            [`ضريبة ${d.vatPercent}%`, fmt(d.vat)],
          ].map(([l, v], i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 9, borderBottom: "1px solid #f0f0f0" }}>
              <span style={{ color: "#94a3b8" }}>{l}</span><span>{v}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0 4px", fontSize: 13, fontWeight: 800, borderTop: "2px solid #f97316", marginTop: 4 }}>
            <span>الإجمالي</span><span style={{ color: "#f97316" }}>{fmt(d.total)} <span style={{ fontSize: 8 }}>ر.س</span></span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, padding: "2px 0", color: "#16a34a" }}><span>المدفوع</span><span>{fmt(d.paid)}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, padding: "2px 0", color: "#dc2626", fontWeight: 700 }}><span>المتبقي</span><span>{fmt(d.remaining)} ر.س</span></div>
        </div>
      </div>

      {/* Bank + Terms + QR */}
      <div style={{ margin: "10px 28px 0 36px", display: "flex", gap: 12, fontSize: 8 }}>
        <div style={{ flex: 1, padding: "10px", borderRadius: 6, border: "1px solid #f0f0f0" }}>
          <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>البيانات البنكية</div>
          <div style={{ color: "#64748b" }}>{d.bank.name}</div>
          <div style={{ color: "#64748b", direction: "ltr", textAlign: "right" }}>{d.bank.iban}</div>
        </div>
        <div style={{ flex: 1, padding: "10px", borderRadius: 6, border: "1px solid #f0f0f0" }}>
          <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>شروط الدفع</div>
          <div style={{ color: "#64748b", lineHeight: 1.5 }}>{d.terms}</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 64, height: 64, background: "#fafafa", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, color: "#ccc", border: "1px dashed #e0e0e0" }}>QR</div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 0, left: 6, right: 0 }}>
        <div style={{ padding: "8px 28px", textAlign: "center", fontSize: 7, color: "#cbd5e1" }}>
          شكراً لتعاملكم معنا — {d.company.name} — {d.company.phone} — {d.company.email}
        </div>
        <div style={{ height: 3, background: "#f97316" }} />
      </div>
    </div>
  );
}

// ─── TEMPLATE 3: الاحترافي الجريء ───
function Template3() {
  const d = sampleData;
  return (
    <div style={{ width: 595, minHeight: 842, background: "#fff", fontFamily: "'Noto Sans Arabic', sans-serif", fontSize: 10, color: "#1e293b", position: "relative", overflow: "hidden" }}>
      {/* Dark Header Block */}
      <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", padding: "22px 28px 18px", color: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "flex-end" }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>{d.company.name}</div>
                <div style={{ fontSize: 7, color: "#94a3b8", letterSpacing: 2 }}>{d.company.nameEn}</div>
              </div>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg, #10b981, #059669)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 900 }}>م</div>
            </div>
            <div style={{ fontSize: 8, color: "#64748b", marginTop: 8 }}>
              {d.company.address} | {d.company.phone} | ض: {d.company.taxNumber}
            </div>
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1 }}>فاتورة</div>
            <div style={{ fontSize: 7, color: "#10b981", fontWeight: 700, letterSpacing: 2, marginTop: 2 }}>TAX INVOICE</div>
            <div style={{ marginTop: 10, display: "inline-block", padding: "4px 12px", background: "rgba(16,185,129,0.15)", borderRadius: 20, fontSize: 8, fontWeight: 700, color: "#10b981" }}>{d.invoice.number}</div>
          </div>
        </div>
      </div>

      {/* Green accent bar with dates */}
      <div style={{ background: "#10b981", padding: "8px 28px", display: "flex", justifyContent: "space-around", color: "#fff", fontSize: 9 }}>
        <div><span style={{ opacity: 0.7 }}>نوع الفاتورة:</span> <strong>{d.invoice.type}</strong></div>
        <div style={{ width: 1, background: "rgba(255,255,255,0.3)" }} />
        <div><span style={{ opacity: 0.7 }}>تاريخ الإصدار:</span> <strong>{d.invoice.issueDate}</strong></div>
        <div style={{ width: 1, background: "rgba(255,255,255,0.3)" }} />
        <div><span style={{ opacity: 0.7 }}>تاريخ الاستحقاق:</span> <strong>{d.invoice.dueDate}</strong></div>
      </div>

      {/* Client */}
      <div style={{ margin: "14px 28px", padding: "12px 16px", background: "#f0fdf4", borderRadius: 8, border: "1px solid #bbf7d0" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 7, color: "#10b981", fontWeight: 700, marginBottom: 4 }}>● فاتورة إلى</div>
            <div style={{ fontWeight: 700, fontSize: 12 }}>{d.client.name}</div>
            <div style={{ fontSize: 8, color: "#64748b", marginTop: 2 }}>{d.client.address}</div>
          </div>
          <div style={{ textAlign: "left", fontSize: 8, color: "#64748b" }}>
            <div style={{ marginTop: 14 }}>الرقم الضريبي: <strong style={{ color: "#1e293b" }}>{d.client.taxNumber}</strong></div>
            <div>{d.client.phone}</div>
            <div>{d.client.email}</div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div style={{ margin: "0 28px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 9 }}>
          <thead>
            <tr>
              <th style={{ padding: "8px 6px", textAlign: "center", width: 28, background: "#0f172a", color: "#10b981", fontWeight: 700, borderRadius: "0 6px 0 0" }}>#</th>
              <th style={{ padding: "8px 6px", textAlign: "right", background: "#0f172a", color: "#fff", fontWeight: 600 }}>البند</th>
              <th style={{ padding: "8px 6px", textAlign: "center", width: 36, background: "#0f172a", color: "#fff", fontWeight: 600 }}>الوحدة</th>
              <th style={{ padding: "8px 6px", textAlign: "center", width: 42, background: "#0f172a", color: "#fff", fontWeight: 600 }}>الكمية</th>
              <th style={{ padding: "8px 6px", textAlign: "center", width: 60, background: "#0f172a", color: "#fff", fontWeight: 600 }}>السعر</th>
              <th style={{ padding: "8px 6px", textAlign: "left", width: 72, background: "#0f172a", color: "#fff", fontWeight: 600, borderRadius: "6px 0 0 0" }}>المجموع</th>
            </tr>
          </thead>
          <tbody>
            {d.items.map((item, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "7px 6px", textAlign: "center", fontWeight: 700, color: "#10b981" }}>{item.no}</td>
                <td style={{ padding: "7px 6px", textAlign: "right", fontWeight: 500 }}>{item.desc}</td>
                <td style={{ padding: "7px 6px", textAlign: "center", color: "#94a3b8" }}>{item.unit}</td>
                <td style={{ padding: "7px 6px", textAlign: "center" }}>{item.qty}</td>
                <td style={{ padding: "7px 6px", textAlign: "center" }}>{fmt(item.price)}</td>
                <td style={{ padding: "7px 6px", textAlign: "left", fontWeight: 600 }}>{fmt(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals + QR */}
      <div style={{ margin: "10px 28px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ width: 72, height: 72, background: "#f8fafc", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, color: "#cbd5e1", border: "1px solid #e2e8f0" }}>ZATCA<br/>QR</div>
          <div style={{ fontSize: 8, color: "#94a3b8", maxWidth: 160 }}>
            <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>البيانات البنكية</div>
            <div>{d.bank.name}</div>
            <div style={{ direction: "ltr", textAlign: "right" }}>{d.bank.iban}</div>
          </div>
        </div>
        <div style={{ width: 220, background: "#f8fafc", borderRadius: 10, padding: "10px 14px", border: "1px solid #e2e8f0" }}>
          {[
            ["المجموع الفرعي", fmt(d.subtotal)],
            [`الخصم ${d.discountPercent}%`, `- ${fmt(d.discount)}`],
            [`ضريبة ${d.vatPercent}%`, fmt(d.vat)],
          ].map(([l, v], i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 9, color: "#64748b" }}>
              <span>{l}</span><span style={{ color: "#1e293b" }}>{v}</span>
            </div>
          ))}
          <div style={{ height: 2, background: "linear-gradient(90deg, #10b981, #059669)", borderRadius: 2, margin: "6px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 800 }}>
            <span>الإجمالي</span><span style={{ color: "#10b981" }}>{fmt(d.total)} <span style={{ fontSize: 8, color: "#64748b" }}>ر.س</span></span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, padding: "2px 0", marginTop: 4 }}>
            <span style={{ color: "#94a3b8" }}>المدفوع</span><span style={{ color: "#16a34a" }}>{fmt(d.paid)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, fontWeight: 700 }}>
            <span style={{ color: "#94a3b8" }}>المتبقي</span><span style={{ color: "#ef4444" }}>{fmt(d.remaining)} ر.س</span>
          </div>
        </div>
      </div>

      {/* Terms + Signature */}
      <div style={{ margin: "8px 28px", display: "flex", gap: 16, fontSize: 8 }}>
        <div style={{ flex: 1.2, padding: "10px 12px", background: "#f8fafc", borderRadius: 6 }}>
          <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: 3 }}>شروط الدفع</div>
          <div style={{ color: "#64748b", lineHeight: 1.5 }}>{d.terms}</div>
          {d.notes && <>
            <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: 3, marginTop: 6 }}>ملاحظات</div>
            <div style={{ color: "#64748b", lineHeight: 1.5 }}>{d.notes}</div>
          </>}
        </div>
        <div style={{ flex: 0.6, textAlign: "center", paddingTop: 20 }}>
          <div style={{ borderTop: "2px solid #0f172a", paddingTop: 6, marginTop: 30 }}>
            <div style={{ fontSize: 8, color: "#94a3b8" }}>التوقيع والختم</div>
            <div style={{ fontSize: 7, color: "#cbd5e1" }}>Authorized Signature</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "#0f172a", padding: "8px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 7, color: "#64748b" }}>{d.company.name} | {d.company.phone} | {d.company.email}</span>
        <span style={{ fontSize: 7, color: "#10b981" }}>صفحة 1 من 1</span>
      </div>
    </div>
  );
}

// ─── MAIN APP ───
export default function InvoiceTemplatesShowcase() {
  const [active, setActive] = useState(0);
  const templates = [
    { id: 0, name: "الكلاسيكي الفاخر", nameEn: "Classic Luxury", color: "#1a1a2e", accent: "#c9a84c", desc: "تصميم أنيق بأسلوب كلاسيكي مع لمسات ذهبية" },
    { id: 1, name: "العصري البسيط", nameEn: "Modern Minimal", color: "#f97316", accent: "#fff7ed", desc: "تصميم عصري بسيط مع شريط جانبي برتقالي" },
    { id: 2, name: "الاحترافي الجريء", nameEn: "Bold Professional", color: "#10b981", accent: "#0f172a", desc: "تصميم جريء مع هيدر داكن ولمسات خضراء" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", color: "#e2e8f0", fontFamily: "'Noto Sans Arabic', system-ui, sans-serif" }}>
      {/* Hero */}
      <div style={{ padding: "40px 24px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 10, color: "#10b981", fontWeight: 600, letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>MASAR INVOICE TEMPLATES</div>
        <h1 style={{ fontSize: 32, fontWeight: 900, margin: 0, background: "linear-gradient(135deg, #e2e8f0, #94a3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          قوالب الفواتير الاحترافية
        </h1>
        <p style={{ color: "#64748b", fontSize: 14, marginTop: 8 }}>3 نماذج فواتير احترافية بحجم A4 — متوافقة مع ZATCA</p>
      </div>

      {/* Template Selector */}
      <div style={{ display: "flex", justifyContent: "center", gap: 12, padding: "0 24px 24px", flexWrap: "wrap" }}>
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            style={{
              padding: "12px 20px",
              borderRadius: 12,
              border: active === t.id ? `2px solid ${t.color}` : "2px solid #1e293b",
              background: active === t.id ? `${t.color}15` : "#111118",
              color: active === t.id ? t.color : "#94a3b8",
              cursor: "pointer",
              transition: "all 0.3s",
              minWidth: 180,
              textAlign: "center",
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 14 }}>{t.name}</div>
            <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>{t.nameEn}</div>
            <div style={{ fontSize: 9, opacity: 0.5, marginTop: 4 }}>{t.desc}</div>
          </button>
        ))}
      </div>

      {/* Template Preview */}
      <div style={{ display: "flex", justifyContent: "center", padding: "0 24px 40px" }}>
        <div style={{ 
          borderRadius: 16, 
          overflow: "hidden", 
          boxShadow: "0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
          transform: "scale(0.85)",
          transformOrigin: "top center",
        }}>
          {active === 0 && <Template1 />}
          {active === 1 && <Template2 />}
          {active === 2 && <Template3 />}
        </div>
      </div>

      {/* Features */}
      <div style={{ padding: "0 24px 40px", maxWidth: 700, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {["A4 210×297mm", "ZATCA QR", "RTL عربي", "بيانات بنكية", "خصم + ضريبة", "توقيع وختم"].map((f, i) => (
            <div key={i} style={{ padding: "10px", background: "#111118", borderRadius: 8, textAlign: "center", fontSize: 11, color: "#94a3b8", border: "1px solid #1e293b" }}>
              ✓ {f}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
