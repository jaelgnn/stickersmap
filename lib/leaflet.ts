export function fixLeafletIcons() {
  if (typeof window === "undefined") return;

  const L = require("leaflet");

  delete L.Icon.Default.prototype._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl:
      "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

let glassPinIconCache: any = null;

export function getGlassPinIcon() {
  if (typeof window === "undefined") return null;
  if (glassPinIconCache) return glassPinIconCache;

  const L = require("leaflet");

  glassPinIconCache = L.divIcon({
    className: "glass-pin-wrapper",
    html: `
      <div class="glass-pin" aria-hidden="true">
        <img src="/markers/pin.svg" alt="" class="glass-pin-img" />
      </div>
    `,
    iconSize: [40, 56],
    iconAnchor: [20, 54],
    popupAnchor: [0, -44],
  });

  return glassPinIconCache;
}
