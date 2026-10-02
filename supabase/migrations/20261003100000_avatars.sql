-- ---------------------------------------------------------------------------
-- Photos de profil
--   Bucket public : les photos s'affichent par une adresse impossible à
--   deviner (<user_id>/<uuid>.jpg), sans URL signée. Chacun n'écrit que dans
--   son propre dossier. L'adresse est rangée dans `profiles.avatar_url`, dont
--   la lecture suit déjà la RLS : prof ↔ ses étudiants, admin ↔ tout le monde.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 1048576, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatars_manage_own" on storage.objects;
create policy "avatars_manage_own" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
