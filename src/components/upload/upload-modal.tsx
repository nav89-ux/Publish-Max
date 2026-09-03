"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Stage = "idle" | "uploading" | "finalizing" | "success";

function uploadFile(url: string, file: File, onProgress: (value: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", url);
    request.setRequestHeader("Content-Type", file.type);
    request.upload.onprogress = (event) => event.lengthComputable && onProgress(Math.round((event.loaded / event.total) * 100));
    request.onload = () => request.status >= 200 && request.status < 300 ? resolve() : reject(new Error("Upload failed"));
    request.onerror = () => reject(new Error("Upload failed"));
    request.send(file);
  });
}

async function signFile(kind: "audio" | "cover", file: File) {
  const response = await fetch("/api/uploads/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, contentType: file.type, size: file.size }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "Could not prepare upload");
  return result as { key: string; uploadUrl: string };
}

export function UploadModal() {
  const dialog = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const busy = stage === "uploading" || stage === "finalizing";

  function close() {
    if (!busy) dialog.current?.close();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    const audio = form.get("audio") as File;
    const cover = form.get("cover") as File;

    try {
      setStage("uploading");
      const [audioTarget, coverTarget] = await Promise.all([signFile("audio", audio), signFile("cover", cover)]);
      await Promise.all([
        uploadFile(audioTarget.uploadUrl, audio, (value) => setProgress(Math.round(value * .9))),
        uploadFile(coverTarget.uploadUrl, cover, (value) => setProgress((current) => Math.max(current, Math.round(value * .1)))),
      ]);
      setStage("finalizing");
      setProgress(100);
      const response = await fetch("/api/tracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, audioKey: audioTarget.key, coverKey: coverTarget.key }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Could not finalize track");
      setStage("success");
      router.refresh();
    } catch (uploadError) {
      setStage("idle");
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed");
    }
  }

  return (
    <>
      <button className="upload-button" onClick={() => dialog.current?.showModal()} type="button">Upload</button>
      <dialog className="upload-dialog" onClose={() => { setError(""); setStage("idle"); setProgress(0); }} ref={dialog}>
        <div className="dialog-heading">
          <div><p className="eyebrow">New release</p><h2>Upload a track</h2></div>
          <button aria-label="Close upload dialog" className="dialog-close" disabled={busy} onClick={close} type="button">×</button>
        </div>
        {stage === "success" ? (
          <div className="upload-success" role="status">
            <h3>Upload queued.</h3>
            <p>Your source is safe. The player and embed code will appear after processing.</p>
            <button className="primary-button" onClick={close} type="button">Done</button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <label htmlFor="track-title">Track title</label>
            <input id="track-title" maxLength={160} name="title" required />
            <label htmlFor="track-audio">Audio master · up to 250 MB</label>
            <input accept="audio/wav,audio/x-wav,audio/aiff,audio/x-aiff,audio/flac,audio/mpeg,audio/mp4,audio/aac,audio/ogg" id="track-audio" name="audio" required type="file" />
            <label htmlFor="track-cover">Cover art · JPEG, PNG, or WebP</label>
            <input accept="image/jpeg,image/png,image/webp" id="track-cover" name="cover" required type="file" />
            {busy && <div className="upload-progress"><span style={{ width: `${progress}%` }} /></div>}
            {error && <p className="form-message" role="alert">{error}</p>}
            <button className="primary-button" disabled={busy} type="submit">{stage === "uploading" ? `Uploading ${progress}%` : stage === "finalizing" ? "Queueing track..." : "Upload and process"}</button>
          </form>
        )}
      </dialog>
    </>
  );
}
