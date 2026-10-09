export type Location = {
  slug: string;
  city: string; // canonical display name
  region: 'Central Florida' | 'Tampa Bay';
  county?: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  localContext: string; // 2-3 sentences about local property landscape
  highlightServices: string[]; // service slugs
  highlightIndustries: string[]; // industry slugs
  nearby: string[]; // location slugs
  keywords: string[];
};

export const locations: Location[] = [
  {
    slug: 'orlando',
    city: 'Orlando',
    region: 'Central Florida',
    county: 'Orange County',
    metaTitle:
      'Orlando Security Systems | Gates, Access Control & Cameras',
    metaDescription:
      'Security gate, access control, and video surveillance systems for Orlando communities, commercial properties, and estates. Local Central Florida service team.',
    intro:
      'Orlando’s mix of master-planned communities, mixed-use commercial districts, and tourism-adjacent industrial zones puts real traffic on a gate. We service gates, access control, and cameras for that volume, and we schedule the visit from Clermont.',
    localContext:
      'From downtown Orlando to Lake Nona, MetroWest, and Dr. Phillips, properties span gated communities, multi-tenant offices, storage portfolios, and estate properties. Orlando visits are scheduled from our Clermont, Lake County headquarters.',
    highlightServices: [
      'gate-repair',
      'maintenance-plans',
      'security-gate-systems',
      'gate-automation',
      'access-control',
      'video-surveillance',
      'security-system-integration',
      'emergency-service',
    ],
    highlightIndustries: [
      'hoa-gated-communities',
      'multifamily-apartments-condos',
      'commercial-properties',
      'storage-facilities',
      'residential-estates',
    ],
    nearby: ['kissimmee', 'winter-garden', 'clermont'],
    keywords: [
      'Orlando security systems',
      'Orlando gate installation',
      'Orlando access control',
      'Orlando security cameras',
    ],
  },
  {
    slug: 'tampa',
    city: 'Tampa',
    region: 'Tampa Bay',
    county: 'Hillsborough County',
    metaTitle:
      'Tampa Security Systems | Gates, Access Control & Surveillance',
    metaDescription:
      'Tampa security gate systems, access control, and video surveillance for communities, commercial properties, storage, and industrial sites across Hillsborough County.',
    intro:
      'Tampa concentrates a high density of multifamily, storage, commercial, and industrial properties — each with its own access and surveillance demands. We design integrated security systems engineered for the operational pace of the Tampa Bay region.',
    localContext:
      'From downtown Tampa to Westshore, New Tampa, and the surrounding industrial corridors, the region puts a wide spectrum of demands on security infrastructure — from estate-class entries to high-cycle warehouse gates. Tampa Bay visits are scheduled from our Clermont, Lake County base.',
    highlightServices: [
      'gate-repair',
      'maintenance-plans',
      'security-gate-systems',
      'gate-automation',
      'access-control',
      'video-surveillance',
      'security-system-integration',
      'emergency-service',
    ],
    highlightIndustries: [
      'commercial-properties',
      'industrial-warehouses',
      'multifamily-apartments-condos',
      'storage-facilities',
      'property-managers',
    ],
    nearby: ['st-petersburg', 'clearwater', 'brandon', 'wesley-chapel'],
    keywords: [
      'Tampa security systems',
      'Tampa gate installation',
      'Tampa access control',
      'Tampa security cameras',
    ],
  },
  {
    slug: 'lakeland',
    city: 'Lakeland',
    region: 'Central Florida',
    county: 'Polk County',
    metaTitle:
      'Lakeland Security Gates, Access Control & Cameras',
    metaDescription:
      'Security systems for Lakeland communities, commercial sites, and industrial properties — gate automation, access control, and video surveillance throughout Polk County.',
    intro:
      'Lakeland’s industrial, logistics, and growing community footprint sits at the operational center of the I-4 corridor. We design security systems that match the pace of Polk County properties — credentialed lanes, yard coverage, and integrated community access.',
    localContext:
      'Lakeland mixes long-standing industrial sites with newer residential communities and growing commercial centers. Each property class needs a security system tuned to its operational reality. Polk County visits are scheduled from our Clermont, Lake County base along the I-4 corridor.',
    highlightServices: [
      'gate-repair',
      'maintenance-plans',
      'gate-automation',
      'access-control',
      'video-surveillance',
      'security-system-integration',
      'emergency-service',
    ],
    highlightIndustries: [
      'industrial-warehouses',
      'commercial-properties',
      'hoa-gated-communities',
      'multifamily-apartments-condos',
    ],
    nearby: ['kissimmee', 'clermont', 'tampa', 'brandon'],
    keywords: [
      'Lakeland security systems',
      'Polk County access control',
      'Lakeland gate installation',
    ],
  },
  {
    slug: 'kissimmee',
    city: 'Kissimmee',
    region: 'Central Florida',
    county: 'Osceola County',
    metaTitle:
      'Kissimmee Security Gate, Access Control & Camera Systems',
    metaDescription:
      'Kissimmee security systems for HOAs, gated communities, multifamily, vacation properties, and commercial sites in Osceola County.',
    intro:
      'Kissimmee combines vacation-adjacent residential properties, dense multifamily communities, and commercial corridors. Our security system designs handle the unique credentialing and surveillance demands of properties with high turnover and visitor traffic.',
    localContext:
      'From Celebration to Poinciana, Kissimmee’s properties handle a mix of long-term residents, short-term visitors, and vendor traffic that traditional shared-code systems cannot keep up with.',
    highlightServices: [
      'gate-repair',
      'maintenance-plans',
      'gate-automation',
      'access-control',
      'video-surveillance',
      'security-system-integration',
      'emergency-service',
    ],
    highlightIndustries: [
      'hoa-gated-communities',
      'multifamily-apartments-condos',
      'commercial-properties',
      'residential-estates',
    ],
    nearby: ['orlando', 'winter-garden', 'clermont', 'lakeland'],
    keywords: [
      'Kissimmee security systems',
      'Kissimmee gate installation',
      'Osceola County access control',
    ],
  },
  {
    slug: 'winter-garden',
    city: 'Winter Garden',
    region: 'Central Florida',
    county: 'Orange County',
    metaTitle:
      'Winter Garden Security Systems | Gates, Access Control & Cameras',
    metaDescription:
      'Security gate, access control, and video surveillance for Winter Garden communities, estates, and commercial properties.',
    intro:
      'Winter Garden’s growth corridor and master-planned communities expect security systems that match the architecture and the operational pace of the area.',
    localContext:
      'Horizon West, Winter Garden Village, and the surrounding communities span gated neighborhoods, mixed-use commercial, and high-end residential — each requiring a tailored system.',
    highlightServices: [
      'gate-repair',
      'maintenance-plans',
      'security-gate-systems',
      'gate-automation',
      'access-control',
      'video-surveillance',
      'security-system-integration',
    ],
    highlightIndustries: [
      'hoa-gated-communities',
      'residential-estates',
      'commercial-properties',
      'multifamily-apartments-condos',
    ],
    nearby: ['orlando', 'clermont', 'kissimmee'],
    keywords: [
      'Winter Garden security',
      'Winter Garden gate installation',
      'Horizon West access control',
    ],
  },
  {
    slug: 'clermont',
    city: 'Clermont',
    region: 'Central Florida',
    county: 'Lake County',
    metaTitle:
      'Clermont Security Gate, Access Control & Camera Systems',
    metaDescription:
      'Gate, access control, and camera service in Clermont and Lake County, home base for Florida Security Concepts. We also schedule work in Orlando, Kissimmee, Winter Garden, and Tampa Bay.',
    intro:
      'Clermont, in Lake County, is home base for Florida Security Concepts. From here we service gates, access control, and cameras in Clermont, and we schedule work in Orlando, Kissimmee, Winter Garden, and Tampa Bay.',
    localContext:
      'Clermont and the surrounding Lake County communities are growing fast. A gate, keypad, or camera plan has to fit how the property is used every day. Orlando, Kissimmee, Winter Garden, and Tampa Bay visits are scheduled from this Lake County base.',
    highlightServices: [
      'gate-repair',
      'maintenance-plans',
      'security-gate-systems',
      'gate-automation',
      'access-control',
      'video-surveillance',
      'security-system-integration',
    ],
    highlightIndustries: [
      'hoa-gated-communities',
      'residential-estates',
      'commercial-properties',
      'multifamily-apartments-condos',
    ],
    nearby: ['winter-garden', 'orlando', 'kissimmee', 'lakeland'],
    keywords: [
      'Clermont security systems',
      'Clermont gate installation',
      'Lake County access control',
    ],
  },
  {
    slug: 'st-petersburg',
    city: 'St. Petersburg',
    region: 'Tampa Bay',
    county: 'Pinellas County',
    metaTitle:
      'St. Petersburg Security Systems | Gates, Access Control & Cameras',
    metaDescription:
      'Security gate, access control, and video surveillance for St. Petersburg communities, commercial sites, condos, and industrial properties in Pinellas County.',
    intro:
      'St. Petersburg’s mix of waterfront residential, dense condo, and commercial properties demands security systems that match the property class.',
    localContext:
      'From downtown St. Pete to Snell Isle and the surrounding neighborhoods, properties span estates, condos, multifamily, and commercial sites — each with distinct credential and surveillance needs.',
    highlightServices: [
      'gate-repair',
      'maintenance-plans',
      'security-gate-systems',
      'gate-automation',
      'access-control',
      'video-surveillance',
      'security-system-integration',
    ],
    highlightIndustries: [
      'residential-estates',
      'multifamily-apartments-condos',
      'hoa-gated-communities',
      'commercial-properties',
    ],
    nearby: ['clearwater', 'tampa'],
    keywords: ['St. Petersburg security systems', 'St. Pete access control'],
  },
  {
    slug: 'clearwater',
    city: 'Clearwater',
    region: 'Tampa Bay',
    county: 'Pinellas County',
    metaTitle:
      'Clearwater Security Systems | Gates, Access Control & Cameras',
    metaDescription:
      'Clearwater gate automation, access control, and video surveillance for communities, condos, commercial properties, and estates.',
    intro:
      'Clearwater’s coastal residential, condo, and commercial properties expect security systems that perform reliably under coastal conditions.',
    localContext:
      'From Clearwater Beach to the surrounding commercial corridors, the area mixes high-end residential, condo, and commercial properties — each demanding hardware that handles coastal exposure.',
    highlightServices: [
      'gate-repair',
      'maintenance-plans',
      'security-gate-systems',
      'gate-automation',
      'access-control',
      'video-surveillance',
      'security-system-integration',
    ],
    highlightIndustries: [
      'residential-estates',
      'multifamily-apartments-condos',
      'hoa-gated-communities',
      'commercial-properties',
    ],
    nearby: ['st-petersburg', 'tampa'],
    keywords: ['Clearwater security systems', 'Clearwater gate installation'],
  },
  {
    slug: 'brandon',
    city: 'Brandon',
    region: 'Tampa Bay',
    county: 'Hillsborough County',
    metaTitle:
      'Brandon Security Systems | Gates, Access Control & Cameras',
    metaDescription:
      'Brandon and Valrico security gate, access control, and video surveillance for communities, multifamily, and commercial sites in eastern Hillsborough County.',
    intro:
      'Brandon’s growing communities and commercial corridors expect security systems that scale with the area’s growth.',
    localContext:
      'Brandon, Valrico, and the surrounding eastern Hillsborough corridor mix master-planned communities, multifamily, and commercial centers.',
    highlightServices: [
      'gate-repair',
      'maintenance-plans',
      'gate-automation',
      'access-control',
      'video-surveillance',
      'security-system-integration',
      'emergency-service',
    ],
    highlightIndustries: [
      'hoa-gated-communities',
      'multifamily-apartments-condos',
      'commercial-properties',
      'residential-estates',
    ],
    nearby: ['tampa', 'wesley-chapel', 'lakeland'],
    keywords: ['Brandon security systems', 'Brandon gate installation'],
  },
  {
    slug: 'wesley-chapel',
    city: 'Wesley Chapel',
    region: 'Tampa Bay',
    county: 'Pasco County',
    metaTitle:
      'Wesley Chapel Security Systems | Gates, Access Control & Cameras',
    metaDescription:
      'Security systems for Wesley Chapel communities, multifamily, and commercial properties in Pasco County — gate automation, access control, and video surveillance.',
    intro:
      'Wesley Chapel’s rapidly expanding master-planned communities and commercial corridors expect security infrastructure that grows with the area.',
    localContext:
      'From the I-75 corridor through the surrounding Pasco County communities, properties span gated neighborhoods, multifamily, and commercial centers.',
    highlightServices: [
      'gate-repair',
      'maintenance-plans',
      'security-gate-systems',
      'gate-automation',
      'access-control',
      'video-surveillance',
      'security-system-integration',
    ],
    highlightIndustries: [
      'hoa-gated-communities',
      'multifamily-apartments-condos',
      'residential-estates',
      'commercial-properties',
    ],
    nearby: ['tampa', 'brandon'],
    keywords: ['Wesley Chapel security systems', 'Wesley Chapel gate installation'],
  }
];

export const locationsBySlug: Record<string, Location> = Object.fromEntries(
  locations.map((l) => [l.slug, l])
);

export const getLocation = (slug: string): Location | undefined =>
  locationsBySlug[slug];
