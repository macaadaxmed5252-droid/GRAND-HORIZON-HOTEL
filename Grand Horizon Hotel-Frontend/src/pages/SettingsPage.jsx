import { useEffect, useState } from "react";
import { updateOwnProfile, resolveAvatarUrl } from "../api/usersApi";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import FormField from "../components/common/FormField";
import Spinner, { FullPageSpinner } from "../components/common/Spinner";
import ImageWithFallback from "../components/common/ImageWithFallback";
import { ApiError } from "../api/client";

export default function SettingsPage() {
  const { profile, refreshProfile } = useAuth();
  const { success, error: toastError } = useToast();

  const [form, setForm] = useState({ name: "", phone: "" });
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Syncing external async-fetched data (profile, loaded by AuthContext)
    // into local editable form state — not derivable during render, so this
    // can't be hoisted out of an effect.
    if (profile) {
      setForm({ name: profile.name || "", phone: profile.phone || "" });
    }
  }, [profile]);

  useEffect(() => {
    // Object URL lifecycle management: the URL must be created/revoked in
    // lockstep with the effect's cleanup, so the preview state has to be
    // set here rather than computed at render time.
    if (!avatarFile) {
      setPreviewUrl(null);
      return undefined;
    }
    const objectUrl = URL.createObjectURL(avatarFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [avatarFile]);

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
      await updateOwnProfile(form, avatarFile);
      success("Profile Updated", "Your changes have been saved.");
      setAvatarFile(null);
      refreshProfile();
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
      } else if (err instanceof ApiError) {
        setFormError(err.message);
        toastError("Couldn't Save Profile", err.message);
      } else {
        setFormError("Something went wrong while saving your profile.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!profile) {
    return <FullPageSpinner label="Loading your profile…" />;
  }

  const displayedAvatarUrl = previewUrl || resolveAvatarUrl(profile.profileImageUrl);

  return (
    <div className="mx-auto max-w-3xl px-5 py-14 sm:px-8">
      <span className="eyebrow">Your Space</span>
      <h1 className="mt-2 font-display text-4xl font-semibold text-navy-950">Account Settings</h1>
      <p className="mt-2 text-navy-950/60">Update your personal details and profile picture.</p>

      <div className="relative mt-10 overflow-hidden rounded-3xl border border-navy-950/8 bg-white/70 p-6 shadow-luxury backdrop-blur-xl sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gold-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-navy-800/5 blur-3xl" />

        <form onSubmit={handleSubmit} noValidate className="relative flex flex-col gap-5">
          {formError && (
            <div className="rounded-xl border border-occupied-border bg-occupied-bg px-4 py-3 text-sm font-medium text-occupied-text">
              {formError}
            </div>
          )}

          <div className="flex items-center gap-5">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full ring-4 ring-gold-400/50">
              <ImageWithFallback src={displayedAvatarUrl} alt="" className="h-full w-full object-cover" fallbackIconClassName="h-8 w-8" />
            </div>
            <div>
              <label htmlFor="avatar-upload" className="btn-outline cursor-pointer !px-4 !py-2 text-xs">
                Change Photo
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
              />
              <p className="mt-2 text-xs text-navy-950/40">JPEG, PNG, WEBP, or GIF — max 5MB.</p>
            </div>
          </div>

          <FormField
            id="settings-name"
            label="Full Name"
            required
            pattern="^[a-zA-Z\s]+$"
            title="Letters and spaces only"
            onKeyDown={(e) => {
              if (e.key.length === 1 && !/[a-zA-Z\s]/.test(e.key)) e.preventDefault();
            }}
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            error={fieldErrors.name}
            hint="Letters and spaces only, 3–50 characters."
          />

          <FormField id="settings-email" label="Email Address" value={profile.email} disabled hint="Email can't be changed here." />

          <FormField
            id="settings-phone"
            label="Phone Number"
            required
            inputMode="tel"
            pattern="^\+?[0-9\s]+$"
            onKeyDown={(e) => {
              if (e.key.length === 1 && !/[0-9+\s]/.test(e.key)) e.preventDefault();
            }}
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            error={fieldErrors.phone}
            hint="International format, e.g. +252611234567."
          />

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={submitting} className="btn-gold">
              {submitting && <Spinner size={16} tone="light" />}
              {submitting ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
