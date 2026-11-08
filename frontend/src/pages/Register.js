import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, Eye, EyeOff, Key, Lock, ShieldCheck, User } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/layout/AuthLayout";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import { Field, Input } from "../components/ui/Field";

const ROLES = [
  { value: "VIEWER", title: "Viewer / analyst", description: "Monitor risk and audit invoices" },
  { value: "ADMIN", title: "Admin (invite only)", description: "Full system governance" },
];

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("VIEWER");
  const [inviteKey, setInviteKey] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!username.trim() || !password.trim()) {
      setError("Please fill in all required fields");
      return;
    }
    if (password.length < 6) {
      setError("Password should be at least 6 characters long");
      return;
    }
    if (role === "ADMIN" && !inviteKey.trim()) {
      setError("Admin Invite Key is required to create an Admin account");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const payload = { username, password, role };
      if (role === "ADMIN") payload.inviteKey = inviteKey.trim();

      const res = await api.post("/auth/register", payload);
      login(res.data);
      navigate("/dashboard");
    } catch (err) {
      setError(
        typeof err.response?.data?.message === "string"
          ? err.response.data.message
          : typeof err.response?.data === "string"
          ? err.response.data
          : "Registration failed. Username may already exist or invite key is invalid."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      badge="Governance access control"
      footerNote="Role-based access control keeps viewer and administrator capabilities separate."
    >
      <div className="mb-7">
        <span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <ShieldCheck size={22} />
        </span>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Create an account</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Join the Enterprise Decision Hub risk governance platform.
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
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="e.g. alex.chen"
              className="pl-10"
              autoComplete="username"
            />
          </div>
        </Field>

        <Field label="Password" htmlFor="password" hint="Minimum 6 characters">
          <div className="relative">
            <Lock
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-subtle"
            />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
              className="pl-10 pr-11"
              autoComplete="new-password"
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

        <div>
          <span className="label">Account access level</span>
          <div className="grid grid-cols-2 gap-2.5">
            {ROLES.map((option) => {
              const selected = role === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRole(option.value)}
                  aria-pressed={selected}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    selected
                      ? "border-accent bg-accent/[0.08] ring-2 ring-accent/20"
                      : "border-line bg-surface-2 hover:border-line-strong"
                  }`}
                >
                  <span className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-ink">{option.title}</span>
                    {selected && <CheckCircle2 size={15} className="text-accent" />}
                  </span>
                  <span className="mt-0.5 block text-[10px] leading-tight text-ink-muted">
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {role === "ADMIN" && (
          <Field label="Admin invite key" htmlFor="inviteKey" hint="Default seed key: EDH-ADMIN-2026-KEY">
            <div className="relative">
              <Key
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-subtle"
              />
              <Input
                id="inviteKey"
                type="password"
                required
                value={inviteKey}
                onChange={(event) => setInviteKey(event.target.value)}
                placeholder="Enter security admin invite key"
                className="pl-10"
              />
            </div>
          </Field>
        )}

        <Button type="submit" size="lg" fullWidth iconRight={ArrowRight} loading={loading}>
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 border-t border-line pt-5 text-center text-sm text-ink-muted">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
