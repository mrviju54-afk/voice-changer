# Voice Changer Studio

A browser-based MP3/MP4 voice-effect project designed for GitHub Pages and embedding in Blogger.

## Features
- MP3 and MP4 file selection
- Voice effect selector
- Automatic 20-second audio preview
- Download converted MP3 or MP4
- FFmpeg processing in the browser; no API key is required

## Publish using GitHub (mobile-friendly workflow)
1. Create a new GitHub repository. Choose a simple name such as `voice-changer`.
2. Upload all files and folders from this ZIP to the repository root. Make sure `.github/workflows/pages.yml` is included.
3. Open **Settings → Pages** and set the source to **GitHub Actions** if prompted.
4. Open **Actions** and wait for **Deploy Voice Changer to GitHub Pages** to finish successfully.
5. Your site address will look like `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/`.

## Embed in Blogger
1. Open `blogger-embed.html`.
2. Replace `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/` with your actual published site address.
3. In Blogger, open the page/post editor in HTML view and paste the embed snippet.

## Important notes
- This project has not been verified on your GitHub account or on your specific Android/PC device. Test it after deployment.
- Browser-based FFmpeg can use substantial RAM and CPU. Large files may fail or run slowly, especially on phones.
- MP4 output copies the video stream and re-encodes audio. Some unusual input codecs or damaged files may not work.
- The browser controls the download experience and destination.
- Effects such as pitch shifting alter the sound; they do not create a genuine new speaker identity.
- GitHub Pages is static hosting, not a private server. Review GitHub's current terms before using it as a commercial hosted service.
