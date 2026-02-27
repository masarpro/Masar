import { useState, useEffect } from "react";

const CLIENTS = [
  { id: 1, name: "شركة الفيصل للمقاولات", phone: "0551234567", email: "info@alfaisal.sa" },
  { id: 2, name: "مؤسسة البناء الحديث", phone: "0559876543", email: "contact@modern-build.sa" },
  { id: 3, name: "شركة الرياض للتطوير العقاري", phone: "0543216789", email: "dev@riyadh-re.sa" },
];

const PROJECTS = [
  { id: 1, name: "فيلا الياسمين - حي النرجس" },
  { id: 2, name: "عمارة سكنية - حي الملقا" },
  { id: 3, name: "مستودع صناعي - المنطقة الصناعية" },
];

const UNITS = ["م²", "م³", "م.ط", "طن", "كجم", "عدد", "شهر", "يوم", "مقطوعية"];

export default function InvoiceCreate() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("notes");
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [clientSearch, setClientSearch] = useState("");
  const [projectLinked, setProjectLinked] = useState(false);
  const [taxRate, setTaxRate] = useState(15);
  const [items, setItems] = useState([
    { id: 1, description: "", unit: "م²", qty: 1, price: 0 },
  ]);
  const [notes, setNotes] = useState("");
  const [issueDate] = useState("2026-02-27");
  const [dueDate, setDueDate] = useState("2026-03-29");

  useEffect(() => {
    setMounted(true);
  }, []);

  const addItem = () => {
    setItems([...items, { id: items.length + 1, description: "", unit: "م²", qty: 1, price: 0 }]);
  };

  const removeItem = (id) => {
    if (items.length > 1) setItems(items.filter((i) => i.id !== id));
  };

  const updateItem = (id, field, value) => {
    setItems(items.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const subtotal = items.reduce((sum, i) => sum + i.qty * i.price, 0);
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  const formatNum = (n) =>
    n.toLocaleString("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const filteredClients = CLIENTS.filter((c) => c.name.includes(clientSearch));

  const stagger = (i) => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? "translateY(0)" : "translateY(24px)",
    transition: `all 0.6s cubic-bezier(0.16,1,0.3,1) ${i * 0.08}s`,
  });

  return (
    <div dir="rtl" style={{
      minHeight: "100vh",
      background: "linear-gradient(165deg, #f8f9fc 0%, #eef1f8 40%, #e8ecf4 100%)",
      fontFamily: "'IBM Plex Sans Arabic', 'Noto Sans Arabic', sans-serif",
      padding: "0",
      position: "relative",
      overflow: "hidden",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      {/* Decorative Background Elements */}
      <div style={{
        position: "fixed", top: "-200px", left: "-200px", width: "600px", height: "600px",
        borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "fixed", bottom: "-300px", right: "-100px", width: "800px", height: "800px",
        borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Top Navigation Bar */}
      <div style={{
        ...stagger(0),
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        padding: "16px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "13px", color: "#94a3b8", fontWeight: 400 }}>المالية</span>
          <span style={{ color: "#cbd5e1" }}>←</span>
          <span style={{ fontSize: "13px", color: "#94a3b8" }}>الفواتير</span>
          <span style={{ color: "#cbd5e1" }}>←</span>
          <span style={{ fontSize: "15px", color: "#1e293b", fontWeight: 600 }}>إنشاء فاتورة</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button style={{
            padding: "10px 20px", borderRadius: "10px",
            border: "1px solid #e2e8f0", background: "white",
            color: "#64748b", fontSize: "13px", fontWeight: 500,
            cursor: "pointer", display: "flex", alignItems: "center", gap: "6px",
            transition: "all 0.2s",
            fontFamily: "inherit",
          }}
          onMouseEnter={(e) => { e.target.style.borderColor = "#6366f1"; e.target.style.color = "#6366f1"; }}
          onMouseLeave={(e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.color = "#64748b"; }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
            معاينة
          </button>
          <button style={{
            padding: "10px 20px", borderRadius: "10px",
            border: "1px solid #e2e8f0", background: "white",
            color: "#64748b", fontSize: "13px", fontWeight: 500,
            cursor: "pointer", display: "flex", alignItems: "center", gap: "6px",
            transition: "all 0.2s",
            fontFamily: "inherit",
          }}
          onMouseEnter={(e) => { e.target.style.borderColor = "#6366f1"; e.target.style.color = "#6366f1"; }}
          onMouseLeave={(e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.color = "#64748b"; }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg>
            حفظ كمسودة
          </button>
          <button style={{
            padding: "10px 24px", borderRadius: "10px",
            border: "none",
            background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
            color: "white", fontSize: "13px", fontWeight: 600,
            cursor: "pointer", display: "flex", alignItems: "center", gap: "8px",
            boxShadow: "0 4px 15px rgba(99,102,241,0.35), 0 1px 3px rgba(99,102,241,0.2)",
            transition: "all 0.25s",
            fontFamily: "inherit",
          }}
          onMouseEnter={(e) => { e.target.style.transform = "translateY(-1px)"; e.target.style.boxShadow = "0 6px 20px rgba(99,102,241,0.45), 0 2px 5px rgba(99,102,241,0.3)"; }}
          onMouseLeave={(e) => { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "0 4px 15px rgba(99,102,241,0.35), 0 1px 3px rgba(99,102,241,0.2)"; }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
            إصدار الفاتورة
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "28px 32px 60px" }}>

        {/* Page Header */}
        <div style={{ ...stagger(1), marginBottom: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "4px" }}>
            <div style={{
              width: "42px", height: "42px", borderRadius: "12px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
            }}>
              <svg width="20" height="20" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <div>
              <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: "-0.3px" }}>
                إنشاء فاتورة جديدة
              </h1>
              <p style={{ fontSize: "13px", color: "#94a3b8", margin: "2px 0 0", fontWeight: 400 }}>
                أنشئ فاتورة احترافية وأرسلها للعميل مباشرة
              </p>
            </div>
          </div>
        </div>

        {/* Two Column Layout - Client & Invoice Info */}
        <div style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: "20px", marginBottom: "20px" }}>

          {/* Client Information Card */}
          <div style={{
            ...stagger(2),
            background: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(10px)",
            borderRadius: "16px",
            border: "1px solid rgba(255,255,255,0.8)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 30px rgba(0,0,0,0.04)",
            overflow: "hidden",
          }}>
            <div style={{
              padding: "16px 20px",
              borderBottom: "1px solid #f1f5f9",
              display: "flex", alignItems: "center", gap: "10px",
            }}>
              <div style={{
                width: "30px", height: "30px", borderRadius: "8px",
                background: "linear-gradient(135deg, #dbeafe, #eff6ff)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="15" height="15" fill="none" stroke="#3b82f6" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>معلومات العميل</span>
              <button style={{
                marginRight: "auto", padding: "5px 12px", borderRadius: "8px",
                border: "1px dashed #c7d2fe", background: "#f5f3ff",
                color: "#6366f1", fontSize: "12px", fontWeight: 500, cursor: "pointer",
                fontFamily: "inherit",
              }}>+ عميل جديد</button>
            </div>
            <div style={{ padding: "18px 20px" }}>
              <div style={{ position: "relative", marginBottom: "14px" }}>
                <div
                  onClick={() => setShowClientDropdown(!showClientDropdown)}
                  style={{
                    padding: "12px 16px",
                    borderRadius: "11px",
                    border: showClientDropdown ? "2px solid #6366f1" : "1.5px solid #e2e8f0",
                    background: selectedClient ? "#fafbff" : "#fafbfc",
                    cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    transition: "all 0.2s",
                    boxShadow: showClientDropdown ? "0 0 0 4px rgba(99,102,241,0.08)" : "none",
                  }}
                >
                  <span style={{
                    fontSize: "13.5px",
                    color: selectedClient ? "#1e293b" : "#94a3b8",
                    fontWeight: selectedClient ? 500 : 400,
                    fontFamily: "inherit",
                  }}>
                    {selectedClient ? selectedClient.name : "اختر العميل من القائمة..."}
                  </span>
                  <svg width="18" height="18" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24"
                    style={{ transform: showClientDropdown ? "rotate(180deg)" : "", transition: "transform 0.2s" }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
                {showClientDropdown && (
                  <div style={{
                    position: "absolute", top: "100%", right: 0, left: 0,
                    marginTop: "6px", background: "white", borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 12px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
                    zIndex: 20, overflow: "hidden",
                  }}>
                    <div style={{ padding: "10px" }}>
                      <input
                        placeholder="ابحث عن عميل..."
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        style={{
                          width: "100%", padding: "10px 14px", borderRadius: "9px",
                          border: "1.5px solid #e2e8f0", fontSize: "13px",
                          outline: "none", fontFamily: "inherit", boxSizing: "border-box",
                          background: "#f8fafc",
                        }}
                      />
                    </div>
                    {filteredClients.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => { setSelectedClient(c); setShowClientDropdown(false); }}
                        style={{
                          padding: "12px 16px", cursor: "pointer",
                          borderTop: "1px solid #f1f5f9",
                          transition: "background 0.15s",
                          background: selectedClient?.id === c.id ? "#f5f3ff" : "white",
                        }}
                        onMouseEnter={(e) => e.target.style.background = "#f8fafc"}
                        onMouseLeave={(e) => e.target.style.background = selectedClient?.id === c.id ? "#f5f3ff" : "white"}
                      >
                        <div style={{ fontSize: "13.5px", fontWeight: 500, color: "#1e293b" }}>{c.name}</div>
                        <div style={{ fontSize: "11.5px", color: "#94a3b8", marginTop: "2px" }}>{c.phone} • {c.email}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedClient && (
                <div style={{
                  padding: "14px 16px", borderRadius: "11px",
                  background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)",
                  border: "1px solid #e0e7ff",
                  display: "flex", gap: "24px",
                  animation: "fadeIn 0.3s ease",
                }}>
                  <div>
                    <div style={{ fontSize: "11px", color: "#8b5cf6", fontWeight: 600, marginBottom: "3px", letterSpacing: "0.3px" }}>الهاتف</div>
                    <div style={{ fontSize: "13px", color: "#3730a3", fontWeight: 500, direction: "ltr", textAlign: "right" }}>{selectedClient.phone}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "#8b5cf6", fontWeight: 600, marginBottom: "3px", letterSpacing: "0.3px" }}>البريد</div>
                    <div style={{ fontSize: "13px", color: "#3730a3", fontWeight: 500 }}>{selectedClient.email}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Invoice Details Card */}
          <div style={{
            ...stagger(3),
            background: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(10px)",
            borderRadius: "16px",
            border: "1px solid rgba(255,255,255,0.8)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 30px rgba(0,0,0,0.04)",
            overflow: "hidden",
          }}>
            <div style={{
              padding: "16px 20px",
              borderBottom: "1px solid #f1f5f9",
              display: "flex", alignItems: "center", gap: "10px",
            }}>
              <div style={{
                width: "30px", height: "30px", borderRadius: "8px",
                background: "linear-gradient(135deg, #dcfce7, #f0fdf4)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="15" height="15" fill="none" stroke="#22c55e" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>بيانات الفاتورة</span>
            </div>
            <div style={{ padding: "18px 20px" }}>
              <div style={{
                padding: "11px 16px", borderRadius: "11px",
                background: "#f8fafc", border: "1.5px solid #e2e8f0",
                marginBottom: "14px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 500 }}>رقم الفاتورة</span>
                <span style={{ fontSize: "14px", color: "#1e293b", fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.5px" }}>INV-2026-0047</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ fontSize: "12px", color: "#64748b", fontWeight: 500, display: "block", marginBottom: "6px" }}>تاريخ الإصدار</label>
                  <input type="date" value={issueDate} readOnly style={{
                    width: "100%", padding: "10px 12px", borderRadius: "10px",
                    border: "1.5px solid #e2e8f0", fontSize: "13px",
                    fontFamily: "inherit", outline: "none", background: "#fafbfc",
                    color: "#1e293b", boxSizing: "border-box",
                  }} />
                </div>
                <div>
                  <label style={{ fontSize: "12px", color: "#64748b", fontWeight: 500, display: "block", marginBottom: "6px" }}>تاريخ الاستحقاق</label>
                  <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={{
                    width: "100%", padding: "10px 12px", borderRadius: "10px",
                    border: "1.5px solid #e2e8f0", fontSize: "13px",
                    fontFamily: "inherit", outline: "none", background: "white",
                    color: "#1e293b", boxSizing: "border-box",
                  }} />
                </div>
              </div>

              {/* Project Link */}
              <div style={{
                padding: "12px 16px", borderRadius: "11px",
                background: projectLinked ? "linear-gradient(135deg, #f0fdf4, #dcfce7)" : "#fafbfc",
                border: projectLinked ? "1.5px solid #86efac" : "1.5px dashed #d1d5db",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                cursor: "pointer", transition: "all 0.2s",
              }}
              onClick={() => setProjectLinked(!projectLinked)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <svg width="16" height="16" fill="none" stroke={projectLinked ? "#22c55e" : "#94a3b8"} strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
                    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
                  </svg>
                  <span style={{ fontSize: "13px", color: projectLinked ? "#166534" : "#64748b", fontWeight: 500 }}>
                    {projectLinked ? "فيلا الياسمين - حي النرجس" : "ربط بمشروع (اختياري)"}
                  </span>
                </div>
                <div style={{
                  width: "36px", height: "20px", borderRadius: "10px",
                  background: projectLinked ? "#22c55e" : "#d1d5db",
                  position: "relative", transition: "background 0.2s",
                }}>
                  <div style={{
                    width: "16px", height: "16px", borderRadius: "50%",
                    background: "white", position: "absolute", top: "2px",
                    right: projectLinked ? "2px" : "18px",
                    transition: "right 0.2s",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                  }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items Section */}
        <div style={{
          ...stagger(4),
          background: "rgba(255,255,255,0.9)",
          backdropFilter: "blur(10px)",
          borderRadius: "16px",
          border: "1px solid rgba(255,255,255,0.8)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 30px rgba(0,0,0,0.04)",
          marginBottom: "20px",
          overflow: "hidden",
        }}>
          <div style={{
            padding: "16px 20px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "30px", height: "30px", borderRadius: "8px",
                background: "linear-gradient(135deg, #fef3c7, #fffbeb)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="15" height="15" fill="none" stroke="#f59e0b" strokeWidth="2" viewBox="0 0 24 24">
                  <line x1="8" y1="6" x2="21" y2="6"/>
                  <line x1="8" y1="12" x2="21" y2="12"/>
                  <line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/>
                  <line x1="3" y1="12" x2="3.01" y2="12"/>
                  <line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
              </div>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>بنود الفاتورة</span>
              <span style={{
                padding: "3px 10px", borderRadius: "20px",
                background: "#6366f1", color: "white",
                fontSize: "11px", fontWeight: 700,
              }}>{items.length}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>ضريبة القيمة المضافة</span>
                <div style={{
                  padding: "4px 10px", borderRadius: "8px",
                  background: "#f0fdf4", border: "1px solid #86efac",
                  fontSize: "13px", fontWeight: 700, color: "#166534",
                }}>
                  {taxRate}%
                </div>
              </div>
            </div>
          </div>

          {/* Table Header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "40px 1fr 110px 90px 100px 110px 50px",
            padding: "12px 20px",
            background: "#f8fafc",
            borderBottom: "1px solid #f1f5f9",
            gap: "12px",
          }}>
            {["#", "الوصف", "الوحدة", "الكمية", "سعر الوحدة", "الإجمالي", ""].map((h, i) => (
              <span key={i} style={{
                fontSize: "11.5px", fontWeight: 600, color: "#94a3b8",
                textAlign: i >= 3 ? "center" : "right",
                letterSpacing: "0.3px",
              }}>{h}</span>
            ))}
          </div>

          {/* Table Rows */}
          {items.map((item, idx) => (
            <div
              key={item.id}
              style={{
                display: "grid",
                gridTemplateColumns: "40px 1fr 110px 90px 100px 110px 50px",
                padding: "14px 20px",
                borderBottom: "1px solid #f8fafc",
                gap: "12px",
                alignItems: "center",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#fafbff"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <span style={{
                width: "28px", height: "28px", borderRadius: "8px",
                background: "linear-gradient(135deg, #eef2ff, #e0e7ff)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "12px", fontWeight: 700, color: "#6366f1",
              }}>{idx + 1}</span>

              <input
                placeholder="وصف البند (مثال: أعمال البلاط - سيراميك 60×60)"
                value={item.description}
                onChange={(e) => updateItem(item.id, "description", e.target.value)}
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: "10px",
                  border: "1.5px solid #e2e8f0", fontSize: "13px",
                  fontFamily: "inherit", outline: "none", background: "white",
                  color: "#1e293b", boxSizing: "border-box",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
                onFocus={(e) => { e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.08)"; }}
                onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
              />

              <select
                value={item.unit}
                onChange={(e) => updateItem(item.id, "unit", e.target.value)}
                style={{
                  padding: "10px 8px", borderRadius: "10px",
                  border: "1.5px solid #e2e8f0", fontSize: "13px",
                  fontFamily: "inherit", outline: "none", background: "white",
                  color: "#1e293b", cursor: "pointer", appearance: "none",
                  textAlign: "center",
                }}
              >
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>

              <input
                type="number"
                min="0"
                value={item.qty}
                onChange={(e) => updateItem(item.id, "qty", parseFloat(e.target.value) || 0)}
                style={{
                  width: "100%", padding: "10px 8px", borderRadius: "10px",
                  border: "1.5px solid #e2e8f0", fontSize: "13px",
                  fontFamily: "'IBM Plex Mono', monospace",
                  outline: "none", background: "white",
                  color: "#1e293b", textAlign: "center", boxSizing: "border-box",
                }}
                onFocus={(e) => { e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.08)"; }}
                onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
              />

              <input
                type="number"
                min="0"
                step="0.01"
                value={item.price || ""}
                placeholder="0.00"
                onChange={(e) => updateItem(item.id, "price", parseFloat(e.target.value) || 0)}
                style={{
                  width: "100%", padding: "10px 8px", borderRadius: "10px",
                  border: "1.5px solid #e2e8f0", fontSize: "13px",
                  fontFamily: "'IBM Plex Mono', monospace",
                  outline: "none", background: "white",
                  color: "#1e293b", textAlign: "center", boxSizing: "border-box",
                }}
                onFocus={(e) => { e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.08)"; }}
                onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
              />

              <div style={{
                padding: "10px 8px", borderRadius: "10px",
                background: (item.qty * item.price) > 0 ? "#f0fdf4" : "#f8fafc",
                border: (item.qty * item.price) > 0 ? "1px solid #bbf7d0" : "1px solid #e2e8f0",
                textAlign: "center",
                fontSize: "13px",
                fontWeight: 700,
                fontFamily: "'IBM Plex Mono', monospace",
                color: (item.qty * item.price) > 0 ? "#166534" : "#94a3b8",
                transition: "all 0.2s",
              }}>
                {formatNum(item.qty * item.price)}
              </div>

              <button
                onClick={() => removeItem(item.id)}
                style={{
                  width: "32px", height: "32px", borderRadius: "8px",
                  border: "none", background: items.length > 1 ? "#fef2f2" : "#f8fafc",
                  color: items.length > 1 ? "#ef4444" : "#d1d5db",
                  cursor: items.length > 1 ? "pointer" : "default",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { if (items.length > 1) { e.target.style.background = "#fee2e2"; } }}
                onMouseLeave={(e) => { if (items.length > 1) { e.target.style.background = "#fef2f2"; } }}
              >
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
                </svg>
              </button>
            </div>
          ))}

          {/* Add Item Button */}
          <div style={{ padding: "16px 20px" }}>
            <button
              onClick={addItem}
              style={{
                width: "100%", padding: "14px", borderRadius: "12px",
                border: "2px dashed #c7d2fe",
                background: "linear-gradient(135deg, #fafafe 0%, #f5f3ff 100%)",
                color: "#6366f1", fontSize: "14px", fontWeight: 600,
                cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", gap: "8px",
                transition: "all 0.2s",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => { e.target.style.borderColor = "#6366f1"; e.target.style.background = "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)"; }}
              onMouseLeave={(e) => { e.target.style.borderColor = "#c7d2fe"; e.target.style.background = "linear-gradient(135deg, #fafafe 0%, #f5f3ff 100%)"; }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              إضافة بند جديد
            </button>
          </div>
        </div>

        {/* Bottom Section: Notes + Totals */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "20px" }}>

          {/* Notes & Attachments */}
          <div style={{
            ...stagger(5),
            background: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(10px)",
            borderRadius: "16px",
            border: "1px solid rgba(255,255,255,0.8)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 30px rgba(0,0,0,0.04)",
            overflow: "hidden",
          }}>
            {/* Tabs */}
            <div style={{
              display: "flex", borderBottom: "1px solid #f1f5f9",
              padding: "0 20px",
            }}>
              {[
                { key: "notes", label: "ملاحظات", icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" },
                { key: "terms", label: "شروط الدفع", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
                { key: "attachments", label: "المرفقات", icon: "M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    padding: "14px 16px",
                    border: "none", background: "none",
                    borderBottom: activeTab === tab.key ? "2px solid #6366f1" : "2px solid transparent",
                    color: activeTab === tab.key ? "#6366f1" : "#94a3b8",
                    fontSize: "13px", fontWeight: activeTab === tab.key ? 600 : 500,
                    cursor: "pointer",
                    display: "flex", alignItems: "center", gap: "6px",
                    transition: "all 0.2s",
                    fontFamily: "inherit",
                  }}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d={tab.icon}/>
                  </svg>
                  {tab.label}
                </button>
              ))}
            </div>
            <div style={{ padding: "18px 20px" }}>
              {activeTab === "notes" && (
                <textarea
                  placeholder="أضف ملاحظات للعميل (مثال: يتم الدفع خلال 30 يوم من تاريخ الفاتورة)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{
                    width: "100%", minHeight: "100px", padding: "14px 16px",
                    borderRadius: "12px", border: "1.5px solid #e2e8f0",
                    fontSize: "13px", fontFamily: "inherit", outline: "none",
                    resize: "vertical", background: "#fafbfc",
                    lineHeight: "1.7", color: "#1e293b",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => { e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.08)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
                />
              )}
              {activeTab === "terms" && (
                <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8", fontSize: "13px" }}>
                  <svg width="32" height="32" fill="none" stroke="#d1d5db" strokeWidth="1.5" viewBox="0 0 24 24" style={{ margin: "0 auto 8px" }}>
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <div>سيتم إضافة شروط الدفع الافتراضية تلقائياً</div>
                </div>
              )}
              {activeTab === "attachments" && (
                <div style={{
                  padding: "28px 20px", textAlign: "center",
                  border: "2px dashed #e2e8f0", borderRadius: "12px",
                  background: "#fafbfc", cursor: "pointer",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.background = "#f5f3ff"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#fafbfc"; }}
                >
                  <svg width="32" height="32" fill="none" stroke="#94a3b8" strokeWidth="1.5" viewBox="0 0 24 24" style={{ margin: "0 auto 8px" }}>
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                  </svg>
                  <div style={{ fontSize: "13px", color: "#64748b", fontWeight: 500 }}>اسحب الملفات هنا أو اضغط للرفع</div>
                  <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px" }}>PDF, صور (حد أقصى 10MB)</div>
                </div>
              )}
            </div>
          </div>

          {/* Totals Card */}
          <div style={{
            ...stagger(6),
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(10px)",
            borderRadius: "16px",
            border: "1px solid rgba(255,255,255,0.8)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 8px 30px rgba(0,0,0,0.04)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}>
            <div style={{
              padding: "16px 20px",
              borderBottom: "1px solid #f1f5f9",
              display: "flex", alignItems: "center", gap: "10px",
            }}>
              <div style={{
                width: "30px", height: "30px", borderRadius: "8px",
                background: "linear-gradient(135deg, #fce7f3, #fdf2f8)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="15" height="15" fill="none" stroke="#ec4899" strokeWidth="2" viewBox="0 0 24 24">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                </svg>
              </div>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "#1e293b" }}>ملخص المبالغ</span>
            </div>

            <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 0",
                }}>
                  <span style={{ fontSize: "13.5px", color: "#64748b", fontWeight: 500 }}>المجموع الفرعي</span>
                  <span style={{ fontSize: "14px", color: "#1e293b", fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace" }}>
                    {formatNum(subtotal)} <span style={{ fontSize: "11px", color: "#94a3b8" }}>ر.س</span>
                  </span>
                </div>

                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 0",
                  borderTop: "1px solid #f1f5f9",
                }}>
                  <span style={{ fontSize: "13.5px", color: "#64748b", fontWeight: 500 }}>
                    ضريبة القيمة المضافة ({taxRate}%)
                  </span>
                  <span style={{ fontSize: "14px", color: "#1e293b", fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace" }}>
                    {formatNum(tax)} <span style={{ fontSize: "11px", color: "#94a3b8" }}>ر.س</span>
                  </span>
                </div>
              </div>

              <div style={{
                marginTop: "12px",
                padding: "18px 20px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #7c3aed 100%)",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                boxShadow: "0 4px 20px rgba(99,102,241,0.3), 0 2px 6px rgba(99,102,241,0.15)",
              }}>
                <div>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", fontWeight: 500, marginBottom: "2px", letterSpacing: "0.5px" }}>الإجمالي المستحق</div>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", fontWeight: 400 }}>شامل الضريبة</div>
                </div>
                <div style={{
                  fontSize: "26px", fontWeight: 800, color: "white",
                  fontFamily: "'IBM Plex Mono', monospace",
                  letterSpacing: "-0.5px",
                  display: "flex", alignItems: "baseline", gap: "6px",
                }}>
                  {formatNum(total)}
                  <span style={{ fontSize: "13px", fontWeight: 500, opacity: 0.75 }}>ر.س</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] { -moz-appearance: textfield; }
        ::placeholder { color: #b8c0cc; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 3px; }
        select { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: 12px center; padding-right: 16px !important; }
      `}</style>
    </div>
  );
}
