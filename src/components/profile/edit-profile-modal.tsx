"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { ProfileForm } from "@/components/profile/profile-form";

type Profile = { id: string; username: string | null; display_name: string | null; bio: string | null; avatar_url: string | null; banner_url: string | null };

export function EditProfileModal({ profile }: { profile: Profile }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  function saved() {
    router.refresh();
    dialog.current?.close();
  }

  return (
    <>
      <button className="profile-edit-button" onClick={() => dialog.current?.showModal()} type="button">Edit profile</button>
      <dialog className="profile-dialog" ref={dialog}>
        <div className="dialog-heading">
          <div><p className="eyebrow">Public identity</p><h2>Edit profile</h2></div>
          <button aria-label="Close profile editor" className="dialog-close" onClick={() => dialog.current?.close()} type="button">×</button>
        </div>
        <ProfileForm onSaved={saved} profile={profile} />
      </dialog>
    </>
  );
}
