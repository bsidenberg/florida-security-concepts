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
  updatedDate: string; // ISO date, e.g. '2026-05-27'
  spotlight?: { title: string; body: string };
};

export const services: Service[] = [
  {
    slug: 'security-gate-systems',
    title: 'Security Gate System Installation Across Florida',
    navLabel: 'Security Gate Systems',
    shortLabel: 'Security Gates',
    metaTitle:
      'Security Gate System Installation | Florida Statewide',
    metaDescription:
      'Slide, swing, barrier-arm, and vertical-lift gates for communities, commercial sites, storage, and estates in Orlando, Kissimmee, Winter Garden, Clermont, and Tampa Bay.',
    eyebrow: 'Service · Security Gates',
    intro:
      'We install the gate that fits the lane. Slide where there is runback, swing where there is an arc, barrier arm where the lane is a control point, and vertical lift where neither a swing nor a slide will fit.',
    directAnswer:
      'We design and install slide gates, swing gates, barrier arms, and vertical-lift gates for communities, commercial sites, storage facilities, and estates in Orlando, Kissimmee, Winter Garden, Clermont, and Tampa Bay. The gate type follows the lane, the vehicle mix, and how people are supposed to enter.',
    spotlight: {
      title: 'Vertical lift gates',
      body: 'A vertical-lift leaf travels straight up between side posts until it clears the vehicles. The lane needs overhead clearance at least the height of the leaf. It does not need a swing arc or a slide runback, so we use it where the driveway is tight on both sides. The operator, the guides, and the counterbalance or lift hardware are sized to the leaf weight. Loops, photo eyes, and the other safety devices still belong on the opening, because vehicles pass under the raised leaf.',
    },
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
        body: 'Barrier arms for parking lanes and credentialed entries. We specify a breakaway bracket so a hit lets the arm swing or pop free instead of bending the operator.',
      },
      {
        title: 'Vertical lift gates',
        body: 'The leaf rises in vertical guides and clears the lane overhead. Used where a swing arc or a slide runback will not fit. Overhead clearance has to match the leaf height.',
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
      'A gate that matches the lane, not a catalog default',
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
    relatedServices: ['gate-repair', 'gate-automation', 'maintenance-plans', 'access-control'],
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
    updatedDate: '2026-05-27',
  },
  {
    slug: 'gate-automation',
    title: 'Automatic Gate Operators & Gate Automation Systems',
    navLabel: 'Gate Automation',
    shortLabel: 'Gate Automation',
    metaTitle:
      'Automatic Gate Operators & Gate Automation',
    metaDescription:
      'Slide, swing, barrier-arm, and vertical-lift operators, with keypads and safety devices, sized to the gate they actually move.',
    eyebrow: 'Service · Gate Automation',
    intro:
      'The operator has to match the gate it moves. We size it to the leaf weight and the cycle count, then connect the keypad, the loops, and the safety devices so the gate opens for the right people and reverses when it should.',
    directAnswer:
      'We install and service slide operators, swing operators, barrier-arm operators, and vertical-lift operators, plus keypads, telephone entry, loops, and photo eyes. The operator class follows the gate weight and how often the lane cycles.',
    spotlight: {
      title: 'Breakaway brackets on barrier arms',
      body: 'A breakaway bracket holds the arm on the operator. When a vehicle hits the arm, the bracket lets the arm swing or pop free of the drive instead of bending the shaft or the gearbox. If the arm itself is not broken, we can often set it back on the bracket and put the lane back in service. A bent arm, a damaged operator, or a bracket that no longer holds still has to be repaired or replaced. After an impact we check the arm, the bracket, and the operator before we decide which of those it is.',
    },
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
        body: 'Operators for parking lanes and credentialed entries, with a breakaway bracket so an impact frees the arm instead of wrecking the drive. The arm can often be reset when it is not bent.',
      },
      {
        title: 'Vertical lift operators',
        body: 'Lift operators and guides sized to the leaf weight, for sites that need the gate to rise instead of swing or slide.',
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
      'gate-repair',
      'security-gate-systems',
      'maintenance-plans',
      'access-control',
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
    updatedDate: '2026-05-27',
  },
  {
    slug: 'gate-repair',
    title: 'Gate Repair for Operators, Leaves, and Safety Devices',
    navLabel: 'Gate Repair',
    shortLabel: 'Gate Repair',
    metaTitle: 'Gate Repair | Operators, Leaves, Loops, and Safety Devices',
    metaDescription:
      'We repair gates that will not open, will not close, or that stop halfway. Operators, hinges, chain, rollers, track, loops, photo eyes, and keypads.',
    eyebrow: 'Service · Gate Repair',
    intro:
      'Gate repair is most of what we do. A gate that will not open, will not close, or that reverses for no clear reason is a lane problem, and we come look at the operator and the leaf before we start swapping parts.',
    directAnswer:
      'We repair swing gates, slide gates, barrier arms, and vertical-lift gates. That includes operators, hinges, chain, rollers and track, loops, photo eyes, keypads, and the wiring that ties them together. We work on gates we installed and on many we did not. Same-day when available. If the gate is stuck now, call (352) 282-0692.',
    capabilities: [
      {
        title: 'Operators that quit',
        body: 'We test the board, the motor, the limits, and the safety inputs. If the operator is the wrong class for the leaf, we say so instead of resetting it and leaving.',
      },
      {
        title: 'Leaves, hinges, chain, rollers, and track',
        body: 'A gate that drags or walks out of line is often a hinge, a chain, a roller, or a track problem. We repair the part that is actually worn.',
      },
      {
        title: 'Loops, photo eyes, and safety devices',
        body: 'A gate that reverses, or that closes on a vehicle, is often a loop or a photo eye. We test those devices before we condemn the operator.',
      },
      {
        title: 'Keypads and entry devices',
        body: 'A keypad that no longer opens the gate, or that opens it for everyone, gets checked against the operator and the credential setup.',
      },
      {
        title: 'Barrier arms after an impact',
        body: 'On a breakaway bracket, the arm often swings or pops free and can be reset if it is not bent. We still inspect the operator before the lane goes back in service.',
      },
      {
        title: 'What we document',
        body: 'You get what failed, what we did, and what we recommend next. We do not invent a price on this page.',
      },
    ],
    whoFor: [
      'A community gate that failed this morning',
      'A commercial lane that stops halfway or reverses',
      'A storage gate the tenants cannot use',
      'A barrier arm that was hit',
      'An operator another company installed',
    ],
    outcomes: [
      'The gate opens and closes the way it should',
      'A clear note of the failed part',
      'A recommendation when the operator is undersized or the leaf is worn out',
    ],
    faqs: [
      {
        q: 'Do you repair gates you did not install?',
        a: 'Yes, when we can get parts and the operator is still serviceable. We look at the equipment on site and tell you if a repair will hold or if the operator needs to be replaced.',
      },
      {
        q: 'What if the gate is stuck right now?',
        a: 'Call (352) 282-0692. Same-day when available. The contact form is for non-urgent requests and does not send a technician.',
      },
      {
        q: 'Can a hit barrier arm be put back?',
        a: 'Often, yes, when it is on a breakaway bracket and the arm is not bent. The bracket lets the arm swing or pop free so the operator shaft takes less of the hit. We reset the arm only after we check the bracket and the operator.',
      },
    ],
    relatedServices: [
      'maintenance-plans',
      'gate-automation',
      'security-gate-systems',
      'emergency-service',
    ],
    relatedIndustries: [
      'hoa-gated-communities',
      'multifamily-apartments-condos',
      'storage-facilities',
      'commercial-properties',
      'industrial-warehouses',
    ],
    keywords: [
      'gate repair',
      'automatic gate repair',
      'gate operator repair',
      'slide gate repair',
      'barrier arm repair',
    ],
    updatedDate: '2026-10-09',
  },
  {
    slug: 'maintenance-plans',
    title: 'Gate Maintenance Plans',
    navLabel: 'Maintenance Plans',
    shortLabel: 'Maintenance Plans',
    metaTitle: 'Gate Maintenance Plans | What We Check',
    metaDescription:
      'Maintenance visits for operators, hinges or chain, rollers and track, loops, photo eyes, keypads, battery backup, fuses, and wiring. Frequency is set per site.',
    eyebrow: 'Service · Maintenance',
    intro:
      'A gate that fails on a Saturday usually showed a small problem weeks earlier. A maintenance plan is the list of things we check on a schedule that fits that site, not a package with a published price.',
    directAnswer:
      'On a maintenance visit we check the operator, the hinges or the chain, the rollers and track, the loops, the photo eyes and other safety devices, the keypad, the battery backup, the fuses, and the grounding and wiring. How often we come is set for that property. A busy commercial lane is not the same schedule as a low-use estate gate.',
    capabilities: [
      {
        title: 'Operators',
        body: 'Limits, force, motor, and control board. We look for heat, oil, and error codes before the operator stops in the lane.',
      },
      {
        title: 'Hinges or chain',
        body: 'Swing gates: hinge wear and leaf alignment. Slide gates: chain tension, sprockets, and stretch.',
      },
      {
        title: 'Rollers and track',
        body: 'Rollers that are flat, a track that is full of debris, or a cantilever that is no longer level.',
      },
      {
        title: 'Loops',
        body: 'Vehicle loops that no longer hold the gate open, or that hold it open all day. We test the detector and the loop itself.',
      },
      {
        title: 'Photo eyes and safety devices',
        body: 'Photo eyes, edges, and the reverse function. A safety device that is taped over or aimed at the wrong place gets corrected.',
      },
      {
        title: 'Keypads',
        body: 'The keypad, the reader, and whether the codes or credentials still match the people who should have them.',
      },
      {
        title: 'Battery backup',
        body: 'Batteries that are swollen, dead, or too small for the operator. We test them under load, not just with a meter at rest.',
      },
      {
        title: 'Fuses, grounding, and wiring',
        body: 'Fuses, grounds, and the low-voltage wiring between the operator, the loops, and the entry devices. Florida storms find a loose ground.',
      },
    ],
    whoFor: [
      'Communities that want the gate checked before it fails',
      'Commercial and storage sites with a daily cycle count',
      'Properties with more than one entry',
      'Boards that need a written record of what was inspected',
    ],
    outcomes: [
      'A written list of what we checked and what we found',
      'Small repairs made on the visit when we can',
      'A schedule that matches how that site is used',
    ],
    faqs: [
      {
        q: 'How often do you come?',
        a: 'We set the frequency for the site. Cycle count, the environment, and how the gate is used decide it. We do not sell one interval to every property.',
      },
      {
        q: 'What is on the checklist?',
        a: 'Operators, hinges or chain, rollers and track, loops, photo eyes and safety devices, keypads, battery backup, fuses, grounding, and wiring.',
      },
      {
        q: 'Is there a published price?',
        a: 'No. The visit depends on the equipment and the schedule. Book an advanced consultation and we will look at the site before we talk about a plan.',
      },
    ],
    relatedServices: ['gate-repair', 'gate-automation', 'access-control', 'security-gate-systems'],
    relatedIndustries: [
      'hoa-gated-communities',
      'multifamily-apartments-condos',
      'storage-facilities',
      'commercial-properties',
      'property-managers',
    ],
    keywords: [
      'gate maintenance plan',
      'preventive gate maintenance',
      'gate operator service',
      'HOA gate maintenance',
    ],
    updatedDate: '2026-10-09',
  },
  {
    slug: 'access-control',
    title: 'Access Control Systems for Gates, Doors & Commercial Properties',
    navLabel: 'Access Control',
    shortLabel: 'Access Control',
    metaTitle:
      'Access Control Systems | Card Readers, Keypads, Mobile Credentials',
    metaDescription:
      'Card readers, keypads, mobile credentials, telephone entry, and visitor management for gates and doors.',
    eyebrow: 'Service · Access Control',
    intro:
      'Access control is the credential, schedule, and audit layer behind every gate and door. We design systems that handle residents, employees, vendors, and visitors as distinct populations with distinct rules — not one shared code on a sticky note.',
    directAnswer:
      'We install card readers, keypads, phone credentials, telephone entry, and visitor access at gates and doors. Each person or vendor gets their own credential, and we can turn one off when they should no longer come in.',
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
        body: 'Holiday, night, and amenity schedules that match how the property actually operates.',
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
        a: 'Often, yes. We check the operator and the existing wiring on site. If the hardware will not work with the credentials, we say that before we install anything.',
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
    updatedDate: '2026-05-27',
  },
  {
    slug: 'video-surveillance',
    title: 'Commercial Video Surveillance & Security Camera Installation',
    navLabel: 'Video Surveillance',
    shortLabel: 'Video Surveillance',
    metaTitle:
      'Commercial Video Surveillance & Security Cameras',
    metaDescription:
      'Security cameras for gates, lanes, lots, and buildings. We aim them at the scene you need to see and set the retention for that property.',
    eyebrow: 'Service · Surveillance',
    intro:
      'We put cameras where you need to see what happened: the gate, the lane, the lot, the building. Plain video. You can pull the recording when something goes wrong.',
    directAnswer:
      'We design and install video surveillance for commercial properties, communities, storage facilities, and industrial sites in Orlando, Kissimmee, Winter Garden, Clermont, and Tampa Bay. Coverage follows the scenes that matter on that property, with retention and remote viewing for the people who should have them.',
    capabilities: [
      {
        title: 'Cameras for the scene',
        body: 'A wide view for a lot, a tighter view for a gate lane, and low-light cameras where the entry is dark. We aim the camera at the thing you need to see.',
      },
      {
        title: 'Gate and lane views',
        body: 'A camera on the entry so the vehicle, the gate, and the keypad are in the picture. We set that view for the lane you have.',
      },
      {
        title: 'Recording and retention',
        body: 'The recorder keeps footage for the window that property actually needs, commonly long enough to answer a dispute. We set that per site.',
      },
      {
        title: 'Remote viewing',
        body: 'The people who should see the cameras can open them from a phone or a computer. Access is limited to those people.',
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
      'Communities that need a recording of the entry when something happens',
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
        q: 'Will the camera show the vehicle at the gate?',
        a: 'If we aim it at the lane, you should see the vehicle and the entry. We set the view for that gate, not a generic overview of the property.',
      },
      {
        q: 'Will this replace a security guard?',
        a: 'No. The cameras record what happened. People still decide what to do with the recording.',
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
      'gate camera',
      'remote video monitoring',
    ],
    updatedDate: '2026-05-27',
  },
  {
    slug: 'security-system-integration',
    title: 'Integrated Security Systems for Properties, Communities & Facilities',
    navLabel: 'System Integration',
    shortLabel: 'System Integration',
    metaTitle:
      'Integrated Security Systems | Gates, Access Control, Cameras, Monitoring',
    metaDescription:
      'Gates, access control, cameras, and service planned as one system, with one team to call.',
    eyebrow: 'Service · Integration',
    intro:
      'A property does not have a gate problem, a camera problem, or a credential problem in isolation. It has a security system problem. We design and integrate gates, access control, cameras, monitoring, and ongoing service as one coordinated system.',
    directAnswer:
      'We connect the gate, the credentials, and the cameras so they work as one entry. One team installs them and one number gets the call when something stops.',
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
    updatedDate: '2026-05-27',
  },
  {
    slug: 'emergency-service',
    title: 'Emergency Gate, Access Control & Security System Service',
    navLabel: 'Emergency Service',
    shortLabel: 'Emergency Service',
    metaTitle:
      'Gate Down? Call Florida Security Concepts',
    metaDescription:
      'If a gate or entry is down, call (352) 282-0692. Same-day when available. The website form does not dispatch a technician.',
    eyebrow: 'Service · Emergency',
    intro:
      'If the gate is stuck or the entry is down, call us. Same-day when available. A website form does not send a technician.',
    directAnswer:
      'Call (352) 282-0692. Tell us the property, which gate, and whether it is stuck open or stuck closed. We come same-day when the schedule and the drive allow. Do not use the contact form for this.',
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
      'A community gate that is stuck',
      'A commercial entry that has stopped the lane',
      'A storage gate tenants cannot use',
      'An operator that failed after a storm',
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
        a: 'Property name and city, which gate, whether it is stuck open or stuck closed, and what changed before it failed. Call (352) 282-0692. The contact form is for everything else.',
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
      'same-day gate service',
      'stuck gate repair',
      'gate operator failure',
    ],
    updatedDate: '2026-05-27',
  },
];

export const servicesBySlug: Record<string, Service> = Object.fromEntries(
  services.map((s) => [s.slug, s])
);

export const getService = (slug: string): Service | undefined => servicesBySlug[slug];
