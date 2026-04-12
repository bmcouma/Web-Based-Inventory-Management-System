// frontend/src/App.jsx
// Main application shell with routing and auth context.
// Author: Bravin Ouma | Teklini Technologies

import React, { createContext, useContext, useState } from "react";

// ─── Auth Context ─────────────────────────────────────────────────────────────
export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// ─── API Base ─────────────────────────────────────────────────────────────────
export const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000/api/v1";

// ─── Simple Router (no external dependency) ──────────────────────────────────
const ROUTES = {
  dashboard: "dashboard",
  products: "products",
  orders: "orders",
  reports: "reports",
  login: "login",
};

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("inv_token") || null);
  const [page, setPage] = useState(token ? ROUTES.dashboard : ROUTES.login);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem("inv_token", authToken);
    setPage(ROUTES.dashboard);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("inv_token");
    setPage(ROUTES.login);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      <div className="app-shell">
        {!token ? (
          <LoginPage />
        ) : (
          <Layout page={page} setPage={setPage}>
            {page === ROUTES.dashboard && <DashboardPage />}
            {page === ROUTES.products && <ProductsPage />}
            {page === ROUTES.orders && <OrdersPage />}
            {page === ROUTES.reports && <ReportsPage />}
          </Layout>
        )}
      </div>
    </AuthContext.Provider>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
function Layout({ children, page, setPage }) {
  const { user, logout } = useAuth();
  const navItems = [
    { key: "dashboard", label: "Dashboard", icon: "📊" },
    { key: "products", label: "Products", icon: "📦" },
    { key: "orders", label: "Orders", icon: "🛒" },
    { key: "reports", label: "Reports", icon: "📈" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "Inter, sans-serif" }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, background: "#1a1a2e", color: "#fff",
        display: "flex", flexDirection: "column", padding: "24px 0",
      }}>
        <div style={{ padding: "0 20px 24px", borderBottom: "1px solid #2d2d4e" }}>
          <div style={{ fontWeight: 700, fontSize: 18, color: "#4fc3f7" }}>
            Inventory MS
          </div>
          <div style={{ fontSize: 12, color: "#9e9e9e", marginTop: 4 }}>
            Teklini Technologies
          </div>
        </div>
        <nav style={{ flex: 1, padding: "16px 0" }}>
          {navItems.map(item => (
            <button
              key={item.key}
              onClick={() => setPage(item.key)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", padding: "12px 20px", border: "none",
                background: page === item.key ? "#2d2d4e" : "transparent",
                color: page === item.key ? "#4fc3f7" : "#e0e0e0",
                cursor: "pointer", fontSize: 14, textAlign: "left",
                borderLeft: page === item.key ? "3px solid #4fc3f7" : "3px solid transparent",
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div style={{ padding: "16px 20px", borderTop: "1px solid #2d2d4e" }}>
          <div style={{ fontSize: 13, color: "#9e9e9e", marginBottom: 8 }}>
            {user?.full_name || "User"}
          </div>
          <button
            onClick={logout}
            style={{
              background: "#c62828", color: "#fff", border: "none",
              padding: "8px 16px", borderRadius: 6, cursor: "pointer", fontSize: 13,
            }}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, background: "#f5f7fa", padding: 32, overflowY: "auto" }}>
        {children}
      </main>
    </div>
  );
}

// ─── Login Page ───────────────────────────────────────────────────────────────
function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/users/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        login(data.user, data.token);
      } else {
        setError(data.non_field_errors?.[0] || "Invalid credentials.");
      }
    } catch {
      setError("Server unreachable. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#1a1a2e",
    }}>
      <div style={{
        background: "#fff", borderRadius: 12, padding: 40,
        width: 360, boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
      }}>
        <h2 style={{ margin: "0 0 8px", color: "#1a1a2e" }}>Inventory MS</h2>
        <p style={{ color: "#9e9e9e", margin: "0 0 24px", fontSize: 14 }}>
          Teklini Technologies
        </p>
        {error && (
          <div style={{
            background: "#ffebee", color: "#c62828", padding: "10px 14px",
            borderRadius: 6, marginBottom: 16, fontSize: 13,
          }}>
            {error}
          </div>
        )}
        <input
          type="text" placeholder="Username"
          value={form.username}
          onChange={e => setForm({ ...form, username: e.target.value })}
          style={inputStyle}
        />
        <input
          type="password" placeholder="Password"
          value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          style={inputStyle}
        />
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: "100%", padding: "12px", background: "#1a1a2e",
            color: "#fff", border: "none", borderRadius: 8,
            cursor: loading ? "not-allowed" : "pointer", fontSize: 15, fontWeight: 600,
          }}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </div>
    </div>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────
function DashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);

  React.useEffect(() => {
    fetch(`${API_BASE}/inventory/products/dashboard-stats/`, {
      headers: { Authorization: `Token ${token}` },
    })
      .then(r => r.json())
      .then(setStats)
      .catch(console.error);
  }, [token]);

  const cards = stats ? [
    { label: "Total Products", value: stats.total_products, color: "#1a1a2e", icon: "📦" },
    { label: "Low / Out of Stock", value: stats.low_stock_count, color: "#e65100", icon: "⚠️" },
    { label: "Inventory Value (KES)", value: `${Number(stats.total_inventory_value_kes).toLocaleString()}`, color: "#2e7d32", icon: "💰" },
  ] : [];

  return (
    <div>
      <h1 style={headingStyle}>Dashboard</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 32 }}>
        {cards.map(card => (
          <div key={card.label} style={{
            background: "#fff", borderRadius: 12, padding: 24,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)", borderTop: `4px solid ${card.color}`,
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{card.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: card.color }}>{card.value ?? "—"}</div>
            <div style={{ color: "#666", fontSize: 14, marginTop: 4 }}>{card.label}</div>
          </div>
        ))}
      </div>
      {!stats && <p style={{ color: "#999" }}>Loading stats...</p>}
    </div>
  );
}

// ─── Products Page ────────────────────────────────────────────────────────────
function ProductsPage() {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadProducts = () => {
    setLoading(true);
    fetch(`${API_BASE}/inventory/products/?search=${search}`, {
      headers: { Authorization: `Token ${token}` },
    })
      .then(r => r.json())
      .then(d => setProducts(d.results || []))
      .finally(() => setLoading(false));
  };

  React.useEffect(() => { loadProducts(); }, [search]);

  const statusColor = s => ({
    in_stock: "#2e7d32", low_stock: "#e65100", out_of_stock: "#c62828", discontinued: "#9e9e9e",
  }[s] || "#555");

  return (
    <div>
      <h1 style={headingStyle}>Products</h1>
      <input
        placeholder="Search by name or SKU..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ ...inputStyle, width: 300, marginBottom: 20 }}
      />
      {loading ? (
        <p style={{ color: "#999" }}>Loading products...</p>
      ) : (
        <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f5f7fa" }}>
                {["SKU", "Name", "Category", "Price (KES)", "Qty", "Status"].map(h => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 32, color: "#999" }}>No products found.</td></tr>
              ) : products.map(p => (
                <tr key={p.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={tdStyle}>{p.sku}</td>
                  <td style={tdStyle}>{p.name}</td>
                  <td style={tdStyle}>{p.category_name || "—"}</td>
                  <td style={tdStyle}>{Number(p.price).toLocaleString()}</td>
                  <td style={tdStyle}>{p.quantity}</td>
                  <td style={tdStyle}>
                    <span style={{
                      background: statusColor(p.status), color: "#fff",
                      padding: "3px 10px", borderRadius: 12, fontSize: 12,
                    }}>
                      {p.status?.replace("_", " ")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Orders Page ──────────────────────────────────────────────────────────────
function OrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);

  React.useEffect(() => {
    fetch(`${API_BASE}/inventory/orders/`, {
      headers: { Authorization: `Token ${token}` },
    })
      .then(r => r.json())
      .then(d => setOrders(d.results || []));
  }, []);

  return (
    <div>
      <h1 style={headingStyle}>Orders</h1>
      <div style={{ background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f5f7fa" }}>
              {["Order #", "Customer", "Status", "Total (KES)", "Date"].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: "center", padding: 32, color: "#999" }}>No orders yet.</td></tr>
            ) : orders.map(o => (
              <tr key={o.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                <td style={tdStyle}>{o.order_number}</td>
                <td style={tdStyle}>{o.customer_name}</td>
                <td style={tdStyle}>{o.status}</td>
                <td style={tdStyle}>{Number(o.total_amount).toLocaleString()}</td>
                <td style={tdStyle}>{new Date(o.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Reports Page ─────────────────────────────────────────────────────────────
function ReportsPage() {
  const { token } = useAuth();
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState(null);

  React.useEffect(() => {
    fetch(`${API_BASE}/reports/stock-summary/`, { headers: { Authorization: `Token ${token}` } })
      .then(r => r.json()).then(setSummary);
    fetch(`${API_BASE}/reports/low-stock-alerts/`, { headers: { Authorization: `Token ${token}` } })
      .then(r => r.json()).then(setAlerts);
  }, []);

  return (
    <div>
      <h1 style={headingStyle}>Reports</h1>
      {summary && (
        <div style={{ background: "#fff", borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
          <h3 style={{ margin: "0 0 16px" }}>Stock Summary</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {[
              ["Total Products", summary.total_products],
              ["In Stock", summary.in_stock],
              ["Low Stock", summary.low_stock],
              ["Out of Stock", summary.out_of_stock],
            ].map(([label, val]) => (
              <div key={label} style={{ textAlign: "center", padding: 16, background: "#f9f9f9", borderRadius: 8 }}>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{val}</div>
                <div style={{ color: "#666", fontSize: 13 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {alerts && alerts.alert_count > 0 && (
        <div style={{ background: "#fff3e0", borderRadius: 12, padding: 24, border: "1px solid #ffe0b2" }}>
          <h3 style={{ margin: "0 0 12px", color: "#e65100" }}>
            ⚠️ Low Stock Alerts ({alerts.alert_count})
          </h3>
          {alerts.products.slice(0, 5).map(p => (
            <div key={p.id} style={{ padding: "8px 0", borderBottom: "1px solid #ffe0b2", fontSize: 14 }}>
              <strong>{p.sku}</strong> — {p.name} | Qty: {p.quantity} | Status: {p.status}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Shared Styles ────────────────────────────────────────────────────────────
const inputStyle = {
  display: "block", width: "100%", padding: "10px 14px",
  marginBottom: 14, border: "1px solid #e0e0e0", borderRadius: 8,
  fontSize: 14, outline: "none", boxSizing: "border-box",
};
const headingStyle = { margin: "0 0 24px", color: "#1a1a2e", fontSize: 24, fontWeight: 700 };
const thStyle = { padding: "12px 16px", textAlign: "left", fontSize: 13, color: "#555", fontWeight: 600 };
const tdStyle = { padding: "12px 16px", fontSize: 14, color: "#333" };

export default App;
