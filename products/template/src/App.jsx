import { useEffect, useMemo, useState } from "react";
import {
  Search,
  ShoppingBag,
  UserRound,
  ArrowRight,
  Plus,
  Minus,
  Trash2,
  LogOut,
  ShieldCheck,
  Sparkles,
  X,
  LoaderCircle,
  RefreshCw,
  Package,
  Clock,
} from "lucide-react";

const API_BASE =
  import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000/api";

const demoProducts = [
  {
    id: "demo-1",
    name: "Everyday Backpack",
    description: "A clean, durable carry for wherever the day takes you.",
    price: "49.00",
    stock: 12,
    is_active: true,
    category: "Accessories",
  },
  {
    id: "demo-2",
    name: "Studio Headphones",
    description: "Comfort-first listening with a minimal studio look.",
    price: "89.00",
    stock: 8,
    is_active: true,
    category: "Technology",
  },
  {
    id: "demo-3",
    name: "Ceramic Pour-over Set",
    description: "A slower, better start to your morning ritual.",
    price: "36.00",
    stock: 15,
    is_active: true,
    category: "Home",
  },
  {
    id: "demo-4",
    name: "Classic Daily Watch",
    description: "Understated design, made for every day.",
    price: "119.00",
    stock: 5,
    is_active: true,
    category: "Accessories",
  },
  {
    id: "demo-5",
    name: "Soft Knit Throw",
    description: "A little extra comfort for your favourite corner.",
    price: "58.00",
    stock: 10,
    is_active: true,
    category: "Home",
  },
  {
    id: "demo-6",
    name: "Insulated Bottle",
    description: "Keep your favourite drink close, hot or cold.",
    price: "24.00",
    stock: 20,
    is_active: true,
    category: "Lifestyle",
  },
];

const money = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value || 0));

function getErrorMessage(data, status) {
  if (typeof data === "string" && data) return data;

  if (data?.detail) return data.detail;
  if (data?.message) return data.message;

  if (data && typeof data === "object") {
    return Object.entries(data)
      .map(([key, value]) => {
        const message = Array.isArray(value)
          ? value.join(", ")
          : String(value);

        return `${key}: ${message}`;
      })
      .join(" ");
  }

  return `Request failed (${status})`;
}


async function api(path, { token, ...options } = {}) {
  let currentToken =
    localStorage.getItem("northstar_access") || token || "";

  async function sendRequest(accessToken) {
    return fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...(options.body
          ? { "Content-Type": "application/json" }
          : {}),
        ...(accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : {}),
        ...options.headers,
      },
    });
  }

  let response = await sendRequest(currentToken);

  if (response.status === 401 && path !== "/token/refresh/") {
    const refreshToken = localStorage.getItem("northstar_refresh");

    if (refreshToken) {
      try {
        const refreshResponse = await fetch(
          `${API_BASE}/token/refresh/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              refresh: refreshToken,
            }),
          }
        );

        if (refreshResponse.ok) {
          const refreshed = await refreshResponse.json();

          if (refreshed.access) {
            localStorage.setItem(
              "northstar_access",
              refreshed.access
            );

            currentToken = refreshed.access;

            if (refreshed.refresh) {
              localStorage.setItem(
                "northstar_refresh",
                refreshed.refresh
              );
            }

            window.dispatchEvent(
              new CustomEvent("northstar-token-refreshed", {
                detail: refreshed.access,
              })
            );

            response = await sendRequest(currentToken);
          }
        } else {
          localStorage.removeItem("northstar_access");
          localStorage.removeItem("northstar_refresh");
          localStorage.removeItem("northstar_username");

          window.dispatchEvent(
            new Event("northstar-session-expired")
          );
        }
      } catch (error) {
        console.error("Token refresh failed:", error);
      }
    }
  }

  const raw = await response.text();
  let data = null;

  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = raw;
  }

  if (!response.ok) {
    throw new Error(getErrorMessage(data, response.status));
  }

  return data;
}

function ProductArt({ product, index }) {
  const tones = [
    "peach",
    "blue",
    "mint",
    "lavender",
    "sand",
    "rose",
  ];

  const icons = ["🎒", "🎧", "☕", "⌚", "🧶", "🧴"];

  return (
    <div className={`product-art ${tones[index % tones.length]}`}>
      <span className="art-glow" />

      <span className="art-emoji" aria-hidden="true">
        {product.icon || icons[index % icons.length]}
      </span>

      <span className="art-label">
        {product.category || "NORTHSTAR GOODS"}
      </span>
    </div>
  );
}

function AuthModal({ mode, setMode, onClose, onSuccess }) {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const isRegister = mode === "register";

  function change(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      if (isRegister) {
        await api("/register/", {
          method: "POST",
          body: JSON.stringify({
            username: form.username,
            email: form.email,
            password: form.password,
          }),
        });
      }

      const result = await api("/token/", {
        method: "POST",
        body: JSON.stringify({
          username: form.username,
          password: form.password,
        }),
      });

      onSuccess(result.access, result.refresh, form.username);
    } catch (e) {
      setError(
        e.message ||
          "Could not sign in. Check your details and try again."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="auth-modal">
        <button
          className="icon-button modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={19} />
        </button>

        <div className="modal-mark">
          <ShieldCheck size={22} />
        </div>

        <p className="eyebrow">
          {isRegister ? "JOIN NORTHSTAR" : "WELCOME BACK"}
        </p>

        <h2>
          {isRegister ? "Create your account." : "Good to see you."}
        </h2>

        <p className="muted">
          {isRegister
            ? "Create an account to keep your cart and orders in one place."
            : "Sign in to manage your cart and account."}
        </p>

        <form onSubmit={submit} className="auth-form">
          <label>
            Username
            <input
              required
              autoComplete="username"
              value={form.username}
              onChange={(event) =>
                change("username", event.target.value)
              }
              placeholder={
                isRegister ? "Choose a username" : "Your username"
              }
            />
          </label>

          {isRegister && (
            <label>
              Email address
              <input
                required
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(event) =>
                  change("email", event.target.value)
                }
                placeholder="you@example.com"
              />
            </label>
          )}

          <label>
            Password
            <input
              required
              type="password"
              minLength={isRegister ? 8 : 1}
              autoComplete={
                isRegister ? "new-password" : "current-password"
              }
              value={form.password}
              onChange={(event) =>
                change("password", event.target.value)
              }
              placeholder={
                isRegister ? "At least 8 characters" : "Your password"
              }
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <button
            className="primary-button full-button"
            disabled={busy}
          >
            {busy ? (
              <>
                <LoaderCircle className="spin" size={17} />
                Please wait…
              </>
            ) : isRegister ? (
              "Create account"
            ) : (
              "Sign in"
            )}

            {!busy && <ArrowRight size={17} />}
          </button>
        </form>

        <p className="switch-auth">
          {isRegister
            ? "Already have an account?"
            : "New around here?"}{" "}
          <button
            onClick={() => {
              setError("");
              setMode(isRegister ? "login" : "register");
            }}
          >
            {isRegister ? "Sign in" : "Create an account"}
          </button>
        </p>

        <p className="auth-note">
          Registration connects to Django, and login uses SimpleJWT.
        </p>
      </section>
    </div>
  );
}

function OrderStatus({ status }) {
  const normalized = String(status || "pending").toLowerCase();

  return (
    <span className={`order-status status-${normalized}`}>
      {normalized.replaceAll("_", " ")}
    </span>
  );
}

export default function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState(null);
  const [orders, setOrders] = useState([]);
  const [adminOrders, setAdminOrders] = useState([]);
  const [loadingAdminOrders, setLoadingAdminOrders] = useState(false);
  const [adminOrderError, setAdminOrderError] = useState("");

  const [activePage, setActivePage] = useState("shop");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const [token, setToken] = useState(
    () => localStorage.getItem("northstar_access") || ""
  );

  const [username, setUsername] = useState(
    () => localStorage.getItem("northstar_username") || ""
  );

  const [authMode, setAuthMode] = useState("");
  const [notice, setNotice] = useState("");

  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);
  const [productError, setProductError] = useState("");
  const [orderError, setOrderError] = useState("");

  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);

  /*
   * Keep React synchronized with token refreshes and expired sessions.
   */
  useEffect(() => {
    function handleTokenRefresh(event) {
      setToken(event.detail);
    }

    function handleSessionExpired() {
      setToken("");
      setUsername("");
      setCart(null);
      setOrders([]);
      setAuthMode("login");
      setNotice("Your session expired. Please sign in again.");
    }

    window.addEventListener(
      "northstar-token-refreshed",
      handleTokenRefresh
    );

    window.addEventListener(
      "northstar-session-expired",
      handleSessionExpired
    );

    return () => {
      window.removeEventListener(
        "northstar-token-refreshed",
        handleTokenRefresh
      );

      window.removeEventListener(
        "northstar-session-expired",
        handleSessionExpired
      );
    };
  }, []);

  async function loadProducts() {
    setLoadingProducts(true);
    setProductError("");

    try {
      const result = await api("/products/");
      const list = Array.isArray(result)
        ? result
        : result?.results || [];

      setProducts(
        list.filter((product) => product.is_active !== false)
      );

      setApiConnected(true);
    } catch {
      setProducts(demoProducts);
      setApiConnected(false);

      setProductError(
        "Showing preview products — start your Django server to load your database products."
      );
    } finally {
      setLoadingProducts(false);
    }
  }

  async function loadCart(currentToken = token) {
    if (!currentToken) {
      setCart(null);
      return;
    }

    try {
      const result = await api("/cart/", {
        token: currentToken,
      });

      setCart(result);
    } catch (error) {
      if (
        String(error.message).includes("401") ||
        String(error.message).toLowerCase().includes("token")
      ) {
        setNotice(
          "Your session may have expired. Sign in again to view your cart."
        );
      }

      setCart(null);
    }
  }

  /*
   * ORDER HISTORY
   *
   * This expects Django to provide GET /api/orders/.
   * It supports either a normal list or a paginated DRF response.
   */
  async function loadOrders(currentToken = token) {
    if (!currentToken) {
      setOrders([]);
      setAuthMode("login");
      setNotice("Please sign in to view your order history.");
      return;
    }

    setLoadingOrders(true);
    setOrderError("");

    try {
      const result = await api("/orders/", {
        token: currentToken,
      });

      const list = Array.isArray(result)
        ? result
        : result?.results || result?.orders || [];

      setOrders(list);
    } catch (error) {
      setOrderError(
        error.message ||
          "Could not load your orders. Please try again."
      );
    } finally {
      setLoadingOrders(false);
    }
  }

  function openOrderHistory() {
    if (!token) {
      setAuthMode("login");
      setNotice("Sign in to see your previous orders.");
      return;
    }

    setActivePage("orders");
    loadOrders(token);
  }

  async function loadAdminOrders(currentToken = token) {
    if (!currentToken) {
      setAuthMode("login");
      setNotice("Sign in with a staff account to manage orders.");
      return;
    }

    setLoadingAdminOrders(true);
    setAdminOrderError("");

    try {
      const result = await api("/admin/orders/", {
        token: currentToken,
      });

      const list = Array.isArray(result)
        ? result
        : result?.results || result?.orders || [];

      setAdminOrders(list);
    } catch (error) {
      setAdminOrderError(
        error.message || "Could not load all orders."
      );
    } finally {
      setLoadingAdminOrders(false);
    }
  }

  function openAdminOrders() {
    if (!token) {
      setAuthMode("login");
      setNotice("Sign in with a staff account to manage orders.");
      return;
    }

    setActivePage("admin-orders");
    loadAdminOrders(token);
  }

  async function updateAdminOrderStatus(orderId, status) {
    setAdminOrderError("");

    try {
      await api(`/admin/orders/${orderId}/status/`, {
        token,
        method: "PATCH",
        body: JSON.stringify({ status }),
      });

      setNotice(`Order #${orderId} updated to ${status}.`);
      await loadAdminOrders(token);
    } catch (error) {
      setAdminOrderError(
        error.message || "Could not update this order."
      );
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (token) {
      loadCart(token);
    } else {
      setCart(null);
      setOrders([]);
    }
  }, [token]);

  const categories = useMemo(
    () => [
      "All",
      ...new Set(
        products
          .map((product) => product.category)
          .filter(Boolean)
      ),
    ],
    [products]
  );

  const visibleProducts = useMemo(
    () =>
      products.filter((product) => {
        const matchesQuery =
          `${product.name} ${product.description || ""}`
            .toLowerCase()
            .includes(query.toLowerCase());

        const matchesCategory =
          category === "All" || product.category === category;

        return matchesQuery && matchesCategory;
      }),
    [products, query, category]
  );

  const cartItems = cart?.items || [];

  const cartCount = cartItems.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  const cartTotal = cartItems.reduce(
    (sum, item) =>
      sum +
      Number(item.product_price || item.product?.price || 0) *
        Number(item.quantity || 0),
    0
  );

  function signedIn(access, refreshToken, name) {
    localStorage.setItem("northstar_access", access);

    if (refreshToken) {
      localStorage.setItem("northstar_refresh", refreshToken);
    }

    localStorage.setItem("northstar_username", name || "");

    setToken(access);
    setUsername(name || "");
    setAuthMode("");
    setNotice("You're signed in. Welcome to Northstar.");
  }

  function signOut() {
    localStorage.removeItem("northstar_access");
    localStorage.removeItem("northstar_refresh");
    localStorage.removeItem("northstar_username");

    setToken("");
    setUsername("");
    setCart(null);
    setOrders([]);
    setActivePage("shop");
    setNotice("You've been signed out.");
  }

  async function addToCart(product) {
    if (!token) {
      setAuthMode("login");
      setNotice("Sign in to add items to your cart.");
      return;
    }

    if (!apiConnected || String(product.id).startsWith("demo-")) {
      setNotice(
        "Load real products from Django before adding items to your cart."
      );
      return;
    }

    try {
      await api("/cart/add/", {
        token,
        method: "POST",
        body: JSON.stringify({
          product: product.id,
          quantity: 1,
        }),
      });

      await loadCart(token);
      setNotice(`${product.name} added to your cart.`);
    } catch (error) {
      setNotice(error.message || "Could not add this item.");
    }
  }

  async function updateQuantity(item, quantity) {
    if (quantity < 1) {
      await removeItem(item.id);
      return;
    }

    try {
      await api(`/cart/items/${item.id}/`, {
        token,
        method: "PATCH",
        body: JSON.stringify({ quantity }),
      });

      await loadCart(token);
    } catch (error) {
      setNotice(error.message || "Could not update quantity.");
    }
  }

  async function removeItem(id) {
    try {
      await api(`/cart/items/${id}/`, {
        token,
        method: "DELETE",
      });

      await loadCart(token);
      setNotice("Item removed from your cart.");
    } catch (error) {
      setNotice(error.message || "Could not remove item.");
    }
  }

  async function placeOrder(event) {
    event.preventDefault();

    if (!token) {
      setAuthMode("login");
      return;
    }

    if (!deliveryAddress.trim()) {
      setNotice("Please enter your delivery address.");
      return;
    }

    if (!cartItems.length) {
      setNotice("Your cart is empty.");
      return;
    }

    setPlacingOrder(true);

    try {
      const order = await api("/checkout/", {
        token,
        method: "POST",
        body: JSON.stringify({
          delivery_address: deliveryAddress.trim(),
        }),
      });

      setLastOrder(order);
      setDeliveryAddress("");

      await loadCart(token);

      setActivePage("order-success");
      setNotice("Your order has been placed successfully.");
    } catch (error) {
      setNotice(error.message || "We could not place your order.");
    } finally {
      setPlacingOrder(false);
    }
  }

  function orderDate(value) {
    if (!value) return "Date unavailable";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  function orderItems(order) {
    return order.items || order.order_items || [];
  }

  function orderItemName(item) {
    return (
      item.product_name ||
      item.product?.name ||
      item.name ||
      `Product #${item.product ?? item.id ?? ""}`
    );
  }

  function orderItemPrice(item) {
    return (
      item.price ??
      item.product_price ??
      item.product?.price ??
      item.unit_price ??
      0
    );
  }

  return (
    <div className="app-shell">
      <div className="announcement">
        <Sparkles size={14} />
        Thoughtful essentials for everyday living
        <span>·</span>
        Free shipping on orders over $75
      </div>

      <header className="site-header">
        <button
          className="brand"
          onClick={() => setActivePage("shop")}
          aria-label="Northstar home"
        >
          <span className="brand-symbol">
            N<span>✳</span>
          </span>

          <span className="brand-name">
            northstar<span>.</span>
          </span>
        </button>

        <nav className="main-nav">
          <button
            className={
              activePage === "shop" ? "nav-link active" : "nav-link"
            }
            onClick={() => setActivePage("shop")}
          >
            Shop
          </button>

          <button
            className={
              activePage === "story" ? "nav-link active" : "nav-link"
            }
            onClick={() => setActivePage("story")}
          >
            Our approach
          </button>

          {token && (
            <button
              className={
                activePage === "orders" ? "nav-link active" : "nav-link"
              }
              onClick={openOrderHistory}
            >
              My orders
            </button>
          )}

          {token && (
            <button
              className={
                activePage === "admin-orders"
                  ? "nav-link active"
                  : "nav-link"
              }
              onClick={openAdminOrders}
            >
              Manage orders
            </button>
          )}
        </nav>

        <div className="header-actions">
          <button
            className="icon-button account-button"
            onClick={() =>
              token
                ? setNotice(`Signed in as ${username || "customer"}.`)
                : setAuthMode("login")
            }
            aria-label="Account"
          >
            <UserRound size={19} />
          </button>

          {token ? (
            <button className="signout-button" onClick={signOut}>
              <LogOut size={15} />
              Sign out
            </button>
          ) : (
            <button
              className="signin-button"
              onClick={() => setAuthMode("login")}
            >
              Sign in
            </button>
          )}

          <button
            className="cart-button"
            onClick={() => setActivePage("cart")}
          >
            <ShoppingBag size={18} />
            <span>Bag</span>
            <b>{cartCount}</b>
          </button>
        </div>
      </header>

      {notice && (
        <div className="notice" role="status">
          <span>{notice}</span>

          <button
            onClick={() => setNotice("")}
            aria-label="Dismiss"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* SHOP PAGE */}
      {activePage === "shop" && (
        <main>
          <section className="hero">
            <div className="hero-copy">
              <p className="eyebrow">
                <span className="eyebrow-line" />
                THE EVERYDAY EDIT
              </p>

              <h1>
                Good things.
                <br />
                <em>Chosen well.</em>
              </h1>

              <p className="hero-description">
                Useful objects, considered design, and little upgrades
                that make the everyday feel a bit more special.
              </p>

              <button
                className="primary-button"
                onClick={() =>
                  document
                    .getElementById("shop-products")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Explore the collection <ArrowRight size={16} />
              </button>

              <div className="hero-footnote">
                <span className="mini-stars">✳ ✳ ✳</span>
                A little less, a little better.
              </div>
            </div>

            <div className="hero-visual">
              <div className="hero-sun" />

              <div className="hero-card card-back">
                <span>DESIGNED FOR DAILY LIFE</span>
                <div className="hero-shape shape-one">✳</div>
              </div>

              <div className="hero-card card-front">
                <div className="hero-bag">
                  <div className="bag-handle" />
                  <div className="bag-pocket" />
                  <div className="bag-tag">N.</div>
                </div>

                <span className="hero-card-caption">
                  THE DAILY CARRY <b>01 / 06</b>
                </span>
              </div>

              <div className="floating-note note-top">
                MADE TO LAST <span>↗</span>
              </div>

              <div className="floating-note note-bottom">
                <span className="note-dot" />
                Thoughtful by design
              </div>

              <div className="hero-orbit orbit-one" />
              <div className="hero-orbit orbit-two" />
            </div>
          </section>

          <section className="promise-strip">
            <div>
              <span className="promise-icon">✳</span>
              <span>
                <b>Considered design</b>
                <small>Nothing here by accident</small>
              </span>
            </div>

            <div>
              <span className="promise-icon">↺</span>
              <span>
                <b>Made for everyday</b>
                <small>Good things, used often</small>
              </span>
            </div>

            <div>
              <span className="promise-icon">♡</span>
              <span>
                <b>Less, but better</b>
                <small>Keep what matters</small>
              </span>
            </div>
          </section>

          <section className="shop-section" id="shop-products">
            <div className="section-heading">
              <div>
                <p className="eyebrow">THE COLLECTION</p>

                <h2>
                  Everyday <em>favourites.</em>
                </h2>

                <p className="muted">
                  A few good things to make life feel a little more
                  considered.
                </p>
              </div>

              <span className="item-count">
                {visibleProducts.length.toString().padStart(2, "0")} ITEMS
              </span>
            </div>

            {productError && (
              <div className="preview-banner">
                <span className="preview-dot" />
                {productError}
              </div>
            )}

            <div className="product-tools">
              <div className="search-field">
                <Search size={17} />

                <input
                  aria-label="Search products"
                  placeholder="Find something good…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />

                <kbd>⌘ K</kbd>
              </div>

              <div className="category-tabs">
                {categories.map((item) => (
                  <button
                    key={item}
                    onClick={() => setCategory(item)}
                    className={
                      category === item
                        ? "category-tab selected"
                        : "category-tab"
                    }
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {loadingProducts ? (
              <div className="loading-state">
                <LoaderCircle className="spin" />
                Finding good things…
              </div>
            ) : visibleProducts.length ? (
              <div className="product-grid">
                {visibleProducts.map((product, index) => (
                  <article className="product-card" key={product.id}>
                    <div className="product-image-wrap">
                      <ProductArt product={product} index={index} />

                      <span className="product-badge">
                        {index === 0
                          ? "EVERYDAY PICK"
                          : product.category || "WELL CONSIDERED"}
                      </span>

                      <button
                        className="quick-add"
                        onClick={() => addToCart(product)}
                        aria-label={`Add ${product.name} to cart`}
                        disabled={Number(product.stock) < 1}
                      >
                        <Plus size={20} />
                      </button>
                    </div>

                    <div className="product-info">
                      <div>
                        <h3>{product.name}</h3>

                        <p>
                          {product.description ||
                            "A considered essential for everyday life."}
                        </p>
                      </div>

                      <strong>{money(product.price)}</strong>
                    </div>

                    <div className="product-meta">
                      <span>
                        <span className="stock-dot" />
                        {Number(product.stock) > 0
                          ? "In stock"
                          : "Out of stock"}
                      </span>

                      <button
                        onClick={() => addToCart(product)}
                        disabled={Number(product.stock) < 1}
                      >
                        Add to bag <ArrowRight size={14} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <Search size={25} />
                <h3>No matches just yet</h3>
                <p>Try another search or category.</p>

                <button
                  className="text-button"
                  onClick={() => {
                    setQuery("");
                    setCategory("All");
                  }}
                >
                  Clear filters
                </button>
              </div>
            )}
          </section>

          <section className="quote-section">
            <span className="quote-mark">“</span>

            <p>
              Buy less, choose well,
              <br />
              <em>make it last.</em>
            </p>

            <span className="quote-credit">
              A SIMPLE IDEA. A BETTER EVERYDAY.
            </span>

            <div className="quote-spark">✳</div>
          </section>
        </main>
      )}

      {/* CART PAGE */}
      {activePage === "cart" && (
        <main className="page-main">
          <div className="page-title">
            <p className="eyebrow">YOUR SELECTION</p>

            <h1>
              Your <em>bag.</em>
            </h1>

            <p className="muted">
              Good choices, all in one place.
            </p>
          </div>

          {!token ? (
            <div className="empty-state cart-empty">
              <ShoppingBag size={30} />
              <h3>Your bag is waiting.</h3>
              <p>Sign in to see your saved cart.</p>

              <button
                className="primary-button"
                onClick={() => setAuthMode("login")}
              >
                Sign in <ArrowRight size={16} />
              </button>
            </div>
          ) : !cartItems.length ? (
            <div className="empty-state cart-empty">
              <ShoppingBag size={30} />
              <h3>A little room for something good.</h3>
              <p>Your bag is empty for now.</p>

              <button
                className="primary-button"
                onClick={() => setActivePage("shop")}
              >
                Explore the collection <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <div className="cart-layout">
              <div className="cart-list">
                {cartItems.map((item) => (
                  <article className="cart-item" key={item.id}>
                    <div className="cart-thumb">
                      <span>✳</span>
                    </div>

                    <div className="cart-item-details">
                      <h3>
                        {item.product_name ||
                          item.product?.name ||
                          `Product #${item.product}`}
                      </h3>

                      <p>
                        {money(
                          item.product_price || item.product?.price
                        )}
                      </p>

                      <div className="quantity-control">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item,
                              Number(item.quantity) - 1
                            )
                          }
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>

                        <span>{item.quantity}</span>

                        <button
                          onClick={() =>
                            updateQuantity(
                              item,
                              Number(item.quantity) + 1
                            )
                          }
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="cart-item-end">
                      <strong>
                        {money(
                          Number(
                            item.product_price ||
                              item.product?.price ||
                              0
                          ) * Number(item.quantity)
                        )}
                      </strong>

                      <button
                        className="remove-button"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 size={15} />
                        Remove
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              <aside className="order-summary">
                <p className="eyebrow">THE TOTAL</p>
                <h3>Order summary</h3>

                <div className="summary-line">
                  <span>Subtotal</span>
                  <b>{money(cartTotal)}</b>
                </div>

                <div className="summary-line">
                  <span>Shipping</span>
                  <b>
                    {cartTotal >= 75
                      ? "Free"
                      : "Calculated at checkout"}
                  </b>
                </div>

                <div className="summary-total">
                  <span>Estimated total</span>
                  <strong>{money(cartTotal)}</strong>
                </div>

                <button
                  className="primary-button full-button"
                  onClick={() => setActivePage("checkout")}
                >
                  Continue to checkout <ArrowRight size={16} />
                </button>

                <p className="secure-note">
                  <ShieldCheck size={15} />
                  Secure checkout experience
                </p>
              </aside>
            </div>
          )}
        </main>
      )}

      {/* CHECKOUT PAGE */}
      {activePage === "checkout" && (
        <main className="page-main">
          <div className="page-title">
            <p className="eyebrow">ALMOST YOURS</p>

            <h1>
              Delivery <em>details.</em>
            </h1>

            <p className="muted">
              Enter the address where you would like your order delivered.
            </p>
          </div>

          {!token ? (
            <div className="empty-state cart-empty">
              <UserRound size={30} />
              <h3>Please sign in first.</h3>
              <p>You need an account to place an order.</p>

              <button
                className="primary-button"
                onClick={() => setAuthMode("login")}
              >
                Sign in <ArrowRight size={16} />
              </button>
            </div>
          ) : !cartItems.length ? (
            <div className="empty-state cart-empty">
              <ShoppingBag size={30} />
              <h3>Your bag is empty.</h3>
              <p>Add a product before checking out.</p>

              <button
                className="primary-button"
                onClick={() => setActivePage("shop")}
              >
                Explore the collection <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <div className="cart-layout">
              <form className="order-summary" onSubmit={placeOrder}>
                <label htmlFor="delivery-address">
                  Delivery address
                </label>

                <textarea
                  id="delivery-address"
                  required
                  rows={4}
                  value={deliveryAddress}
                  onChange={(event) =>
                    setDeliveryAddress(event.target.value)
                  }
                  placeholder="House number, street, city, postal code"
                  style={{
                    width: "100%",
                    padding: "12px",
                    marginTop: "10px",
                    marginBottom: "20px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    font: "inherit",
                    resize: "vertical",
                    boxSizing: "border-box",
                  }}
                />

                <div className="summary-line">
                  <span>Items</span>
                  <b>{cartCount}</b>
                </div>

                <div className="summary-total">
                  <span>Order total</span>
                  <strong>{money(cartTotal)}</strong>
                </div>

                <button
                  type="submit"
                  className="primary-button full-button"
                  disabled={placingOrder || cartItems.length === 0}
                >
                  {placingOrder ? "Placing order..." : "Place order"}
                  {!placingOrder && <ArrowRight size={16} />}
                </button>

                <button
                  type="button"
                  className="text-button"
                  onClick={() => setActivePage("cart")}
                >
                  Back to bag
                </button>
              </form>
            </div>
          )}
        </main>
      )}

      {/* ORDER SUCCESS PAGE */}
      {activePage === "order-success" && lastOrder && (
        <main className="page-main">
          <div className="empty-state cart-empty">
            <ShieldCheck size={38} />

            <p className="eyebrow">ORDER CONFIRMED</p>

            <h1>
              Thank you for <em>your order.</em>
            </h1>

            <p>Your order number is #{lastOrder.id}.</p>
            <p>Total: {money(lastOrder.total_amount)}</p>
            <p>Delivery address: {lastOrder.delivery_address}</p>
            <p>Status: {lastOrder.status || "Pending"}</p>

            <button
              className="primary-button"
              onClick={() => setActivePage("shop")}
            >
              Continue shopping <ArrowRight size={16} />
            </button>

            {token && (
              <button
                className="text-button"
                onClick={openOrderHistory}
              >
                View all orders
              </button>
            )}
          </div>
        </main>
      )}

      {/* ORDER HISTORY PAGE */}
      {activePage === "orders" && (
        <main className="page-main">
          <div className="page-title">
            <p className="eyebrow">YOUR NORTHSTAR ACCOUNT</p>

            <h1>
              Order <em>history.</em>
            </h1>

            <p className="muted">
              Your purchases, all in one place.
            </p>
          </div>

          <div className="orders-toolbar">
            <span className="item-count">
              {orders.length.toString().padStart(2, "0")} ORDERS
            </span>

            <button
              className="text-button"
              onClick={() => loadOrders(token)}
              disabled={loadingOrders}
            >
              <RefreshCw
                size={15}
                className={loadingOrders ? "spin" : ""}
              />
              Refresh orders
            </button>
          </div>

          {loadingOrders ? (
            <div className="loading-state">
              <LoaderCircle className="spin" />
              Loading your orders…
            </div>
          ) : orderError ? (
            <div className="empty-state">
              <Package size={30} />
              <h3>We couldn't load your orders.</h3>
              <p>{orderError}</p>

              <button
                className="primary-button"
                onClick={() => loadOrders(token)}
              >
                Try again <RefreshCw size={16} />
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className="empty-state cart-empty">
              <Package size={34} />
              <h3>No orders yet.</h3>
              <p>
                Your order history will appear here after your first
                purchase.
              </p>

              <button
                className="primary-button"
                onClick={() => setActivePage("shop")}
              >
                Explore the collection <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <div className="orders-list">
              {orders.map((order) => {
                const items = orderItems(order);
                const total =
                  order.total_amount ??
                  order.total ??
                  order.grand_total ??
                  0;

                return (
                  <article className="order-card" key={order.id}>
                    <div className="order-card-header">
                      <div>
                        <p className="eyebrow">
                          ORDER #{order.id}
                        </p>

                        <h3>
                          {money(total)}
                        </h3>
                      </div>

                      <OrderStatus status={order.status} />
                    </div>

                    <div className="order-date">
                      <Clock size={15} />
                      {orderDate(
                        order.created_at ||
                          order.ordered_at ||
                          order.date
                      )}
                    </div>

                    {order.delivery_address && (
                      <div className="order-address">
                        <span>DELIVER TO</span>
                        <p>{order.delivery_address}</p>
                      </div>
                    )}

                    <div className="order-products">
                      <p className="eyebrow">ITEMS IN THIS ORDER</p>

                      {items.length ? (
                        items.map((item, index) => (
                          <div
                            className="order-product-row"
                            key={item.id || `${order.id}-${index}`}
                          >
                            <div className="order-product-icon">
                              <Package size={18} />
                            </div>

                            <div className="order-product-details">
                              <strong>{orderItemName(item)}</strong>
                              <span>
                                Quantity: {item.quantity ?? 1}
                              </span>
                            </div>

                            <strong>
                              {money(
                                Number(orderItemPrice(item)) *
                                  Number(item.quantity ?? 1)
                              )}
                            </strong>
                          </div>
                        ))
                      ) : (
                        <p className="muted">
                          Item details are not available for this order.
                        </p>
                      )}
                    </div>

                    <div className="order-card-footer">
                      <span>
                        {items.length}{" "}
                        {items.length === 1 ? "line item" : "line items"}
                      </span>

                      <strong>Total: {money(total)}</strong>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>
      )}

      {/* ADMIN ORDER MANAGEMENT PAGE */}
      {activePage === "admin-orders" && (
        <main className="page-main">
          <div className="page-title">
            <p className="eyebrow">STAFF DASHBOARD</p>
            <h1>
              Manage <em>orders.</em>
            </h1>
            <p className="muted">
              View customer orders and update their delivery status.
            </p>
          </div>

          <div className="orders-toolbar">
            <span className="item-count">
              {adminOrders.length.toString().padStart(2, "0")} ORDERS
            </span>

            <button
              className="text-button"
              onClick={() => loadAdminOrders(token)}
              disabled={loadingAdminOrders}
            >
              <RefreshCw
                size={15}
                className={loadingAdminOrders ? "spin" : ""}
              />
              Refresh orders
            </button>
          </div>

          {loadingAdminOrders ? (
            <div className="loading-state">
              <LoaderCircle className="spin" />
              Loading all orders…
            </div>
          ) : adminOrderError ? (
            <div className="empty-state">
              <Package size={30} />
              <h3>Could not manage orders.</h3>
              <p>{adminOrderError}</p>
              <button
                className="primary-button"
                onClick={() => loadAdminOrders(token)}
              >
                Try again <RefreshCw size={16} />
              </button>
            </div>
          ) : adminOrders.length === 0 ? (
            <div className="empty-state">
              <Package size={30} />
              <h3>No orders found.</h3>
              <p>Customer orders will appear here.</p>
            </div>
          ) : (
            <div className="orders-list">
              {adminOrders.map((order) => {
                const items = orderItems(order);
                const total =
                  order.total_amount ??
                  order.total ??
                  order.grand_total ??
                  0;

                return (
                  <article className="order-card" key={order.id}>
                    <div className="order-card-header">
                      <div>
                        <p className="eyebrow">
                          ORDER #{order.id}
                        </p>
                        <h3>{money(total)}</h3>
                      </div>
                      <OrderStatus status={order.status} />
                    </div>

                    <div className="order-date">
                      <Clock size={15} />
                      {orderDate(
                        order.created_at ||
                          order.ordered_at ||
                          order.date
                      )}
                    </div>

                    {order.user && (
                      <div className="order-address">
                        <span>CUSTOMER</span>
                        <p>
                          {typeof order.user === "object"
                            ? order.user.username ||
                              order.user.email ||
                              `User #${order.user.id || ""}`
                            : `User #${order.user}`}
                        </p>
                      </div>
                    )}

                    {order.delivery_address && (
                      <div className="order-address">
                        <span>DELIVER TO</span>
                        <p>{order.delivery_address}</p>
                      </div>
                    )}

                    <div className="order-products">
                      <p className="eyebrow">ORDER ITEMS</p>
                      {items.length ? (
                        items.map((item, index) => (
                          <div
                            className="order-product-row"
                            key={item.id || `${order.id}-${index}`}
                          >
                            <div className="order-product-icon">
                              <Package size={18} />
                            </div>
                            <div className="order-product-details">
                              <strong>{orderItemName(item)}</strong>
                              <span>
                                Quantity: {item.quantity ?? 1}
                              </span>
                            </div>
                            <strong>
                              {money(
                                Number(orderItemPrice(item)) *
                                  Number(item.quantity ?? 1)
                              )}
                            </strong>
                          </div>
                        ))
                      ) : (
                        <p className="muted">
                          Item details are not available.
                        </p>
                      )}
                    </div>

                    <div className="order-card-footer">
                      <span>Update order status</span>
                      <select
                        value={String(order.status || "pending").toLowerCase()}
                        onChange={(event) =>
                          updateAdminOrderStatus(
                            order.id,
                            event.target.value
                          )
                        }
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>
      )}

      {/* OUR STORY PAGE */}
      {activePage === "story" && (
        <main className="page-main story-page">
          <div className="story-art">
            <span>✳</span>
          </div>

          <p className="eyebrow">OUR APPROACH</p>

          <h1>
            Keep good things
            <br />
            <em>close.</em>
          </h1>

          <p className="story-copy">
            Northstar is a little reminder to choose thoughtfully. We
            believe everyday objects should earn their place: useful,
            well-made, and a pleasure to reach for again and again.
          </p>

          <button
            className="primary-button"
            onClick={() => setActivePage("shop")}
          >
            Shop the collection <ArrowRight size={16} />
          </button>
        </main>
      )}

      {/* FOOTER */}
      <footer className="site-footer">
        <div className="footer-top">
          <button
            className="brand footer-brand"
            onClick={() => setActivePage("shop")}
          >
            <span className="brand-symbol">
              N<span>✳</span>
            </span>

            <span className="brand-name">
              northstar<span>.</span>
            </span>
          </button>

          <p>Thoughtful essentials for everyday living.</p>

          <button
            className="back-top"
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              })
            }
          >
            Back to top ↑
          </button>
        </div>

        <div className="footer-bottom">
          <span>© 2026 NORTHSTAR GOODS</span>

          <span>
            MADE FOR THE EVERYDAY <b>✳</b>
          </span>

          <span
            className={
              apiConnected ? "connection connected" : "connection"
            }
          >
            <i />
            {apiConnected ? "API connected" : "Preview mode"}
          </span>
        </div>
      </footer>

      {authMode && (
        <AuthModal
          mode={authMode}
          setMode={setAuthMode}
          onClose={() => setAuthMode("")}
          onSuccess={signedIn}
        />
      )}
    </div>
  );
}