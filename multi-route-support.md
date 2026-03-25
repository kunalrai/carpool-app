Phase 0 — Dependencies & API Keys

  Install:
  npm install @googlemaps/js-api-loader

  Add to .env.local:
  VITE_GOOGLE_MAPS_API_KEY=AIza...
  Enable Places API (New) in Google Cloud Console. Restrict the key to your domain in production.

  Convex env vars (set in Convex dashboard):
  - DAILY_API_KEY — already needed for calls
  - No new Convex backend env vars needed for Maps (the key lives on the frontend only)

  ---
  Phase 1 — Schema Changes (convex/schema.ts)

  Remove direction enum. Add these fields to listings:

  fromLabel:    v.string()           // "Gaur City 1, Greater Noida"
  toLabel:      v.string()           // "HCL Campus, Sector 136, Noida"
  fromLat:      v.number()
  fromLng:      v.number()
  toLat:        v.number()
  toLng:        v.number()
  fromPlaceId:  v.optional(v.string()) // Google place_id
  toPlaceId:    v.optional(v.string())
  fare:         v.number()           // now user-set (was hardcoded 80)

  Index change: Drop by_direction_status. Add:
  .index("by_status_departure", ["status", "departureTime"])

  Data migration: Write a one-time internalMutation that patches existing GC↔HCL listings with hardcoded coordinates
  (GC: 28.6123, 77.4312 / HCL: 28.5245, 77.3799), then run it from the Convex dashboard.

  ---
  Phase 2 — Backend: Matching Algorithm (convex/listings.ts)

  postListing mutation — replace direction arg with the 8 new geo fields + user-set fare. Validate: fare between
  ₹1–₹2000, all coordinates within India's bounding box.

  getActiveListings query — new signature:
  { fromLat?, fromLng?, toLat?, toLng?, radiusKm? = 3.0 }

  Algorithm:
  1. Fetch all open/full listings via by_status_departure index
  2. Filter expired ones (existing logic)
  3. If search coords provided → Haversine filter: keep only listings where the driver's fromLat/Lng is within radiusKm
  of the searcher's fromLat/Lng, AND the driver's toLat/Lng is within radiusKm of the searcher's toLat/Lng
  4. Sort by matchScore = fromDistKm + toDistKm (best match first)
  5. If no search coords → return all active listings sorted by departure time (preserves browse-all behavior)

  The Haversine formula is ~15 lines of TypeScript, no external library needed. 3 km radius is a good default — it
  comfortably covers all of Gaur City's sub-sectors and nearby areas.

  ▎ Why geo over text matching? Text matching (fuzzy/trigrams) would require either Convex full-text search (not
  available) or embedding APIs. Geo distance is objective, fast, and requires no extra infrastructure.

  ---
  Phase 3 — usePlacesAutocomplete Hook (src/hooks/usePlacesAutocomplete.ts)

  Loads the Maps JS API once (only the places library). Exposes:
  - getPredictions(input) — debounced 300ms, returns up to 5 place predictions
  - getPlaceDetails(placeId) — returns { lat, lng, formattedAddress }

  Important details:
  - Use session tokens (AutocompleteSessionToken) to group autocomplete + details calls into one billable event
  - Bias predictions to NCR bounds (sw: 28.3,76.8 / ne: 28.9,77.8) so "Sector 136" returns Noida, not random results
  - Cache getPlaceDetails results in a module-level Map<placeId, result> to avoid duplicate API calls

  ---
  Phase 4 — LocationInput Component (src/components/LocationInput.tsx)

  Reusable component used in both PostRideScreen and HomeScreen. Shows a text input that triggers predictions on
  keystroke, renders a floating dropdown of up to 5 predictions, resolves to a PlaceResult = { label, lat, lng, placeId
  } on selection.

  UX details:
  - Clear (×) button when a value is set
  - 44px minimum tap target on prediction items
  - "Powered by Google" attribution image at dropdown bottom (required by ToS)
  - Resets to empty if user blurs without selecting (prevents partial text being stored)

  ---
  Phase 5 — PostRideScreen Changes

  Replace the 2-button direction picker with:

  [From LocationInput] ← "Gaur City 1..."
  [To LocationInput]   ← "HCL Campus..."
  [Departure Time]     ← unchanged
  [Seats]              ← unchanged
  [Price per seat ₹]   ← NEW, default 80, range 1–2000
  [Pickup Point]       ← unchanged (specific meeting spot, not the general area)
  [Note]               ← unchanged

  ---
  Phase 6 — HomeScreen Changes

  Replace the direction tab strip with a route search card:
  [From LocationInput]  [To LocationInput]  [Search]
                                            [Clear]

  - On "Search" tap → sets activeSearch state with the 4 coordinates, passed to getActiveListings
  - On "Clear" → resets to null → query returns all active listings
  - Feed cards now show {fromLabel} → {toLabel} and ₹{fare}/seat instead of the direction enum string

  DriverBanner/RiderBanner: replace direction string with {fromLabel} → {toLabel} in two-line layout (long addresses
  won't fit on one line).

  ---
  Phase 7 — ListingDetailScreen & MyListingScreen

  Replace the single "Direction" detail row with three rows:
  From:  Gaur City 1, Greater Noida
  To:    HCL Campus, Sector 136, Noida
  Fare:  ₹120 per seat

  TypeScript will flag all .direction references at compile time, so nothing gets missed.

  ---
  Phase 8 — PWA / Build Config

  In vite.config.ts workbox config, add NetworkOnly rules for:
  - https://maps.googleapis.com/*
  - https://maps.gstatic.com/*

  This prevents the service worker from attempting to cache Google Maps API responses.

  ---
  Recommended Implementation Order

  ┌──────┬───────────────────────────────────────────────────────────────────────────┐
  │ Step │                                   Work                                    │
  ├──────┼───────────────────────────────────────────────────────────────────────────┤
  │ 1    │ Install @googlemaps/js-api-loader                                         │
  ├──────┼───────────────────────────────────────────────────────────────────────────┤
  │ 2    │ Create usePlacesAutocomplete hook                                         │
  ├──────┼───────────────────────────────────────────────────────────────────────────┤
  │ 3    │ Create LocationInput component (test with mock data first)                │
  ├──────┼───────────────────────────────────────────────────────────────────────────┤
  │ 4    │ Update convex/schema.ts — new fields + index                              │
  ├──────┼───────────────────────────────────────────────────────────────────────────┤
  │ 5    │ Update convex/listings.ts — new mutation args + Haversine query           │
  ├──────┼───────────────────────────────────────────────────────────────────────────┤
  │ 6    │ Run data migration from Convex dashboard                                  │
  ├──────┼───────────────────────────────────────────────────────────────────────────┤
  │ 7    │ Update PostRideScreen — swap direction picker for LocationInputs + fare   │
  ├──────┼───────────────────────────────────────────────────────────────────────────┤
  │ 8    │ Update HomeScreen — swap direction tabs for route search + fix feed cards │
  ├──────┼───────────────────────────────────────────────────────────────────────────┤
  │ 9    │ Update ListingDetailScreen and MyListingScreen                            │
  ├──────┼───────────────────────────────────────────────────────────────────────────┤
  │ 10   │ Wire real Maps API key, end-to-end test                                   │
  ├──────┼───────────────────────────────────────────────────────────────────────────┤
  │ 11   │ Add workbox NetworkOnly rules for Maps URLs                               │
  └──────┴───────────────────────────────────────────────────────────────────────────┘

  Steps 1–3 can be done without touching Convex (build UI against mock data). Steps 4–6 are backend-only. Steps 7–9 are
  frontend-only. This lets you build in parallel safely.