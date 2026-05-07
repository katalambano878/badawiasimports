# Compress hero video (hero-video.mp4)

The hero uses `public/hero-video.mp4`. To compress it and keep high quality (smaller file, faster load, especially on mobile):

1. **Install ffmpeg** (if not installed):
   - Windows: `winget install ffmpeg` or download from https://ffmpeg.org
   - Mac: `brew install ffmpeg`

2. **Run from project root** (PowerShell or CMD):

```powershell
# Compress: max 1920px width, high quality (CRF 24), overwrites public/hero-video.mp4
ffmpeg -i hero-video.mp4 -vcodec libx264 -crf 24 -preset slow -vf "scale=min(1920\,iw):min(1080\,ih):force_original_aspect_ratio=decrease" -movflags +faststart -an -y public/hero-video.mp4
```

- **-crf 24**: high quality (lower = better, 23–28 is a good range).
- **-preset slow**: better compression, slower encode.
- **-movflags +faststart**: moves metadata to start of file so playback can start before full download.
- **-an**: no audio (hero is muted), saves size.

3. **Optional – create a smaller mobile version** and use it in the hero for small screens (requires code changes to switch `src` by viewport).
