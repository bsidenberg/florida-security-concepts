// On-site photography. AI scenes are illustrative and must not be captioned as a
// named job or street address. Field photographs are real equipment photos with
// third-party business signage cropped or blurred; do not name the property.

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
const field = ' Field photograph of equipment at a Florida self-storage entry. The property is not identified.';

export const photos = {
  commercialLpr: {
    src: '/photos/central-florida-commercial-gate-license-plate-recognition-camera.webp',
    width: 1280,
    height: 720,
    alt: 'Commercial slide gate with a license plate recognition camera and card reader at a Central Florida industrial site',
    caption: `Commercial cantilever slide gate with license plate recognition and a card reader at a Central Florida industrial entrance.${illustrative}`,
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
  fieldKeypad: {
    src: '/photos/florida-self-storage-keypad-pedestal.webp',
    width: 1600,
    height: 891,
    alt: 'Keypad on a pedestal at a Florida self-storage vehicle entrance',
    caption: `Keypad pedestal used for resident and tenant access at a Florida self-storage entry.${field}`,
    placeName: 'Florida',
    illustrative: false,
  },
  fieldGate: {
    src: '/photos/florida-self-storage-ornamental-gate-bollard.webp',
    width: 814,
    height: 1200,
    alt: 'Black ornamental vehicle gate and yellow keypad bollard at a Florida self-storage entrance',
    caption: `Ornamental vehicle gate and keypad bollard at a Florida self-storage entrance.${field}`,
    placeName: 'Florida',
    illustrative: false,
    objectPosition: 'center 40%',
  },
  fieldSwing: {
    src: '/photos/florida-self-storage-keypad-bollard-swing-gate.webp',
    width: 1154,
    height: 1600,
    alt: 'Keypad bollard beside a black ornamental swing gate at a Florida self-storage entry',
    caption: `Swing gate and keypad bollard at a Florida self-storage vehicle lane.${field}`,
    placeName: 'Florida',
    illustrative: false,
    objectPosition: 'center 55%',
  },
  fieldReceiver: {
    src: '/photos/florida-gate-post-wireless-receiver.webp',
    width: 1400,
    height: 1050,
    alt: 'Wireless receiver enclosure on a gate post next to an operator cabinet at a Florida vehicle gate',
    caption: `Wireless receiver on a gate post, with the operator cabinet beyond it, at a Florida vehicle entry.${field}`,
    placeName: 'Florida',
    illustrative: false,
    objectPosition: '18% center',
  },
} as const satisfies Record<string, SitePhoto>;

export type PhotoId = keyof typeof photos;

const servicePhotoIds: Record<string, PhotoId[]> = {
  'security-gate-systems': ['storageSlide', 'hoaCallbox', 'fieldSwing'],
  'gate-automation': ['storageSlide', 'fieldGate', 'technician'],
  'access-control': ['fieldKeypad', 'hoaCallbox', 'fieldReceiver'],
  'video-surveillance': ['commercialLpr'],
  'security-system-integration': ['commercialLpr', 'receiver'],
  'emergency-service': ['technician'],
};

const industryPhotoIds: Record<string, PhotoId[]> = {
  'storage-facilities': ['fieldKeypad', 'fieldSwing', 'storageSlide'],
  'hoa-gated-communities': ['hoaCallbox', 'fieldGate'],
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
