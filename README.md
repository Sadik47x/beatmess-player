# BeatMess - Personalized Music Recommendation Player

BeatMess is a premium React + Node.js music streaming player equipped with a custom-engineered, single-user personalized music recommendation engine, dynamic auto-refill queue, and PWA mobile installation support.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Sadik47x/beatmess-player)

---

## 🚀 One-Click Live Deployment

To deploy this application live for free:
1. Click the **Deploy to Render** button above.
2. Sign in to your Render account (connected to GitHub).
3. Click **Apply** to deploy the blueprint automatically with the correct Node runtime and build configurations.

---

## ✨ Features

* **Infinite Auto-Queue Radio:** Dynamically fetches recommendations in the background when the upcoming buffer drops below 5 tracks.
* **Implicit Feedback Scoring:** Tracks likes, skips, partial listens, completions, and consecutive replays to shape your preference profile.
* **Metadata Tag Cache:** Queries MusicBrainz and Last.fm in a rate-limited background worker queue and caches tags locally to optimize content-similarity.
* **Home Page Song Exclusion:** Prevents the autoplay queue from recycling songs displayed on the Home Page rails.
* **PWA Mobile Support:** Install directly on Android and iOS straight from your mobile browser.
