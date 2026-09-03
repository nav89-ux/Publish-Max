import type { Metadata } from "next";
import Link from "next/link";
import { ArrowIcon, ExternalIcon } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Builder's Note | PublishMax",
  description: "How PublishMax works, what each platform supports, and what is intentionally outside the MVP.",
};

const platforms = [
  { name: "Websites & blogs", level: "Inline player", tone: "works", detail: "Sites that permit iframes can show the complete player, including likes and listening analytics." },
  { name: "X", level: "Conditional", tone: "partial", detail: "PublishMax provides Player Card metadata. X chooses whether to show the player; otherwise it shows a rich link." },
  { name: "Discord", level: "Rich preview", tone: "partial", detail: "Discord displays artwork and track information. Clicking the preview opens the PublishMax player." },
  { name: "Reddit", level: "Link preview", tone: "partial", detail: "Reddit creates a link post with artwork. Posts and comments do not accept third-party players." },
  { name: "YouTube comments", level: "Link only", tone: "limited", detail: "Comments do not support third-party rich media, so PublishMax provides a direct player link." },
  { name: "Games", level: "Not in MVP", tone: "limited", detail: "Games require deliberate integration with each engine or platform. There is no universal embed format for games." },
];

const loop = [
  ["1", "Upload", "The artist provides an audio master, cover artwork, and title."],
  ["2", "Process", "A background worker converts the master into a web-ready MP3."],
  ["3", "Share", "PublishMax creates an iframe, public player, profile, and platform-specific links."],
  ["4", "Measure", "Player events become play, retention, like, and referral analytics."],
];

export default function BuildersNotePage() {
  return (
    <main className="builders-note builders-note-direct">
      <nav><Link className="wordmark" href="/">PUBLISH<span>MAX</span></Link><Link className="builders-back" href="/dashboard"><ArrowIcon /> Dashboard</Link></nav>
      <header className="builders-hero">
        <div><p className="eyebrow">Builder&apos;s note</p><h1>How PublishMax works</h1></div>
        <p>This page describes what the MVP does, what depends on external platforms, and why some possible integrations are intentionally not included.</p>
      </header>

      <section className="builders-proof">
        <div className="builders-section-label"><span>01</span><p>Core product</p></div>
        <div><h2>The reliable part</h2><p>An artist can upload one track, embed it on a website, send listeners to a public profile, and review the resulting activity. PublishMax controls this path from upload through playback and analytics.</p></div>
      </section>

      <section className="builders-loop" aria-label="PublishMax product flow">
        {loop.map(([number, title, detail]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{detail}</p></article>)}
      </section>

      <section className="platform-reality">
        <header><div><p className="eyebrow">Platform support</p><h2>What each destination allows</h2></div><p>PublishMax cannot override another platform&apos;s embed rules. It uses an inline player where permitted and a link preview where it is not.</p></header>
        <div className="platform-table">
          {platforms.map((platform) => <article key={platform.name}><div><h3>{platform.name}</h3><span className={`platform-level platform-level-${platform.tone}`}>{platform.level}</span></div><p>{platform.detail}</p></article>)}
        </div>
      </section>

      <section className="scope-control">
        <div className="builders-section-label"><span>02</span><p>Scope control</p></div>
        <div>
          <h2>Why games are not part of this MVP</h2>
          <p>Game playback is possible, but it is a separate product effort rather than another sharing link.</p>
          <ul>
            <li><strong>SDK distribution</strong><span>Developers would need installable packages, versioning, documentation, and support.</span></li>
            <li><strong>Engine-specific work</strong><span>Unity, Unreal, Godot, Roblox, and browser games use different audio and security systems.</span></li>
            <li><strong>API-key management</strong><span>Game clients need scoped public credentials, rate limits, rotation, and abuse controls.</span></li>
            <li><strong>New analytics dimensions</strong><span>Games introduce installations, builds, scenes, placements, devices, and sessions.</span></li>
          </ul>
          <p>Adding this now would make the MVP harder to validate without improving the core website and social-sharing loop. It can be revisited after there is evidence that game developers want the integration.</p>
        </div>
      </section>

      <section className="realistic-mvp">
        <div className="mvp-statement"><p>Current implementation</p><h2>What is included</h2></div>
        <ol>
          <li><span>01</span><div><strong>Audio processing</strong><p>Private source storage and FFmpeg conversion to a public MP3.</p></div></li>
          <li><span>02</span><div><strong>Artist profile</strong><p>A public identity page with an inline playable discography.</p></div></li>
          <li><span>03</span><div><strong>Distribution options</strong><p>Website iframe, full player link, X Card attempt, Discord preview, and Reddit link post.</p></div></li>
          <li><span>04</span><div><strong>Analytics</strong><p>Starts, listening milestones, completion, likes, sources, and track performance.</p></div></li>
        </ol>
      </section>

      <footer className="builders-conclusion">
        <p className="eyebrow">Summary</p>
        <h2>Use the complete player where possible and a clear link where it is not.</h2>
        <p>The MVP does not depend on every platform supporting inline audio. The website player is the source of truth, and each sharing option leads back to it using the best preview the destination supports.</p>
        <a href="https://docs.google.com/document/d/1c7pNRqYvxaXJHG1-Y8UnNuOG6aSKJYMa36XXNXo5BF8/edit?usp=sharing" rel="noreferrer" target="_blank">Read the source brief <ExternalIcon /></a>
      </footer>
    </main>
  );
}
