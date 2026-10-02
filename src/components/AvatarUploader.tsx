"use client";

import { useRef, useState, useTransition } from "react";

import { removeAvatar, uploadAvatar } from "@/app/actions/profile";
import { Avatar } from "@/components/ui";

/** Côté du carré envoyé : net sur écran Retina jusqu'à ~130 px affichés. */
const SIZE = 400;

/** Recadre l'image au centre en carré, la réduit et la compresse en JPEG. */
async function toSquareJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas");
  context.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    SIZE,
    SIZE,
  );
  bitmap.close();

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("blob"))),
      "image/jpeg",
      0.85,
    ),
  );
}

/**
 * Photo de profil modifiable : un clic sur la photo ouvre le sélecteur
 * (ou l'appareil photo sur mobile), l'aperçu s'affiche pendant l'envoi.
 */
export function AvatarUploader({
  src,
  label,
  size = 72,
}: {
  src: string | null;
  label: string;
  size?: number;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const current = preview ?? src;

  const onPick = async (file: File | undefined) => {
    if (!file) return;
    setError(null);

    let blob: Blob;
    try {
      blob = await toSquareJpeg(file);
    } catch {
      setError("Impossible de lire cette image. Essaie avec une photo JPEG ou PNG.");
      return;
    }

    const url = URL.createObjectURL(blob);
    setPreview(url);

    const formData = new FormData();
    formData.append("avatar", new File([blob], "avatar.jpg", { type: "image/jpeg" }));

    startTransition(async () => {
      const result = await uploadAvatar(formData);
      if (result.error) setError(result.error);
      // La réponse de l'action apporte la page à jour : la photo enregistrée
      // remplace l'aperçu local.
      setPreview(null);
      URL.revokeObjectURL(url);
    });
  };

  const onRemove = () => {
    setError(null);
    startTransition(async () => {
      const result = await removeAvatar();
      if (result.error) setError(result.error);
      setPreview(null);
    });
  };

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={pending}
        aria-label={current ? "Changer ma photo de profil" : "Ajouter une photo de profil"}
        className="group relative flex-none rounded-full disabled:opacity-70"
      >
        <Avatar label={label} src={current} size={size} />
        <span
          aria-hidden
          className="absolute -bottom-0.5 -right-0.5 flex size-7 items-center justify-center rounded-full border-2 border-white bg-brand-800 text-white transition group-hover:bg-brand-900"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="size-3.5">
            <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.5-2h6l1.5 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5zM12 15.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
          </svg>
        </span>
      </button>

      <div className="flex min-w-0 flex-col items-start gap-1">
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={pending}
          className="text-sm font-bold text-brand-800 disabled:opacity-60"
        >
          {pending ? "Enregistrement…" : current ? "Changer la photo" : "Ajouter une photo"}
        </button>
        {current && !pending ? (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs font-semibold text-muted hover:text-ink"
          >
            Supprimer
          </button>
        ) : null}
        {error ? (
          <p role="alert" className="text-xs text-red-700">
            {error}
          </p>
        ) : null}
      </div>

      <input
        ref={input}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => {
          onPick(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
    </div>
  );
}
