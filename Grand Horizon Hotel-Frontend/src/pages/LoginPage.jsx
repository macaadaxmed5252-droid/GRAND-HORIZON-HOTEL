import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthCard from "../components/auth/AuthCard";
import FormField from "../components/common/FormField";
import Spinner from "../components/common/Spinner";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { ApiError } from "../api/client";

export default function LoginPage() {
  const { login } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");
    setFieldErrors({});
    setSubmitting(true);

    try {
      const response = await login(form.email.trim(), form.password);
      success("Welcome back", `Signed in as ${response.email}.`);

      // Priority: a room the guest was trying to book, then wherever the
      // route guard bounced them from, then a role-appropriate default.
      const room = location.state?.room;
      const dates = location.state?.dates;
      const from = location.state?.from;

      if (room) {
        navigate("/reserve", { state: { room, dates }, replace: true });
      } else if (from) {
        navigate(from.pathname || "/dashboard", { replace: true });
      } else {
        navigate(response.role === "ROLE_ADMIN" ? "/admin" : "/dashboard", { replace: true });
      }
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
      } else if (err instanceof ApiError) {
        setFormError(err.message);
        toastError("Sign in failed", err.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      eyebrow="Welcome Back"
      title="Sign in to your account"
      subtitle="Access your reservations, invoices, and saved preferences."
      footer={
        <>
          New to Grand Horizon?{" "}
          <Link to="/register" className="font-semibold text-gold-600 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {formError && (
          <div className="rounded-xl border border-occupied-border bg-occupied-bg px-4 py-3 text-sm font-medium text-occupied-text">
            {formError}
          </div>
        )}

        <FormField
          id="login-email"
          label="Email Address"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={(event) => updateField("email", event.target.value)}
          error={fieldErrors.email}
          placeholder="you@example.com"
        />

        <FormField
          id="login-password"
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={form.password}
          onChange={(event) => updateField("password", event.target.value)}
          error={fieldErrors.password}
          placeholder="••••••••"
        />

        <button type="submit" disabled={submitting} className="btn-gold mt-2 justify-center">
          {submitting ? <Spinner size={16} tone="light" /> : null}
          {submitting ? "Signing In…" : "Sign In"}
        </button>
      </form>
    </AuthCard>
  );
}
