import { SITE_CONFIG } from "@/lib/siteConfig";

let map: any;
let platform: any;
let ui: any;
let markers: any[] = [];

type Props = {
  mapRef: HTMLDivElement;
  onPlaceAdded?: () => void;
};

export default function initHerePlacePicker({
  mapRef,
  onPlaceAdded,
}: Props) {
  const H = (window as any).H;

  if (!H?.service?.Platform) {
    window.setTimeout(() => {
      initHerePlacePicker({ mapRef, onPlaceAdded });
    }, 200);
    return;
  }

  // Called again every time the map picker is reopened - mapRef is a brand
  // new DOM node each time (React unmounts it on close), so any previous
  // map instance is now bound to a detached element and needs to be torn
  // down rather than reused.
  if (map) {
    map.dispose();
    map = undefined;
  }
  markers = [];

  platform = new H.service.Platform({
    apikey: process.env.NEXT_PUBLIC_HERE_API_KEY,
  });

  const defaultLayers = platform.createDefaultLayers();

  map = new H.Map(mapRef, defaultLayers.vector.normal.map, {
    center: { lat: SITE_CONFIG.lat, lng: SITE_CONFIG.lng },
    zoom: 12,
    pixelRatio: window.devicePixelRatio || 1,
  });
  new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
  ui = H.ui.UI.createDefault(map, defaultLayers);

  // The map container is revealed dynamically (Add New Place toggle); nudge
  // HERE to re-measure so tiles paint into the now-visible, sized container.
  requestAnimationFrame(() => {
    try {
      map.getViewPort().resize();
    } catch {}
  });

  const input = document.getElementById("text-input") as HTMLInputElement | null;
  const btn = document.getElementById("text-input-button") as HTMLButtonElement | null;

  if (!input || !btn) return;

  btn.addEventListener("click", () => searchPlaces(input.value, onPlaceAdded));
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") searchPlaces(input.value, onPlaceAdded);
  });
}

async function searchPlaces(query: string, onPlaceAdded?: () => void) {
  if (!query) return;

  const url = `https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(
    query
  )}&apiKey=${process.env.NEXT_PUBLIC_HERE_API_KEY}`;

  const res = await fetch(url);
  const data = await res.json();

  clearMarkers();

  if (!data.items || data.items.length === 0) {
    alert("No results found for that search. Try a more specific address.");
    return;
  }

  data.items.forEach((item: any) => {
    const marker = new (window as any).H.map.Marker(item.position);
    map.addObject(marker);
    markers.push(marker);

    marker.addEventListener("tap", async () => {
      const bubble = new (window as any).H.ui.InfoBubble(item.position, {
        content: `<b>${item.title}</b><br/>Click again to save`,
      });
      ui.addBubble(bubble);

      // SAVE TO DB
      const save = await fetch("/api/addPlaceToDb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: item.title,
          lat: item.position.lat,
          lng: item.position.lng,
        }),
      });

      if (save.ok) {
        alert("Place added!");
        onPlaceAdded?.();
      } else {
        alert("Already exists");
      }
    });
  });

  map.setCenter(data.items[0].position);
  map.setZoom(14);
}

function clearMarkers() {
  markers.forEach((m) => map.removeObject(m));
  markers = [];
}