# Bunny.net Video Streaming Setup Guide

This guide will help you set up Bunny.net video streaming for the educational platform.

## Prerequisites

1. A Bunny.net account (sign up at https://bunny.net)
2. A Bunny Stream library created

## Step 1: Create a Video Library

1. Log in to your Bunny.net dashboard
2. Navigate to **Stream** → **Video Libraries**
3. Click **Add Video Library**
4. Configure your library:
   - **Name**: Educational Platform Videos (or your preferred name)
   - **Storage Region**: Choose the closest region to your users
   - **Replication Regions**: Optional, for better global performance
5. Click **Add Library**

## Step 2: Get Your API Credentials

1. In your video library, go to **Settings** → **API**
2. Copy the following:
   - **Library ID**: Found in the library URL or settings
   - **Stream API Key**: Your authentication key for API calls
   - **CDN URL**: Usually `https://vz-{libraryId}.b-cdn.net`

## Step 3: Configure Environment Variables

Add these to your `.env.local` file:

```env
# Bunny.net Video Streaming Configuration
BUNNY_STREAM_LIBRARY_ID=your_library_id_here
BUNNY_STREAM_API_KEY=your_stream_api_key_here
NEXT_PUBLIC_BUNNY_CDN_URL=https://vz-{libraryId}.b-cdn.net
```

**Important**: 
- `BUNNY_STREAM_LIBRARY_ID` and `BUNNY_STREAM_API_KEY` are server-side only
- `NEXT_PUBLIC_BUNNY_CDN_URL` is public and used for video playback

## Step 4: Test the Integration

1. Start your development server: `npm run dev`
2. Log in as a teacher
3. Create a course
4. Add a lesson and try uploading a video
5. The video should upload and be playable in the lesson view

## Video Upload Process

When a teacher uploads a video:

1. **Create Video Object**: A video object is created in your Bunny Stream library
2. **Upload Video File**: The video file is uploaded to Bunny.net
3. **Get Video URL**: The platform receives the CDN URL for the video
4. **Store in Database**: The video URL is saved with the lesson

## Supported Video Formats

Bunny.net supports most video formats:
- MP4 (recommended)
- WebM
- MOV
- AVI
- And more

## File Size Limits

- Maximum file size: 500MB (configurable in code)
- For larger files, consider compressing videos or using Bunny.net's pull zone feature

## Video Quality

Bunny Stream automatically creates multiple quality versions:
- 480p (default playback)
- 720p
- 1080p
- 4K (if source supports)

The platform uses 480p by default, but you can modify the URL to use other qualities.

## Troubleshooting

### "Bunny.net Stream API credentials not configured"
- Make sure all environment variables are set in `.env.local`
- Restart your development server after adding environment variables

### "Failed to create video"
- Verify your Stream API Key is correct
- Check that your Library ID matches your video library
- Ensure your Bunny.net account has sufficient credits

### "Failed to upload video"
- Check file size (must be under 500MB)
- Verify file format is supported
- Check network connection
- Review Bunny.net dashboard for upload errors

### Videos not playing
- **Enable MP4 Fallback**: In Bunny dashboard → **Stream** → your library → **Encoding** → turn on **MP4 Fallback**. Without this, `play_480p.mp4` URLs will not work.
- Verify the CDN URL is correct and the video has finished processing in Bunny.net
- Ensure the video URL format is correct (`https://vz-<LIBRARY_ID>.b-cdn.net/<VIDEO_ID>/play_480p.mp4`)

## Video: Upload only

Teachers add video by uploading a file when creating a lesson. There is no URL paste option; videos are uploaded directly to Bunny.net from the Add Lesson dialog.

## Next Steps

After setting up Bunny.net:
1. Test video uploads with small test files
2. Monitor your Bunny.net usage and billing
3. Configure video quality settings if needed
4. Set up video analytics if desired

## Resources

- [Bunny.net Documentation](https://docs.bunny.net)
- [Bunny Stream API Reference](https://docs.bunny.net/reference/stream-api-overview)
- [Bunny.net Pricing](https://bunny.net/pricing)
