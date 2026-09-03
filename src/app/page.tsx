import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="auth-shell">
      <section className="brand-panel">
        <Link className="wordmark" href="/">PUBLISH<span>MAX</span></Link>
        <div className="brand-copy">
          <p className="eyebrow">Artist to audience distribution</p>
          <h1>Your music.<br />Already there.</h1>
          <p className="intro">Put the actual track inside the communities where your audience already listens, talks, and discovers.</p>
        </div>
        <p className="edition">AIR MEDIA / INDEPENDENT INFRASTRUCTURE</p>
      </section>
      <section className="form-panel">
        <AuthForm />
      </section>
    </main>
  );
}
