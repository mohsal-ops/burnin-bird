"use client";
import { useEffect, useRef, useState } from "react";
import { SITE_CONFIG } from "@/lib/siteConfig";

type HereSuggestion = {
  id: string;
  title: string;
  type: string;
  address: { label: string };
};

type HerePlace = {
  id: string;
  title: string;
  address: { label: string };
  position: { lat: number; lng: number };
};

type HereApiItem = {
  id: string;
  title: string;
  resultType?: string;
  address?: { label?: string };
  position?: { lat: number; lng: number };
};

const KEY = process.env.NEXT_PUBLIC_HERE_API_KEY;
const ADDRESS_TYPES = new Set(["houseNumber", "street", "place"]);

// Only suggest addresses within delivery reach of the restaurant, so a few
// letters of a street are enough (before, HERE searched the whole world).
const hasHome = Number.isFinite(SITE_CONFIG.lat) && Number.isFinite(SITE_CONFIG.lng) && (SITE_CONFIG.lat !== 0 || SITE_CONFIG.lng !== 0);
const AREA = hasHome ? `&in=circle:${SITE_CONFIG.lat},${SITE_CONFIG.lng};r=60000` : "&in=countryCode:USA,CAN";

// "1500 Connecticut Ave NW, Washington, DC 20036-1104, United States"
//   -> bold "1500 Connecticut Ave NW" over "Washington, DC 20036-1104"
const dropCountry = (label: string) => label.replace(/,\s*(United States|Canada)$/, "");
const mainLine = (label: string) => label.split(",")[0];
const restLine = (label: string) => dropCountry(label).split(",").slice(1).join(",").trim();

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 60000,
    })
  );
}

export default function HereAutocomplete({
  onSelect,
}: {
  onSelect: (place: HerePlace) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<HereSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const [searchedFor, setSearchedFor] = useState("");
  const [needsNumber, setNeedsNumber] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  // Debounced search; a newer keystroke cancels the older request so stale
  // answers can never overwrite fresh ones.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      abortRef.current?.abort();
      setResults([]);
      setSearching(false);
      return;
    }
    const t = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setSearching(true);
      try {
        const res = await fetch(
          `https://autocomplete.search.hereapi.com/v1/autocomplete?q=${encodeURIComponent(q)}${AREA}&lang=en-US&limit=6&apiKey=${KEY}`,
          { signal: ctrl.signal }
        );
        const data: { items?: HereApiItem[] } = await res.json();
        setResults(
          (data.items || [])
            .filter((i) => ADDRESS_TYPES.has(i.resultType ?? "") && Boolean(i.address?.label))
            .map((i) => ({ id: i.id, title: i.title, type: i.resultType ?? "", address: { label: i.address!.label! } }))
        );
        setActive(-1);
        setError("");
        setSearchedFor(q);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setError("Couldn't load suggestions. Check your connection and try again.");
      } finally {
        if (abortRef.current === ctrl) setSearching(false);
      }
    }, 180);
    return () => clearTimeout(t);
  }, [query]);

  // Close the list when tapping outside it.
  useEffect(() => {
    const close = (e: PointerEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  const finish = (place: HerePlace) => {
    onSelect(place);
    setQuery(place.address.label);
    setResults([]);
    setOpen(false);
  };

  const resolvePlace = async (item: HereSuggestion) => {
    // A whole street isn't deliverable: put it in the box and ask for the number.
    if (item.type === "street") {
      const street = dropCountry(item.address.label);
      setQuery(" " + street);
      setNeedsNumber(true);
      setResults([]);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        inputRef.current?.setSelectionRange(0, 0);
      });
      return;
    }
    try {
      const res = await fetch(`https://lookup.search.hereapi.com/v1/lookup?id=${encodeURIComponent(item.id)}&apiKey=${KEY}`);
      const full: { position?: { lat: number; lng: number } } = await res.json();
      if (!full.position) throw new Error("no position");
      finish({ id: item.id, title: item.title, address: item.address, position: full.position });
    } catch {
      setError("Couldn't load that address. Please pick it again.");
    }
  };

  // "Use my current location": device GPS -> nearest street address.
  const useMyLocation = async () => {
    setError("");
    if (!("geolocation" in navigator)) {
      setError("Your browser can't share its location. Please type your address.");
      return;
    }
    setLocating(true);
    try {
      const pos = await getPosition();
      const { latitude, longitude } = pos.coords;
      // Nearest numbered address first (a courier needs a house number);
      // fall back to the street, then ask the customer for their number.
      const rev = async (types: string) => {
        const res = await fetch(
          `https://revgeocode.search.hereapi.com/v1/revgeocode?at=${latitude},${longitude}&types=${types}&lang=en-US&limit=1&apiKey=${KEY}`
        );
        const data: { items?: HereApiItem[] } = await res.json();
        return data.items?.[0];
      };
      const hit = (await rev("houseNumber")) ?? (await rev("address"));
      if (!hit?.address?.label) throw new Error("no address");
      if (hit.resultType !== "houseNumber") {
        resolvePlace({ id: hit.id, title: hit.title, type: "street", address: { label: hit.address.label } });
        return;
      }
      finish({
        id: hit.id,
        title: hit.title,
        address: { label: hit.address.label },
        position: hit.position ?? { lat: latitude, lng: longitude },
      });
    } catch (e) {
      const code = (e as GeolocationPositionError)?.code;
      setError(
        code === 1
          ? "Location access is blocked. Allow it in your browser settings, or type your address."
          : code === 3
            ? "Finding your location took too long. Try again or type your address."
            : "We couldn't find an address for your location. Please type it instead."
      );
    } finally {
      setLocating(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      resolvePlace(results[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const showList = open && results.length > 0;

  return (
    <div ref={boxRef} className="relative w-full">
      <div className="relative">
        <input
          value={query}
          ref={inputRef}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (/^\s*\d/.test(e.target.value)) setNeedsNumber(false);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Type your address or use your location"
          autoComplete="street-address"
          role="combobox"
          aria-expanded={showList}
          aria-controls="here-address-list"
          className="w-full rounded-xl border bg-background p-3 pr-10"
        />
        {searching && (
          <span aria-hidden className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-current border-t-transparent opacity-50" />
        )}
      </div>

      <button
        type="button"
        onClick={useMyLocation}
        disabled={locating}
        className="mt-2 flex w-full items-center gap-3 rounded-xl border p-3 text-left font-medium transition hover:bg-muted disabled:opacity-60"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" strokeLinecap="round" />
        </svg>
        <span>{locating ? "Finding your location…" : "Use my current location"}</span>
      </button>

      {needsNumber && (
        <p className="mt-2 text-sm font-medium text-amber-700 dark:text-amber-400">
          Add your house or building number at the start, then pick your address.
        </p>
      )}

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {showList && (
        <ul id="here-address-list" role="listbox" className="mt-2 overflow-hidden rounded-xl border bg-background">
          {results.map((item, i) => (
            <li
              key={item.id}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onClick={() => resolvePlace(item)}
              className={`cursor-pointer p-3 ${i === active ? "bg-muted" : ""}`}
            >
              <div className="font-medium">{mainLine(item.address.label)}</div>
              <div className="text-sm text-muted-foreground">
                {item.type === "street" ? "Street · add your number · " : ""}
                {restLine(item.address.label)}
              </div>
            </li>
          ))}
        </ul>
      )}

      {open && !searching && searchedFor === query.trim() && query.trim().length >= 2 && results.length === 0 && !error && (
        <p className="mt-2 text-sm text-muted-foreground">No matching address yet. Keep typing the street name and number.</p>
      )}
    </div>
  );
}
