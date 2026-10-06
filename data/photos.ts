// On-site photography. These scenes are illustrative and must not be described
// as a named job or street address.

export type SitePhoto = {
  src: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
  placeName: string;
  illustrative: boolean;
  objectPosition?: string;
};

const illustrative = ' Illustrative scene, not a photograph of a specific job or address.';

export const photos = {
  commercialLpr: {
    src: '/photos/central-florida-commercial-slide-gate-lpr-camera.webp',
    width: 1280,
    height: 720,
    alt: 'Commercial slide gate with operator, keypad pedestal, and license plate recognition camera at a Central Florida industrial facility',
    caption: 'Commercial slide gate with operator, keypad pedestal, and license plate recognition camera at a Central Florida industrial facility',
    placeName: 'Central Florida',
    illustrative: true,
  },
  storageSlide: {
    src: '/photos/clermont-fl-self-storage-slide-gate-keypad-access-control.webp',
    width: 1280,
    height: 720,
    alt: 'Self-storage slide gate and keypad pedestal for access control in Clermont, Florida',
    caption: `Slide gate and keypad pedestal at a self-storage entrance in Clermont, Florida.${illustrative}`,
    placeName: 'Clermont, Lake County, Florida',
    illustrative: true,
  },
  hoaCallbox: {
    src: '/photos/lake-county-fl-hoa-gated-community-entry-call-box.webp',
    width: 1280,
    height: 720,
    alt: 'HOA swing gates and an entry call box at a gated community entrance in Lake County, Florida',
    caption: `Swing gates and a visitor call box at a gated-community entrance in Lake County, Florida.${illustrative}`,
    placeName: 'Lake County, Florida',
    illustrative: true,
  },
  technician: {
    src: '/photos/orlando-fl-gate-operator-repair-technician-diagnostics.webp',
    width: 1280,
    height: 720,
    alt: 'Technician testing a gate operator circuit board with a multimeter during a repair in the Orlando, Florida area',
    caption: `Gate operator diagnostics with a multimeter in the Orlando, Florida area.${illustrative}`,
    placeName: 'Orlando, Florida',
    illustrative: true,
  },
  receiver: {
    src: '/photos/tampa-fl-gate-access-control-receiver-installation.webp',
    width: 1280,
    height: 720,
    alt: 'Wireless gate access receiver on a post with an operator cabinet at a Tampa, Florida entry',
    caption: `Access-control receiver and operator cabinet at a Tampa, Florida vehicle gate.${illustrative}`,
    placeName: 'Tampa, Florida',
    illustrative: true,
  },
  storageSlideKeypad: {
    src: '/photos/clermont-fl-self-storage-slide-gate-keypad.webp',
    width: 1280,
    height: 720,
    alt: 'Commercial slide gate with gooseneck keypad stand at a Clermont, Florida self-storage entry',
    caption: 'Commercial slide gate with gooseneck keypad stand at a Clermont, Florida self-storage entry',
    placeName: 'Clermont, Lake County, Florida',
    illustrative: false,
  },
  gateCamera: {
    src: '/photos/orlando-fl-security-camera-monitoring-vehicle-gate-entry.webp',
    width: 1280,
    height: 720,
    alt: 'Security camera monitoring a car entering a gated community entrance in Orlando, Florida',
    caption: 'Security camera monitoring a car entering a gated community entrance in Orlando, Florida',
    placeName: 'Orlando, Florida',
    illustrative: true,
  },
} as const satisfies Record<string, SitePhoto>;

export type PhotoId = keyof typeof photos;

const servicePhotoIds: Record<string, PhotoId[]> = {
  'security-gate-systems': ['storageSlide', 'hoaCallbox', 'storageSlideKeypad'],
  'gate-automation': ['storageSlide', 'technician'],
  'access-control': ['hoaCallbox', 'gateCamera'],
  'video-surveillance': ['commercialLpr'],
  'security-system-integration': ['commercialLpr', 'receiver'],
  'emergency-service': ['technician'],
};

const industryPhotoIds: Record<string, PhotoId[]> = {
  'storage-facilities': ['storageSlideKeypad', 'storageSlide'],
  'hoa-gated-communities': ['hoaCallbox'],
};

export function photosById(ids: readonly PhotoId[]): SitePhoto[] {
  return ids.map((id) => photos[id]);
}

export function photosForService(slug: string): SitePhoto[] {
  return photosById(servicePhotoIds[slug] ?? []);
}

export function photosForIndustry(slug: string): SitePhoto[] {
  return photosById(industryPhotoIds[slug] ?? []);
}
