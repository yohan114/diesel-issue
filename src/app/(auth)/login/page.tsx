import { Fuel, BarChart3, Gauge, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/forms/login-form";

export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between bg-slate-900 p-10 text-white lg:flex">
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500 text-slate-950">
            <Fuel className="h-6 w-6" />
          </span>
          <span className="text-lg font-semibold">FleetFuel</span>
        </div>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold leading-tight">
            Diesel & super-diesel,
            <br /> tracked end to end.
          </h1>
          <ul className="space-y-3 text-slate-300">
            <li className="flex items-center gap-3"><Gauge className="h-5 w-5 text-amber-400" /> Running by km (vehicles) and hours (machinery)</li>
            <li className="flex items-center gap-3"><BarChart3 className="h-5 w-5 text-amber-400" /> Monthly summaries & full reports with charts</li>
            <li className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-amber-400" /> Role-based access — operators add, admins control</li>
          </ul>
        </div>
        <p className="text-sm text-slate-400">Fleet fuel management · LKR pricing from Ceypetco</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-slate-100 p-6">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex items-center gap-2 lg:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-slate-950">
              <Fuel className="h-5 w-5" />
            </span>
            <span className="text-lg font-semibold text-slate-900">FleetFuel</span>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-semibold text-slate-900">Welcome back</h2>
            <p className="mb-6 mt-1 text-sm text-slate-500">Sign in to manage fuel requests, issues and reports.</p>
            <LoginForm />
          </div>
          <p className="mt-4 text-center text-xs text-slate-400">
            Use the credentials provided by your administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
