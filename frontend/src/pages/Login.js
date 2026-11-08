import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Lock, Sparkles, User, Zap } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/layout/AuthLayout";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import { Field, Input } from "../components/ui/Field";

const DEMO_ACCOUNTS = [
  { username: "Harsha", password: "123456" },
  { username: "admin", password: "admin123" },
];

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { username, password });
      login(res.data);
      const redirectUrl = sessionStorage.getItem("redirectAfterLogin");
      sessionStorage.removeItem("redirectAfterLogin");
      navigate(redirectUrl || "/dashboard");
    } catch (err) {
      let message = "Invalid credentials. Please verify and try again.";
      if (!err.response) {
        message = "Cannot reach the backend. Make sure Spring Boot is running on port 8080.";
      } else if (err.response?.data?.message) {
        message = err.response.data.message;
      } else if (typeof err.response?.data === "string") {
        message = err.response.data;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      badge="Risk intelligence console"
      footerNote="Protected by JWT authentication and role-based access control."
    >
      <div className="mb-7">
        <span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <Sparkles size={21} />
        </span>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Welcome back</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Sign in to access AI risk intelligence and governance.
        </p>
      </div>

      {error && (
        <Alert tone="danger" className="mb-5">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Username" htmlFor="username">
          <div className="relative">
            <User
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-subtle"
            />
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Enter your username"
              className="pl-10"
              autoFocus
              autoComplete="username"
            />
          </div>
        </Field>

        <Field label="Password" htmlFor="password">
          <div className="relative">
            <Lock
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-subtle"
            />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••••••"
              className="pl-10 pr-11"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-subtle transition-colors hover:text-ink"
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </Field>

        <Button type="submit" size="lg" fullWidth iconRight={ArrowRight} loading={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <div className="mt-5 rounded-2xl border border-accent/20 bg-accent/[0.06] p-3.5">
        <div className="mb-2 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink">
            <Zap size={13} className="text-accent" />
            Demo accounts
          </span>
          <span className="text-[10px] text-ink-subtle">Click to fill</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.username}
              type="button"
              onClick={() => {
                setUsername(account.username);
                setPassword(account.password);
                setError("");
              }}
              className="group flex items-center justify-between rounded-xl border border-line bg-surface p-2.5 text-left transition-all hover:border-accent/40 hover:bg-accent/[0.04]"
            >
              <span>
                <span className="block text-xs font-semibold text-ink">{account.username}</span>
                <span className="block font-mono text-[10px] text-ink-subtle">
                  {account.password}
                </span>
              </span>
              <span className="text-[10px] font-semibold text-accent opacity-0 transition-opacity group-hover:opacity-100">
                Use
              </span>
            </button>
          ))}
        </div>
      </div>

      <p className="mt-6 border-t border-line pt-5 text-center text-sm text-ink-muted">
        Don&apos;t have an account?{" "}
        <Link to="/register" className="font-semibold text-accent hover:underline">
          Start for free
        </Link>
      </p>
    </AuthLayout>
  );
}
