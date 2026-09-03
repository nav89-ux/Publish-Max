import Link from "next/link";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile/profile-form";
import { createClient } from "@/lib/supabase/server";

export default async function ProfileSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");
  const { data: profile } = await supabase.from("profiles").select("id, username, display_name, bio, avatar_url, banner_url").eq("id", user.id).single();
  if (!profile) redirect("/dashboard");

  return (
    <main className="settings-page">
      <nav><Link className="wordmark" href="/dashboard">PUBLISH<span>MAX</span></Link><Link className="text-button" href="/dashboard">Back to dashboard</Link></nav>
      <section className="settings-content">
        <p className="eyebrow">Public identity</p>
        <h1>Edit profile</h1>
        <p>Build the page listeners reach from your embedded players.</p>
        <ProfileForm profile={profile} />
      </section>
    </main>
  );
}
