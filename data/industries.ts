export type Industry = {
  slug: string;
  title: string; // H1
  navLabel: string;
  shortLabel: string;
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  intro: string;
  directAnswer: string;
  pains: { title: string; body: string }[];
  recommendedServices: string[]; // service slugs
  recommendedReason: string;
  keyConsiderations: { title: string; body: string }[];
  faqs: { q: string; a: string }[];
  keywords: string[];
};

export const industries: Industry[] = [
  {
    slug: 'hoa-gated-communities',
    title: 'HOA Gate Access Control & Security Systems',
    navLabel: 'HOAs & Gated Communities',
    shortLabel: 'HOAs & Gated Communities',
    metaTitle:
      'HOA Gate, Access Control & Security Systems | Florida Security Concepts',
    metaDescription:
      'Security systems for HOAs and gated communities — gate automation, resident credentials, vendor access, video surveillance, and integrated property security across Central Florida and Tampa Bay.',
    eyebrow: 'Industry · HOAs & Gated Communities',
    intro:
      'A gated community is a credential and traffic system before it is anything else. Residents, vendors, deliveries, guests, contractors, and emergency responders all need to enter — under different rules, on different schedules, with different accountability.',
    directAnswer:
      'Florida Security Concepts designs and integrates gate automation, access control, and video surveillance for HOAs and gated communities across Central Florida and Tampa Bay — including resident credentials, time-bound vendor access, telephone entry, and incident-grade camera coverage at the gate.',
    pains: [
      {
        title: 'Shared codes that never get changed',
        body: 'One community-wide code becomes a security problem the moment it leaves the community.',
      },
      {
        title: 'Stale resident lists',
        body: 'Move-outs, sales, and renters keep credentials valid long after they should be revoked.',
      },
      {
        title: 'Vendor and delivery chaos',
        body: 'Lawn, pool, cleaning, and delivery vehicles arriving without time-bound credentials or audit trail.',
      },
      {
        title: 'After-hours incidents with no footage',
        body: 'Cameras that look impressive but cannot resolve a license plate or identify a person at the gate.',
      },
    ],
    recommendedServices: [
      'security-gate-systems',
      'gate-automation',
      'access-control',
      'video-surveillance',
      'security-system-integration',
      'emergency-service',
    ],
    recommendedReason:
      'Communities benefit most from a single integrated system — one credential database, one event timeline, one accountable team — instead of three separate vendors that meet at the gate post.',
    keyConsiderations: [
      {
        title: 'Resident, vendor, guest, and emergency populations',
        body: 'Each population needs its own credential class, schedule, and audit policy.',
      },
      {
        title: 'Board turnover',
        body: 'Documentation and a stable service relationship outlast any single board cycle.',
      },
      {
        title: 'Florida weather',
        body: 'Operators, power, and cameras specified for storm conditions and lightning exposure.',
      },
    ],
    faqs: [
      {
        q: 'Can residents use mobile credentials instead of fobs?',
        a: 'Yes. Mobile credentials are typically the lowest-friction option for residents and the easiest to revoke when residents move out or change.',
      },
      {
        q: 'How do we handle lawn, pool, and cleaning vendors?',
        a: 'Time-bound credentials let each vendor enter only during their scheduled windows, with each entry logged. Shared codes are eliminated.',
      },
      {
        q: 'Do you work with the property management company directly?',
        a: 'Yes. Most communities prefer that operations, billing, and escalation route through their management company, with the board involved at decision points.',
      },
    ],
    keywords: [
      'HOA security systems',
      'gated community access control',
      'community gate automation',
      'HOA video surveillance',
      'resident credentials HOA',
    ],
  },
  {
    slug: 'multifamily-apartments-condos',
    title: 'Security Gate, Access Control & Camera Systems for Apartments and Condos',
    navLabel: 'Multifamily / Apartments / Condos',
    shortLabel: 'Multifamily',
    metaTitle:
      'Multifamily Security Systems | Apartments & Condos | Florida Security Concepts',
    metaDescription:
      'Gate automation, access control, video surveillance, and integrated security for apartment communities and condominiums in Central Florida and Tampa Bay.',
    eyebrow: 'Industry · Multifamily',
    intro:
      'Apartments and condos move faster than any other property type — turnover, staff changes, vendor rotation, and amenity scheduling all happen monthly. Security systems have to keep up without becoming a leasing-office burden.',
    directAnswer:
      'Florida Security Concepts builds gate, access control, and surveillance systems for apartment communities and condominiums — engineered around resident turnover, vendor rotation, amenity access, and incident documentation — across Central Florida and Tampa Bay.',
    pains: [
      {
        title: 'High resident turnover',
        body: 'Move-outs and new leases require fast credential changes without leasing-office friction.',
      },
      {
        title: 'Amenity access',
        body: 'Pool, gym, mail, and clubhouse access need different rules than the front gate.',
      },
      {
        title: 'Package and delivery volume',
        body: 'Delivery surges create credentialing and footage requirements traditional systems do not handle.',
      },
      {
        title: 'Incident documentation',
        body: 'Disputes, claims, and after-hours incidents require usable footage — not just any footage.',
      },
    ],
    recommendedServices: [
      'gate-automation',
      'access-control',
      'video-surveillance',
      'security-system-integration',
      'emergency-service',
    ],
    recommendedReason:
      'Multifamily properties get more value from an integrated platform than from any single product — credentials, cameras, and gates need to behave consistently across leasing, amenities, and entries.',
    keyConsiderations: [
      {
        title: 'Leasing-office workflow',
        body: 'Credential issue and revoke must be a routine task, not an IT project.',
      },
      {
        title: 'Amenity scheduling',
        body: 'After-hours pool and gym access policies should be enforced by the system, not by a posted sign.',
      },
      {
        title: 'Resident experience',
        body: 'Residents will route around any system that adds friction — the system has to be easier than the workaround.',
      },
    ],
    faqs: [
      {
        q: 'How fast can a leasing office issue or revoke credentials?',
        a: 'In a properly deployed system, this is a sub-minute task — issue, assign, and notify the resident or revoke and confirm.',
      },
      {
        q: 'Can we use one system across multiple properties?',
        a: 'Yes. Multi-property credentialing and reporting is one of the most common reasons property managers consolidate vendors.',
      },
    ],
    keywords: [
      'apartment security systems',
      'condo access control',
      'multifamily video surveillance',
      'apartment gate automation',
    ],
  },
  {
    slug: 'storage-facilities',
    title: 'Storage Facility Security Camera & Access Control Systems',
    navLabel: 'Storage Facilities',
    shortLabel: 'Storage Facilities',
    metaTitle:
      'Storage Facility Security | Cameras & Access Control | Florida Security Concepts',
    metaDescription:
      'Security camera, gate, and access control systems for self-storage facilities in Central Florida and Tampa Bay — tenant credentials, 24/7 recording, remote monitoring.',
    eyebrow: 'Industry · Storage Facilities',
    intro:
      'Storage facilities are credential-heavy properties with thin staff coverage. The system has to behave correctly when no one is on site — and it has to leave a clean evidence trail when something goes wrong.',
    directAnswer:
      'Florida Security Concepts deploys gate access control, video surveillance, remote monitoring, and 24/7 recording for self-storage facilities across Central Florida and Tampa Bay — tenant-specific gate credentials, license-plate-grade entry cameras, and incident-ready footage retention.',
    pains: [
      {
        title: 'Tenant access disputes',
        body: 'Was a tenant on site? When? Through which gate? Footage and access logs need to answer this in minutes.',
      },
      {
        title: 'Off-hours coverage',
        body: 'Most incidents happen when no one is on site — the system has to be self-sufficient.',
      },
      {
        title: 'License plate disputes',
        body: 'A general overview camera will not produce a usable plate — a dedicated LPR scene will.',
      },
      {
        title: 'Multi-site operators',
        body: 'Owners running several facilities need one credential, monitoring, and reporting standard across all of them.',
      },
    ],
    recommendedServices: [
      'access-control',
      'video-surveillance',
      'gate-automation',
      'security-system-integration',
      'emergency-service',
    ],
    recommendedReason:
      'Storage relies more heavily on documented credentials and high-quality footage than almost any other industry — these systems must be specified together.',
    keyConsiderations: [
      {
        title: 'Tenant credential lifecycle',
        body: 'New rentals, late accounts, and move-outs all need clean credential transitions.',
      },
      {
        title: 'Camera scene design',
        body: 'Coverage at gates, hallways, lockers, and exterior corners — each scene tuned to the question it must answer.',
      },
      {
        title: 'Retention windows',
        body: 'Retention sized to investigation and dispute timelines — not just storage cost.',
      },
    ],
    faqs: [
      {
        q: 'Can the gate know if a tenant is past due?',
        a: 'Yes — when the access control system is integrated with the property management software, gate credentials can reflect tenant status automatically.',
      },
      {
        q: 'How long is footage kept?',
        a: 'Retention is sized to facility needs and dispute timelines — commonly 30 to 90 days, with longer retention for high-value scenes.',
      },
    ],
    keywords: [
      'storage facility security cameras',
      'self storage access control',
      'storage gate access',
      'storage license plate camera',
    ],
  },
  {
    slug: 'commercial-properties',
    title: 'Commercial Security Systems for Central Florida & Tampa Bay Properties',
    navLabel: 'Commercial Properties',
    shortLabel: 'Commercial',
    metaTitle:
      'Commercial Security Systems | Central Florida & Tampa Bay | Florida Security Concepts',
    metaDescription:
      'Integrated commercial security systems — gates, access control, video surveillance, and emergency service — for offices, retail, and mixed-use across Central Florida and Tampa Bay.',
    eyebrow: 'Industry · Commercial',
    intro:
      'Commercial properties have the broadest range of security requirements — staff turnover, tenant access, vendor rotation, after-hours operations, and incident documentation — and the highest expectation that the system simply works.',
    directAnswer:
      'Florida Security Concepts designs commercial security systems — gates, access control, video surveillance, and integrated emergency service — for offices, retail, and mixed-use properties across Central Florida and Tampa Bay.',
    pains: [
      {
        title: 'Key-and-lock turnover',
        body: 'Re-keying after every staff change is expensive and incomplete — credentials replace it.',
      },
      {
        title: 'Vendor and tenant overlap',
        body: 'Multiple populations entering the same building with different rules and schedules.',
      },
      {
        title: 'After-hours operations',
        body: 'Cleaning, security, and contractor access policies that need to be enforced, not assumed.',
      },
      {
        title: 'Incident documentation',
        body: 'Insurance, dispute, and investigation requirements drive footage quality and retention.',
      },
    ],
    recommendedServices: [
      'access-control',
      'video-surveillance',
      'security-system-integration',
      'gate-automation',
      'emergency-service',
    ],
    recommendedReason:
      'Commercial properties rarely benefit from single-product purchases. The value compounds when access, video, and gate logic share a credential layer and event timeline.',
    keyConsiderations: [
      {
        title: 'Tenant vs. landlord scope',
        body: 'Clarify which populations and entries fall under landlord vs. tenant responsibility before the system is designed.',
      },
      {
        title: 'Compliance and insurance',
        body: 'Some industries have specific footage retention and access-log requirements — confirm before specifying retention.',
      },
      {
        title: 'Phased deployment',
        body: 'Most commercial deployments make sense in phases — credentials first, video next, integration last.',
      },
    ],
    faqs: [
      {
        q: 'Can you work alongside our existing IT or facilities team?',
        a: 'Yes. We coordinate with internal IT and facilities on networking, power, and change windows. The handoff is structured so internal teams stay in control of policies they already own.',
      },
      {
        q: 'Do you support multiple buildings under one company?',
        a: 'Yes. Multi-site credentialing, reporting, and service standards are one of the strongest reasons commercial owners consolidate vendors.',
      },
    ],
    keywords: [
      'commercial security systems',
      'office access control',
      'commercial video surveillance',
      'commercial gate Florida',
    ],
  },
  {
    slug: 'industrial-warehouses',
    title: 'Industrial Access Control, Gate Automation & Surveillance Systems',
    navLabel: 'Industrial & Warehouses',
    shortLabel: 'Industrial / Warehouse',
    metaTitle:
      'Industrial Security & Warehouse Access Control | Florida Security Concepts',
    metaDescription:
      'Industrial security systems — gate automation, access control, yard surveillance, and credentialed lane entry — for warehouses, yards, and logistics sites in Central Florida and Tampa Bay.',
    eyebrow: 'Industry · Industrial & Warehouse',
    intro:
      'Industrial sites move trucks, drivers, contractors, and material around a clock. Security systems either match that pace or get worked around — there is no middle ground.',
    directAnswer:
      'Florida Security Concepts engineers gate, access control, and surveillance systems for warehouses, yards, and logistics properties — credentialed lane access, driver and contractor management, yard coverage, and integration with operations — across Central Florida and Tampa Bay.',
    pains: [
      {
        title: 'Driver and contractor flow',
        body: 'Drivers, contractors, and dispatched crews need credential and entry policies that match their actual workflow.',
      },
      {
        title: 'Yard coverage',
        body: 'Trailers, equipment, and material in the yard require coverage that overview cameras alone cannot provide.',
      },
      {
        title: 'Lane management',
        body: 'Inbound and outbound lanes, scale lanes, and dock approaches each require their own access logic.',
      },
      {
        title: 'After-hours risk',
        body: 'Industrial properties carry the most after-hours risk — the system has to perform with no one on site.',
      },
    ],
    recommendedServices: [
      'gate-automation',
      'access-control',
      'video-surveillance',
      'security-system-integration',
      'emergency-service',
    ],
    recommendedReason:
      'Industrial properties live or die on integrated logic — credentialed lanes, camera scenes, and access control behaving as one system at the speed of operations.',
    keyConsiderations: [
      {
        title: 'Operations-first design',
        body: 'Security must serve operations, not slow them down — the design starts from the operational workflow.',
      },
      {
        title: 'Hardware duty class',
        body: 'High-cycle gates and barrier arms require continuous-duty hardware — undersized hardware fails fast in this environment.',
      },
      {
        title: 'Documentation',
        body: 'Driver lists, contractor lists, and lane policies need to be documented and version-controlled.',
      },
    ],
    faqs: [
      {
        q: 'Can the system support a 24/7 operation?',
        a: 'Yes — it has to. Hardware, power, and software are specified for 24/7 duty and storm-event resilience.',
      },
      {
        q: 'Can we differentiate between drivers, contractors, and employees?',
        a: 'Yes. Each population can have its own credential class, schedule, and audit policy.',
      },
    ],
    keywords: [
      'industrial access control',
      'warehouse security systems',
      'logistics gate automation',
      'yard surveillance Florida',
    ],
  },
  {
    slug: 'property-managers',
    title: 'Security System Solutions for Property Managers',
    navLabel: 'Property Managers',
    shortLabel: 'Property Managers',
    metaTitle:
      'Security Systems for Property Managers | Multi-Site | Florida Security Concepts',
    metaDescription:
      'Standardized gate, access control, surveillance, and emergency service across multi-site portfolios in Central Florida and Tampa Bay. Built for property management workflows.',
    eyebrow: 'Industry · Property Managers',
    intro:
      'Property managers do not buy a security system — they buy a service relationship. Boards, owners, and tenants all rotate. The security platform and the team behind it have to be the consistent part.',
    directAnswer:
      'Florida Security Concepts works directly with property managers to standardize security across multi-site portfolios — consistent credential platforms, escalation paths, billing structure, and emergency response — across Central Florida and Tampa Bay.',
    pains: [
      {
        title: 'Vendor sprawl',
        body: 'Different gate, camera, and access control vendors at every site means three calls per incident.',
      },
      {
        title: 'Credential chaos',
        body: 'Each site has its own credentials, codes, and badges — none of which transfer when staff move between properties.',
      },
      {
        title: 'Escalation paths',
        body: 'After-hours incidents need a clear, predictable escalation — not a vendor lottery.',
      },
      {
        title: 'Reporting',
        body: 'Boards and owners want consistent reporting across the portfolio, not bespoke reports per site.',
      },
    ],
    recommendedServices: [
      'security-system-integration',
      'access-control',
      'video-surveillance',
      'gate-automation',
      'emergency-service',
    ],
    recommendedReason:
      'Property managers benefit most from standardization — one platform, one escalation path, one accountable team across the portfolio.',
    keyConsiderations: [
      {
        title: 'Standardization vs. site reality',
        body: 'A standard platform with site-specific exceptions is usually more sustainable than a single rigid template.',
      },
      {
        title: 'Board and owner reporting',
        body: 'Consistent reporting across sites makes board meetings and owner reviews shorter and clearer.',
      },
      {
        title: 'Service-level expectations',
        body: 'Documented expectations for emergency response, scheduled checks, and credential turnaround.',
      },
    ],
    faqs: [
      {
        q: 'Do you bill per site or per portfolio?',
        a: 'Both are available. Most managers prefer per-site invoicing with portfolio-level reporting and consolidated escalation paths.',
      },
      {
        q: 'Can you participate in board meetings?',
        a: 'Yes. We can attend board meetings to present system status, recommended changes, and incident review when invited.',
      },
    ],
    keywords: [
      'property manager security',
      'multi-site security systems',
      'portfolio access control',
      'community security manager',
    ],
  },
  {
    slug: 'residential-estates',
    title: 'Estate Gate Automation & Residential Security Systems',
    navLabel: 'Residential Estates',
    shortLabel: 'Estates',
    metaTitle:
      'Estate Gate Automation & Residential Security | Florida Security Concepts',
    metaDescription:
      'Estate-grade gate automation, access control, intercom, and surveillance for high-value residential properties across Central Florida and Tampa Bay.',
    eyebrow: 'Industry · Estates',
    intro:
      'Estate properties want presence, privacy, and reliability in equal measure. The gate sets the tone for the property, and the rest of the security system has to feel as considered as the architecture.',
    directAnswer:
      'Florida Security Concepts designs estate-grade gate automation, access control, intercom, and surveillance systems for high-value residential properties across Central Florida and Tampa Bay — engineered to be both elegant and reliable.',
    pains: [
      {
        title: 'Generic hardware',
        body: 'Off-the-shelf hardware that does not match the architecture or the expectations of the property.',
      },
      {
        title: 'Vendor and delivery access',
        body: 'Time-bound credentials for cleaning, lawn, pool, and delivery — without exposing a permanent code.',
      },
      {
        title: 'Storm reliability',
        body: 'Operators, intercoms, and cameras specified for Florida weather and lightning exposure.',
      },
      {
        title: 'Privacy',
        body: 'Camera and credential platforms that respect homeowner privacy expectations.',
      },
    ],
    recommendedServices: [
      'security-gate-systems',
      'gate-automation',
      'access-control',
      'video-surveillance',
      'security-system-integration',
      'emergency-service',
    ],
    recommendedReason:
      'Estates benefit from a fully integrated, single-vendor platform — one accountable team, one credential layer, one event timeline.',
    keyConsiderations: [
      {
        title: 'Architectural fit',
        body: 'Gate, intercom, and operator selections coordinated with architect, builder, or designer.',
      },
      {
        title: 'Household and staff access',
        body: 'Family, household staff, and visiting guests each handled with appropriate credential classes.',
      },
      {
        title: 'Service relationship',
        body: 'A direct service relationship — not a 1-800 number — is part of the value at this property class.',
      },
    ],
    faqs: [
      {
        q: 'Will the gate hardware match the architecture of the home?',
        a: 'Yes — gate panels, posts, and entry hardware are sourced and specified to match the architectural standard of the property, not generic catalog parts.',
      },
      {
        q: 'How are vendors handled?',
        a: 'Time-bound mobile or code credentials let cleaning, lawn, pool, and delivery vendors enter only during their scheduled windows, with each entry logged.',
      },
    ],
    keywords: [
      'estate gate automation',
      'residential security systems Florida',
      'luxury home security',
      'estate access control',
    ],
  },
];

export const industriesBySlug: Record<string, Industry> = Object.fromEntries(
  industries.map((i) => [i.slug, i])
);

export const getIndustry = (slug: string): Industry | undefined =>
  industriesBySlug[slug];
