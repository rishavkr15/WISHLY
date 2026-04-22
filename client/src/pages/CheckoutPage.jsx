import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { getErrorMessage } from "../api/client";
import { useCart } from "../context/CartContext";

const emptyAddress = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India"
};

const isOnline = (method) => method === "RAZORPAY" || method === "STRIPE";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items, totals, clearCart } = useCart();
  const [address, setAddress] = useState(emptyAddress);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [paymentSession, setPaymentSession] = useState(null);
  const [paymentResult, setPaymentResult] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setPaymentSession(null);
    setPaymentResult(null);
  }, [paymentMethod]);

  if (items.length === 0) {
    return (
      <section className="container section">
        <p className="muted">Cart is empty. Add items before checkout.</p>
      </section>
    );
  }

  const createPaymentSession = async () => {
    setPaymentLoading(true);
    setError("");
    try {
      const { data } = await api.post("/payments/session", {
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          size: item.size
        })),
        method: paymentMethod
      });
      setPaymentSession(data);
    } catch (err) {
      setError(getErrorMessage(err, "Could not start payment"));
    } finally {
      setPaymentLoading(false);
    }
  };

  const confirmPayment = async () => {
    if (!paymentSession) return;
    setPaymentLoading(true);
    setError("");
    try {
      const { data } = await api.post("/payments/confirm", {
        provider: paymentMethod,
        mode: paymentSession.mode,
        sessionId: paymentSession.sessionId
      });
      setPaymentResult(data);
      setSuccess("Payment completed successfully.");
    } catch (err) {
      setError(getErrorMessage(err, "Payment confirmation failed"));
    } finally {
      setPaymentLoading(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (isOnline(paymentMethod) && paymentResult?.status !== "paid") {
      setLoading(false);
      setError("Complete online payment before placing order.");
      return;
    }

    try {
      const payload = {
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          size: item.size
        })),
        shippingAddress: address,
        paymentMethod,
        payment: paymentResult
      };

      const { data } = await api.post("/orders", payload);
      clearCart();
      setSuccess(`Order placed successfully. Order ID: ${data._id}`);
      setTimeout(() => navigate("/orders"), 1200);
    } catch (err) {
      setError(getErrorMessage(err, "Could not place order"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container section">
      <div className="section-head">
        <h2>Checkout</h2>
      </div>

      <div className="checkout-layout">
        <form className="panel form-grid" onSubmit={onSubmit}>
          <h3>Shipping Details</h3>

          {Object.entries(address).map(([key, value]) => (
            <label key={key} className="field-label">
              {key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}
              <input
                className="input"
                required={key !== "line2"}
                value={value}
                onChange={(e) => setAddress((prev) => ({ ...prev, [key]: e.target.value }))}
              />
            </label>
          ))}

          <label className="field-label">
            Payment Method
            <select
              className="input"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="COD">Cash On Delivery</option>
              <option value="RAZORPAY">Razorpay (Online)</option>
              <option value="STRIPE">Stripe (Online)</option>
            </select>
          </label>

          {isOnline(paymentMethod) && (
            <div className="panel payment-panel">
              <h4>Online Payment</h4>
              <p className="muted">
                This project runs in demo payment mode by default. Add gateway keys in server env for
                live mode.
              </p>
              <div className="admin-btn-row">
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={createPaymentSession}
                  disabled={paymentLoading}
                >
                  {paymentLoading ? "Starting..." : "Start Payment"}
                </button>
                <button
                  type="button"
                  className="primary-btn"
                  onClick={confirmPayment}
                  disabled={!paymentSession || paymentLoading}
                >
                  {paymentLoading ? "Confirming..." : "Complete Payment"}
                </button>
              </div>

              {paymentSession && (
                <p className="muted">
                  Session: <code>{paymentSession.sessionId}</code> | Mode: {paymentSession.mode}
                </p>
              )}
              {paymentResult?.status === "paid" && (
                <p className="success-text">
                  Paid: <code>{paymentResult.transactionId}</code>
                </p>
              )}
            </div>
          )}

          {error && <p className="error-text">{error}</p>}
          {success && <p className="success-text">{success}</p>}

          <button className="primary-btn full" type="submit" disabled={loading}>
            {loading ? "Placing Order..." : "Place Order"}
          </button>
        </form>

        <aside className="summary-box">
          <h3>Bill Details</h3>
          <p>
            Items <span>{items.length}</span>
          </p>
          <p>
            Subtotal <span>INR {totals.subtotal.toFixed(2)}</span>
          </p>
          <p>
            Shipping <span>INR {totals.shipping.toFixed(2)}</span>
          </p>
          <p>
            Tax <span>INR {totals.tax.toFixed(2)}</span>
          </p>
          <hr />
          <p className="summary-total">
            Total <span>INR {totals.total.toFixed(2)}</span>
          </p>
        </aside>
      </div>
    </section>
  );
};

export default CheckoutPage;
