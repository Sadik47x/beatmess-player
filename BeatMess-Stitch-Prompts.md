# BeatMess — Stitch UI/UX Prompts (Page-by-Page)

Yeh file ready-to-paste prompts hai — har page ka apna alag prompt hai jo directly Stitch me daal sakte ho. Har prompt **self-contained** hai (poora style-DNA usme repeat kiya hai) kyunki Stitch alag-alag generations me pichla context yaad nahi rakhta — isliye copy-paste karte waqt poora block ek saath do.

Order same hai jo blueprint me tha, taaki Antigravity baad me isi sequence me build kar sake:
1. Auth (Login/Register)
2. Home
3. Search
4. Library
5. Playlist Detail
6. Artist Page
7. Full-Screen Player
8. Mini Player + Bottom/Side Nav shell
9. Settings

---

## 🎨 Design DNA (reference — already baked into every prompt below)

Dark glassmorphism music app called **BeatMess**. Near-black base (#0a0a0f), frosted translucent glass panels (white ~6% fill, ~12% border, 20px blur), violet→pink gradient accent (#8b5cf6 → #ec4899), 16–20px rounded corners, soft glow shadows, Inter/Poppins-style modern sans-serif, generous whitespace, subtle micro-animations on hover/tap. Premium, immersive, Spotify-polish but more futuristic/glassy.

---

## 1️⃣ Auth — Login & Register Screen

```
Design a dark-mode Login/Register screen for a music streaming app called "BeatMess" (like Spotify/JioSaavn).

STYLE: Glassmorphism dark theme. Background: near-black (#0a0a0f) with a large soft blurred gradient blob (violet #8b5cf6 to pink #ec4899) glowing behind the card, like ambient stage lighting. The form itself sits in a frosted glass card (translucent white ~6% fill, subtle white border, 20px blur, 20px rounded corners) floating center-screen.

CONTENT:
- BeatMess logo/wordmark at top (bold, gradient-filled text)
- Tagline under logo: "Your music, your rules."
- Tab switcher between "Log In" and "Sign Up" (pill-shaped toggle, active tab filled with gradient)
- Email field, Password field (glass input style — translucent fill, soft border, rounded)
- For Sign Up: add Display Name field above Email
- Primary CTA button: full-width, gradient-filled, rounded pill, label "Log In" / "Create Account"
- "or continue with Google" secondary button below (outlined glass style)
- Small link at bottom: "Don't have an account? Sign up" (swaps tabs)
- Subtle error-state example: red-glow border + small red text under Password field

DESKTOP LAYOUT (1440px wide): Split-screen — left 55% shows a large blurred album-art collage / abstract music waveform art with the gradient glow; right 45% is the centered glass auth card, vertically centered.

MOBILE LAYOUT (390px wide): Single column, full-width. Gradient glow blob at top behind the logo, glass card takes ~90% width, centered, form stacks vertically, CTA button full-width at bottom, comfortable thumb-reach spacing.

Show both the Login state and the Sign Up state as two separate frames.
```

---

## 2️⃣ Home Screen

```
Design the Home screen of a dark-mode music streaming app called "BeatMess" (like Spotify/JioSaavn).

STYLE: Glassmorphism dark theme. Background near-black (#0a0a0f). Content sits in a scrollable feed of horizontal-scroll rails, each song/album shown as a glass card (frosted, 16px rounded corners, subtle border) with album art, gradient hover glow on interaction.

CONTENT SECTIONS (top to bottom):
- Top bar: greeting text "Good evening" (time-aware), small user avatar (circular, top-right)
- Search bar teaser (tappable, not the full search page) — glass pill with a search icon and placeholder "Search songs, artists, albums"
- "Trending Now" — horizontal-scroll rail of ~6 song cards (square album art, title, artist below, small play-button overlay that appears on hover)
- "Recommended For You" — similar horizontal rail, slightly different accent
- "Recently Played" — horizontal rail pulling from history, smaller compact cards
- "Made For You" playlist rail — rounded rectangular cards with playlist name overlaid on blurred album-art background, gradient scrim at bottom for text legibility

Each song card on hover/tap: subtle scale-up (1.03x), soft gradient glow shadow appears, play button fades in centered on the art.

Persistent element visible in this mockup: a floating Mini Player Bar pinned to the bottom (glass panel, small album art thumbnail, song title/artist, play/pause + skip icons, slim gradient progress line at the very top edge of the bar).

DESKTOP LAYOUT (1440px): Left sidebar nav (persistent, ~240px wide, glass panel, icons: Home/Search/Library/Settings + BeatMess logo top, user profile bottom) + main content area with generous padding, rails show 5-6 cards per row before scroll, larger album art (180x180).

MOBILE LAYOUT (390px): No sidebar — bottom tab bar instead (Home/Search/Library/Settings, glass pill nav, active tab highlighted with gradient icon+label). Rails show cards at ~140x140, horizontal swipe-scroll, mini player bar sits directly above the bottom nav bar.

Show both desktop and mobile frames.
```

---

## 3️⃣ Search Screen

```
Design the Search screen of a dark-mode music streaming app called "BeatMess".

STYLE: Same glassmorphism dark theme (#0a0a0f background, frosted glass cards, violet-pink gradient accents).

CONTENT — Empty/pre-search state:
- Large glass search bar pinned near top, auto-focused, placeholder "Search songs, artists, albums..."
- Below: a grid of colorful "Browse Categories" tiles (e.g. Bollywood, Pop, Lo-fi, Workout, Hindi Hits, Punjabi) — each tile a rounded glass card with a subtle gradient tint unique per category and a small decorative icon
- "Recent Searches" chip list below the search bar (small pill chips with an X to remove each)

CONTENT — Active search / results state:
- Search bar now shows typed query + live-updating results below (debounced instant search)
- Results grouped into tabbed sections: "Songs", "Albums", "Artists", "Playlists" (horizontal pill tab bar just under the search bar, active tab gradient-filled)
- Songs results shown as a vertical list: small square album art (56x56) + title + artist on the left, duration + a "..." context-menu icon on the right, subtle divider or glass-row separation between items, whole row highlights on hover with a soft glass fill
- Include a loading-skeleton state example (shimmering gray glass blocks in place of results) and an empty-state example ("No results found" with a subtle illustration and a note: "Try checking another source" — hinting at the fallback engine)

DESKTOP LAYOUT (1440px): Persistent left sidebar nav, search bar wide and centered in content area, results in a 2-column layout (list on left ~60%, a details/preview panel on right ~40% showing selected song's larger art + quick-play).

MOBILE LAYOUT (390px): Full-width search bar right below a slim top bar, bottom tab nav, results list full-width single column, category grid as 2 columns.

Show three frames: empty state, active results state, mobile results state.
```

---

## 4️⃣ Library Screen

```
Design the Library screen of a dark-mode music streaming app called "BeatMess".

STYLE: Glassmorphism dark theme, consistent with the rest of the app (#0a0a0f background, frosted cards, violet-pink gradient accents).

CONTENT:
- Top: "Your Library" heading, with a "+ New Playlist" button (small gradient pill button) on the right
- Tab switcher below heading: "Liked Songs" / "Playlists" / "History" (pill tabs, active one gradient-filled)

TAB 1 — Liked Songs: Vertical list of songs (same row style as search results — small art, title/artist, duration, heart icon filled/glowing pink to indicate liked, context menu). A "Play All" gradient button + shuffle icon pinned above the list.

TAB 2 — Playlists: Grid of playlist cards (2-3 per row on desktop, 2 on mobile) — each card a square cover (either a real album-art collage or a solid gradient placeholder if empty) with playlist name below, song count in muted text. Include one "empty playlist" placeholder card with a dashed-border glass style and a + icon, inviting creation.

TAB 3 — History: Vertical list grouped by day ("Today", "Yesterday", "Earlier this week" as small muted section labels), same row style as Liked Songs but without the heart icon, showing a small clock icon + relative time on the right instead of duration.

Include an empty-state illustration example for a brand-new user with zero liked songs — soft glass card, muted icon, text "Songs you like will show up here" + a CTA button "Find something to play" linking back to Search.

DESKTOP LAYOUT (1440px): Persistent left sidebar nav, content area with generous padding, playlist grid 3-4 columns, list rows comfortably wide with more metadata visible (e.g. date added column).

MOBILE LAYOUT (390px): Bottom tab nav, playlist grid 2 columns, list rows compact, swipeable tabs (swipe left/right between Liked/Playlists/History instead of just tapping).

Show both desktop and mobile frames, Liked Songs tab as the primary shown state.
```

---

## 5️⃣ Playlist Detail Screen

```
Design a Playlist Detail screen for a dark-mode music streaming app called "BeatMess".

STYLE: Glassmorphism dark theme (#0a0a0f background, frosted glass, violet-pink gradient accents).

CONTENT:
- Hero header: large blurred/gradient-tinted backdrop derived from the playlist's cover art, fading down into the solid dark background — sits behind a square playlist cover art (200x200 on desktop), playlist title (large bold), owner name, song count + total duration below
- Big gradient-filled circular "Play" button overlapping the bottom edge of the header, plus a shuffle icon button and a "..." menu (rename/delete playlist) beside it
- Below header: vertical song list — each row: track number (or small art thumbnail), title/artist, album name (desktop only), duration, heart icon, context menu — rows highlight with soft glass fill on hover, currently-playing row shows a subtle gradient left-border + animated equalizer bars icon instead of track number

DESKTOP LAYOUT (1440px): Persistent left sidebar nav, wide hero header with backdrop art extending full content width, song list as a table with column headers (#, Title, Album, Date Added, Duration).

MOBILE LAYOUT (390px): Hero header stacks centered (smaller 140x140 art), Play button full-width gradient pill below the metadata instead of overlapping, song list simplified (no album/date-added columns, just art+title/artist+duration), bottom tab nav + mini player bar visible at bottom.

Show both desktop and mobile frames.
```

---

## 6️⃣ Artist Page

```
Design an Artist profile screen for a dark-mode music streaming app called "BeatMess".

STYLE: Glassmorphism dark theme (#0a0a0f background, frosted glass cards, violet-pink gradient accents).

CONTENT:
- Full-bleed hero banner: large artist photo with a dark gradient scrim overlaid (fading to the app's near-black background at the bottom), artist name in large bold text over the image, small "Verified Artist" badge icon, monthly-listeners style stat text
- Gradient "Play" circular button + "Follow" outlined glass button row just below the hero
- "Popular" section: vertical list of the artist's top 5 songs (numbered 1-5, small art, title, play count, duration, heart icon)
- "Albums" horizontal-scroll rail: square album cards with title + year below
- "Fans Also Like" horizontal-scroll rail: circular artist photo cards with name below (similar-artist recommendations)
- "About" section near the bottom: short bio text in a glass card, muted secondary text color

DESKTOP LAYOUT (1440px): Persistent left sidebar nav, hero banner tall (~360px) and wide, content sections comfortably padded, rails show 5-6 cards per row.

MOBILE LAYOUT (390px): Hero banner shorter (~220px), bottom tab nav, sections stack full-width, rails horizontal-scroll with ~2.5 cards visible per screen width (peeking next card to hint scrollability).

Show both desktop and mobile frames.
```

---

## 7️⃣ Full-Screen "Now Playing" Player

```
Design a Full-Screen "Now Playing" player screen for a dark-mode music streaming app called "BeatMess".

STYLE: Glassmorphism dark theme. This screen should feel the most immersive/premium in the whole app — full-bleed ambient background is a heavily blurred, darkened version of the current song's album art (creating a soft glowing color wash behind everything), with the sharp album art itself floating as a large centered glass-framed square (like a vinyl-adjacent card, soft shadow, subtle border glow matching the dominant art color).

CONTENT (top to bottom):
- Top bar: down-chevron/collapse icon (left, returns to mini player), small "..." menu (right, options like Add to Playlist / Go to Artist)
- Large centered album art (280x280 desktop / 260x260 mobile), rounded 20px corners, soft ambient glow shadow
- Song title (large bold) + artist name (muted, smaller) below the art, centered
- Heart/like icon button beside the title
- Seek bar: full-width slim gradient-filled progress track with a small circular draggable thumb, elapsed time (left) and total duration (right) in small muted text below it
- Playback controls row, centered, evenly spaced: shuffle icon | skip-back icon | large central gradient-filled circular play/pause button (biggest element) | skip-forward icon | repeat icon (with a small "1" badge variant for repeat-one mode)
- Volume slider row below controls (desktop only — icon + horizontal slider)
- A toggleable "Lyrics" tab/button that swaps the album-art view for a scrolling synced-lyrics panel: current line large/bold/gradient-highlighted, past lines faded muted gray above, upcoming lines dimmer below, smooth auto-scroll

DESKTOP LAYOUT (1440px): Two-column — left ~55% shows the big art/lyrics-toggle area, right ~45% shows an "Up Next" queue list (small rows: art thumbnail, title/artist, drag-handle icon) in a glass panel.

MOBILE LAYOUT (390px, full screen): Single column exactly as described above, edge-to-edge, safe-area padding top/bottom for notch/gesture-bar, swipe-down gesture to collapse back to mini player (show a small drag-handle indicator at the very top).

Show three frames: desktop now-playing, mobile now-playing (album art view), mobile now-playing (lyrics view).
```

---

## 8️⃣ App Shell — Navigation + Mini Player (Desktop Sidebar / Mobile Bottom Nav)

```
Design the persistent app shell/navigation chrome for a dark-mode music streaming app called "BeatMess" — this is the frame that wraps every other screen.

STYLE: Glassmorphism dark theme (#0a0a0f background, frosted glass panels, violet-pink gradient accents on active states).

DESKTOP (1440px):
- Left sidebar, ~240px wide, full-height glass panel with a subtle right border
- Top: BeatMess logo/wordmark (gradient text)
- Nav items stacked vertically with icon + label: Home, Search, Your Library, Settings — active item shows a gradient-filled rounded background behind icon+label, inactive items are muted gray icons
- Below nav: a "Liked Songs" quick-access shortcut item, then a divider, then a scrollable mini-list of the user's playlists (small text rows)
- Bottom of sidebar: user avatar (circular) + display name, tappable to a small profile menu
- Main content area to the right fills remaining width
- Mini Player Bar: fixed along the very bottom, full width (spanning past the sidebar), glass panel with a top border, three zones — left: small album art thumb + title/artist (marquee-scroll if long) + heart icon; center: playback controls (skip-back, play/pause, skip-forward) + a slim seek bar directly beneath them; right: volume slider + a "expand to full screen" icon

MOBILE (390px):
- No sidebar. Bottom tab bar instead: glass pill-shaped floating bar (not edge-to-edge — has margin left/right and rounded corners, floating slightly above the very bottom edge), 4 icons evenly spaced: Home, Search, Library, Settings, active icon shown with gradient fill + small label, inactive icons muted outline-only
- Mini Player Bar sits directly above this floating tab bar, also a floating glass pill, full width minus margins, rounded corners matching the tab bar — shows small album art thumb, title/artist (truncated), play/pause icon, and a very thin gradient progress line along its very top edge
- Tapping the Mini Player Bar (anywhere except the play/pause icon) transitions to the Full-Screen Player

Show both the desktop shell and the mobile shell as separate frames, each with a generic content area behind them (doesn't need to be a specific page, just show the chrome clearly).
```

---

## 9️⃣ Settings Screen

```
Design the Settings screen of a dark-mode music streaming app called "BeatMess".

STYLE: Glassmorphism dark theme (#0a0a0f background, frosted glass cards, violet-pink gradient accents).

CONTENT — organized into grouped glass-card sections, each with a small section label above it:

"Account" section: user avatar + display name + email (read-only row), "Edit Profile" chevron row, "Log Out" row (text in a subtle red/warning tone)

"Playback" section:
- "Stream Quality" row with a segmented control (Data Saver / Medium / High) — pill toggle, active segment gradient-filled
- "Enable Fallback Source" row with a toggle switch (glass track, gradient-filled circular thumb when ON) — small helper text below: "Uses an alternate source when a song isn't found"

"Storage" section:
- "Force Refresh & Clear Cache" row — icon (refresh/broom) + label + a small chevron or standalone gradient-outlined button on the right, subtle description text below: "Clears cached search results and temporary data"
- Include a confirming toast/snackbar example at the bottom of the frame: small glass pill notification reading "Cache cleared ✓" with a checkmark icon, gradient accent border

"About" section: App version number row, small links (Privacy, Terms) in muted text

DESKTOP LAYOUT (1440px): Persistent left sidebar nav, settings content centered in a max-width column (~640px) with comfortable vertical spacing between grouped cards, not full content-area width.

MOBILE LAYOUT (390px): Bottom tab nav, settings sections stack full-width edge-to-edge (minus standard screen padding), grouped cards slightly less padded than desktop to save space.

Show both desktop and mobile frames, and separately show the "Cache cleared" toast/confirmation state.
```

---

## 📌 Usage tips
- Stitch generate karte time ek prompt = ek session rakhna better hai, taaki styles cross-contaminate na ho.
- Agar Stitch Figma export deta hai to sabse pehle **Design DNA** wale color/spacing tokens ko Figma variables bana lena — phir Tailwind config (blueprint ka Section 9) me wahi values daal dena, taaki design aur code exactly match kare.
- Jo bhi screen Stitch se aaye, usse ek reference image ke roop me rakh lena — Antigravity ko component build karte waqt screenshot dikha ke "isko match karo" bolna zyada accurate rahega sirf text-description dene se.
