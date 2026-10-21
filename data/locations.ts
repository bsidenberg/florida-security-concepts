import type { AdministrativeArea, City } from 'schema-dts';

export type LocationFaq = { q: string; a: string };
export type LocationDetail = { title: string; body: string };
export type LocationLink = { href: string; label: string };

export type Location = {
  slug: string;
  city: string; // canonical display name
  region: 'Central Florida' | 'Tampa Bay';
  county?: string;
  metaTitle: string;
  metaDescription: string;
  /** Overrides the default hero title. */
  heroTitle?: string;
  /** Shorter place name for headings, when the city label is broader than the drive. */
  placeLabel?: string;
  intro: string;
  localContext: string; // 2-3 sentences about local property landscape
  details?: LocationDetail[];
  highlightServices: string[]; // service slugs
  highlightIndustries: string[]; // industry slugs
  nearby: string[]; // location slugs
  relatedLinks?: LocationLink[];
  keywords: string[];
  faqs?: LocationFaq[];
  areaServed?: (City | AdministrativeArea)[];
};

const localServices = [
  'gate-repair',
  'maintenance-plans',
  'security-gate-systems',
  'gate-automation',
  'access-control',
  'video-surveillance',
  'security-system-integration',
];

function lakeCity(name: string): City {
  return {
    '@type': 'City',
    name,
    containedInPlace: { '@type': 'AdministrativeArea', name: 'Lake County, Florida' },
  };
}

function orangeCity(name: string): City {
  return {
    '@type': 'City',
    name,
    containedInPlace: { '@type': 'AdministrativeArea', name: 'Orange County, Florida' },
  };
}

const lakeCountyArea: AdministrativeArea = { '@type': 'AdministrativeArea', name: 'Lake County' };

const bookAnswer =
  'Book a project call through Booqer at https://booqer.ai/shops/florida-security-concepts/book. Available slots are confirmed instantly. The call is an advanced consultation. It does not dispatch a technician. If the gate is down now, call (352) 282-0692. Same-day when available.';

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
    nearby: ['kissimmee', 'winter-garden', 'clermont', 'orange-county'],
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
      'Gate, access control, and camera service for Lakeland communities, commercial sites, and industrial properties.',
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
    slug: 'ocala',
    city: 'Ocala',
    region: 'Central Florida',
    county: 'Marion County',
    metaTitle:
      'Ocala Security Gates, Access Control & Cameras',
    metaDescription:
      'Gate repair, maintenance, access control, and video surveillance for Ocala and Marion County communities, commercial sites, and industrial properties.',
    intro:
      'Ocala and Marion County mix distribution and industrial sites, commercial properties, and gated communities. We repair, maintain, and install the gates, access control, and cameras those properties use every day, and we schedule the visit from Clermont.',
    localContext:
      'From the I-75 corridor to the communities around the city, Ocala properties range from logistics yards and offices to gated neighborhoods and estates. Marion County visits are scheduled from our Clermont, Lake County base.',
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
      'industrial-warehouses',
      'commercial-properties',
      'hoa-gated-communities',
      'residential-estates',
    ],
    nearby: ['clermont', 'orlando', 'wesley-chapel'],
    keywords: [
      'Ocala security systems',
      'Ocala gate repair',
      'Marion County access control',
      'Ocala security cameras',
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
      'Winter Garden Gates, Access Control & Cameras',
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
    nearby: ['orlando', 'clermont', 'kissimmee', 'orange-county', 'montverde', 'minneola'],
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
      'Gate, access control, and camera service in Clermont and Lake County, home base for Florida Security Concepts.',
    intro:
      'Clermont, in Lake County, is home base for Florida Security Concepts. From here we service gates, access control, and cameras in Clermont, and we schedule work in Orlando, Kissimmee, Winter Garden, and Tampa Bay.',
    localContext:
      'Clermont and the surrounding Lake County communities are growing fast. A gate, keypad, or camera plan has to fit how the property is used every day. Minneola, Montverde, and Groveland are the neighboring Lake County areas we schedule from here. West Orange County, toward Winter Garden, is the next drive east. Orlando, Kissimmee, and Tampa Bay visits are scheduled from this Lake County base.',
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
    nearby: ['minneola', 'montverde', 'groveland', 'orange-county', 'winter-garden', 'orlando', 'kissimmee', 'lakeland'],
    keywords: [
      'Clermont security systems',
      'Clermont gate installation',
      'Lake County access control',
    ],
  },
  {
    slug: 'montverde',
    city: 'Montverde',
    region: 'Central Florida',
    county: 'Lake County',
    metaTitle: 'Montverde Security Gate, Access Control & Camera Systems',
    metaDescription:
      'Gate repair, operators, and access control in Montverde, FL. Estate and acreage entries near Lake Apopka and County Road 455. Scheduled from Clermont.',
    intro:
      'Florida Security Concepts repairs gates and services access control in Montverde, FL. We are based in Clermont, a short drive away. Montverde entries are often estate drives, acreage parcels, and community gates along County Road 455, with Lake Apopka to the east.',
    localContext:
      'County Road 455 (CR 455) runs through Montverde. Lake Apopka is immediately east, and the Orange County line toward Oakland and Winter Garden is close. Properties mix gated community entries, private drives on larger lots, and rural parcels, including agricultural land. A long swing gate on a grade and a community leaf that cycles for residents and vendors are both ordinary calls here. We schedule the visit from Clermont.',
    details: [
      {
        title: 'Lake Apopka and County Road 455',
        body: 'Montverde sits on the west side of Lake Apopka. Wind across the lake and a drive that is not flat show up on swing gates here. Tell us if the leaf misses the latch, drags, or only faults on a hot afternoon.',
      },
      {
        title: 'Estates, acreage, and rural parcels',
        body: 'Many Montverde properties are larger lots. The operator may sit well back from the road, on a long run of power and low-voltage wire. We look at that run, the leaf, and the safety devices before we treat the stop as a failed motor.',
      },
      {
        title: 'Community entries',
        body: 'Gated HOA entries in and around Montverde still need resident, guest, and vendor access. We repair the gate and, when the property needs it, the keypad, reader, or callbox that opens it.',
      },
    ],
    highlightServices: localServices,
    highlightIndustries: ['hoa-gated-communities', 'residential-estates', 'commercial-properties'],
    nearby: ['clermont', 'minneola', 'groveland', 'orange-county', 'winter-garden'],
    relatedLinks: [
      { href: '/gate-repair/clermont-fl', label: 'Gate repair in Clermont and Lake County' },
      { href: '/service-areas/lake-county-fl', label: 'Lake County gate operator repair' },
      { href: '/services/gate-repair', label: 'How a gate repair visit works' },
    ],
    keywords: [
      'Montverde gate repair',
      'gate repair Montverde FL',
      'Montverde access control',
      'Lake Apopka gate service',
    ],
    faqs: [
      {
        q: 'Who repairs gates in Montverde, FL?',
        a: 'Florida Security Concepts repairs swing, slide, barrier-arm, and vertical-lift gates in Montverde, scheduled from Clermont. Call (352) 282-0692 if the gate is down. Same-day when available. The contact form does not send a technician.',
      },
      {
        q: 'What kinds of Montverde properties do you work on?',
        a: 'Gated community entries, estate and acreage drives, and rural parcels near Lake Apopka and County Road 455, including agricultural land. We also service commercial entries in the area we schedule from Clermont.',
      },
      {
        q: 'Which services are available in Montverde?',
        a: 'Gate repair, gate operators, access control (keypads, readers, and telephone entry), cameras, and maintenance. The work follows the equipment on that property. In Lake County we also service LiftMaster CSL slide gate operators and CellGate WXL callboxes when those are the units on the entrance.',
      },
      {
        q: 'What should I tell you about a Montverde gate?',
        a: 'The city, whether the gate is stuck open, stuck closed, or stopping halfway, and whether it is a swing, slide, barrier, or vertical-lift gate. Say if it started after a storm or only in the afternoon heat. You do not need the model number to start.',
      },
      {
        q: 'How do I book an advanced consultation for a Montverde property?',
        a: bookAnswer,
      },
    ],
    areaServed: [lakeCity('Montverde'), lakeCountyArea],
  },
  {
    slug: 'minneola',
    city: 'Minneola',
    region: 'Central Florida',
    county: 'Lake County',
    metaTitle: 'Minneola Security Gate, Access Control & Camera Systems',
    metaDescription:
      'Gate repair, operators, and access control in Minneola, FL. Community and commercial entries along US 27 and the Clermont border near Hancock Road.',
    intro:
      'Florida Security Concepts repairs gates and services access control in Minneola, FL, from our base next door in Clermont. The calls are along US 27 and the Minneola and Clermont border, including the Hancock Road area: newer community entries, private drives, and commercial gates.',
    localContext:
      'US 27 is the highway through Minneola. Along it, and near Hancock Road where Minneola meets Clermont, newer gated sections sit next to commercial lots and storage. The ground rolls. A swing gate that closed cleanly when the fill was fresh can drag or miss the latch after the ground settles, and an operator in afternoon sun on a busy community lane runs hotter than it did on opening day. We repair the gate that is there. Access control and cameras are part of the same visit when the entry needs them.',
    details: [
      {
        title: 'US 27',
        body: 'Community and commercial traffic on US 27 is a heavier cycle count than a quiet private drive. If the gate only faults in the afternoon, after school traffic and vendors, say so. That pattern points at heat and duty cycle.',
      },
      {
        title: 'The Clermont border and Hancock Road',
        body: 'A lot of newer entries are on the Minneola and Clermont line, including the Hancock Road area. Landscaping and irrigation added after the gate often put water and plants into the operator housing and the photo eyes.',
      },
      {
        title: 'Newer community gates',
        body: 'Settling fill changes limits and latch geometry. When the ground has moved, we check the hinge, the latch, and the leaf alignment, then reset the limits to where the leaf actually travels.',
      },
    ],
    highlightServices: localServices,
    highlightIndustries: [
      'hoa-gated-communities',
      'residential-estates',
      'commercial-properties',
      'storage-facilities',
    ],
    nearby: ['clermont', 'groveland', 'montverde', 'winter-garden', 'orange-county'],
    relatedLinks: [
      { href: '/gate-repair/minneola-fl', label: 'Gate repair in Minneola' },
      { href: '/services/access-control', label: 'Access control' },
      { href: '/services/gate-repair', label: 'How a gate repair visit works' },
    ],
    keywords: [
      'Minneola gate repair',
      'gate repair Minneola FL',
      'Minneola access control',
      'Hancock Road gate repair',
    ],
    faqs: [
      {
        q: 'Who does gate repair in Minneola, FL?',
        a: 'Florida Security Concepts repairs gates and gate operators in Minneola, scheduled from Clermont. Call (352) 282-0692 if the gate is down. Same-day when available. The contact form does not send a technician.',
      },
      {
        q: 'Do you work on Minneola HOA and commercial gates?',
        a: 'Yes. Minneola work includes gated community entries, private drives, and commercial or storage gates along US 27 and near Hancock Road on the Clermont border. We work with property managers and HOA boards on the gate, the credentials, and the cameras.',
      },
      {
        q: 'Do you install operators and access control in Minneola, or only repair gates?',
        a: 'Both. We repair swing, slide, barrier-arm, and vertical-lift gates, and we install operators, keypads, readers, telephone entry, and cameras when the property needs them. We service LiftMaster CSL slide gate operators and CellGate WXL callboxes when those are the units on the entrance.',
      },
      {
        q: 'What should I check before calling about a Minneola gate?',
        a: 'Note whether it fails opening, closing, or mid-travel, and whether that happens in the afternoon or after rain. Look at the swing path or slide track for sand or a leaf rubbing the uphill side. Check the photo eyes for spray or a bumped bracket, and leave them connected. Say whether anyone used the manual release.',
      },
      {
        q: 'How do I schedule Minneola service?',
        a: bookAnswer,
      },
    ],
    areaServed: [lakeCity('Minneola'), lakeCountyArea],
  },
  {
    slug: 'groveland',
    city: 'Groveland',
    region: 'Central Florida',
    county: 'Lake County',
    metaTitle: 'Groveland Security Gate, Access Control & Camera Systems',
    metaDescription:
      'Gate repair and access control in Groveland, FL. Newer subdivisions and rural gates along State Road 50 and State Road 19. Scheduled from Clermont.',
    intro:
      'Florida Security Concepts repairs gates and services access control in Groveland, FL. We schedule the drive from Clermont, west on State Road 50. Groveland gates range from newer subdivision entries to long rural drives and farm or ranch gates.',
    localContext:
      'State Road 50 (SR 50) is the east-west road into Groveland, and State Road 19 (SR 19) runs north-south through town. Newer subdivisions sit next to rural and agricultural land. A community swing gate and a heavy ranch leaf fail for different reasons. On a long rural drive the operator may be on a battery, solar, or a long wire run, and summer storms are hard on that power. We repair swing, slide, and vertical-lift operators, including LiftMaster CSL slide operators and CellGate WXL callboxes when those are the units on the property, and we repair fence gates that sag, drag, or will not latch.',
    details: [
      {
        title: 'State Road 50 and State Road 19',
        body: 'SR 50 connects Groveland to Clermont. SR 19 runs through town toward the rural land north and south of the highway. Tell us which road the entrance is on, and which gate it is if the property has more than one.',
      },
      {
        title: 'Newer subdivisions',
        body: 'Newer Groveland sections have community swing gates and private-drive operators that see school traffic, vendors, and residents. An operator that was quiet at opening can run hot once the section fills in. The visit compares the operator class with how often the lane actually cycles.',
      },
      {
        title: 'Rural, farm, and ranch gates',
        body: 'A wide farm or ranch leaf that has dropped on its hinges drags and trips the operator. Power at the end of a long run, a tired battery, or a solar panel covered in dust can stop a gate that still has a healthy motor. We check power and the leaf before we replace a board.',
      },
    ],
    highlightServices: localServices,
    highlightIndustries: ['hoa-gated-communities', 'residential-estates', 'commercial-properties'],
    nearby: ['clermont', 'minneola', 'montverde', 'orange-county'],
    relatedLinks: [
      { href: '/gate-repair/groveland-fl', label: 'Gate repair in Groveland' },
      { href: '/service-areas/lake-county-fl', label: 'Lake County gate operator repair' },
      { href: '/services/gate-repair', label: 'How a gate repair visit works' },
    ],
    keywords: [
      'Groveland gate repair',
      'gate repair Groveland FL',
      'Groveland access control',
      'SR 50 gate repair',
    ],
    faqs: [
      {
        q: 'Who does gate repair in Groveland, FL?',
        a: 'Florida Security Concepts repairs gates, gate operators, and fence gates in Groveland, scheduled from Clermont. Call (352) 282-0692 if the gate is down. Same-day when available. The contact form does not send a technician.',
      },
      {
        q: 'What kinds of Groveland gates do you service?',
        a: 'Newer subdivision entries, long rural drives, farm and ranch gates, and commercial entries along State Road 50 and State Road 19. We repair swing, slide, and vertical-lift operators, and fence gates that sag, drag, or will not latch.',
      },
      {
        q: 'Do you work on solar, battery, or long power runs in Groveland?',
        a: 'Yes, when that is how the gate is powered. A storm, a tired battery, or a dusty solar panel can leave the operator too weak to finish a cycle. We check power before we replace a board. We also service LiftMaster CSL slide operators and CellGate WXL callboxes when those are the units on the property.',
      },
      {
        q: 'Do you install access control and cameras in Groveland?',
        a: 'Yes. Gate repair is the usual first call. Keypads, readers, telephone entry, cameras, and maintenance are available for the same properties. Book an advanced consultation when the gate is still usable and you want to talk through the work.',
      },
      {
        q: 'How do I book an advanced consultation for a Groveland gate?',
        a: bookAnswer,
      },
    ],
    areaServed: [lakeCity('Groveland'), lakeCountyArea],
  },
  {
    slug: 'orange-county',
    city: 'Orange County',
    region: 'Central Florida',
    county: 'Orange County',
    metaTitle: 'West Orange County Gate Repair, Access Control & Cameras',
    metaDescription:
      'Gate repair and access control in west Orange County, near Winter Garden, Windermere, and Ocoee. Gated HOA entries, scheduled from Clermont.',
    heroTitle: 'Gate Repair, Access Control & Cameras in West Orange County',
    placeLabel: 'west Orange County',
    intro:
      'Florida Security Concepts schedules west Orange County from Clermont, in neighboring Lake County. This page is for properties near Winter Garden, Windermere, and Ocoee, where gated HOA entries are common. Orlando has its own page. Tell us the city and we will confirm the drive.',
    localContext:
      'West Orange County here means the communities along the Lake County line: Winter Garden and Horizon West, Windermere, and Ocoee. State Road 50 runs through Ocoee and Winter Garden toward Clermont. State Road 429, the Western Beltway, runs through this side of the county. Many entries are gated HOA lanes. Some are estate gates on the lakes around Windermere. Newer sections often have ornamental leaves and operators sized for opening day. An older swing gate closer to downtown Winter Garden is different hardware. Tell us which one you have.',
    details: [
      {
        title: 'Gated HOA communities',
        body: 'Winter Garden, Horizon West, Windermere, and Ocoee include many gated communities. Once the leaf moves again, resident, guest, and vendor access is usually the next question. We repair the operator and the keypad, reader, or telephone entry that opens it.',
      },
      {
        title: 'State Road 50 and State Road 429',
        body: 'State Road 50 connects Ocoee and Winter Garden with Clermont. State Road 429 carries traffic through west Orange. A community lane near those roads cycles harder than a private drive. If the gate stops on hot afternoons, that pattern matters.',
      },
      {
        title: 'Confirming the city',
        body: 'Orlando and Kissimmee have their own pages. If the property is outside Winter Garden, Windermere, Ocoee, and the communities between them and Clermont, tell us the city. We will say whether we can schedule it from Clermont.',
      },
    ],
    highlightServices: localServices,
    highlightIndustries: [
      'hoa-gated-communities',
      'residential-estates',
      'commercial-properties',
      'multifamily-apartments-condos',
    ],
    nearby: ['winter-garden', 'clermont', 'orlando', 'montverde', 'minneola'],
    relatedLinks: [
      { href: '/service-areas/winter-garden', label: 'Winter Garden' },
      { href: '/gate-repair/winter-garden-fl', label: 'Gate repair in Winter Garden' },
      { href: '/service-areas/orlando', label: 'Orlando' },
      { href: '/services/gate-repair', label: 'How a gate repair visit works' },
    ],
    keywords: [
      'Orange County gate repair',
      'west Orange County gate repair',
      'Windermere gate repair',
      'Ocoee access control',
      'Winter Garden gate service',
    ],
    faqs: [
      {
        q: 'Does Florida Security Concepts serve Orange County?',
        a: 'We schedule west Orange County from Clermont: Winter Garden, Windermere, Ocoee, and the gated communities around them, including Horizon West. Orlando has its own page. Call (352) 282-0692 or book an advanced consultation and tell us the city so we can confirm the drive.',
      },
      {
        q: 'Who repairs gates near Winter Garden, Windermere, and Ocoee?',
        a: 'Florida Security Concepts. The Winter Garden gate repair page covers that city in more detail. On the surrounding west Orange entries we repair operators, leaves, loops, and photo eyes, and we service the access control that opens the gate.',
      },
      {
        q: 'What properties are typical in west Orange County?',
        a: 'Gated HOA communities, estate entries, and multifamily and commercial sites. Newer sections often have ornamental leaves. Older gates closer to downtown Winter Garden are a different piece of hardware. The consultation is about the entrance you have.',
      },
      {
        q: 'Do you install access control and cameras in west Orange County, or only repair gates?',
        a: 'Both. Gate repair, operators, keypads and telephone entry, cameras, and maintenance are the services we list. The visit is scoped to the equipment on that property. Book an advanced consultation when the lane is still usable.',
      },
      {
        q: 'How is a west Orange gate different from a Clermont gate?',
        a: 'Clermont and the Lake County ridge bring hills, lake wind, and sand in the track. West Orange is often a gated HOA lane, fill that has settled in a newer section, and landscaping that has grown into the swing path or the photo eyes. The visit still starts with the leaf and the safety devices.',
      },
      {
        q: 'How do I schedule service in west Orange County?',
        a: bookAnswer,
      },
    ],
    areaServed: [
      { '@type': 'AdministrativeArea', name: 'Orange County', containedInPlace: { '@type': 'State', name: 'Florida' } },
      orangeCity('Winter Garden'),
      orangeCity('Windermere'),
      orangeCity('Ocoee'),
    ],
  },
  {
    slug: 'st-petersburg',
    city: 'St. Petersburg',
    region: 'Tampa Bay',
    county: 'Pinellas County',
    metaTitle:
      'St. Petersburg Gates & Access Control',
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
      'Wesley Chapel Gates & Access Control',
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
