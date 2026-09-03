"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

export function AuthForm() {
  const [mode, setMode] = useState<Mode>("signin");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email"));
    const password = String(data.get("password"));
    const supabase = createClient();

    if (mode === "signup") {
      const displayName = String(data.get("displayName")).trim();
      const username = String(data.get("username")).trim().toLowerCase();
      const confirmPassword = String(data.get("confirmPassword"));
      if (!displayName || displayName.length > 80 || !/^[a-z0-9_]{3,30}$/.test(username)) {
        setMessage("Enter a display name and a valid username.");
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setMessage("Passwords do not match.");
        setLoading(false);
        return;
      }

      const { data: existingProfile, error: usernameError } = await supabase.from("profiles").select("id").eq("username", username).maybeSingle();
      if (usernameError || existingProfile) {
        setMessage(usernameError ? "Could not check username availability." : "That username is already taken.");
        setLoading(false);
        return;
      }

      const { data: authData, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName, username },
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      });
      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }
      if (authData.session) {
        window.location.assign("/dashboard");
        return;
      }
      setMessage("Check your email to confirm your account.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }
    window.location.assign("/dashboard");
  }

  function changeMode(nextMode: Mode) {
    setMode(nextMode);
    setMessage("");
  }

  return (
    <div className="auth-card">
      <p className="eyebrow">Publish your sound</p>
      <h2>{mode === "signin" ? "Welcome back" : "Create your account"}</h2>
      <p className="form-intro">{mode === "signin" ? "Sign in to manage your music and placements." : "Start putting your tracks where discovery happens."}</p>
      <div className="mode-switch" role="tablist" aria-label="Account action">
        <button aria-selected={mode === "signin"} onClick={() => changeMode("signin")} role="tab" type="button">Sign in</button>
        <button aria-selected={mode === "signup"} onClick={() => changeMode("signup")} role="tab" type="button">Create account</button>
      </div>
      <form onSubmit={submit}>
        {mode === "signup" && (
          <>
            <label htmlFor="displayName">Artist name</label>
            <input autoComplete="name" id="displayName" maxLength={80} name="displayName" placeholder="Your artist or stage name" required />
            <label htmlFor="username">Username</label>
            <input autoCapitalize="none" autoComplete="username" id="username" maxLength={30} minLength={3} name="username" pattern="[a-z0-9_]{3,30}" placeholder="artist_name" required />
            <p className="field-help">Lowercase letters, numbers, and underscores only.</p>
          </>
        )}
        <label htmlFor="email">Email address</label>
        <input autoComplete="email" id="email" name="email" placeholder="artist@example.com" required type="email" />
        <label htmlFor="password">Password</label>
        <input autoComplete={mode === "signin" ? "current-password" : "new-password"} id="password" minLength={8} name="password" placeholder="At least 8 characters" required type="password" />
        {mode === "signup" && (
          <>
            <label htmlFor="confirmPassword">Confirm password</label>
            <input autoComplete="new-password" id="confirmPassword" minLength={8} name="confirmPassword" placeholder="Enter your password again" required type="password" />
          </>
        )}
        <button className="primary-button" disabled={loading} type="submit">
          {loading ? "Working..." : mode === "signin" ? "Sign in" : "Create account"}
        </button>
        {message && <p className="form-message" role="status">{message}</p>}
      </form>
      <p className="terms">By continuing, you agree to PublishMax&apos;s terms and privacy policy.</p>
    </div>
  );
}
