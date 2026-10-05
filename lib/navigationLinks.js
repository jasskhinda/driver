// Directions links for Google Maps, Apple Maps and Waze.
// A web page can't tell which apps are installed, so these are universal
// links: each opens the app if it's on the phone, otherwise that app's website.
export function navigationLinks(address) {
  const q = encodeURIComponent(address || '');
  return [
    { label: 'Open in Google Maps', href: `https://www.google.com/maps/dir/?api=1&destination=${q}&travelmode=driving` },
    { label: 'Open in Apple Maps', href: `https://maps.apple.com/?daddr=${q}&dirflg=d` },
    { label: 'Open in Waze', href: `https://waze.com/ul?q=${q}&navigate=yes` },
  ];
}
