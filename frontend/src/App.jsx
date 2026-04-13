// frontend/src/App.jsx
// Full-featured Inventory Management SPA — Teklini Technologies
// Author: Bravin Ouma

import React, {
  createContext, useContext, useState, useEffect, useCallback,
} from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

// ─── Configuration & Defaults ────────────────────────────────────────────────
export const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000/api/v1";

/**
 * Modern Design System (Tokens)
 * Using a Tailwind-inspired professional palette.
 */
const C = {
  brand:    "#6366f1", // Indigo
  brandDk:  "#4f46e5",
  sidebar:  "#0f172a", // Slate 900
  sidebarH: "#1e293b",
  success:  "#10b981", // Emerald
  warning:  "#f59e0b", // Amber
  danger:   "#ef4444", // Red
  info:     "#3b82f6", // Blue
  text:     "#1e293b", // Slate 800
  muted:    "#64748b", // Slate 500
  bg:       "#f1f5f9", // Slate 100
  card:     "#ffffff",
  border:   "#e2e8f0",
  // Chart Colors (accessible palette)
  PIE: ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#94a3b8"],
};

// ─── Shared Styles ─────────────────────────────────────────────────────────────
// ─── Global Styles & API Logic ────────────────────────────────────────────────
const ss = {
  btn: {
    padding: "10px 22px", background: C.brand, color: "#fff", border: "none",
    borderRadius: 12, cursor: "pointer", fontSize: 14, fontWeight: 600,
    transition: "all 0.2s ease", letterSpacing: "0.01em",
  },
  btnSec: {
    padding: "9px 16px", background: "transparent", color: C.muted,
    border: `1.5px solid ${C.border}`, borderRadius: 12, cursor: "pointer",
    fontSize: 14, fontWeight: 500,
  },
  btnXs: {
    padding: "4px 10px", background: "transparent", color: C.muted,
    border: `1px solid ${C.border}`, borderRadius: 8, cursor: "pointer",
    fontSize: 13, marginRight: 4, transition: "color 0.2s",
  },
  label: { display: "block", fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8, marginTop: 4 },
  input: {
    display: "block", width: "100%", padding: "11px 16px", marginBottom: 18,
    border: `1.5px solid ${C.border}`, borderRadius: 12, fontSize: 14, outline: "none",
    boxSizing: "border-box", color: C.text, background: "#fff",
    fontFamily: "'Inter', sans-serif", transition: "border-color 0.15s, box-shadow 0.15s",
  },
  card: {
    background: C.card, borderRadius: 16, padding: 26,
    boxShadow: "0 4px 12px rgba(15,23,42,0.04)", border: `1px solid ${C.border}44`,
  },
  cardTitle: { margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: C.text },
  tableWrap: {
    background: C.card, borderRadius: 16, overflow: "hidden", border: `1px solid ${C.border}`,
    boxShadow: "0 2px 8px rgba(15,23,42,0.05)", overflowX: "auto",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    padding: "14px 16px", textAlign: "left", fontSize: 12, color: C.muted,
    fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase",
    whiteSpace: "nowrap", background: "#f8fafc", borderBottom: `1px solid ${C.border}`,
  },
  td: { padding: "14px 16px", fontSize: 14, color: C.text, verticalAlign: "middle" },
  badge: {
    display: "inline-block", padding: "4px 12px", borderRadius: 24,
    fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
  },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },
};

/**
 * Enhanced API Fetch Wrapper
 * Handles Authentication, JSON serialization, and automatic logout on 401.
 */
async function apiFetch(path, token, options = {}) {
  const isFormData = options.body instanceof FormData;
  const headers = {
    Authorization: `Token ${token}`,
    ...(!isFormData && options.body ? { "Content-Type": "application/json" } : {}),
    ...options.headers,
  };
  
  try {
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    // Global Auth Guard: If token is expired, wipe local state.
    if (res.status === 401) {
      localStorage.removeItem("inv_token");
      window.location.reload();
    }
    return res;
  } catch (err) {
    console.error("API Connectivity Error:", err);
    throw new Error("Connectivity lost — ensure the backend is active.");
  }
}

// ─── Auth Context ─────────────────────────────────────────────────────────────
export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// ─── Toast Context ────────────────────────────────────────────────────────────
const ToastCtx = createContext(null);
const useToast = () => useContext(ToastCtx);

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const toast = useCallback((msg, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4200);
  }, []);

  const icons = { success: "✓", error: "✕", warning: "⚠" };
  const colors = { success: C.success, error: C.danger, warning: C.warning };

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
        {toasts.map(t => (
          <div key={t.id} className="toast-enter" style={{
            padding: "12px 20px", borderRadius: 12, minWidth: 280, maxWidth: 400,
            background: colors[t.type] || C.success, color: "#fff",
            fontSize: 14, fontWeight: 500, boxShadow: "0 8px 28px rgba(0,0,0,0.22)",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ fontWeight: 800, fontSize: 16 }}>{icons[t.type]}</span>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, width = 580 }) {
  useEffect(() => {
    const fn = e => e.key === "Escape" && onClose();
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(15,23,42,0.72)", backdropFilter: "blur(5px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div style={{
        background: C.card, borderRadius: 18, width: "100%", maxWidth: width,
        boxShadow: "0 28px 72px rgba(0,0,0,0.38)",
      }}>
        <div style={{
          padding: "18px 24px", borderBottom: `1px solid ${C.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: C.text }}>{title}</h3>
          <button onClick={onClose} style={{
            background: "none", border: "none", fontSize: 24, cursor: "pointer",
            color: C.muted, lineHeight: 1, padding: "0 4px",
          }}>×</button>
        </div>
        <div style={{ padding: 24, maxHeight: "82vh", overflowY: "auto" }}>{children}</div>
      </div>
    </div>
  );
}

function ConfirmDlg({ msg, onOk, onCancel }) {
  return (
    <Modal title="Confirm Delete" onClose={onCancel} width={400}>
      <p style={{ color: C.text, lineHeight: 1.6, marginTop: 0 }}>{msg}</p>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button onClick={onCancel} style={ss.btnSec}>Cancel</button>
        <button onClick={onOk} style={{ ...ss.btn, background: C.danger }}>Delete</button>
      </div>
    </Modal>
  );
}

// ─── Page Header ─────────────────────────────────────────────────────────────
function PH({ title, sub, children }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: C.text }}>{title}</h1>
        {sub && <p style={{ margin: "4px 0 0", color: C.muted, fontSize: 14 }}>{sub}</p>}
      </div>
      {children && <div style={{ display: "flex", gap: 10, alignItems: "center" }}>{children}</div>}
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pager({ page, total, set }) {
  if (total <= 1) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16, justifyContent: "flex-end" }}>
      <button onClick={() => set(p => Math.max(1, p - 1))} disabled={page === 1}
        style={{ ...ss.btnSec, padding: "6px 16px", opacity: page === 1 ? 0.45 : 1 }}>← Prev</button>
      <span style={{ fontSize: 13, color: C.muted }}>Page {page} of {total}</span>
      <button onClick={() => set(p => Math.min(total, p + 1))} disabled={page === total}
        style={{ ...ss.btnSec, padding: "6px 16px", opacity: page === total ? 0.45 : 1 }}>Next →</button>
    </div>
  );
}

// ─── Status badge helpers ─────────────────────────────────────────────────────
const stockColor = s => ({ in_stock: C.success, low_stock: C.warning, out_of_stock: C.danger, discontinued: "#94a3b8" }[s] || C.muted);
const orderColor = s => ({ pending: C.warning, confirmed: C.info, processing: C.brand, shipped: "#8b5cf6", delivered: C.success, cancelled: C.danger, returned: "#94a3b8" }[s] || C.muted);

function Badge({ label, color }) {
  return (
    <span style={{ ...ss.badge, background: color + "22", color, border: `1px solid ${color}44` }}>
      {label}
    </span>
  );
}

const poColor = s => ({ draft: C.muted, sent: C.info, received: C.success, cancelled: C.danger }[s] || C.muted);

// ─── App Shell ────────────────────────────────────────────────────────────────
const PAGES = ["dashboard", "products", "orders", "purchase-orders", "movements", "categories", "suppliers", "reports"];

function App() {
  const [user,  setUser]  = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("inv_token"));
  const [page,  setPage]  = useState("dashboard");

  const login = (u, t) => { setUser(u); setToken(t); localStorage.setItem("inv_token", t); setPage("dashboard"); };
  const logout = () => { setUser(null); setToken(null); localStorage.removeItem("inv_token"); };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      <ToastProvider>
        {!token ? <LoginPage /> : (
          <Shell page={page} setPage={setPage}>
            {page === "dashboard"  && <DashboardPage />}
            {page === "products"   && <ProductsPage />}
            {page === "orders"     && <OrdersPage />}
            {page === "purchase-orders" && <PurchaseOrdersPage />}
            {page === "movements"  && <MovementsPage />}
            {page === "categories" && <CategoriesPage />}
            {page === "suppliers"  && <SuppliersPage />}
            {page === "reports"    && <ReportsPage />}
          </Shell>
        )}
      </ToastProvider>
    </AuthContext.Provider>
  );
}

// ─── Shell / Sidebar ──────────────────────────────────────────────────────────
// ─── Sidebar Navigation Definition ──────────────────────────────────────────
const NAV = [
  { k: "dashboard",       label: "Dashboard",      icon: "◈", roles: ["admin", "manager", "viewer"] },
  { k: "products",        label: "Products",       icon: "▦", roles: ["admin", "manager", "viewer"] },
  { k: "orders",          label: "Orders",         icon: "◉", roles: ["admin", "manager", "viewer"] },
  { k: "purchase-orders", label: "P. Orders",      icon: "📜", roles: ["admin", "manager"] },
  { k: "movements",       label: "Stock Log",      icon: "⇅", roles: ["admin", "manager"] },
  { k: "categories",      label: "Categories",     icon: "▣", roles: ["admin", "manager", "viewer"] },
  { k: "suppliers",       label: "Suppliers",      icon: "⊞", roles: ["admin", "manager", "viewer"] },
  { k: "reports",         label: "Reports",        icon: "▲", roles: ["admin", "manager"] },
];

function Shell({ children, page, setPage }) {
  const { user, logout } = useAuth();
  const [mini, setMini] = useState(false);

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Inter', sans-serif", background: C.bg }}>
      {/* Sidebar */}
      <aside style={{
        width: mini ? 64 : 236, background: C.sidebar, display: "flex",
        flexDirection: "column", flexShrink: 0, transition: "width 0.2s ease", overflow: "hidden",
      }}>
        {/* Logo */}
        <div style={{ padding: "20px 14px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9, flexShrink: 0,
            background: `linear-gradient(135deg, ${C.brand}, ${C.brandDk})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 800, fontSize: 18,
          }}>I</div>
          {!mini && (
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#f1f5f9", whiteSpace: "nowrap" }}>Inventory MS</div>
              <div style={{ fontSize: 11, color: "#475569", whiteSpace: "nowrap" }}>Teklini Technologies</div>
            </div>
          )}
        </div>

        {/* Navigation List */}
        <nav style={{ flex: 1, padding: "10px 0", overflowY: "auto" }}>
          {NAV.filter(item => !user || item.roles.includes(user.role)).map(item => {
            const active = page === item.k;
            return (
              <button key={item.k} onClick={() => setPage(item.k)} title={mini ? item.label : ""} style={{
                display: "flex", alignItems: "center", gap: 12,
                width: "100%", padding: mini ? "12px 0" : "12px 18px",
                justifyContent: mini ? "center" : "flex-start",
                border: "none", cursor: "pointer",
                background: active ? "rgba(99,102,241,0.14)" : "transparent",
                color: active ? "#818cf8" : "#94a3b8",
                borderLeft: active ? `3px solid ${C.brand}` : "3px solid transparent",
                fontSize: 14, fontWeight: active ? 600 : 400,
                transition: "all 0.15s ease",
              }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
                {!mini && <span style={{ whiteSpace: "nowrap" }}>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: 14, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          {!mini && (
            <div style={{ fontSize: 12, color: "#475569", marginBottom: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {user?.full_name || user?.username || "User"}
            </div>
          )}
          <div style={{ display: "flex", gap: 6, flexDirection: mini ? "column" : "row" }}>
            <button onClick={logout} style={{
              flex: 1, padding: "7px 8px", background: "rgba(239,68,68,0.1)", color: "#f87171",
              border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600,
            }}>{mini ? "↩" : "Logout"}</button>
            <button onClick={() => setMini(m => !m)} style={{
              padding: "7px 10px", background: "rgba(255,255,255,0.05)", color: "#475569",
              border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, cursor: "pointer", fontSize: 13,
            }}>{mini ? "▶" : "◀"}</button>
          </div>
        </div>
      </aside>

      {/* Content */}
      <main style={{ flex: 1, padding: 32, overflowY: "auto", minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}

// ─── Login ────────────────────────────────────────────────────────────────────
function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!form.username || !form.password) { setErr("Enter username and password."); return; }
    setBusy(true); setErr("");
    try {
      const res = await fetch(`${API_BASE}/users/login/`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (res.ok) login(d.user, d.token);
      else setErr(d.non_field_errors?.[0] || "Invalid credentials.");
    } catch { setErr("Server unreachable — ensure backend is running."); }
    finally { setBusy(false); }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: `linear-gradient(135deg, ${C.sidebar} 0%, #1e1b4b 60%, #0f172a 100%)`,
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{ background: C.card, borderRadius: 22, padding: 48, width: "100%", maxWidth: 400, boxShadow: "0 28px 72px rgba(0,0,0,0.45)" }}>
        <div style={{
          width: 58, height: 58, borderRadius: 15,
          background: `linear-gradient(135deg, ${C.brand}, ${C.brandDk})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontWeight: 800, fontSize: 28, marginBottom: 24,
        }}>I</div>
        <h1 style={{ margin: "0 0 4px", fontSize: 26, fontWeight: 800, color: C.text }}>Inventory MS</h1>
        <p style={{ margin: "0 0 32px", color: C.muted, fontSize: 14 }}>Teklini Technologies — Sign in to continue</p>

        {err && (
          <div style={{
            background: "#fef2f2", color: C.danger, border: "1px solid #fecaca",
            padding: "12px 16px", borderRadius: 10, marginBottom: 20, fontSize: 14,
          }}>{err}</div>
        )}
        <label style={ss.label}>Username</label>
        <input type="text" value={form.username} autoFocus
          onChange={e => setForm({ ...form, username: e.target.value })} style={ss.input} />
        <label style={ss.label}>Password</label>
        <input type="password" value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
          onKeyDown={e => e.key === "Enter" && submit()} style={ss.input} />
        <button onClick={submit} disabled={busy} style={{ ...ss.btn, width: "100%", padding: 14, fontSize: 15, marginTop: 4, opacity: busy ? 0.7 : 1 }}>
          {busy ? "Signing in…" : "Sign In"}
        </button>
        <p style={{ marginTop: 22, textAlign: "center", fontSize: 12, color: "#94a3b8", lineHeight: 1.7 }}>
          Demo credentials<br />
          <strong>admin</strong> / admin1234 &nbsp;·&nbsp; <strong>manager</strong> / manager1234
        </p>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function DashboardPage() {
  const { token } = useAuth();
  const [stats, setStats]   = useState(null);
  const [trend, setTrend]   = useState([]);

  useEffect(() => {
    apiFetch("/inventory/products/dashboard-stats/", token).then(r => r.json()).then(setStats).catch(() => {});
    apiFetch("/reports/sales-trends/?period=monthly&days=180", token).then(r => r.json()).then(d => {
      setTrend((d.trend || []).map(t => ({
        name: t.period ? new Date(t.period).toLocaleDateString("en-KE", { month: "short", year: "2-digit" }) : "—",
        revenue: parseFloat(t.revenue || 0),
        orders: t.order_count || 0,
      })));
    }).catch(() => {});
  }, [token]);

  const kpis = stats ? [
    { label: "Total Products",       value: stats.total_products,                             color: C.brand,   icon: "▦" },
    { label: "Low / Out of Stock",   value: stats.low_stock_count,                            color: C.warning, icon: "⚠" },
    { label: "Inventory Value (KES)", value: `${Number(stats.total_inventory_value_kes).toLocaleString()}`, color: C.success, icon: "₭" },
  ] : [];

  const pieData = stats?.stock_breakdown ? [
    { name: "In Stock",     value: stats.stock_breakdown.in_stock },
    { name: "Low Stock",    value: stats.stock_breakdown.low_stock },
    { name: "Out of Stock", value: stats.stock_breakdown.out_of_stock },
    { name: "Discontinued", value: stats.stock_breakdown.discontinued },
  ] : [];

  return (
    <div>
      <PH title="Dashboard" sub="Live inventory overview" />

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px,1fr))", gap: 18, marginBottom: 28 }}>
        {!stats && <div style={ss.card}>Loading stats…</div>}
        {kpis.map(k => (
          <div key={k.label} style={{ ...ss.card, borderTop: `4px solid ${k.color}` }}>
            <div style={{ fontSize: 28, marginBottom: 10, color: k.color, fontWeight: 700 }}>{k.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: k.color }}>{k.value ?? "—"}</div>
            <div style={{ color: C.muted, fontSize: 13, marginTop: 4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, marginBottom: 20 }}>
        {/* Revenue area */}
        <div style={ss.card}>
          <h3 style={ss.cardTitle}>Revenue Trend — Last 6 Months</h3>
          {trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="rG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.brand} stopOpacity={0.28} />
                    <stop offset="95%" stopColor={C.brand} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: C.muted }} />
                <YAxis tick={{ fontSize: 12, fill: C.muted }} />
                <Tooltip formatter={v => [`KES ${Number(v).toLocaleString()}`, "Revenue"]} />
                <Area type="monotone" dataKey="revenue" stroke={C.brand} fill="url(#rG)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontSize: 14 }}>
              Deliver some orders to see revenue trends
            </div>
          )}
        </div>

        {/* Breakdown Pie */}
        <div style={ss.card}>
          <h3 style={ss.cardTitle}>Inventory Breakdown</h3>
          {pieData.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={52} outerRadius={88} paddingAngle={3} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={C.PIE[i]} />)}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" iconSize={9} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontSize: 14 }}>
              No inventory data
            </div>
          )}
        </div>
      </div>

      {/* Categories Badge List */}
      {stats?.top_categories?.length > 0 && (
        <div style={ss.card}>
          <h3 style={ss.cardTitle}>Trending Categories</h3>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {stats.top_categories.map(c => (
              <div key={c.name} style={{ ...ss.badge, background: C.brand + "14", color: C.brand, border: `1px solid ${C.brand}33`, fontSize: 13, padding: "6px 16px" }}>
                {c.name} <span style={{ opacity: 0.65 }}>({c.count})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Products Management ──────────────────────────────────────────────────────
const EP = { sku: "", name: "", description: "", category: "", supplier: "", price: "", cost_price: "", quantity: 0, reorder_level: 10, reorder_quantity: 50, barcode: "" };

function ProductsPage() {
  const { token } = useAuth();
  const toast = useToast();
  
  const [rows, setRows]       = useState([]);
  const [cats, setCats]       = useState([]);
  const [sups, setSups]       = useState([]);
  const [search, setSearch]   = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState(EP);
  const [adj, setAdj]         = useState({ quantity: "", movement_type: "in", reason: "" });
  const [pg, setPg]           = useState(1);
  const [count, setCount]     = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/inventory/products/?search=${encodeURIComponent(search)}&page=${pg}`, token);
      const d = await res.json();
      setRows(d.results || []);
      setCount(d.count || 0);
    } catch { toast("Failed to load products.", "error"); }
    finally { setLoading(false); }
  }, [token, search, pg, toast]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    apiFetch("/inventory/categories/?page_size=200", token).then(r => r.json()).then(d => setCats(d.results || []));
    apiFetch("/inventory/suppliers/?page_size=200", token).then(r => r.json()).then(d => setSups(d.results || []));
  }, [token]);

  const onSave = async () => {
    const url = editing ? `/inventory/products/${editing.id}/` : "/inventory/products/";
    const res = await apiFetch(url, token, { method: editing ? "PUT" : "POST", body: JSON.stringify(form) });
    if (res.ok) { toast(editing ? "Product updated." : "Product created."); setModal(null); load(); }
    else { const d = await res.json(); toast(Object.values(d).flat().join(" "), "error"); }
  };

  const onAdjust = async () => {
    const res = await apiFetch(`/inventory/products/${editing.id}/adjust-stock/`, token, { method: "POST", body: JSON.stringify(adj) });
    if (res.ok) { toast("Stock adjusted."); setModal(null); load(); }
    else { const d = await res.json(); toast(d.error || "Adjustment failed.", "error"); }
  };

  const onDelete = async () => {
    const res = await apiFetch(`/inventory/products/${editing.id}/`, token, { method: "DELETE" });
    if (res.ok) { toast("Product deleted."); setModal(null); load(); }
  };

  return (
    <div>
      <PH title="Products" sub={`Catalog management — ${count} items`}>
        <button onClick={() => window.open(`${API_BASE}/inventory/products/export/`, "_blank")} style={ss.btnSec}>⬇ Export CSV</button>
        <button onClick={() => { setForm(EP); setEditing(null); setModal("add"); }} style={ss.btn}>+ Add Product</button>
      </PH>

      <input placeholder="Search SKU, Name, or Barcode..." value={search} onChange={e => { setSearch(e.target.value); setPg(1); }}
        style={{ ...ss.input, maxWidth: 400, marginBottom: 20 }} />

      <div style={ss.tableWrap}>
        <table style={ss.table}>
          <thead>
            <tr>{["SKU", "Details", "Category", "Price", "Stock", "Status", "Actions"].map(h => <th key={h} style={ss.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={7} style={{ textAlign: "center", padding: 60, color: C.muted }}>Loading...</td></tr> : (
              rows.length === 0 ? <tr><td colSpan={7} style={{ textAlign: "center", padding: 60, color: C.muted }}>No products found.</td></tr> : (
                rows.map(p => (
                  <tr key={p.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={ss.td}><code style={{ color: C.brand, fontWeight: 700 }}>{p.sku}</code></td>
                    <td style={ss.td}>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>{p.barcode || "No barcode"}</div>
                    </td>
                    <td style={ss.td}>{p.category_name || "—"}</td>
                    <td style={{ ...ss.td, fontWeight: 600 }}>KES {Number(p.price).toLocaleString()}</td>
                    <td style={ss.td}>
                      <div style={{ fontWeight: 800, color: p.quantity <= p.reorder_level ? C.danger : C.text }}>{p.quantity}</div>
                      <div style={{ fontSize: 11, color: C.muted }}>Min: {p.reorder_level}</div>
                    </td>
                    <td style={ss.td}><Badge label={p.status?.replace(/_/g, " ")} color={stockColor(p.status)} /></td>
                    <td style={ss.td}>
                      <button onClick={() => { setEditing(p); setAdj({ quantity: "", movement_type: "in", reason: "" }); setModal("adjust"); }} style={ss.btnXs}>±</button>
                      <button onClick={() => { setForm({ ...p, barcode: p.barcode || "" }); setEditing(p); setModal("edit"); }} style={ss.btnXs}>✎</button>
                      <button onClick={() => { setEditing(p); setModal("delete"); }} style={{ ...ss.btnXs, color: C.danger }}>✕</button>
                    </td>
                  </tr>
                ))
              )
            )}
          </tbody>
        </table>
      </div>
      <Pager page={pg} total={Math.ceil(count / 25)} set={setPg} />

      {/* Add/Edit Modal */}
      {(modal === "add" || modal === "edit") && (
        <Modal title={modal === "add" ? "New Product" : `Edit ${editing.name}`} onClose={() => setModal(null)}>
          <div style={ss.grid2}>
            <div><label style={ss.label}>SKU *</label><input style={ss.input} value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value.toUpperCase() })} /></div>
            <div><label style={ss.label}>Barcode</label><input style={ss.input} value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} /></div>
          </div>
          <label style={ss.label}>Name *</label><input style={ss.input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <div style={ss.grid2}>
            <div><label style={ss.label}>Category</label>
              <select style={ss.input} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                <option value="">None</option>{cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select></div>
            <div><label style={ss.label}>Supplier</label>
              <select style={ss.input} value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })}>
                <option value="">None</option>{sups.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select></div>
          </div>
          <div style={ss.grid2}>
            <div><label style={ss.label}>Price (KES)</label><input type="number" style={ss.input} value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></div>
            <div><label style={ss.label}>Cost (KES)</label><input type="number" style={ss.input} value={form.cost_price} onChange={e => setForm({ ...form, cost_price: e.target.value })} /></div>
          </div>
          <div style={ss.grid2}>
            <div><label style={ss.label}>Quantity</label><input type="number" style={ss.input} value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} /></div>
            <div><label style={ss.label}>Reorder Lvl</label><input type="number" style={ss.input} value={form.reorder_level} onChange={e => setForm({ ...form, reorder_level: e.target.value })} /></div>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => setModal(null)} style={ss.btnSec}>Cancel</button>
            <button onClick={onSave} style={ss.btn}>Confirm</button>
          </div>
        </Modal>
      )}

      {/* Adjust Modal */}
      {modal === "adjust" && (
        <Modal title={`Adjust Stock — ${editing.sku}`} onClose={() => setModal(null)} width={400}>
          <label style={ss.label}>Type</label>
          <select style={ss.input} value={adj.movement_type} onChange={e => setAdj({ ...adj, movement_type: e.target.value })}>
            <option value="in">In</option><option value="out">Out</option><option value="adjustment">Correction</option>
          </select>
          <label style={ss.label}>Qty</label><input type="number" style={ss.input} value={adj.quantity} onChange={e => setAdj({ ...adj, quantity: e.target.value })} />
          <button onClick={onAdjust} style={{ ...ss.btn, width: "100%" }}>Update</button>
        </Modal>
      )}

      {modal === "delete" && <ConfirmDlg msg={`Delete product ${editing.sku}?`} onOk={onDelete} onCancel={() => setModal(null)} />}
    </div>
  );
}

// ─── Orders Management ────────────────────────────────────────────────────────
const EO = { customer_name: "", customer_email: "", items: [] };

function OrdersPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [prods, setProds] = useState([]);
  const [form, setForm] = useState(EO);
  const [modal, setModal] = useState(null);
  const [pg, setPg] = useState(1);
  const [count, setCount] = useState(0);

  const load = useCallback(async () => {
    const res = await apiFetch(`/inventory/orders/?page=${pg}`, token);
    const d = await res.json(); setRows(d.results || []); setCount(d.count || 0);
  }, [token, pg]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { apiFetch("/inventory/products/?page_size=200", token).then(r => r.json()).then(d => setProds(d.results || [])); }, [token]);

  const onAdd = async () => {
    const res = await apiFetch("/inventory/orders/", token, { method: "POST", body: JSON.stringify(form) });
    if (res.ok) { toast("Order placed!"); setModal(null); load(); }
  };

  const updateStatus = async (o, s) => {
    const res = await apiFetch(`/inventory/orders/${o.id}/update-status/`, token, { method: "POST", body: JSON.stringify({ status: s }) });
    if (res.ok) { toast(`Order updated to ${s}`); load(); }
  };

  return (
    <div>
      <PH title="Orders" sub={`${count} customer orders`}>
        <button onClick={() => { setForm(EO); setModal("add"); }} style={ss.btn}>+ New Order</button>
      </PH>

      <div style={ss.tableWrap}>
        <table style={ss.table}>
          <thead>
            <tr>{["Order #", "Customer", "Status", "Total", "Date", "Action"].map(h => <th key={h} style={ss.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map(o => (
              <tr key={o.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td style={ss.td}><code style={{ fontWeight: 700, color: C.brand }}>{o.order_number}</code></td>
                <td style={ss.td}><strong>{o.customer_name}</strong><div style={{ fontSize: 11, color: C.muted }}>{o.customer_email}</div></td>
                <td style={ss.td}><Badge label={o.status} color={orderColor(o.status)} /></td>
                <td style={{ ...ss.td, fontWeight: 700 }}>KES {Number(o.total_amount).toLocaleString()}</td>
                <td style={{ ...ss.td, fontSize: 13, color: C.muted }}>{new Date(o.created_at).toLocaleDateString()}</td>
                <td style={ss.td}>
                  <select value={o.status} onChange={e => updateStatus(o, e.target.value)} style={{ ...ss.input, padding: "4px 8px", width: "auto", marginBottom: 0 }}>
                    {["pending","confirmed","processing","shipped","delivered","cancelled"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager page={pg} total={Math.ceil(count / 25)} set={setPg} />

      {modal === "add" && (
        <Modal title="Create Order" onClose={() => setModal(null)} width={600}>
          <label style={ss.label}>Customer Name</label><input style={ss.input} value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} />
          <label style={ss.label}>Customer Email</label><input style={ss.input} value={form.customer_email} onChange={e => setForm({ ...form, customer_email: e.target.value })} />
          <div style={{ padding: 10, background: C.bg, borderRadius: 10, marginBottom: 15 }}>
            <button onClick={() => setForm({ ...form, items: [...form.items, { product: "", quantity: 1, unit_price: 0 }] })} style={ss.btnXs}>+ Add Item</button>
            {form.items.map((it, idx) => (
              <div key={idx} style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <select style={{ ...ss.input, flex: 2 }} value={it.product} onChange={e => {
                  const p = prods.find(x => String(x.id) === e.target.value);
                  const items = [...form.items]; items[idx] = { ...it, product: e.target.value, unit_price: p?.price || 0 };
                  setForm({ ...form, items });
                }}>
                  <option value="">Select Product</option>{prods.map(p => <option key={p.id} value={p.id}>{p.name} (KES {p.price})</option>)}
                </select>
                <input type="number" style={{ ...ss.input, flex: 1 }} value={it.quantity} onChange={e => {
                  const items = [...form.items]; items[idx].quantity = e.target.value; setForm({ ...form, items });
                }} />
              </div>
            ))}
          </div>
          <button onClick={onAdd} style={{ ...ss.btn, width: "100%" }}>Finalize Order</button>
        </Modal>
      )}
    </div>
  );
}

// ─── Purchase Orders ─────────────────────────────────────────────────────────
function PurchaseOrdersPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [rows, setRows] = useState([]);

  const load = useCallback(async () => {
    const res = await apiFetch("/inventory/purchase-orders/", token);
    const d = await res.json(); setRows(d.results || []);
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const onSend = async po => { if (await apiFetch(`/inventory/purchase-orders/${po.id}/send/`, token, { method: "POST" })) { toast("PO Sent"); load(); } };
  const onRecv = async po => { if (await apiFetch(`/inventory/purchase-orders/${po.id}/receive/`, token, { method: "POST" })) { toast("Stock Received!"); load(); } };

  return (
    <div>
      <PH title="Purchase Orders" sub="Replenishment tracking" />
      <div style={ss.tableWrap}>
        <table style={ss.table}>
          <thead><tr>{["PO #", "Supplier", "Status", "Total Items", "Actions"].map(h => <th key={h} style={ss.th}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.map(po => (
              <tr key={po.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td style={ss.td}><code style={{ fontWeight: 700 }}>{po.po_number}</code></td>
                <td style={ss.td}>{po.supplier_name}</td>
                <td style={ss.td}><Badge label={po.status} color={poColor(po.status)} /></td>
                <td style={ss.td}>{po.items.length} lines</td>
                <td style={ss.td}>
                  {po.status === "draft" && <button onClick={() => onSend(po)} style={ss.btnXs}>🚀 Send</button>}
                  {po.status === "sent" && <button onClick={() => onRecv(po)} style={{ ...ss.btnXs, color: C.success }}>📥 Receive</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Simple Pages ─────────────────────────────────────────────────────────────
function MovementsPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState([]);
  useEffect(() => { apiFetch("/inventory/movements/", token).then(r => r.json()).then(d => setRows(d.results || [])); }, [token]);

  return (
    <div>
      <PH title="Stock History" sub="Audit trail of all inventory changes" />
      <div style={ss.tableWrap}>
        <table style={ss.table}>
          <thead><tr>{["Product", "Type", "Qty", "Reason", "Date"].map(h => <th key={h} style={ss.th}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.map(m => (
              <tr key={m.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td style={ss.td}><strong>{m.product_name}</strong><div style={{ fontSize: 11, color: C.muted }}>{m.product_sku}</div></td>
                <td style={ss.td}><Badge label={m.movement_type} color={m.movement_type === "in" ? C.success : C.danger} /></td>
                <td style={{ ...ss.td, fontWeight: 700 }}>{m.quantity}</td>
                <td style={{ ...ss.td, fontSize: 13 }}>{m.reason}</td>
                <td style={{ ...ss.td, fontSize: 12, color: C.muted }}>{new Date(m.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CategoriesPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState([]);
  useEffect(() => { apiFetch("/inventory/categories/", token).then(r => r.json()).then(d => setRows(d.results || [])); }, [token]);
  return (
    <div>
      <PH title="Categories" sub="Product classification" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
        {rows.map(c => (
          <div key={c.id} style={ss.card}>
            <h4 style={{ ...ss.cardTitle, marginBottom: 8 }}>{c.name}</h4>
            <p style={{ color: C.muted, fontSize: 13, minHeight: 40 }}>{c.description || "No description set."}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SuppliersPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState([]);
  useEffect(() => { apiFetch("/inventory/suppliers/", token).then(r => r.json()).then(d => setRows(d.results || [])); }, [token]);
  return (
    <div>
      <PH title="Suppliers" sub="Supply chain partners" />
      <div style={ss.tableWrap}>
        <table style={ss.table}>
          <thead><tr>{["Name", "Contact", "Phone", "Status"].map(h => <th key={h} style={ss.th}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.map(s => (
              <tr key={s.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td style={{ ...ss.td, fontWeight: 700 }}>{s.name}</td>
                <td style={ss.td}>{s.contact_email}</td>
                <td style={ss.td}>{s.phone}</td>
                <td style={ss.td}><Badge label={s.is_active ? "Active" : "Inactive"} color={s.is_active ? C.success : C.muted} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReportsPage() {
  const { token } = useAuth();
  const [forecasts, setForecasts] = useState([]);
  useEffect(() => { apiFetch("/reports/demand-forecast/", token).then(r => r.json()).then(d => setForecasts(d.forecasts || [])); }, [token]);

  return (
    <div>
      <PH title="Intelligent Reports" sub="Data-driven inventory insights">
        <button onClick={() => window.open(`${API_BASE}/reports/orders-export/`, "_blank")} style={ss.btnSec}>⬇ Orders CSV</button>
      </PH>

      <div style={{ ...ss.card, marginBottom: 28 }}>
        <h3 style={ss.cardTitle}>Demand Forecast (30-Day Window)</h3>
        <p style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>AI-driven stock recommendations based on recent sales velocity.</p>
        <div style={ss.tableWrap}>
          <table style={ss.table}>
            <thead><tr>{["Product", "Sales Velocity", "Forecasted Demand", "Status"].map(h => <th key={h} style={ss.th}>{h}</th>)}</tr></thead>
            <tbody>
              {forecasts.map((f, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
                  <td style={ss.td}><strong>{f.product_name}</strong></td>
                  <td style={ss.td}>{f.avg_daily_sales.toFixed(2)} units/day</td>
                  <td style={{ ...ss.td, fontWeight: 700 }}>{f.forecasted_demand_30d} units</td>
                  <td style={ss.td}><Badge label={f.recommendation} color={f.recommendation === "REORDER_NOW" ? C.danger : C.success} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;
                    <td style={{ ...ss.td, fontWeight: 600 }}>{o.customer_name}</td>
                    <td style={{ ...ss.td, color: C.muted }}>{o.customer_email}</td>
                    <td style={ss.td}><Badge label={o.status} color={orderColor(o.status)} /></td>
                    <td style={{ ...ss.td, fontWeight: 700 }}>KES {Number(o.total_amount).toLocaleString()}</td>
                    <td style={{ ...ss.td, color: C.muted, fontSize: 13 }}>{new Date(o.created_at).toLocaleDateString()}</td>
                    <td style={ss.td}>
                      <select value={o.status} onChange={e => setStatus(o, e.target.value)}
                        style={{ ...ss.input, marginBottom: 0, padding: "5px 8px", fontSize: 12, width: "auto" }}>
                        {["pending","confirmed","processing","shipped","delivered","cancelled","returned"].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>
      <Pager page={pg} total={totalPgs} set={setPg} />

      {modal === "create" && (
        <Modal title="Create New Order" onClose={() => setModal(null)} width={720}>
          <div style={ss.grid2}>
            <div><label style={ss.label}>Customer Name *</label><input style={ss.input} value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} /></div>
            <div><label style={ss.label}>Customer Email *</label><input type="email" style={ss.input} value={form.customer_email} onChange={e => setForm({ ...form, customer_email: e.target.value })} /></div>
          </div>
          <label style={ss.label}>Notes</label>
          <textarea style={{ ...ss.input, minHeight: 48, resize: "vertical" }} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "12px 0 10px" }}>
            <label style={{ ...ss.label, margin: 0, fontWeight: 700, fontSize: 14 }}>Line Items</label>
            <button onClick={addItem} style={{ ...ss.btnSec, padding: "5px 14px", fontSize: 13 }}>+ Add Item</button>
          </div>

          {form.items.length === 0 && <p style={{ color: C.muted, fontSize: 13, margin: "0 0 16px" }}>Click "Add Item" to select products.</p>}
          {form.items.map((it, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 80px 120px 38px", gap: 8, marginBottom: 8, alignItems: "end" }}>
              <div>
                {i === 0 && <label style={ss.label}>Product</label>}
                <select style={{ ...ss.input, marginBottom: 0 }} value={it.product} onChange={e => updItem(i, "product", e.target.value)}>
                  <option value="">— Select product —</option>
                  {prods.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku}) — {p.quantity} in stock</option>)}
                </select>
              </div>
              <div>
                {i === 0 && <label style={ss.label}>Qty</label>}
                <input type="number" min="1" style={{ ...ss.input, marginBottom: 0 }} value={it.quantity} onChange={e => updItem(i, "quantity", e.target.value)} />
              </div>
              <div>
                {i === 0 && <label style={ss.label}>Unit Price</label>}
                <input type="number" style={{ ...ss.input, marginBottom: 0 }} value={it.unit_price} onChange={e => updItem(i, "unit_price", e.target.value)} />
              </div>
              <button onClick={() => remItem(i)} style={{ ...ss.btnXs, color: C.danger, marginRight: 0, marginTop: i === 0 ? 18 : 0 }}>✕</button>
            </div>
          ))}

          {form.items.length > 0 && (
            <div style={{ textAlign: "right", fontWeight: 800, fontSize: 17, color: C.brand, margin: "14px 0 4px" }}>
              Order Total: KES {total.toLocaleString()}
            </div>
          )}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
            <button onClick={() => setModal(null)} style={ss.btnSec}>Cancel</button>
            <button onClick={create} style={ss.btn}>Create Order</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Stock Movements ──────────────────────────────────────────────────────────
function MovementsPage() {
  const { token } = useAuth();
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [pg, setPg]           = useState(1);
  const [count, setCount]     = useState(0);

  useEffect(() => {
    setLoading(true);
    apiFetch(`/inventory/movements/?page=${pg}`, token).then(r => r.json())
      .then(d => { setRows(d.results || []); setCount(d.count || 0); })
      .finally(() => setLoading(false));
  }, [token, pg]);

  const typeColor = t => ({ in: C.success, purchase: C.success, out: C.danger, adjustment: C.warning, return: C.info }[t] || C.muted);
  const isPositive = t => ["in", "purchase", "return"].includes(t);

  return (
    <div>
      <PH title="Stock Movements" sub={`${count} movement records — full audit trail`} />
      <div style={ss.tableWrap}>
        <table style={ss.table}>
          <thead>
            <tr>{["Date & Time", "Product", "SKU", "Type", "Quantity", "Reason", "Performed By"].map(h => <th key={h} style={ss.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={7} style={{ textAlign: "center", padding: 48, color: C.muted }}>Loading…</td></tr>
              : rows.length === 0
                ? <tr><td colSpan={7} style={{ textAlign: "center", padding: 48, color: C.muted }}>No movements yet. Adjust stock or create orders.</td></tr>
                : rows.map(m => (
                  <tr key={m.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ ...ss.td, color: C.muted, fontSize: 12, whiteSpace: "nowrap" }}>{new Date(m.created_at).toLocaleString()}</td>
                    <td style={{ ...ss.td, fontWeight: 600 }}>{m.product_name}</td>
                    <td style={ss.td}><code style={{ fontSize: 12, color: C.brand }}>{m.product_sku}</code></td>
                    <td style={ss.td}><Badge label={m.movement_type.replace(/_/g, " ")} color={typeColor(m.movement_type)} /></td>
                    <td style={{ ...ss.td, fontWeight: 800, color: isPositive(m.movement_type) ? C.success : C.danger }}>
                      {isPositive(m.movement_type) ? "+" : "−"}{Math.abs(m.quantity)}
                    </td>
                    <td style={{ ...ss.td, color: C.muted, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.reason || "—"}</td>
                    <td style={{ ...ss.td, color: C.muted }}>{m.performed_by_name || "—"}</td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>
      <Pager page={pg} total={Math.ceil(count / 25)} set={setPg} />
    </div>
  );
}

// ─── Categories ───────────────────────────────────────────────────────────────
function CategoriesPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState({ name: "", description: "" });

  const load = useCallback(() => {
    setLoading(true);
    apiFetch("/inventory/categories/?page_size=200", token).then(r => r.json())
      .then(d => setRows(d.results || [])).finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setForm({ name: "", description: "" }); setEditing(null); setModal("form"); };
  const openEdit = c => { setForm({ name: c.name, description: c.description }); setEditing(c); setModal("form"); };
  const openDel  = c => { setEditing(c); setModal("delete"); };

  const save = async () => {
    const url = editing ? `/inventory/categories/${editing.id}/` : "/inventory/categories/";
    const res = await apiFetch(url, token, { method: editing ? "PUT" : "POST", body: JSON.stringify(form) });
    if (res.ok) { toast(editing ? "Category updated." : "Category created."); setModal(null); load(); }
    else toast("Failed to save.", "error");
  };

  const del = async () => {
    const res = await apiFetch(`/inventory/categories/${editing.id}/`, token, { method: "DELETE" });
    if (res.ok || res.status === 204) { toast("Category deleted."); setModal(null); load(); }
    else toast("Failed — category may have products.", "error");
  };

  return (
    <div>
      <PH title="Categories" sub={`${rows.length} categories`}>
        <button onClick={openAdd} style={ss.btn}>+ Add Category</button>
      </PH>

      {loading ? <div style={ss.card}>Loading…</div> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {rows.map(c => (
            <div key={c.id} style={{ ...ss.card, display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 4 }}>{c.name}</div>
                <div style={{ fontSize: 13, color: C.muted, marginBottom: 10, lineHeight: 1.4 }}>{c.description || "No description"}</div>
                <Badge label={`${c.product_count} product${c.product_count !== 1 ? "s" : ""}`} color={C.brand} />
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button onClick={() => openEdit(c)} style={ss.btnXs}>✎</button>
                <button onClick={() => openDel(c)} style={{ ...ss.btnXs, color: C.danger }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal === "form" && (
        <Modal title={editing ? "Edit Category" : "Add Category"} onClose={() => setModal(null)} width={420}>
          <label style={ss.label}>Name *</label>
          <input style={ss.input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} autoFocus />
          <label style={ss.label}>Description</label>
          <textarea style={{ ...ss.input, minHeight: 80, resize: "vertical" }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => setModal(null)} style={ss.btnSec}>Cancel</button>
            <button onClick={save} style={ss.btn}>{editing ? "Save Changes" : "Create"}</button>
          </div>
        </Modal>
      )}
      {modal === "delete" && <ConfirmDlg msg={`Delete category "${editing?.name}"? Products will be uncategorized.`} onOk={del} onCancel={() => setModal(null)} />}
    </div>
  );
}

// ─── Suppliers ────────────────────────────────────────────────────────────────
function SuppliersPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState({ name: "", contact_email: "", phone: "", address: "", is_active: true });

  const load = useCallback(() => {
    setLoading(true);
    apiFetch("/inventory/suppliers/?page_size=200", token).then(r => r.json())
      .then(d => setRows(d.results || [])).finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setForm({ name: "", contact_email: "", phone: "", address: "", is_active: true }); setEditing(null); setModal("form"); };
  const openEdit = s => { setForm({ name: s.name, contact_email: s.contact_email, phone: s.phone || "", address: s.address || "", is_active: s.is_active }); setEditing(s); setModal("form"); };
  const openDel  = s => { setEditing(s); setModal("delete"); };

  const save = async () => {
    const url = editing ? `/inventory/suppliers/${editing.id}/` : "/inventory/suppliers/";
    const res = await apiFetch(url, token, { method: editing ? "PUT" : "POST", body: JSON.stringify(form) });
    if (res.ok) { toast(editing ? "Supplier updated." : "Supplier created."); setModal(null); load(); }
    else { const d = await res.json(); toast(Object.values(d).flat().join(" ") || "Failed.", "error"); }
  };

  const del = async () => {
    const res = await apiFetch(`/inventory/suppliers/${editing.id}/`, token, { method: "DELETE" });
    if (res.ok || res.status === 204) { toast("Supplier deleted."); setModal(null); load(); }
    else toast("Delete failed.", "error");
  };

  return (
    <div>
      <PH title="Suppliers" sub={`${rows.length} suppliers`}>
        <button onClick={openAdd} style={ss.btn}>+ Add Supplier</button>
      </PH>

      <div style={ss.tableWrap}>
        <table style={ss.table}>
          <thead>
            <tr>{["Name", "Email", "Phone", "Status", "Actions"].map(h => <th key={h} style={ss.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={5} style={{ textAlign: "center", padding: 48, color: C.muted }}>Loading…</td></tr>
              : rows.length === 0
                ? <tr><td colSpan={5} style={{ textAlign: "center", padding: 48, color: C.muted }}>No suppliers yet.</td></tr>
                : rows.map(s => (
                  <tr key={s.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ ...ss.td, fontWeight: 600 }}>{s.name}</td>
                    <td style={{ ...ss.td, color: C.muted }}>{s.contact_email}</td>
                    <td style={{ ...ss.td, color: C.muted }}>{s.phone || "—"}</td>
                    <td style={ss.td}><Badge label={s.is_active ? "Active" : "Inactive"} color={s.is_active ? C.success : C.muted} /></td>
                    <td style={{ ...ss.td, whiteSpace: "nowrap" }}>
                      <button onClick={() => openEdit(s)} style={ss.btnXs}>✎</button>
                      <button onClick={() => openDel(s)} style={{ ...ss.btnXs, color: C.danger }}>✕</button>
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>

      {modal === "form" && (
        <Modal title={editing ? "Edit Supplier" : "Add Supplier"} onClose={() => setModal(null)} width={480}>
          <label style={ss.label}>Company Name *</label>
          <input style={ss.input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} autoFocus />
          <label style={ss.label}>Contact Email *</label>
          <input type="email" style={ss.input} value={form.contact_email} onChange={e => setForm({ ...form, contact_email: e.target.value })} />
          <div style={ss.grid2}>
            <div><label style={ss.label}>Phone</label><input style={ss.input} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            <div>
              <label style={ss.label}>Active</label>
              <select style={ss.input} value={form.is_active ? "true" : "false"} onChange={e => setForm({ ...form, is_active: e.target.value === "true" })}>
                <option value="true">Yes — Active</option>
                <option value="false">No — Inactive</option>
              </select>
            </div>
          </div>
          <label style={ss.label}>Address</label>
          <textarea style={{ ...ss.input, minHeight: 72, resize: "vertical" }} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => setModal(null)} style={ss.btnSec}>Cancel</button>
            <button onClick={save} style={ss.btn}>{editing ? "Save Changes" : "Create"}</button>
          </div>
        </Modal>
      )}
      {modal === "delete" && <ConfirmDlg msg={`Delete supplier "${editing?.name}"?`} onOk={del} onCancel={() => setModal(null)} />}
    </div>
  );
}

// ─── Purchase Orders ──────────────────────────────────────────────────────────
const EPO = { supplier: "", notes: "", expected_delivery: "", items: [] };

function PurchaseOrdersPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [pos, setPos]         = useState([]);
  const [sups, setSups]       = useState([]);
  const [prods, setProds]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null);
  const [form, setForm]       = useState(EPO);
  const [pg, setPg]           = useState(1);
  const [count, setCount]     = useState(0);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch(`/inventory/purchase-orders/?page=${pg}`, token).then(r => r.json())
      .then(d => { setPos(d.results || []); setCount(d.count || 0); })
      .finally(() => setLoading(false));
  }, [token, pg]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    apiFetch("/inventory/suppliers/?page_size=200", token).then(r => r.json()).then(d => setSups(d.results || []));
    apiFetch("/inventory/products/?page_size=200", token).then(r => r.json()).then(d => setProds(d.results || []));
  }, [token]);

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { product: "", quantity_ordered: 1, unit_cost: "" }] }));
  const remItem = i => setForm(f => ({ ...f, items: f.items.filter((_, x) => x !== i) }));
  const updItem = (i, field, val) => setForm(f => {
    const items = [...f.items];
    items[i] = { ...items[i], [field]: val };
    if (field === "product") {
      const p = prods.find(p => String(p.id) === String(val));
      if (p) items[i].unit_cost = String(p.cost_price);
    }
    return { ...f, items };
  });

  const generate = async () => {
    if (!form.supplier || form.items.length === 0) {
      toast("Select supplier and add items.", "warning"); return;
    }
    const payload = { ...form, items: form.items.map(it => ({ product: Number(it.product), quantity_ordered: Number(it.quantity_ordered), unit_cost: it.unit_cost })) };
    const res = await apiFetch("/inventory/purchase-orders/", token, { method: "POST", body: JSON.stringify(payload) });
    if (res.ok) { toast("Purchase Order created."); setModal(null); setForm(EPO); load(); }
    else toast("PO creation failed.", "error");
  };

  const markSent = async po => {
    const res = await apiFetch(`/inventory/purchase-orders/${po.id}/send/`, token, { method: "POST" });
    if (res.ok) { toast("PO sent to supplier."); load(); }
  };

  const receive = async po => {
    const res = await apiFetch(`/inventory/purchase-orders/${po.id}/receive/`, token, { method: "POST" });
    if (res.ok) { toast("Stock received & updated!"); load(); }
    else { const d = await res.json(); toast(d.error || "Receive failed.", "error"); }
  };

  return (
    <div>
      <PH title="Purchase Orders" sub="Reorder from suppliers">
        <button onClick={() => { setForm(EPO); setModal("create"); }} style={ss.btn}>+ New Purchase Order</button>
      </PH>

      <div style={ss.tableWrap}>
        <table style={ss.table}>
          <thead>
            <tr>{["PO #", "Supplier", "Status", "Items", "Total Cost", "Delivery", "Actions"].map(h => <th key={h} style={ss.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={7} style={{ textAlign: "center", padding: 48, color: C.muted }}>Loading…</td></tr> : (
              pos.length === 0 ? <tr><td colSpan={7} style={{ textAlign: "center", padding: 48, color: C.muted }}>No purchase orders yet.</td></tr> : (
                pos.map(p => (
                  <tr key={p.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={ss.td}><code style={{ color: C.brand, fontWeight: 700 }}>{p.po_number}</code></td>
                    <td style={{ ...ss.td, fontWeight: 600 }}>{p.supplier_name}</td>
                    <td style={ss.td}><Badge label={p.status} color={poColor(p.status)} /></td>
                    <td style={ss.td}>{p.items.length} items</td>
                    <td style={{ ...ss.td, fontWeight: 700 }}>KES {Number(p.total_cost).toLocaleString()}</td>
                    <td style={{ ...ss.td, color: C.muted, fontSize: 13 }}>{p.expected_delivery || "—"}</td>
                    <td style={ss.td}>
                      {p.status === "draft" && <button onClick={() => markSent(p)} style={ss.btnXs}>🚀 Send</button>}
                      {p.status === "sent" && <button onClick={() => receive(p)} style={{ ...ss.btnXs, color: C.success }}>📥 Receive</button>}
                    </td>
                  </tr>
                ))
              )
            )}
          </tbody>
        </table>
      </div>

      <Pager page={pg} total={Math.ceil(count / 25)} set={setPg} />

      {modal === "create" && (
        <Modal title="Generate Purchase Order" onClose={() => setModal(null)} width={700}>
          <div style={ss.grid2}>
            <div>
              <label style={ss.label}>Supplier *</label>
              <select style={ss.input} value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })}>
                <option value="">— Select Supplier —</option>
                {sups.filter(s => s.is_active).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label style={ss.label}>Expected Delivery</label>
              <input type="date" style={ss.input} value={form.expected_delivery} onChange={e => setForm({ ...form, expected_delivery: e.target.value })} />
            </div>
          </div>
          <label style={ss.label}>Notes</label>
          <textarea style={{ ...ss.input, minHeight: 48 }} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <label style={ss.label}>Order Items</label>
            <button onClick={addItem} style={{ ...ss.btnSec, padding: "4px 12px", fontSize: 12 }}>+ Add Item</button>
          </div>
          {form.items.map((it, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 90px 120px 38px", gap: 8, marginBottom: 8 }}>
              <select style={ss.input} value={it.product} onChange={e => updItem(i, "product", e.target.value)}>
                <option value="">— Product —</option>
                {prods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input type="number" min="1" style={ss.input} value={it.quantity_ordered} onChange={e => updItem(i, "quantity_ordered", e.target.value)} placeholder="Qty" />
              <input type="number" style={ss.input} value={it.unit_cost} onChange={e => updItem(i, "unit_cost", e.target.value)} placeholder="Cost" />
              <button onClick={() => remItem(i)} style={{ ...ss.btnXs, color: C.danger, height: 40 }}>✕</button>
            </div>
          ))}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
            <button onClick={() => setModal(null)} style={ss.btnSec}>Cancel</button>
            <button onClick={generate} style={ss.btn}>Generate PO</button>
          </div>
        </Modal>
      )}
    </div>
  );
}



// ─── Reports ──────────────────────────────────────────────────────────────────
function ReportsPage() {
  const { token } = useAuth();
  const [summary,  setSummary]  = useState(null);
  const [trend,    setTrend]    = useState([]);
  const [alerts,   setAlerts]   = useState(null);
  const [forecast, setForecast] = useState(null);
  const [tab, setTab]           = useState("overview");

  useEffect(() => {
    apiFetch("/reports/stock-summary/", token).then(r => r.json()).then(setSummary);
    apiFetch("/reports/sales-trends/?period=monthly&days=180", token).then(r => r.json()).then(d => {
      setTrend((d.trend || []).map(t => ({
        name: t.period ? new Date(t.period).toLocaleDateString("en-KE", { month: "short" }) : "—",
        revenue: parseFloat(t.revenue || 0),
        orders: t.order_count || 0,
      })));
    });
    apiFetch("/reports/low-stock-alerts/", token).then(r => r.json()).then(setAlerts);
    apiFetch("/reports/demand-forecast/", token).then(r => r.json()).then(setForecast);
  }, [token]);

  const TABS = [
    { k: "overview", label: "Overview" },
    { k: "sales",    label: "Sales Trend" },
    { k: "alerts",   label: `Low-Stock Alerts${alerts ? ` (${alerts.alert_count})` : ""}` },
    { k: "forecast", label: "Demand Forecast" },
  ];

  return (
    <div>
      <PH title="Reports & Analytics" sub="Operational insights and exports">
        <button onClick={() => window.open(`${API_BASE}/inventory/products/export/`, "_blank")} style={ss.btnSec}>⬇ Products CSV</button>
        <button onClick={() => window.open(`${API_BASE}/reports/export-orders/`, "_blank")} style={ss.btnSec}>⬇ Orders CSV</button>
      </PH>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, marginBottom: 24, borderBottom: `2px solid ${C.border}` }}>
        {TABS.map(t => (
          <button key={t.k} onClick={() => setTab(t.k)} style={{
            padding: "10px 20px", border: "none", background: "none", cursor: "pointer",
            fontWeight: tab === t.k ? 700 : 400,
            color: tab === t.k ? C.brand : C.muted,
            borderBottom: tab === t.k ? `2px solid ${C.brand}` : "2px solid transparent",
            marginBottom: -2, fontSize: 14, fontFamily: "'Inter', sans-serif",
          }}>{t.label}</button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && summary && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16, marginBottom: 24 }}>
            {[
              { label: "Total",        value: summary.total_products,     color: C.brand },
              { label: "In Stock",     value: summary.in_stock,           color: C.success },
              { label: "Low Stock",    value: summary.low_stock,          color: C.warning },
              { label: "Out of Stock", value: summary.out_of_stock,       color: C.danger },
              { label: "Discontinued", value: summary.discontinued,       color: "#94a3b8" },
            ].map(k => (
              <div key={k.label} style={{ ...ss.card, textAlign: "center", borderTop: `3px solid ${k.color}` }}>
                <div style={{ fontSize: 30, fontWeight: 800, color: k.color }}>{k.value}</div>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{k.label}</div>
              </div>
            ))}
          </div>
          <div style={ss.card}>
            <h3 style={ss.cardTitle}>Total Inventory Value (at cost)</h3>
            <div style={{ fontSize: 36, fontWeight: 800, color: C.success }}>
              KES {Number(summary.total_inventory_value_kes).toLocaleString()}
            </div>
            <div style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>
              Generated {new Date(summary.generated_at).toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Sales Trend */}
      {tab === "sales" && (
        <div style={ss.card}>
          <h3 style={ss.cardTitle}>Revenue & Orders — Last 6 Months</h3>
          {trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={trend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: C.muted }} />
                <YAxis tick={{ fontSize: 12, fill: C.muted }} />
                <Tooltip formatter={v => [`KES ${Number(v).toLocaleString()}`]} />
                <Legend />
                <Bar dataKey="revenue" fill={C.brand}   radius={[6, 6, 0, 0]} name="Revenue (KES)" />
                <Bar dataKey="orders"  fill={C.success} radius={[6, 6, 0, 0]} name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 280, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: C.muted, gap: 10 }}>
              <span style={{ fontSize: 40 }}>📊</span>
              No delivered orders yet — deliver orders to generate trend data.
            </div>
          )}
        </div>
      )}

      {/* Low-Stock Alerts */}
      {tab === "alerts" && alerts && (
        <div>
          <div style={{
            ...ss.card, marginBottom: 20,
            background: alerts.alert_count > 0 ? "#fffbeb" : "#f0fdf4",
            border: `1px solid ${alerts.alert_count > 0 ? "#fcd34d" : "#86efac"}`,
          }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: alerts.alert_count > 0 ? C.warning : C.success }}>
              {alerts.alert_count > 0 ? `⚠  ${alerts.alert_count} products need restocking` : "✓  All stock levels are healthy"}
            </div>
          </div>
          {alerts.products.length > 0 && (
            <div style={ss.tableWrap}>
              <table style={ss.table}>
                <thead>
                  <tr>{["SKU", "Name", "Qty", "Reorder At", "Reorder Qty", "Status", "Supplier"].map(h => <th key={h} style={ss.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {alerts.products.map(p => (
                    <tr key={p.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={ss.td}><code style={{ fontSize: 12, color: C.brand }}>{p.sku}</code></td>
                      <td style={{ ...ss.td, fontWeight: 600 }}>{p.name}</td>
                      <td style={{ ...ss.td, fontWeight: 800, color: C.danger }}>{p.quantity}</td>
                      <td style={ss.td}>{p.reorder_level}</td>
                      <td style={ss.td}>{p.reorder_quantity}</td>
                      <td style={ss.td}><Badge label={p.status.replace(/_/g, " ")} color={stockColor(p.status)} /></td>
                      <td style={{ ...ss.td, color: C.muted }}>{p.supplier__name || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Demand Forecast */}
      {tab === "forecast" && forecast && (
        <div>
          <div style={{ ...ss.card, background: "#f0f9ff", border: "1px solid #bae6fd", marginBottom: 20 }}>
            <p style={{ margin: 0, fontSize: 14, color: "#0369a1" }}>
              📈 Velocity-based forecast over <strong>{forecast.analysis_window_days} days</strong>. Products with &lt;14 days of stock are flagged for immediate restock.
              <br /><em style={{ opacity: 0.8 }}>AI model integration hook is in place — ready to be swapped for an ML model.</em>
            </p>
          </div>
          {forecast.forecasts.length === 0 ? (
            <div style={{ ...ss.card, textAlign: "center", padding: 60, color: C.muted }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔮</div>
              No sales data yet. Deliver some orders to enable forecasting.
            </div>
          ) : (
            <div style={ss.tableWrap}>
              <table style={ss.table}>
                <thead>
                  <tr>{["SKU", "Product", "Current Stock", "Sold (period)", "Daily Velocity", "Days Remaining", "Recommendation"].map(h => <th key={h} style={ss.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {forecast.forecasts.map(f => (
                    <tr key={f.product_id} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <td style={ss.td}><code style={{ fontSize: 12, color: C.brand }}>{f.sku}</code></td>
                      <td style={{ ...ss.td, fontWeight: 600 }}>{f.name}</td>
                      <td style={ss.td}>{f.current_stock}</td>
                      <td style={ss.td}>{f.units_sold_in_period}</td>
                      <td style={{ ...ss.td, color: C.muted }}>{f.daily_sales_velocity}/day</td>
                      <td style={{ ...ss.td, fontWeight: 800, color: f.restock_recommended ? C.danger : C.success }}>
                        {f.estimated_days_of_stock === "N/A" ? "∞" : `${f.estimated_days_of_stock}d`}
                      </td>
                      <td style={ss.td}>
                        {f.restock_recommended
                          ? <Badge label="🔴 Restock Now" color={C.danger} />
                          : <Badge label="✓ OK" color={C.success} />
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
