"use client";

import { ChangeEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, UploadIcon } from "@/components/ui/icons";

type MediaKind = "avatar" | "banner";

async function uploadProfileMedia(kind: MediaKind, file: File) {
  const signResponse = await fetch("/api/uploads/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, contentType: file.type, size: file.size }),
  });
  const signed = await signResponse.json();
  if (!signResponse.ok) throw new Error(signed.error ?? "Could not prepare image upload");

  const uploadResponse = await fetch(signed.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
  if (!uploadResponse.ok) throw new Error("Image upload failed");

  const saveResponse = await fetch("/api/profile/media", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, key: signed.key }),
  });
  const result = await saveResponse.json();
  if (!saveResponse.ok) throw new Error(result.error ?? "Could not save image");
}

function MediaControl({ kind, imageUrl, artistName }: { kind: MediaKind; imageUrl: string | null; artistName: string }) {
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [state, setState] = useState<"idle" | "uploading" | "error">("idle");

  async function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setState("uploading");
    try {
      await uploadProfileMedia(kind, file);
      router.refresh();
      setState("idle");
    } catch {
      setState("error");
    } finally {
      event.target.value = "";
    }
  }

  const isAvatar = kind === "avatar";
  return (
    <>
      <button
        aria-label={`Change ${isAvatar ? "profile picture" : "profile banner"}`}
        className={isAvatar ? `artist-avatar profile-media-control${imageUrl ? "" : " artist-avatar-empty"}` : "banner-media-control"}
        disabled={state === "uploading"}
        onClick={() => input.current?.click()}
        style={isAvatar && imageUrl ? { backgroundImage: `url("${imageUrl}")` } : undefined}
        type="button"
      >
        <span>{state === "uploading" ? <><span className="media-spinner" /> Uploading</> : state === "error" ? <><ImageIcon /> Try again</> : <><UploadIcon /> Change {isAvatar ? "photo" : "banner"}</>}</span>
      </button>
      <input accept="image/jpeg,image/png,image/webp" aria-label={`Choose ${artistName} ${isAvatar ? "profile picture" : "profile banner"}`} className="visually-hidden" onChange={selectFile} ref={input} type="file" />
    </>
  );
}

export function ProfileAvatarEditor(props: { imageUrl: string | null; artistName: string }) {
  return <MediaControl artistName={props.artistName} imageUrl={props.imageUrl} kind="avatar" />;
}

export function ProfileBannerEditor(props: { artistName: string }) {
  return <MediaControl artistName={props.artistName} imageUrl={null} kind="banner" />;
}
