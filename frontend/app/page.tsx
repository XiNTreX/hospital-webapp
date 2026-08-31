import Link from "next/link";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 px-4 py-12 text-center">
      {/* Background Decorative Elements */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-teal-500/20 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:32px_32px]" />

      <div className="relative z-10 max-w-2xl rounded-3xl border border-slate-800 bg-slate-900/80 p-10 shadow-2xl backdrop-blur-xl">
        {/* Hospital Branding Header */}
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 mb-6 shadow-inner">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v12m-6-6h12" />
          </svg>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          Xintrex <span className="text-teal-400">Health</span> Portal
        </h1>
        <p className="mt-4 text-slate-400 text-lg leading-relaxed">
          Integrated Healthcare & Hospital Operations Network. Manage appointments, emergency blood requests, ambulance logistics, and medical records in one platform.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="py-3.5 px-8 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold transition duration-200 shadow-lg shadow-teal-500/20"
          >
            Access Portal Login
          </Link>
          <Link
            href="/register"
            className="py-3.5 px-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-bold transition duration-200"
          >
            Create New Account
          </Link>
        </div>
      </div>
    </main>
  );
}