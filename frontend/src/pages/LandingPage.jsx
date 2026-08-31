import { ArrowRight, BellRing, BusFront, Check, CircleAlert, Clock3, Moon, NotebookPen, Sun, WalletCards, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useTheme } from "../context/ThemeContext.jsx";

const ownerFeatures = [
  "Dashboard",
  "Shortfall flagging",
  "Remittance alerts",
];

const driverFeatures = [
  "One-tap remittance",
  "Fare payment prompt",
  "Vehicle activation",
];

const routePings = [
  { className: "left-[11%] top-[24%]", label: "KDJ 421A", color: "bg-[#16A34A]" },
  { className: "left-[35%] top-[62%]", label: "KES 8,500", color: "bg-[#16A34A]" },
  { className: "left-[61%] top-[31%]", label: "14:00", color: "bg-[#DC2626]" },
  { className: "left-[79%] top-[72%]", label: "KDR 631F", color: "bg-[#16A34A]" },
];

function RouteField() {
  return (
    <div
      className="relative min-h-[300px] overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#102844] shadow-2xl shadow-[#0F2440]/20 sm:min-h-[360px] lg:min-h-[430px]"
      aria-label="Live fleet remittance activity"
    >
      <div className="absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_1px_1px,rgba(241,245,249,0.18)_1px,transparent_0)] [background-size:26px_26px]" />
      <div className="absolute -left-16 top-[43%] h-px w-[125%] rotate-[18deg] bg-[#9FE1BB]/50" />
      <div className="absolute -left-16 top-[58%] h-px w-[125%] -rotate-[15deg] bg-[#9FE1BB]/30" />
      <div className="absolute left-[18%] top-0 h-[120%] w-px rotate-[31deg] bg-[#9FE1BB]/25" />
      <div className="absolute left-[68%] top-[-10%] h-[125%] w-px -rotate-[38deg] bg-[#9FE1BB]/25" />

      <div className="absolute left-5 top-5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#9FE1BB]">
        <span className="h-2 w-2 rounded-full bg-[#16A34A] motion-safe:animate-pulse motion-reduce:animate-none" /> Live fleet remittance
      </div>

      {routePings.map((ping, index) => (
        <div className={`absolute ${ping.className}`} key={ping.label}>
          <span className={`absolute -inset-2 rounded-full ${ping.color} opacity-30 motion-safe:animate-ping motion-reduce:animate-none`} style={{ animationDelay: `${index * 420}ms` }} />
          <span className={`relative block h-3 w-3 rounded-full border-2 border-[#F1F5F9] ${ping.color}`} />
          <span className="absolute left-5 top-[-4px] whitespace-nowrap font-mono text-[10px] font-bold text-[#F1F5F9]/75">{ping.label}</span>
        </div>
      ))}

      <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#F1F5F9]/50">Today&apos;s collection pulse</p>
          <p className="mt-1 font-mono text-xl font-bold text-white sm:text-2xl">KES 42,700</p>
        </div>
        <div className="rounded-lg border border-[#DC2626]/40 bg-[#DC2626]/10 px-3 py-2 text-right">
          <p className="font-mono text-[10px] text-[#FCA5A5]">SHORTFALL CAUGHT</p>
          <p className="mt-1 font-mono text-sm font-bold text-white">KES 1,200</p>
        </div>
      </div>
    </div>
  );
}

function PathCard({ type, title, description, features, icon: Icon }) {
  return (
    <article className="group border-t-2 border-[#1E3A5F] pt-5 transition-colors hover:border-[#16A34A]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#16A34A]">For the {type}</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#0F2440]">{title}</h2>
        </div>
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#E3F5EA] text-[#0F2440]">
          <Icon size={21} strokeWidth={1.8} />
        </div>
      </div>
      <p className="mt-4 max-w-md text-sm leading-6 text-[#475569]">{description}</p>
      <ul className="mt-5 space-y-3">
        {features.map((feature) => (
          <li className="flex items-center gap-3 text-sm font-semibold text-[#1E3A5F]" key={feature}>
            <span className="grid h-5 w-5 place-items-center rounded-full bg-[#16A34A] text-white"><Check size={12} strokeWidth={3} /></span>
            {feature}
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function LandingPage() {
  const { isDark, toggleTheme } = useTheme();
  const [showFaq, setShowFaq] = useState(false);

  return (
    <main className="landing-page min-h-screen overflow-hidden bg-[#F1F5F9] text-[#0F2440]">
      <header className="relative mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-8 sm:py-5 lg:px-10">
        <Link className="flex min-w-0 items-center gap-2" to="/">
          <img className="h-8 w-8 shrink-0 rounded-lg border border-white bg-white p-1 object-contain shadow-sm sm:h-10 sm:w-10 sm:rounded-xl" src="/FleetPesa%20FavIcon.jpg" alt="FleetPesa" />
          <span className="truncate text-base font-bold tracking-tight sm:text-lg">FleetPesa</span>
        </Link>
        <nav className="ml-3 flex shrink-0 items-center gap-2 text-xs font-bold sm:gap-5 sm:text-sm" aria-label="Account navigation">
          <button
            className="grid h-8 w-8 place-items-center rounded-full border border-[#CBD5E1] bg-white text-[#0F2440] transition hover:border-[#16A34A] hover:text-[#16A34A] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#16A34A] dark:border-[#38536F] dark:bg-[#142236] dark:text-white sm:h-9 sm:w-9"
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
            title={`Switch to ${isDark ? "light" : "dark"} mode`}
          >
            {isDark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button className="landing-faq-trigger text-xs underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#16A34A] sm:text-sm" type="button" onClick={() => setShowFaq((open) => !open)} aria-expanded={showFaq} aria-controls="landing-faq-popover">FAQ</button>
          <Link className="text-[#1E3A5F] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#16A34A] dark:text-white" to="/login">Sign in</Link>
          <Link className="rounded-lg bg-[#16A34A] px-3 py-2 text-white shadow-sm transition hover:bg-[#128A3E] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0F2440] sm:px-4 sm:py-2.5" to="/signup">Sign up</Link>
        </nav>
        {showFaq && (
          <div id="landing-faq-popover" className="absolute right-5 top-[4.75rem] z-20 w-[min(18rem,calc(100vw-2.5rem))] rounded-xl border border-[#CBD5E1] bg-white p-4 text-left text-[#0F2440] shadow-xl dark:border-[#38536F] dark:bg-[#142236] dark:text-white sm:right-8 lg:right-10">
            <button className="float-right text-[#475569] hover:text-[#0F2440] dark:text-[#B6C7D9] dark:hover:text-white" type="button" onClick={() => setShowFaq(false)} aria-label="Close FAQ"><X size={16} /></button>
            <strong className="text-sm">FleetPesa FAQ</strong>
            <p className="mt-2 pr-3 text-xs leading-5 text-[#475569] dark:text-[#B6C7D9]">Find quick answers about remittance alerts, driver payments, vehicle activation, and fleet records.</p>
            <a className="mt-3 inline-block text-xs font-bold text-[#16A34A] underline-offset-4 hover:underline" href="#faq" onClick={() => setShowFaq(false)}>View full FAQ</a>
          </div>
        )}
      </header>

      <section className="mx-auto grid w-full max-w-7xl gap-10 px-5 pb-16 pt-8 sm:px-8 sm:pt-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16 lg:px-10 lg:pb-24 lg:pt-16">
        <div className="max-w-xl">
          <p className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#16A34A]"><NotebookPen size={15} /> The notebook, gone digital</p>
          <h1 className="mt-5 text-[clamp(2.7rem,9vw,5.8rem)] font-bold leading-[0.95] tracking-[-0.06em] text-[#0F2440]">Replace the paper. Catch every shortfall.</h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-[#475569] sm:text-lg">FleetPesa records daily vehicle remittance collections as they happen, so owners see what came in and drivers can remit without the cash hand-off guesswork.</p>
          <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Link className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#16A34A] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#16A34A]/20 transition hover:bg-[#128A3E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0F2440] sm:w-auto" to="/signup">Get started <ArrowRight size={17} /></Link>
            <Link className="text-sm font-bold text-[#1E3A5F] underline decoration-[#16A34A] decoration-2 underline-offset-4 hover:text-[#0F2440] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#16A34A]" to="/login">Already have an account? Sign in</Link>
          </div>
        </div>
        <RouteField />
      </section>

      <section className="border-y border-[#CBD5E1] bg-white" aria-labelledby="paths-heading">
        <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
          <div className="max-w-2xl">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#16A34A]">Two sides of the same route</p>
            <h2 id="paths-heading" className="mt-3 text-3xl font-bold tracking-tight text-[#0F2440] sm:text-4xl">A clearer working day for everyone in the fleet.</h2>
          </div>
          <div className="mt-12 grid gap-12 md:grid-cols-2 md:gap-16">
            <PathCard type="owner" title="See the day clearly." description="The Owner Dashboard brings collections, vehicles, and shortfall flagging into one place before a small loss becomes a pattern." features={ownerFeatures} icon={WalletCards} />
            <PathCard type="driver" title="Remit in the rhythm of the route." description="The driver workflow keeps payment close to the moment it happens, with one-tap remittance and a fare payment prompt." features={driverFeatures} icon={BusFront} />
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-20 lg:px-10 lg:py-24" aria-labelledby="notebook-heading">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#DC2626]">The problem, in plain numbers</p>
          <h2 id="notebook-heading" className="mt-3 text-3xl font-bold tracking-tight text-[#0F2440] sm:text-4xl">A notebook remembers the hand-off. It does not catch the gap.</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3 lg:gap-6">
          <div className="rounded-xl border border-[#CBD5E1] bg-white p-5"><Clock3 className="text-[#1E3A5F]" size={20} /><p className="mt-8 font-mono text-2xl font-bold text-[#0F2440]">14:00</p><p className="mt-2 text-sm leading-5 text-[#475569]">The daily collection is due, but the notebook is still in the glovebox.</p></div>
          <div className="rounded-xl border border-[#CBD5E1] bg-white p-5"><CircleAlert className="text-[#DC2626]" size={20} /><p className="mt-8 font-mono text-2xl font-bold text-[#DC2626]">-KES 1,200</p><p className="mt-2 text-sm leading-5 text-[#475569]">A shortfall slips through because no one sees the expected amount beside it.</p></div>
          <div className="rounded-xl border border-[#CBD5E1] bg-white p-5"><BellRing className="text-[#16A34A]" size={20} /><p className="mt-8 font-mono text-2xl font-bold text-[#0F2440]">Day 1</p><p className="mt-2 text-sm leading-5 text-[#475569]">FleetPesa flags the difference while it is still one missed remittance, not weeks of loss.</p></div>
        </div>
      </section>

      <section id="faq" className="border-y border-[#CBD5E1] bg-white" aria-labelledby="faq-heading">
        <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#16A34A]">FleetPesa FAQ</p>
          <h2 id="faq-heading" className="mt-3 text-3xl font-bold tracking-tight text-[#0F2440] sm:text-4xl">Answers for the whole fleet.</h2>
          <div className="mt-10 grid gap-3 lg:grid-cols-2">
            <details className="rounded-xl border border-[#CBD5E1] p-5" open>
              <summary className="cursor-pointer text-sm font-bold text-[#0F2440]">How do remittance alerts work?</summary>
              <p className="mt-3 text-sm leading-6 text-[#475569]">Owners can choose SMS, email, or no alerts in their settings. The preference is saved with the owner profile.</p>
            </details>
            <details className="rounded-xl border border-[#CBD5E1] p-5">
              <summary className="cursor-pointer text-sm font-bold text-[#0F2440]">How do I submit a remittance?</summary>
              <p className="mt-3 text-sm leading-6 text-[#475569]">Drivers open the remittance screen, enter the amount collected, confirm the phone number, and submit the payment.</p>
            </details>
            <details className="rounded-xl border border-[#CBD5E1] p-5">
              <summary className="cursor-pointer text-sm font-bold text-[#0F2440]">Where can I see remittance history?</summary>
              <p className="mt-3 text-sm leading-6 text-[#475569]">Owners can review vehicle records and drivers can use Remittance history to review previous submissions.</p>
            </details>
            <details className="rounded-xl border border-[#CBD5E1] p-5">
              <summary className="cursor-pointer text-sm font-bold text-[#0F2440]">How do I update my account details?</summary>
              <p className="mt-3 text-sm leading-6 text-[#475569]">Open Settings to update your name, phone number, or profile picture.</p>
            </details>
            <details className="rounded-xl border border-[#CBD5E1] p-5">
              <summary className="cursor-pointer text-sm font-bold text-[#0F2440]">How do I change my password?</summary>
              <p className="mt-3 text-sm leading-6 text-[#475569]">Open Password, enter your current password, then choose and confirm a new password.</p>
            </details>
            <details className="rounded-xl border border-[#CBD5E1] p-5">
              <summary className="cursor-pointer text-sm font-bold text-[#0F2440]">How do I activate my vehicle?</summary>
              <p className="mt-3 text-sm leading-6 text-[#475569]">Drivers select their assigned vehicle on the dashboard and choose Activate vehicle before starting the route.</p>
            </details>
          </div>
        </div>
      </section>

      <section className="bg-[#0F2440] px-5 py-16 text-white sm:px-8 lg:px-10 lg:py-20">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-[#9FE1BB]">Track your fleet with confidence</p>
            <h2 className="mt-3 max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">Keep every vehicle, remittance, and shortfall in view.</h2>
          </div>
          <Link className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#16A34A] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#128A3E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white" to="/signup">Create your account <ArrowRight size={17} /></Link>
        </div>
        <footer className="mx-auto mt-16 flex w-full max-w-7xl flex-col items-start gap-3 border-t border-white/25 pt-5 text-left font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-white sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:text-[10px] sm:tracking-[0.14em]">
          <span>&copy; 2026 FleetPesa</span>
          <span className="max-w-full leading-5 sm:text-right">Kenyan matatu fleet tools <span className="mx-1 text-white">//</span> every fleet accounted for</span>
        </footer>
      </section>
    </main>
  );
}
