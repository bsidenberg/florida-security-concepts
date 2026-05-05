export type Service = {
  slug: string;
  title: string; // H1
  navLabel: string;
  shortLabel: string;
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  intro: string;
  directAnswer: string; // AEO/GEO direct answer near top
  capabilities: { title: string; body: string }[];
  whoFor: string[];
  process?: { step: string; body: string }[];
  outcomes: string[];
  faqs: { q: string; a: string }[];
  relatedServices: string[]; // slugs
  relatedIndustries: string[]; // slugs
  keywords: string[];
};

export const services: Service[] = [
  {
    slug: 'security-gate-systems',
    title: 'Security Gate System Installation in Central Florida & Tampa Bay',
    navLabel: 'Security Gate Systems',
    shortLabel: 'Security Gates',
    metaTitle:
      'Security Gate System Installation | Central Florida & Tampa Bay',
    metaDescription:
      'Custom security gate systems engineered for HOAs, gated communities, commercial properties, and estates across Central Florida and Tampa Bay. Design, install, integrate.',
    eyebrow: 'Service · Security Gates',
    intro:
      'Security gates are the first physical layer of any controlled-access property. We design, fabricate-source, and install gate systems engineered to handle the traffic patterns, vehicle types, and after-hours access policies of the property — not generic off-the-shelf hardware bolted to a driveway.',
    directAnswer:
      'Florida Security Concepts designs and installs custom security gate systems — slide gates, swing gates, and barrier arms — for HOAs, gated communities, commercial sites, storage facilities, and estate properties across Central Florida and Tampa Bay. Each gate is engineered around the property’s vehicle volume, sight lines, vendor and resident access policies, and integration with access control and surveillance.',
    capabilities: [
      {
        title: 'Slide gates',
        body: 'Cantilever and rolling slide gates for high-traffic entries where overhead clearance and lane geometry require horizontal travel.',
      },
      {
        title: 'Swing gates',
        body: 'Single and dual-leaf swing gates for residential estates, smaller commercial entries, and architecturally sensitive sites.',
      },
      {
        title: 'Barrier arms',
        body: 'High-cycle barrier arm gates for parking control, lot management, and credentialed-only entries.',
      },
      {
        title: 'Custom fabrication sourcing',
        body: 'Ornamental, security-rated, and wind-rated gate panels matched to community standards and Florida code.',
      },
      {
        title: 'Loop and presence detection',
        body: 'Inground vehicle loops, photo eyes, and safety edges integrated with operator logic for code-compliant traffic flow.',
      },
      {
        title: 'Integration-ready hardware',
        body: 'Gate hardware specified to work natively with the access control, intercom, and camera systems on the rest of the property.',
      },
    ],
    whoFor: [
      'HOAs and gated communities replacing aging or undersized gates',
      'Property managers consolidating multiple sites under one standard',
      'Commercial and industrial sites adding controlled vehicle entry',
      'Storage facilities requiring credentialed lane access',
      'Estate properties wanting an architectural, code-compliant entry',
    ],
    process: [
      {
        step: 'Site assessment',
        body: 'On-site review of traffic flow, sight lines, soil and slope, existing infrastructure, and integration points.',
      },
      {
        step: 'System design',
        body: 'Gate type, operator class, safety devices, access control, and intercom selected as one coordinated system.',
      },
      {
        step: 'Installation',
        body: 'Foundation, gate, operator, sensors, and power coordinated to minimize entry downtime.',
      },
      {
        step: 'Commissioning & training',
        body: 'Functional testing, credential setup, and on-site training for property staff or board members.',
      },
    ],
    outcomes: [
      'Controlled vehicle entry with documented access policies',
      'Hardware sized to actual cycle counts — not undersized at install',
      'Reduced after-hours liability for property owners and managers',
      'A clean integration path into access control and cameras',
    ],
    faqs: [
      {
        q: 'How long does a commercial gate installation take?',
        a: 'Most projects complete in one to three weeks from contract to commissioning, depending on permit timing, gate fabrication lead time, and existing site conditions. Re-power and bore work for buried conduit can extend the schedule when the site has no existing entry infrastructure.',
      },
      {
        q: 'Can you replace a gate without replacing the operator?',
        a: 'Sometimes — but only when the existing operator is the correct duty class for the new gate weight, leaf length, and cycle count. We measure and verify before recommending a panel-only replacement, because an undersized operator on a heavier gate is a warranty and safety problem.',
      },
      {
        q: 'Do you handle Florida wind-rated gate panels?',
        a: 'Yes. We specify and install gate panels and posts engineered to the wind loads relevant to the site, including community-standard and code-required ratings.',
      },
    ],
    relatedServices: ['gate-automation', 'access-control', 'security-system-integration'],
    relatedIndustries: [
      'hoa-gated-communities',
      'multifamily-apartments-condos',
      'storage-facilities',
      'commercial-properties',
      'residential-estates',
    ],
    keywords: [
      'security gate systems',
      'custom security gates',
      'commercial gate installation',
      'HOA gates',
      'gated community gate',
      'slide gate installation Florida',
    ],
  },
  {
    slug: 'gate-automation',
    title: 'Automatic Gate Operators & Gate Automation Systems',
    navLabel: 'Gate Automation',
    shortLabel: 'Gate Automation',
    metaTitle:
      'Automatic Gate Operators & Gate Automation',
    metaDescription:
      'Automatic gate operators for slide and swing gates, barrier arms, keypads, and intercoms. Engineered for Central Florida and Tampa Bay communities, commercial sites, and estates.',
    eyebrow: 'Service · Gate Automation',
    intro:
      'A gate is only as reliable as the operator behind it. We size operators to actual gate weight, cycle count, and traffic patterns, then integrate them with the credential and intercom systems your residents, vendors, and emergency responders actually use.',
    directAnswer:
      'Gate automation covers the operators, controllers, safety sensors, and entry devices that move and control a security gate. Florida Security Concepts installs slide gate operators, swing gate operators, barrier arms, keypads, intercoms, and telephone entry — all sized to the property’s real cycle counts and integrated with access control.',
    capabilities: [
      {
        title: 'Slide gate operators',
        body: 'Continuous-duty slide operators sized to actual gate weight and cycle counts — not the smallest unit that fits the budget line.',
      },
      {
        title: 'Swing gate operators',
        body: 'Single and dual swing operators with integrated safety sensing for code-compliant residential and commercial entries.',
      },
      {
        title: 'Barrier arm operators',
        body: 'High-cycle barrier arm operators for parking control, credentialed lots, and tightly managed lane traffic.',
      },
      {
        title: 'Keypads & telephone entry',
        body: 'Resident, vendor, and visitor-friendly entry hardware tied to a single credential database.',
      },
      {
        title: 'Loop detectors & safety devices',
        body: 'Inground loops, photo eyes, and reversing edges configured to UL 325 expectations.',
      },
      {
        title: 'Backup power',
        body: 'Battery backup and surge-protected power sized to keep entries operational during Florida storm events.',
      },
    ],
    whoFor: [
      'Communities outgrowing older single-operator entries',
      'Properties retrofitting after operator failure',
      'Sites adding credentialed access for vendors and residents',
      'Commercial parking and barrier arm applications',
    ],
    outcomes: [
      'Operators sized correctly for the gate they actually move',
      'Safety devices brought current to UL 325 expectations',
      'Reduced service calls from undersized hardware',
      'A clean credential experience for residents, vendors, and visitors',
    ],
    faqs: [
      {
        q: 'What is the difference between a gate operator and an access control system?',
        a: 'The operator physically moves the gate. The access control system decides who is allowed to trigger it — and logs each event. They are designed together so credentials, schedules, and exceptions behave the same way at every entry.',
      },
      {
        q: 'How do I know if my operator is the wrong size?',
        a: 'If the operator runs hot, repeatedly trips on safety, fails after short service life, or struggles in heat or storm conditions, it is usually undersized for the gate weight or cycle count. We measure both before recommending a replacement class.',
      },
      {
        q: 'Do you install operators behind existing gates?',
        a: 'Yes — when the existing gate is structurally sound and rated to be automated. We inspect rollers, posts, hinges, and panel weight before quoting an operator-only retrofit.',
      },
    ],
    relatedServices: [
      'security-gate-systems',
      'access-control',
      'security-system-integration',
      'emergency-service',
    ],
    relatedIndustries: [
      'hoa-gated-communities',
      'multifamily-apartments-condos',
      'storage-facilities',
      'commercial-properties',
      'industrial-warehouses',
      'residential-estates',
    ],
    keywords: [
      'automatic gate operators',
      'gate automation',
      'slide gate operator',
      'swing gate operator',
      'barrier arm gate',
      'keypad entry gate',
    ],
  },
  {
    slug: 'access-control',
    title: 'Access Control Systems for Gates, Doors & Commercial Properties',
    navLabel: 'Access Control',
    shortLabel: 'Access Control',
    metaTitle:
      'Access Control Systems | Card Readers, Keypads, Mobile Credentials',
    metaDescription:
      'Access control systems for gates, doors, and commercial properties — card readers, keypads, mobile credentials, telephone entry, and visitor management. Central Florida & Tampa Bay.',
    eyebrow: 'Service · Access Control',
    intro:
      'Access control is the credential, schedule, and audit layer behind every gate and door. We design systems that handle residents, employees, vendors, and visitors as distinct populations with distinct rules — not one shared code on a sticky note.',
    directAnswer:
      'Access control systems decide who can enter a property, when, and from which entry point — and log each event. Florida Security Concepts installs card readers, keypads, mobile credentials, telephone entry, and visitor and vendor management at gates and doors across Central Florida and Tampa Bay.',
    capabilities: [
      {
        title: 'Card and fob readers',
        body: 'Proximity, smart card, and encrypted credential readers at gates, doors, garages, and amenity spaces.',
      },
      {
        title: 'Keypad codes',
        body: 'Per-user, per-vendor, and time-windowed codes — eliminating the shared-code-on-a-sticker problem.',
      },
      {
        title: 'Mobile credentials',
        body: 'Phone-based credentials for residents, staff, and approved vendors that can be revoked instantly.',
      },
      {
        title: 'Telephone entry & intercom',
        body: 'Resident-callable entry stations for guests and delivery, with directory and call-routing tied to the credential database.',
      },
      {
        title: 'Visitor & vendor management',
        body: 'Time-bound credentials for cleaners, contractors, lawn services, and deliveries — with audit trail.',
      },
      {
        title: 'Schedules & exceptions',
        body: 'Holiday, after-hours, and amenity schedules that match how the property actually operates.',
      },
    ],
    whoFor: [
      'HOAs eliminating shared codes and stale resident lists',
      'Property managers consolidating credentials across multiple sites',
      'Commercial offices replacing key-and-lock turnover',
      'Storage facilities requiring tenant-specific gate access',
    ],
    outcomes: [
      'Per-user accountability at every credentialed entry',
      'Instant revocation when residents move out or staff change',
      'Audit trail for incidents, disputes, and insurance review',
      'A unified credential experience across gates and doors',
    ],
    faqs: [
      {
        q: 'Can residents use their phones instead of cards or fobs?',
        a: 'Yes. Most modern systems support mobile credentials that can be issued, replaced, and revoked instantly — no physical handoff and no re-keying.',
      },
      {
        q: 'Can vendors get access without giving them a permanent code?',
        a: 'Yes. Time-bound credentials let lawn, pool, cleaning, and delivery vendors enter only during their scheduled windows, with each entry logged.',
      },
      {
        q: 'Will access control work with our existing gate hardware?',
        a: 'Often, yes. We verify the operator and existing wiring during the site assessment. When existing hardware is incompatible or unsafe, we surface that before quoting — not after install.',
      },
    ],
    relatedServices: [
      'gate-automation',
      'video-surveillance',
      'security-system-integration',
      'security-gate-systems',
    ],
    relatedIndustries: [
      'hoa-gated-communities',
      'multifamily-apartments-condos',
      'storage-facilities',
      'commercial-properties',
      'industrial-warehouses',
      'property-managers',
    ],
    keywords: [
      'access control systems',
      'card reader installation',
      'keypad access',
      'mobile credentials',
      'telephone entry system',
      'commercial access control Florida',
    ],
  },
  {
    slug: 'video-surveillance',
    title: 'Commercial Video Surveillance & Security Camera Installation',
    navLabel: 'Video Surveillance',
    shortLabel: 'Video Surveillance',
    metaTitle:
      'Commercial Video Surveillance & Security Cameras',
    metaDescription:
      'HD and AI-enabled security camera systems for commercial properties, communities, storage facilities, and industrial sites across Central Florida and Tampa Bay.',
    eyebrow: 'Service · Surveillance',
    intro:
      'Camera systems should answer specific questions — who entered, when, in what vehicle, and what happened next. We design coverage around the actual incidents your property faces, not generic camera counts.',
    directAnswer:
      'Florida Security Concepts designs and installs HD and AI-enabled video surveillance for commercial properties, communities, storage facilities, and industrial sites — including remote monitoring, license plate capture, and 24/7 recording — across Central Florida and Tampa Bay.',
    capabilities: [
      {
        title: 'HD and 4K cameras',
        body: 'Camera classes selected by scene — wide-angle for parking, narrow for plates, and low-light for after-hours coverage.',
      },
      {
        title: 'License plate capture',
        body: 'Dedicated LPR scenes at controlled entries to support investigations and disputes.',
      },
      {
        title: 'AI analytics',
        body: 'Loitering, line-cross, vehicle, and person detection used to filter the recorder — not as an alarm gimmick.',
      },
      {
        title: '24/7 recording',
        body: 'Right-sized storage with retention windows set to match the actual investigative needs of the property.',
      },
      {
        title: 'Remote monitoring',
        body: 'Mobile and desktop access for owners, managers, and approved staff with role-based permissions.',
      },
      {
        title: 'Integration with access control',
        body: 'Camera events linked to door and gate events so a single timeline tells the full story.',
      },
    ],
    whoFor: [
      'Property managers consolidating camera coverage across sites',
      'Storage facilities documenting tenant access',
      'Commercial and industrial sites protecting yards, lots, and loading',
      'Communities investigating after-hours incidents and traffic disputes',
    ],
    outcomes: [
      'Coverage built around real incidents — not arbitrary camera counts',
      'Footage that supports investigations, not just fills storage',
      'Remote visibility for managers and approved stakeholders',
      'A single timeline across cameras, gates, and credentials',
    ],
    faqs: [
      {
        q: 'How long is footage kept?',
        a: 'Retention is sized to investigative needs and storage budget — commonly 30, 60, or 90 days, with longer retention available for specific scenes or industries.',
      },
      {
        q: 'Can cameras read license plates at the gate?',
        a: 'With a dedicated LPR scene, yes. Plate capture requires a camera positioned and tuned for that purpose — a general overview camera will not produce reliable plates.',
      },
      {
        q: 'Will this replace a security guard?',
        a: 'It changes what a guard does. Cameras and analytics surface events; people decide what action to take. Many properties reduce guard hours after deploying a documented camera system.',
      },
    ],
    relatedServices: [
      'access-control',
      'security-system-integration',
      'gate-automation',
      'emergency-service',
    ],
    relatedIndustries: [
      'storage-facilities',
      'commercial-properties',
      'industrial-warehouses',
      'multifamily-apartments-condos',
      'hoa-gated-communities',
    ],
    keywords: [
      'commercial video surveillance',
      'security camera installation',
      'CCTV Florida',
      'AI security cameras',
      'license plate recognition',
      'remote video monitoring',
    ],
  },
  {
    slug: 'security-system-integration',
    title: 'Integrated Security Systems for Properties, Communities & Facilities',
    navLabel: 'System Integration',
    shortLabel: 'System Integration',
    metaTitle:
      'Integrated Security Systems | Gates, Access Control, Cameras, Monitoring',
    metaDescription:
      'End-to-end security system integration — gates, access control, video surveillance, monitoring, and service — engineered as one system for Central Florida and Tampa Bay.',
    eyebrow: 'Service · Integration',
    intro:
      'A property does not have a gate problem, a camera problem, or a credential problem in isolation. It has a security system problem. We design and integrate gates, access control, cameras, monitoring, and ongoing service as one coordinated system.',
    directAnswer:
      'Security system integration combines gate automation, access control, video surveillance, and remote monitoring into a single, coordinated system — instead of three vendors, three credentials, and three timelines. Florida Security Concepts builds and maintains integrated systems across Central Florida and Tampa Bay.',
    capabilities: [
      {
        title: 'Unified credential layer',
        body: 'One credential database across gates, doors, garages, and amenity spaces.',
      },
      {
        title: 'Single timeline',
        body: 'Camera, access, and gate events visible on a single timeline so investigations finish in minutes, not days.',
      },
      {
        title: 'Coordinated installation',
        body: 'Trades sequenced together — power, low voltage, gate, software — instead of fighting each other on site.',
      },
      {
        title: 'Lifecycle service',
        body: 'Ongoing service, firmware updates, and scheduled checks so the system keeps working after install.',
      },
      {
        title: 'Documentation',
        body: 'As-built drawings, credential lists, and operating procedures handed off to property staff.',
      },
    ],
    whoFor: [
      'Communities and properties tired of finger-pointing across vendors',
      'Property managers standardizing across multiple sites',
      'Owners who want one accountable team across the entire system',
    ],
    outcomes: [
      'Fewer vendors and clearer accountability',
      'Faster investigations with a unified event timeline',
      'Lower long-term cost from coordinated lifecycle service',
      'A system that grows with the property instead of being rebuilt',
    ],
    faqs: [
      {
        q: 'Do you replace everything or work with what we have?',
        a: 'We start with what is already on the property. Where existing hardware is sound and integration-ready, we keep it. Where it blocks integration or is at end of life, we surface that with a recommendation, not a forced rip-and-replace.',
      },
      {
        q: 'Can integration happen in phases?',
        a: 'Yes. Many properties integrate gates and credentials first, then video, then monitoring — sequenced around budget cycles and least-disruptive timing.',
      },
    ],
    relatedServices: [
      'gate-automation',
      'access-control',
      'video-surveillance',
      'emergency-service',
      'security-gate-systems',
    ],
    relatedIndustries: [
      'hoa-gated-communities',
      'multifamily-apartments-condos',
      'storage-facilities',
      'commercial-properties',
      'industrial-warehouses',
      'property-managers',
    ],
    keywords: [
      'security system integration',
      'integrated security systems',
      'unified security platform',
      'commercial security integrator Florida',
    ],
  },
  {
    slug: 'emergency-service',
    title: 'Emergency Gate, Access Control & Security System Service',
    navLabel: 'Emergency Service',
    shortLabel: 'Emergency Service',
    metaTitle:
      'Emergency Gate & Security System Service | Same-Day When Available',
    metaDescription:
      '24/7 emergency support for gates, access control, and security systems across Central Florida and Tampa Bay. Same-day service when available. Request emergency response now.',
    eyebrow: 'Service · Emergency',
    intro:
      'A stuck gate, a failed credential database, or a dark camera at 11 PM is an operational emergency. We respond fast, document the failure, and bring the system back to a known-good state — not just the symptom.',
    directAnswer:
      'Florida Security Concepts provides 24/7 emergency response for security gate, access control, and surveillance system failures across Central Florida and Tampa Bay, with same-day service when available. Request emergency service from this page or by calling our service line.',
    capabilities: [
      {
        title: 'Stuck or unresponsive gates',
        body: 'On-site response to gates that will not open, will not close, or are unsafe to operate.',
      },
      {
        title: 'Operator failure',
        body: 'Diagnosis and repair of operator electrical, mechanical, and control failures — with right-sized replacement when needed.',
      },
      {
        title: 'Access control outages',
        body: 'Restoration of credential, schedule, and entry-station service after database, network, or hardware failure.',
      },
      {
        title: 'Camera and recorder failures',
        body: 'Recovery of camera coverage and recording continuity after lightning, power, or hardware events.',
      },
      {
        title: 'Documentation',
        body: 'Each emergency call documented so the property has a record of what failed and why.',
      },
    ],
    whoFor: [
      'Property managers handling after-hours incidents',
      'HOA boards facing a community gate down on a weekend',
      'Commercial sites where a failed entry stops operations',
      'Storage facilities with tenant access disputes mid-event',
    ],
    outcomes: [
      'Fast response — same-day when available',
      'Honest diagnosis instead of repeat callbacks',
      'A system returned to a documented, known-good state',
    ],
    faqs: [
      {
        q: 'How fast can you respond to an emergency?',
        a: 'Same-day response is available when scheduling and travel allow. Severity, distance, and current load determine actual arrival window. Emergency requests are triaged on intake.',
      },
      {
        q: 'Do you service systems you did not install?',
        a: 'Often, yes. We assess the existing system on arrival, document the state, and provide both a fix-now and a fix-right path forward where the install is not up to standard.',
      },
      {
        q: 'What information should I have ready when I call?',
        a: 'Property name and address, gate or system affected, what changed before the failure (storm, power outage, recent service), and your role on the property. The faster we can triage, the faster we can dispatch.',
      },
    ],
    relatedServices: [
      'gate-automation',
      'access-control',
      'video-surveillance',
      'security-system-integration',
    ],
    relatedIndustries: [
      'hoa-gated-communities',
      'multifamily-apartments-condos',
      'storage-facilities',
      'commercial-properties',
      'property-managers',
    ],
    keywords: [
      'emergency gate repair',
      '24/7 security system service',
      'same-day gate service Florida',
      'emergency access control repair',
    ],
  },
];

export const servicesBySlug: Record<string, Service> = Object.fromEntries(
  services.map((s) => [s.slug, s])
);

export const getService = (slug: string): Service | undefined => servicesBySlug[slug];
