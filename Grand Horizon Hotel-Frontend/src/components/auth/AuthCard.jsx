import heroImage from "../../assets/hero.png";

/**
 * Shared split-panel shell for the Login and Register pages — keeps their
 * branding and layout identical while each page only supplies its form.
 */
export default function AuthCard({ eyebrow, title, subtitle, children, footer }) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4.2rem)] max-w-6xl items-center px-5 py-12 sm:px-8">
      <div className="grid w-full overflow-hidden rounded-3xl border border-navy-950/5 bg-white shadow-luxury md:grid-cols-2">
        <div className="relative hidden md:block">
          <img src={heroImage} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-950/90 via-navy-950/30 to-navy-950/10" />
          <div className="absolute inset-x-0 bottom-0 p-8 text-white">
            <p className="font-display text-2xl font-semibold leading-snug">
              "The kind of quiet that makes you slow down without meaning to."
            </p>
            <p className="mt-3 text-sm text-white/60">— Grand Horizon Hotel, Guest Journal</p>
          </div>
        </div>

        <div className="flex flex-col justify-center px-6 py-10 sm:px-10 md:py-12">
          <span className="eyebrow">{eyebrow}</span>
          <h1 className="mt-2 font-display text-3xl font-semibold text-navy-950">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-navy-950/60">{subtitle}</p>}

          <div className="mt-8">{children}</div>

          {footer && <div className="mt-6 text-sm text-navy-950/60">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
