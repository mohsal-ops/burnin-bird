"use client";

import React, { useEffect, useRef, useState } from "react";
import searchandGetPlaceAndAddToDataBase from "./_action/selectPlace";
import { MapPin, Trash2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import HereMapsScripts from "@/components/HereMapsScripts";

type Place = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

export default function PlacesComponent() {
  const mapRef = useRef<HTMLDivElement>(null);

  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);

  const fetchPlaces = async () => {
    try {
      const res = await fetch("/api/getPlaces");
      if (res.ok) {
        const data = await res.json();
        setPlaces(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaces();
  }, []);

  useEffect(() => {
    if (showMap && mapRef.current) {
      searchandGetPlaceAndAddToDataBase({
        mapRef: mapRef.current,
        onPlaceAdded: fetchPlaces,
      });
    }
  }, [showMap]);

  const handleDelete = async (id: string, name: string) => {
    setDeleting(id);
    try {
      const res = await fetch("/api/deletePlace", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        setPlaces((prev) => prev.filter((p) => p.id !== id));
        toast(`"${name}" removed`);
      } else toast("Failed to delete place");
    } catch {
      toast("Something went wrong");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-stone-50 to-stone-100 p-6">
      <HereMapsScripts />

      {/* HEADER */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight">
            Places
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Manage your restaurant locations
          </p>
        </div>

        <button
          onClick={() => setShowMap((v) => !v)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md active:scale-[0.98] ${
            showMap
              ? "bg-stone-200 text-stone-700 hover:bg-stone-300"
              : "bg-[#c85a1e] text-white hover:bg-[#a94a19]"
          }`}
        >
          {showMap ? (
            <>
              <X size={16} /> Close Map
            </>
          ) : (
            <>
              <Plus size={16} /> Add New Place
            </>
          )}
        </button>
      </div>

      {/* MAP */}
      {showMap && (
        <div className="w-full flex flex-col items-center mb-10">
          <div className="w-full max-w-3xl bg-white/80 backdrop-blur border border-stone-200 rounded-2xl p-3 shadow-sm flex gap-2">
            <input
              id="text-input"
              placeholder="Search for a place..."
              className="flex-1 px-3 py-2 text-sm border border-stone-200 rounded-xl outline-none focus:ring-2 focus:ring-[#c85a1e]/30"
            />

            <button
              id="text-input-button"
              className="px-4 py-2 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition"
            >
              Search
            </button>
          </div>

          <div
            ref={mapRef}
            className="w-full max-w-5xl h-[70vh] min-h-[400px] mt-4 rounded-3xl overflow-hidden border border-stone-200 shadow-lg"
          />
        </div>
      )}

      {/* LIST */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        {/* header row */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-stone-700">
            {places.length} location{places.length !== 1 ? "s" : ""}
          </p>
        </div>

        {loading ? (
          <div className="p-12 text-center text-stone-400">
            Loading places...
          </div>
        ) : places.length === 0 ? (
          <div className="p-12 text-center text-stone-400">
            No places added yet
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {places.map((place) => (
              <div
                key={place.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-stone-50 transition group"
              >
                {/* LEFT */}
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-[#c85a1e]/10 flex items-center justify-center">
                    <MapPin size={16} className="text-[#c85a1e]" />
                  </div>

                  <div>
                    <p className="font-semibold text-stone-800 group-hover:text-stone-900">
                      {place.name}
                    </p>
                    <p className="text-xs text-stone-400 font-mono mt-0.5">
                      {place.lat.toFixed(4)}, {place.lng.toFixed(4)}
                    </p>
                  </div>
                </div>

                {/* RIGHT */}
                <button
                  onClick={() => handleDelete(place.id, place.name)}
                  disabled={deleting === place.id}
                  className="flex items-center gap-2 text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-xl transition opacity-0 group-hover:opacity-100"
                >
                  {deleting === place.id ? (
                    "Removing..."
                  ) : (
                    <>
                      <Trash2 size={14} />
                      Remove
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}