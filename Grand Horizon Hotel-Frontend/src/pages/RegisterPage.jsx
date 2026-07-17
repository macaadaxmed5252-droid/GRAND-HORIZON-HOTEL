import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthCard from "../components/auth/AuthCard";
import FormField from "../components/common/FormField";
import Spinner from "../components/common/Spinner";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { ApiError } from "../api/client";

const INITIAL_FORM = { name: "", email: "", password: "", phone: "" };

export default function RegisterPage() {
  const { register } = useAuth();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState(INITIAL_FORM);
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
      const response = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim(),
      });

      success("Account created", `Welcome to Grand Horizon Hotel, ${response.email}.`);

      const room = location.state?.room;
      const dates = location.state?.dates;
      if (room) {
        navigate("/reserve", { state: { room, dates }, replace: true });
      } else {
        // Every self-registered account is ROLE_USER — never route straight to /admin here.
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
      } else if (err instanceof ApiError) {
        setFormError(err.message);
        toastError("Registration failed", err.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      eyebrow="Join Grand Horizon"
      title="Create your account"
      subtitle="Register once to book, track reservations, and download invoices."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-gold-600 hover:underline">
            Sign in
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
          id="register-name"
          label="Full Name"
          type="text"
          autoComplete="name"
          required
          value={form.name}
          onChange={(event) => updateField("name", event.target.value)}
          error={fieldErrors.name}
          hint="Letters and spaces only, 3–50 characters."
          placeholder="Ahmed Warsame"
        />

        <FormField
          id="register-email"
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
          id="register-password"
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          value={form.password}
          onChange={(event) => updateField("password", event.target.value)}
          error={fieldErrors.password}
          hint="Min 8 characters, with an uppercase letter, a lowercase letter, a number, and a special character."
          placeholder="••••••••"
        />

        <FormField
          id="register-phone"
          label="Phone Number"
          type="tel"
          autoComplete="tel"
          required
          value={form.phone}
          onChange={(event) => updateField("phone", event.target.value)}
          error={fieldErrors.phone}
          hint="International format, e.g. +252611234567."
          placeholder="+252611234567"
        />

        <button type="submit" disabled={submitting} className="btn-gold mt-2 justify-center">
          {submitting ? <Spinner size={16} tone="light" /> : null}
          {submitting ? "Creating Account…" : "Create Account"}
        </button>
      </form>
    </AuthCard>
  );
}
