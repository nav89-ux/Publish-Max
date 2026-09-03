"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CopyIcon, ExternalIcon, InfoIcon, ShareIcon } from "@/components/ui/icons";

type CopyAction = "embed" | "link" | "discord";
type Track = { id: string; title: string };

export function TrackShareMenu({ track, align = "right" }: { track: Track; align?: "left" | "right" }) {
  const menu = useRef<HTMLDetailsElement>(null);
  const helpId = useId();
  const [copyState, setCopyState] = useState<{ action: CopyAction; status: "copied" | "failed" } | null>(null);

  useEffect(() => {
    function closeOutside(event: PointerEvent) {
      if (menu.current?.open && !menu.current.contains(event.target as Node)) menu.current.open = false;
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape" || !menu.current?.open) return;
      menu.current.open = false;
      menu.current.querySelector("summary")?.focus();
    }
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  function closeMenu() {
    if (menu.current) menu.current.open = false;
  }

  function appUrl() {
    return (process.env.NEXT_PUBLIC_APP_URL || window.location.origin).replace(/\/$/, "");
  }

  async function copyText(action: CopyAction, value: string) {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(value);
      setCopyState({ action, status: "copied" });
      closeMenu();
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand("copy");
      textarea.remove();
      setCopyState({ action, status: copied ? "copied" : "failed" });
      closeMenu();
    }
  }

  function copyLabel(action: CopyAction, idleLabel: string) {
    if (copyState?.action !== action) return idleLabel;
    return copyState.status === "copied" ? "Copied" : "Copy failed";
  }

  function shareOnX() {
    const shareUrl = `${appUrl()}/share/x/${track.id}`;
    const text = `Listen to ${track.title} on PublishMax\n${shareUrl}`;
    window.open(`https://x.com/intent/post?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer,width=720,height=620");
    closeMenu();
  }

  function shareOnReddit() {
    const shareUrl = `${appUrl()}/share/reddit/${track.id}`;
    const title = `${track.title} — listen on PublishMax`;
    window.open(`https://www.reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title)}`, "_blank", "noopener,noreferrer,width=900,height=720");
    closeMenu();
  }

  function copyEmbed() {
    const embed = `<iframe src="${appUrl()}/embed/${track.id}?mode=compact" width="100%" height="180" frameborder="0" allow="autoplay"></iframe>`;
    return copyText("embed", embed);
  }

  return (
    <div className="share-widget-control">
      <details className={`share-menu share-menu-${align}`} ref={menu}>
        <summary><ShareIcon /> Share widget</summary>
        <div>
          <button onClick={shareOnX} type="button"><ExternalIcon /> Share on X</button>
          <button onClick={() => void copyText("discord", `${appUrl()}/share/discord/${track.id}`)} type="button"><CopyIcon /> {copyLabel("discord", "Copy Discord link")}</button>
          <button onClick={shareOnReddit} type="button"><ExternalIcon /> Share on Reddit</button>
          <button onClick={() => void copyEmbed()} type="button"><CopyIcon /> {copyLabel("embed", "Copy iframe")}</button>
          <button onClick={() => void copyText("link", `${appUrl()}/embed/${track.id}`)} type="button"><CopyIcon /> {copyLabel("link", "Copy player link")}</button>
        </div>
      </details>
      <div className="share-widget-help">
        <button aria-describedby={helpId} aria-label="Explain sharing options" type="button"><InfoIcon /></button>
        <div id={helpId} role="tooltip">
          <strong>Where each option works</strong>
          <p><b>X</b> attempts an inline player and falls back to a rich link.</p>
          <p><b>Discord</b> creates a rich preview that opens the player.</p>
          <p><b>Reddit</b> creates an optimized link post and preview.</p>
          <p><b>Iframe</b> embeds the compact player on websites and blogs.</p>
          <p><b>Player link</b> opens the full listening experience anywhere.</p>
        </div>
      </div>
    </div>
  );
}
