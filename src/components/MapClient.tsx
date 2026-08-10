"use client";
import { useEffect, useRef } from "react";
import { SITE_CONFIG } from "@/lib/siteConfig";

type Props = {
  lat: number;
  lng: number;
  className?: string;
};

export default function MapClient({ lat, lng, className }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
  let map: any;

  function initMap() {
    if (!mapRef.current || !(window as any).H) {
      setTimeout(initMap, 100);
      return;
    }

    const H = (window as any).H;

    const platform = new H.service.Platform({
      apikey: process.env.NEXT_PUBLIC_HERE_API_KEY,
    });

    const defaultLayers = platform.createDefaultLayers();

    map = new H.Map(mapRef.current, defaultLayers.vector.normal.map, {
      center: { lat, lng },
      zoom: 14,
      pixelRatio: window.devicePixelRatio || 1,
    });

    new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
    const ui = H.ui.UI.createDefault(map, defaultLayers);

    const marker = new H.map.Marker({ lat, lng });
    map.addObject(marker);

    marker.addEventListener("tap", () => {
      const position = marker.getGeometry();
      map.setCenter(position, true);
      map.setZoom(16, true);

      const bubble = new H.ui.InfoBubble(position, {
        content: `<strong>${SITE_CONFIG.name}</strong><br/>Click map to open in Google Maps`,
      });

      ui.addBubble(bubble);
    });

    map.addEventListener("tap", () => {
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
    });
  }

  initMap();

  return () => {
    if (map) map.dispose();
  };
}, [lat, lng]);

  return <div ref={mapRef} className={className} />;
}



