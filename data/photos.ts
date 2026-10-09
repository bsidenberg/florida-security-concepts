// Illustrative equipment photos. Alt text describes the hardware only.
// Do not name a city, a customer, or a job.

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

export const photos = {
  commercialLpr: {
    src: '/photos/central-florida-commercial-slide-gate-lpr-camera.webp',
    width: 1280,
    height: 720,
    alt: 'Commercial slide gate with an operator cabinet and a keypad pedestal at an industrial entry',
    caption: 'Commercial slide gate with an operator cabinet and a keypad pedestal at an industrial entry',
    placeName: '',
    illustrative: true,
  },
  storageSlide: {
    src: '/photos/clermont-fl-self-storage-slide-gate-keypad-access-control.webp',
    width: 1280,
    height: 720,
    alt: 'Slide gate and a keypad pedestal at a self-storage entrance',
    caption: 'Slide gate and a keypad pedestal at a self-storage entrance',
    placeName: '',
    illustrative: true,
  },
  hoaCallbox: {
    src: '/photos/lake-county-fl-hoa-gated-community-entry-call-box.webp',
    width: 1280,
    height: 720,
    alt: 'Swing gates and a visitor call box at a gated-community entrance',
    caption: 'Swing gates and a visitor call box at a gated-community entrance',
    placeName: '',
    illustrative: true,
  },
  technician: {
    src: '/photos/orlando-fl-gate-operator-repair-technician-diagnostics.webp',
    width: 1280,
    height: 720,
    alt: 'Technician testing a gate operator circuit board with a multimeter',
    caption: 'Technician testing a gate operator circuit board with a multimeter',
    placeName: '',
    illustrative: true,
  },
  receiver: {
    src: '/photos/tampa-fl-gate-access-control-receiver-installation.webp',
    width: 1280,
    height: 720,
    alt: 'Wireless gate receiver mounted on a post beside an operator cabinet',
    caption: 'Wireless gate receiver mounted on a post beside an operator cabinet',
    placeName: '',
    illustrative: true,
  },
  storageSlideKeypad: {
    src: '/photos/clermont-fl-self-storage-slide-gate-keypad.webp',
    width: 1280,
    height: 720,
    alt: 'Commercial slide gate with a gooseneck keypad stand',
    caption: 'Commercial slide gate with a gooseneck keypad stand',
    placeName: '',
    illustrative: true,
  },
  gateCamera: {
    src: '/photos/orlando-fl-security-camera-monitoring-vehicle-gate-entry.webp',
    width: 1280,
    height: 720,
    alt: 'Security camera aimed at a vehicle approaching a gate',
    caption: 'Security camera aimed at a vehicle approaching a gate',
    placeName: '',
    illustrative: true,
  },
} as const satisfies Record<string, SitePhoto>;

export type PhotoId = keyof typeof photos;

const servicePhotoIds: Record<string, PhotoId[]> = {
  'security-gate-systems': ['storageSlide', 'hoaCallbox', 'storageSlideKeypad'],
  'gate-repair': ['technician', 'storageSlide'],
  'gate-automation': ['storageSlide', 'technician'],
  'maintenance-plans': ['technician', 'storageSlideKeypad'],
  'access-control': ['hoaCallbox', 'gateCamera'],
  'video-surveillance': ['gateCamera'],
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
