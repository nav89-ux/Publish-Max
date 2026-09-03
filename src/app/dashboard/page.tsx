import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  return (
    <main className="dashboard">
      <nav>
        <Link className="wordmark" href="/dashboard">PUBLISH<span>MAX</span></Link>
        <form action="/auth/signout" method="post">
          <button className="text-button" type="submit">Sign out</button>
        </form>
      </nav>
      <section className="dashboard-content">
        <p className="eyebrow">Artist workspace</p>
        <h1>You&apos;re in.</h1>
        <p>Your PublishMax account is ready. Track uploads come next.</p>
        <dl>
          <div><dt>Account</dt><dd>{user.email}</dd></div>
          <div><dt>Status</dt><dd>Authenticated</dd></div>
        </dl>
      </section>
    </main>
  );
}
