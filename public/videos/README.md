# Demo camera feeds

No local video files are used anymore. Every mock camera streams through an
external cinema8.com embed, configured in `src/lib/mock/demoFeeds.ts`
(`DEMO_EXTERNAL_PLAYERS`), and rendered the same way everywhere a camera
feed shows up — camera grid, camera detail, media wall, alert panels, map
popups.

**Known limitation**: cinema8.com sends a `Content-Security-Policy:
frame-ancestors` header restricted to its own domains. Browsers enforce
this — an iframe embedding a cinema8.com link on any other origin (this
app, wherever it's deployed) will render blank/blocked. The link only
plays when opened directly in its own browser tab.
