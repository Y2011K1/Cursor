# Hero slides image upload

Hero slide images are uploaded to **Supabase Storage** (no link required).

## One-time setup: create the bucket

1. Open **Supabase Dashboard** → **Storage**.
2. Click **New bucket**.
3. Name: `hero-slides`.
4. Enable **Public bucket** (so the landing page can show images).
5. Create the bucket.
6. In **Policies** for `hero-slides`, add:
   - **Upload**: Allow authenticated users with role `admin` (or use "Allow all authenticated" if only admins can access the admin dashboard).
   - Or use: "Allow authenticated users to upload" and rely on your app only showing the upload UI to admins.

If the bucket is missing, the upload API returns an error asking you to create it.

## Usage

- In **Admin** → **Landing Page** → **Hero Slides** tab, use **Upload or drop** to add an image for each slide.
- Supported: JPEG, PNG, WebP, GIF, max 5MB.
