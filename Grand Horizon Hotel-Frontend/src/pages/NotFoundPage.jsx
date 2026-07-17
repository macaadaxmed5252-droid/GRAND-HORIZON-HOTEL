import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-5 text-center">
      <span className="eyebrow">404</span>
      <h1 className="mt-2 font-display text-4xl font-semibold text-navy-950">This wing isn't built yet</h1>
      <p className="mt-3 text-navy-950/60">The page you're looking for doesn't exist, or has moved.</p>
      <Link to="/" className="btn-gold mt-6">
        Return Home
      </Link>
    </div>
  );
}
