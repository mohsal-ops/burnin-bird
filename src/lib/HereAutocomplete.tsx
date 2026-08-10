"use client";
import { useState } from "react";

type HereSuggestion = {
  id: string;
  title: string;
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
  address?: {
    label?: string;
  };
};

export default function HereAutocomplete({
  onSelect,
}: {
  onSelect: (place: HerePlace) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<HereSuggestion[]>([]);

  const search = async (q: string) => {
    setQuery(q);

    if (q.length < 2) {
      setResults([]);
      return;
    }

    const res = await fetch(
      `https://autocomplete.search.hereapi.com/v1/autocomplete?q=${encodeURIComponent(
        q
      )}&limit=5&apiKey=${process.env.NEXT_PUBLIC_HERE_API_KEY}`
    );

    const data: { items?: HereApiItem[] } = await res.json();

    const filtered: HereSuggestion[] = (data.items || [])
      .filter(
        (item: HereApiItem) =>
          (item.resultType === "houseNumber" ||
            item.resultType === "street" ||
            item.resultType === "place") &&
          Boolean(item.address?.label)
      )
      .map((item: HereApiItem) => ({
        id: item.id,
        title: item.title,
        address: { label: item.address!.label! },
      }));

    setResults(filtered);
  };

  const resolvePlace = async (item: HereSuggestion) => {
    const res = await fetch(
      `https://lookup.search.hereapi.com/v1/lookup?id=${item.id}&apiKey=${process.env.NEXT_PUBLIC_HERE_API_KEY}`
    );

    const full: {
      position: {
        lat: number;
        lng: number;
      };
    } = await res.json();

    const place: HerePlace = {
      id: item.id,
      title: item.title,
      address: { label: item.address.label },
      position: {
        lat: full.position.lat,
        lng: full.position.lng,
      },
    };

    onSelect(place);
    setQuery(item.address.label);
    setResults([]);
  };

  return (
    <div className="w-full">
      <input
        value={query}
        onChange={(e) => search(e.target.value)}
        placeholder="Enter delivery address"
        className="w-full border rounded-xl p-3"
      />

      {results.length > 0 && (
        <div className="mt-2 border rounded-xl overflow-hidden">
          {results.map((item) => (
            <div
              key={item.id}
              onClick={() => resolvePlace(item)}
              className="p-3 hover:bg-gray-100 cursor-pointer"
            >
              <div className="font-medium">{item.title}</div>
              <div className="text-sm text-gray-500">
                {item.address.label}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}