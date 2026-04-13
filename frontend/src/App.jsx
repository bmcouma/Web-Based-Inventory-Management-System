import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export const API_BASE = "http://localhost:8000/api/v1";

const C = {
  brand: "#6366f1", brandDk: "#4f46e5", sidebar: "#0f172a", sidebarH: "#1e293b",
  success: "#10b981", warning: "#f59e0b", danger: "#ef4444", info: "#3b82f6",
  text: "#1e293b", muted: "#64748b", bg: "#f1f5f9", card: "#ffffff", border: "#e2e8f0",
  PIE: ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#94a3b8"]
};

const ss = {
  btn: { padding: "10px 22px", background: C.brand, color: "#fff", border: "none", borderRadius: 12, cursor: "pointer", fontSize: 14, fontWeight: 600, transition: "all 0.2s ease" },
  btnSec: { padding: "9px 16px", background: "transparent", color: C.muted, border: `1.5px solid ${C.border}`, borderRadius: 12, cursor: "pointer", fontSize: 14, fontWeight: 500 },
  btnXs: { padding: "4px 10px", background: "transparent", color: C.muted, border: `1px solid ${C.border}`, borderRadius: 8, cursor: "pointer", fontSize: 13, marginRight: 4, transition: "color 0.2s" },
  label: { display: "block", fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8, marginTop: 4 },
  input: { display: "block", width: "100%", padding: "11px 16px", marginBottom: 18, border: `1.5px solid ${C.border}`, borderRadius: 12, fontSize: 14, outline: "none", boxSizing: "border-box", color: C.text, background: "#fff", fontFamily: "'Inter', sans-serif", transition: "border-color 0.15s, box-shadow 0.15s" },
  card: { background: C.card, borderRadius: 16, padding: 26, boxShadow: "0 4px 12px rgba(15,23,42,0.04)", border: `1px solid ${C.border}44` },
  cardTitle: { margin: "0 0 20px", fontSize: 16, fontWeight: 700, color: C.text },
  tableWrap: { background: C.card, borderRadius: 16, overflow: "hidden", border: `1px solid ${C.border}`, boxShadow: "0 2px 8px rgba(15,23,42,0.05)", overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { padding: "14px 16px", textAlign: "left", fontSize: 12, color: C.muted, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap", background: "#f8fafc", borderBottom: `1px solid ${C.border}` },
  td: { padding: "14px 16px", fontSize: 14, color: C.text, verticalAlign: "middle" },
  badge: { display: "inline-block", padding: "4px 12px", borderRadius: 24, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 },
};

async function apiFetch(path, token, options = {}) {
  const isFormData = options.body instanceof FormData;
  const headers = { Authorization: `Token ${token}`, ...(!isFormData && options.body ? { "Content-Type": "application/json" } : {}), ...options.headers };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (res.status === 401) { localStorage.removeItem("inv_token"); window.location.reload(); }
  return res;
}

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);
const ToastCtx = createContext(null);
const useToast = () => useContext(ToastCtx);

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const toast = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);
  const icons = { success: "✓", error: "✕", warning: "⚠" };
  const colors = { success: C.success, error: C.danger, warning: C.warning };
  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
        {toasts.map(t => (
          <div key={t.id} style={{ padding: "12px 20px", borderRadius: 12, background: colors[t.type], color: "#fff", fontSize: 14, fontWeight: 500, boxShadow: "0 8px 24px rgba(0,0,0,0.2)", display: "flex", gap: 10 }}>
            <span style={{ fontWeight: 800 }}>{icons[t.type]}</span><span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

function Modal({ title, onClose, children, width = 580 }) {
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15,23,42,0.7)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: C.card, borderRadius: 18, width: "100%", maxWidth: width, boxShadow: "0 28px 72px rgba(0,0,0,0.4)" }}>
        <div style={{ padding: "18px 24px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ margin: 0, fontSize: 17 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: C.muted }}>×</button>
        </div>
        <div style={{ padding: 24, maxHeight: "80vh", overflowY: "auto" }}>{children}</div>
      </div>
    </div>
  );
}

function PH({ title, sub, children }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800 }}>{title}</h1>
        {sub && <p style={{ color: C.muted, margin: "4px 0 0" }}>{sub}</p>}
      </div>
      <div style={{ display: "flex", gap: 10 }}>{children}</div>
    </div>
  );
}

function Badge({ label, color }) { return <span style={{ ...ss.badge, background: color + "22", color, border: `1px solid ${color}44` }}>{label}</span>; }

const stockColor = s => ({ in_stock: C.success, low_stock: C.warning, out_of_stock: C.danger, discontinued: "#94a3b8" }[s] || C.muted);
const orderColor = s => ({ pending: C.warning, confirmed: C.info, processing: C.brand, shipped: "#8b5cf6", delivered: C.success, cancelled: C.danger }[s] || C.muted);
const poColor = s => ({ draft: C.muted, sent: C.info, received: C.success, cancelled: C.danger }[s] || C.muted);

const NAV = [
  { k: "dashboard", label: "Dashboard", i: "◈", r: ["admin", "manager", "viewer"] },
  { k: "products", label: "Products", i: "▦", r: ["admin", "manager", "viewer"] },
  { k: "orders", label: "Orders", i: "◉", r: ["admin", "manager", "viewer"] },
  { k: "purchase-orders", label: "P. Orders", i: "📜", r: ["admin", "manager"] },
  { k: "movements", label: "Stock Log", i: "⇅", r: ["admin", "manager"] },
  { k: "categories", label: "Categories", i: "▣", r: ["admin", "manager", "viewer"] },
  { k: "suppliers", label: "Suppliers", i: "⊞", r: ["admin", "manager", "viewer"] },
  { k: "reports", label: "Reports", i: "▲", r: ["admin", "manager"] },
];

function App() {
  const [token, setToken] = useState(() => localStorage.getItem("inv_token"));
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");

  useEffect(() => { if (token) apiFetch("/users/profile/", token).then(r => r.json()).then(setUser).catch(() => logout()); }, [token]);

  const login = (u, t) => { setUser(u); setToken(t); localStorage.setItem("inv_token", t); };
  const logout = () => { setUser(null); setToken(null); localStorage.removeItem("inv_token"); };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      <ToastProvider>
        {!token ? <LoginPage /> : (
          <div style={{ display: "flex", minHeight: "100vh", background: C.bg, fontFamily: "'Inter', sans-serif" }}>
            <Sidebar page={page} setPage={setPage} />
            <main style={{ flex: 1, padding: 32, overflowY: "auto" }}>
              {page === "dashboard" && <DashboardPage />}
              {page === "products" && <ProductsPage />}
              {page === "orders" && <OrdersPage />}
              {page === "purchase-orders" && <PurchaseOrdersPage />}
              {page === "movements" && <MovementsPage />}
              {page === "categories" && <CategoriesPage />}
              {page === "suppliers" && <SuppliersPage />}
              {page === "reports" && <ReportsPage />}
            </main>
          </div>
        )}
      </ToastProvider>
    </AuthContext.Provider>
  );
}

function Sidebar({ page, setPage }) {
  const { user, logout } = useAuth();
  return (
    <aside style={{ width: 240, background: C.sidebar, display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "20px 24px", color: "#fff", fontWeight: 800, fontSize: 18, display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ width: 32, height: 32, background: C.brand, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>I</div>
        Inventory MS
      </div>
      <nav style={{ flex: 1, padding: "10px 0" }}>
        {NAV.filter(n => !user || n.r.includes(user.profile?.role)).map(n => (
          <button key={n.k} onClick={() => setPage(n.k)} style={{
            width: "100%", padding: "12px 24px", border: "none", background: page === n.k ? "#ffffff11" : "transparent",
            color: page === n.k ? C.brand : "#94a3b8", textAlign: "left", cursor: "pointer", display: "flex", gap: 12, fontSize: 14, fontWeight: page === n.k ? 600 : 400
          }}>
            <span>{n.i}</span>{n.label}
          </button>
        ))}
      </nav>
      <div style={{ padding: 20, borderTop: "1px solid #ffffff11" }}>
        <div style={{ color: "#fff", fontSize: 12, marginBottom: 12, opacity: 0.6 }}>Logged as {user?.username}</div>
        <button onClick={logout} style={{ width: "100%", padding: "8px", background: "#ef444422", color: "#ef4444", border: "none", borderRadius: 8, cursor: "pointer" }}>Logout</button>
      </div>
    </aside>
  );
}

function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [err, setErr] = useState("");

  const submit = async () => {
    try {
      const res = await fetch(`${API_BASE}/users/login/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await res.json();
      if (res.ok) login(d.user, d.token); else setErr(d.non_field_errors?.[0] || "Auth failed.");
    } catch { setErr("Server offline."); }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f172a" }}>
      <div style={{ background: "#fff", padding: 40, borderRadius: 24, width: 360, boxShadow: "0 20px 50px rgba(0,0,0,0.3)" }}>
        <h2 style={{ margin: "0 0 10px", fontSize: 24 }}>Welcome Back</h2>
        <p style={{ color: C.muted, fontSize: 14, marginBottom: 30 }}>Sign in to manage your inventory</p>
        {err && <div style={{ color: "red", padding: "10px 0", fontSize: 13 }}>{err}</div>}
        <label style={ss.label}>Username</label><input style={ss.input} value={form.username} onChange={e => setForm({...form, username: e.target.value})} />
        <label style={ss.label}>Password</label><input type="password" style={ss.input} value={form.password} onChange={e => setForm({...form, password: e.target.value})} onKeyDown={e => e.key==="Enter" && submit()} />
        <button onClick={submit} style={{ ...ss.btn, width: "100%", padding: 14, marginTop: 10 }}>Sign In</button>
      </div>
    </div>
  );
}

function DashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState([]);

  useEffect(() => {
    apiFetch("/inventory/products/dashboard-stats/", token).then(r => r.json()).then(setStats);
    apiFetch("/reports/sales-trends/?days=180", token).then(r => r.json()).then(d => setTrend(d.trend || []));
  }, [token]);

  const pieData = stats?.stock_breakdown ? Object.entries(stats.stock_breakdown).map(([name, value]) => ({ name, value })) : [];

  return (
    <div>
      <PH title="Dashboard" sub="Key performance indicators" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24, marginBottom: 32 }}>
        <div style={ss.card}><h3>Total Products</h3><div style={{ fontSize: 36, fontWeight: 800 }}>{stats?.total_products || 0}</div></div>
        <div style={ss.card}><h3>Inventory Value</h3><div style={{ fontSize: 36, fontWeight: 800, color: C.success }}>KES {Number(stats?.total_inventory_value_kes || 0).toLocaleString()}</div></div>
        <div style={ss.card}><h3>Low Stock Items</h3><div style={{ fontSize: 36, fontWeight: 800, color: C.danger }}>{stats?.low_stock_count || 0}</div></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
        <div style={ss.card}>
          <h3 style={ss.cardTitle}>Sales Revenue (6mo)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trend}><XAxis dataKey="period" /> <YAxis /> <Tooltip /> <Area type="monotone" dataKey="revenue" stroke={C.brand} fill={C.brand} fillOpacity={0.1} /></AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={ss.card}>
          <h3 style={ss.cardTitle}>Stock Distribution</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>{pieData.map((_, i) => <Cell key={i} fill={C.PIE[i % C.PIE.length]} />)}</Pie><Tooltip /></PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function ProductsPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [cats, setCats] = useState([]);
  const [sups, setSups] = useState([]);
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  const load = useCallback(() => apiFetch("/inventory/products/", token).then(r => r.json()).then(d => setRows(d.results || [])), [token]);
  useEffect(() => { load(); apiFetch("/inventory/categories/", token).then(r => r.json()).then(d => setCats(d.results || [])); apiFetch("/inventory/suppliers/", token).then(r => r.json()).then(d => setSups(d.results || [])); }, [token, load]);

  const onSave = async () => {
    const res = await apiFetch(editing ? `/inventory/products/${editing.id}/` : "/inventory/products/", token, { method: editing ? "PUT" : "POST", body: JSON.stringify(form) });
    if (res.ok) { toast("Product saved!"); setModal(null); load(); } else { toast("Error occurred", "error"); }
  };

  return (
    <div>
      <PH title="Products" sub="Managing your warehouse catalog"><button onClick={() => { setForm({}); setEditing(null); setModal("form"); }} style={ss.btn}>+ New Product</button></PH>
      <div style={ss.tableWrap}>
        <table style={ss.table}>
          <thead><tr>{["SKU", "Name", "Category", "Price", "Stock", "Status", "Actions"].map(h => <th key={h} style={ss.th}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.map(p => (
              <tr key={p.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td style={ss.td}><code style={{ color: C.brand, fontWeight: 700 }}>{p.sku}</code></td><td style={ss.td}><strong>{p.name}</strong></td><td style={ss.td}>{p.category_name}</td>
                <td style={ss.td}>KES {Number(p.price).toLocaleString()}</td><td style={ss.td}><strong>{p.quantity}</strong></td><td style={ss.td}><Badge label={p.status} color={stockColor(p.status)} /></td>
                <td style={ss.td}><button onClick={() => { setForm(p); setEditing(p); setModal("form"); }} style={ss.btnXs}>✎</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal === "form" && (
        <Modal title={editing ? "Edit Product" : "Create Product"} onClose={() => setModal(null)}>
          <div style={ss.grid2}><div><label style={ss.label}>SKU</label><input style={ss.input} value={form.sku||''} onChange={e => setForm({...form, sku: e.target.value})} /></div><div><label style={ss.label}>Name</label><input style={ss.input} value={form.name||''} onChange={e => setForm({...form, name: e.target.value})} /></div></div>
          <div style={ss.grid2}><div><label style={ss.label}>Category</label><select style={ss.input} value={form.category||''} onChange={e => setForm({...form, category: e.target.value})}><option value="">Select</option>{cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div><div><label style={ss.label}>Supplier</label><select style={ss.input} value={form.supplier||''} onChange={e => setForm({...form, supplier: e.target.value})}><option value="">Select</option>{sups.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div></div>
          <div style={ss.grid2}><div><label style={ss.label}>Sale Price</label><input type="number" style={ss.input} value={form.price||''} onChange={e => setForm({...form, price: e.target.value})} /></div><div><label style={ss.label}>Cost Price</label><input type="number" style={ss.input} value={form.cost_price||''} onChange={e => setForm({...form, cost_price: e.target.value})} /></div></div>
          <div style={ss.grid2}><div><label style={ss.label}>Quantity</label><input type="number" style={ss.input} value={form.quantity||''} onChange={e => setForm({...form, quantity: e.target.value})} /></div><div><label style={ss.label}>Reorder Lvl</label><input type="number" style={ss.input} value={form.reorder_level||''} onChange={e => setForm({...form, reorder_level: e.target.value})} /></div></div>
          <button onClick={onSave} style={{ ...ss.btn, width: "100%", marginTop: 10 }}>Save Product</button>
        </Modal>
      )}
    </div>
  );
}

function OrdersPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [prods, setProds] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ customer_name: "", customer_email: "", items: [] });

  const load = useCallback(() => apiFetch("/inventory/orders/", token).then(r => r.json()).then(d => setRows(d.results || [])), [token]);
  useEffect(() => { load(); apiFetch("/inventory/products/", token).then(r => r.json()).then(d => setProds(d.results || [])); }, [token, load]);

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { product: "", quantity: 1, unit_price: 0 }] }));
  const updItem = (i, field, val) => setForm(f => {
    const items = [...f.items]; items[i] = { ...items[i], [field]: val };
    if (field === "product") { const p = prods.find(x => String(x.id) === String(val)); if (p) items[i].unit_price = p.price; }
    return { ...f, items };
  });

  const onSave = async () => {
    const res = await apiFetch("/inventory/orders/", token, { method: "POST", body: JSON.stringify(form) });
    if (res.ok) { toast("Order created!"); setModal(null); load(); }
  };
  const updateStatus = async (o, s) => { if ((await apiFetch(`/inventory/orders/${o.id}/update-status/`, token, { method: "POST", body: JSON.stringify({ status: s }) })).ok) { toast(`Updated to ${s}`); load(); } };

  return (
    <div>
      <PH title="Orders" sub="Recent sales history"><button onClick={() => { setForm({ customer_name: "", customer_email: "", items: [] }); setModal("add"); }} style={ss.btn}>+ New Order</button></PH>
      <div style={ss.tableWrap}>
        <table style={ss.table}>
          <thead><tr>{["Order #", "Customer", "Total", "Status", "Action"].map(h => <th key={h} style={ss.th}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.map(o => (
              <tr key={o.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td style={ss.td}><code style={{ fontWeight: 700 }}>{o.order_number}</code></td><td style={ss.td}><strong>{o.customer_name}</strong></td>
                <td style={ss.td}>KES {Number(o.total_amount).toLocaleString()}</td><td style={ss.td}><Badge label={o.status} color={orderColor(o.status)} /></td>
                <td style={ss.td}><select value={o.status} onChange={e => updateStatus(o, e.target.value)} style={{ ...ss.input, padding: 6, width: "auto", margin:0 }}>{["pending","confirmed","processing","shipped","delivered","cancelled"].map(s => <option key={s} value={s}>{s}</option>)}</select></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal === "add" && (
        <Modal title="Create New Order" onClose={() => setModal(null)} width={640}>
           <label style={ss.label}>Customer Name</label><input style={ss.input} value={form.customer_name} onChange={e => setForm({...form, customer_name: e.target.value})} />
           <label style={ss.label}>Customer Email</label><input style={ss.input} value={form.customer_email} onChange={e => setForm({...form, customer_email: e.target.value})} />
           <div style={{ marginBottom: 15, border: `1px solid ${C.border}`, borderRadius: 12, padding: 15 }}>
             <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}><strong>Items</strong> <button onClick={addItem} style={ss.btnXs}>+ Add</button></div>
             {form.items.map((it, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 80px 100px", gap: 10, marginBottom: 8 }}>
                  <select style={{...ss.input, marginBottom: 0}} value={it.product} onChange={e => updItem(i, "product", e.target.value)}><option value="">Select</option>{prods.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                  <input type="number" style={{...ss.input, marginBottom: 0}} value={it.quantity} onChange={e => updItem(i, "quantity", e.target.value)} />
                  <div style={{ paddingTop: 10, fontSize: 14 }}>KES {it.unit_price}</div>
                </div>
             ))}
           </div>
           <button onClick={onSave} style={{ ...ss.btn, width: "100%" }}>Create Order</button>
        </Modal>
      )}
    </div>
  );
}

function PurchaseOrdersPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const load = useCallback(() => apiFetch("/inventory/purchase-orders/", token).then(r => r.json()).then(d => setRows(d.results || [])), [token]);
  useEffect(() => { load(); }, [load]);

  const onSend = async po => { if (await apiFetch(`/inventory/purchase-orders/${po.id}/send/`, token, { method: "POST" })) { toast("PO Sent!"); load(); } };
  const onRecv = async po => { const res = await apiFetch(`/inventory/purchase-orders/${po.id}/receive/`, token, { method: "POST" }); if (res.ok) { toast("Stock Received!"); load(); } };

  return (
    <div>
      <PH title="Purchase Orders" sub="Replenishing inventory stock" />
      <div style={ss.tableWrap}>
        <table style={ss.table}>
          <thead><tr>{["PO #", "Supplier", "Status", "Total Cost", "Action"].map(h => <th key={h} style={ss.th}>{h}</th>)}</tr></thead>
          <tbody>
            {rows.map(p => (
              <tr key={p.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td style={ss.td}><code style={{ fontWeight: 700 }}>{p.po_number}</code></td><td style={ss.td}><strong>{p.supplier_name}</strong></td>
                <td style={ss.td}><Badge label={p.status} color={poColor(p.status)} /></td><td style={ss.td}>KES {Number(p.total_cost).toLocaleString()}</td>
                <td style={ss.td}>
                  {p.status === "draft" && <button onClick={() => onSend(p)} style={ss.btnXs}>🚀 Send</button>}
                  {p.status === "sent" && <button onClick={() => onRecv(p)} style={{ ...ss.btnXs, color: C.success }}>📥 Receive</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MovementsPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState([]);
  useEffect(() => { apiFetch("/inventory/movements/", token).then(r => r.json()).then(d => setRows(d.results || [])); }, [token]);
  return (
    <div>
      <PH title="Stock History" sub="Audit trail" />
      <div style={ss.tableWrap}>
        <table style={ss.table}>
          <thead><tr>{["Product", "Type", "Qty", "Reason"].map(h => <th key={h} style={ss.th}>{h}</th>)}</tr></thead>
          <tbody>{rows.map(m => (<tr key={m.id} style={{ borderBottom: `1px solid ${C.border}` }}><td style={ss.td}>{m.product_name}</td><td style={ss.td}><Badge label={m.movement_type} color={m.movement_type==="in"?C.success:C.danger} /></td><td style={ss.td}>{m.quantity}</td><td style={ss.td}>{m.reason}</td></tr>))}</tbody>
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
      <PH title="Categories" sub="Product groupings and logic" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
        {rows.map(c => (
          <div key={c.id} style={{ ...ss.card, padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", border: `1px solid ${C.border}`, transition: "transform 0.2s" }} onMouseEnter={e => e.currentTarget.style.transform = "translateY(-4px)"} onMouseLeave={e => e.currentTarget.style.transform = "none"}>
            <img src={`https://picsum.photos/seed/${encodeURIComponent(c.name)}/400/200`} alt={c.name} style={{ width: "100%", height: 140, objectFit: "cover", borderBottom: `1px solid ${C.border}44` }} />
            <div style={{ padding: 20 }}>
              <h4 style={{ margin: "0 0 8px", fontSize: 18, color: C.text }}>{c.name}</h4>
              <p style={{ margin: 0, fontSize: 13, color: C.muted, lineHeight: 1.5 }}>{c.description}</p>
            </div>
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
    <div><PH title="Suppliers" sub="" /><div style={ss.tableWrap}><table style={ss.table}><thead><tr>{["Company", "Email"].map(h => <th key={h} style={ss.th}>{h}</th>)}</tr></thead><tbody>{rows.map(s => (<tr key={s.id} style={{ borderBottom: `1px solid ${C.border}` }}><td style={ss.td}>{s.name}</td><td style={ss.td}>{s.contact_email}</td></tr>))}</tbody></table></div></div>
  );
}

function ReportsPage() {
  const { token } = useAuth();
  const [forecast, setForecast] = useState([]);
  useEffect(() => { apiFetch("/reports/demand-forecast/", token).then(r => r.json()).then(d => setForecast(d.forecasts || [])); }, [token]);
  return (
    <div>
      <PH title="Intelligent Reports" sub="ML-powered data analysis"><button onClick={() => window.open(`${API_BASE}/reports/export-orders/`, "_blank")} style={ss.btnSec}>⬇ Export</button></PH>
      <div style={ss.card}>
        <h3 style={ss.cardTitle}>30-Day Demand Forecast</h3>
        <table style={ss.table}>
          <thead><tr>{["Product", "Velocity", "Recommendation"].map(h => <th key={h} style={ss.th}>{h}</th>)}</tr></thead>
          <tbody>{forecast.map((f, i) => (<tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}><td style={ss.td}>{f.name}</td><td style={ss.td}>{f.avg_daily_sales.toFixed(2)} units/day</td><td style={ss.td}><Badge label={f.recommendation} color={f.recommendation==="REORDER_NOW"?C.danger:C.success}/></td></tr>))}</tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
