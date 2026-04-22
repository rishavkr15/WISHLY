import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, loading } = useAuth();

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const result = await register(form);
    if (result.ok) {
      navigate("/products", { replace: true });
    } else {
      setError(result.message);
    }
  };

  return (
    <section className="container section">
      <div className="auth-box panel">
        <h2>Create Account</h2>
        <p className="muted">Join Wishly and place your first order.</p>

        <form className="form-grid" onSubmit={onSubmit}>
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
            Email
            <input
              className="input"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            />
          </label>
          <label className="field-label">
            Password
            <input
              className="input"
              type="password"
              minLength={6}
              required
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            />
          </label>

          {error && <p className="error-text">{error}</p>}

          <button className="primary-btn full" disabled={loading} type="submit">
            {loading ? "Creating..." : "Register"}
          </button>
        </form>

        <p className="muted">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </section>
  );
};

export default RegisterPage;
