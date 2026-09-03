"use client";

import { FormEvent, useState } from "react";

type Profile = { id: string; username: string | null; display_name: string | null; bio: string | null; avatar_url: string | null; banner_url: string | null };

async function uploadImage(kind: "avatar" | "banner", file: File) {
  const signResponse = await fetch("/api/uploads/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, contentType: file.type, size: file.size }),
  });
  const signed = await signResponse.json();
  if (!signResponse.ok) throw new Error(signed.error ?? "Could not prepare image upload");
  const uploadResponse = await fetch(signed.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
  if (!uploadResponse.ok) throw new Error("Image upload failed");
  return String(signed.key);
}

export function ProfileForm({ profile, onSaved }: { profile: Profile; onSaved?: () => void }) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const avatar = form.get("avatar") as File;
      const banner = form.get("banner") as File;
      const [avatarKey, bannerKey] = await Promise.all([
        avatar?.size ? uploadImage("avatar", avatar) : null,
        banner?.size ? uploadImage("banner", banner) : null,
      ]);
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: String(form.get("username")).trim().toLowerCase(),
          displayName: String(form.get("displayName")).trim(),
          bio: String(form.get("bio")).trim(),
          avatarKey,
          bannerKey,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not save profile");
      setMessage("Profile saved.");
      onSaved?.();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="profile-form" onSubmit={submit}>
      <label htmlFor="username">Username</label>
      <input defaultValue={profile.username ?? ""} id="username" name="username" pattern="[a-z0-9_]{3,30}" placeholder="artist_name" required />
      <p className="field-help">3–30 lowercase letters, numbers, or underscores.</p>
      <label htmlFor="displayName">Display name</label>
      <input defaultValue={profile.display_name ?? ""} id="displayName" maxLength={80} name="displayName" />
      <label htmlFor="bio">Bio</label>
      <textarea defaultValue={profile.bio ?? ""} id="bio" maxLength={500} name="bio" rows={6} />
      <div className="profile-media-fields">
        <div><label htmlFor="avatar">Profile picture</label><input accept="image/jpeg,image/png,image/webp" id="avatar" name="avatar" type="file" /></div>
        <div><label htmlFor="banner">Banner</label><input accept="image/jpeg,image/png,image/webp" id="banner" name="banner" type="file" /></div>
      </div>
      <button className="primary-button" disabled={saving} type="submit">{saving ? "Saving..." : "Save profile"}</button>
      {message && <p className="form-message" role="status">{message}</p>}
    </form>
  );
}
