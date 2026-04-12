import { useState } from "react";

export default function LoginPage({ signIn, signUp, error, setError }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    if (isSignUp) {
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        setSubmitting(false);
        return;
      }
      const ok = await signUp(email, password);
      if (ok) setSignUpSuccess(true);
    } else {
      await signIn(email, password);
    }
    setSubmitting(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="rise-in w-full max-w-sm">
        <div className="rounded-[2rem] border border-emerald-900/10 bg-white/80 p-8 shadow-[0_20px_60px_rgba(22,51,41,0.08)] backdrop-blur">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-emerald-950">
              🏸 Badminton Queue
            </h1>
            <p className="mt-1 font-['IBM_Plex_Mono'] text-xs uppercase tracking-[0.28em] text-emerald-800/65">
              {isSignUp ? "Create account" : "Sign in to continue"}
            </p>
          </div>

          {signUpSuccess ? (
            <div className="rounded-2xl bg-emerald-50 p-4 text-center text-sm text-emerald-800">
              <p className="font-semibold">Check your email!</p>
              <p className="mt-1 text-emerald-700/70">
                We sent a confirmation link. Click it to activate your account.
              </p>
              <button
                type="button"
                className="mt-4 text-sm font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-900"
                onClick={() => {
                  setIsSignUp(false);
                  setSignUpSuccess(false);
                  setError(null);
                }}
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium text-emerald-900"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-emerald-950/12 bg-[#fcf9f1] px-4 py-2.5 text-sm text-emerald-950 outline-none ring-emerald-600/30 transition focus:border-emerald-600 focus:ring-2"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-emerald-900"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-emerald-950/12 bg-[#fcf9f1] px-4 py-2.5 text-sm text-emerald-950 outline-none ring-emerald-600/30 transition focus:border-emerald-600 focus:ring-2"
                  placeholder="••••••••"
                />
              </div>

              {isSignUp ? (
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-1.5 block text-sm font-medium text-emerald-900"
                  >
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    autoComplete="new-password"
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-emerald-950/12 bg-[#fcf9f1] px-4 py-2.5 text-sm text-emerald-950 outline-none ring-emerald-600/30 transition focus:border-emerald-600 focus:ring-2"
                    placeholder="••••••••"
                  />
                </div>
              ) : null}

              {error ? (
                <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-emerald-950 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-50"
              >
                {submitting
                  ? "Please wait..."
                  : isSignUp
                    ? "Create account"
                    : "Sign in"}
              </button>

              <p className="text-center text-sm text-emerald-900/60">
                {isSignUp ? "Already have an account?" : "No account yet?"}{" "}
                <button
                  type="button"
                  className="font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-900"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError(null);
                    setConfirmPassword("");
                  }}
                >
                  {isSignUp ? "Sign in" : "Create one"}
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
