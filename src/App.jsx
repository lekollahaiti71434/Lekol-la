import React, { useState, useEffect, useRef } from "react";
import { BookOpen, Video, MessageCircle, Send, Plus, Trash2, LogOut, GraduationCap, Wallet, Star, ChevronRight, Check } from "lucide-react";
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

async function hashSecret(text) {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function studentKey(name) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
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
      if (name !== TEACHER_NAME || codeInput.trim() !== TEACHER_CODE) {
        setLoginError("Non oswa kòd aksè pwofesè a pa bon.");
        return;
      }
      setUser({ name: TEACHER_NAME, role: "pwofesè" });
      setTab("admin");
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
        <LogoMark size={72} />
        <h1 className="mt-4 text-3xl tracking-wide" style={{ fontFamily: "Georgia, serif", color: INK, letterSpacing: "0.04em" }}>
          LEKÒL LA
        </h1>
        <Divider />
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
            <NavBtn active={tab === "mesaj"} onClick={() => setTab("mesaj")} icon={<MessageCircle size={15} />} label="Mesaj" />
            <NavBtn active={tab === "peman"} onClick={() => setTab("peman")} icon={<Wallet size={15} />} label="Peman" />
            {user.role === "pwofesè" && (
              <NavBtn active={tab === "admin"} onClick={() => setTab("admin")} icon={<GraduationCap size={15} />} label="Jesyon" />
            )}
          </nav>
          <div className="flex items-center gap-3">
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
        {tab === "kou" && activeCourse && hasCourseAccess && <CourseDetail course={activeCourse} onBack={() => setActiveCourse(null)} />}
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

function CourseDetail({ course, onBack }) {
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
        <div className="bg-white border rounded-lg p-6 whitespace-pre-wrap leading-relaxed text-sm" style={{ borderColor: "#E7E1D3" }}>
          {course.content}
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
  ); time: Date.now(),
      });
    } finally {
      setSending(false);
    }
  }

  if (user.role === "pwofesè") {
    return (
      <div className="max-w-lg">
        <h2 className="text-xl mb-1" style={{ fontFamily: "Georgia, serif" }}>Peman</h2>
        <p className="text-sm" style={{ color: "#8a8272" }}>Ou se pwofesè — ou pa bezwen peye pou jwenn aksè.</p>
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

function AdminPanel() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("tèks");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [content, setContent] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [courses, setCourses] = useState([]);
  const [payments, setPayments] = useState([]);

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
        content: type === "tèks" ? content : "",
        videoUrl: type === "videyo" ? videoUrl.trim() : "",
        date: Date.now(),
      });
      setSavedMsg("Kou a pibliye!");
      setTitle(""); setDescription(""); setContent(""); setVideoUrl(""); setCategory(CATEGORIES[0]);
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
            <label className="block text-xs uppercase tracking-wider mb-1" style={{ color: "#8a8272" }}>Kontni kou a</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={5} className="w-full px-3 py-2 rounded-md border text-sm" style={{ borderColor: "#E7E1D3" }} />
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
          <div key={c.id} className="flex items-center justify-between border rounded-md px-4 py-3 bg-white" style={{ borderColor: "#E7E1D3" }}>
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
        ))}
      </div>

      <h3 className="text-sm uppercase tracking-wider mb-3 mt-8" style={{ color: "#8a8272" }}>Peman elèv yo ({payments.length})</h3>
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
    </div>
  );
                                                                                                               }
      
