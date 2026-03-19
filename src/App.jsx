import { useState, useEffect } from "react";

// ─── SUPABASE CLIENT ──────────────────────────────────────────────────────────
const SUPABASE_URL = "https://vhgqtjtydxzaudnedtan.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_M_B8vdDY57xGdfNaXJ_DOw_XKp_NPS3";

async function supabase(path, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${path}`;
  const res = await fetch(url, {
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${options.token || SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      "Prefer": options.prefer || "",
      ...options.headers,
    },
    method: options.method || "GET",
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error_description || `HTTP ${res.status}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function authRequest(path, body) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
    method: "POST",
    headers: { "apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || data.msg || "Auth error");
  return data;
}

function randomCode() {
  return "R2R" + Math.random().toString(36).slice(2, 5).toUpperCase();
}

// ─── ESPN API ─────────────────────────────────────────────────────────────────
async function fetchESPNWinners() {
  try {
    // Only fetch during tournament dates (March 19 - April 7, 2026)
    const now = new Date();
    const tournamentStart = new Date("2026-03-19T00:00:00Z");
    const tournamentEnd = new Date("2026-04-07T23:59:59Z");
    if (now < tournamentStart || now > tournamentEnd) return {};

    const today = new Date();
    const winners = {};
    for (let d = 0; d < 2; d++) {
      const date = new Date(today);
      date.setDate(today.getDate() - d);
      const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
      const res = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard?dates=${dateStr}&groups=100&limit=100`
      );
      if (!res.ok) continue;
      const data = await res.json();
      const events = data.events || [];
      for (const event of events) {
        const status = event.status?.type?.completed;
        if (!status) continue;
        const comps = event.competitions?.[0];
        if (!comps) continue;
        for (const team of comps.competitors || []) {
          if (team.winner) {
            const name = team.team?.displayName || team.team?.name || "";
            if (name) winners[name] = true;
            const shortName = team.team?.shortDisplayName || team.team?.abbreviation || "";
            if (shortName) winners[shortName] = true;
          }
        }
      }
    }
    return winners;
  } catch (err) {
    console.error("ESPN fetch error:", err);
    return {};
  }
}

function teamNameMatch(pickName, winners) {
  if (!pickName || !winners) return false;
  const pick = pickName.toLowerCase().trim().replace(/\.$/, "");
  return Object.keys(winners).some(w => {
    const espn = w.toLowerCase().trim().replace(/\.$/, "");
    return espn === pick;
  });
}

// ─── TEAMS DATA ───────────────────────────────────────────────────────────────
const TEAMS_MENS = [
  // EAST
  { id: 1, name: "Duke", seed: 1, region: "East" },
  { id: 2, name: "UConn", seed: 2, region: "East" },
  { id: 3, name: "Michigan State", seed: 3, region: "East" },
  { id: 4, name: "Kansas", seed: 4, region: "East" },
  { id: 5, name: "St. John's", seed: 5, region: "East" },
  { id: 6, name: "Louisville", seed: 6, region: "East" },
  { id: 7, name: "UCLA", seed: 7, region: "East" },
  { id: 8, name: "Ohio State", seed: 8, region: "East" },
  { id: 9, name: "TCU", seed: 9, region: "East" },
  { id: 10, name: "UCF", seed: 10, region: "East" },
  { id: 11, name: "South Florida", seed: 11, region: "East" },
  { id: 12, name: "Northern Iowa", seed: 12, region: "East" },
  { id: 13, name: "Cal Baptist", seed: 13, region: "East" },
  { id: 14, name: "North Dakota State", seed: 14, region: "East" },
  { id: 15, name: "Furman", seed: 15, region: "East" },
  { id: 16, name: "Siena", seed: 16, region: "East" },
  // WEST
  { id: 17, name: "Arizona", seed: 1, region: "West" },
  { id: 18, name: "Purdue", seed: 2, region: "West" },
  { id: 19, name: "Gonzaga", seed: 3, region: "West" },
  { id: 20, name: "Arkansas", seed: 4, region: "West" },
  { id: 21, name: "Wisconsin", seed: 5, region: "West" },
  { id: 22, name: "BYU", seed: 6, region: "West" },
  { id: 23, name: "Miami (Fla.)", seed: 7, region: "West" },
  { id: 24, name: "Villanova", seed: 8, region: "West" },
  { id: 25, name: "Utah State", seed: 9, region: "West" },
  { id: 26, name: "Missouri", seed: 10, region: "West" },
  { id: 27, name: "Texas", seed: 11, region: "West" },
  { id: 28, name: "High Point", seed: 12, region: "West" },
  { id: 29, name: "Hawaii", seed: 13, region: "West" },
  { id: 30, name: "Kennesaw State", seed: 14, region: "West" },
  { id: 31, name: "Queens", seed: 15, region: "West" },
  { id: 32, name: "Long Island University", seed: 16, region: "West" },
  // SOUTH
  { id: 33, name: "Florida", seed: 1, region: "South" },
  { id: 34, name: "Houston", seed: 2, region: "South" },
  { id: 35, name: "Illinois", seed: 3, region: "South" },
  { id: 36, name: "Nebraska", seed: 4, region: "South" },
  { id: 37, name: "Vanderbilt", seed: 5, region: "South" },
  { id: 38, name: "North Carolina", seed: 6, region: "South" },
  { id: 39, name: "Saint Mary's", seed: 7, region: "South" },
  { id: 40, name: "Clemson", seed: 8, region: "South" },
  { id: 41, name: "Iowa", seed: 9, region: "South" },
  { id: 42, name: "Texas A&M", seed: 10, region: "South" },
  { id: 43, name: "VCU", seed: 11, region: "South" },
  { id: 44, name: "McNeese", seed: 12, region: "South" },
  { id: 45, name: "Troy", seed: 13, region: "South" },
  { id: 46, name: "Penn", seed: 14, region: "South" },
  { id: 47, name: "Idaho", seed: 15, region: "South" },
  { id: 48, name: "Play-In Winner", seed: 16, region: "South" },
  // MIDWEST
  { id: 49, name: "Michigan", seed: 1, region: "Midwest" },
  { id: 50, name: "Iowa State", seed: 2, region: "Midwest" },
  { id: 51, name: "Virginia", seed: 3, region: "Midwest" },
  { id: 52, name: "Alabama", seed: 4, region: "Midwest" },
  { id: 53, name: "Texas Tech", seed: 5, region: "Midwest" },
  { id: 54, name: "Tennessee", seed: 6, region: "Midwest" },
  { id: 55, name: "Kentucky", seed: 7, region: "Midwest" },
  { id: 56, name: "Georgia", seed: 8, region: "Midwest" },
  { id: 57, name: "Saint Louis", seed: 9, region: "Midwest" },
  { id: 58, name: "Santa Clara", seed: 10, region: "Midwest" },
  { id: 59, name: "Play-In Winner", seed: 11, region: "Midwest" },
  { id: 60, name: "Akron", seed: 12, region: "Midwest" },
  { id: 61, name: "Hofstra", seed: 13, region: "Midwest" },
  { id: 62, name: "Wright State", seed: 14, region: "Midwest" },
  { id: 63, name: "Tennessee State", seed: 15, region: "Midwest" },
  { id: 64, name: "Play-In Winner", seed: 16, region: "Midwest" },
];

// ESPN team ID map for logos
const ESPN_IDS = {
  "Duke": 150,
  "UConn": 41,
  "Michigan State": 127,
  "Kansas": 2305,
  "St. John's": 2599,
  "Louisville": 97,
  "UCLA": 26,
  "Ohio State": 194,
  "Arizona": 12,
  "Iowa State": 66,
  "Illinois": 356,
  "Alabama": 333,
  "Wisconsin": 275,
  "North Carolina": 153,
  "Saint Mary's": 2608,
  "Villanova": 222,
  "Florida": 57,
  "Houston": 248,
  "Gonzaga": 2250,
  "Arkansas": 8,
  "Vanderbilt": 238,
  "Tennessee": 2633,
  "Miami (Fla.)": 2390,
  "Clemson": 228,
  "Michigan": 130,
  "Purdue": 2509,
  "Virginia": 258,
  "Nebraska": 158,
  "Texas Tech": 2641,
  "BYU": 252,
  "Kentucky": 96,
  "Georgia": 61,
  "Furman": 231,
"Troy": 2653,
"Kennesaw State": 2390,
"Siena": 2561,
"Queens": 2511,
"Idaho": 70,
"Howard": 2272,
"UMBC": 2378,
"Wright State": 2711,
"Penn": 219,
"Tennessee State": 2534,
"Long Island University": 2350,
"Hofstra": 2275,
"High Point": 2272,
"Utah State": 328,
"Texas A&M": 245,
"VCU": 2670,
"Akron": 2006,
"North Dakota State": 2449,
"Cal Baptist": 2856,
"McNeese": 2377,
"Hawai'i": 62,
"Kennesaw State": 2390,
"NC State": 152,
"South Florida": 58,
"UNI": 2269,
"TCU": 2628,
"UCF": 2116,
"Saint Louis": 139,
"Santa Clara": 2608,
"Iowa": 2294,
"Northern Iowa": 2460,
"Hawaii": 62,
"Missouri": 142,
"Hofstra": 2275,
  "Hawaii": 62,
"Long Island University": 2350,
"NC State": 152,
"Northern Iowa": 2460,
"Iowa": 2294,
"Missouri": 142,
"Hofstra": 2275,
"Kennesaw State": 2390,
"Idaho": 70,
"Penn": 219,
"Tennessee State": 2534,
"Saint Louis": 139,
"Cal Baptist": 2856,
"Santa Clara": 2608,
"South Florida": 58,
"VCU": 2670,
"Troy": 2653,
"Akron": 2006,
"UCF": 2116,
"Furman": 231,
"McNeese": 2377,
"Utah State": 328,
"Wright State": 2711,
"High Point": 2272,
"Siena": 2561,
"Queens": 2511,
"North Dakota State": 2449,
"Texas A&M": 245,
"TCU": 2628,
"Texas": 251,
"Play-In Winner": null,
};

function getLogoUrl(teamName) {
  const id = ESPN_IDS[teamName];
  if (!id) return null;
  return `https://a.espncdn.com/i/teamlogos/ncaa/500/${id}.png`;
}
const ROUND_NAMES = ["Round of 64", "Round of 32", "Sweet 16", "Elite Eight", "Final Four", "Championship"];
const ROUND_POINTS = [1, 2, 3, 4, 5, 6];
const REGIONS = ["East", "West", "South", "Midwest"];

// ─── NCAA COLORS ──────────────────────────────────────────────────────────────
const C = {
  ncaaBlue: "#005eb8", ncaaBlueDark: "#004a94", ncaaBlueLight: "#1a73d4",
  ncaaBlueFade: "rgba(0,94,184,0.08)", ncaaBlueFadeMed: "rgba(0,94,184,0.15)",
  navy: "#001a3d", navyMid: "#002a5c",
  red: "#cc0000", redFade: "rgba(204,0,0,0.08)",
  bg: "#f4f6fa", surface: "#ffffff",
  surfaceGray: "#f8f9fc", border: "#dde3ef", borderLight: "#eef1f7",
  text: "#0d1b2e", textMid: "#3a4a60", textMuted: "#6b7a95", textLight: "#9aa5bc",
  green: "#16a34a", greenFade: "rgba(22,163,74,0.09)",
};

// ─── COUNTDOWN HOOK ───────────────────────────────────────────────────────────
function useCountdown(target) {
  const [timeLeft, setTimeLeft] = useState(() => Math.max(0, target - Date.now()));
  useEffect(() => {
    const t = setInterval(() => setTimeLeft(Math.max(0, target - Date.now())), 1000);
    return () => clearInterval(t);
  }, [target]);
  const days = Math.floor(timeLeft / 86400000);
  const h = Math.floor((timeLeft % 86400000) / 3600000);
  const m = Math.floor((timeLeft % 3600000) / 60000);
  const sec = Math.floor((timeLeft % 60000) / 1000);
  return { days, h, m, s: sec, expired: timeLeft === 0 };
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(() => {
    try { const s = localStorage.getItem("r2r_session"); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [screen, setScreen] = useState(() => {
    try { return localStorage.getItem("r2r_session") ? "dashboard" : "landing"; } catch { return "landing"; }
  });
  const [activeGroup, setActiveGroup] = useState(null);
  const [activeTab, setActiveTab] = useState("picks");
  const [authMode, setAuthMode] = useState("login");
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const saveSession = (sess) => {
    localStorage.setItem("r2r_session", JSON.stringify(sess));
    setSession(sess);
  };

  const refreshSession = async () => {
    try {
      const saved = localStorage.getItem("r2r_session");
      const parsed = saved ? JSON.parse(saved) : null;
      if (!parsed?.refresh_token) return null;
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: "POST",
        headers: { "apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: parsed.refresh_token }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const newSession = { ...parsed, token: data.access_token, refresh_token: data.refresh_token };
      localStorage.setItem("r2r_session", JSON.stringify(newSession));
      setSession(newSession);
      return newSession;
    } catch { return null; }
  };

  const handleLogout = () => {
    localStorage.removeItem("r2r_session");
    setSession(null);
    setScreen("landing");
    setActiveGroup(null);
  };

  return (
    <div>
      {toast && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
          background: toast.type === "error" ? C.red : C.green,
          color: "#fff", padding: "12px 24px", borderRadius: 10, zIndex: 1000,
          fontFamily: "'DM Sans',system-ui,sans-serif", fontWeight: 600, fontSize: "0.9rem",
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)", maxWidth: "90vw", textAlign: "center",
        }}>{toast.msg}</div>
      )}
      {screen === "landing" && <Landing onLogin={() => setScreen("auth")} />}
      {screen === "auth" && <Auth mode={authMode} setMode={setAuthMode} onSuccess={(sess) => { saveSession(sess); setScreen("dashboard"); }} showToast={showToast} />}
      {screen === "create" && <CreateGroup session={session} onCreate={(g) => { setActiveGroup(g); setScreen("dashboard"); showToast("Group created! 🎉"); }} onBack={() => setScreen("dashboard")} showToast={showToast} />}
      {screen === "join" && <JoinGroup session={session} onJoin={(g) => { setActiveGroup(g); setScreen("dashboard"); showToast("Joined group! 🏀"); }} onBack={() => setScreen("dashboard")} showToast={showToast} />}
      {screen === "rules" && <RulesPage onBack={() => setScreen(session ? "dashboard" : "landing")} />}
      {screen === "dashboard" && !activeGroup && <Dashboard session={session} onSelectGroup={(g) => setActiveGroup(g)} onCreateGroup={() => setScreen("create")} onJoinGroup={() => setScreen("join")} onLogout={handleLogout} showToast={showToast} refreshSession={refreshSession} handleLogout={handleLogout} onRules={() => setScreen("rules")} />}
      {screen === "dashboard" && activeGroup && <GroupScreen group={activeGroup} session={session} activeTab={activeTab} setActiveTab={setActiveTab} onBack={() => { setActiveGroup(null); setActiveTab("picks"); }} showToast={showToast} />}
    </div>
  );
}

// ─── LANDING ─────────────────────────────────────────────────────────────────
function Landing({ onLogin }) {
  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif", color: C.text }}>
      <div style={{ background: `linear-gradient(160deg, ${C.navy} 0%, ${C.navyMid} 50%, ${C.ncaaBlueDark} 100%)`, paddingBottom: 80 }}>
        <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 32px", maxWidth: 1100, margin: "0 auto" }}>
          <Logo light />
         <div />
        </nav>
        <div style={{ textAlign: "center", padding: "64px 24px 0", maxWidth: 660, margin: "0 auto" }}>
          <div style={s.heroBadge}><span style={s.liveDot} />March Madness 2026 · Men's &amp; Women's</div>
          <h1 style={{ fontSize: "clamp(3rem,9vw,5rem)", fontWeight: 900, lineHeight: 1.0, letterSpacing: "-0.045em", margin: "20px 0 24px", color: "#fff" }}>
            Round<br /><span style={{ color: "#fbbf24" }}>2 Round.</span>
          </h1>
          <p style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.72)", lineHeight: 1.7, maxWidth: 500, margin: "0 auto 40px" }}>
            No full bracket upfront. Pick each round as it happens — change picks freely until tipoff locks them in.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginBottom: 48 }}>
          <button style={s.btnHeroMain} onClick={onLogin}>Sign Up Free</button>
          <button style={s.btnHeroGhost} onClick={onLogin}>Sign In</button>
          </div>
        </div>
      </div>
      <div style={{ background: C.ncaaBlue, padding: "14px 24px" }}>
        <div style={{ display: "flex", gap: 32, justifyContent: "center", flexWrap: "wrap" }}>
          {["🏆 Live Leaderboards", "🔒 Picks Hidden Until Deadline", "📱 Mobile Friendly", "⚡ Live ESPN Scores"].map(t => (
            <span key={t} style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.82rem", fontWeight: 600 }}>{t}</span>
          ))}
        </div>
      </div>
      <div style={{ padding: "80px 24px", maxWidth: 960, margin: "0 auto" }}>
        <div style={s.sectionLabel}>How It Works</div>
        <h2 style={s.sectionH2}>Simple. Fair. More fun.</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 24, marginTop: 48 }}>
          {[
            { icon: "👥", n: "01", title: "Create or Join", desc: "Start a pool and share your group code. Friends join with one link." },
            { icon: "🎯", n: "02", title: "Pick Each Round", desc: "Submit picks before tipoff. Change them freely until the round locks." },
            { icon: "🔒", n: "03", title: "Picks Stay Hidden", desc: "No one sees what you picked until the deadline passes. No copying." },
            { icon: "🏆", n: "04", title: "Live Scoring", desc: "ESPN updates winners automatically. Leaderboard updates in real time." },
          ].map(st => (
            <div key={st.n} style={s.featureCard}>
              <div style={{ fontSize: "2rem", marginBottom: 12 }}>{st.icon}</div>
              <div style={s.featureN}>{st.n}</div>
              <div style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 8, color: C.navy }}>{st.title}</div>
              <div style={{ fontSize: "0.82rem", color: C.textMuted, lineHeight: 1.6 }}>{st.desc}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: C.navy, padding: "80px 24px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ ...s.sectionLabel, color: "rgba(255,255,255,0.5)" }}>Scoring System</div>
          <h2 style={{ ...s.sectionH2, color: "#fff" }}>More points. More pressure.</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 16, marginTop: 48 }}>
            {ROUND_NAMES.map((r, i) => (
              <div key={r} style={{ background: "rgba(255,255,255,0.06)", border: `1px solid ${i === 5 ? "#fbbf24" : "rgba(255,255,255,0.1)"}`, borderRadius: 14, padding: "24px 16px", textAlign: "center" }}>
                <div style={{ fontSize: "2.4rem", fontWeight: 900, color: i === 5 ? "#fbbf24" : "#fff", letterSpacing: "-0.04em" }}>{ROUND_POINTS[i]}</div>
                <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", fontWeight: 600, textTransform: "uppercase" }}>pt{ROUND_POINTS[i] > 1 ? "s" : ""}</div>
                <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.6)", marginTop: 8, fontWeight: 500 }}>{r}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ padding: "80px 24px", textAlign: "center" }}>
        <h2 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 12 }}>Ready to play?</h2>
        <p style={{ color: C.textMuted, marginBottom: 32 }}>Create a free group in under a minute.</p>
        <button style={s.btnPrimary} onClick={onLogin}>Get Started — It's Free</button>
      </div>
    </div>
  );
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
function Auth({ mode, setMode, onSuccess, showToast }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError(""); setLoading(true);
    try {
      if (mode === "signup") {
        const data = await authRequest("signup", { email, password });
        const token = data.access_token;
        const userId = data.user?.id || data.id;
        await supabase("profiles", {
          method: "POST", token,
          prefer: "return=representation,resolution=merge-duplicates",
          headers: { "on_conflict": "id" },
          body: { id: userId, display_name: name || email.split("@")[0] },
        });
        onSuccess({ token, refresh_token: data.refresh_token, user: { id: userId, email }, profile: { display_name: name || email.split("@")[0] } });
        showToast("Account created! Welcome to R2R 🏀");
      } else {
        const data = await authRequest("token?grant_type=password", { email, password });
        const token = data.access_token;
        const profiles = await supabase(`profiles?id=eq.${data.user.id}&select=*`, { token });
        onSuccess({ token, refresh_token: data.refresh_token, user: data.user, profile: profiles?.[0] || { display_name: email.split("@")[0] } });
        showToast("Welcome back!");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.lightPage}>
      <nav style={s.lightNav}><Logo /></nav>
      <div style={s.centerFlex}>
        <div style={s.authCard}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: "2.5rem", marginBottom: 14 }}>🏀</div>
            <h2 style={s.authH2}>{mode === "login" ? "Welcome back" : "Create your account"}</h2>
            <p style={{ fontSize: "0.875rem", color: C.textMuted }}>{mode === "login" ? "Sign in to manage your groups" : "Join Round 2 Round for free"}</p>
          </div>
          {error && <div style={s.errorBox}>{error}</div>}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {mode === "signup" && <>
              <label style={s.label}>Your Name</label>
              <input style={s.input} placeholder="e.g. Alex Johnson" value={name} onChange={e => setName(e.target.value)} />
            </>}
            <label style={s.label}>Email Address</label>
            <input style={s.input} placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            <label style={s.label}>Password</label>
            <input style={s.input} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()} />
            <button style={{ ...s.btnPrimary, width: "100%", padding: "14px", marginTop: 8, fontSize: "1rem", opacity: loading ? 0.6 : 1 }} onClick={handleSubmit} disabled={loading}>
              {loading ? "Please wait..." : mode === "login" ? "Sign In →" : "Create Account →"}
            </button>
          </div>
          <p style={s.switchP}>
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <span style={s.switchLink} onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}>
              {mode === "login" ? "Sign up free" : "Sign in"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function Dashboard({ session, onSelectGroup, onCreateGroup, onJoinGroup, onLogout, showToast, refreshSession, handleLogout, onRules }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
const [editingName, setEditingName] = useState(false);
const [newName, setNewName] = useState(session.profile?.display_name || "");
const [savingName, setSavingName] = useState(false);

const handleSaveName = async () => {
  if (!newName.trim()) return;
  setSavingName(true);
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${session.user.id}`, {
      method: "PATCH",
      headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${session.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ display_name: newName.trim() }),
    });
    session.profile.display_name = newName.trim();
    setEditingName(false);
    showToast("Name updated! ✓");
  } catch (err) {
    showToast("Couldn't update name: " + err.message, "error");
  } finally {
    setSavingName(false);
  }
};

  useEffect(() => { loadGroups(); }, []);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const members = await supabase(`group_members?user_id=eq.${session.user.id}&select=group_id`, { token: session.token });
      if (!members?.length) { setGroups([]); setLoading(false); return; }
      const ids = members.map(m => m.group_id).join(",");
      const gs = await supabase(`groups?id=in.(${ids})&select=*&order=created_at.desc`, { token: session.token });
      setGroups(gs || []);
    } catch (err) {
      if (err.message.includes("JWT") || err.message.includes("expired") || err.message.includes("token")) {
        const newSession = await refreshSession();
        if (newSession) {
          loadGroups();
        } else {
          handleLogout();
          showToast("Session expired — please sign in again", "error");
        }
      } else {
        showToast("Couldn't load groups: " + err.message, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.lightPage}>
      {editingName && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: C.surface, borderRadius: 20, padding: "32px 28px", width: "100%", maxWidth: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: C.navy, marginBottom: 6 }}>Update Your Name</h3>
            <p style={{ fontSize: "0.82rem", color: C.textMuted, marginBottom: 20 }}>This is how you appear on leaderboards.</p>
            <input style={s.input} value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSaveName()} autoFocus />
            <div style={{ display: "flex", gap: 10 }}>
              <button style={{ ...s.btnOutline, flex: 1 }} onClick={() => setEditingName(false)}>Cancel</button>
              <button style={{ ...s.btnPrimary, flex: 1, opacity: savingName ? 0.6 : 1 }} onClick={handleSaveName} disabled={savingName}>
                {savingName ? "Saving..." : "Save Name"}
              </button>
            </div>
          </div>
        </div>
      )}
      <div style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.navyMid})`, paddingBottom: 48 }}>
        <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 28px" }}>
          <Logo light />
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.82rem", cursor: "pointer", textDecoration: "underline", textDecorationStyle: "dotted" }} onClick={() => setEditingName(true)}>{session.profile?.display_name}</span>
<button style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.7)", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: "0.75rem", fontFamily: "inherit" }} onClick={onRules}>📋</button>
<button style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.7)", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: "0.75rem", fontFamily: "inherit" }} onClick={onLogout}>Sign Out</button>
            </div>
        </nav>
        <div style={{ padding: "16px 32px 0", maxWidth: 680, margin: "0 auto" }}>
          <h2 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", marginBottom: 4 }}>My Groups</h2>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.875rem" }}>March Madness 2026</p>
        </div>
      </div>
      <div style={{ maxWidth: 680, margin: "-32px auto 0", padding: "0 24px 60px", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginBottom: 20 }}>
          <button style={s.btnPrimary} onClick={onJoinGroup}>Join a Group</button>
          <button style={s.btnPrimary} onClick={onCreateGroup}>+ Create Group</button>
        </div>
        {loading && <div style={s.loadingBox}>Loading your groups...</div>}
        {!loading && groups.length === 0 && (
          <div style={s.emptyBox}>
            <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🏀</div>
            <div style={{ fontWeight: 700, fontSize: "1rem", color: C.text, marginBottom: 6 }}>No groups yet</div>
            <div style={{ fontSize: "0.85rem", color: C.textMuted, marginBottom: 20 }}>Create a group to get started, or join one with a code.</div>
            <button style={s.btnPrimary} onClick={onCreateGroup}>Create Your First Group</button>
          </div>
        )}
        {groups.map(g => (
          <div key={g.id} style={s.groupCard} onClick={() => onSelectGroup(g)}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={s.groupCardIcon}>🏀</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "1rem", color: C.text, marginBottom: 3 }}>{g.name}</div>
                <div style={{ fontSize: "0.8rem", color: C.textMuted }}>{g.tournament} NCAA · Code: <strong>{g.code}</strong></div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={s.roundBadge}>Round {g.current_round}</span>
              <span style={{ color: C.textLight, fontSize: "1.4rem" }}>›</span>
            </div>
          </div>
        ))}
<div style={s.infoCard}>
          <div style={{ fontSize: "1.5rem" }}>🔒</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.9rem", color: C.text, marginBottom: 4 }}>Picks stay private until deadline</div>
            <div style={{ fontSize: "0.8rem", color: C.textMuted, lineHeight: 1.55 }}>No one can see what others picked until each round locks at tipoff.</div>
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <span style={{ fontSize: "0.82rem", color: C.ncaaBlue, cursor: "pointer", fontWeight: 600 }} onClick={onRules}>📋 How to Play / Rules</span>
        </div>
      </div>
    </div>
  );
}

// ─── CREATE GROUP ─────────────────────────────────────────────────────────────
function CreateGroup({ session, onCreate, onBack, showToast }) {
  const [name, setName] = useState("");
  const [tournament, setTournament] = useState("Men's");
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(null);

  const handleCreate = async () => {
    if (name.length < 2) return;
    setLoading(true);
    try {
      const code = randomCode();
      const res = await fetch(`${SUPABASE_URL}/rest/v1/groups`, {
        method: "POST",
        headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${session.token}`, "Content-Type": "application/json", "Prefer": "return=representation" },
        body: JSON.stringify({ name, code, tournament, created_by: session.user.id, current_round: 1 }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message || JSON.stringify(err)); }
      const groups = await res.json();
      const group = Array.isArray(groups) ? groups[0] : groups;
      await supabase("group_members", { method: "POST", token: session.token, body: { group_id: group.id, user_id: session.user.id } });
      const rounds = await supabase("rounds", { method: "POST", token: session.token, prefer: "return=representation", body: { group_id: group.id, round_number: 1, deadline: "2026-03-20T17:00:00Z", is_locked: false } });
      const round = Array.isArray(rounds) ? rounds[0] : rounds;
      const matchupRows = [];
      REGIONS.forEach(region => {
        const rt = TEAMS_MENS.filter(t => t.region === region).sort((a, b) => a.seed - b.seed);
        [[0,15],[1,14],[2,13],[3,12],[4,11],[5,10],[6,9],[7,8]].forEach(([a, b]) => {
          matchupRows.push({ round_id: round.id, team1_name: rt[a].name, team1_seed: rt[a].seed, team2_name: rt[b].name, team2_seed: rt[b].seed, region });
        });
      });
      await supabase("matchups", { method: "POST", token: session.token, body: matchupRows });
      setCreated({ ...group, code });
    } catch (err) {
      showToast("Error: " + (err.message || JSON.stringify(err)), "error");
    } finally {
      setLoading(false);
    }
  };

  if (created) return (
    <div style={s.lightPage}>
      <nav style={s.lightNav}><Logo /></nav>
      <div style={s.centerFlex}>
        <div style={s.authCard}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "2.8rem", marginBottom: 16 }}>🎉</div>
            <h2 style={s.authH2}>Group Created!</h2>
            <p style={{ fontSize: "0.875rem", color: C.textMuted, marginBottom: 24 }}>Share this code with your friends</p>
            <div style={s.codeDisplay}>{created.code}</div>
            <p style={{ fontSize: "0.8rem", color: C.textMuted, marginBottom: 28 }}>Anyone with this code can join your group</p>
            <button style={{ ...s.btnPrimary, width: "100%", padding: "14px" }} onClick={() => onCreate(created)}>Go to Group →</button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={s.lightPage}>
      <nav style={s.lightNav}>
        <button style={s.backBtn} onClick={onBack}>← Back</button>
        <Logo />
        <span style={{ width: 60 }} />
      </nav>
      <div style={s.centerFlex}>
        <div style={s.authCard}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: "2.5rem", marginBottom: 14 }}>⚙️</div>
            <h2 style={s.authH2}>Create a Group</h2>
            <p style={{ fontSize: "0.875rem", color: C.textMuted }}>Set up your pool and invite friends</p>
          </div>
          <label style={s.label}>Group Name</label>
          <input style={s.input} placeholder="e.g. Office Madness 2026" value={name} onChange={e => setName(e.target.value)} />
          <label style={s.label}>Tournament</label>
          <div style={{ marginBottom: 20, fontSize: "0.85rem", color: C.textMuted }}>Men's NCAA Tournament 2026</div>
          <button style={{ ...s.btnPrimary, width: "100%", padding: "14px", opacity: name.length < 2 || loading ? 0.4 : 1 }} onClick={handleCreate} disabled={name.length < 2 || loading}>
            {loading ? "Creating..." : "Create Group →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── JOIN GROUP ───────────────────────────────────────────────────────────────
function JoinGroup({ session, onJoin, onBack, showToast }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (code.length < 3) return;
    setLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/groups?code=eq.${code}&select=*`, {
        headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${session.token}`, "Content-Type": "application/json" },
      });
      const groups = await res.json();
      if (!groups?.length) throw new Error("Group not found. Check the code and try again.");
      const group = groups[0];
      const existingRes = await fetch(`${SUPABASE_URL}/rest/v1/group_members?group_id=eq.${group.id}&user_id=eq.${session.user.id}`, {
        headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${session.token}`, "Content-Type": "application/json" },
      });
      const existing = await existingRes.json();
      if (existing?.length) { onJoin(group); return; }
      await fetch(`${SUPABASE_URL}/rest/v1/group_members`, {
        method: "POST",
        headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${session.token}`, "Content-Type": "application/json", "Prefer": "return=minimal" },
        body: JSON.stringify({ group_id: group.id, user_id: session.user.id }),
      });
      onJoin(group);
    } catch (err) {
      showToast("Error: " + (err.message || JSON.stringify(err)), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.lightPage}>
      <nav style={s.lightNav}>
        <button style={s.backBtn} onClick={onBack}>← Back</button>
        <Logo />
        <span style={{ width: 60 }} />
      </nav>
      <div style={s.centerFlex}>
        <div style={s.authCard}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: "2.5rem", marginBottom: 14 }}>🔗</div>
            <h2 style={s.authH2}>Join a Group</h2>
            <p style={{ fontSize: "0.875rem", color: C.textMuted }}>Enter the code from your invite</p>
          </div>
          <input style={{ ...s.input, textAlign: "center", letterSpacing: "0.3em", fontSize: "1.8rem", fontWeight: 900, textTransform: "uppercase", padding: "16px 14px" }}
            placeholder="ABC123" value={code} onChange={e => setCode(e.target.value.toUpperCase())} maxLength={8}
            onKeyDown={e => e.key === "Enter" && handleJoin()} />
          <button style={{ ...s.btnPrimary, width: "100%", padding: "14px", opacity: code.length < 3 || loading ? 0.4 : 1 }} onClick={handleJoin} disabled={code.length < 3 || loading}>
            {loading ? "Searching..." : "Join Group →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── GROUP SCREEN ─────────────────────────────────────────────────────────────
function GroupScreen({ group, session, activeTab, setActiveTab, onBack, showToast }) {
  const [matchups, setMatchups] = useState([]);
  const [myPicks, setMyPicks] = useState({});
  const [leaderboard, setLeaderboard] = useState([]);
  const [round, setRound] = useState(null);
  const [loading, setLoading] = useState(true);
const [editingName, setEditingName] = useState(false);
const [newName, setNewName] = useState(session.profile?.display_name || "");
const [savingName, setSavingName] = useState(false);

const handleSaveName = async () => {
  if (!newName.trim()) return;
  setSavingName(true);
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${session.user.id}`, {
      method: "PATCH",
      headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${session.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ display_name: newName.trim() }),
    });
    session.profile.display_name = newName.trim();
    setEditingName(false);
    showToast("Name updated! ✓");
  } catch (err) {
    showToast("Couldn't update name: " + err.message, "error");
  } finally {
    setSavingName(false);
  }
};
  const [memberCount, setMemberCount] = useState(0);
  const [espnWinners, setEspnWinners] = useState({});
  const [scoringLoading, setScoringLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [testWinners, setTestWinners] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleTestWinner = (name) => setTestWinners(w => ({ ...w, [name]: true }));
  const handleClearTest = () => setTestWinners({});

  useEffect(() => { loadGroupData(); }, [group.id]);

  useEffect(() => {
    const interval = setInterval(() => { if (round?.is_locked) refreshScores(); }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [round]);

  const refreshScores = async () => {
    setScoringLoading(true);
    try {
      const winners = await fetchESPNWinners();
      setEspnWinners(winners);
      setLastUpdated(new Date());
    } catch { } finally { setScoringLoading(false); }
  };

  const loadGroupData = async () => {
    setLoading(true);
    try {
      const rounds = await supabase(`rounds?group_id=eq.${group.id}&round_number=eq.${group.current_round}&select=*`, { token: session.token });
      const currentRound = rounds?.[0];
      setRound(currentRound);

      if (currentRound) {
        const mps = await supabase(`matchups?round_id=eq.${currentRound.id}&select=*&order=region.asc`, { token: session.token });
        setMatchups(mps || []);
        const pickIds = (mps || []).map(m => m.id).join(",");
        if (pickIds) {
          const picks = await supabase(`picks?user_id=eq.${session.user.id}&matchup_id=in.(${pickIds})&select=*`, { token: session.token });
          const pickMap = {};
          (picks || []).forEach(p => { pickMap[p.matchup_id] = p.picked_team; });
          setMyPicks(pickMap);
        }
      }

      const members = await supabase(`group_members?group_id=eq.${group.id}&select=user_id`, { token: session.token });
      setMemberCount(members?.length || 0);
      await loadLeaderboard(currentRound, members);

      const winners = await fetchESPNWinners();
      setEspnWinners(winners);
      setLastUpdated(new Date());
    } catch (err) {
      showToast("Error loading group: " + err.message, "error");
    } finally {
      setLoading(false);
      setScoringLoading(false);
    }
  };

const loadLeaderboard = async (currentRound, members) => {
    try {
      if (!members?.length) return;
      const profiles = await supabase(`profiles?id=in.(${members.map(m => m.user_id).join(",")})&select=*`, { token: session.token });
      // Load ALL rounds for this group for cumulative scoring
      const allRounds = await supabase(`rounds?group_id=eq.${group.id}&select=*&order=round_number.asc`, { token: session.token }) || [];
      let allPicksWithRound = [];
      for (const r of allRounds) {
        const mps = await supabase(`matchups?round_id=eq.${r.id}&select=id`, { token: session.token }) || [];
        const pickIds = mps.map(m => m.id).join(",");
        if (pickIds) {
          const picks = await supabase(`picks?matchup_id=in.(${pickIds})&select=*`, { token: session.token }) || [];
          picks.forEach(p => allPicksWithRound.push({ ...p, roundNumber: r.round_number }));
        }
      }
      const lb = (profiles || []).map(p => ({
        id: p.id, name: p.display_name,
        picks: allPicksWithRound.filter(pk => pk.user_id === p.id),
        isMe: p.id === session.user.id,
      }));
      setLeaderboard(lb);
    } catch { }
  };
const ADMIN_USER_ID = "27fcf0ef-709d-4ab1-a9fe-4d02e5bab76f";
  const isAdmin = session.user.id === ADMIN_USER_ID;

  const handleAdvanceRound = async () => {
    if (!window.confirm(`Advance to Round ${(group.current_round || 1) + 1}? Make sure all Round ${group.current_round} games are complete.`)) return;
    try {
      const nextRound = (group.current_round || 1) + 1;
      if (nextRound > 6) { showToast("Tournament is complete!", "error"); return; }

      // Lock current round
      await fetch(`${SUPABASE_URL}/rest/v1/rounds?group_id=eq.${group.id}&round_number=eq.${group.current_round}`, {
        method: "PATCH",
        headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${session.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ is_locked: true }),
      });

      // Get current matchups and ESPN winners
      const winners = await fetchESPNWinners();
      const allWinnersNow = { ...winners, ...testWinners };
      const currentMatchups = await supabase(`matchups?round_id=eq.${round.id}&select=*&order=region.asc`, { token: session.token }) || [];

      // Build next round matchups: winners of each pair of games advance
      const nextMatchups = [];
      REGIONS.forEach(region => {
        const regionMps = currentMatchups.filter(m => m.region === region);
        // Pair games: game 0 winner vs game 1 winner, game 2 winner vs game 3 winner, etc.
        for (let i = 0; i < regionMps.length; i += 2) {
          const g1 = regionMps[i];
          const g2 = regionMps[i + 1];
          if (!g1 || !g2) continue;
          const w1 = teamNameMatch(g1.team1_name, allWinnersNow) ? g1.team1_name : g1.team2_name;
          const w1seed = teamNameMatch(g1.team1_name, allWinnersNow) ? g1.team1_seed : g1.team2_seed;
          const w2 = teamNameMatch(g2.team1_name, allWinnersNow) ? g2.team1_name : g2.team2_name;
          const w2seed = teamNameMatch(g2.team1_name, allWinnersNow) ? g2.team1_seed : g2.team2_seed;
          nextMatchups.push({ team1_name: w1, team1_seed: w1seed, team2_name: w2, team2_seed: w2seed, region });
        }
      });

      // Round deadlines
      const deadlines = [
        "2026-03-20T17:00:00Z", // R1 (already passed)
        "2026-03-22T12:00:00Z", // R2
        "2026-03-27T12:00:00Z", // Sweet 16
        "2026-03-29T12:00:00Z", // Elite 8
        "2026-04-04T18:00:00Z", // Final Four
        "2026-04-06T20:00:00Z", // Championship
      ];

      // Create new round
      const newRounds = await supabase("rounds", {
        method: "POST", token: session.token, prefer: "return=representation",
        body: { group_id: group.id, round_number: nextRound, deadline: deadlines[nextRound - 1], is_locked: false },
      });
      const newRound = Array.isArray(newRounds) ? newRounds[0] : newRounds;

      // Create matchups for new round
      const matchupRows = nextMatchups.map(m => ({ ...m, round_id: newRound.id }));
      await supabase("matchups", { method: "POST", token: session.token, body: matchupRows });

      // Advance group round number
      await fetch(`${SUPABASE_URL}/rest/v1/groups?id=eq.${group.id}`, {
        method: "PATCH",
        headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${session.token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ current_round: nextRound }),
      });

      showToast(`Round ${nextRound} is live! 🏀`);
      group.current_round = nextRound;
      loadGroupData();
    } catch (err) {
      showToast("Error advancing round: " + err.message, "error");
    }
  };
  const handlePick = (matchupId, teamName) => {
    if (round?.is_locked) return;
    setSaved(false);
    setMyPicks(p => ({ ...p, [matchupId]: teamName }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const [matchupId, teamName] of Object.entries(myPicks)) {
        const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/picks?user_id=eq.${session.user.id}&matchup_id=eq.${matchupId}&select=id`, {
          headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${session.token}` },
        });
        const existing = await checkRes.json();
        if (existing?.length) {
          await fetch(`${SUPABASE_URL}/rest/v1/picks?user_id=eq.${session.user.id}&matchup_id=eq.${matchupId}`, {
            method: "PATCH",
            headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${session.token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ picked_team: teamName, updated_at: new Date().toISOString() }),
          });
        } else {
          await fetch(`${SUPABASE_URL}/rest/v1/picks`, {
            method: "POST",
            headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${session.token}`, "Content-Type": "application/json", "Prefer": "return=minimal" },
            body: JSON.stringify({ user_id: session.user.id, matchup_id: matchupId, picked_team: teamName, updated_at: new Date().toISOString() }),
          });
        }
      }
      setSaved(true);
      showToast("Picks saved! 🏀");
    } catch (err) {
      showToast("Couldn't save picks: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const allWinners = { ...espnWinners, ...testWinners };
  const picksCount = Object.keys(myPicks).length;
  const total = matchups.length;
  const deadline = round?.deadline ? new Date(round.deadline) : new Date("2026-03-20T17:00:00Z");
  const countdown = useCountdown(deadline.getTime());
  const deadlinePassed = round?.is_locked || countdown.expired;

return (
    <div style={s.lightPage}>
      {editingName && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: C.surface, borderRadius: 20, padding: "32px 28px", width: "100%", maxWidth: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: C.navy, marginBottom: 6 }}>Update Your Name</h3>
            <p style={{ fontSize: "0.82rem", color: C.textMuted, marginBottom: 20 }}>This is how you appear on leaderboards.</p>
            <input style={s.input} value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSaveName()} autoFocus />
            <div style={{ display: "flex", gap: 10 }}>
              <button style={{ ...s.btnOutline, flex: 1 }} onClick={() => setEditingName(false)}>Cancel</button>
              <button style={{ ...s.btnPrimary, flex: 1, opacity: savingName ? 0.6 : 1 }} onClick={handleSaveName} disabled={savingName}>
                {savingName ? "Saving..." : "Save Name"}
              </button>
            </div>
          </div>
        </div>
      )}
      <div style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.navyMid})`, paddingBottom: 60 }}>
        <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 28px" }}>
          <button style={{ ...s.backBtn, color: "rgba(255,255,255,0.7)" }} onClick={onBack}>← Groups</button>
          <Logo light />
          <div style={{ width: 60 }} />
        </nav>
        <div style={{ padding: "8px 32px 0", maxWidth: 680, margin: "0 auto" }}>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", marginBottom: 10 }}>{group.name}</h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={s.lightChip}>{ROUND_NAMES[(group.current_round || 1) - 1]}</span>
            <span style={s.lightChipYellow}>{ROUND_POINTS[(group.current_round || 1) - 1]} pt{ROUND_POINTS[(group.current_round || 1) - 1] > 1 ? "s" : ""} per pick</span>
            <span style={s.lightChip}>{memberCount} players</span>
            <span style={s.lightChip}>Code: {group.code}</span>
            {isAdmin && <span style={{ background: "#fbbf24", color: "#92400e", padding: "5px 12px", borderRadius: 100, fontSize: "0.72rem", fontWeight: 700, cursor: "pointer" }} onClick={handleAdvanceRound}>⚡ Advance Round</span>}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: "-40px auto 0", padding: "0 20px 100px", position: "relative", zIndex: 1 }}>
        <div style={s.tabCard}>
          <div style={s.tabRow}>
            <button style={activeTab === "picks" ? s.tabOn : s.tabOff} onClick={() => setActiveTab("picks")}>📋 My Picks</button>
            <button style={activeTab === "leaderboard" ? s.tabOn : s.tabOff} onClick={() => setActiveTab("leaderboard")}>🏆 Leaderboard</button>
          </div>
          <div style={{ padding: "0 24px 32px" }}>
            {loading && <div style={{ padding: "40px 0", textAlign: "center", color: C.textMuted }}>Loading...</div>}
            {!loading && activeTab === "picks" && (
             <PicksTab matchups={matchups} myPicks={myPicks} onPick={handlePick}
                onSave={handleSave} saving={saving} saved={saved}
                picksCount={picksCount} total={total} countdown={countdown}
                deadlinePassed={deadlinePassed} espnWinners={allWinners} deadline={deadline} />
            )}
            {!loading && activeTab === "leaderboard" && (
              <LeaderboardTab leaderboard={leaderboard} group={group}
                memberCount={memberCount} deadlinePassed={deadlinePassed}
                scoringLoading={scoringLoading} lastUpdated={lastUpdated}
                onRefresh={refreshScores} espnWinners={allWinners}
                testWinners={testWinners} onTestWinner={handleTestWinner}
                onClearTest={handleClearTest} />
            )}
          </div>
        </div>
      </div>

      {activeTab === "picks" && !deadlinePassed && (
        <div style={s.floater}>
          <button style={{ ...s.btnPrimary, width: "100%", padding: "15px", fontSize: "1rem", textAlign: "center", boxSizing: "border-box", opacity: saving ? 0.6 : 1 }}
            onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : saved ? "✓ Picks Saved!" : "Save My Picks"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── PICKS TAB ────────────────────────────────────────────────────────────────
function PicksTab({ matchups, myPicks, onPick, onSave, saving, saved, picksCount, total, countdown, deadlinePassed, espnWinners }) {
  return (
    <div style={{ paddingTop: 20 }}>
      {!deadlinePassed ? (
        <div style={s.deadlineBanner}>
<div>
            <div style={{ fontWeight: 700, fontSize: "0.9rem", color: C.green }}>⏰ Pick your winners before tipoff</div>
            <div style={{ fontSize: "0.75rem", color: C.textMuted, marginTop: 2 }}>Hit Save when you're done</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "1.25rem", fontWeight: 900, color: C.green, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>
              {countdown.days > 0 ? `${countdown.days}d ${countdown.h}h` : `${String(countdown.h).padStart(2, "0")}:${String(countdown.m).padStart(2, "0")}:${String(countdown.s).padStart(2, "0")}`}
            </div>
            <div style={{ fontSize: "0.62rem", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>remaining</div>
          </div>
        </div>
      ) : (
        <div style={{ ...s.deadlineBanner, background: C.redFade, borderColor: "rgba(204,0,0,0.2)" }}>
          <div style={{ fontWeight: 700, fontSize: "0.9rem", color: C.red }}>🔒 Picks locked — Round in progress</div>
        </div>
      )}

      <div style={s.hiddenNotice}>
        <span>🔒</span>
        <span>Your picks are <strong>hidden from all other players</strong> until the round deadline passes.</span>
      </div>

      {!deadlinePassed && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: "0.78rem", color: C.textMuted, fontWeight: 500 }}>Games picked</span>
            <span style={{ fontSize: "0.78rem", fontWeight: 700 }}>
              <span style={{ color: picksCount < total ? C.red : C.green }}>{picksCount}</span>
              <span style={{ color: C.textLight }}> / {total}</span>
            </span>
          </div>
          <div style={{ height: 8, background: C.borderLight, borderRadius: 100, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${total > 0 ? (picksCount / total) * 100 : 0}%`, borderRadius: 100, background: `linear-gradient(90deg, ${C.ncaaBlue}, ${C.ncaaBlueLight})`, transition: "width 0.3s ease" }} />
          </div>
        </div>
      )}

      {matchups.length === 0 && <div style={s.emptyBox}>No matchups found for this round.</div>}

      {REGIONS.map(region => {
        const regionMatchups = matchups.filter(m => m.region === region);
        if (!regionMatchups.length) return null;
        return (
          <div key={region} style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingBottom: 10, borderBottom: `2px solid ${C.ncaaBlue}` }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: C.ncaaBlue }}>{region} Region</span>
              <span style={{ fontSize: "0.72rem", color: C.textMuted }}>{regionMatchups.filter(m => myPicks[m.id]).length}/{regionMatchups.length} picked</span>
            </div>
            {regionMatchups.map(m => (
              <MatchupCard key={m.id} matchup={m} pick={myPicks[m.id]} onPick={onPick} locked={deadlinePassed} espnWinners={espnWinners} />
            ))}
          </div>
        );
      })}
  </div>
  );
}
// ─── MATCHUP CARD ─────────────────────────────────────────────────────────────

// ─── MATCHUP CARD ─────────────────────────────────────────────────────────────
function MatchupCard({ matchup, pick, onPick, locked, espnWinners }) {
  const team1Won = Object.keys(espnWinners).length > 0 && teamNameMatch(matchup.team1_name, espnWinners);
  const team2Won = Object.keys(espnWinners).length > 0 && teamNameMatch(matchup.team2_name, espnWinners);
  const gameComplete = team1Won || team2Won;

  const pickTeam1 = (e) => { e.preventDefault(); e.stopPropagation(); if (!locked) onPick(matchup.id, matchup.team1_name); };
  const pickTeam2 = (e) => { e.preventDefault(); e.stopPropagation(); if (!locked) onPick(matchup.id, matchup.team2_name); };

  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", marginBottom: 10, background: C.surface, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
      <TeamRow team={{ name: matchup.team1_name, seed: matchup.team1_seed, region: matchup.region }}
        selected={pick === matchup.team1_name} onPick={pickTeam1}
        locked={locked} won={team1Won} lost={gameComplete && !team1Won}
        correct={pick === matchup.team1_name && team1Won} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", borderTop: `1px solid ${C.borderLight}`, borderBottom: `1px solid ${C.borderLight}`, padding: "2px 0", background: C.surfaceGray, pointerEvents: "none" }}>
        <span style={{ fontSize: "0.6rem", fontWeight: 900, letterSpacing: "0.12em", color: C.textLight, pointerEvents: "none" }}>VS</span>
      </div>
      <TeamRow team={{ name: matchup.team2_name, seed: matchup.team2_seed, region: matchup.region }}
        selected={pick === matchup.team2_name} onPick={pickTeam2}
        locked={locked} won={team2Won} lost={gameComplete && !team2Won}
        correct={pick === matchup.team2_name && team2Won} />
    </div>
  );
}

// ─── TEAM ROW ─────────────────────────────────────────────────────────────────
function TeamRow({ team, selected, onPick, locked, won, lost, correct }) {
  let bg = "transparent";
  let borderColor = "transparent";
  if (correct) { bg = "rgba(22,163,74,0.08)"; borderColor = C.green; }
  else if (selected && lost) { bg = C.redFade; borderColor = C.red; }
  else if (selected) { bg = C.ncaaBlueFade; borderColor = C.ncaaBlue; }

  const handleTouch = (e) => { e.preventDefault(); e.stopPropagation(); if (!locked) onPick(e); };

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14, padding: "18px 16px", minHeight: 64,
      background: bg, borderLeft: `3px solid ${borderColor}`,
      cursor: locked ? "default" : "pointer",
      opacity: lost && !selected ? 0.4 : 1,
      transition: "background 0.15s",
      WebkitTapHighlightColor: "transparent",
      userSelect: "none",
    }}
      onTouchEnd={handleTouch}
      onClick={(e) => { if (!("ontouchstart" in window)) { e.preventDefault(); if (!locked) onPick(e); } }}
    >
<div style={{ position: "relative", flexShrink: 0, width: 44, height: 44, pointerEvents: "none" }}>
        {getLogoUrl(team.name) ? (
          <img src={getLogoUrl(team.name)} alt={team.name}
            style={{ width: 44, height: 44, objectFit: "contain" }}
            onError={e => { e.target.style.display = "none"; e.target.nextElementSibling.style.display = "flex"; }} />
        ) : null}
        <div style={{
          display: getLogoUrl(team.name) ? "none" : "flex",
          width: 44, height: 44, borderRadius: 8, alignItems: "center", justifyContent: "center",
          background: team.seed <= 2 ? C.ncaaBlueFadeMed : C.surfaceGray,
          border: `1px solid ${team.seed <= 2 ? "rgba(0,94,184,0.3)" : C.border}`,
          fontSize: "0.72rem", fontWeight: 800, color: team.seed <= 2 ? C.ncaaBlue : C.textMuted,
        }}>#{team.seed}</div>
        <div style={{ position: "absolute", bottom: -4, right: -4, background: team.seed <= 2 ? C.ncaaBlue : C.textMuted, color: "#fff", fontSize: "0.55rem", fontWeight: 800, borderRadius: 4, padding: "1px 4px", lineHeight: 1.4 }}>#{team.seed}</div>
      </div>
      <div style={{ flex: 1, pointerEvents: "none" }}>
        <div style={{ fontSize: "0.92rem", fontWeight: 700, color: C.text }}>{team.name}</div>
        <div style={{ fontSize: "0.68rem", color: C.textMuted, marginTop: 1 }}>{team.region} · Seed {team.seed}</div>
      </div>
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0, pointerEvents: "none" }}>
        {won && !correct && <span style={{ background: C.green, color: "#fff", padding: "3px 8px", borderRadius: 5, fontSize: "0.65rem", fontWeight: 700 }}>WON</span>}
        {lost && <span style={{ background: C.redFade, color: C.red, padding: "3px 8px", borderRadius: 5, fontSize: "0.65rem", fontWeight: 700 }}>OUT</span>}
        {selected && !won && !lost && <div style={{ background: C.ncaaBlue, color: "#fff", padding: "4px 10px", borderRadius: 6, fontSize: "0.7rem", fontWeight: 700 }}>✓ Picked</div>}
        {correct && <div style={{ background: C.green, color: "#fff", padding: "4px 10px", borderRadius: 6, fontSize: "0.7rem", fontWeight: 700 }}>✓ +1pt</div>}
      </div>
    </div>
  );
}

// ─── LEADERBOARD ─────────────────────────────────────────────────────────────
function LeaderboardTab({ leaderboard, group, memberCount, deadlinePassed, scoringLoading, lastUpdated, onRefresh, espnWinners, testWinners, onTestWinner, onClearTest }) {
  const [testInput, setTestInput] = useState("");
  const hasScores = Object.keys(espnWinners).length > 0;

const scoredLeaderboard = leaderboard
    .map(p => {
      if (!p.picks?.length || !hasScores) return { ...p, points: 0, correct: 0 };
      let totalPoints = 0;
      let totalCorrect = 0;
      p.picks.forEach(pick => {
        if (teamNameMatch(pick.picked_team, espnWinners)) {
          const pts = ROUND_POINTS[(pick.roundNumber || 1) - 1];
          totalPoints += pts;
          totalCorrect++;
        }
      });
      return { ...p, points: totalPoints, correct: totalCorrect };
    })
    .sort((a, b) => b.points - a.points);

  return (
    <div style={{ paddingTop: 20 }}>
      {!deadlinePassed && (
        <div style={{ ...s.hiddenNotice, background: C.redFade, borderColor: "rgba(204,0,0,0.18)" }}>
          <span>🔒</span>
          <div>
            <div style={{ fontWeight: 700, color: C.red, marginBottom: 2 }}>Picks hidden until deadline</div>
            <div>Standings show, but no one can see what anyone picked until the round locks.</div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: "0.78rem", color: C.textMuted }}>
          {scoringLoading ? "⟳ Fetching live scores..." : Object.keys(espnWinners).length > 0 && Object.keys(testWinners || {}).length === 0 ? "⚡ ESPN scores live" : Object.keys(testWinners || {}).length > 0 ? "🧪 Test mode active" : "No games completed yet"}
          {lastUpdated && !scoringLoading && <span style={{ marginLeft: 6, color: C.textLight }}>· {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
        </div>
        <button style={{ background: "none", border: `1px solid ${C.border}`, color: C.ncaaBlue, padding: "4px 10px", borderRadius: 6, cursor: "pointer", fontSize: "0.72rem", fontWeight: 600, fontFamily: "inherit" }}
          onClick={onRefresh} disabled={scoringLoading}>
          {scoringLoading ? "..." : "Refresh"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 0, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", marginBottom: 24 }}>
        {[{ v: memberCount, l: "Players" }, { v: `Rd ${group.current_round}`, l: "Current Round" }, { v: `${ROUND_POINTS[(group.current_round || 1) - 1]}pt`, l: "Per Pick" }].map((st, i) => (
          <div key={st.l} style={{ flex: 1, padding: "16px 12px", textAlign: "center", borderRight: i < 2 ? `1px solid ${C.border}` : "none", background: C.surface }}>
            <div style={{ fontSize: "1.4rem", fontWeight: 900, color: C.ncaaBlue, letterSpacing: "-0.03em" }}>{st.v}</div>
            <div style={{ fontSize: "0.65rem", color: C.textMuted, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.06em" }}>{st.l}</div>
          </div>
        ))}
      </div>

      {scoredLeaderboard.length === 0 && <div style={s.emptyBox}>No players yet.</div>}
      {scoredLeaderboard.map((p, i) => (
        <div key={p.id} style={{
          display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
          background: p.isMe ? C.ncaaBlueFade : C.surface,
          border: `1px solid ${p.isMe ? "rgba(0,94,184,0.25)" : C.border}`,
          borderRadius: 12, marginBottom: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}>
          <div style={{ width: 32, textAlign: "center", fontSize: i < 3 ? "1.1rem" : "0.82rem", fontWeight: 700, color: C.textMuted }}>
            {i < 3 ? ["🥇", "🥈", "🥉"][i] : `#${i + 1}`}
          </div>
          <div style={{
            width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
            background: p.isMe ? `linear-gradient(135deg, ${C.ncaaBlue}, ${C.ncaaBlueDark})` : C.surfaceGray,
            border: `1px solid ${p.isMe ? C.ncaaBlue : C.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.68rem", fontWeight: 800, color: p.isMe ? "#fff" : C.textMuted,
          }}>{(p.name || "?").slice(0, 2).toUpperCase()}</div>
          <div style={{ flex: 1, fontWeight: 600, fontSize: "0.9rem", color: C.text }}>
            {p.name}
            {p.isMe && <span style={{ background: C.ncaaBlue, color: "#fff", padding: "2px 7px", borderRadius: 4, fontSize: "0.62rem", fontWeight: 700, marginLeft: 6 }}>YOU</span>}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 800, fontSize: "1rem", color: hasScores ? C.ncaaBlue : C.textMuted }}>{hasScores ? `${p.points} pts` : "—"}</div>
            <div style={{ fontSize: "0.72rem", color: C.textMuted }}>{hasScores ? `${p.correct} correct` : "awaiting games"}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
// ─── RULES PAGE ───────────────────────────────────────────────────────────────
function RulesPage({ onBack }) {
  return (
    <div style={s.lightPage}>
      <div style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.navyMid})`, paddingBottom: 48 }}>
        <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 28px" }}>
          <button style={{ ...s.backBtn, color: "rgba(255,255,255,0.7)" }} onClick={onBack}>← Back</button>
          <Logo light />
          <span style={{ width: 60 }} />
        </nav>
        <div style={{ padding: "8px 32px 0", maxWidth: 680, margin: "0 auto" }}>
          <h2 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", marginBottom: 4 }}>How to Play</h2>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.875rem" }}>Round 2 Round · March Madness 2026</p>
        </div>
      </div>
      <div style={{ maxWidth: 680, margin: "-32px auto 0", padding: "0 24px 60px", position: "relative", zIndex: 1 }}>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "28px 24px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", gap: 28 }}>

          <div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: C.navy, marginBottom: 8 }}>🏀 How It Works</div>
            <div style={{ fontSize: "0.88rem", color: C.textMid, lineHeight: 1.7 }}>
              Round 2 Round is a round-by-round March Madness pool. Instead of filling out a full bracket upfront, you pick the winners for each round as it happens. Make your picks, save them before the deadline, and see how you stack up on the leaderboard.
            </div>
          </div>

          <div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: C.navy, marginBottom: 8 }}>📋 Picking Rules</div>
            <div style={{ fontSize: "0.88rem", color: C.textMid, lineHeight: 1.7 }}>
              <p style={{ marginBottom: 8 }}>• Pick the winner of each matchup before the round deadline.</p>
              <p style={{ marginBottom: 8 }}>• You do <strong>not</strong> need to pick Play-In games. The Round of 64 is your first round of picks.</p>
              <p style={{ marginBottom: 8 }}>• All picks for a round must be submitted before the <strong>first game of that round tips off</strong>. Once that first game starts, the entire round locks and no more changes can be made.</p>
              <p style={{ marginBottom: 8 }}>• You can change your picks as many times as you want before the deadline — but don't forget to hit <strong>Save</strong>!</p>
              <p>• Picks are <strong>hidden from all other players</strong> until the round locks. No peeking at what others picked before the deadline.</p>
            </div>
          </div>

          <div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: C.navy, marginBottom: 12 }}>🏆 Scoring</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {ROUND_NAMES.map((r, i) => (
                <div key={r} style={{ background: i === 5 ? C.ncaaBlueFade : C.surfaceGray, border: `1px solid ${i === 5 ? "rgba(0,94,184,0.25)" : C.border}`, borderRadius: 10, padding: "12px 10px", textAlign: "center" }}>
                  <div style={{ fontSize: "1.6rem", fontWeight: 900, color: i === 5 ? C.ncaaBlue : C.text }}>{ROUND_POINTS[i]}</div>
                  <div style={{ fontSize: "0.6rem", color: C.textMuted, textTransform: "uppercase", fontWeight: 700 }}>pt{ROUND_POINTS[i] > 1 ? "s" : ""}</div>
                  <div style={{ fontSize: "0.72rem", color: C.textMid, marginTop: 4, fontWeight: 500 }}>{r}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: "0.82rem", color: C.textMuted, marginTop: 12, lineHeight: 1.6 }}>
              Points increase each round — a correct Championship pick is worth 6x a first round pick. Every correct pick counts!
            </div>
          </div>

          <div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: C.navy, marginBottom: 8 }}>🥇 Winning</div>
            <div style={{ fontSize: "0.88rem", color: C.textMid, lineHeight: 1.7 }}>
              The player with the most total points at the end of the tournament wins. Points accumulate across all rounds — so even if you have a rough first round, big upsets later can turn things around!
            </div>
          </div>

          <div style={{ background: C.ncaaBlueFade, border: `1px solid rgba(0,94,184,0.2)`, borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ fontSize: "0.88rem", color: C.ncaaBlue, fontWeight: 700, marginBottom: 4 }}>💡 Pro Tip</div>
            <div style={{ fontSize: "0.82rem", color: C.textMid, lineHeight: 1.6 }}>Don't wait until the last minute! Set your picks early and save them. The round locks the moment the first game tips off — no exceptions.</div>
          </div>

        </div>
      </div>
    </div>
  );
}
// ─── LOGO ────────────────────────────────────────────────────────────────────
function Logo({ light = false }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: light ? "rgba(255,255,255,0.15)" : C.ncaaBlue, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0, boxShadow: light ? "none" : "0 2px 8px rgba(0,94,184,0.3)" }}>🏀</div>
      <div>
        <div style={{ fontSize: "1rem", fontWeight: 900, letterSpacing: "-0.02em", color: light ? "#fff" : C.navy, lineHeight: 1.1 }}>Round 2 Round</div>
        <div style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.1em", color: light ? "rgba(255,255,255,0.6)" : C.textMuted, textTransform: "uppercase" }}>R2R · March Madness</div>
      </div>
    </div>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const s = {
  lightPage: { minHeight: "100vh", background: C.bg, fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif", color: C.text },
  lightNav: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 28px", borderBottom: `1px solid ${C.border}`, background: C.surface, position: "sticky", top: 0, zIndex: 10, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  backBtn: { background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: "0.875rem", fontWeight: 500, fontFamily: "inherit" },
  navBtnLight: { background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", padding: "8px 18px", borderRadius: 8, cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, fontFamily: "inherit" },
  heroBadge: { display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.85)", padding: "6px 16px", borderRadius: 100, fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.03em" },
  liveDot: { width: 7, height: 7, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 8px #4ade80", display: "inline-block" },
  btnHeroMain: { background: "#fff", color: C.ncaaBlue, border: "none", padding: "14px 32px", borderRadius: 10, cursor: "pointer", fontWeight: 800, fontSize: "1rem", boxShadow: "0 4px 20px rgba(0,0,0,0.2)", fontFamily: "inherit" },
  btnHeroGhost: { background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)", padding: "14px 32px", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: "1rem", fontFamily: "inherit" },
  sectionLabel: { fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", color: C.ncaaBlue, marginBottom: 10 },
  sectionH2: { fontSize: "clamp(1.6rem,4vw,2.2rem)", fontWeight: 800, letterSpacing: "-0.03em", color: C.navy },
  featureCard: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "28px 24px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" },
  featureN: { fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.1em", color: C.ncaaBlue, marginBottom: 8, textTransform: "uppercase" },
  btnPrimary: { background: `linear-gradient(135deg, ${C.ncaaBlue}, ${C.ncaaBlueDark})`, color: "#fff", border: "none", padding: "12px 28px", borderRadius: 10, cursor: "pointer", fontWeight: 700, fontSize: "0.95rem", boxShadow: "0 4px 16px rgba(0,94,184,0.3)", fontFamily: "inherit" },
  btnOutline: { background: "transparent", color: C.ncaaBlue, border: `1.5px solid ${C.ncaaBlue}`, padding: "11px 20px", borderRadius: 10, cursor: "pointer", fontWeight: 600, fontSize: "0.875rem", fontFamily: "inherit" },
  centerFlex: { display: "flex", justifyContent: "center", alignItems: "center", minHeight: "calc(100vh - 65px)", padding: "32px 24px" },
  authCard: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: "40px 36px", width: "100%", maxWidth: 440, boxShadow: "0 8px 40px rgba(0,0,0,0.08)" },
  authH2: { fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.03em", color: C.navy, marginBottom: 6 },
  label: { display: "block", fontSize: "0.72rem", fontWeight: 700, color: C.textMid, marginBottom: 6, letterSpacing: "0.04em", textTransform: "uppercase" },
  input: { width: "100%", boxSizing: "border-box", background: C.surfaceGray, border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", color: C.text, fontSize: "0.95rem", outline: "none", marginBottom: 16, fontFamily: "inherit" },
  toggleOn: { flex: 1, padding: "10px", borderRadius: 8, border: `1.5px solid ${C.ncaaBlue}`, background: C.ncaaBlueFade, color: C.ncaaBlue, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },
  toggleOff: { flex: 1, padding: "10px", borderRadius: 8, border: `1.5px solid ${C.border}`, background: "transparent", color: C.textMuted, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" },
  switchP: { textAlign: "center", color: C.textMuted, fontSize: "0.85rem", marginTop: 20 },
  switchLink: { color: C.ncaaBlue, cursor: "pointer", fontWeight: 600 },
  codeDisplay: { background: C.ncaaBlueFade, border: `2px dashed ${C.ncaaBlue}`, borderRadius: 14, padding: "20px", textAlign: "center", fontSize: "2.2rem", fontWeight: 900, letterSpacing: "0.2em", color: C.ncaaBlue, margin: "0 0 16px" },
  groupCard: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px", marginBottom: 12, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" },
  groupCardIcon: { width: 44, height: 44, borderRadius: 12, background: C.ncaaBlueFade, border: `1px solid rgba(0,94,184,0.2)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", flexShrink: 0 },
  roundBadge: { background: C.ncaaBlueFade, border: `1px solid rgba(0,94,184,0.25)`, color: C.ncaaBlue, padding: "5px 12px", borderRadius: 100, fontSize: "0.72rem", fontWeight: 700 },
  infoCard: { display: "flex", gap: 16, alignItems: "flex-start", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "20px", marginTop: 8, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" },
  loadingBox: { textAlign: "center", padding: "48px 24px", color: C.textMuted, fontSize: "0.9rem" },
  emptyBox: { textAlign: "center", padding: "40px 24px", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, color: C.textMuted },
  errorBox: { background: C.redFade, border: `1px solid rgba(204,0,0,0.2)`, color: C.red, borderRadius: 10, padding: "12px 14px", marginBottom: 16, fontSize: "0.85rem", fontWeight: 500 },
  lightChip: { background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.8)", padding: "5px 12px", borderRadius: 100, fontSize: "0.72rem", fontWeight: 600 },
  lightChipYellow: { background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)", color: "#fbbf24", padding: "5px 12px", borderRadius: 100, fontSize: "0.72rem", fontWeight: 700 },
  tabCard: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", overflow: "hidden" },
  tabRow: { display: "flex", borderBottom: `1px solid ${C.border}` },
  tabOn: { flex: 1, padding: "16px 12px", background: C.surface, border: "none", borderBottom: `3px solid ${C.ncaaBlue}`, color: C.ncaaBlue, fontWeight: 700, cursor: "pointer", fontSize: "0.9rem", fontFamily: "inherit" },
  tabOff: { flex: 1, padding: "16px 12px", background: C.surfaceGray, border: "none", borderBottom: "3px solid transparent", color: C.textMuted, fontWeight: 500, cursor: "pointer", fontSize: "0.9rem", fontFamily: "inherit" },
  deadlineBanner: { display: "flex", justifyContent: "space-between", alignItems: "center", background: C.greenFade, border: "1px solid rgba(22,163,74,0.2)", borderRadius: 12, padding: "14px 18px", marginBottom: 14 },
  hiddenNotice: { display: "flex", alignItems: "flex-start", gap: 10, background: C.ncaaBlueFade, border: `1px solid rgba(0,94,184,0.18)`, borderRadius: 10, padding: "12px 14px", marginBottom: 20, fontSize: "0.8rem", color: C.textMid, lineHeight: 1.5 },
  floater: { position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 680, padding: "12px 24px 24px", background: `linear-gradient(to top, ${C.bg} 60%, transparent)`, zIndex: 50, boxSizing: "border-box" },
};
