import React, { useState, useEffect, useRef } from "react";
import { BookOpen, Video, MessageCircle, Send, Plus, Trash2, LogOut, GraduationCap, Wallet, Star, ChevronRight, Check, Image as ImageIcon, Megaphone, X, Upload, HelpCircle, Minus, FileText, Download, Pencil, AlignLeft, AlignCenter, AlignRight, AlignJustify, Bold, Italic } from "lucide-react";
import { db } from "./firebase";
import {
  collection, addDoc, deleteDoc, doc, getDoc, onSnapshot,
  query, orderBy, getDocs, setDoc, serverTimestamp
} from "firebase/firestore";

const TEACHER_NAME = "Wagner Doriley";
const TEACHER_CODE = "LEKOL2026";
const GOLD = "#B8923F";
const GOLD_LIGHT = "#C9A65C";
const INK = "#171310";
const CATEGORIES = ["Antreprenarya", "Teknoloji", "Lang", "Biznis", "Devlopman Pèsonèl", "Lòt"];
const FONT_SIZE_KEY = "lekolla_font_size";
const FONT_MIN = 16;
const FONT_MAX = 26;
const FONT_STEP = 2;

async function hashSecret(text) {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const MAX_PDF_BYTES = 700 * 1024;

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function parseInline(line, keyRef) {
  const parts = [];
  let remaining = line;
  const regex = /(\*\*([^*]+)\*\*|\*([^*]+)\*)/;
  while (remaining.length > 0) {
    const match = remaining.match(regex);
    if (!match) {
      parts.push(remaining);
      break;
    }
    const idx = match.index;
    if (idx > 0) parts.push(remaining.slice(0, idx));
    if (match[2] !== undefined) {
      parts.push(<strong key={keyRef.i++}>{match[2]}</strong>);
    } else if (match[3] !== undefined) {
      parts.push(<em key={keyRef.i++}>{match[3]}</em>);
    }
    remaining = remaining.slice(idx + match[0].length);
  }
  return parts;
}

function renderFormattedText(text) {
  if (!text) return null;
  const keyRef = { i: 0 };
  const lines = text.split("\n");
  return lines.map((line, li) => (
    <React.Fragment key={li}>
      {parseInline(line, keyRef)}
      {li < lines.length - 1 && <br />}
    </React.Fragment>
  ));
}

function studentKey(name) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function BlockFields({ block, index, onText, onAlign, onImage, onRemoveImage, onRemove, canRemove }) {
  const textareaRef = useRef(null);
  const align = block.align || "left";

  function wrap(marker) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const value = block.text || "";
    const before = value.slice(0, start);
    const selected = value.slice(start, end) || (marker === "**" ? "tèks gra" : "tèks italik");
    const after = value.slice(end);
    const newValue = `${before}${marker}${selected}${marker}${after}`;
    onText(newValue);
    requestAnimationFrame(() => {
      el.focus();
      const cursorPos = start + marker.length + selected.length + marker.length;
      el.setSelectionRange(cursorPos, cursorPos);
    });
  }

  const alignOptions = [
    ["left", AlignLeft, "Aliyen agoch"],
    ["center", AlignCenter, "Santre"],
    ["right", AlignRight, "Aliyen adwat"],
    ["justify", AlignJustify, "Jistifye"],
  ];

  return (
    <div className="border rounded-md p-3" style={{ borderColor: "#E7E1D3" }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs" style={{ color: "#a39c8c" }}>Blòk {index + 1}</span>
        {canRemove && (
          <button type="button" onClick={onRemove} className="text-red-500"><X size={14} /></button>
        )}
      </div>

      {block.imageData ? (
        <div className="relative mb-2">
          <img src={block.imageData} alt="" className="w-full rounded-md max-h-48 object-cover" />
          <button type="button" onClick={onRemoveImage} className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1"><X size={12} /></button>
        </div>
      ) : (
        <label className="flex items-center justify-center gap-2 border border-dashed rounded-md py-3 mb-2 text-xs cursor-pointer" style={{ borderColor: "#E7E1D3", color: "#8a8272" }}>
          <ImageIcon size={14} /> Ajoute yon imaj (opsyonèl)
          <input type="file" accept="image/*" className="hidden" onChange={(e) => onImage(e.target.files?.[0])} />
        </label>
      )}

      <div className="flex items-center gap-1 mb-1.5 flex-wrap">
        {alignOptions.map(([val, Icon, label]) => (
          <button
            key={val}
            type="button"
            onClick={() => onAlign(val)}
            title={label}
            className="p-1.5 rounded border"
            style={{ borderColor: align === val ? INK : "#E7E1D3", background: align === val ? INK : "transparent", color: align === val ? "#fff" : INK }}
          >
            <Icon size={12} />
          </button>
        ))}
        <span className="w-px h-4 mx-0.5" style={{ background: "#E7E1D3" }} />
        <button type="button" onClick={() => wrap("**")} title="Gra" className="p-1.5 rounded border" style={{ borderColor: "#E7E1D3", color: INK }}>
          <Bold size={12} />
        </button>
        <button type="button" onClick={() => wrap("*")} title="Italik" className="p-1.5 rounded border" style={{ borderColor: "#E7E1D3", color: INK }}>
          <Italic size={12} />
        </button>
      </div>

      <textarea
        ref={textareaRef}
        value={block.text}
        onChange={(e) => onText(e.target.value)}
        rows={3}
        placeholder="Ekri tèks la anba imaj la..."
        className="w-full px-3 py-2 rounded-md border text-sm"
        style={{ borderColor: "#E7E1D3", textAlign: align }}
      />
      <p className="text-[10px] mt-1" style={{ color: "#a39c8c" }}>Seleksyone yon mòso tèks epi klike gra/italik pou fòmate l.</p>
    </div>
  );
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function compressImageToDataUrl(file, maxWidth = 900, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round(height * (maxWidth / width));
          width = maxWidth;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function LogoMark({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <path d="M28 14 L28 78 L70 78 L70 70 L38 70 L38 14 Z" fill={INK} />
      <path d="M62 30 C 68 30 73 35 73 42 L73 70 L65 70 L65 44 C65 40 63.5 38 60 38 C56.5 38 55 40 55 44 L55 70 L47 70 L47 42 C47 35 52 30 58 30 Z" fill={INK} />
      <rect x="56" y="46" width="4" height="18" fill="#FBFAF6" />
      <path d="M42 66 C 48 63 52 63 56 66 C 60 63 68 63 74 66 L74 71 C 68 68 60 68 56 71 C 52 68 48 68 42 71 Z" fill={INK} />
      <path d="M78 28 L82 28 L82 70 L96 70 L96 78 L78 78 Z" fill={GOLD} />
      <path d="M62 12 L64.2 17.4 L69.6 19.6 L64.2 21.8 L62 27.2 L59.8 21.8 L54.4 19.6 L59.8 17.4 Z" fill={GOLD_LIGHT} />
    </svg>
  );
}

function Divider() {
  return (
    <div className="flex items-center justify-center gap-3 my-2">
      <span className="h-px w-10" style={{ background: GOLD_LIGHT }} />
      <Star size={10} fill={GOLD_LIGHT} color={GOLD_LIGHT} />
      <span className="h-px w-10" style={{ background: GOLD_LIGHT }} />
    </div>
  );
}

function TextSizeControl({ fontSize, setFontSize }) {
  return (
    <div className="flex items-center gap-2 border rounded-md" style={{ borderColor: "#E7E1D3" }}>
      <button
        type="button"
        onClick={() => setFontSize((s) => Math.max(FONT_MIN, s - FONT_STEP))}
        className="px-2.5 py-1.5 text-xs font-semibold"
        aria-label="Diminye tay tèks la"
        title="Diminye tay tèks la"
      >
        A<Minus size={9} className="inline" />
      </button>
      <span className="w-px h-4" style={{ background: "#E7E1D3" }} />
      <button
        type="button"
        onClick={() => setFontSize((s) => Math.min(FONT_MAX, s + FONT_STEP))}
        className="px-2.5 py-1.5 text-sm font-semibold"
        aria-label="Ogmante tay tèks la"
        title="Ogmante tay tèks la"
      >
        A<Plus size={10} className="inline" />
      </button>
    </div>
  );
}

export default function LekolLa() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("kou");
  const [courses, setCourses] = useState([]);
  const [activeCourse, setActiveCourse] = useState(null);
  const [paymentDoc, setPaymentDoc] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(true);

  const [role, setRole] = useState("elev");
  const [nameInput, setNameInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [fontSize, setFontSize] = useState(16);

  // Load saved text-size preference, and keep it applied to the whole app
  useEffect(() => {
    const saved = parseInt(localStorage.getItem(FONT_SIZE_KEY), 10);
    if (saved && saved >= FONT_MIN && saved <= FONT_MAX) setFontSize(saved);
  }, []);

  useEffect(() => {
    document.documentElement.style.fontSize = fontSize + "px";
    localStorage.setItem(FONT_SIZE_KEY, String(fontSize));
  }, [fontSize]);

  // Live sync courses from Firestore
  useEffect(() => {
    const q = query(collection(db, "courses"), orderBy("date", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setCourses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // Live sync this student's payment status (teacher always has access)
  useEffect(() => {
    if (!user || user.role === "pwofesè") { setPaymentLoading(false); return; }
    setPaymentLoading(true);
    const ref = doc(db, "payments", user.name);
    const unsub = onSnapshot(ref, (snap) => {
      setPaymentDoc(snap.exists() ? snap.data() : null);
      setPaymentLoading(false);
    });
    return () => unsub();
  }, [user]);

  const hasCourseAccess = !user ? false : user.role === "pwofesè" || paymentDoc?.paid === true;

  async function handleLogin(e) {
    e.preventDefault();
    setLoginError("");
    const name = nameInput.trim();
    if (!name) {
      setLoginError("Tanpri ekri non ou.");
      return;
    }

    if (role === "pwofesè") {
      if (name !== TEACHER_NAME) {
        setLoginError("Non oswa kòd aksè pwofesè a pa bon.");
        return;
      }
      setLoginLoading(true);
      try {
        const ref = doc(db, "settings", "teacher");
        const snap = await getDoc(ref);
        const hash = await hashSecret(codeInput);

        if (snap.exists()) {
          if (snap.data().passwordHash !== hash) {
            setLoginError("Kòd aksè pa bon.");
            setLoginLoading(false);
            return;
          }
        } else {
          if (codeInput.trim() !== TEACHER_CODE) {
            setLoginError("Kòd aksè pa bon.");
            setLoginLoading(false);
            return;
          }
          await setDoc(ref, { passwordHash: hash });
        }
        setUser({ name: TEACHER_NAME, role: "pwofesè" });
        setTab("admin");
      } catch (err) {
        setLoginError("Gen yon pwoblèm koneksyon. Eseye ankò.");
      } finally {
        setLoginLoading(false);
      }
      return;
    }

    const pw = codeInput;
    if (!pw || pw.length < 4) {
      setLoginError("Modpas la dwe gen omwen 4 karaktè.");
      return;
    }

    setLoginLoading(true);
    try {
      const key = studentKey(name);
      const ref = doc(db, "students", key);
      const snap = await getDoc(ref);
      const hash = await hashSecret(pw);

      if (snap.exists()) {
        if (snap.data().passwordHash !== hash) {
          setLoginError("Modpas la pa bon pou non sa a.");
          setLoginLoading(false);
          return;
        }
        setUser({ name: snap.data().displayName, role: "elev" });
      } else {
        await setDoc(ref, { displayName: name, passwordHash: hash, createdAt: Date.now() });
        setUser({ name, role: "elev" });
      }
      setTab("kou");
    } catch (err) {
      setLoginError("Gen yon pwoblèm koneksyon. Eseye ankò.");
    } finally {
      setLoginLoading(false);
    }
  }

  function logout() {
    setUser(null);
    setNameInput("");
    setCodeInput("");
    setActiveCourse(null);
    setTab("kou");
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "#FBFAF6" }}>
        <div className="mb-4"><TextSizeControl fontSize={fontSize} setFontSize={setFontSize} /></div>
        <LogoMark size={72} />
        <h1 className="mt-4 text-3xl tracking-wide" style={{ fontFamily: "Georgia, serif", color: INK, letterSpacing: "0.04em" }}>
          LEKÒL LA
        </h1>
        <Divider />
        <div className="max-w-sm text-center mb-2">
          <p className="text-sm leading-relaxed" style={{ color: "#5a5346" }}>
            Byenveni nan LEKÒL LA. Se pi bon mwayen pou fòme tèt ou pandan w lakay ou, ak telefòn oubyen laptòp ou.
          </p>
          <p className="text-xs mt-2" style={{ color: GOLD }}>Pwofesè Wagner Doriley</p>
        </div>
        <form onSubmit={handleLogin} className="mt-6 w-full max-w-sm border rounded-lg p-6" style={{ borderColor: "#E7E1D3", background: "#fff" }}>
          <div className="flex rounded-md overflow-hidden border mb-5" style={{ borderColor: "#E7E1D3" }}>
            <button type="button" onClick={() => setRole("elev")} className="flex-1 py-2 text-sm font-medium transition"
              style={{ background: role === "elev" ? INK : "transparent", color: role === "elev" ? "#fff" : INK }}>
              Elèv
            </button>
            <button type="button" onClick={() => setRole("pwofesè")} className="flex-1 py-2 text-sm font-medium transition"
              style={{ background: role === "pwofesè" ? INK : "transparent", color: role === "pwofesè" ? "#fff" : INK }}>
              Pwofesè
            </button>
          </div>

          <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: "#8a8272" }}>Non w</label>
          <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="Ekri non ou"
            className="w-full mb-4 px-3 py-2 rounded-md border outline-none text-sm" style={{ borderColor: "#E7E1D3" }} />

          <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: "#8a8272" }}>
            {role === "pwofesè" ? "Kòd aksè" : "Modpas"}
          </label>
          <input value={codeInput} onChange={(e) => setCodeInput(e.target.value)} type="password"
            placeholder={role === "pwofesè" ? "Kòd sekrè pwofesè a" : "Kreye oswa antre modpas ou"}
            className="w-full mb-1 px-3 py-2 rounded-md border outline-none text-sm" style={{ borderColor: "#E7E1D3" }} />
          {role === "elev" ? (
            <p className="text-xs mb-4" style={{ color: "#a39c8c" }}>
              Premye fwa? Modpas sa a ap vin modpas ou pou tout tan. Toujou itilize menm non ak menm modpas la apre.
            </p>
          ) : (
            <div className="mb-4" />
          )}

          {loginError && <p className="text-xs text-red-600 mb-3">{loginError}</p>}

          <button type="submit" disabled={loginLoading} className="w-full py-2.5 rounded-md text-sm font-medium text-white flex items-center justify-center gap-2" style={{ background: INK, opacity: loginLoading ? 0.7 : 1 }}>
            {loginLoading ? "K'ap verifye..." : "Antre"} {!loginLoading && <ChevronRight size={16} />}
          </button>
        </form>
        <p className="mt-6 text-xs" style={{ color: "#a39c8c" }}>Yon plas pou aprann, pataje &amp; grandi ansanm.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "#FBFAF6", color: INK }}>
      <header className="border-b sticky top-0 z-20" style={{ borderColor: "#E7E1D3", background: "rgba(251,250,246,0.92)", backdropFilter: "blur(6px)" }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LogoMark size={34} />
            <span className="font-semibold tracking-wide" style={{ fontFamily: "Georgia, serif" }}>LEKÒL LA</span>
          </div>
          <nav className="flex items-center gap-1 text-sm">
            <NavBtn active={tab === "kou"} onClick={() => setTab("kou")} icon={<BookOpen size={15} />} label="Kou yo" />
            <NavBtn active={tab === "anons"} onClick={() => setTab("anons")} icon={<Megaphone size={15} />} label="Anons" />
            <NavBtn active={tab === "mesaj"} onClick={() => setTab("mesaj")} icon={<MessageCircle size={15} />} label="Mesaj" />
            <NavBtn active={tab === "peman"} onClick={() => setTab("peman")} icon={<Wallet size={15} />} label="Peman" />
            {user.role === "pwofesè" && (
              <NavBtn active={tab === "admin"} onClick={() => setTab("admin")} icon={<GraduationCap size={15} />} label="Jesyon" />
            )}
          </nav>
          <div className="flex items-center gap-3">
            <TextSizeControl fontSize={fontSize} setFontSize={setFontSize} />
            <span className="text-xs hidden sm:block" style={{ color: "#8a8272" }}>{user.name} · {user.role === "pwofesè" ? "Pwofesè" : "Elèv"}</span>
            <button onClick={logout} className="p-2 rounded-md hover:bg-black/5" title="Dekonekte">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {tab === "kou" && !activeCourse && (
          paymentLoading ? (
            <p className="text-sm" style={{ color: "#8a8272" }}>K'ap chaje...</p>
          ) : hasCourseAccess ? (
            <CourseGrid courses={courses} onOpen={setActiveCourse} />
          ) : (
            <PaywallNotice onGoToPayment={() => setTab("peman")} paymentDoc={paymentDoc} />
          )
        )}
        {tab === "kou" && activeCourse && hasCourseAccess && <CourseDetail course={activeCourse} onBack={() => setActiveCourse(null)} user={user} />}
        {tab === "anons" && <AnnouncementsPanel />}
        {tab === "mesaj" && <MessagesPanel user={user} />}
        {tab === "peman" && <PaymentPanel user={user} paymentDoc={paymentDoc} />}
        {tab === "admin" && user.role === "pwofesè" && <AdminPanel />}
      </main>

      <footer className="text-center text-xs py-6" style={{ color: "#a39c8c" }}>
        <Divider />
        © {new Date().getFullYear()} Lekòl La — tout kou yo dirije pa {TEACHER_NAME}
      </footer>
    </div>
  );
}

function NavBtn({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md transition"
      style={{ background: active ? INK : "transparent", color: active ? "#fff" : INK }}>
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function PaywallNotice({ onGoToPayment, paymentDoc }) {
  const pending = paymentDoc && paymentDoc.paid === false;
  return (
    <div className="text-center py-20 max-w-md mx-auto">
      <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "#F1E9D4" }}>
        <Wallet size={22} style={{ color: GOLD }} />
      </div>
      <h2 className="text-lg mb-2" style={{ fontFamily: "Georgia, serif" }}>
        {pending ? "N ap tann konfimasyon peman" : "Kou yo mande yon peman"}
      </h2>
      <p className="text-sm mb-6" style={{ color: "#8a8272" }}>
        {pending
          ? "Nou resevwa demand peman ou. Pwofesè a ap konfime resepsyon frè Dokiman ak Sètifika a talè."
          : "Pa gen frè enskripsyon. Pou jwenn aksè ak tout kou yo, ou dwe peye frè Dokiman ak Sètifika a: 1500 Goud."}
      </p>
      {!pending && (
        <button onClick={onGoToPayment} className="px-5 py-2.5 rounded-md text-sm font-medium text-white" style={{ background: INK }}>
          Ale nan Peman
        </button>
      )}
    </div>
  );
}

function AnnouncementsPanel() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setAnnouncements(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <div>
      <h2 className="text-xl mb-1" style={{ fontFamily: "Georgia, serif" }}>Anons</h2>
      <p className="text-sm mb-6" style={{ color: "#8a8272" }}>Nouvèl kou k ap vini ak lòt anons Lekòl La.</p>

      {loading && <p className="text-sm" style={{ color: "#8a8272" }}>K'ap chaje...</p>}
      {!loading && announcements.length === 0 && (
        <div className="text-center py-20">
          <Megaphone size={28} className="mx-auto mb-3" style={{ color: GOLD_LIGHT }} />
          <p className="text-sm" style={{ color: "#8a8272" }}>Pa gen anons pou kounye a.</p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {announcements.map((a) => (
          <div key={a.id} className="border rounded-lg overflow-hidden bg-white" style={{ borderColor: "#E7E1D3" }}>
            {a.imageData && (
              <img src={a.imageData} alt={a.title} className="w-full h-44 object-cover" />
            )}
            <div className="p-4">
              <h3 className="font-medium mb-1">{a.title}</h3>
              {a.eventDate && (
                <p className="text-xs mb-2" style={{ color: GOLD }}>{a.eventDate}</p>
              )}
              <p className="text-sm whitespace-pre-wrap" style={{ color: "#8a8272" }}>{a.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CourseGrid({ courses, onOpen }) {
  const [activeCategory, setActiveCategory] = useState("Tout");

  if (courses.length === 0) {
    return (
      <div className="text-center py-24">
        <BookOpen size={32} className="mx-auto mb-3" style={{ color: GOLD_LIGHT }} />
        <p style={{ color: "#8a8272" }}>Poko gen okenn kou pibliye. Tounen wè pita!</p>
      </div>
    );
  }

  const presentCategories = Array.from(new Set(courses.map((c) => c.category).filter(Boolean)));
  const filtered = activeCategory === "Tout" ? courses : courses.filter((c) => c.category === activeCategory);

  return (
    <div>
      <h2 className="text-xl mb-1" style={{ fontFamily: "Georgia, serif" }}>Kou yo</h2>
      <p className="text-sm mb-4" style={{ color: "#8a8272" }}>Chwazi yon kou pou kòmanse aprann.</p>

      {presentCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveCategory("Tout")}
            className="text-xs px-3 py-1.5 rounded-full border transition"
            style={{
              borderColor: activeCategory === "Tout" ? INK : "#E7E1D3",
              background: activeCategory === "Tout" ? INK : "transparent",
              color: activeCategory === "Tout" ? "#fff" : INK,
            }}
          >
            Tout
          </button>
          {presentCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="text-xs px-3 py-1.5 rounded-full border transition"
              style={{
                borderColor: activeCategory === cat ? INK : "#E7E1D3",
                background: activeCategory === cat ? INK : "transparent",
                color: activeCategory === cat ? "#fff" : INK,
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm" style={{ color: "#8a8272" }}>Pa gen kou nan kategori sa a pou kounye a.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <button key={c.id} onClick={() => onOpen(c)} className="text-left border rounded-lg p-4 hover:shadow-md transition bg-white" style={{ borderColor: "#E7E1D3" }}>
              <div className="flex items-center justify-between mb-3 gap-2">
                <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full flex items-center gap-1"
                  style={{ background: c.type === "videyo" ? "#F1E9D4" : "#EFEEE9", color: INK }}>
                  {c.type === "videyo" ? <Video size={11} /> : <BookOpen size={11} />}
                  {c.type === "videyo" ? "Videyo" : "Tèks"}
                </span>
                {c.category && (
                  <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full" style={{ background: "#FBFAF6", border: `1px solid ${GOLD_LIGHT}`, color: GOLD }}>
                    {c.category}
                  </span>
                )}
              </div>
              <h3 className="font-medium mb-1">{c.title}</h3>
              <p className="text-sm line-clamp-2" style={{ color: "#8a8272" }}>{c.description}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CourseDetail({ course, onBack, user }) {
  return (
    <div>
      <button onClick={onBack} className="text-sm mb-4 flex items-center gap-1" style={{ color: GOLD }}>← Tounen nan kou yo</button>
      <h2 className="text-2xl mb-2" style={{ fontFamily: "Georgia, serif" }}>{course.title}</h2>
      {course.category && (
        <span className="inline-block text-[10px] uppercase tracking-wider px-2 py-1 rounded-full mb-3" style={{ background: "#FBFAF6", border: `1px solid ${GOLD_LIGHT}`, color: GOLD }}>
          {course.category}
        </span>
      )}
      <p className="text-sm mb-6" style={{ color: "#8a8272" }}>{course.description}</p>
      {course.type === "videyo" ? (
        course.videoUrl ? (
          <div className="aspect-video w-full rounded-lg overflow-hidden border" style={{ borderColor: "#E7E1D3" }}>
            <iframe src={course.videoUrl} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={course.title} />
          </div>
        ) : <p className="text-sm" style={{ color: "#8a8272" }}>Pa gen videyo mete pou kou sa a ankò.</p>
      ) : (
        <div className="bg-white border rounded-lg p-6 space-y-5" style={{ borderColor: "#E7E1D3" }}>
          {Array.isArray(course.blocks) && course.blocks.length > 0 ? (
            course.blocks.map((b, i) => (
              <div key={b.id || i}>
                {b.imageData && (
                  <img src={b.imageData} alt="" className="w-full rounded-md mb-2 object-cover" />
                )}
                {b.text && <p className="text-sm leading-relaxed" style={{ textAlign: b.align || "left" }}>{renderFormattedText(b.text)}</p>}
              </div>
            ))
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{course.content}</p>
          )}
        </div>
      )}
      {Array.isArray(course.documents) && course.documents.length > 0 && (
        <div className="mt-6 border rounded-lg p-4 bg-white" style={{ borderColor: "#E7E1D3" }}>
          <h3 className="text-sm font-medium mb-2 flex items-center gap-1"><FileText size={14} style={{ color: GOLD }} /> Dokiman kou a</h3>
          <div className="space-y-2">
            {course.documents.map((d) => (
              <a key={d.id} href={d.dataUrl} download={d.name} className="flex items-center justify-between px-3 py-2 rounded-md border text-sm" style={{ borderColor: "#E7E1D3" }}>
                <span className="truncate">{d.name}</span>
                <Download size={14} style={{ color: GOLD }} />
              </a>
            ))}
          </div>
        </div>
      )}
      {user && user.role === "elev" && <QuizPanel course={course} user={user} />}
    </div>
  );
}

function QuizPanel({ course, user }) {
  const [phase, setPhase] = useState("intro");
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(120);
  const [score, setScore] = useState(0);
  const [saving, setSaving] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (phase !== "active") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          finishQuiz();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  if (!course.quiz || course.quiz.length === 0) return null;

  function startQuiz() {
    setAnswers({});
    setTimeLeft(120);
    setPhase("active");
  }

  function selectAnswer(qId, idx) {
    setAnswers((prev) => ({ ...prev, [qId]: idx }));
  }

  async function finishQuiz() {
    clearInterval(timerRef.current);
    let correctCount = 0;
    course.quiz.forEach((q) => {
      if (answers[q.id] === q.correctIndex) correctCount++;
    });
    setScore(correctCount);
    setPhase("result");
    setSaving(true);
    try {
      await addDoc(collection(db, "quizResults"), {
        courseId: course.id,
        courseTitle: course.title,
        studentName: user.name,
        score: correctCount,
        total: course.quiz.length,
        submittedAt: Date.now(),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-8 border-t pt-6" style={{ borderColor: "#E7E1D3" }}>
      {phase === "intro" && (
        <div className="text-center py-6">
          <HelpCircle size={26} className="mx-auto mb-3" style={{ color: GOLD }} />
          <h3 className="font-medium mb-2">Evalyasyon</h3>
          <p className="text-sm mb-4" style={{ color: "#8a8272" }}>
            {course.quiz.length} kesyon — ou gen 120 segond pou reponn tout kesyon yo. Lè tan an fini, evalyasyon an kanpe otomatikman.
          </p>
          <button onClick={startQuiz} className="px-5 py-2.5 rounded-md text-sm font-medium text-white" style={{ background: INK }}>
            Kòmanse evalyasyon an
          </button>
        </div>
      )}

      {phase === "active" && (
        <div>
          <div className="flex items-center justify-between mb-4 px-3 py-2 rounded-md border" style={{ borderColor: "#E7E1D3" }}>
            <span className="text-sm font-medium">Tan ki rete:</span>
            <span className="text-lg font-bold" style={{ color: timeLeft <= 20 ? "#C0392B" : INK }}>
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
            </span>
          </div>
          <div className="space-y-5">
            {course.quiz.map((q, i) => (
              <div key={q.id}>
                <p className="text-sm font-medium mb-2">{i + 1}. {q.question}</p>
                <div className="space-y-2">
                  {q.options.map((op, oi) => (
                    <button
                      key={oi}
                      type="button"
                      onClick={() => selectAnswer(q.id, oi)}
                      className="w-full text-left px-3 py-2 rounded-md border text-sm"
                      style={{
                        borderColor: answers[q.id] === oi ? INK : "#E7E1D3",
                        background: answers[q.id] === oi ? "#F1E9D4" : "#fff",
                      }}
                    >
                      {op}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button onClick={finishQuiz} className="mt-6 w-full py-2.5 rounded-md text-sm font-medium text-white" style={{ background: GOLD }}>
            Fini evalyasyon an
          </button>
        </div>
      )}

      {phase === "result" && (
        <div className="text-center py-6">
          <div className="text-3xl font-bold mb-2" style={{ fontFamily: "Georgia, serif" }}>{score} / {course.quiz.length}</div>
          <p className="text-sm" style={{ color: "#8a8272" }}>
            {saving ? "K'ap anrejistre rezilta a..." : "Rezilta ou anrejistre. Pwofesè a ka wè l."}
          </p>
        </div>
      )}
    </div>
  );
}

function MessagesPanel({ user }) {
  const isTeacher = user.role === "pwofesè";
  const [conversations, setConversations] = useState([]);
  const [activeStudent, setActiveStudent] = useState(isTeacher ? null : user.name);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!isTeacher) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, "conversations"));
        setConversations(snap.docs.map((d) => d.id));
      } catch (e) {
        setConversations([]);
      }
      setLoading(false);
    })();
  }, [isTeacher]);

  useEffect(() => {
    if (!activeStudent) return;
    const q = query(collection(db, "conversations", activeStudent, "messages"), orderBy("time", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => d.data()));
    });
    return () => unsub();
  }, [activeStudent]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!text.trim() || !activeStudent) return;
    const msg = { from: user.name, role: user.role, text: text.trim(), time: Date.now() };
    setText("");
    await setDoc(doc(db, "conversations", activeStudent), { studentName: activeStudent, updatedAt: serverTimestamp() }, { merge: true });
    await addDoc(collection(db, "conversations", activeStudent, "messages"), msg);
    if (isTeacher && !conversations.includes(activeStudent)) {
      setConversations((prev) => [...prev, activeStudent]);
    }
  }

  return (
    <div>
      <h2 className="text-xl mb-1" style={{ fontFamily: "Georgia, serif" }}>Mesaj</h2>
      <p className="text-sm mb-6" style={{ color: "#8a8272" }}>
        {isTeacher ? "Bwat mesaj prive avèk chak elèv." : `Ekri pwofesè ${TEACHER_NAME} an privé.`}
      </p>
      <div className="grid sm:grid-cols-[220px_1fr] gap-4 border rounded-lg overflow-hidden bg-white" style={{ borderColor: "#E7E1D3", minHeight: 420 }}>
        {isTeacher && (
          <div className="border-r" style={{ borderColor: "#E7E1D3" }}>
            <div className="px-3 py-2 text-xs uppercase tracking-wider" style={{ color: "#8a8272" }}>Elèv</div>
            {loading && <div className="px-3 text-sm" style={{ color: "#8a8272" }}>K'ap chaje...</div>}
            {!loading && conversations.length === 0 && <div className="px-3 text-sm" style={{ color: "#8a8272" }}>Pa gen mesaj ankò.</div>}
            {conversations.map((s) => (
              <button key={s} onClick={() => setActiveStudent(s)} className="w-full text-left px-3 py-2 text-sm hover:bg-black/5"
                style={{ background: activeStudent === s ? "#F1E9D4" : "transparent" }}>
                {s}
              </button>
            ))}
          </div>
        )}
        <div className="flex flex-col">
          {!activeStudent ? (
            <div className="flex-1 flex items-center justify-center text-sm" style={{ color: "#8a8272" }}>Chwazi yon elèv pou wè konvèsasyon an.</div>
          ) : (
            <>
              <div className="flex-1 px-4 py-3 space-y-3 overflow-y-auto" style={{ maxHeight: 360 }}>
                {messages.length === 0 && <p className="text-sm" style={{ color: "#8a8272" }}>Pa gen mesaj ankò. Voye premye mesaj la!</p>}
                {messages.map((m, i) => {
                  const mine = m.from === user.name;
                  return (
                    <div key={i} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className="max-w-[75%] rounded-lg px-3 py-2 text-sm" style={{ background: mine ? INK : "#F1EFE8", color: mine ? "#fff" : INK }}>
                        <div className="text-[10px] mb-0.5 opacity-70">{m.from}</div>
                        {m.text}
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              <div className="border-t px-3 py-2 flex items-center gap-2" style={{ borderColor: "#E7E1D3" }}>
                <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Ekri mesaj ou..." className="flex-1 px-3 py-2 rounded-md border text-sm outline-none" style={{ borderColor: "#E7E1D3" }} />
                <button onClick={send} className="p-2 rounded-md text-white" style={{ background: GOLD }}><Send size={16} /></button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PaymentPanel({ user, paymentDoc }) {
  const [sending, setSending] = useState(false);
  const [certificates, setCertificates] = useState([]);

  useEffect(() => {
    if (user.role !== "elev") return;
    const unsub = onSnapshot(collection(db, "certificates"), (snap) => {
      const mine = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((c) => c.studentName === user.name);
      mine.sort((a, b) => (b.issuedAt || 0) - (a.issuedAt || 0));
      setCertificates(mine);
    });
    return () => unsub();
  }, [user.name, user.role]);

  async function requestPayment() {
    setSending(true);
    try {
      await setDoc(doc(db, "payments", user.name), {
        studentName: user.name,
        amount: 1500,
        paid: false,
        requestedAt: Date.now(),
        confirmedAt: null,
      });
      await setDoc(doc(db, "conversations", user.name), { studentName: user.name, updatedAt: serverTimestamp() }, { merge: true });
      await addDoc(collection(db, "conversations", user.name, "messages"), {
        from: user.name,
        role: user.role,
        text: "Mwen fèk fè yon peman pou frè Dokiman ak Sètifika a (1500 Goud). Tanpri konfime resepsyon an.",
        time: Date.now(),
      });
    } finally {
      setSending(false);
    }
  }

  const [teacherPayments, setTeacherPayments] = useState([]);
  useEffect(() => {
    if (user.role !== "pwofesè") return;
    const unsub = onSnapshot(collection(db, "payments"), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.requestedAt || 0) - (a.requestedAt || 0));
      setTeacherPayments(list);
    });
    return () => unsub();
  }, [user.role]);

  async function confirmFromWallet(studentName) {
    await setDoc(doc(db, "payments", studentName), { paid: true, confirmedAt: Date.now() }, { merge: true });
    await setDoc(doc(db, "conversations", studentName), { studentName, updatedAt: serverTimestamp() }, { merge: true });
    await addDoc(collection(db, "conversations", studentName, "messages"), {
      from: TEACHER_NAME,
      role: "pwofesè",
      text: "Peman ou konfime. Ou gen aksè ak tout kou yo kounye a.",
      time: Date.now(),
    });
  }

  if (user.role === "pwofesè") {
    const confirmed = teacherPayments.filter((p) => p.paid);
    const pendingList = teacherPayments.filter((p) => !p.paid);
    const totalReceived = confirmed.reduce((sum, p) => sum + (p.amount || 1500), 0);
    return (
      <div className="max-w-lg">
        <h2 className="text-xl mb-1" style={{ fontFamily: "Georgia, serif" }}>Peman</h2>
        <p className="text-sm mb-6" style={{ color: "#8a8272" }}>Swiv frè Dokiman ak Sètifika elèv yo peye.</p>

        <div className="mb-6 border rounded-lg p-4 flex items-center justify-between" style={{ borderColor: "#E7E1D3", background: "#F1E9D4" }}>
          <div>
            <div className="text-xs uppercase tracking-wider" style={{ color: "#8a6d1f" }}>Total kòb resevwa</div>
            <div className="text-2xl font-bold" style={{ fontFamily: "Georgia, serif", color: INK }}>{totalReceived.toLocaleString()} Goud</div>
          </div>
          <div className="text-right">
            <Wallet size={20} style={{ color: GOLD }} className="ml-auto mb-1" />
            <div className="text-xs" style={{ color: "#8a6d1f" }}>{confirmed.length} elèv konfime</div>
          </div>
        </div>

        {pendingList.length > 0 && (
          <>
            <h3 className="text-sm uppercase tracking-wider mb-3" style={{ color: "#8a8272" }}>N ap tann konfimasyon ({pendingList.length})</h3>
            <div className="space-y-2 mb-6">
              {pendingList.map((p) => (
                <div key={p.id} className="flex items-center justify-between border rounded-md px-4 py-3 bg-white" style={{ borderColor: "#E7E1D3" }}>
                  <div className="text-sm font-medium">{p.studentName}</div>
                  <button onClick={() => confirmFromWallet(p.studentName)} className="text-xs px-3 py-1.5 rounded-md text-white" style={{ background: GOLD }}>
                    Konfime peman
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {teacherPayments.length === 0 && (
          <p className="text-sm" style={{ color: "#8a8272" }}>Pa gen demand peman ankò.</p>
        )}
      </div>
    );
  }

  const paid = paymentDoc?.paid === true;
  const pending = paymentDoc && paymentDoc.paid === false;

  return (
    <div className="max-w-lg">
      <h2 className="text-xl mb-1" style={{ fontFamily: "Georgia, serif" }}>Peman</h2>
      <p className="text-sm mb-1" style={{ color: "#8a8272" }}>Pa gen frè enskripsyon.</p>
      <p className="text-sm mb-6" style={{ color: "#8a8272" }}>
        Frè Dokiman ak Sètifika a se <strong style={{ color: INK }}>1500 Goud</strong>, epi li obligatwa pou jwenn aksè ak kou yo.
      </p>

      <div className="space-y-3">
        <PaymentCard name="MonCash" number="509-36087837" />
        <PaymentCard name="NatCash" number="509-56219097" />
      </div>

      <div className="mt-6 border rounded-lg p-4 bg-white text-sm space-y-2" style={{ borderColor: "#E7E1D3" }}>
        <p className="font-medium">Kijan pou peye:</p>
        <ol className="list-decimal list-inside space-y-1" style={{ color: "#5a5346" }}>
          <li>Louvri app MonCash oswa NatCash sou telefòn ou.</li>
          <li>Voye 1500 Goud nan nimewo ki koresponn anwo a.</li>
          <li>Klike bouton "Konfime peman m" anba a pou avize pwofesè a.</li>
        </ol>
      </div>

      <div className="mt-6">
        <h3 className="text-sm uppercase tracking-wider mb-2" style={{ color: "#8a8272" }}>Pou moun ki nan lòt peyi</h3>
        <div className="border rounded-lg p-4 bg-white text-sm space-y-2" style={{ borderColor: "#E7E1D3" }}>
          <p style={{ color: "#5a5346" }}>Ou ka voye lajan pa <strong style={{ color: INK }}>Western Union</strong> oswa <strong style={{ color: INK }}>MoneyGram</strong> bay:</p>
          <div className="pl-1 space-y-1" style={{ color: "#5a5346" }}>
            <p><span style={{ color: "#8a8272" }}>Non benefisyè:</span> <strong style={{ color: INK }}>Wagner Doriley</strong></p>
            <p><span style={{ color: "#8a8272" }}>Telefòn:</span> 509-36087837</p>
            <p><span style={{ color: "#8a8272" }}>Adrès:</span> Delmas 95, Jacquet Toto, ruelle Chrétien, Ayiti</p>
          </div>
          <p className="text-xs pt-1" style={{ color: "#a39c8c" }}>Apre w fin voye, klike "Konfime peman m" anba a pou avize pwofesè a — mansyone nan mesaj ou ke se pa Western Union oswa MoneyGram ou peye.</p>
        </div>
      </div>

      {paid ? (
        <div className="mt-5 flex items-center gap-2 text-sm rounded-md px-3 py-2" style={{ background: "#EAF4EA", color: "#2C5F2D" }}>
          <Check size={16} /> Peman ou konfime. Ou gen aksè ak tout kou yo.
        </div>
      ) : pending ? (
        <div className="mt-5 flex items-center gap-2 text-sm rounded-md px-3 py-2" style={{ background: "#FBF3DC", color: "#8a6d1f" }}>
          N ap tann pwofesè a konfime peman ou.
        </div>
      ) : (
        <button
          onClick={requestPayment}
          disabled={sending}
          className="mt-5 w-full py-2.5 rounded-md text-sm font-medium text-white flex items-center justify-center gap-2"
          style={{ background: INK, opacity: sending ? 0.7 : 1 }}
        >
          {sending ? "K'ap voye..." : "Konfime peman m"}
        </button>
      )}

      {certificates.length > 0 && (
        <div className="mt-8">
          <h3 className="text-sm uppercase tracking-wider mb-3" style={{ color: "#8a8272" }}>Sètifika ou yo</h3>
          <div className="space-y-2">
            {certificates.map((c) => (
              <a key={c.id} href={c.dataUrl} download={c.fileName} className="flex items-center justify-between px-3 py-2.5 rounded-md border text-sm bg-white" style={{ borderColor: "#E7E1D3" }}>
                <span className="flex items-center gap-2"><FileText size={14} style={{ color: GOLD }} /> {c.title}</span>
                <Download size={14} style={{ color: GOLD }} />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PaymentCard({ name, number }) {
  return (
    <div className="border rounded-lg p-4 bg-white flex items-center justify-between" style={{ borderColor: "#E7E1D3" }}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold" style={{ background: GOLD }}>{name[0]}</div>
        <div>
          <div className="font-medium text-sm">{name}</div>
          <div className="text-sm" style={{ color: "#8a8272" }}>{number}</div>
        </div>
      </div>
      <Wallet size={16} style={{ color: GOLD }} />
    </div>
  );
}

function QuizEditor({ course }) {
  const [open, setOpen] = useState(false);
  const [questions, setQuestions] = useState(course.quiz || []);
  const [qText, setQText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correct, setCorrect] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function addQuestion() {
    setError("");
    const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
    if (!qText.trim()) {
      setError("Ekri kesyon an anvan w ajoute l.");
      return;
    }
    if (cleanOptions.length < 2) {
      setError("Ekri omwen 2 repons (pa kite chan yo vid).");
      return;
    }
    setQuestions((prev) => [...prev, { id: uid(), question: qText.trim(), options: cleanOptions, correctIndex: Math.min(correct, cleanOptions.length - 1) }]);
    setQText("");
    setOptions(["", "", "", ""]);
    setCorrect(0);
  }

  function removeQuestion(id) {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  }

  async function saveQuiz() {
    setSaving(true);
    try {
      await setDoc(doc(db, "courses", course.id), { quiz: questions }, { merge: true });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-2 pt-2 border-t" style={{ borderColor: "#EFEAE0" }}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="text-xs flex items-center gap-1" style={{ color: GOLD }}>
        <HelpCircle size={12} /> {open ? "Fèmen Evalyasyon" : `Jesyon Evalyasyon (${(course.quiz || []).length} kesyon)`}
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {questions.map((q, i) => (
            <div key={q.id} className="border rounded-md p-2 text-xs" style={{ borderColor: "#E7E1D3" }}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">{i + 1}. {q.question}</span>
                <button type="button" onClick={() => removeQuestion(q.id)} className="text-red-500"><X size={12} /></button>
              </div>
              <ul className="ml-4 list-disc">
                {q.options.map((op, oi) => (
                  <li key={oi} style={{ color: oi === q.correctIndex ? "#2C5F2D" : "#5a5346", fontWeight: oi === q.correctIndex ? 600 : 400 }}>{op}</li>
                ))}
              </ul>
            </div>
          ))}

          <div className="border rounded-md p-3 space-y-2" style={{ borderColor: "#E7E1D3" }}>
            <input value={qText} onChange={(e) => setQText(e.target.value)} placeholder="Ekri kesyon an"
              className="w-full px-2 py-1.5 rounded border text-xs" style={{ borderColor: "#E7E1D3" }} />
            {options.map((op, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="radio" name={`correct-${course.id}`} checked={correct === i} onChange={() => setCorrect(i)} />
                <input
                  value={op}
                  onChange={(e) => {
                    const next = [...options];
                    next[i] = e.target.value;
                    setOptions(next);
                  }}
                  placeholder={`Repons ${i + 1}`}
                  className="flex-1 px-2 py-1.5 rounded border text-xs"
                  style={{ borderColor: "#E7E1D3" }}
                />
              </div>
            ))}
            <button type="button" onClick={addQuestion} className="text-xs px-3 py-1.5 rounded-md border flex items-center gap-1" style={{ borderColor: "#E7E1D3" }}>
              <Plus size={12} /> Ajoute kesyon
            </button>
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>

          <button type="button" onClick={saveQuiz} disabled={saving} className="w-full py-2 rounded-md text-xs font-medium text-white" style={{ background: GOLD, opacity: saving ? 0.7 : 1 }}>
            {saving ? "K'ap anrejistre..." : "Anrejistre Evalyasyon"}
          </button>
        </div>
      )}
    </div>
  );
}

function DocumentsEditor({ course }) {
  const [open, setOpen] = useState(false);
  const [docs, setDocs] = useState(course.documents || []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file) {
    setError("");
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("Sèlman fichye PDF aksepte.");
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      setError(`Fichye a twò gwo (${Math.round(file.size / 1024)} Ko). Limit la se ${Math.round(MAX_PDF_BYTES / 1024)} Ko — konprese PDF la anvan w eseye ankò.`);
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      setDocs((prev) => [...prev, { id: uid(), name: file.name, dataUrl, size: file.size }]);
    } finally {
      setUploading(false);
    }
  }

  function removeDoc(id) {
    setDocs((prev) => prev.filter((d) => d.id !== id));
  }

  async function saveDocs() {
    setSaving(true);
    try {
      await setDoc(doc(db, "courses", course.id), { documents: docs }, { merge: true });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-2 pt-2 border-t" style={{ borderColor: "#EFEAE0" }}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="text-xs flex items-center gap-1" style={{ color: GOLD }}>
        <FileText size={12} /> {open ? "Fèmen Dokiman" : `Jesyon Dokiman (${(course.documents || []).length})`}
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {docs.map((d) => (
            <div key={d.id} className="flex items-center justify-between border rounded-md px-2 py-1.5 text-xs" style={{ borderColor: "#E7E1D3" }}>
              <span className="truncate">{d.name} ({Math.round(d.size / 1024)} Ko)</span>
              <button type="button" onClick={() => removeDoc(d.id)} className="text-red-500"><X size={12} /></button>
            </div>
          ))}
          <label className="flex items-center justify-center gap-2 border border-dashed rounded-md py-3 text-xs cursor-pointer" style={{ borderColor: "#E7E1D3", color: "#8a8272" }}>
            <Upload size={14} /> {uploading ? "K'ap chaje..." : "Telechaje yon PDF"}
            <input type="file" accept="application/pdf" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
          </label>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button type="button" onClick={saveDocs} disabled={saving} className="w-full py-2 rounded-md text-xs font-medium text-white" style={{ background: GOLD, opacity: saving ? 0.7 : 1 }}>
            {saving ? "K'ap anrejistre..." : "Anrejistre Dokiman"}
          </button>
        </div>
      )}
    </div>
  );
}

function CourseEditor({ course }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description || "");
  const [category, setCategory] = useState(course.category || CATEGORIES[0]);
  const [type, setType] = useState(course.type);
  const [videoUrl, setVideoUrl] = useState(course.videoUrl || "");
  const [blocks, setBlocks] = useState(
    course.blocks && course.blocks.length ? course.blocks : [{ id: uid(), text: course.content || "", imageData: null, align: "left" }]
  );
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  function addBlock() {
    setBlocks((prev) => [...prev, { id: uid(), text: "", imageData: null, align: "left" }]);
  }
  function removeBlock(id) {
    setBlocks((prev) => (prev.length > 1 ? prev.filter((b) => b.id !== id) : prev));
  }
  function updateBlockText(id, text) {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, text } : b)));
  }
  function updateBlockAlign(id, align) {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, align } : b)));
  }
  async function updateBlockImage(id, file) {
    if (!file) return;
    const dataUrl = await compressImageToDataUrl(file);
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, imageData: dataUrl } : b)));
  }
  function removeBlockImage(id) {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, imageData: null } : b)));
  }

  async function saveChanges(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setSavedMsg("");
    try {
      await setDoc(doc(db, "courses", course.id), {
        title: title.trim(),
        description: description.trim(),
        category,
        type,
        blocks: type === "tèks" ? blocks.filter((b) => b.text.trim() || b.imageData) : [],
        videoUrl: type === "videyo" ? videoUrl.trim() : "",
      }, { merge: true });
      setSavedMsg("Chanjman anrejistre!");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-2 pt-2 border-t" style={{ borderColor: "#EFEAE0" }}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="text-xs flex items-center gap-1" style={{ color: GOLD }}>
        <Pencil size={12} /> {open ? "Fèmen Modifikasyon" : "Modifye kou a"}
      </button>

      {open && (
        <form onSubmit={saveChanges} className="mt-3 space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tit kou a"
            className="w-full px-2 py-1.5 rounded border text-xs" style={{ borderColor: "#E7E1D3" }} required />
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Deskripsyon kout"
            className="w-full px-2 py-1.5 rounded border text-xs" style={{ borderColor: "#E7E1D3" }} />
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            className="w-full px-2 py-1.5 rounded border text-xs bg-white" style={{ borderColor: "#E7E1D3" }}>
            {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </select>

          <div className="flex gap-2">
            <button type="button" onClick={() => setType("tèks")} className="flex-1 py-1.5 rounded-md border text-xs flex items-center justify-center gap-1"
              style={{ borderColor: "#E7E1D3", background: type === "tèks" ? INK : "transparent", color: type === "tèks" ? "#fff" : INK }}>
              <BookOpen size={12} /> Tèks
            </button>
            <button type="button" onClick={() => setType("videyo")} className="flex-1 py-1.5 rounded-md border text-xs flex items-center justify-center gap-1"
              style={{ borderColor: "#E7E1D3", background: type === "videyo" ? INK : "transparent", color: type === "videyo" ? "#fff" : INK }}>
              <Video size={12} /> Videyo
            </button>
          </div>

          {type === "tèks" ? (
            <div className="space-y-2">
              {blocks.map((b, i) => (
                <BlockFields
                  key={b.id}
                  block={b}
                  index={i}
                  onText={(t) => updateBlockText(b.id, t)}
                  onAlign={(a) => updateBlockAlign(b.id, a)}
                  onImage={(f) => updateBlockImage(b.id, f)}
                  onRemoveImage={() => removeBlockImage(b.id)}
                  onRemove={() => removeBlock(b.id)}
                  canRemove={blocks.length > 1}
                />
              ))}
              <button type="button" onClick={addBlock} className="text-xs px-3 py-1.5 rounded-md border flex items-center gap-1" style={{ borderColor: "#E7E1D3" }}>
                <Plus size={12} /> Ajoute yon lòt blòk
              </button>
            </div>
          ) : (
            <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="Lyen videyo (embed URL)"
              className="w-full px-2 py-1.5 rounded border text-xs" style={{ borderColor: "#E7E1D3" }} />
          )}

          <button type="submit" disabled={saving} className="w-full py-2 rounded-md text-xs font-medium text-white" style={{ background: GOLD, opacity: saving ? 0.7 : 1 }}>
            {saving ? "K'ap anrejistre..." : "Anrejistre chanjman"}
          </button>
          {savedMsg && <p className="text-xs text-center" style={{ color: "#2C5F2D" }}>{savedMsg}</p>}
        </form>
      )}
    </div>
  );
}

function AnnouncementEditor({ a }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(a.title);
  const [description, setDescription] = useState(a.description || "");
  const [eventDate, setEventDate] = useState(a.eventDate || "");
  const [imageData, setImageData] = useState(a.imageData || null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  async function handleImage(file) {
    if (!file) return;
    const dataUrl = await compressImageToDataUrl(file, 1000, 0.75);
    setImageData(dataUrl);
  }

  async function saveChanges(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setSavedMsg("");
    try {
      await setDoc(doc(db, "announcements", a.id), {
        title: title.trim(),
        description: description.trim(),
        eventDate: eventDate.trim(),
        imageData,
      }, { merge: true });
      setSavedMsg("Chanjman anrejistre!");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-2 pt-2 border-t" style={{ borderColor: "#EFEAE0" }}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="text-xs flex items-center gap-1" style={{ color: GOLD }}>
        <Pencil size={12} /> {open ? "Fèmen Modifikasyon" : "Modifye anons lan"}
      </button>

      {open && (
        <form onSubmit={saveChanges} className="mt-3 space-y-2">
          {imageData ? (
            <div className="relative">
              <img src={imageData} alt="" className="w-full rounded-md max-h-40 object-cover" />
              <button type="button" onClick={() => setImageData(null)} className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1"><X size={12} /></button>
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2 border border-dashed rounded-md py-3 text-xs cursor-pointer" style={{ borderColor: "#E7E1D3", color: "#8a8272" }}>
              <Upload size={14} /> Ajoute yon imaj
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImage(e.target.files?.[0])} />
            </label>
          )}
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tit anons lan"
            className="w-full px-2 py-1.5 rounded border text-xs" style={{ borderColor: "#E7E1D3" }} required />
          <input value={eventDate} onChange={(e) => setEventDate(e.target.value)} placeholder="Dat (opsyonèl)"
            className="w-full px-2 py-1.5 rounded border text-xs" style={{ borderColor: "#E7E1D3" }} />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Deskripsyon"
            className="w-full px-2 py-1.5 rounded border text-xs" style={{ borderColor: "#E7E1D3" }} />
          <button type="submit" disabled={saving} className="w-full py-2 rounded-md text-xs font-medium text-white" style={{ background: GOLD, opacity: saving ? 0.7 : 1 }}>
            {saving ? "K'ap anrejistre..." : "Anrejistre chanjman"}
          </button>
          {savedMsg && <p className="text-xs text-center" style={{ color: "#2C5F2D" }}>{savedMsg}</p>}
        </form>
      )}
    </div>
  );
}

function TeacherPasswordSettings() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  async function changePassword(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!current || !next || !confirm) {
      setError("Ranpli tout chan yo.");
      return;
    }
    if (next.length < 4) {
      setError("Nouvo modpas la dwe gen omwen 4 karaktè.");
      return;
    }
    if (next !== confirm) {
      setError("Nouvo modpas yo pa menm bagay.");
      return;
    }
    setSaving(true);
    try {
      const ref = doc(db, "settings", "teacher");
      const snap = await getDoc(ref);
      const currentHash = await hashSecret(current);
      const storedHash = snap.exists() ? snap.data().passwordHash : await hashSecret(TEACHER_CODE);
      if (currentHash !== storedHash) {
        setError("Ansyen modpas la pa bon.");
        setSaving(false);
        return;
      }
      const newHash = await hashSecret(next);
      await setDoc(ref, { passwordHash: newHash }, { merge: true });
      setSuccess("Modpas ou chanje avèk siksè!");
      setCurrent(""); setNext(""); setConfirm("");
    } catch (err) {
      setError("Gen yon pwoblèm, eseye ankò.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mb-8 border rounded-lg p-5 bg-white" style={{ borderColor: "#E7E1D3" }}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="text-sm font-medium flex items-center gap-2" style={{ color: INK }}>
        <Pencil size={14} style={{ color: GOLD }} /> Chanje modpas pwofesè
      </button>
      {open && (
        <form onSubmit={changePassword} className="mt-4 space-y-3">
          <div>
            <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: "#8a8272" }}>Ansyen modpas</label>
            <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} className="w-full px-3 py-2 rounded-md border text-sm" style={{ borderColor: "#E7E1D3" }} />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: "#8a8272" }}>Nouvo modpas</label>
            <input type="password" value={next} onChange={(e) => setNext(e.target.value)} className="w-full px-3 py-2 rounded-md border text-sm" style={{ borderColor: "#E7E1D3" }} />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: "#8a8272" }}>Konfime nouvo modpas</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-full px-3 py-2 rounded-md border text-sm" style={{ borderColor: "#E7E1D3" }} />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          {success && <p className="text-xs" style={{ color: "#2C5F2D" }}>{success}</p>}
          <button type="submit" disabled={saving} className="w-full py-2.5 rounded-md text-sm font-medium text-white" style={{ background: INK, opacity: saving ? 0.7 : 1 }}>
            {saving ? "K'ap chanje..." : "Chanje modpas la"}
          </button>
        </form>
      )}
    </div>
  );
}

function AdminPanel() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("tèks");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [blocks, setBlocks] = useState([{ id: uid(), text: "", imageData: null, align: "left" }]);
  const [videoUrl, setVideoUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [courses, setCourses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [quizResults, setQuizResults] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [certStudent, setCertStudent] = useState("");
  const [certTitle, setCertTitle] = useState("");
  const [certFile, setCertFile] = useState(null);
  const [certError, setCertError] = useState("");
  const [certSaving, setCertSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "quizResults"), orderBy("submittedAt", "desc"));
    const unsub = onSnapshot(q, (snap) => setQuizResults(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "certificates"), orderBy("issuedAt", "desc"));
    const unsub = onSnapshot(q, (snap) => setCertificates(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);

  function handleCertFile(file) {
    setCertError("");
    if (!file) return;
    if (file.type !== "application/pdf") {
      setCertError("Sèlman fichye PDF aksepte.");
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      setCertError(`Fichye a twò gwo (${Math.round(file.size / 1024)} Ko). Limit la se ${Math.round(MAX_PDF_BYTES / 1024)} Ko.`);
      return;
    }
    setCertFile(file);
  }

  async function publishCertificate(e) {
    e.preventDefault();
    if (!certStudent.trim() || !certTitle.trim() || !certFile) {
      setCertError("Ranpli non elèv la, tit la, epi chwazi yon fichye PDF.");
      return;
    }
    setCertSaving(true);
    setCertError("");
    try {
      const dataUrl = await fileToDataUrl(certFile);
      await addDoc(collection(db, "certificates"), {
        studentName: certStudent.trim(),
        title: certTitle.trim(),
        fileName: certFile.name,
        dataUrl,
        issuedAt: Date.now(),
      });
      await setDoc(doc(db, "conversations", certStudent.trim()), { studentName: certStudent.trim(), updatedAt: serverTimestamp() }, { merge: true });
      await addDoc(collection(db, "conversations", certStudent.trim(), "messages"), {
        from: TEACHER_NAME,
        role: "pwofesè",
        text: `Yon nouvo sètifika ("${certTitle.trim()}") disponib pou ou nan espas Peman.`,
        time: Date.now(),
      });
      setCertStudent(""); setCertTitle(""); setCertFile(null);
    } catch (err) {
      setCertError("Gen yon pwoblèm, eseye ankò.");
    } finally {
      setCertSaving(false);
    }
  }

  async function removeCertificate(id) {
    await deleteDoc(doc(db, "certificates", id));
  }

  const [announcements, setAnnouncements] = useState([]);
  const [annTitle, setAnnTitle] = useState("");
  const [annDesc, setAnnDesc] = useState("");
  const [annDate, setAnnDate] = useState("");
  const [annImage, setAnnImage] = useState(null);
  const [annSaving, setAnnSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "announcements"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => setAnnouncements(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);

  async function handleAnnImage(file) {
    if (!file) return;
    const dataUrl = await compressImageToDataUrl(file, 1000, 0.75);
    setAnnImage(dataUrl);
  }

  async function publishAnnouncement(e) {
    e.preventDefault();
    if (!annTitle.trim()) return;
    setAnnSaving(true);
    try {
      await addDoc(collection(db, "announcements"), {
        title: annTitle.trim(),
        description: annDesc.trim(),
        eventDate: annDate.trim(),
        imageData: annImage,
        createdAt: Date.now(),
      });
      setAnnTitle(""); setAnnDesc(""); setAnnDate(""); setAnnImage(null);
    } finally {
      setAnnSaving(false);
    }
  }

  async function removeAnnouncement(id) {
    await deleteDoc(doc(db, "announcements", id));
  }

  useEffect(() => {
    const q = query(collection(db, "courses"), orderBy("date", "desc"));
    const unsub = onSnapshot(q, (snap) => setCourses(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "payments"), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.requestedAt || 0) - (a.requestedAt || 0));
      setPayments(list);
    });
    return () => unsub();
  }, []);

  async function confirmStudentPayment(studentName) {
    await setDoc(doc(db, "payments", studentName), { paid: true, confirmedAt: Date.now() }, { merge: true });
    await setDoc(doc(db, "conversations", studentName), { studentName, updatedAt: serverTimestamp() }, { merge: true });
    await addDoc(collection(db, "conversations", studentName, "messages"), {
      from: TEACHER_NAME,
      role: "pwofesè",
      text: "Peman ou konfime. Ou gen aksè ak tout kou yo kounye a.",
      time: Date.now(),
    });
  }

  function addBlock() {
    setBlocks((prev) => [...prev, { id: uid(), text: "", imageData: null, align: "left" }]);
  }
  function removeBlock(id) {
    setBlocks((prev) => (prev.length > 1 ? prev.filter((b) => b.id !== id) : prev));
  }
  function updateBlockText(id, text) {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, text } : b)));
  }
  function updateBlockAlign(id, align) {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, align } : b)));
  }
  async function updateBlockImage(id, file) {
    if (!file) return;
    const dataUrl = await compressImageToDataUrl(file);
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, imageData: dataUrl } : b)));
  }
  function removeBlockImage(id) {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, imageData: null } : b)));
  }

  async function publish(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setSavedMsg("");
    try {
      await addDoc(collection(db, "courses"), {
        title: title.trim(),
        description: description.trim(),
        type,
        category,
        blocks: type === "tèks" ? blocks.filter((b) => b.text.trim() || b.imageData) : [],
        videoUrl: type === "videyo" ? videoUrl.trim() : "",
        date: Date.now(),
      });
      setSavedMsg("Kou a pibliye!");
      setTitle(""); setDescription(""); setVideoUrl(""); setCategory(CATEGORIES[0]);
      setBlocks([{ id: uid(), text: "", imageData: null }]);
    } catch (e) {
      setSavedMsg("Gen yon pwoblèm, eseye ankò.");
    } finally {
      setSaving(false);
    }
  }

  async function removeCourse(id) {
    await deleteDoc(doc(db, "courses", id));
  }

  return (
    <div>
      <h2 className="text-xl mb-1" style={{ fontFamily: "Georgia, serif" }}>Jesyon Kou</h2>
      <p className="text-sm mb-6" style={{ color: "#8a8272" }}>Sèlman pwofesè a ka pibliye kou. Byenveni, {TEACHER_NAME}.</p>

      <TeacherPasswordSettings />

      <form onSubmit={publish} className="border rounded-lg p-5 bg-white space-y-4 mb-8" style={{ borderColor: "#E7E1D3" }}>
        <div>
          <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: "#8a8272" }}>Tit kou a</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 rounded-md border text-sm" style={{ borderColor: "#E7E1D3" }} required />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: "#8a8272" }}>Deskripsyon kout</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-3 py-2 rounded-md border text-sm" style={{ borderColor: "#E7E1D3" }} />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: "#8a8272" }}>Kategori</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-md border text-sm bg-white" style={{ borderColor: "#E7E1D3" }}>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: "#8a8272" }}>Fòm kou a</label>
          <div className="flex gap-2">
            <button type="button" onClick={() => setType("tèks")} className="flex-1 py-2 rounded-md border text-sm flex items-center justify-center gap-1"
              style={{ borderColor: "#E7E1D3", background: type === "tèks" ? INK : "transparent", color: type === "tèks" ? "#fff" : INK }}>
              <BookOpen size={14} /> Tèks
            </button>
            <button type="button" onClick={() => setType("videyo")} className="flex-1 py-2 rounded-md border text-sm flex items-center justify-center gap-1"
              style={{ borderColor: "#E7E1D3", background: type === "videyo" ? INK : "transparent", color: type === "videyo" ? "#fff" : INK }}>
              <Video size={14} /> Videyo
            </button>
          </div>
        </div>
        {type === "tèks" ? (
          <div>
            <label className="block text-xs uppercase tracking-wider mb-2" style={{ color: "#8a8272" }}>Kontni kou a</label>
            <div className="space-y-3">
              {blocks.map((b, i) => (
                <BlockFields
                  key={b.id}
                  block={b}
                  index={i}
                  onText={(t) => updateBlockText(b.id, t)}
                  onAlign={(a) => updateBlockAlign(b.id, a)}
                  onImage={(f) => updateBlockImage(b.id, f)}
                  onRemoveImage={() => removeBlockImage(b.id)}
                  onRemove={() => removeBlock(b.id)}
                  canRemove={blocks.length > 1}
                />
              ))}
            </div>
            <button type="button" onClick={addBlock} className="mt-2 text-xs px-3 py-1.5 rounded-md border flex items-center gap-1" style={{ borderColor: "#E7E1D3", color: INK }}>
              <Plus size={12} /> Ajoute yon lòt blòk
            </button>
          </div>
        ) : (
          <div>
            <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: "#8a8272" }}>Lyen videyo (embed URL)</label>
            <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://www.youtube.com/embed/..." className="w-full px-3 py-2 rounded-md border text-sm" style={{ borderColor: "#E7E1D3" }} />
          </div>
        )}
        <button type="submit" disabled={saving} className="w-full py-2.5 rounded-md text-sm font-medium text-white flex items-center justify-center gap-2" style={{ background: GOLD }}>
          <Plus size={16} /> {saving ? "K'ap pibliye..." : "Pibliye kou a"}
        </button>
        {savedMsg && <p className="text-xs text-center" style={{ color: "#2C5F2D" }}>{savedMsg}</p>}
      </form>

      <h3 className="text-sm uppercase tracking-wider mb-3" style={{ color: "#8a8272" }}>Kou pibliye yo ({courses.length})</h3>
      <div className="space-y-2">
        {courses.map((c) => (
          <div key={c.id} className="border rounded-md px-4 py-3 bg-white" style={{ borderColor: "#E7E1D3" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                {c.type === "videyo" ? <Video size={14} style={{ color: GOLD }} /> : <BookOpen size={14} style={{ color: GOLD }} />}
                {c.title}
                {c.category && (
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: "#FBFAF6", border: `1px solid ${GOLD_LIGHT}`, color: GOLD }}>
                    {c.category}
                  </span>
                )}
              </div>
              <button onClick={() => removeCourse(c.id)} className="p-1.5 rounded-md hover:bg-red-50 text-red-500"><Trash2 size={14} /></button>
            </div>
            <CourseEditor course={c} />
            <QuizEditor course={c} />
            <DocumentsEditor course={c} />
          </div>
        ))}
      </div>

      <h3 className="text-sm uppercase tracking-wider mb-3 mt-8" style={{ color: "#8a8272" }}>Rezilta Evalyasyon ({quizResults.length})</h3>
      {quizResults.length === 0 ? (
        <p className="text-sm mb-8" style={{ color: "#8a8272" }}>Pa gen rezilta evalyasyon ankò.</p>
      ) : (
        <div className="space-y-2 mb-8">
          {quizResults.map((r) => (
            <div key={r.id} className="flex items-center justify-between border rounded-md px-4 py-3 bg-white" style={{ borderColor: "#E7E1D3" }}>
              <div>
                <div className="text-sm font-medium">{r.studentName}</div>
                <div className="text-xs" style={{ color: "#8a8272" }}>{r.courseTitle}</div>
              </div>
              <span className="text-sm font-semibold" style={{ color: GOLD }}>{r.score} / {r.total}</span>
            </div>
          ))}
        </div>
      )}

      <h3 className="text-sm uppercase tracking-wider mb-3 mt-8" style={{ color: "#8a8272" }}>Peman elèv yo ({payments.length})</h3>
      <p className="text-xs mb-3" style={{ color: "#a39c8c" }}>Total kòb resevwa a vizib nan tab "Peman".</p>
      {payments.length === 0 ? (
        <p className="text-sm" style={{ color: "#8a8272" }}>Pa gen demand peman ankò.</p>
      ) : (
        <div className="space-y-2">
          {payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between border rounded-md px-4 py-3 bg-white" style={{ borderColor: "#E7E1D3" }}>
              <div>
                <div className="text-sm font-medium">{p.studentName}</div>
                <div className="text-xs" style={{ color: "#8a8272" }}>{p.amount || 1500} Goud — Dokiman ak Sètifika</div>
              </div>
              {p.paid ? (
                <span className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1" style={{ background: "#EAF4EA", color: "#2C5F2D" }}>
                  <Check size={12} /> Konfime
                </span>
              ) : (
                <button onClick={() => confirmStudentPayment(p.studentName)} className="text-xs px-3 py-1.5 rounded-md text-white" style={{ background: GOLD }}>
                  Konfime peman
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <h3 className="text-sm uppercase tracking-wider mb-3 mt-8" style={{ color: "#8a8272" }}>Pibliye yon anons</h3>
      <form onSubmit={publishAnnouncement} className="border rounded-lg p-5 bg-white space-y-4 mb-6" style={{ borderColor: "#E7E1D3" }}>
        {annImage ? (
          <div className="relative">
            <img src={annImage} alt="" className="w-full rounded-md max-h-48 object-cover" />
            <button type="button" onClick={() => setAnnImage(null)} className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1">
              <X size={12} />
            </button>
          </div>
        ) : (
          <label className="flex items-center justify-center gap-2 border border-dashed rounded-md py-4 text-xs cursor-pointer" style={{ borderColor: "#E7E1D3", color: "#8a8272" }}>
            <Upload size={14} /> Telechaje flyer la (imaj)
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleAnnImage(e.target.files?.[0])} />
          </label>
        )}
        <div>
          <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: "#8a8272" }}>Tit anons lan</label>
          <input value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} className="w-full px-3 py-2 rounded-md border text-sm" style={{ borderColor: "#E7E1D3" }} required />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: "#8a8272" }}>Dat (opsyonèl)</label>
          <input value={annDate} onChange={(e) => setAnnDate(e.target.value)} placeholder="Pa egzanp: 5 Out 2026" className="w-full px-3 py-2 rounded-md border text-sm" style={{ borderColor: "#E7E1D3" }} />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: "#8a8272" }}>Deskripsyon</label>
          <textarea value={annDesc} onChange={(e) => setAnnDesc(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-md border text-sm" style={{ borderColor: "#E7E1D3" }} />
        </div>
        <button type="submit" disabled={annSaving} className="w-full py-2.5 rounded-md text-sm font-medium text-white flex items-center justify-center gap-2" style={{ background: GOLD }}>
          <Megaphone size={16} /> {annSaving ? "K'ap pibliye..." : "Pibliye anons lan"}
        </button>
      </form>

      <h3 className="text-sm uppercase tracking-wider mb-3" style={{ color: "#8a8272" }}>Anons pibliye yo ({announcements.length})</h3>
      <div className="space-y-2">
        {announcements.map((a) => (
          <div key={a.id} className="border rounded-md px-4 py-3 bg-white" style={{ borderColor: "#E7E1D3" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Megaphone size={14} style={{ color: GOLD }} />
                {a.title}
              </div>
              <button onClick={() => removeAnnouncement(a.id)} className="p-1.5 rounded-md hover:bg-red-50 text-red-500"><Trash2 size={14} /></button>
            </div>
            <AnnouncementEditor a={a} />
          </div>
        ))}
      </div>

      <h3 className="text-sm uppercase tracking-wider mb-3 mt-8" style={{ color: "#8a8272" }}>Pibliye yon sètifika</h3>
      <form onSubmit={publishCertificate} className="border rounded-lg p-5 bg-white space-y-4 mb-6" style={{ borderColor: "#E7E1D3" }}>
        <div>
          <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: "#8a8272" }}>Non elèv la (egzakteman jan li konekte)</label>
          <input value={certStudent} onChange={(e) => setCertStudent(e.target.value)} className="w-full px-3 py-2 rounded-md border text-sm" style={{ borderColor: "#E7E1D3" }} required />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: "#8a8272" }}>Tit sètifika a</label>
          <input value={certTitle} onChange={(e) => setCertTitle(e.target.value)} placeholder="Pa egzanp: Sètifika Antreprenarya" className="w-full px-3 py-2 rounded-md border text-sm" style={{ borderColor: "#E7E1D3" }} required />
        </div>
        <label className="flex items-center justify-center gap-2 border border-dashed rounded-md py-4 text-xs cursor-pointer" style={{ borderColor: "#E7E1D3", color: "#8a8272" }}>
          <Upload size={14} /> {certFile ? certFile.name : "Telechaje sètifika a (PDF)"}
          <input type="file" accept="application/pdf" className="hidden" onChange={(e) => handleCertFile(e.target.files?.[0])} />
        </label>
        {certError && <p className="text-xs text-red-600">{certError}</p>}
        <button type="submit" disabled={certSaving} className="w-full py-2.5 rounded-md text-sm font-medium text-white flex items-center justify-center gap-2" style={{ background: GOLD }}>
          <FileText size={16} /> {certSaving ? "K'ap pibliye..." : "Pibliye sètifika a"}
        </button>
      </form>

      <h3 className="text-sm uppercase tracking-wider mb-3" style={{ color: "#8a8272" }}>Sètifika pibliye yo ({certificates.length})</h3>
      <div className="space-y-2">
        {certificates.map((c) => (
          <div key={c.id} className="flex items-center justify-between border rounded-md px-4 py-3 bg-white" style={{ borderColor: "#E7E1D3" }}>
            <div>
              <div className="text-sm font-medium">{c.title}</div>
              <div className="text-xs" style={{ color: "#8a8272" }}>{c.studentName}</div>
            </div>
            <button onClick={() => removeCertificate(c.id)} className="p-1.5 rounded-md hover:bg-red-50 text-red-500"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
