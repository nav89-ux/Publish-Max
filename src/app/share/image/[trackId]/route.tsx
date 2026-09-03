import { ImageResponse } from "next/og";
import { getPublicTrack } from "@/lib/tracks/public-track";

export const runtime = "edge";

export async function GET(_: Request, { params }: { params: Promise<{ trackId: string }> }) {
  const { trackId } = await params;
  const track = await getPublicTrack(trackId);
  if (!track) return new Response("Track not found", { status: 404 });
  const artistName = track.artist.displayName || track.artist.username || "Independent artist";

  return new ImageResponse(
    <div style={{ display: "flex", width: "100%", height: "100%", background: "#090909", color: "#f1efe9" }}>
      <div style={{ display: "flex", width: 630, height: 630, backgroundImage: `url(${track.cover_url})`, backgroundPosition: "center", backgroundSize: "cover" }} />
      <div style={{ display: "flex", flex: 1, flexDirection: "column", justifyContent: "space-between", padding: "58px 60px" }}>
        <div style={{ display: "flex", fontSize: 24, fontWeight: 900, letterSpacing: "-1px" }}>PUBLISH<span style={{ color: "#e02828" }}>MAX</span></div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", marginBottom: 18, color: "#e02828", fontSize: 17, fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase" }}>Listen now</div>
          <div style={{ display: "flex", fontSize: 66, fontWeight: 900, letterSpacing: "-4px", lineHeight: .92, textTransform: "uppercase" }}>{track.title}</div>
          <div style={{ display: "flex", marginTop: 26, color: "#a7a49d", fontSize: 27 }}>{artistName}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", fontSize: 20, fontWeight: 700 }}><span style={{ display: "flex", marginRight: 14, color: "#e02828", fontSize: 30 }}>▶</span> Play on PublishMax</div>
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}
