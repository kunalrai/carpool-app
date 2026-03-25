import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import { useCallback, useRef } from "react";

export type Prediction = {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
};

export type PlaceResult = {
  label: string;
  lat: number;
  lng: number;
  placeId: string;
};

// ── Module-level singletons (shared across all LocationInput instances) ────────

const DETAIL_CACHE = new Map<string, { lat: number; lng: number }>();
let _autocompleteService: google.maps.places.AutocompleteService | null = null;
let _placesService: google.maps.places.PlacesService | null = null;
let _loaded = false;

// Bias predictions to NCR (Delhi / Noida / Gurgaon) bounding box
const NCR_SW = { lat: 28.3, lng: 76.8 };
const NCR_NE = { lat: 28.9, lng: 77.8 };

async function ensureMapsLoaded() {
  if (_loaded) return;
  setOptions({
    key: import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "",
    v: "weekly",
  });
  await Promise.all([importLibrary("places"), importLibrary("geocoding")]);
  _autocompleteService = new google.maps.places.AutocompleteService();
  // PlacesService requires a DOM element (used only for getDetails)
  const div = document.createElement("div");
  _placesService = new google.maps.places.PlacesService(div);
  _loaded = true;
}

/** Reverse geocodes a lat/lng to a PlaceResult using the Maps Geocoding API. */
export async function reverseGeocode(lat: number, lng: number): Promise<PlaceResult> {
  await ensureMapsLoaded();
  const geocoder = new google.maps.Geocoder();
  return new Promise((resolve, reject) => {
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status !== google.maps.GeocoderStatus.OK || !results?.length) {
        reject(new Error("Could not determine your location"));
        return;
      }
      const r = results[0];
      resolve({ label: r.formatted_address, lat, lng, placeId: r.place_id });
    });
  });
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function usePlacesAutocomplete() {
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getToken = useCallback(() => {
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
    }
    return sessionTokenRef.current;
  }, []);

  /** Debounced (300 ms) — returns up to 5 place predictions for the input string. */
  const getPredictions = useCallback(
    (input: string): Promise<Prediction[]> =>
      new Promise((resolve) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!input.trim()) {
          resolve([]);
          return;
        }
        debounceRef.current = setTimeout(async () => {
          try {
            await ensureMapsLoaded();
            _autocompleteService!.getPlacePredictions(
              {
                input,
                sessionToken: getToken(),
                bounds: new google.maps.LatLngBounds(NCR_SW, NCR_NE),
                componentRestrictions: { country: "in" },
              },
              (results, status) => {
                if (
                  status !== google.maps.places.PlacesServiceStatus.OK ||
                  !results
                ) {
                  resolve([]);
                  return;
                }
                resolve(
                  results.slice(0, 5).map((r) => ({
                    placeId: r.place_id,
                    description: r.description,
                    mainText: r.structured_formatting.main_text,
                    secondaryText: r.structured_formatting.secondary_text,
                  }))
                );
              }
            );
          } catch {
            resolve([]);
          }
        }, 300);
      }),
    [getToken]
  );

  /**
   * Resolves a placeId to coordinates.
   * Results are cached in-memory to avoid redundant API calls.
   * Resets the session token after the call (starts a new billing session).
   */
  const getPlaceDetails = useCallback(
    async (placeId: string): Promise<{ lat: number; lng: number }> => {
      if (DETAIL_CACHE.has(placeId)) return DETAIL_CACHE.get(placeId)!;
      await ensureMapsLoaded();
      return new Promise((resolve, reject) => {
        _placesService!.getDetails(
          { placeId, fields: ["geometry"], sessionToken: getToken() },
          (result, status) => {
            sessionTokenRef.current = null; // reset — new billing session after details
            if (
              status !== google.maps.places.PlacesServiceStatus.OK ||
              !result?.geometry?.location
            ) {
              reject(new Error("Place details unavailable"));
              return;
            }
            const coords = {
              lat: result.geometry.location.lat(),
              lng: result.geometry.location.lng(),
            };
            DETAIL_CACHE.set(placeId, coords);
            resolve(coords);
          }
        );
      });
    },
    [getToken]
  );

  return { getPredictions, getPlaceDetails };
}
