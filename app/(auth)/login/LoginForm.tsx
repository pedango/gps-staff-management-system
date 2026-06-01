"use client";

import { useEffect, useRef } from "react";
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail, Shield } from "lucide-react";
import { useLoginForm } from "@/hooks/useLoginForm";

export function LoginForm() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    toggleShowPassword,
    error,
    isLoading,
    handleSubmit,
  } = useLoginForm();

  const emailRef = useRef<HTMLInputElement>(null);
  const year = new Date().getFullYear();

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    if (!mq.matches) return;
    const id = window.requestAnimationFrame(() => emailRef.current?.focus());
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <main className="login-right">
      <div className="login-right-mobile-hero md:hidden" aria-hidden />

      <div className="login-right-inner">
        <div className="form-column">
          <header className="form-header">
            <h1 className="form-heading">Welcome Back</h1>
            <p className="form-subtitle">Staff Officer access only.</p>
            <div className="gold-accent" aria-hidden />
          </header>

          <form onSubmit={handleSubmit} aria-label="Staff Officer login" noValidate>
            <div className="field-group" role="group" aria-labelledby="email-label">
            <label id="email-label" htmlFor="email" className="field-label">
              Work Email
            </label>
            <div className="field-input-wrap">
              <Mail className="field-icon-left" strokeWidth={2} aria-hidden />
              <input
                ref={emailRef}
                id="email"
                type="email"
                autoComplete="email"
                aria-required="true"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@gps.gov.gh"
                className="field-input"
              />
            </div>
          </div>

          <div className="field-group" role="group" aria-labelledby="password-label">
            <label id="password-label" htmlFor="password" className="field-label">
              Password
            </label>
            <div className="field-input-wrap">
              <Lock className="field-icon-left" strokeWidth={2} aria-hidden />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                aria-required="true"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                className="field-input field-input-password"
              />
              <button
                type="button"
                className="field-icon-right"
                onClick={toggleShowPassword}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-[18px] w-[18px]" aria-hidden /> : <Eye className="h-[18px] w-[18px]" aria-hidden />}
              </button>
            </div>
          </div>

          {error ? (
            <div role="alert" className="login-error-banner">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden />
              <p>{error}</p>
            </div>
          ) : null}

          <button type="submit" disabled={isLoading} aria-busy={isLoading} className="btn-signin">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                Authenticating…
              </>
            ) : (
              "Sign In"
            )}
          </button>

          <div className="disclaimer-box">
            <Shield className="disclaimer-icon" strokeWidth={2} aria-hidden />
            <p>
              <strong>Authorised access only.</strong> Staff data is processed for authorised administrative
              purposes in accordance with the Electronic Transactions Act, 2008 (Act 772) and applicable Ghana Police
              Service regulations.
            </p>
            </div>
          </form>
        </div>
      </div>

      <footer className="right-footer">
        Staff data is processed for authorised administrative purposes only.
        <br />© {year} Ghana Police Service · Eastern North Region
      </footer>
    </main>
  );
}
