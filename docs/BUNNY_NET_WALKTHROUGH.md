# Bunny.net Integration Walkthrough

This guide walks you through integrating **Bunny.net** so your educational platform can store and stream videos from Bunny Stream.

---

## What You’ll Get

- **Upload**: Teachers upload videos when creating/editing lessons.
- **Stream**: Students watch lessons via Bunny’s CDN (reliable, fast playback).
- **Storage**: Videos live in a Bunny Stream library; your app only stores the video URL.

Your app already has the code; you only need a Bunny account and API keys.

---

## Step 1: Create a Bunny.net Account

1. Go to **https://bunny.net**
2. Click **Sign Up** (or **Start Free**).
3. Create your account (email + password).
4. Confirm your email if required.

Bunny has a free tier; check **https://bunny.net/pricing** for Stream pricing.

---

## Step 2: Create a Video Library (Stream)

1. Log in to the **Bunny.net Dashboard**.
2. In the left sidebar, open **Stream** → **Video Libraries**.
3. Click **Add Video Library**.
4. Fill in:
   - **Name**: e.g. `Educational Platform` or your app name.
   - **Storage Region**: Pick the region closest to your users (e.g. New York, London, Singapore).
   - **Replication Regions**: Optional; add more regions if you want better global performance.
5. Click **Add Library**.

You’ll be taken to the new library’s page. Note the **Library ID** in the URL or in the library settings (e.g. `12345678`).

---

## Step 3: Get Your API Credentials

1. In the left sidebar, go to **Stream** → **Video Libraries** and open your library.
2. Open the **API** tab (or **Settings** → **API**).
3. Copy and save:
   - **Library ID** (numeric, e.g. `12345678`)
   - **Password** or **API Key** (this is your **Stream API Key**; label it so you don’t confuse it with other Bunny keys)

If you don’t see an API key, look for **“API Key”**, **“Stream API Key”**, or **“Password”** in the library or account API section.

Your CDN URL for playback will be:

```text
https://vz-<LIBRARY_ID>.b-cdn.net
```

Example: if Library ID is `12345678`, then:

```text
https://vz-12345678.b-cdn.net
```

---

## Step 4: Add Environment Variables

1. In your project root, open **`.env.local`** (create it if it doesn’t exist, and don’t commit it to git).
2. Add:

```env
# Bunny.net Video Streaming
BUNNY_STREAM_LIBRARY_ID=12345678
BUNNY_STREAM_API_KEY=your_stream_api_key_here
NEXT_PUBLIC_BUNNY_CDN_URL=https://vz-12345678.b-cdn.net
```

Replace:

- `12345678` with your **Library ID**
- `your_stream_api_key_here` with your **Stream API Key**
- Use your real Library ID in `NEXT_PUBLIC_BUNNY_CDN_URL` (e.g. `https://vz-12345678.b-cdn.net`)

Notes:

- `BUNNY_STREAM_LIBRARY_ID` and `BUNNY_STREAM_API_KEY` are **server-only** (used for creating/uploading videos).
- `NEXT_PUBLIC_BUNNY_CDN_URL` is **public** (used for building playback URLs in the browser).

3. Save the file and **restart your dev server** (`npm run dev`) so the new env vars are loaded.

---

## Step 5: How It Works in Your App

### Upload flow (teacher)

1. Teacher goes to a classroom → **Lessons** → **Add Lesson**.
2. In the lesson form they can:
   - **Upload a video**: file is sent to your app → your app creates a video in Bunny Stream → uploads the file to Bunny → saves the returned CDN URL in the lesson. Video is upload-only (no URL paste).
3. The app uses `lib/bunny.ts` and `app/api/upload/video` for create + upload; the lesson’s `video_url` and `video_provider` are stored in your database.

### Playback (student)

1. Student opens a lesson that has a video.
2. The **VideoPlayer** component uses `video_url` and `video_provider`.
3. For Bunny, the URL is typically like:  
   `https://vz-<LIBRARY_ID>.b-cdn.net/<VIDEO_ID>/play_480p.mp4`  
   (Other qualities like 720p/1080p exist; the app can be extended to choose quality later.)

So: **you only need to complete Steps 1–4**; the rest is already implemented.

---

## Step 6: Test the Integration

1. **Restart dev server** (so env vars are loaded):
   ```bash
   npm run dev
   ```
2. Log in as a **teacher**.
3. Open a classroom → **Lessons** → **Add Lesson**.
4. Enter a title, then:
   - **Upload a short video** (e.g. a few MB). Video is upload-only (no URL).  
“Use URL”5. Save the lesson.
6. Open that lesson as a **student** (or in an incognito window as another user) and confirm the video loads and plays.

If upload fails, check the browser console and server logs; the next section will help.

---

## Troubleshooting

| Issue | What to check |
|--------|----------------|
| **“Bunny.net Stream API credentials not configured”** | `BUNNY_STREAM_LIBRARY_ID` and `BUNNY_STREAM_API_KEY` must be set in `.env.local`. Restart the dev server after changing. |
| **“Failed to create video”** | API key correct? Library ID matches the library? Account in good standing / not over limit? |
| **“Failed to upload video”** | File type (e.g. MP4), size (e.g. &lt; 500MB in your app), and network. Check Bunny dashboard for the library and any errors. |
| **Video doesn’t play** | Confirm the stored URL looks like `https://vz-<LIBRARY_ID>.b-cdn.net/...`. In Bunny dashboard, check that the video is **processed** (not stuck in “Processing”). |
| **CORS or 403 on playback** | Bunny Stream URLs are usually public; if you restricted access in Bunny, you may need to allow your domain or use signed URLs (advanced). |

---

## Webhook URL (for Bunny.net)

To receive encoding/status notifications from Bunny Stream, configure a webhook in your library:

1. In Bunny: **Stream** → **Video Libraries** → your library → **Webhooks** (or **API** / **Settings**).
2. Set the webhook URL to your **public** app URL plus the path below (Bunny cannot reach `localhost`).

**Webhook URL:**

```text
https://YOUR_APP_DOMAIN/api/webhooks/bunny
```

Examples:

- Production: `https://myapp.vercel.app/api/webhooks/bunny`
- Local (for testing only, Bunny cannot call it): `http://localhost:3000/api/webhooks/bunny`

Replace `YOUR_APP_DOMAIN` with your deployed domain (e.g. from Vercel/Netlify). The endpoint accepts POST with `VideoLibraryId`, `VideoGuid`, and `Status`, and responds with `{ "received": true }`.

---

## Optional: Verify in Bunny Dashboard

- **Stream** → **Video Libraries** → your library → **Videos**  
  You should see a new video after each successful upload.
- **Analytics** (if enabled) can show views and bandwidth.

---

## Summary Checklist

- [ ] Bunny.net account created
- [ ] Stream **Video Library** created; **Library ID** noted
- [ ] **Stream API Key** copied from library API settings
- [ ] `.env.local` updated with `BUNNY_STREAM_LIBRARY_ID`, `BUNNY_STREAM_API_KEY`, `NEXT_PUBLIC_BUNNY_CDN_URL`
- [ ] Dev server restarted
- [ ] Test: add a lesson with an uploaded video (or Bunny URL) and play it as a student

For more detail on the same setup, see **BUNNY_NET_SETUP.md**. For API details, see [Bunny Stream API](https://docs.bunny.net/reference/stream-api-overview).
