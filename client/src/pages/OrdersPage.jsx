import { useEffect, useState } from "react";
import api, { getErrorMessage } from "../api/client";

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await api.get("/orders/my");
        setOrders(data);
      } catch (err) {
        setError(getErrorMessage(err, "Could not load orders"));
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  return (
    <section className="container section">
      <div className="section-head">
        <h2>My Orders</h2>
      </div>

      {loading && <p>Loading orders...</p>}
      {error && <p className="error-text">{error}</p>}

      <div className="orders-list">
        {orders.map((order) => (
          <article key={order._id} className="panel order-card">
            <div className="order-head">
              <h3>Order #{order._id.slice(-6).toUpperCase()}</h3>
              <span className="status-pill">{order.status}</span>
            </div>
            <p className="muted">
              {new Date(order.createdAt).toLocaleString("en-IN")} | {order.items.length} items
            </p>
            <p>Total: INR {order.totalPrice.toFixed(2)}</p>
            <p className="muted">
              Payment: {order.paymentMethod} | Status: {order.paymentStatus || "Pending"}
            </p>
          </article>
        ))}
      </div>

      {!loading && !error && orders.length === 0 && <p className="muted">No orders yet.</p>}
    </section>
  );
};

export default OrdersPage;
