# Image and video storage

- **Images** (profile pictures, blog featured images, course thumbnails, hero slides) are stored in **Supabase Storage**. Create these buckets in Supabase Dashboard → Storage (all **public**):
  - `teacher-avatars` – profile pictures (migration 114 adds RLS)
  - `hero-slides` – homepage slider images
  - `public` or `uploads` – blog and course images (migration 117 adds RLS for hero-slides, public, uploads)
- Run migrations so uploads work: see **RUN_MIGRATIONS.md**. After creating the buckets, run `supabase db push` or apply 114 + 117.
- **Videos** (lesson videos) are stored on **Bunny.net Stream**. See **BUNNY_NET_SETUP.md** and **BUNNY_NET_WALKTHROUGH.md** for configuration.
