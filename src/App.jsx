import { useState, useEffect, useCallback } from "react";

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

// ─── TEAMS DATA ───────────────────────────────────────────────────────────────
const TEAMS_MENS = [
  { id: 1, name: "Connecticut", seed: 1, region: "East" },
  { id: 2, name: "Iowa St.", seed: 2, region: "East" },
  { id: 3, name: "Illinois", seed: 3, region: "East" },
  { id: 4, name: "Auburn", seed: 4, region: "East" },
  { id: 5, name: "San Diego St.", seed: 5, region: "East" },
  { id: 6, name: "BYU", seed: 6, region: "East" },
  { id: 7, name: "Washington St.", seed: 7, region: "East" },
  { id: 8, name: "Florida Atlantic", seed: 8, region: "East" },
  { id: 9, name: "North Carolina", seed: 1, region: "West" },
  { id: 10, name: "Arizona", seed: 2, region: "West" },
  { id: 11, name: "Baylor", seed: 3, region: "West" },
  { id: 12, name: "Alabama", seed: 4, region: "West" },
  { id: 13, name: "Saint Mary's", seed: 5, region: "West" },
  { id: 14, name: "Clemson", seed: 6, region: "West" },
  { id: 15, name: "Dayton", seed: 7, region: "West" },
  { id: 16, name: "Mississippi St.", seed: 8, region: "West" },
  { id: 17, name: "Houston", seed: 1, region: "South" },
  { id: 18, name: "Marquette", seed: 2, region: "South" },
  { id: 19, name: "Kentucky", seed: 3, region: "South" },
  { id: 20, name: "Duke", seed: 4, region: "South" },
  { id: 21, name: "Wisconsin", seed: 5, region: "South" },
  { id: 22, name: "Texas Tech", seed: 6, region: "South" },
  { id: 23, name: "Florida", seed: 7, region: "South" },
  { id: 24, name: "Nebraska", seed: 8, region: "South" },
  { id: 25, name: "Purdue", seed: 1, region: "Midwest" },
  { id: 26, name: "Tennessee", seed: 2, region: "Midwest" },
  { id: 27, name: "Creighton", seed: 3, region: "Midwest" },
  { id: 28, name: "Kansas", seed: 4, region: "Midwest" },
  { id: 29, name: "Gonzaga", seed: 5, region: "Midwest" },
  { id: 30, name: "South Carolina", seed: 6, region: "Midwest" },
  { id: 31, name: "Texas", seed: 7, region: "Midwest" },
  { id: 32, name: "Utah St.", seed: 8, region: "Midwest" },
];

const ROUND_NAMES = ["Round of 64", "Round of 32", "Sweet 16", "Elite Eight", "Final Four", "Championship"];
const ROUND_POINTS = [1, 2, 3, 4, 5, 6];
const REGIONS = ["East", "West", "South", "Midwest"];

// ─── NCAA COLORS ──────────────────────────────────────────────────────────────
const C = {
  ncaaBlue: "#005eb8", ncaaBlueDark: "#004a94", ncaaBlueLight: "#1a73d4",
  ncaaBlueFade: "rgba(0,94,184,0.08)", ncaaBlueFadeMed: "rgba(0,94,184,0.15)",
  navy: "#001a3d", navyMid: "#002a5c",
  red: "#cc0000", redLight: "#e53333", redFade: "rgba(204,0,0,0.08)",
  bg: "#f4f6fa", bgWhite: "#ffffff", surface: "#ffffff",
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
  const [screen, setScreen] = useState("landing");
  const [session, setSession] = useState(null); // { token, user, profile }
  const [activeGroup, setActiveGroup] = useState(null);
  const [activeTab, setActiveTab] = useState("picks");
  const [authMode, setAuthMode] = useState("login");
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleLogout = () => { setSession(null); setScreen("landing"); setActiveGroup(null); };

  if (screen === "landing") return <Landing onLogin={() => setScreen("auth")} />;
  if (screen === "auth") return (
    <Auth mode={authMode} setMode={setAuthMode}
      onSuccess={(sess) => { setSession(sess); setScreen("dashboard"); }}
      showToast={showToast} />
  );
  if (screen === "create") return (
    <CreateGroup session={session} onCreate={(g) => { setActiveGroup(g); setScreen("dashboard"); showToast("Group created! 🎉"); }}
      onBack={() => setScreen("dashboard")} showToast={showToast} />
  );
  if (screen === "join") return (
    <JoinGroup session={session} onJoin={(g) => { setActiveGroup(g); setScreen("dashboard"); showToast("Joined group! 🏀"); }}
      onBack={() => setScreen("dashboard")} showToast={showToast} />
  );

  if (screen === "dashboard") {
    if (activeGroup) return (
      <GroupScreen group={activeGroup} session={session}
        activeTab={activeTab} setActiveTab={setActiveTab}
        onBack={() => { setActiveGroup(null); setActiveTab("picks"); }}
        showToast={showToast} />
    );
    return (
      <Dashboard session={session} onSelectGroup={(g) => setActiveGroup(g)}
        onCreateGroup={() => setScreen("create")} onJoinGroup={() => setScreen("join")}
        onLogout={handleLogout} showToast={showToast} />
    );
  }
  return null;
}

// ─── LANDING ─────────────────────────────────────────────────────────────────
function Landing({ onLogin }) {
  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif", color: C.text }}>
      <div style={{ background: `linear-gradient(160deg, ${C.navy} 0%, ${C.navyMid} 50%, ${C.ncaaBlueDark} 100%)`, paddingBottom: 80 }}>
        <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 32px", maxWidth: 1100, margin: "0 auto" }}>
          <Logo light />
          <button style={s.navBtnLight} onClick={onLogin}>Sign In</button>
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
            <button style={s.btnHeroMain} onClick={onLogin}>Create a Group</button>
            <button style={s.btnHeroGhost} onClick={onLogin}>Join with a Code</button>
          </div>
        </div>
      </div>
      <div style={{ background: C.ncaaBlue, padding: "14px 24px" }}>
        <div style={{ display: "flex", gap: 32, justifyContent: "center", flexWrap: "wrap" }}>
          {["🏆 Live Leaderboards", "🔒 Picks Hidden Until Deadline", "📱 Mobile Friendly", "⚡ Real-Time Scores"].map(t => (
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
            { icon: "🏆", n: "04", title: "Climb the Board", desc: "1pt Round 1, up to 6pts for the champion. Best overall picker wins." },
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
// Create profile
await supabase("profiles", {
  method: "POST",
  token,
  prefer: "return=representation",
  body: { id: userId, display_name: name || email.split("@")[0] },
});
onSuccess({ token, user: { id: userId, email }, profile: { display_name: name || email.split("@")[0] } });
        showToast("Account created! Welcome to R2R 🏀");
      } else {
        const data = await authRequest("token?grant_type=password", { email, password });
        const token = data.access_token;
        const profiles = await supabase(`profiles?id=eq.${data.user.id}&select=*`, { token });
        onSuccess({ token, user: data.user, profile: profiles?.[0] || { display_name: email.split("@")[0] } });
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
            <input style={s.input} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()} />
            <button style={{ ...s.btnPrimary, width: "100%", padding: "14px", marginTop: 8, fontSize: "1rem", opacity: loading ? 0.6 : 1 }}
              onClick={handleSubmit} disabled={loading}>
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
function Dashboard({ session, onSelectGroup, onCreateGroup, onJoinGroup, onLogout, showToast }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setLoading(true);
    try {
      // Get groups where user is a member
      const members = await supabase(
        `group_members?user_id=eq.${session.user.id}&select=group_id`,
        { token: session.token }
      );
      if (!members?.length) { setGroups([]); setLoading(false); return; }
      const ids = members.map(m => m.group_id).join(",");
      const gs = await supabase(
        `groups?id=in.(${ids})&select=*&order=created_at.desc`,
        { token: session.token }
      );
      setGroups(gs || []);
    } catch (err) {
      showToast("Couldn't load groups: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const initials = (session.profile?.display_name || "Me").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div style={s.lightPage}>
      <div style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.navyMid})`, paddingBottom: 48 }}>
        <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 28px" }}>
          <Logo light />
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.82rem" }}>{session.profile?.display_name}</span>
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
          <button style={s.btnOutline} onClick={onJoinGroup}>Join a Group</button>
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
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${session.token}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
      },
      body: JSON.stringify({ name, code, tournament, created_by: session.user.id, current_round: 1 }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || JSON.stringify(err));
    }
    const groups = await res.json();
    const group = Array.isArray(groups) ? groups[0] : groups;
    await supabase("group_members", {
      method: "POST", token: session.token,
      body: { group_id: group.id, user_id: session.user.id },
    });
    const rounds = await supabase("rounds", {
      method: "POST", token: session.token,
      prefer: "return=representation",
      body: { group_id: group.id, round_number: 1, deadline: "2026-03-20T17:00:00Z", is_locked: false },
    });
    const round = Array.isArray(rounds) ? rounds[0] : rounds;
    const matchupRows = [];
    REGIONS.forEach(region => {
      const rt = TEAMS_MENS.filter(t => t.region === region).sort((a, b) => a.seed - b.seed);
      [[0,7],[1,6],[2,5],[3,4]].forEach(([a, b]) => {
        matchupRows.push({ round_id: round.id, team1_name: rt[a].name, team1_seed: rt[a].seed, team2_name: rt[b].name, team2_seed: rt[b].seed, region });
      });
    });
    await supabase("matchups", {
      method: "POST", token: session.token,
      body: matchupRows,
    });
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
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            {["Men's", "Women's", "Both"].map(opt => (
              <button key={opt} style={tournament === opt ? s.toggleOn : s.toggleOff} onClick={() => setTournament(opt)}>{opt}</button>
            ))}
          </div>
          <button style={{ ...s.btnPrimary, width: "100%", padding: "14px", opacity: name.length < 2 || loading ? 0.4 : 1 }}
            onClick={handleCreate} disabled={name.length < 2 || loading}>
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
      const groups = await supabase(`groups?code=eq.${code}&select=*`, { token: session.token });
      if (!groups?.length) throw new Error("Group not found. Check the code and try again.");
      const group = groups[0];
      // Check not already a member
      const existing = await supabase(`group_members?group_id=eq.${group.id}&user_id=eq.${session.user.id}`, { token: session.token });
      if (existing?.length) { onJoin(group); return; }
      await supabase("group_members", {
        method: "POST", token: session.token,
        body: { group_id: group.id, user_id: session.user.id },
      });
      onJoin(group);
    } catch (err) {
      showToast(err.message, "error");
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
          <input
            style={{ ...s.input, textAlign: "center", letterSpacing: "0.3em", fontSize: "1.8rem", fontWeight: 900, textTransform: "uppercase", padding: "16px 14px" }}
            placeholder="ABC123" value={code} onChange={e => setCode(e.target.value.toUpperCase())} maxLength={8}
            onKeyDown={e => e.key === "Enter" && handleJoin()}
          />
          <button style={{ ...s.btnPrimary, width: "100%", padding: "14px", opacity: code.length < 3 || loading ? 0.4 : 1 }}
            onClick={handleJoin} disabled={code.length < 3 || loading}>
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
  const [submitted, setSubmitted] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [round, setRound] = useState(null);
  const [loading, setLoading] = useState(true);
  const [memberCount, setMemberCount] = useState(0);

  useEffect(() => { loadGroupData(); }, [group.id]);

  const loadGroupData = async () => {
    setLoading(true);
    try {
      // Load current round
      const rounds = await supabase(
        `rounds?group_id=eq.${group.id}&round_number=eq.${group.current_round}&select=*`,
        { token: session.token }
      );
      const currentRound = rounds?.[0];
      setRound(currentRound);

      if (currentRound) {
        // Load matchups
        const mps = await supabase(
          `matchups?round_id=eq.${currentRound.id}&select=*&order=region.asc`,
          { token: session.token }
        );
        setMatchups(mps || []);

        // Load my picks
        const pickIds = (mps || []).map(m => m.id).join(",");
        if (pickIds) {
          const picks = await supabase(
            `picks?user_id=eq.${session.user.id}&matchup_id=in.(${pickIds})&select=*`,
            { token: session.token }
          );
          const pickMap = {};
          (picks || []).forEach(p => { pickMap[p.matchup_id] = p.picked_team; });
          setMyPicks(pickMap);
          if (Object.keys(pickMap).length > 0) setSubmitted(true);
        }
      }

      // Member count
      const members = await supabase(`group_members?group_id=eq.${group.id}&select=user_id`, { token: session.token });
      setMemberCount(members?.length || 0);

      // Leaderboard — scores based on correct picks
      await loadLeaderboard(currentRound);

    } catch (err) {
      showToast("Error loading group: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderboard = async (currentRound) => {
    try {
      const members = await supabase(
        `group_members?group_id=eq.${group.id}&select=user_id`,
        { token: session.token }
      );
      const profiles = await supabase(
        `profiles?id=in.(${members.map(m => m.user_id).join(",")})&select=*`,
        { token: session.token }
      );
      // For now show profiles with placeholder scores (real scoring needs winner data)
      const lb = profiles.map(p => ({
        id: p.id,
        name: p.display_name,
        points: 0,
        correct: 0,
        isMe: p.id === session.user.id,
      }));
      setLeaderboard(lb);
    } catch { /* silent */ }
  };

  const handlePick = async (matchupId, teamName) => {
    if (round?.is_locked) return;
    const prev = myPicks[matchupId];
    setMyPicks(p => ({ ...p, [matchupId]: teamName }));
    try {
      // Upsert pick
      await supabase("picks", {
        method: "POST", token: session.token,
        prefer: "return=minimal,resolution=merge-duplicates",
        headers: { "on_conflict": "user_id,matchup_id" },
        body: { user_id: session.user.id, matchup_id: matchupId, picked_team: teamName, updated_at: new Date().toISOString() },
      });
      setSubmitted(true);
    } catch (err) {
      // Rollback
      setMyPicks(p => ({ ...p, [matchupId]: prev }));
      showToast("Couldn't save pick: " + err.message, "error");
    }
  };

  const picksCount = Object.keys(myPicks).length;
  const total = matchups.length;
  const deadline = round?.deadline ? new Date(round.deadline) : new Date("2026-03-20T17:00:00Z");
  const countdown = useCountdown(deadline.getTime());
  const deadlinePassed = round?.is_locked || countdown.expired;

  return (
    <div style={s.lightPage}>
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
              <PicksTab matchups={matchups} myPicks={myPicks} submitted={submitted}
                onPick={handlePick} picksCount={picksCount} total={total}
                countdown={countdown} deadlinePassed={deadlinePassed} />
            )}
            {!loading && activeTab === "leaderboard" && (
              <LeaderboardTab leaderboard={leaderboard} group={group} memberCount={memberCount} deadlinePassed={deadlinePassed} />
            )}
          </div>
        </div>
      </div>

      {activeTab === "picks" && !deadlinePassed && (
        <div style={s.floater}>
          {submitted && picksCount > 0 && (
            <div style={{ textAlign: "center", fontSize: "0.8rem", color: C.green, fontWeight: 600, marginBottom: 8 }}>
              ✓ Picks saving automatically — update anytime before deadline
            </div>
          )}
          <div style={{ ...s.btnPrimary, width: "100%", padding: "15px", fontSize: "1rem", textAlign: "center", opacity: picksCount === total ? 1 : 0.45, boxSizing: "border-box" }}>
            {picksCount < total ? `${total - picksCount} game${total - picksCount !== 1 ? "s" : ""} remaining` : "✓ All picks submitted!"}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PICKS TAB ────────────────────────────────────────────────────────────────
function PicksTab({ matchups, myPicks, submitted, onPick, picksCount, total, countdown, deadlinePassed }) {
  return (
    <div style={{ paddingTop: 20 }}>
      {!deadlinePassed ? (
        <div style={s.deadlineBanner}>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.9rem", color: C.green }}>⏰ Picks editable until tipoff</div>
            <div style={{ fontSize: "0.75rem", color: C.textMuted, marginTop: 2 }}>Saves automatically as you pick</div>
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

      {matchups.length === 0 && (
        <div style={s.emptyBox}>No matchups found for this round.</div>
      )}

      {REGIONS.map(region => {
        const regionMatchups = matchups.filter(m => m.region === region);
        if (!regionMatchups.length) return null;
        return (
          <div key={region} style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingBottom: 10, borderBottom: `2px solid ${C.ncaaBlue}` }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: C.ncaaBlue }}>{region} Region</span>
              <span style={{ fontSize: "0.72rem", color: C.textMuted }}>
                {regionMatchups.filter(m => myPicks[m.id]).length}/{regionMatchups.length} picked
              </span>
            </div>
            {regionMatchups.map(m => (
              <MatchupCard key={m.id} matchup={m} pick={myPicks[m.id]} onPick={onPick} locked={deadlinePassed} />
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ─── MATCHUP CARD ─────────────────────────────────────────────────────────────
function MatchupCard({ matchup, pick, onPick, locked }) {
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", marginBottom: 10, background: C.surface, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
      <TeamRow team={{ name: matchup.team1_name, seed: matchup.team1_seed, region: matchup.region }}
        selected={pick === matchup.team1_name} onPick={() => !locked && onPick(matchup.id, matchup.team1_name)} locked={locked} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", borderTop: `1px solid ${C.borderLight}`, borderBottom: `1px solid ${C.borderLight}`, padding: "4px 0", background: C.surfaceGray }}>
        <span style={{ fontSize: "0.6rem", fontWeight: 900, letterSpacing: "0.12em", color: C.textLight }}>VS</span>
      </div>
      <TeamRow team={{ name: matchup.team2_name, seed: matchup.team2_seed, region: matchup.region }}
        selected={pick === matchup.team2_name} onPick={() => !locked && onPick(matchup.id, matchup.team2_name)} locked={locked} />
    </div>
  );
}

function TeamRow({ team, selected, onPick, locked }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
      background: selected ? `linear-gradient(90deg, ${C.ncaaBlueFade}, transparent)` : "transparent",
      borderLeft: selected ? `3px solid ${C.ncaaBlue}` : "3px solid transparent",
      cursor: locked ? "default" : "pointer",
      opacity: locked && !selected ? 0.5 : 1,
      transition: "background 0.15s",
    }} onClick={onPick}>
      <div style={{
        minWidth: 36, height: 28, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center",
        background: team.seed <= 2 ? C.ncaaBlueFadeMed : C.surfaceGray,
        border: `1px solid ${team.seed <= 2 ? "rgba(0,94,184,0.3)" : C.border}`,
        fontSize: "0.72rem", fontWeight: 800, color: team.seed <= 2 ? C.ncaaBlue : C.textMuted, flexShrink: 0,
      }}>#{team.seed}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "0.92rem", fontWeight: 700, color: C.text }}>{team.name}</div>
        <div style={{ fontSize: "0.68rem", color: C.textMuted, marginTop: 1 }}>{team.region} · Seed {team.seed}</div>
      </div>
      {selected && (
        <div style={{ background: C.ncaaBlue, color: "#fff", padding: "4px 10px", borderRadius: 6, fontSize: "0.7rem", fontWeight: 700, flexShrink: 0 }}>✓ Picked</div>
      )}
    </div>
  );
}

// ─── LEADERBOARD ─────────────────────────────────────────────────────────────
function LeaderboardTab({ leaderboard, group, memberCount, deadlinePassed }) {
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
      <div style={{ display: "flex", gap: 0, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", marginBottom: 24 }}>
        {[{ v: memberCount, l: "Players" }, { v: `Rd ${group.current_round}`, l: "Current Round" }, { v: `${ROUND_POINTS[(group.current_round || 1) - 1]}pt`, l: "Per Pick" }].map((st, i) => (
          <div key={st.l} style={{ flex: 1, padding: "16px 12px", textAlign: "center", borderRight: i < 2 ? `1px solid ${C.border}` : "none", background: C.surface }}>
            <div style={{ fontSize: "1.4rem", fontWeight: 900, color: C.ncaaBlue, letterSpacing: "-0.03em" }}>{st.v}</div>
            <div style={{ fontSize: "0.65rem", color: C.textMuted, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.06em" }}>{st.l}</div>
          </div>
        ))}
      </div>
      {leaderboard.length === 0 && <div style={s.emptyBox}>No players yet.</div>}
      {leaderboard.map((p, i) => (
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
            <div style={{ fontWeight: 800, fontSize: "1rem", color: C.ncaaBlue }}>{p.points} pts</div>
            <div style={{ fontSize: "0.72rem", color: C.textMuted }}>{p.correct} correct</div>
          </div>
        </div>
      ))}
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
