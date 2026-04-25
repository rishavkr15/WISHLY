import { useEffect, useMemo, useState } from "react";
import api, { getErrorMessage } from "../api/client";

const blankProduct = {
  name: "",
  description: "",
  price: "",
  category: "Tops",
  image: "",
  stock: "",
  sizeOptions: "S,M,L,XL",
  tags: "men,premium",
  isFeatured: false
};

const AdminPage = () => {
  const [tab, setTab] = useState("products");
  const [stats, setStats] = useState({
    productsCount: 0,
    usersCount: 0,
    ordersCount: 0,
    totalRevenue: 0
  });
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [form, setForm] = useState(blankProduct);
  const [editingId, setEditingId] = useState("");

  const fetchAdminData = async () => {
    setLoading(true);
    setError("");
    try {
      const [statsRes, productsRes, ordersRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/products"),
        api.get("/orders/admin/all")
      ]);
      setStats(statsRes.data);
      setProducts(productsRes.data);
      setOrders(ordersRes.data);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load admin data"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const onSaveProduct = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
        sizeOptions: form.sizeOptions
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        tags: form.tags
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      };

      if (editingId) {
        await api.put(`/admin/products/${editingId}`, payload);
      } else {
        await api.post("/admin/products", payload);
      }

      setForm(blankProduct);
      setEditingId("");
      await fetchAdminData();
    } catch (err) {
      setError(getErrorMessage(err, "Could not save product"));
    } finally {
      setSaving(false);
    }
  };

  const onEditProduct = (product) => {
    setEditingId(product._id);
    setForm({
      name: product.name || "",
      description: product.description || "",
      price: product.price || "",
      category: product.category || "Tops",
      image: product.image || "",
      stock: product.stock || "",
      sizeOptions: (product.sizeOptions || []).join(","),
      tags: (product.tags || []).join(","),
      isFeatured: Boolean(product.isFeatured)
    });
    setTab("products");
  };

  const onDeleteProduct = async (productId) => {
    const confirmed = window.confirm("Delete this product?");
    if (!confirmed) return;
    try {
      await api.delete(`/admin/products/${productId}`);
      await fetchAdminData();
    } catch (err) {
      setError(getErrorMessage(err, "Could not delete product"));
    }
  };

  const uploadProductImage = async (file) => {
    if (!file) return;
    setUploadingImage(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("image", file);
      const { data } = await api.post("/uploads/upload-image", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setForm((prev) => ({ ...prev, image: data.url }));
    } catch (err) {
      setError(getErrorMessage(err, "Could not upload image"));
    } finally {
      setUploadingImage(false);
    }
  };

  const updateOrder = async (orderId, patch) => {
    try {
      await api.patch(`/orders/${orderId}/status`, patch);
      setOrders((prev) =>
        prev.map((order) => (order._id === orderId ? { ...order, ...patch } : order))
      );
    } catch (err) {
      setError(getErrorMessage(err, "Could not update order"));
    }
  };

  const statsCards = useMemo(
    () => [
      { label: "Products", value: stats.productsCount },
      { label: "Users", value: stats.usersCount },
      { label: "Orders", value: stats.ordersCount },
      { label: "Revenue", value: `INR ${Number(stats.totalRevenue || 0).toFixed(2)}` }
    ],
    [stats]
  );

  return (
    <section className="container section">
      <div className="section-head">
        <div>
          <p className="eyebrow">ADMIN PANEL</p>
          <h2>Store Management</h2>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="admin-stats">
        {statsCards.map((card) => (
          <article key={card.label} className="panel stat-card">
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </article>
        ))}
      </div>

      <div className="admin-tabs">
        <button
          type="button"
          className={`ghost-btn ${tab === "products" ? "active" : ""}`}
          onClick={() => setTab("products")}
        >
          Products
        </button>
        <button
          type="button"
          className={`ghost-btn ${tab === "orders" ? "active" : ""}`}
          onClick={() => setTab("orders")}
        >
          Orders
        </button>
      </div>

      {loading ? (
        <p>Loading admin dashboard...</p>
      ) : (
        <>
          {tab === "products" && (
            <div className="admin-layout">
              <form className="panel form-grid" onSubmit={onSaveProduct}>
                <h3>{editingId ? "Edit Product" : "Add Product"}</h3>
                <label className="field-label">
                  Name
                  <input
                    className="input"
                    required
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </label>
                <label className="field-label">
                  Description
                  <textarea
                    className="input textarea"
                    required
                    value={form.description}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, description: e.target.value }))
                    }
                  />
                </label>
                <label className="field-label">
                  Price
                  <input
                    className="input"
                    type="number"
                    min="0"
                    required
                    value={form.price}
                    onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                  />
                </label>
                <label className="field-label">
                  Stock
                  <input
                    className="input"
                    type="number"
                    min="0"
                    required
                    value={form.stock}
                    onChange={(e) => setForm((prev) => ({ ...prev, stock: e.target.value }))}
                  />
                </label>
                <label className="field-label">
                  Category
                  <input
                    className="input"
                    required
                    value={form.category}
                    onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                  />
                </label>
                <label className="field-label">
                  Upload Product Image
                  <input
                    className="input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => uploadProductImage(e.target.files?.[0])}
                  />
                </label>

                {uploadingImage && <p className="muted">Uploading image...</p>}

                <label className="field-label">
                  Image URL
                  <input
                    className="input"
                    required
                    value={form.image}
                    onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.value }))}
                  />
                </label>

                {form.image && (
                  <img src={form.image} alt="Product preview" className="admin-preview" />
                )}

                <label className="field-label">
                  Sizes (comma separated)
                  <input
                    className="input"
                    value={form.sizeOptions}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, sizeOptions: e.target.value }))
                    }
                  />
                </label>
                <label className="field-label">
                  Tags (comma separated)
                  <input
                    className="input"
                    value={form.tags}
                    onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))}
                  />
                </label>
                <label className="checkbox-line">
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(e) => setForm((prev) => ({ ...prev, isFeatured: e.target.checked }))}
                  />
                  Mark as featured
                </label>

                <div className="admin-btn-row">
                  <button type="submit" className="primary-btn" disabled={saving}>
                    {saving ? "Saving..." : editingId ? "Update Product" : "Create Product"}
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={() => {
                        setEditingId("");
                        setForm(blankProduct);
                      }}
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </form>

              <div className="panel admin-table-wrap">
                <h3>Product List</h3>
                <div className="admin-table">
                  {products.map((product) => (
                    <article key={product._id} className="admin-row">
                      <img src={product.image} alt={product.name} />
                      <div>
                        <strong>{product.name}</strong>
                        <p className="muted">
                          {product.category} | INR {product.price}
                        </p>
                      </div>
                      <div className="admin-actions">
                        <button
                          type="button"
                          className="tiny-btn"
                          onClick={() => onEditProduct(product)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="ghost-btn danger"
                          onClick={() => onDeleteProduct(product._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "orders" && (
            <div className="panel admin-table-wrap">
              <h3>Order Management</h3>
              <div className="admin-table">
                {orders.map((order) => (
                  <article key={order._id} className="admin-row order-admin-row">
                    <div>
                      <strong>#{order._id.slice(-6).toUpperCase()}</strong>
                      <p className="muted">
                        {(order.user?.name || "User")} | {order.items.length} items | INR{" "}
                        {order.totalPrice.toFixed(2)}
                      </p>
                    </div>
                    <div className="admin-actions">
                      <select
                        className="input"
                        value={order.status}
                        onChange={(e) => updateOrder(order._id, { status: e.target.value })}
                      >
                        <option>Processing</option>
                        <option>Packed</option>
                        <option>Shipped</option>
                        <option>Delivered</option>
                      </select>
                      <select
                        className="input"
                        value={order.paymentStatus || "Pending"}
                        onChange={(e) =>
                          updateOrder(order._id, { paymentStatus: e.target.value })
                        }
                      >
                        <option>Pending</option>
                        <option>Paid</option>
                        <option>Failed</option>
                      </select>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default AdminPage;
