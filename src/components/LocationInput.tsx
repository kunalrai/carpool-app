import { useState, useEffect, useRef } from "react";
import {
  usePlacesAutocomplete,
  type Prediction,
  type PlaceResult,
} from "../hooks/usePlacesAutocomplete";

interface Props {
  label?: string;
  placeholder: string;
  value: PlaceResult | null;
  onChange: (value: PlaceResult | null) => void;
}

export default function LocationInput({ label, placeholder, value, onChange }: Props) {
  const [inputText, setInputText] = useState(value?.label ?? "");
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [fetching, setFetching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { getPredictions, getPlaceDetails } = usePlacesAutocomplete();

  // Keep display text in sync when external value changes (e.g. cleared by parent)
  useEffect(() => {
    setInputText(value?.label ?? "");
  }, [value?.label]);

  const handleInput = async (text: string) => {
    setInputText(text);
    if (!text.trim()) {
      onChange(null);
      setPredictions([]);
      setShowDropdown(false);
      return;
    }
    setFetching(true);
    const results = await getPredictions(text);
    setPredictions(results);
    setShowDropdown(results.length > 0);
    setFetching(false);
  };

  const handleSelect = async (pred: Prediction) => {
    setShowDropdown(false);
    setInputText(pred.description);
    setFetching(true);
    try {
      const coords = await getPlaceDetails(pred.placeId);
      onChange({ label: pred.description, placeId: pred.placeId, ...coords });
    } catch {
      setInputText("");
      onChange(null);
    } finally {
      setFetching(false);
    }
  };

  // On blur without selection — revert to committed value
  const handleBlur = () => {
    setTimeout(() => {
      setShowDropdown(false);
      setInputText(value?.label ?? "");
    }, 150);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault(); // keep input focused
    setInputText("");
    setPredictions([]);
    setShowDropdown(false);
    onChange(null);
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          placeholder={placeholder}
          onChange={(e) => handleInput(e.target.value)}
          onBlur={handleBlur}
          className="input-field pr-10"
          autoComplete="off"
          spellCheck={false}
        />

        {/* Spinner while fetching */}
        {fetching && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin pointer-events-none" />
        )}

        {/* Clear button */}
        {!fetching && value && (
          <button
            onMouseDown={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center text-gray-400 text-lg leading-none active:text-gray-600"
            aria-label="Clear"
            type="button"
          >
            ×
          </button>
        )}
      </div>

      {/* Predictions dropdown */}
      {showDropdown && predictions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-[200] overflow-hidden">
          {predictions.map((pred) => (
            <button
              key={pred.placeId}
              onMouseDown={(e) => e.preventDefault()} // prevent input blur
              onClick={() => handleSelect(pred)}
              className="w-full min-h-[44px] px-4 py-3 text-left border-b border-gray-50 last:border-0 active:bg-gray-50"
              type="button"
            >
              <p className="text-sm font-medium text-gray-900 truncate">
                {pred.mainText}
              </p>
              {pred.secondaryText && (
                <p className="text-xs text-gray-400 truncate mt-0.5">
                  {pred.secondaryText}
                </p>
              )}
            </button>
          ))}

          {/* "Powered by Google" — required by Maps Platform ToS */}
          <div className="px-4 py-2 flex justify-end border-t border-gray-100 bg-white">
            <img
              src="https://developers.google.com/static/maps/documentation/images/google_on_white.png"
              alt="Powered by Google"
              className="h-3.5"
            />
          </div>
        </div>
      )}
    </div>
  );
}
