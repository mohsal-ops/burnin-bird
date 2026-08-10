declare namespace H {
  namespace service {
    class Platform {
      constructor(opts: { apikey: string })
      createDefaultLayers(): unknown
    }

    class SearchService {
      geocode(
        params: unknown,
        onResult: (result: unknown) => void,
        onError: (err: unknown) => void
      ): void
    }
  }

  namespace map {
    class Marker {
      constructor(position: { lat: number; lng: number })
      addEventListener(event: string, cb: (...args: unknown[]) => void): void
    }
  }

  namespace mapevents {
    class Behavior {
      constructor(events: unknown)
    }

    class MapEvents {
      constructor(map: unknown)
    }
  }

  namespace ui {
    class UI {
      static createDefault(map: unknown, layers: unknown): UI
      addBubble(bubble: unknown): void
    }

    class InfoBubble {
      constructor(pos: unknown, opts: unknown)
    }
  }

  namespace geo {
    class Rect {
      constructor(t: number, r: number, b: number, l: number)
      mergePoint(p: unknown): void
    }
  }

  class Map {
    constructor(el: HTMLElement, layer: unknown, opts: unknown)
    getCenter(): { lat: number; lng: number }
    getViewModel(): unknown
    addObject(obj: unknown): void
    removeObject(obj: unknown): void
  }
}