// Line diagrams of gate and access-control relationships.
// Alt text names the hardware only. Do not name a city, a customer, or a job.

export type DiagramId =
  | 'slide-entry'
  | 'storage-slide'
  | 'swing-callbox'
  | 'operator'
  | 'receiver'
  | 'keypad-reach'
  | 'camera-lane';

export type SiteConcept = {
  id: string;
  diagram: DiagramId;
  kicker: string;
  title: string;
  alt: string;
  caption: string;
};

export const concepts = {
  commercialSlide: {
    id: 'commercial-slide',
    diagram: 'slide-entry',
    kicker: 'Slide gate',
    title: 'The leaf travels along the fence',
    alt: 'Diagram of a commercial slide gate: the leaf rides a track beside the fence, the operator drives that leaf, and the keypad stands on the driver side of the lane',
    caption: 'The leaf parks beside the opening. It does not roll into the wall. The operator sits at the end of the track.',
  },
  storageSlide: {
    id: 'storage-slide',
    diagram: 'storage-slide',
    kicker: 'Storage entry',
    title: 'Keypad on the driver side',
    alt: 'Diagram of a slide gate and a keypad pedestal at a self-storage entrance, with the keypad on the driver side of the lane',
    caption: 'The keypad meets the driver at the window. The leaf stays on its track, clear of the pedestal.',
  },
  hoaCallbox: {
    id: 'swing-callbox',
    diagram: 'swing-callbox',
    kicker: 'Swing gate',
    title: 'Leaves open into the property',
    alt: 'Diagram of swing gates and a visitor call box at a gated-community entrance, with the leaves swinging into the property',
    caption: 'The hinges are on the posts. The arc opens into the property, and the call box sits where a driver can reach it.',
  },
  operator: {
    id: 'operator-cabinet',
    diagram: 'operator',
    kicker: 'Operator',
    title: 'The cabinet drives the leaf',
    alt: 'Diagram of a gate operator cabinet with the motor, control board, and limit switches connected to the leaf',
    caption: 'Motor, board, and limits stay in the cabinet that is chained or linked to the leaf they move.',
  },
  receiver: {
    id: 'gate-receiver',
    diagram: 'receiver',
    kicker: 'Receiver',
    title: 'The receiver sits with the operator',
    alt: 'Diagram of a wireless gate receiver mounted on a post beside an operator cabinet',
    caption: 'The receiver is wired to the operator it opens. It is not a second gate motor.',
  },
  storageSlideKeypad: {
    id: 'keypad-reach',
    diagram: 'keypad-reach',
    kicker: 'Keypad',
    title: 'Window height, before the leaf',
    alt: 'Diagram of a gooseneck keypad at a driver’s window, set before a commercial slide gate',
    caption: 'A gooseneck puts the keypad at the window, on the driver side, before the leaf starts to move.',
  },
  gateCamera: {
    id: 'camera-lane',
    diagram: 'camera-lane',
    kicker: 'Camera',
    title: 'The view follows the lane',
    alt: 'Diagram of a security camera aimed down a lane at a vehicle approaching a gate',
    caption: 'The camera looks along the lane at the vehicle and the gate. It does not replace the operator or the safety devices.',
  },
} as const satisfies Record<string, SiteConcept>;

export type ConceptId = keyof typeof concepts;

const serviceConceptIds: Record<string, ConceptId[]> = {
  'security-gate-systems': ['storageSlide', 'hoaCallbox', 'storageSlideKeypad'],
  'gate-repair': ['operator', 'storageSlide'],
  'gate-automation': ['storageSlide', 'operator'],
  'maintenance-plans': ['operator', 'storageSlideKeypad'],
  'access-control': ['hoaCallbox', 'gateCamera'],
  'video-surveillance': ['gateCamera'],
  'security-system-integration': ['commercialSlide', 'receiver'],
  'emergency-service': ['operator'],
};

const industryConceptIds: Record<string, ConceptId[]> = {
  'storage-facilities': ['storageSlideKeypad', 'storageSlide'],
  'hoa-gated-communities': ['hoaCallbox'],
};

export function conceptsById(ids: readonly ConceptId[]): SiteConcept[] {
  return ids.map((id) => concepts[id]);
}

export function conceptsForService(slug: string): SiteConcept[] {
  return conceptsById(serviceConceptIds[slug] ?? []);
}

export function conceptsForIndustry(slug: string): SiteConcept[] {
  return conceptsById(industryConceptIds[slug] ?? []);
}

export const homeConcepts: SiteConcept[] = conceptsById([
  'commercialSlide',
  'storageSlide',
  'hoaCallbox',
  'operator',
  'storageSlideKeypad',
  'gateCamera',
]);
