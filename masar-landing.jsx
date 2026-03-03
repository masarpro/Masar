import { useState, useEffect, useRef } from "react";

/* ─────────────── HOOKS ─────────────── */
function useCounter(end, duration = 2200) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true); }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  useEffect(() => {
    if (!started) return;
    let t0;
    const step = (ts) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / duration, 1);
      setCount(Math.floor((1 - Math.pow(1 - p, 4)) * end));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, end, duration]);
  return { count, ref };
}

function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ─────────────── COMPONENTS ─────────────── */

// Animated mesh background with SVG
function MeshBackground() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {/* Animated gradient orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="orb orb-4" />
      {/* Noise grain */}
      <div className="noise-overlay" />
      {/* Grid with perspective */}
      <div className="perspective-grid" />
      {/* Horizontal glow line */}
      <div className="glow-line" />
    </div>
  );
}

function ParticleField() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w, h, particles, animId;
    const colors = ["16,185,129", "59,130,246", "139,92,246", "6,182,212"];
    const resize = () => { w = canvas.width = canvas.offsetWidth; h = canvas.height = canvas.offsetHeight; };
    resize(); window.addEventListener("resize", resize);
    particles = Array.from({ length: 70 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2 + 0.5, c: colors[Math.floor(Math.random() * colors.length)],
      o: Math.random() * 0.5 + 0.15,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.c},${p.o})`; ctx.fill();
        for (let j = i + 1; j < particles.length; j++) {
          const dx = p.x - particles[j].x, dy = p.y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(${p.c},${0.05 * (1 - dist / 100)})`; ctx.stroke();
          }
        }
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />;
}

function GlowCard({ children, color = "#10B981", delay = 0, active, onClick, style = {} }) {
  const { ref, visible } = useReveal(0.1);
  return (
    <div ref={ref} onClick={onClick} className="glow-card-wrap" style={{
      position: "relative", borderRadius: 28, padding: 2, cursor: onClick ? "pointer" : "default",
      background: active
        ? `linear-gradient(135deg, ${color}90, ${color}20, ${color}70)`
        : "linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02))",
      opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(30px)",
      transition: `all 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
      ...style,
    }}>
      <div style={{
        borderRadius: 26, padding: 36, height: "100%",
        background: active ? `linear-gradient(160deg, ${color}14, rgba(10,10,18,0.96))` : "rgba(10,10,18,0.92)",
        backdropFilter: "blur(40px)", transition: "all 0.5s ease",
      }}>
        {children}
      </div>
      {active && <div style={{
        position: "absolute", inset: -2, borderRadius: 30, zIndex: -1,
        background: `radial-gradient(circle at 50% 0%, ${color}35, transparent 55%)`,
        filter: "blur(40px)",
      }} />}
    </div>
  );
}

function RevealBlock({ children, delay = 0 }) {
  const { ref, visible } = useReveal(0.12);
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(44px)",
      transition: `all 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
    }}>{children}</div>
  );
}

function FAQItem({ q, a, isOpen, onToggle, isAr }) {
  return (
    <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
      <button onClick={onToggle} style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "24px 0", background: "none", border: "none", cursor: "pointer",
        textAlign: isAr ? "right" : "left", gap: 16, fontFamily: "inherit",
      }}>
        <span style={{ color: "white", fontSize: 17, fontWeight: 600, flex: 1 }}>{q}</span>
        <span style={{
          width: 32, height: 32, borderRadius: 10,
          background: isOpen ? "linear-gradient(135deg, #10B981, #06B6D4)" : "rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: isOpen ? "white" : "rgba(255,255,255,0.4)", fontSize: 18,
          transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
          transition: "all 0.4s cubic-bezier(0.16,1,0.3,1)", flexShrink: 0,
        }}>+</span>
      </button>
      <div style={{
        maxHeight: isOpen ? 200 : 0, overflow: "hidden",
        transition: "max-height 0.4s cubic-bezier(0.16,1,0.3,1)",
      }}>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, lineHeight: 1.8, paddingBottom: 24 }}>{a}</p>
      </div>
    </div>
  );
}

/* ─────────────── MAIN ─────────────── */
export default function MasarLanding() {
  const [lang, setLang] = useState("ar");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);

  const isAr = lang === "ar";
  const dir = isAr ? "rtl" : "ltr";
  const t = isAr ? ar : en;

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const iv = setInterval(() => setActiveFeature(p => (p + 1) % 6), 5000);
    return () => clearInterval(iv);
  }, []);

  const stats = [
    { value: 500, suffix: "+", label: t.statsEndpoints, icon: "⚡", color: "#10B981" },
    { value: 77, suffix: "", label: t.statsModels, icon: "🧩", color: "#3B82F6" },
    { value: 120, suffix: "+", label: t.statsPages, icon: "📱", color: "#8B5CF6" },
    { value: 100, suffix: "%", label: t.statsArabic, icon: "🌐", color: "#06B6D4" },
  ];

  const features = [
    { icon: "📊", title: t.feat1Title, desc: t.feat1Desc, color: "#10B981", span: "wide" },
    { icon: "🏗️", title: t.feat2Title, desc: t.feat2Desc, color: "#3B82F6", span: "normal" },
    { icon: "💰", title: t.feat3Title, desc: t.feat3Desc, color: "#F59E0B", span: "normal" },
    { icon: "📋", title: t.feat4Title, desc: t.feat4Desc, color: "#8B5CF6", span: "normal" },
    { icon: "👷", title: t.feat5Title, desc: t.feat5Desc, color: "#EF4444", span: "normal" },
    { icon: "🔐", title: t.feat6Title, desc: t.feat6Desc, color: "#06B6D4", span: "wide" },
  ];

  const pains = [
    { emoji: "😤", text: t.pain1, color: "#EF4444" },
    { emoji: "📱", text: t.pain2, color: "#F59E0B" },
    { emoji: "💸", text: t.pain3, color: "#EC4899" },
    { emoji: "🤯", text: t.pain4, color: "#8B5CF6" },
    { emoji: "📄", text: t.pain5, color: "#3B82F6" },
    { emoji: "⏰", text: t.pain6, color: "#EF4444" },
  ];

  const steps = [
    { num: "01", title: t.step1Title, desc: t.step1Desc, color: "#10B981", accent: "#06B6D4" },
    { num: "02", title: t.step2Title, desc: t.step2Desc, color: "#3B82F6", accent: "#8B5CF6" },
    { num: "03", title: t.step3Title, desc: t.step3Desc, color: "#F59E0B", accent: "#EF4444" },
  ];

  const faqs = [
    { q: t.faq1Q, a: t.faq1A }, { q: t.faq2Q, a: t.faq2A }, { q: t.faq3Q, a: t.faq3A },
    { q: t.faq4Q, a: t.faq4A }, { q: t.faq5Q, a: t.faq5A },
  ];

  const fontAr = "'Noto Kufi Arabic', 'Tajawal', sans-serif";
  const fontEn = "'Space Grotesk', 'DM Sans', sans-serif";

  return (
    <div dir={dir} style={{ fontFamily: isAr ? fontAr : fontEn, background: "#050508", color: "white", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@300;400;500;600;700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');

        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { background: #050508; }

        /* ═══ ANIMATED ORBS ═══ */
        .orb {
          position: absolute; border-radius: 50%; pointer-events: none;
          filter: blur(120px); will-change: transform;
        }
        .orb-1 {
          width: 800px; height: 800px; top: -20%; right: -10%;
          background: conic-gradient(from 0deg, rgba(16,185,129,0.18), rgba(6,182,212,0.12), rgba(59,130,246,0.08), rgba(16,185,129,0.18));
          animation: orbFloat1 18s ease-in-out infinite;
        }
        .orb-2 {
          width: 600px; height: 600px; bottom: -5%; left: -5%;
          background: conic-gradient(from 180deg, rgba(59,130,246,0.15), rgba(139,92,246,0.12), rgba(236,72,153,0.06), rgba(59,130,246,0.15));
          animation: orbFloat2 22s ease-in-out infinite;
        }
        .orb-3 {
          width: 500px; height: 500px; top: 40%; left: 35%;
          background: radial-gradient(circle, rgba(139,92,246,0.1), rgba(6,182,212,0.06), transparent 70%);
          animation: orbFloat3 26s ease-in-out infinite;
        }
        .orb-4 {
          width: 350px; height: 350px; top: 15%; left: 15%;
          background: radial-gradient(circle, rgba(245,158,11,0.08), rgba(239,68,68,0.04), transparent 70%);
          animation: orbFloat1 30s ease-in-out infinite reverse;
        }

        @keyframes orbFloat1 {
          0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); }
          25% { transform: translate(60px, -40px) rotate(90deg) scale(1.05); }
          50% { transform: translate(-30px, 50px) rotate(180deg) scale(0.95); }
          75% { transform: translate(40px, 20px) rotate(270deg) scale(1.03); }
        }
        @keyframes orbFloat2 {
          0%, 100% { transform: translate(0, 0) rotate(0deg) scale(1); }
          33% { transform: translate(-50px, -30px) rotate(-120deg) scale(1.08); }
          66% { transform: translate(40px, 40px) rotate(-240deg) scale(0.92); }
        }
        @keyframes orbFloat3 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.8; }
          50% { transform: translate(-60px, 30px) scale(1.1); opacity: 1; }
        }

        /* ═══ NOISE TEXTURE ═══ */
        .noise-overlay {
          position: absolute; inset: 0; opacity: 0.035; mix-blend-mode: overlay;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-repeat: repeat; background-size: 256px 256px;
          pointer-events: none;
        }

        /* ═══ PERSPECTIVE GRID ═══ */
        .perspective-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(16,185,129,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px);
          background-size: 80px 80px;
          mask-image: radial-gradient(ellipse at 50% 30%, black 20%, transparent 70%);
          -webkit-mask-image: radial-gradient(ellipse at 50% 30%, black 20%, transparent 70%);
          animation: gridShift 20s linear infinite;
        }
        @keyframes gridShift {
          0% { background-position: 0 0; }
          100% { background-position: 80px 80px; }
        }

        /* ═══ GLOW LINE ═══ */
        .glow-line {
          position: absolute; top: 65%; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(16,185,129,0.15), rgba(59,130,246,0.15), rgba(139,92,246,0.1), transparent);
          animation: lineGlow 4s ease-in-out infinite alternate;
        }
        @keyframes lineGlow {
          0% { opacity: 0.3; } 100% { opacity: 0.8; }
        }

        /* ═══ SHIMMER TEXT ═══ */
        @keyframes shimmerText {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .shimmer-hero {
          background: linear-gradient(90deg, #10B981 0%, #06B6D4 20%, #3B82F6 40%, #8B5CF6 55%, #06B6D4 70%, #10B981 85%, #34D399 100%);
          background-size: 200% auto;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmerText 5s linear infinite;
        }
        .shimmer-green {
          background: linear-gradient(90deg, #10B981, #06B6D4, #10B981, #34D399, #10B981);
          background-size: 200% auto;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmerText 4s linear infinite;
        }

        /* ═══ BUTTONS ═══ */
        @keyframes btnShine {
          0% { left: -100%; }
          100% { left: 200%; }
        }
        @keyframes btnPulseGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(16,185,129,0.2), 0 0 60px rgba(16,185,129,0.05); }
          50% { box-shadow: 0 0 30px rgba(16,185,129,0.35), 0 0 80px rgba(16,185,129,0.1); }
        }
        @keyframes btnRainbow {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }

        .btn-premium {
          position: relative; display: inline-flex; align-items: center; gap: 12px;
          padding: 20px 44px; border: none; border-radius: 20px;
          font-size: 17px; font-weight: 700; cursor: pointer;
          text-decoration: none; overflow: hidden;
          font-family: inherit; z-index: 1;
          transition: all 0.5s cubic-bezier(0.16,1,0.3,1);
        }
        .btn-premium-primary {
          background: linear-gradient(135deg, #10B981, #059669, #06B6D4);
          background-size: 200% 200%;
          animation: btnRainbow 4s ease infinite, btnPulseGlow 3s ease-in-out infinite;
          color: white;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .btn-premium-primary::before {
          content: ''; position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transform: skewX(-20deg);
          animation: btnShine 4s ease-in-out infinite;
        }
        .btn-premium-primary::after {
          content: ''; position: absolute; inset: -2px; border-radius: 22px; z-index: -1;
          background: linear-gradient(135deg, #10B981, #06B6D4, #3B82F6, #8B5CF6);
          background-size: 300% 300%;
          animation: btnRainbow 3s ease infinite;
          filter: blur(8px); opacity: 0.4;
        }
        .btn-premium-primary:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 24px 80px rgba(16,185,129,0.4), 0 0 120px rgba(6,182,212,0.15);
        }

        .btn-premium-ghost {
          background: rgba(255,255,255,0.03);
          color: white;
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(20px);
        }
        .btn-premium-ghost::before {
          content: ''; position: absolute; inset: 0; border-radius: 20px;
          background: linear-gradient(135deg, rgba(16,185,129,0.05), rgba(59,130,246,0.05), rgba(139,92,246,0.03));
          opacity: 0; transition: opacity 0.4s;
        }
        .btn-premium-ghost:hover::before { opacity: 1; }
        .btn-premium-ghost:hover {
          transform: translateY(-4px);
          border-color: rgba(16,185,129,0.25);
          box-shadow: 0 20px 60px rgba(0,0,0,0.4), 0 0 40px rgba(16,185,129,0.08);
        }

        .btn-nav-signup {
          background: linear-gradient(135deg, #10B981, #059669);
          color: white; padding: 10px 24px; border-radius: 14px;
          text-decoration: none; font-weight: 700; font-size: 14px;
          transition: all 0.4s cubic-bezier(0.16,1,0.3,1);
          position: relative; overflow: hidden;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .btn-nav-signup::after {
          content: ''; position: absolute; inset: -1px; border-radius: 15px; z-index: -1;
          background: linear-gradient(135deg, #10B981, #06B6D4);
          filter: blur(6px); opacity: 0.3;
        }
        .btn-nav-signup:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(16,185,129,0.3);
        }

        /* ═══ NAV ═══ */
        .nav-link {
          color: rgba(255,255,255,0.55); text-decoration: none;
          font-size: 14px; font-weight: 500; padding: 8px 16px;
          border-radius: 10px; transition: all 0.3s; position: relative;
        }
        .nav-link:hover { color: #10B981; background: rgba(16,185,129,0.05); }

        /* ═══ SECTION LABEL ═══ */
        .section-label {
          display: inline-flex; align-items: center; gap: 10px;
          padding: 10px 22px; border-radius: 100px;
          font-size: 13px; font-weight: 600; letter-spacing: 0.5px;
          margin-bottom: 24px;
        }

        /* ═══ CARDS ═══ */
        .pain-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 22px; padding: 30px;
          transition: all 0.4s cubic-bezier(0.16,1,0.3,1);
          position: relative; overflow: hidden;
        }
        .pain-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 24px 48px rgba(0,0,0,0.3);
        }

        .step-card {
          position: relative; border-radius: 24px; padding: 2px;
          transition: all 0.5s cubic-bezier(0.16,1,0.3,1);
        }
        .step-card:hover { transform: translateY(-8px); }

        .price-card {
          border-radius: 28px; padding: 44px 36px;
          transition: all 0.5s cubic-bezier(0.16,1,0.3,1);
          position: relative; overflow: hidden;
        }
        .price-card:hover { transform: translateY(-6px); }

        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.6; transform: scale(0.95); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }

        .mobile-overlay {
          position: fixed; inset: 0; z-index: 999;
          background: rgba(5,5,8,0.96); backdrop-filter: blur(30px);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 20px;
          animation: slideDown 0.3s ease;
        }
        .mobile-overlay a {
          color: white; text-decoration: none;
          font-size: 22px; font-weight: 600;
          padding: 14px 32px; border-radius: 16px;
          transition: background 0.3s;
        }
        .mobile-overlay a:hover { background: rgba(255,255,255,0.06); }

        @media (max-width: 768px) {
          .hide-m { display: none !important; }
          .hero-h1 { font-size: 34px !important; }
          .hero-sub { font-size: 17px !important; }
          .sec-title { font-size: 28px !important; }
          .feat-grid { grid-template-columns: 1fr !important; }
          .pain-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .steps-grid { grid-template-columns: 1fr !important; }
          .price-grid { grid-template-columns: 1fr !important; }
          .cta-row { flex-direction: column !important; align-items: stretch !important; }
          .btn-premium { justify-content: center !important; }
          .nav-d { display: none !important; }
          .burger { display: block !important; }
        }
        @media (min-width: 769px) { .burger { display: none !important; } }
      `}</style>

      {/* ══════════ NAVBAR ══════════ */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? "rgba(5,5,8,0.8)" : "transparent",
        backdropFilter: scrolled ? "blur(24px) saturate(180%)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "none",
        transition: "all 0.5s ease", padding: "0 24px",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 72 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 14,
              background: "linear-gradient(135deg, #10B981, #06B6D4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20, fontWeight: 900, color: "white",
              boxShadow: "0 0 24px rgba(16,185,129,0.25), 0 0 60px rgba(6,182,212,0.1)",
            }}>م</div>
            <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: isAr ? 0 : "-0.5px" }}>
              {isAr ? "مسار" : "Masar"}
            </span>
          </div>

          <div className="nav-d" style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {[["#features", t.navFeatures], ["#how", t.navHow], ["#pricing", t.navPricing], ["#faq", t.navFaq]].map(([h, l]) => (
              <a key={h} href={h} className="nav-link">{l}</a>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => setLang(isAr ? "en" : "ar")} style={{
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              color: "white", padding: "8px 16px", borderRadius: 10,
              cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all 0.3s", fontFamily: "inherit",
            }}>{isAr ? "EN" : "عربي"}</button>
            <a href="/auth/login" className="nav-link hide-m" style={{ color: "rgba(255,255,255,0.7)" }}>{t.navLogin}</a>
            <a href="/auth/signup" className="btn-nav-signup hide-m">{t.navSignup}</a>
            <button className="burger" onClick={() => setMobileMenu(true)} style={{
              background: "none", border: "none", color: "white", fontSize: 26, cursor: "pointer",
            }}>☰</button>
          </div>
        </div>
      </nav>

      {mobileMenu && (
        <div className="mobile-overlay">
          <button onClick={() => setMobileMenu(false)} style={{
            position: "absolute", top: 20, [isAr ? "left" : "right"]: 24,
            background: "none", border: "none", color: "white", fontSize: 32, cursor: "pointer",
          }}>✕</button>
          {[["#features", t.navFeatures], ["#how", t.navHow], ["#pricing", t.navPricing], ["#faq", t.navFaq]].map(([h, l]) => (
            <a key={h} href={h} onClick={() => setMobileMenu(false)}>{l}</a>
          ))}
          <hr style={{ width: 60, border: "none", borderTop: "1px solid rgba(255,255,255,0.1)", margin: "8px 0" }} />
          <a href="/auth/login" onClick={() => setMobileMenu(false)}>{t.navLogin}</a>
          <a href="/auth/signup" className="btn-premium btn-premium-primary" onClick={() => setMobileMenu(false)} style={{ fontSize: 17 }}>{t.navSignup}</a>
        </div>
      )}

      {/* ══════════ HERO ══════════ */}
      <section style={{
        minHeight: "100vh", position: "relative", overflow: "hidden",
        display: "flex", alignItems: "center", padding: "140px 24px 100px",
      }}>
        <MeshBackground />
        <ParticleField />
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse at center, transparent 30%, #050508 75%)",
        }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", position: "relative", zIndex: 2 }}>
          <div style={{ maxWidth: 780, margin: isAr ? "0 0 0 auto" : "0 auto 0 0" }}>
            <RevealBlock>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,182,212,0.06))",
                border: "1px solid rgba(16,185,129,0.15)",
                padding: "10px 22px", borderRadius: 100, marginBottom: 36,
              }}>
                <span style={{ fontSize: 16 }}>🇸🇦</span>
                <span style={{ color: "#10B981", fontSize: 14, fontWeight: 600 }}>{t.heroBadge}</span>
              </div>
            </RevealBlock>

            <RevealBlock delay={0.1}>
              <h1 className="hero-h1" style={{ fontSize: 62, fontWeight: 900, lineHeight: 1.12, marginBottom: 28, letterSpacing: isAr ? 0 : "-2.5px" }}>
                <span style={{ color: "white" }}>{t.heroTitle1}</span><br />
                <span className="shimmer-hero">{t.heroTitle2}</span>
              </h1>
            </RevealBlock>

            <RevealBlock delay={0.2}>
              <p className="hero-sub" style={{ fontSize: 20, color: "rgba(255,255,255,0.5)", lineHeight: 1.8, marginBottom: 48, maxWidth: 580, fontWeight: 400 }}>
                {t.heroSub}
              </p>
            </RevealBlock>

            <RevealBlock delay={0.3}>
              <div className="cta-row" style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <a href="/auth/signup" className="btn-premium btn-premium-primary">
                  {t.heroCTA}
                  <span style={{ fontSize: 20 }}>{isAr ? "←" : "→"}</span>
                </a>
                <a href="#features" className="btn-premium btn-premium-ghost">
                  {t.heroSecondary}
                  <span style={{ fontSize: 16, opacity: 0.5 }}>↓</span>
                </a>
              </div>
            </RevealBlock>

            <RevealBlock delay={0.4}>
              <div style={{ marginTop: 52, display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ display: "flex" }}>
                  {["#10B981", "#3B82F6", "#F59E0B", "#8B5CF6"].map((c, i) => (
                    <div key={i} style={{
                      width: 40, height: 40, borderRadius: "50%",
                      background: `linear-gradient(135deg, ${c}, ${c}99)`,
                      border: "3px solid #050508", marginInlineStart: i > 0 ? -10 : 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, color: "white", fontWeight: 700,
                      boxShadow: `0 0 12px ${c}33`,
                    }}>{["م", "ع", "خ", "ف"][i]}</div>
                  ))}
                </div>
                <div>
                  <div style={{ display: "flex", gap: 2, marginBottom: 4 }}>
                    {[1,2,3,4,5].map(i => <span key={i} style={{ color: "#F59E0B", fontSize: 14, textShadow: "0 0 8px rgba(245,158,11,0.4)" }}>★</span>)}
                  </div>
                  <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, fontWeight: 500 }}>{t.heroProof}</p>
                </div>
              </div>
            </RevealBlock>
          </div>
        </div>
      </section>

      {/* ══════════ PAIN ══════════ */}
      <section style={{
        padding: "120px 24px", position: "relative",
        background: "linear-gradient(180deg, #050508 0%, #0A0A12 50%, #050508 100%)",
      }}>
        <div style={{
          position: "absolute", top: "50%", [isAr ? "left" : "right"]: "-5%",
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(239,68,68,0.06), transparent 70%)",
          filter: "blur(80px)", pointerEvents: "none", transform: "translateY(-50%)",
        }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
          <RevealBlock>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <div className="section-label" style={{
                background: "linear-gradient(135deg, rgba(239,68,68,0.06), rgba(236,72,153,0.04))",
                border: "1px solid rgba(239,68,68,0.12)", color: "#EF4444",
              }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "linear-gradient(135deg, #EF4444, #EC4899)", animation: "pulse 2s infinite" }} />
                {t.painLabel}
              </div>
              <h2 className="sec-title" style={{ fontSize: 42, fontWeight: 800, lineHeight: 1.3, maxWidth: 650, margin: "0 auto" }}>
                {t.painTitle}
              </h2>
            </div>
          </RevealBlock>

          <div className="pain-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {pains.map((p, i) => (
              <RevealBlock key={i} delay={i * 0.08}>
                <div className="pain-card" style={{
                  borderColor: "rgba(255,255,255,0.04)",
                  background: `linear-gradient(160deg, ${p.color}06, rgba(255,255,255,0.01))`,
                }}>
                  <div style={{
                    position: "absolute", top: 0, [isAr ? "right" : "left"]: 0,
                    width: 60, height: 2,
                    background: `linear-gradient(90deg, ${p.color}50, transparent)`,
                    borderRadius: "22px 0 0 0",
                  }} />
                  <span style={{ fontSize: 30, display: "block", marginBottom: 14 }}>{p.emoji}</span>
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 15, lineHeight: 1.75, fontWeight: 500 }}>{p.text}</p>
                </div>
              </RevealBlock>
            ))}
          </div>

          <RevealBlock delay={0.5}>
            <div style={{ textAlign: "center", marginTop: 56 }}>
              <p style={{ fontSize: 22, fontWeight: 700 }}>
                <span className="shimmer-green">{t.painSolution}</span>
              </p>
            </div>
          </RevealBlock>
        </div>
      </section>

      {/* ══════════ FEATURES ══════════ */}
      <section id="features" style={{
        position: "relative", padding: "120px 24px",
        background: "linear-gradient(180deg, #050508 0%, #06091A 50%, #050508 100%)",
      }}>
        <div style={{
          position: "absolute", top: "30%", left: "50%", transform: "translateX(-50%)",
          width: 1000, height: 600, borderRadius: "50%",
          background: "conic-gradient(from 0deg, rgba(16,185,129,0.04), rgba(59,130,246,0.04), rgba(139,92,246,0.03), rgba(16,185,129,0.04))",
          filter: "blur(120px)", pointerEvents: "none",
        }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 2 }}>
          <RevealBlock>
            <div style={{ textAlign: "center", marginBottom: 72 }}>
              <div className="section-label" style={{
                background: "linear-gradient(135deg, rgba(16,185,129,0.06), rgba(6,182,212,0.04))",
                border: "1px solid rgba(16,185,129,0.12)", color: "#10B981",
              }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "linear-gradient(135deg, #10B981, #06B6D4)", animation: "pulse 2s infinite" }} />
                {t.featLabel}
              </div>
              <h2 className="sec-title" style={{ fontSize: 42, fontWeight: 800, lineHeight: 1.3, maxWidth: 550, margin: "0 auto" }}>
                {t.featTitle}
              </h2>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 17, marginTop: 16, maxWidth: 480, margin: "16px auto 0" }}>
                {t.featSub}
              </p>
            </div>
          </RevealBlock>

          <div className="feat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {features.map((f, i) => (
              <GlowCard key={i} color={f.color} delay={i * 0.08} active={activeFeature === i} onClick={() => setActiveFeature(i)}
                style={{ gridColumn: f.span === "wide" && typeof window !== "undefined" && window.innerWidth > 768 ? "span 2" : "span 1" }}
              >
                <div style={{
                  width: 54, height: 54, borderRadius: 16,
                  background: `linear-gradient(135deg, ${f.color}12, ${f.color}06)`,
                  border: `1px solid ${f.color}25`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 26, marginBottom: 20,
                  boxShadow: activeFeature === i ? `0 0 30px ${f.color}20, 0 0 60px ${f.color}08` : "none",
                  transition: "all 0.4s",
                }}>{f.icon}</div>
                <h3 style={{ fontSize: 19, fontWeight: 700, marginBottom: 10, color: "white" }}>{f.title}</h3>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 14, lineHeight: 1.75 }}>{f.desc}</p>
              </GlowCard>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ STATS ══════════ */}
      <section style={{
        padding: "100px 24px", position: "relative", background: "#050508",
        borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
            {stats.map((s, i) => {
              const { count, ref } = useCounter(s.value, 2200);
              return (
                <RevealBlock key={i} delay={i * 0.1}>
                  <div ref={ref} style={{
                    textAlign: "center", padding: 32, position: "relative", borderRadius: 24,
                    background: `linear-gradient(160deg, ${s.color}06, transparent)`,
                    border: `1px solid ${s.color}10`,
                  }}>
                    <div style={{
                      position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
                      width: 100, height: 100, borderRadius: "50%",
                      background: `radial-gradient(circle, ${s.color}10, transparent 70%)`,
                      filter: "blur(25px)",
                    }} />
                    <div style={{ fontSize: 18, marginBottom: 12 }}>{s.icon}</div>
                    <div style={{
                      fontSize: 52, fontWeight: 900, marginBottom: 8,
                      fontFamily: "'Space Grotesk', 'DM Sans', sans-serif",
                      background: `linear-gradient(135deg, ${s.color}, ${s.color}BB)`,
                      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                    }}>{count}{s.suffix}</div>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, fontWeight: 500 }}>{s.label}</p>
                  </div>
                </RevealBlock>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════ HOW IT WORKS ══════════ */}
      <section id="how" style={{ padding: "120px 24px", background: "linear-gradient(180deg, #050508 0%, #060A14 100%)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <RevealBlock>
            <div style={{ textAlign: "center", marginBottom: 72 }}>
              <div className="section-label" style={{
                background: "linear-gradient(135deg, rgba(59,130,246,0.06), rgba(139,92,246,0.04))",
                border: "1px solid rgba(59,130,246,0.12)", color: "#3B82F6",
              }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "linear-gradient(135deg, #3B82F6, #8B5CF6)", animation: "pulse 2s infinite" }} />
                {t.howLabel}
              </div>
              <h2 className="sec-title" style={{ fontSize: 42, fontWeight: 800, lineHeight: 1.3 }}>{t.howTitle}</h2>
            </div>
          </RevealBlock>

          <div className="steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {steps.map((s, i) => (
              <RevealBlock key={i} delay={i * 0.15}>
                <div className="step-card" style={{
                  background: `linear-gradient(135deg, ${s.color}15, ${s.accent}08, rgba(255,255,255,0.02))`,
                }}>
                  <div style={{
                    borderRadius: 22, padding: "40px 32px", height: "100%",
                    background: "rgba(5,5,8,0.85)", backdropFilter: "blur(20px)", textAlign: "center",
                  }}>
                    {i < 2 && <div className="hide-m" style={{
                      position: "absolute", top: "50%", [isAr ? "left" : "right"]: -12,
                      width: 24, height: 2,
                      background: `linear-gradient(90deg, ${s.color}40, transparent)`,
                    }} />}
                    <div style={{
                      width: 68, height: 68, borderRadius: 22, margin: "0 auto 24px",
                      background: `linear-gradient(135deg, ${s.color}18, ${s.accent}10)`,
                      border: `1px solid ${s.color}25`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 24, fontWeight: 900, color: s.color,
                      fontFamily: "'Space Grotesk', monospace",
                      boxShadow: `0 0 30px ${s.color}10`,
                    }}>{s.num}</div>
                    <h3 style={{ fontSize: 19, fontWeight: 700, marginBottom: 12, color: "white" }}>{s.title}</h3>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, lineHeight: 1.75 }}>{s.desc}</p>
                  </div>
                </div>
              </RevealBlock>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ PRICING ══════════ */}
      <section id="pricing" style={{ padding: "120px 24px", background: "#050508" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <RevealBlock>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <div className="section-label" style={{
                background: "linear-gradient(135deg, rgba(245,158,11,0.06), rgba(239,68,68,0.04))",
                border: "1px solid rgba(245,158,11,0.12)", color: "#F59E0B",
              }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "linear-gradient(135deg, #F59E0B, #EF4444)", animation: "pulse 2s infinite" }} />
                {t.priceLabel}
              </div>
              <h2 className="sec-title" style={{ fontSize: 42, fontWeight: 800, lineHeight: 1.3 }}>{t.priceTitle}</h2>
            </div>
          </RevealBlock>

          <div className="price-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 24, maxWidth: 760, margin: "0 auto" }}>
            <RevealBlock delay={0.1}>
              <div className="price-card" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>{t.priceFreeTitle}</h3>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14, marginBottom: 28 }}>{t.priceFreeSub}</p>
                <div style={{ fontSize: 44, fontWeight: 900, marginBottom: 28, fontFamily: "'Space Grotesk', sans-serif" }}>{t.priceFreePrice}</div>
                <ul style={{ listStyle: "none", marginBottom: 36 }}>
                  {t.priceFreeFeats.map((f, i) => (
                    <li key={i} style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, padding: "10px 0", display: "flex", alignItems: "center", gap: 10, borderBottom: i < t.priceFreeFeats.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                      <span style={{ color: "#10B981" }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <a href="/auth/signup" className="btn-premium btn-premium-ghost" style={{ width: "100%", justifyContent: "center", padding: "16px", fontSize: 15 }}>{t.priceFreeCTA}</a>
              </div>
            </RevealBlock>

            <RevealBlock delay={0.2}>
              <div className="price-card" style={{
                background: "linear-gradient(160deg, rgba(16,185,129,0.08), rgba(6,182,212,0.03), rgba(10,10,18,0.98))",
                border: "2px solid rgba(16,185,129,0.2)",
                boxShadow: "0 0 100px rgba(16,185,129,0.06), 0 0 40px rgba(6,182,212,0.04)",
              }}>
                <div style={{
                  position: "absolute", top: -14, [isAr ? "left" : "right"]: 24,
                  background: "linear-gradient(135deg, #10B981, #06B6D4)",
                  color: "white", padding: "7px 20px", borderRadius: 100,
                  fontSize: 12, fontWeight: 700, letterSpacing: 0.5,
                  boxShadow: "0 4px 20px rgba(16,185,129,0.3), 0 0 40px rgba(6,182,212,0.1)",
                }}>{t.priceProBadge}</div>
                <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>{t.priceProTitle}</h3>
                <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 14, marginBottom: 28 }}>{t.priceProSub}</p>
                <div style={{ marginBottom: 28, display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span style={{ fontSize: 44, fontWeight: 900, fontFamily: "'Space Grotesk', sans-serif" }}>
                    <span className="shimmer-green">{t.priceProPrice}</span>
                  </span>
                  <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 15 }}>{t.priceProPer}</span>
                </div>
                <ul style={{ listStyle: "none", marginBottom: 36 }}>
                  {t.priceProFeats.map((f, i) => (
                    <li key={i} style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, padding: "10px 0", display: "flex", alignItems: "center", gap: 10, borderBottom: i < t.priceProFeats.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                      <span style={{ background: "linear-gradient(135deg, #10B981, #06B6D4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <a href="/auth/signup" className="btn-premium btn-premium-primary" style={{ width: "100%", justifyContent: "center", padding: "16px", fontSize: 16 }}>{t.priceProCTA}</a>
              </div>
            </RevealBlock>
          </div>
        </div>
      </section>

      {/* ══════════ ZATCA ══════════ */}
      <section style={{ padding: "80px 24px", background: "linear-gradient(180deg, #050508, #06091A)" }}>
        <RevealBlock>
          <div style={{
            maxWidth: 800, margin: "0 auto", position: "relative", borderRadius: 28, padding: 2, overflow: "hidden",
            background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(6,182,212,0.1), rgba(255,255,255,0.03))",
          }}>
            <div style={{
              borderRadius: 26, padding: "48px 40", background: "rgba(5,5,8,0.95)", backdropFilter: "blur(20px)",
              display: "flex", alignItems: "center", gap: 32, flexWrap: "wrap", justifyContent: "center",
            }}>
              <div style={{
                width: 72, height: 72, borderRadius: 20,
                background: "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(6,182,212,0.06))",
                border: "1px solid rgba(16,185,129,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, flexShrink: 0,
                boxShadow: "0 0 30px rgba(16,185,129,0.08)",
              }}>🏛️</div>
              <div style={{ flex: 1, minWidth: 220 }}>
                <h3 style={{ fontSize: 21, fontWeight: 700, marginBottom: 8 }}>{t.zatcaTitle}</h3>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, lineHeight: 1.75 }}>{t.zatcaDesc}</p>
              </div>
              <div style={{
                background: "linear-gradient(135deg, rgba(16,185,129,0.1), rgba(6,182,212,0.06))",
                border: "1px solid rgba(16,185,129,0.2)", borderRadius: 14, padding: "12px 24px",
                color: "#10B981", fontWeight: 700, fontSize: 13, flexShrink: 0,
                boxShadow: "0 0 20px rgba(16,185,129,0.06)",
              }}>{t.zatcaBadge}</div>
            </div>
          </div>
        </RevealBlock>
      </section>

      {/* ══════════ FAQ ══════════ */}
      <section id="faq" style={{ padding: "120px 24px", background: "#050508" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <RevealBlock>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <div className="section-label" style={{
                background: "linear-gradient(135deg, rgba(139,92,246,0.06), rgba(59,130,246,0.04))",
                border: "1px solid rgba(139,92,246,0.12)", color: "#8B5CF6",
              }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "linear-gradient(135deg, #8B5CF6, #3B82F6)", animation: "pulse 2s infinite" }} />
                {t.faqLabel}
              </div>
              <h2 className="sec-title" style={{ fontSize: 42, fontWeight: 800, lineHeight: 1.3 }}>{t.faqTitle}</h2>
            </div>
          </RevealBlock>

          <RevealBlock delay={0.1}>
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 24, padding: "8px 36px" }}>
              {faqs.map((faq, i) => (
                <FAQItem key={i} q={faq.q} a={faq.a} isAr={isAr} isOpen={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? null : i)} />
              ))}
            </div>
          </RevealBlock>
        </div>
      </section>

      {/* ══════════ FINAL CTA ══════════ */}
      <section style={{
        padding: "160px 24px", textAlign: "center", position: "relative", overflow: "hidden",
        background: "linear-gradient(180deg, #050508, #06091A, #050508)",
      }}>
        <div style={{ position: "absolute", top: "40%", left: "30%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.12), transparent 60%)", filter: "blur(100px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "50%", left: "60%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(6,182,212,0.08), transparent 60%)", filter: "blur(80px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "45%", left: "45%", transform: "translate(-50%,-50%)", width: 250, height: 250, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.1), transparent 60%)", filter: "blur(50px)", pointerEvents: "none", animation: "pulse 4s infinite" }} />

        <div style={{ maxWidth: 700, margin: "0 auto", position: "relative", zIndex: 2 }}>
          <RevealBlock>
            <h2 style={{ fontSize: 52, fontWeight: 900, lineHeight: 1.15, marginBottom: 24, letterSpacing: isAr ? 0 : "-1.5px" }}>{t.ctaTitle}</h2>
          </RevealBlock>
          <RevealBlock delay={0.1}>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 18, lineHeight: 1.8, marginBottom: 48 }}>{t.ctaSub}</p>
          </RevealBlock>
          <RevealBlock delay={0.2}>
            <a href="/auth/signup" className="btn-premium btn-premium-primary" style={{ padding: "22px 60px", fontSize: 19, borderRadius: 22 }}>
              {t.ctaButton}
              <span style={{ fontSize: 22 }}>{isAr ? "←" : "→"}</span>
            </a>
            <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 13, marginTop: 24 }}>{t.ctaNote}</p>
          </RevealBlock>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer style={{ background: "#050508", borderTop: "1px solid rgba(255,255,255,0.04)", padding: "48px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg, #10B981, #06B6D4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 900, color: "white" }}>م</div>
            <span style={{ fontSize: 17, fontWeight: 700, color: "rgba(255,255,255,0.35)" }}>{isAr ? "مسار" : "Masar"}</span>
          </div>
          <p style={{ color: "rgba(255,255,255,0.18)", fontSize: 13 }}>{t.footer}</p>
        </div>
      </footer>
    </div>
  );
}

/* ═══════════════ TRANSLATIONS ═══════════════ */
const ar = {
  navFeatures: "المميزات", navHow: "كيف يعمل", navPricing: "الأسعار", navFaq: "أسئلة شائعة",
  navLogin: "دخول", navSignup: "ابدأ مجاناً",
  heroBadge: "مصمم للسوق السعودي 🏗️",
  heroTitle1: "مشاريعك متفرقة؟", heroTitle2: "مسار يجمعها لك.",
  heroSub: "منصة واحدة تدير فيها كل شيء — المالية، التنفيذ، المقاولين، المستندات — بدون تعقيد. مصممة خصيصاً للمقاول السعودي.",
  heroCTA: "جرّب مسار مجاناً", heroSecondary: "شوف المميزات",
  heroProof: "مقاولين سعوديين بدأوا يستخدمون مسار",
  painLabel: "المشكلة", painTitle: "كل مقاول يعاني من نفس الأشياء",
  pain1: "المعلومات متفرقة بين واتساب وإكسل وإيميل — وكل واحد عنده نسخة مختلفة",
  pain2: "المشرف بالموقع ما يقدر يوصل للمعلومات اللي يحتاجها بسهولة",
  pain3: "المصروفات تضيع والفواتير تتأخر — وما تعرف وين راحت فلوسك بالضبط",
  pain4: "البرامج الأجنبية معقدة وما تفهم طريقة شغلنا",
  pain5: "تقارير المالك تاخذ وقت وجهد — وكل مرة تبدأ من الصفر",
  pain6: "تتبع التقدم الفعلي مقابل المخطط شبه مستحيل بدون نظام",
  painSolution: "مسار يحل كل هذا — في مكان واحد ✨",
  featLabel: "المميزات", featTitle: "كل اللي تحتاجه، ولا شيء ما تحتاجه",
  featSub: "أدوات مصممة لطريقة شغل المقاول السعودي",
  feat1Title: "لوحة تحكم ذكية", feat1Desc: "شوف حالة كل مشاريعك بنظرة — الميزانية، التقدم، الجدول الزمني، كلها قدامك.",
  feat2Title: "التنفيذ الميداني", feat2Desc: "تقارير يومية، صور، مشاكل، تحديثات تقدم — كلها من الموقع مباشرة.",
  feat3Title: "المالية والفواتير", feat3Desc: "مصروفات، مطالبات، دفعات، فواتير — كلها متصلة ببعض تلقائياً.",
  feat4Title: "المقاولين والعقود", feat4Desc: "عقود باطن، أوامر تغيير، شروط دفع — كلها منظمة ومتتبعة.",
  feat5Title: "بوابة المالك", feat5Desc: "المالك يشوف تحديثات مشروعه بدون ما تحتاج ترسل له تقارير.",
  feat6Title: "صلاحيات ذكية", feat6Desc: "كل واحد يشوف بس اللي يخصه — مدير، مهندس، محاسب، مشرف.",
  statsEndpoints: "عملية في النظام", statsModels: "نموذج بيانات",
  statsPages: "صفحة متكاملة", statsArabic: "دعم عربي كامل",
  howLabel: "كيف يعمل", howTitle: "ثلاث خطوات وتبدأ",
  step1Title: "سجّل وأنشئ شركتك", step1Desc: "حساب مجاني في دقيقة. أضف بيانات شركتك وموظفينك.",
  step2Title: "أضف مشاريعك", step2Desc: "أنشئ مشاريعك وعيّن فريق العمل والأدوار.",
  step3Title: "ابدأ الإدارة", step3Desc: "تابع كل شيء من مكان واحد — مالية، تنفيذ، مستندات.",
  priceLabel: "الأسعار", priceTitle: "بسيط وواضح",
  priceFreeTitle: "مجاني", priceFreeSub: "جرّب وشوف بنفسك", priceFreePrice: "٠ ر.س",
  priceFreeFeats: ["استعراض كامل للنظام", "مشروع تجريبي", "كل المميزات (قراءة فقط)"],
  priceFreeCTA: "ابدأ مجاناً",
  priceProBadge: "الأكثر طلباً", priceProTitle: "احترافي", priceProSub: "كل شيء بلا حدود",
  priceProPrice: "١٩٩", priceProPer: " ر.س / شهرياً",
  priceProFeats: ["مشاريع بلا حدود", "كل المميزات المتقدمة", "بوابة المالك", "فواتير ومطالبات", "دعم فني أولوية", "تحديثات مستمرة"],
  priceProCTA: "اشترك الآن",
  zatcaTitle: "متوافق مع هيئة الزكاة والضريبة",
  zatcaDesc: "فواتير إلكترونية تتوافق مع متطلبات ZATCA المرحلة الأولى — QR كود وتنسيق عربي معتمد.",
  zatcaBadge: "✓ ZATCA Phase 1",
  faqLabel: "أسئلة شائعة", faqTitle: "عندك سؤال؟",
  faq1Q: "هل أقدر أجرب مسار بدون ما أدفع؟",
  faq1A: "أكيد! الباقة المجانية تعطيك استعراض كامل للنظام مع مشروع تجريبي. تقدر تشوف كل المميزات قبل ما تقرر.",
  faq2Q: "هل مسار يدعم اللغة العربية بالكامل؟",
  faq2A: "نعم، مسار مبني من الأساس بدعم كامل للعربية — الواجهة، الفواتير، التقارير، وحتى مصطلحات البناء السعودية.",
  faq3Q: "كم مشروع أقدر أضيف؟",
  faq3A: "في الباقة الاحترافية، تقدر تضيف مشاريع بلا حدود مع كامل المميزات لكل مشروع.",
  faq4Q: "هل الفواتير متوافقة مع هيئة الزكاة والضريبة؟",
  faq4A: "نعم، مسار يدعم ZATCA المرحلة الأولى بالكامل — QR كود وتنسيق الفاتورة العربي المعتمد.",
  faq5Q: "أقدر ألغي الاشتراك في أي وقت؟",
  faq5A: "طبعاً، تقدر تلغي اشتراكك في أي وقت بدون أي التزامات أو رسوم إضافية.",
  ctaTitle: "جاهز تنظّم شغلك؟",
  ctaSub: "ابدأ مجاناً اليوم وشوف الفرق بنفسك. بدون بطاقة ائتمان، بدون التزام.",
  ctaButton: "ابدأ الآن مجاناً",
  ctaNote: "لا يحتاج بطاقة ائتمان • إلغاء في أي وقت",
  footer: "© ٢٠٢٦ مسار — جميع الحقوق محفوظة",
};

const en = {
  navFeatures: "Features", navHow: "How it works", navPricing: "Pricing", navFaq: "FAQ",
  navLogin: "Login", navSignup: "Start Free",
  heroBadge: "Built for the Saudi Market 🏗️",
  heroTitle1: "Projects scattered?", heroTitle2: "Masar unifies them.",
  heroSub: "One platform to manage everything — finances, execution, contractors, documents — no complexity. Built specifically for the Saudi contractor.",
  heroCTA: "Try Masar Free", heroSecondary: "See Features",
  heroProof: "Saudi contractors already using Masar",
  painLabel: "The Problem", painTitle: "Every contractor struggles with the same things",
  pain1: "Information scattered between WhatsApp, Excel, and email — everyone has a different version",
  pain2: "Site supervisor can't easily access the information they need",
  pain3: "Expenses get lost and invoices are delayed — you don't know exactly where your money went",
  pain4: "Foreign software is complex and doesn't understand how we work",
  pain5: "Owner reports take time and effort — starting from scratch every time",
  pain6: "Tracking actual progress vs. planned is nearly impossible without a system",
  painSolution: "Masar solves all of this — in one place ✨",
  featLabel: "Features", featTitle: "Everything you need, nothing you don't",
  featSub: "Tools designed for Saudi contractor workflows",
  feat1Title: "Smart Dashboard", feat1Desc: "See all your projects at a glance — budget, progress, timeline, all in front of you.",
  feat2Title: "Field Execution", feat2Desc: "Daily reports, photos, issues, progress updates — all directly from site.",
  feat3Title: "Finance & Invoicing", feat3Desc: "Expenses, claims, payments, invoices — all connected automatically.",
  feat4Title: "Contractors & Contracts", feat4Desc: "Subcontracts, change orders, payment terms — organized and tracked.",
  feat5Title: "Owner Portal", feat5Desc: "The owner sees project updates without you needing to send reports.",
  feat6Title: "Smart Permissions", feat6Desc: "Everyone sees only what's relevant — manager, engineer, accountant, supervisor.",
  statsEndpoints: "System Operations", statsModels: "Data Models",
  statsPages: "Integrated Pages", statsArabic: "Full Arabic Support",
  howLabel: "How it Works", howTitle: "Three steps to start",
  step1Title: "Sign up & create your company", step1Desc: "Free account in a minute. Add your company data and employees.",
  step2Title: "Add your projects", step2Desc: "Create projects and assign teams and roles.",
  step3Title: "Start managing", step3Desc: "Track everything from one place — finance, execution, documents.",
  priceLabel: "Pricing", priceTitle: "Simple and clear",
  priceFreeTitle: "Free", priceFreeSub: "Try it yourself", priceFreePrice: "0 SAR",
  priceFreeFeats: ["Full system overview", "Demo project", "All features (read-only)"],
  priceFreeCTA: "Start Free",
  priceProBadge: "Most Popular", priceProTitle: "Professional", priceProSub: "Everything unlimited",
  priceProPrice: "199", priceProPer: " SAR / month",
  priceProFeats: ["Unlimited projects", "All advanced features", "Owner portal", "Invoices & claims", "Priority support", "Continuous updates"],
  priceProCTA: "Subscribe Now",
  zatcaTitle: "ZATCA Compliant",
  zatcaDesc: "Electronic invoices compliant with ZATCA Phase 1 requirements — QR code and approved Arabic format.",
  zatcaBadge: "✓ ZATCA Phase 1",
  faqLabel: "FAQ", faqTitle: "Got questions?",
  faq1Q: "Can I try Masar without paying?",
  faq1A: "Absolutely! The free plan gives you a full system overview with a demo project. You can explore all features before deciding.",
  faq2Q: "Does Masar fully support Arabic?",
  faq2A: "Yes, Masar is built from the ground up with full Arabic support — the interface, invoices, reports, and even Saudi construction terminology.",
  faq3Q: "How many projects can I add?",
  faq3A: "On the Professional plan, you can add unlimited projects with full features for each one.",
  faq4Q: "Are invoices ZATCA compliant?",
  faq4A: "Yes, Masar fully supports ZATCA Phase 1 — QR code and the approved Arabic invoice format.",
  faq5Q: "Can I cancel anytime?",
  faq5A: "Of course, you can cancel your subscription at any time with no commitments or additional fees.",
  ctaTitle: "Ready to organize your work?",
  ctaSub: "Start free today and see the difference yourself. No credit card, no commitment.",
  ctaButton: "Start Free Now",
  ctaNote: "No credit card required • Cancel anytime",
  footer: "© 2026 Masar — All rights reserved",
};
