// Gate-operator answer pages for Clermont and Lake County.
// No prices, no street address, no 24/7 claim, no competitor names.

import type { AdministrativeArea, City } from 'schema-dts';

export type ServedPlace = City | AdministrativeArea;

export type OperatorFaq = { q: string; a: string };

export type OperatorPage = {
  slug: string;
  path: string;
  title: string;
  metaDescription: string;
  eyebrow: string;
  h1: string;
  directAnswer: string;
  serviceType: string;
  sections: { heading: string; paragraphs: string[] }[];
  symptoms: { title: string; body: string }[];
  faqs: OperatorFaq[];
  areaServed: ServedPlace[];
  breadcrumbs: { name: string; path: string }[];
};

function city(name: string, county: string): City {
  return {
    '@type': 'City',
    name,
    containedInPlace: { '@type': 'AdministrativeArea', name: county },
  };
}

/** Places named on the Clermont / Lake County operator pages. City or county only. */
export const lakeCountyOperatorArea: ServedPlace[] = [
  city('Clermont', 'Lake County, Florida'),
  city('Minneola', 'Lake County, Florida'),
  city('Groveland', 'Lake County, Florida'),
  city('Montverde', 'Lake County, Florida'),
  city('Winter Garden', 'Orange County, Florida'),
  { '@type': 'AdministrativeArea', name: 'Lake County' },
  { '@type': 'AdministrativeArea', name: 'Orange County' },
];

const clermontFaqs: OperatorFaq[] = [
  {
    q: 'Who repairs gate operators in Clermont, FL?',
    a: 'Florida Security Concepts repairs gate operators in Clermont, FL. We are based in Clermont and schedule Lake County, including Minneola, Groveland, and Montverde, plus Winter Garden. Call (352) 282-0692. Same-day when available. After-hours emergency service is by phone.',
  },
  {
    q: 'Is Florida Security Concepts an access control company in Clermont?',
    a: 'Yes. Florida Security Concepts is a Clermont access control company. We repair gate operators and the keypads, readers, and callboxes that open them, including CellGate WXL callboxes, for homes, HOAs, and commercial entries.',
  },
  {
    q: 'Which gate operators do you service in Clermont?',
    a: 'We service LiftMaster CSL slide gate operators, swing operators, slide operators, and vertical-lift operators, plus CellGate WXL callboxes on those entries.',
  },
  {
    q: 'What are common signs a gate operator needs repair?',
    a: 'The gate will not open, will not close, or stops halfway. It reverses on its own. The operator hums or clicks and the leaf does not move. A remote works and the keypad or callbox does not. It runs in the morning and faults in the afternoon heat. A slide gate grinds or the chain jumps. A swing gate drags or will not latch. A vertical-lift gate stops short.',
  },
  {
    q: 'Do you offer after-hours emergency gate operator repair in Clermont?',
    a: 'Yes. After-hours emergency service is by phone at (352) 282-0692. Same-day when available. The website form does not send a technician.',
  },
  {
    q: 'How do I book an advanced consultation?',
    a: 'Book a project call through Booqer at https://booqer.ai/shops/florida-security-concepts/book. Available slots are confirmed instantly. The call is an advanced consultation about the entrance. It does not dispatch a technician.',
  },
];

const lakeCountyFaqs: OperatorFaq[] = [
  {
    q: 'Who repairs gate operators in Lake County, FL?',
    a: 'Florida Security Concepts repairs gate operators in Lake County, FL, from our base in Clermont. Call (352) 282-0692. Same-day when available. After-hours emergency service is by phone.',
  },
  {
    q: 'Which Lake County cities do you schedule for gate operator repair?',
    a: 'We schedule Clermont, Minneola, Groveland, and Montverde, and the rest of Lake County we can drive from Clermont. Winter Garden, in Orange County, is on the same run. Tell us the city when you book.',
  },
  {
    q: 'Do you service LiftMaster CSL operators and CellGate WXL callboxes in Lake County?',
    a: 'Yes. We service LiftMaster CSL slide gate operators, CellGate WXL callboxes, and swing, slide, and vertical-lift operators on Lake County entries.',
  },
  {
    q: 'What symptoms should I describe when I call?',
    a: 'Say whether the gate will not open, will not close, stops halfway, or reverses. Say whether a remote still works when the keypad or callbox does not, and whether it fails only in the afternoon heat or after a storm. That is enough to start. You do not need the model number.',
  },
  {
    q: 'Is after-hours emergency service available in Lake County?',
    a: 'Yes. Call (352) 282-0692. After-hours emergency service is by phone. Same-day when available. Do not use the website form to request a dispatch.',
  },
  {
    q: 'How do I book a project call for a Lake County gate?',
    a: 'Book a project call through Booqer at https://booqer.ai/shops/florida-security-concepts/book. Available slots are confirmed instantly. The booking is an advanced consultation, not a dispatched visit. If the gate is down now, call (352) 282-0692.',
  },
];

export const operatorPages: OperatorPage[] = [
  {
    slug: 'clermont-fl',
    path: '/gate-operator-repair/clermont-fl',
    title: 'Gate Operator Repair in Clermont, FL',
    metaDescription:
      'Gate operator repair in Clermont, FL. LiftMaster CSL, CellGate WXL, swing, slide, and vertical lift. Same-day when available.',
    eyebrow: 'Clermont, FL',
    h1: 'Gate Operator Repair in Clermont, FL',
    directAnswer:
      'Florida Security Concepts repairs gate operators in Clermont, FL. We are an access control company based in Clermont. We service LiftMaster CSL slide gate operators, CellGate WXL callboxes, and swing, slide, and vertical-lift operators for homes, HOAs, and commercial entries in Clermont, Minneola, Groveland, Montverde, and Winter Garden. If the gate is down, call (352) 282-0692. Same-day when available. After-hours emergency service is by phone.',
    serviceType: 'Gate operator repair',
    sections: [
      {
        heading: 'Operators and callboxes we service',
        paragraphs: [
          'On a Clermont entry we service LiftMaster CSL slide gate operators and CellGate WXL callboxes, and we repair swing, slide, and vertical-lift operators. The brand on the housing is the starting point. The visit still has to look at the leaf, the limits, and the safety devices, because a healthy operator will fault if the track is packed or the swing path is dragging.',
          'An advanced consultation is how we talk through the operator, the symptom, and the city before a visit is planned. Book a project call through Booqer — available slots are confirmed instantly. That call does not dispatch a technician. If the gate is stuck in the lane now, call.',
        ],
      },
      {
        heading: 'After-hours emergency service',
        paragraphs: [
          'After-hours emergency service in Clermont is by phone at (352) 282-0692. Same-day when available. The contact form on this website does not send a technician and does not hold a time. Use the phone when the entrance is blocked. Use the project call when you need to talk through a repair, a callbox, or an operator that is failing on a pattern.',
        ],
      },
    ],
    symptoms: [
      {
        title: 'Will not open, will not close, or stops halfway',
        body: 'The leaf never finishes a cycle. Note whether it fails open, closed, or mid-travel, and whether that started after a storm or only in the heat of the day.',
      },
      {
        title: 'Hums, clicks, or reverses',
        body: 'The operator makes noise and the leaf does not move, or the gate reverses when the lane is empty. Those are different faults from a keypad that nobody can remember.',
      },
      {
        title: 'Remote works, callbox or keypad does not',
        body: 'A LiftMaster operator that still runs from its remote, while a CellGate WXL callbox or keypad does not open the gate, is an entry-device problem on a live operator. Say which control still works.',
      },
      {
        title: 'Slide, swing, or vertical lift',
        body: 'A slide gate that grinds or throws the chain, a swing gate that drags or will not latch, and a vertical-lift gate that stops short are leaf problems as often as they are motor problems. Tell us which kind of gate it is.',
      },
    ],
    faqs: clermontFaqs,
    areaServed: lakeCountyOperatorArea,
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Gate repair', path: '/services/gate-repair' },
      { name: 'Clermont gate operator repair', path: '/gate-operator-repair/clermont-fl' },
    ],
  },
  {
    slug: 'lake-county-fl',
    path: '/service-areas/lake-county-fl',
    title: 'Lake County Gate Operator Repair',
    metaDescription:
      'Lake County gate operator repair from Clermont. Minneola, Groveland, Montverde, and Winter Garden. Same-day when available.',
    eyebrow: 'Lake County, FL',
    h1: 'Gate Operator Repair in Lake County, FL',
    directAnswer:
      'Florida Security Concepts repairs gate operators across Lake County, Florida, from our base in Clermont. We schedule Clermont, Minneola, Groveland, and Montverde, and Winter Garden on the Orange County side of the same drive. We service LiftMaster CSL slide gate operators, CellGate WXL callboxes, and swing, slide, and vertical-lift operators. Call (352) 282-0692 if a gate is down. Same-day when available. After-hours emergency service is by phone.',
    serviceType: 'Gate operator repair',
    sections: [
      {
        heading: 'Where we schedule in Lake County',
        paragraphs: [
          'Clermont is home base. Minneola, Groveland, and Montverde are on the same Lake County runs, along US 27 and State Road 50 and the ridge communities around the Clermont chain of lakes. Winter Garden is the Orange County city we schedule with those calls. There is no second office. Tell us the city so we can confirm the drive.',
          'Clermont has its own gate operator repair page and a gate repair page. Minneola and Groveland have their own gate repair pages. Montverde, Minneola, Groveland, and west Orange County have service area pages. Winter Garden has its own gate repair page. An advanced consultation is the project call for any of them.',
        ],
      },
      {
        heading: 'The operators on these entries',
        paragraphs: [
          'Lake County communities mix newer swing gates with older slide gates and the occasional vertical-lift operator. We service LiftMaster CSL slide gate operators and CellGate WXL callboxes, and we repair the swing, slide, and vertical-lift operators already on the property. A callbox that will not ring and an operator that will not travel can be the same entrance or two different faults. Say which one you are looking at.',
          'Book a project call through Booqer — available slots are confirmed instantly. The booking is an advanced consultation. It does not dispatch a technician. After-hours emergency service stays on the phone: (352) 282-0692. Same-day when available.',
        ],
      },
    ],
    symptoms: [
      {
        title: 'Afternoon heat on a ridge entry',
        body: 'A Lake County operator that is quiet at breakfast and faults after noon is usually heat and duty cycle on a south- or west-facing housing. Say whether the failure clusters late in the day.',
      },
      {
        title: 'Sand in a slide track after a storm',
        body: 'Ridge storms wash sand and leaves into slide tracks. The operator then works against a leaf that used to roll. A swing gate on a grade can miss the latch when the wind comes off the lake.',
      },
      {
        title: 'Callbox or keypad, not the motor',
        body: 'Residents still open the gate with a remote while guests cannot use the CellGate WXL callbox or the keypad. That pattern matters. It points at the entry device and the credential path, not automatically at a failed motor.',
      },
      {
        title: 'Vertical lift and swing on the same property',
        body: 'Some Lake County sites have more than one operator type. A vertical-lift gate that stops short is not the same repair as a swing gate that drags. Name the entrance.',
      },
    ],
    faqs: lakeCountyFaqs,
    areaServed: lakeCountyOperatorArea,
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Service areas', path: '/service-areas' },
      { name: 'Lake County', path: '/service-areas/lake-county-fl' },
    ],
  },
];

export function getOperatorPage(path: string): OperatorPage | undefined {
  return operatorPages.find((page) => page.path === path);
}

export function gateOperatorRepairPages(): OperatorPage[] {
  return operatorPages.filter((page) => page.path.startsWith('/gate-operator-repair/'));
}
