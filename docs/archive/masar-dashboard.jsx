import { useState, useEffect } from "react";
import {
  AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import {
  Building2, Plus, ArrowUpLeft, ArrowDownRight, TrendingUp,
  Wallet, FileText, Calculator, Receipt, Users, Clock,
  ChevronLeft, AlertTriangle, CheckCircle, Bell, BarChart3,
  DollarSign, HardHat, Landmark, FilePlus2, ClipboardList, FolderOpen
} from "lucide-react";

const cashFlowData = [
  { day: "السبت", income: 45000, expense: 12000 },
  { day: "الأحد", income: 32000, expense: 8000 },
  { day: "الاثنين", income: 0, expense: 15000 },
  { day: "الثلاثاء", income: 78000, expense: 22000 },
  { day: "الأربعاء", income: 15000, expense: 5000 },
  { day: "الخميس", income: 120000, expense: 35000 },
  { day: "الجمعة", income: 0, expense: 0 },
];

const expenseBreakdown = [
  { name: "مواد", value: 45, color: "#10b981" },
  { name: "عمالة", value: 25, color: "#3b82f6" },
  { name: "معدات", value: 15, color: "#f59e0b" },
  { name: "إدارية", value: 10, color: "#8b5cf6" },
  { name: "أخرى", value: 5, color: "#6b7280" },
];

const monthlyExpenses = [
  { month: "سبت", amount: 42000 },
  { month: "أكت", amount: 55000 },
  { month: "نوف", amount: 38000 },
  { month: "ديس", amount: 61000 },
  { month: "يناير", amount: 47000 },
  { month: "فبراير", amount: 16230 },
];

const projects = [
  {
    id: 1, name: "Masar", client: "هيئة تطوير العلا", location: "جازان",
    progress: 25, status: "نشط", budget: 1500000, spent: 270000,
    daysLeft: 154, team: 1, color: "#10b981",
    nextPayment: { amount: 150000, date: "مرحلية" }
  },
  {
    id: 2, name: "تجربة", client: "شركة غير معروفة", location: "الرياض",
    progress: 0, status: "نشط", budget: 100000, spent: 0,
    daysLeft: 310, team: 0, color: "#3b82f6", nextPayment: null
  },
];

const recentActivities = [
  { type: "report", text: "تقرير يومي جديد — مشروع Masar", time: "منذ ساعة", icon: FileText },
  { type: "payment", text: "دفعة مقدمة ٢٧٠,٠٠٠ ر.س", time: "منذ ٣ ساعات", icon: Wallet },
  { type: "alert", text: "مرحلة أعمال الهيكل معرّضة للتأخر", time: "اليوم", icon: AlertTriangle },
  { type: "milestone", text: "اكتمال أعمال التأسيس ٥٠٪", time: "أمس", icon: CheckCircle },
];

const upcomingPayments = [
  { project: "Masar", amount: 150000, date: "مرحلية", type: "مستخلص" },
  { project: "Masar", amount: 75000, date: "١٥ مارس", type: "باطن" },
];

const formatNum = (n) => {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(0) + "K";
  return n.toLocaleString("ar-SA");
};
const formatCurrency = (n) => n.toLocaleString("ar-SA");

function AnimNum({ value, suffix = "" }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let s = 0;
    const e = value, step = e / (1100 / 16);
    const id = setInterval(() => {
      s += step;
      if (s >= e) { s = e; clearInterval(id); }
      setDisplay(Math.floor(s));
    }, 16);
    return () => clearInterval(id);
  }, [value]);
  return <span>{formatCurrency(display)}{suffix}</span>;
}

function ProgressRing({ pct, size = 44, stroke = 4, color = "#10b981" }) {
  const r = (size - stroke) / 2, circ = 2 * Math.PI * r, offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1.2s ease" }} />
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
        fill="white" fontSize={size * 0.26} fontWeight="700"
        style={{ transform: "rotate(90deg)", transformOrigin: "center" }}>{pct}%</text>
    </svg>
  );
}

function Card({ children, className = "", style = {}, delay = 0 }) {
  return (
    <div className={`gc ${className}`} style={{ ...style, animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}
function CardH({ icon: Icon, title, action, actionIcon: AI }) {
  return (
    <div className="ch">
      <div className="ch-r"><Icon size={14} style={{ opacity: 0.45 }} /><span className="ch-t">{title}</span></div>
      {action && <button className="ch-btn">{AI && <AI size={11} />}<span>{action}</span></button>}
    </div>
  );
}

export default function MasarDashboard() {
  const [now, setNow] = useState(new Date());
  const [hoveredAction, setHoveredAction] = useState(null);
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(t); }, []);

  const bankBalance = 253770, cashBalance = 0, netProfit = 253770, totalExpenses = 16230, totalIncome = 270000;

  const actions = [
    { icon: ArrowUpLeft, label: "إضافة مصروف", sub: "المصروفات", grad: "linear-gradient(135deg, #b91c1c, #ef4444)", glow: "#ef4444", ring: "rgba(239,68,68,0.15)" },
    { icon: ArrowDownRight, label: "إضافة دفعة", sub: "المقبوضات", grad: "linear-gradient(135deg, #047857, #10b981)", glow: "#10b981", ring: "rgba(16,185,129,0.15)" },
    { icon: Receipt, label: "إنشاء فاتورة", sub: "الفواتير", grad: "linear-gradient(135deg, #1d4ed8, #3b82f6)", glow: "#3b82f6", ring: "rgba(59,130,246,0.15)" },
    { icon: FilePlus2, label: "عرض سعر جديد", sub: "التسعير", grad: "linear-gradient(135deg, #6d28d9, #8b5cf6)", glow: "#8b5cf6", ring: "rgba(139,92,246,0.15)" },
    { icon: Calculator, label: "حساب الكميات", sub: "دراسات الكميات", grad: "linear-gradient(135deg, #b45309, #f59e0b)", glow: "#f59e0b", ring: "rgba(245,158,11,0.15)" },
    { icon: ClipboardList, label: "تقرير يومي", sub: "التنفيذ", grad: "linear-gradient(135deg, #0e7490, #06b6d4)", glow: "#06b6d4", ring: "rgba(6,182,212,0.15)" },
    { icon: HardHat, label: "إدارة المنشأة", sub: "الشركة", grad: "linear-gradient(135deg, #4338ca, #6366f1)", glow: "#6366f1", ring: "rgba(99,102,241,0.15)" },
    { icon: FolderOpen, label: "المستندات", sub: "الملفات", grad: "linear-gradient(135deg, #475569, #94a3b8)", glow: "#94a3b8", ring: "rgba(148,163,184,0.12)" },
  ];

  return (
    <div dir="rtl" className="root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@300;400;500;600;700;800;900&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap');
        :root {
          --bg:#070a12; --sf:rgba(255,255,255,0.025); --sfh:rgba(255,255,255,0.05);
          --bd:rgba(255,255,255,0.055); --bdh:rgba(255,255,255,0.11);
          --tx:#eef1f5; --dm:#6b7a8d; --mt:#3d4a5c;
          --em:#10b981; --emd:rgba(16,185,129,0.10);
          --bl:#3b82f6; --bld:rgba(59,130,246,0.10);
          --am:#f59e0b; --amd:rgba(245,158,11,0.10);
          --rd:#ef4444; --rdd:rgba(239,68,68,0.10);
          --pp:#8b5cf6; --ppd:rgba(139,92,246,0.10);
          --rad:14px; --rads:10px;
        }
        *{margin:0;padding:0;box-sizing:border-box;}
        .root{
          font-family:'IBM Plex Sans Arabic','Noto Kufi Arabic',sans-serif;
          background:var(--bg); color:var(--tx);
          height:100vh; overflow:hidden;
          display:flex; flex-direction:column;
          padding:12px 16px; gap:10px;
          position:relative;
        }
        .root::before{content:'';position:fixed;top:-180px;right:-80px;width:450px;height:450px;
          background:radial-gradient(circle,rgba(16,185,129,0.045) 0%,transparent 70%);pointer-events:none;}
        .root::after{content:'';position:fixed;bottom:-120px;left:-60px;width:380px;height:380px;
          background:radial-gradient(circle,rgba(59,130,246,0.03) 0%,transparent 70%);pointer-events:none;}

        .tb{display:flex;align-items:center;justify-content:space-between;flex-shrink:0;z-index:2;position:relative;}
        .tb-r{display:flex;align-items:center;gap:10px;}
        .org-a{width:34px;height:34px;border-radius:9px;background:linear-gradient(135deg,#10b981,#059669);
          display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px;color:#fff;font-family:'Noto Kufi Arabic';}
        .org-d h1{font-size:14px;font-weight:700;font-family:'Noto Kufi Arabic';line-height:1.2;}
        .org-d p{font-size:10px;color:var(--dm);}
        .tb-l{display:flex;align-items:center;gap:6px;}
        .ib{width:32px;height:32px;border-radius:9px;border:1px solid var(--bd);background:var(--sf);
          color:var(--dm);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;position:relative;}
        .ib:hover{border-color:var(--bdh);color:var(--tx);background:var(--sfh);}
        .bdg{position:absolute;top:-2px;left:-2px;width:15px;height:15px;border-radius:50%;background:var(--rd);
          font-size:8px;font-weight:700;display:flex;align-items:center;justify-content:center;border:2px solid var(--bg);}
        .tt{font-size:10.5px;color:var(--mt);font-variant-numeric:tabular-nums;}

        .kpi-r{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;flex-shrink:0;z-index:1;position:relative;}
        .kpi{background:var(--sf);border:1px solid var(--bd);border-radius:var(--rad);padding:11px 13px;
          display:flex;flex-direction:column;gap:5px;animation:fu .5s ease both;transition:all .25s;}
        .kpi:hover{border-color:var(--bdh);background:var(--sfh);transform:translateY(-2px);}
        @keyframes fu{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
        .kpi-t{display:flex;align-items:center;justify-content:space-between;}
        .kpi-l{font-size:10px;color:var(--dm);font-weight:500;}
        .kpi-i{width:28px;height:28px;border-radius:7px;display:flex;align-items:center;justify-content:center;}
        .kpi-v{font-size:17px;font-weight:800;font-family:'Noto Kufi Arabic';letter-spacing:-.3px;line-height:1;}
        .kpi-s{font-size:9px;color:var(--mt);display:flex;align-items:center;gap:3px;}
        .kpi-g{font-size:9px;font-weight:600;padding:1px 5px;border-radius:4px;}

        .pr{display:flex;gap:10px;flex-shrink:0;z-index:1;position:relative;}
        .pc{flex:1;min-width:0;background:var(--sf);border:1px solid var(--bd);border-radius:var(--rad);
          padding:11px 13px;cursor:pointer;transition:all .25s;animation:fu .5s ease both;position:relative;overflow:hidden;}
        .pc::before{content:'';position:absolute;top:0;right:0;left:0;height:3px;background:var(--pcc);border-radius:var(--rad) var(--rad) 0 0;}
        .pc:hover{border-color:var(--bdh);background:var(--sfh);transform:translateY(-2px);}
        .pc-h{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:7px;}
        .pc-n{font-size:13px;font-weight:700;font-family:'Noto Kufi Arabic';}
        .pc-c{font-size:9.5px;color:var(--dm);margin-top:1px;}
        .pc-st{font-size:8.5px;font-weight:600;padding:2px 6px;border-radius:5px;background:var(--emd);color:var(--em);}
        .pc-g{display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px;margin-top:7px;}
        .pc-s{text-align:center;padding:4px 0;background:rgba(255,255,255,0.02);border-radius:5px;}
        .pc-sv{font-size:11.5px;font-weight:700;display:block;}
        .pc-sl{font-size:8.5px;color:var(--mt);}
        .pc-bw{margin-top:6px;}
        .pc-bt{display:flex;justify-content:space-between;font-size:9px;color:var(--dm);margin-bottom:2px;}
        .pc-b{height:3px;border-radius:3px;background:rgba(255,255,255,0.05);overflow:hidden;}
        .pc-bf{height:100%;border-radius:3px;transition:width 1.2s ease;}
        .pc-al{margin-top:6px;padding:4px 7px;border-radius:6px;background:var(--amd);display:flex;align-items:center;gap:4px;font-size:9.5px;color:var(--am);font-weight:500;}
        .np{min-width:90px;max-width:110px;background:var(--sf);border:1.5px dashed rgba(255,255,255,0.07);border-radius:var(--rad);
          display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;cursor:pointer;transition:all .25s;animation:fu .5s ease both;}
        .np:hover{border-color:var(--em);background:var(--emd);}
        .np-p{width:34px;height:34px;border-radius:50%;border:1.5px dashed rgba(255,255,255,0.08);
          display:flex;align-items:center;justify-content:center;color:var(--dm);transition:all .25s;}
        .np:hover .np-p{border-color:var(--em);color:var(--em);}
        .np span{font-size:9.5px;color:var(--dm);font-weight:500;}

        /* ═══ ACTION BUTTONS ═══ */
        .ab-row{
          display:grid; grid-template-columns:repeat(8,1fr); gap:8px;
          flex-shrink:0; z-index:1; position:relative;
        }
        .ab{
          position:relative; overflow:hidden;
          display:flex; flex-direction:column; align-items:center; gap:6px;
          padding:14px 4px 11px;
          border-radius:var(--rad); border:1px solid var(--bd);
          background:var(--sf); cursor:pointer;
          transition:all .28s cubic-bezier(.4,0,.2,1);
          font-family:inherit; color:var(--tx);
          animation:fu .45s ease both;
        }
        /* Glow layer */
        .ab::before{
          content:''; position:absolute; inset:0;
          background:radial-gradient(circle at 50% 30%, var(--ab-ring) 0%, transparent 70%);
          opacity:0; transition:opacity .35s; z-index:0;
        }
        .ab:hover::before{opacity:1;}
        .ab:hover{
          border-color:color-mix(in srgb, var(--ab-glow) 35%, transparent);
          transform:translateY(-4px) scale(1.02);
          box-shadow:0 12px 32px -4px color-mix(in srgb, var(--ab-glow) 20%, transparent),
                     0 0 0 1px color-mix(in srgb, var(--ab-glow) 15%, transparent);
        }
        .ab:active{transform:translateY(-1px) scale(0.98);}

        .ab-ico{
          width:42px; height:42px; border-radius:12px;
          display:flex; align-items:center; justify-content:center;
          color:#fff; position:relative; z-index:1;
          box-shadow:0 6px 16px -2px color-mix(in srgb, var(--ab-glow) 30%, transparent);
          transition:all .28s;
        }
        .ab:hover .ab-ico{
          transform:scale(1.08);
          box-shadow:0 8px 24px -2px color-mix(in srgb, var(--ab-glow) 45%, transparent);
        }
        .ab-label{
          font-size:11px; font-weight:600; text-align:center;
          line-height:1.25; position:relative; z-index:1;
        }
        .ab-sub{
          font-size:9px; color:var(--dm); font-weight:400;
          position:relative; z-index:1; margin-top:-2px;
        }

        /* ── Bottom ── */
        .bot{flex:1;min-height:0;display:grid;grid-template-columns:5fr 3fr 3fr;gap:10px;z-index:1;position:relative;}
        .gc{background:var(--sf);border:1px solid var(--bd);border-radius:var(--rad);padding:11px 13px;
          transition:all .25s;animation:fu .5s ease both;overflow:hidden;}
        .gc:hover{border-color:var(--bdh);background:var(--sfh);}
        .ch{display:flex;align-items:center;justify-content:space-between;margin-bottom:9px;}
        .ch-r{display:flex;align-items:center;gap:5px;}
        .ch-t{font-size:11px;font-weight:600;color:var(--dm);font-family:'Noto Kufi Arabic';}
        .ch-btn{display:flex;align-items:center;gap:3px;font-size:9.5px;color:var(--em);background:var(--emd);
          border:none;border-radius:5px;padding:3px 7px;cursor:pointer;font-family:inherit;transition:all .2s;}
        .ch-btn:hover{background:rgba(16,185,129,0.18);}

        .fc{display:flex;flex-direction:column;gap:7px;}
        .fc-chips{display:flex;gap:6px;}
        .fc-chip{flex:1;padding:6px 7px;border-radius:8px;text-align:center;}
        .fc-cv{font-size:13px;font-weight:800;font-family:'Noto Kufi Arabic';display:block;}
        .fc-cl{font-size:8.5px;color:var(--dm);}
        .fc-chart{flex:1;min-height:0;}

        .ec{display:flex;flex-direction:column;}
        .ec-row{display:flex;align-items:center;gap:7px;flex:1;min-height:0;}
        .pl{flex:1;display:flex;flex-direction:column;gap:2px;}
        .pl-i{display:flex;align-items:center;gap:4px;font-size:9.5px;color:var(--dm);}
        .pl-d{width:5px;height:5px;border-radius:50%;flex-shrink:0;}
        .ec-bars{height:45px;margin-top:5px;}

        .ac{display:flex;flex-direction:column;}
        .al{flex:1;display:flex;flex-direction:column;gap:1px;overflow:hidden;}
        .ai{display:flex;align-items:flex-start;gap:6px;padding:5px 0;border-bottom:1px solid var(--bd);animation:sr .3s ease both;}
        .ai:last-child{border-bottom:none;}
        @keyframes sr{from{opacity:0;transform:translateX(6px);}to{opacity:1;transform:translateX(0);}}
        .ai-ic{width:22px;height:22px;border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .ai-tx{font-size:9.5px;font-weight:500;line-height:1.3;}
        .ai-tm{font-size:8px;color:var(--mt);margin-top:1px;}

        .us{margin-top:7px;padding-top:7px;border-top:1px solid var(--bd);}
        .us-t{font-size:9.5px;font-weight:600;color:var(--dm);margin-bottom:4px;display:flex;align-items:center;gap:3px;}
        .us-i{display:flex;align-items:center;justify-content:space-between;padding:4px 6px;border-radius:6px;background:rgba(255,255,255,0.02);margin-bottom:3px;}
        .us-p{font-size:9.5px;font-weight:600;}
        .us-ty{font-size:8px;color:var(--mt);}
        .us-a{font-size:10.5px;font-weight:700;color:var(--am);}

        .ctt{background:rgba(10,14,23,0.96);border:1px solid var(--bd);border-radius:7px;
          padding:6px 9px;font-family:'IBM Plex Sans Arabic';font-size:10px;}
        .ctt .cl{color:var(--dm);margin-bottom:2px;}
        .ctt .cv{font-weight:700;}

        ::-webkit-scrollbar{width:3px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:var(--bd);border-radius:3px;}
      `}</style>

      {/* TOP */}
      <div className="tb">
        <div className="tb-r">
          <div className="org-a">م</div>
          <div className="org-d">
            <h1>منشأة Emad lk</h1>
            <p>مركز القيادة — {now.toLocaleDateString("ar-SA",{weekday:"long",month:"long",day:"numeric"})}</p>
          </div>
        </div>
        <div className="tb-l">
          <span className="tt">{now.toLocaleTimeString("ar-SA",{hour:"2-digit",minute:"2-digit"})}</span>
          <button className="ib"><Bell size={15}/><span className="bdg">3</span></button>
          <button className="ib"><Users size={15}/></button>
        </div>
      </div>

      {/* KPI */}
      <div className="kpi-r">
        {[
          {label:"رصيد البنك",value:bankBalance,icon:Landmark,c:"var(--em)",bg:"var(--emd)",tag:"+18%",up:true},
          {label:"الصندوق",value:cashBalance,icon:Wallet,c:"var(--bl)",bg:"var(--bld)",tag:"0",up:null},
          {label:"صافي الربح",value:netProfit,icon:TrendingUp,c:"var(--em)",bg:"var(--emd)",tag:"+100%",up:true},
          {label:"المقبوضات",value:totalIncome,icon:ArrowDownRight,c:"var(--em)",bg:"var(--emd)",sub:"هذا الشهر"},
          {label:"المصروفات",value:totalExpenses,icon:ArrowUpLeft,c:"var(--rd)",bg:"var(--rdd)",sub:"هذا الشهر"},
        ].map((k,i)=>(
          <div className="kpi" key={i} style={{animationDelay:`${i*50}ms`}}>
            <div className="kpi-t">
              <span className="kpi-l">{k.label}</span>
              <div className="kpi-i" style={{background:k.bg,color:k.c}}><k.icon size={14}/></div>
            </div>
            <div className="kpi-v" style={{color:k.c}}><AnimNum value={k.value} suffix=" ر.س"/></div>
            <div className="kpi-s">
              {k.tag&&<span className="kpi-g" style={{
                background:k.up?"var(--emd)":k.up===false?"var(--rdd)":"rgba(255,255,255,0.04)",
                color:k.up?"var(--em)":k.up===false?"var(--rd)":"var(--mt)"
              }}>{k.tag}</span>}
              <span>{k.sub||"عن الشهر الماضي"}</span>
            </div>
          </div>
        ))}
      </div>

      {/* PROJECTS */}
      <div className="pr">
        {projects.map((p,i)=>(
          <div className="pc" key={p.id} style={{"--pcc":p.color,animationDelay:`${160+i*70}ms`}}>
            <div className="pc-h">
              <div><div className="pc-n">{p.name}</div><div className="pc-c">{p.client}</div></div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span className="pc-st">{p.status}</span>
                <ProgressRing pct={p.progress} color={p.color} size={40} stroke={3.5}/>
              </div>
            </div>
            <div className="pc-g">
              <div className="pc-s"><span className="pc-sv">{formatNum(p.budget)}</span><span className="pc-sl">قيمة العقد</span></div>
              <div className="pc-s"><span className="pc-sv" style={{color:"var(--rd)"}}>{formatNum(p.spent)}</span><span className="pc-sl">المصروف</span></div>
              <div className="pc-s"><span className="pc-sv">{p.daysLeft}</span><span className="pc-sl">يوم متبقي</span></div>
            </div>
            <div className="pc-bw">
              <div className="pc-bt"><span>الميزانية</span><span>{Math.round(p.spent/p.budget*100)}%</span></div>
              <div className="pc-b"><div className="pc-bf" style={{width:`${p.spent/p.budget*100}%`,background:p.color}}/></div>
            </div>
            {p.nextPayment&&<div className="pc-al"><Clock size={10}/><span>القادمة: {formatCurrency(p.nextPayment.amount)} ر.س</span></div>}
          </div>
        ))}
        <div className="np" style={{animationDelay:"300ms"}}>
          <div className="np-p"><Plus size={15}/></div>
          <span>مشروع جديد</span>
        </div>
      </div>

      {/* ═══ ACTION BUTTONS ═══ */}
      <div className="ab-row">
        {actions.map((a,i)=>(
          <button className="ab" key={i}
            style={{"--ab-glow":a.glow,"--ab-ring":a.ring,animationDelay:`${280+i*35}ms`}}
            onMouseEnter={()=>setHoveredAction(i)}
            onMouseLeave={()=>setHoveredAction(null)}>
            <div className="ab-ico" style={{background:a.grad}}>
              <a.icon size={19}/>
            </div>
            <span className="ab-label">{a.label}</span>
            <span className="ab-sub">{a.sub}</span>
          </button>
        ))}
      </div>

      {/* BOTTOM */}
      <div className="bot">
        <Card className="fc" delay={450}>
          <CardH icon={DollarSign} title="التدفق النقدي — آخر ٧ أيام" action="المالية" actionIcon={ChevronLeft}/>
          <div className="fc-chips">
            <div className="fc-chip" style={{background:"var(--emd)"}}><span className="fc-cv" style={{color:"var(--em)"}}>{formatCurrency(totalIncome)}</span><span className="fc-cl">المقبوضات</span></div>
            <div className="fc-chip" style={{background:"var(--rdd)"}}><span className="fc-cv" style={{color:"var(--rd)"}}>{formatCurrency(totalExpenses)}</span><span className="fc-cl">المصروفات</span></div>
            <div className="fc-chip" style={{background:"var(--bld)"}}><span className="fc-cv" style={{color:"var(--bl)"}}>{formatCurrency(netProfit)}</span><span className="fc-cl">صافي</span></div>
          </div>
          <div className="fc-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashFlowData} margin={{top:4,right:4,left:4,bottom:0}}>
                <defs>
                  <linearGradient id="gi" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.22}/><stop offset="100%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                  <linearGradient id="ge" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ef4444" stopOpacity={0.12}/><stop offset="100%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)"/>
                <XAxis dataKey="day" tick={{fontSize:9,fill:"#3d4a5c"}} axisLine={false} tickLine={false}/>
                <YAxis hide/>
                <Tooltip content={({active,payload,label})=>{
                  if(!active||!payload)return null;
                  return(<div className="ctt"><div className="cl">{label}</div>{payload.map((p,i)=><div key={i} className="cv" style={{color:p.color}}>
                    {p.dataKey==="income"?"مقبوضات":"مصروفات"}: {formatCurrency(p.value)} ر.س</div>)}</div>);
                }}/>
                <Area type="monotone" dataKey="income" stroke="#10b981" fill="url(#gi)" strokeWidth={2} dot={false}/>
                <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="url(#ge)" strokeWidth={1.5} dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="ec" delay={520}>
          <CardH icon={BarChart3} title="مصاريف المنشأة" action="التفاصيل" actionIcon={ChevronLeft}/>
          <div className="ec-row">
            <div style={{width:80,height:80,flexShrink:0}}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={expenseBreakdown} cx="50%" cy="50%" outerRadius={36} innerRadius={18} dataKey="value" stroke="none" paddingAngle={2}>
                  {expenseBreakdown.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie></PieChart>
              </ResponsiveContainer>
            </div>
            <div className="pl">
              {expenseBreakdown.map((e,i)=>(
                <div className="pl-i" key={i}><div className="pl-d" style={{background:e.color}}/><span>{e.name}</span>
                  <span style={{marginRight:"auto",fontWeight:600,color:"var(--tx)"}}>{e.value}%</span></div>
              ))}
            </div>
          </div>
          <div className="ec-bars">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyExpenses} margin={{top:0,right:0,left:0,bottom:0}}>
                <Bar dataKey="amount" radius={[3,3,0,0]}>
                  {monthlyExpenses.map((_,i)=><Cell key={i} fill={i===monthlyExpenses.length-1?"var(--em)":"rgba(255,255,255,0.05)"}/>)}</Bar>
                <XAxis dataKey="month" tick={{fontSize:7.5,fill:"#3d4a5c"}} axisLine={false} tickLine={false}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="ac" delay={580}>
          <CardH icon={Bell} title="آخر التحديثات" action="الكل" actionIcon={ChevronLeft}/>
          <div className="al">
            {recentActivities.map((a,i)=>{
              const co={report:{bg:"var(--bld)",c:"var(--bl)"},payment:{bg:"var(--emd)",c:"var(--em)"},
                alert:{bg:"var(--amd)",c:"var(--am)"},milestone:{bg:"var(--emd)",c:"var(--em)"}};
              const cl=co[a.type];
              return(<div className="ai" key={i} style={{animationDelay:`${620+i*50}ms`}}>
                <div className="ai-ic" style={{background:cl.bg,color:cl.c}}><a.icon size={11}/></div>
                <div><div className="ai-tx">{a.text}</div><div className="ai-tm">{a.time}</div></div>
              </div>);
            })}
          </div>
          <div className="us">
            <div className="us-t"><Clock size={10}/><span>الدفعات القادمة</span></div>
            {upcomingPayments.map((p,i)=>(
              <div className="us-i" key={i}>
                <div><div className="us-p">{p.project}</div><div className="us-ty">{p.type} — {p.date}</div></div>
                <span className="us-a">{formatCurrency(p.amount)} ر.س</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
