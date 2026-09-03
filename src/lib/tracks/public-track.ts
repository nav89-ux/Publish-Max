import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type PublicTrack = {
  id: string;
  title: string;
  cover_url: string;
  audio_url: string;
  owner_id: string;
  artist: {
    username: string | null;
    displayName: string | null;
  };
};

export const getPublicTrack = cache(async (trackId: string): Promise<PublicTrack | null> => {
  const supabase = await createClient();
  const { data: track } = await supabase.from("tracks").select("id, title, cover_url, audio_url, owner_id").eq("id", trackId).eq("status", "ready").eq("is_published", true).single();
  if (!track?.audio_url) return null;
  const { data: profile } = await supabase.from("profiles").select("username, display_name").eq("id", track.owner_id).single();
  if (!profile) return null;
  return {
    ...track,
    audio_url: track.audio_url,
    artist: { username: profile.username, displayName: profile.display_name },
  };
});

export function getPublicAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}
