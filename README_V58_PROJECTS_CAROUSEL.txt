FLEVO Website v5.8 — Horizontal Projects Spotlight Carousel
============================================================

Implemented inside the existing v5.7.2 website:
- Replaced the fixed homepage project grid with an animated horizontal spotlight carousel.
- Center project is larger; adjacent projects remain partially visible.
- Previous/next arrows, pagination indicator, autoplay, hover pause, keyboard navigation.
- Touch swipe support on mobile.
- Filters: All, Exhibition Booths, Events, Fabrication, Special Projects.
- Projects load from the existing Supabase projects table with JSON fallback.
- Arabic/English titles, categories, locations and labels are supported.
- Clicking the active card opens the existing project detail page.
- Existing admin, authentication, mobile navigation, quotation and profile functionality preserved.

No SQL migration is required.
Deploy the folder/ZIP to the existing Netlify project using Deploys > drag and drop.
