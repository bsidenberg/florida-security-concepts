// Local gate-repair and access-control pages. Only these five areas.
// Copy is specific to the place. Do not add prices, competitor names,
// street addresses, or 24/7 claims. The Clermont gate-repair page also
// names the Lake County places scheduled from Clermont.

import type { AdministrativeArea, City } from 'schema-dts';
import { lakeCountyOperatorArea } from '@/data/operatorPages';

export type LocalServiceKey = 'gate-repair' | 'access-control' | 'security-cameras';

export type ServedPlace = City | AdministrativeArea;

export type LocalLanding = {
  service: LocalServiceKey;
  slug: string;
  path: string;
  /** Short label used in service-area link lists. */
  areaLabel: string;
  h1: string;
  title: string;
  metaDescription: string;
  eyebrow: string;
  intro: string;
  localContext: string;
  conditionsHeading: string;
  conditions: { title: string; body: string }[];
  beforeYouCall: string[];
  optionsHeading: string;
  options: { title: string; body: string }[];
  serviceType: string;
  areaServed: ServedPlace[];
  /** Service page that should link here. */
  parentServiceSlug: 'gate-automation' | 'access-control' | 'video-surveillance';
  parentServiceLabel: string;
  faqs?: { q: string; a: string }[];
  operatorCoverage?: { title: string; body: string }[];
};

const clermontArea: ServedPlace[] = [
  {
    '@type': 'City',
    name: 'Clermont',
    containedInPlace: { '@type': 'AdministrativeArea', name: 'Lake County, Florida' },
  },
  { '@type': 'AdministrativeArea', name: 'Lake County' },
];

const orlandoArea: ServedPlace[] = [
  {
    '@type': 'City',
    name: 'Orlando',
    containedInPlace: { '@type': 'AdministrativeArea', name: 'Orange County, Florida' },
  },
];

const kissimmeeArea: ServedPlace[] = [
  {
    '@type': 'City',
    name: 'Kissimmee',
    containedInPlace: { '@type': 'AdministrativeArea', name: 'Osceola County, Florida' },
  },
];

const winterGardenArea: ServedPlace[] = [
  {
    '@type': 'City',
    name: 'Winter Garden',
    containedInPlace: { '@type': 'AdministrativeArea', name: 'Orange County, Florida' },
  },
];

const lakeCity = (name: string): ServedPlace => ({
  '@type': 'City',
  name,
  containedInPlace: { '@type': 'AdministrativeArea', name: 'Lake County, Florida' },
});

const minneolaArea: ServedPlace[] = [lakeCity('Minneola'), { '@type': 'AdministrativeArea', name: 'Lake County' }];
const grovelandArea: ServedPlace[] = [lakeCity('Groveland'), { '@type': 'AdministrativeArea', name: 'Lake County' }];

const tampaBayArea: ServedPlace[] = [
  { '@type': 'AdministrativeArea', name: 'Tampa Bay' },
];

export const localLandings: LocalLanding[] = [
  {
    service: 'gate-repair',
    slug: 'clermont-fl',
    path: '/gate-repair/clermont-fl',
    areaLabel: 'Clermont & Lake County',
    h1: 'Gate Repair in Clermont & Lake County, FL',
    title: 'FSC Gate Repair Clermont FL & Lake County',
    metaDescription:
      'Gate operator repair in Clermont and Lake County. Ridge heat, lake wind, and sand in the slide track — what to check before you call.',
    eyebrow: 'Clermont · Lake County, FL',
    intro:
      'Florida Security Concepts is based in Clermont. The gate calls we take in Lake County are rarely a mystery motor. They are operators and leaves that ran fine in spring and start faulting once a south-facing housing heats up, a ridge storm dumps sand into a track, or a swing gate on a sloped drive begins to drag. We service LiftMaster CSL slide gate operators, CellGate WXL callboxes, and swing, slide, and vertical-lift operators. Call (352) 282-0692 if it is down. Same-day when available. After-hours emergency service is by phone. An advanced consultation is how we scope the repair when the lane is not blocked.',
    localContext:
      'South Lake County entries sit on hills, fill, and wind coming off the Clermont chain of lakes. That is a different problem from a flat Orlando apron. Along State Road 50 and US 27, newer master-planned swing gates share the area with older slide gates whose tracks were poured before the landscaping and irrigation grew in. A repair that ignores the slope, the afternoon wind, and the sand in the track comes back after the next storm.',
    conditionsHeading: 'What fails in Lake County heat, storms, and humidity',
    conditions: [
      {
        title: 'Afternoon heat on an exposed operator',
        body: 'West- and south-facing Clermont entries sit in direct sun after noon. A motor that is only marginal at 9 a.m. thermal-faults when the control board is already hot and the leaf is cycling for school traffic and vendors. If the gate misbehaves only late in the day, say so. That pattern points at heat and duty cycle, not a random reset.',
      },
      {
        title: 'Ridge storms and a track full of sand',
        body: 'Storms along the ridge drop a lot of water in a short time. Slide tracks fill with sand and leaf debris, and the operator then works against a leaf that used to roll. Swing gates on a grade can drift past the latch when wind comes off the lake and the closer is tired. Photo eyes aimed across a wet apron false-reverse.',
      },
      {
        title: 'Humidity and irrigation inside the housing',
        body: 'Overspray from Lake County irrigation reaches limit-switch terminals in housings that look clean from the street. The gate travels until a humid morning, then stops mid-stroke. Opening the housing tells you more than another remote press.',
      },
    ],
    beforeYouCall: [
      'Write down whether it fails open, closed, or mid-travel, and whether that started after a storm or only in the heat of the day.',
      'Look at the slide track or the swing path for standing water, sand, or a leaf that is dragging on the uphill side. Do not force it through the bind.',
      'Check the photo eyes for spray, webs, or late-day sun in the beam. Leave the eyes connected.',
      'Find the manual release and note whether someone already used it. A gate left in manual will not tell you what the operator is doing.',
      'Stop repeating the remote or keypad. Extra commands on a hot operator make the next visit slower.',
    ],
    optionsHeading: 'What the repair usually turns out to be',
    options: [
      {
        title: 'Slope and latch, not the keypad',
        body: 'A Clermont swing gate that will not latch is often geometry, a tired closer, or wind on a grade. Replacing the entry device does not pull the leaf back into the catch.',
      },
      {
        title: 'Clear the track before you condemn the operator',
        body: 'Sand and debris after a ridge storm make a healthy slide operator look failed. The useful first step is the path of the leaf, the limits, and whether the operator is actually the wrong duty class for the weight.',
      },
      {
        title: 'Heat faults need a duty-cycle look',
        body: 'If the board only faults when the housing is hot, another reset will not hold through the next afternoon. The visit has to compare the operator class with how often the entrance really cycles.',
      },
    ],
    serviceType: 'Gate repair',
    areaServed: lakeCountyOperatorArea,
    parentServiceSlug: 'gate-automation',
    parentServiceLabel: 'Gate automation',
    operatorCoverage: [
      {
        title: 'LiftMaster CSL, CellGate WXL, swing, slide, and vertical lift',
        body: 'In Clermont, Minneola, Groveland, Montverde, and Winter Garden we service LiftMaster CSL slide gate operators and CellGate WXL callboxes, and we repair swing, slide, and vertical-lift operators. The common symptoms are a gate that will not open, will not close, or stops halfway; an operator that hums or clicks and does not move the leaf; a remote that works when the keypad or callbox does not; a slide gate that grinds; a swing gate that will not latch; and a vertical-lift gate that stops short.',
      },
      {
        title: 'After hours, same-day, and an advanced consultation',
        body: 'After-hours emergency service is by phone at (352) 282-0692. Same-day when available. The website form does not dispatch a technician. An advanced consultation is the project call for an operator that is failing on a pattern rather than blocking the lane right now. Book a project call through Booqer — available slots are confirmed instantly.',
      },
    ],
    faqs: [
      {
        q: 'Who repairs gate operators in Clermont, FL?',
        a: 'Florida Security Concepts repairs gate operators in Clermont, FL, and across Lake County, including Minneola, Groveland, and Montverde, plus Winter Garden. Call (352) 282-0692. Same-day when available. After-hours emergency service is by phone.',
      },
      {
        q: 'Which operators do you service in Clermont and Lake County?',
        a: 'We service LiftMaster CSL slide gate operators, CellGate WXL callboxes, and swing, slide, and vertical-lift operators.',
      },
      {
        q: 'Do you offer after-hours emergency gate repair?',
        a: 'Yes. After-hours emergency service is by phone at (352) 282-0692. Same-day when available. Do not use the website form to request a dispatch.',
      },
      {
        q: 'How do I book an advanced consultation for a Clermont gate?',
        a: 'Book a project call through Booqer at https://booqer.ai/shops/florida-security-concepts/book. Available slots are confirmed instantly. The call is an advanced consultation. It does not dispatch a technician.',
      },
    ],
  },
  {
    service: 'gate-repair',
    slug: 'minneola-fl',
    path: '/gate-repair/minneola-fl',
    areaLabel: 'Minneola',
    h1: 'Gate Repair in Minneola, FL',
    title: 'FSC Gate Repair Minneola FL',
    metaDescription:
      'Gate and gate operator repair in Minneola, scheduled from Clermont. Hill grades, new-build entries, and storm sand in the track. What to check first.',
    eyebrow: 'Minneola · Lake County, FL',
    intro:
      'Florida Security Concepts is based next door in Clermont and schedules Minneola gate repair from there. Most Minneola calls come from newer community entries and private drives on rolling ground north of SR 50: a swing leaf that stopped latching once the fill settled, a slide operator that faults on hot afternoons, or a keypad that works while the gate does not move. We repair swing, slide, and vertical-lift operators and service LiftMaster CSL slide operators and CellGate WXL callboxes. Call (352) 282-0692 if it is down. Same-day when available. An advanced consultation is how we scope a repair when the lane is still open.',
    localContext:
      'Minneola has grown fast, and many entrances went in alongside new roads and fresh fill. Ground that is still settling changes the geometry of a swing gate, and irrigation installed after the gate puts water where the housing was never meant to see it. Hills around Sugarloaf Mountain and the Turnpike corridor mean wind and grade matter more than they do on a flat lot.',
    conditionsHeading: 'What fails at Minneola entrances',
    conditions: [
      {
        title: 'Settling fill on a new-build entry',
        body: 'A gate that closed cleanly the first year starts stopping short or missing the latch. The post or the pad moved, not the operator. Limits set on day one no longer match where the leaf actually travels.',
      },
      {
        title: 'Grade and wind on a swing leaf',
        body: 'Swing gates on a slope work harder in one direction. Add wind and the operator hits its force limit and reverses. It reads as a fault, but the cause is the leaf, the hinge, and the grade.',
      },
      {
        title: 'Irrigation and afternoon heat',
        body: 'Sprinkler spray into a control housing and full afternoon sun on a dark cover lead to intermittent stops that clear by morning. The pattern of when it fails is the clue.',
      },
    ],
    beforeYouCall: [
      'Note whether the gate fails opening, closing, or mid-travel, and whether it only happens in the afternoon or after rain.',
      'Look at the swing path or slide track for sand, debris, or a leaf rubbing on the uphill side. Do not force it.',
      'Check the photo eyes for spray, webs, or a bumped bracket. Leave them connected.',
      'Find out whether anyone used the manual release, and leave it as found until we talk.',
      'Stop cycling the remote or keypad on a hot operator. Each extra try adds heat.',
    ],
    optionsHeading: 'What a Minneola repair usually turns out to be',
    options: [
      {
        title: 'Reset the geometry, then the limits',
        body: 'When the ground moved, the fix is hinge, latch, and leaf alignment first. Resetting limits alone brings the same fault back.',
      },
      {
        title: 'Protect the housing',
        body: 'Redirecting a spray head or sealing an entry point often fixes a stop that looked like a failed board.',
      },
      {
        title: 'Match the operator to the entrance',
        body: 'If a growing community now cycles the gate far more than planned, the visit should say whether the operator class still fits.',
      },
    ],
    serviceType: 'Gate repair',
    areaServed: minneolaArea,
    parentServiceSlug: 'gate-automation',
    parentServiceLabel: 'Gate automation',
    faqs: [
      {
        q: 'Who does gate repair in Minneola, FL?',
        a: 'Florida Security Concepts (FSC) repairs gates and gate operators in Minneola, scheduled from our base in Clermont. Call (352) 282-0692. Same-day when available.',
      },
      {
        q: 'How do I book an advanced consultation for a Minneola gate?',
        a: 'Book a project call through Booqer at https://booqer.ai/shops/florida-security-concepts/book. Available slots are confirmed instantly. The call does not dispatch a technician.',
      },
    ],
  },
  {
    service: 'gate-repair',
    slug: 'groveland-fl',
    path: '/gate-repair/groveland-fl',
    areaLabel: 'Groveland',
    h1: 'Gate Repair in Groveland, FL',
    title: 'FSC Gate Repair Groveland FL',
    metaDescription:
      'Gate and gate operator repair in Groveland, scheduled from Clermont. Long rural drives, farm and ranch gates, and storm power hits. What to check first.',
    eyebrow: 'Groveland · Lake County, FL',
    intro:
      'Florida Security Concepts schedules Groveland gate repair from Clermont, a short drive up SR 50. Groveland gates range from new subdivision entries to long rural drives, ranch and equipment yards, and fence gates that were automated years after they were hung. We repair swing, slide, and vertical-lift operators, service LiftMaster CSL slide operators and CellGate WXL callboxes, and fix fence gates that sag, drag, or will not latch. Call (352) 282-0692 if it is down. Same-day when available. An advanced consultation is how we scope a repair when the gate is still usable.',
    localContext:
      'Out here, the operator is often far from the house on a long run of wire, solar, or battery power. Lightning and summer storms hit those runs hard. Sand roads and open pasture put dust and debris into tracks and hinges, and heavy farm or ranch leaves ask more of an operator than a light residential gate.',
    conditionsHeading: 'What fails on Groveland gates',
    conditions: [
      {
        title: 'Power and batteries at the end of a long run',
        body: 'A storm surge, a tired battery, or a solar panel covered in dust leaves the operator too weak to finish a cycle. The gate moves a little and stops, or works only at midday.',
      },
      {
        title: 'Heavy leaves and sagging fence gates',
        body: 'A wide farm or ranch gate that has dropped on its hinges drags and trips the operator. A fence gate that was never built to be automated needs the frame and hinge fixed before the motor.',
      },
      {
        title: 'Sand and debris in the travel path',
        body: 'Sand roads and open ground fill slide tracks and build up under swing leaves. The operator then fights friction and reports a fault.',
      },
    ],
    beforeYouCall: [
      'Note whether it failed after a storm, and whether it works better in the middle of the day.',
      'Check whether the leaf sags or drags, and clear loose debris from the path without forcing the gate.',
      'Look at the solar panel and battery box if you have one, and note any warning lights.',
      'Find out whether the manual release was used, and leave it as found.',
      'Have the property name and which gate it is if there are several.',
    ],
    optionsHeading: 'What a Groveland repair usually turns out to be',
    options: [
      {
        title: 'Power first',
        body: 'Batteries, charging, surge damage, and wire runs get checked before anyone replaces a board.',
      },
      {
        title: 'Fix the gate, then the operator',
        body: 'Rehanging or reinforcing a sagging leaf often ends the fault. A stronger operator on a dragging gate only hides it for a while.',
      },
      {
        title: 'Size for the leaf you have',
        body: 'A heavy ranch or commercial gate may need a different operator class than the one that came with it.',
      },
    ],
    serviceType: 'Gate repair',
    areaServed: grovelandArea,
    parentServiceSlug: 'gate-automation',
    parentServiceLabel: 'Gate automation',
    faqs: [
      {
        q: 'Who does gate repair in Groveland, FL?',
        a: 'Florida Security Concepts (FSC) repairs gates, gate operators, and fence gates in Groveland, scheduled from our base in Clermont. Call (352) 282-0692. Same-day when available.',
      },
      {
        q: 'How do I book an advanced consultation for a Groveland gate?',
        a: 'Book a project call through Booqer at https://booqer.ai/shops/florida-security-concepts/book. Available slots are confirmed instantly. The call does not dispatch a technician.',
      },
    ],
  },
  {
    service: 'gate-repair',
    slug: 'orlando-fl',
    path: '/gate-repair/orlando-fl',
    areaLabel: 'Orlando',
    h1: 'Gate Repair in Orlando, FL',
    title: 'Gate Repair in Orlando, FL',
    metaDescription:
      'Orlando gate repair for HOAs and property managers. High visitor cycles, afternoon storms, and loops that stay occupied after rain — what to check first.',
    eyebrow: 'Orlando · Orange County, FL',
    intro:
      'Orlando gates fail under volume. A community entrance near a busy corridor can cycle for residents, guests, landscapers, and deliveries from early morning until after dinner. The operator that was sized for a quieter neighborhood runs hot, and safety devices aligned on a dry morning misread the lane after a mid-afternoon storm.',
    localContext:
      'The metro is not one gate. A set-back entrance on a larger tract, a tight swing gate closer to the street, and a high-cycle barrier at a multifamily drive all get reported as “the gate is down.” Visitor and vendor traffic is heavier here than on a Lake County ridge community, so a repair that restores motion and leaves an undersized operator or a shared code in place does not hold through the next week.',
    conditionsHeading: 'What fails in Orlando heat, storms, and humidity',
    conditions: [
      {
        title: 'Duty cycle, then heat',
        body: 'Asphalt islands and dark operator covers store the day’s heat. A commercial operator that is already cycling hard will fault in the afternoon even when the same gate was quiet at breakfast. Ask whether the failure clusters after 2 p.m. on busy days. That is a sizing clue.',
      },
      {
        title: 'Storms that leave the loop “occupied”',
        body: 'Orlando thunderstorms flood shallow loop saw-cuts. A loop that stays occupied holds the gate open or refuses to close, and staff often describe it as an operator failure. Sealant that has opened up, and a loop that reads occupied only after rain, is a different repair from a burnt motor.',
      },
      {
        title: 'Set-back pedestals and safety devices',
        body: 'Larger Orlando tracts put the operator and the photo eyes well back from the road. Humidity films the eyes, and a cellular call path that worked in a clubhouse demo drops at the pedestal. The leaf may be fine while the entrance still will not complete a normal cycle.',
      },
    ],
    beforeYouCall: [
      'Count roughly how many times the gate moves on a normal weekday, and whether the fault shows up after the busy part of the day.',
      'After the last storm, note whether the gate stays open, will not close, or closes and reopens. A loop that thinks a car is still there behaves differently from a dead operator.',
      'Look at the photo eyes and the edge of the leaf for film, landscaping, or a blocked beam. Do not tape over an eye to “make it work.”',
      'If residents use a keypad or telephone entry, say whether the gate itself moves on a known-good remote. That separates an operator problem from a credential problem.',
      'Have the property name, the entrance (main, resident, vendor), and what changed — power, storm, or a recent vendor on site.',
    ],
    optionsHeading: 'How an Orlando repair differs from a quiet entrance',
    options: [
      {
        title: 'Restore the cycle, then check the class',
        body: 'Getting a high-traffic Orlando leaf moving again is not the whole visit. If the operator is a light-duty unit on a busy lane, the same heat fault returns. The repair has to say whether this machine can carry the traffic.',
      },
      {
        title: 'Loops and eyes before boards',
        body: 'After a storm, Orlando entrances often need the safety circuit checked before anyone replaces a control board. A wet loop or a filmed photo eye produces the same symptom as a failed controller.',
      },
      {
        title: 'Do not leave the shared workaround in place',
        body: 'Staff sometimes prop the gate or hand out one code while they wait. That gets cars through and erases the record of who entered. The repair should end with the safety devices online and a credential path that is not a sticky note.',
      },
    ],
    serviceType: 'Gate repair',
    areaServed: orlandoArea,
    parentServiceSlug: 'gate-automation',
    parentServiceLabel: 'Gate automation',
  },
  {
    service: 'gate-repair',
    slug: 'kissimmee-fl',
    path: '/gate-repair/kissimmee-fl',
    areaLabel: 'Kissimmee',
    h1: 'Gate Repair in Kissimmee, FL',
    title: 'Gate Repair in Kissimmee, FL',
    metaDescription:
      'Kissimmee gate repair for communities with guest turnover and all-day deliveries. Humidity, sandy aprons, and operators that run hot — what to check before calling.',
    eyebrow: 'Kissimmee · Osceola County, FL',
    intro:
      'Kissimmee gates work a hospitality schedule. Short stays, cleaners, and package carriers keep the leaf moving long after a typical residential entrance has gone quiet. The operator overheats, the apron stays soft after rain, and a guest code that never expires adds cycles the board never planned for.',
    localContext:
      'Osceola County communities from the Kissimmee side of Celebration out toward Poinciana mix long-term residents with units that turn over often. Sandy soil and a high water table mean a storm does not sheet off the apron the way it does on a Lake County ridge. The gate starts the day fine and binds by evening because the path of the leaf, not the keypad label, has changed.',
    conditionsHeading: 'What fails in Kissimmee heat, storms, and humidity',
    conditions: [
      {
        title: 'All-day cycling in humid air',
        body: 'Delivery vans and turnover crews do not arrive in one morning window. An operator that is acceptable for a stable resident community runs hot here by midafternoon, especially when the housing has no shade. Humidity keeps the board from cooling between cycles.',
      },
      {
        title: 'Sand and standing water at the apron',
        body: 'After a storm, sand washes onto slide tracks and swing paths. The leaf drags, limits drift, and the operator trips on obstruction. Forcing it through wet sand scores the track and makes the next cycle worse.',
      },
      {
        title: 'Guest traffic that looks like a hardware fault',
        body: 'A code shared with a previous guest, a cleaner, or a group thread keeps the gate cycling when nobody on the board expects it. The operator wears out, and the complaint sounds like “it broke,” when part of the load is credentials that should have expired.',
      },
    ],
    beforeYouCall: [
      'Say whether the entrance serves mostly residents, short stays, or a mix, and whether cleaners or deliveries use the same code as residents.',
      'Note if the fault started after a storm and whether water or sand is sitting where the leaf travels.',
      'Check whether the gate is hot to the point of stopping only later in the day, after the delivery window.',
      'Look for a leaf that is twisted or a wheel that is off the track. Do not keep the remote held down.',
      'If you can, list whether a known resident remote still moves the gate when the keypad does not. That splits operator trouble from a credential problem.',
    ],
    optionsHeading: 'What we separate on a Kissimmee entrance',
    options: [
      {
        title: 'Mechanical drag versus extra cycles',
        body: 'A sandy apron and an endless guest code can fail the same operator. The visit has to look at the track and at who is still allowed to open the gate. Fixing only one of those brings the call back.',
      },
      {
        title: 'Limits after the ground moves',
        body: 'Soft ground shifts the closed position. A gate that “almost” latches is often a limit and alignment issue, not a reason to replace the whole leaf on the first trip.',
      },
      {
        title: 'Stop the open-ended guest path',
        body: 'Repairing the operator and leaving last month’s guest code active puts the same wear back on the machine. The useful close of the visit is a credential that expires.',
      },
    ],
    serviceType: 'Gate repair',
    areaServed: kissimmeeArea,
    parentServiceSlug: 'gate-automation',
    parentServiceLabel: 'Gate automation',
  },
  {
    service: 'gate-repair',
    slug: 'winter-garden-fl',
    path: '/gate-repair/winter-garden-fl',
    areaLabel: 'Winter Garden',
    h1: 'Gate Repair in Winter Garden, FL',
    title: 'Gate Repair in Winter Garden, FL',
    metaDescription:
      'Winter Garden gate repair, including newer Horizon West entrances. Builder operators, settling fill, and ornamental leaves that drag — what to check before you call.',
    eyebrow: 'Winter Garden · Orange County, FL',
    intro:
      'A lot of Winter Garden entrances were specified for opening day, not for the traffic that showed up once the sections filled in. Builder-grade operators on ornamental leaves start binding when the fill settles, the landscaping grows into the swing path, or the daily car count exceeds what the original unit was meant to move.',
    localContext:
      'Horizon West and the surrounding Winter Garden communities are still adding rooftops. Posts set in fresh fill move. A picket gate that cleared the ground at turnover drags a year later. The State Road 429 corridor also mixes those new HOA entries with older swing gates closer to downtown Winter Garden, where the hardware is different and the duty cycle is lower. The same symptom — “it will not close” — is not the same repair.',
    conditionsHeading: 'What fails in Winter Garden heat, storms, and humidity',
    conditions: [
      {
        title: 'Undersized operators in the afternoon',
        body: 'A light operator on a heavy ornamental leaf runs hot once school traffic and vendors stack up. The board faults, someone resets it, and it faults again the next hot day. Age is a weak clue. Many of these operators are only a few years old.',
      },
      {
        title: 'Fill, rain, and a leaf that now drags',
        body: 'Storm water finds the low spot at a new entrance. The apron softens, the leaf drops, and the operator pulls against the ground. Humidity then swells wood skirts and corrodes hinges that were never rinsed after irrigation was turned on.',
      },
      {
        title: 'Landscaping in the safety zone',
        body: 'New plantings grow into photo eyes and swing arcs. The gate reverses, residents assume the motor failed, and the eyes get blocked “just for the weekend.” That is how an entrapment device ends up out of the circuit.',
      },
    ],
    beforeYouCall: [
      'Say whether this entrance is a newer section or an older gate, and whether the trouble started after landscaping, irrigation, or a storm.',
      'Look along the bottom of the leaf for a fresh scrape in the paint or mulch pushed up in the swing path.',
      'Check that photo eyes still face each other and that plants or a decoration are not in the beam.',
      'Note if the operator housing is in full afternoon sun and whether resets only last until the next hot day.',
      'Do not let a well-meaning resident bypass a safety edge so the gate will finish closing.',
    ],
    optionsHeading: 'How a Winter Garden repair is scoped',
    options: [
      {
        title: 'Settling is a geometry problem',
        body: 'If the posts or the slab have moved, adjusting a limit without looking at the hang of the leaf only hides the drag until the next rain. The visit starts with how the leaf meets the ground.',
      },
      {
        title: 'Builder hardware versus today’s traffic',
        body: 'Some operators can stay if the leaf is freed and the safety devices are brought back online. Others are the wrong class for the cars that now use the entrance. Those are different proposals, and the site decides which one it is.',
      },
      {
        title: 'Eyes and edges are part of the repair',
        body: 'A gate that moves with the photo eye blocked is not repaired. Winter Garden boards often discover this only after a resident mentions that “someone taped the sensor.” The close of the job is a leaf that stops when it should.',
      },
    ],
    serviceType: 'Gate repair',
    areaServed: winterGardenArea,
    parentServiceSlug: 'gate-automation',
    parentServiceLabel: 'Gate automation',
  },
  {
    service: 'gate-repair',
    slug: 'tampa-bay-fl',
    path: '/gate-repair/tampa-bay-fl',
    areaLabel: 'Tampa Bay',
    h1: 'Gate Repair in Tampa Bay, FL',
    title: 'Gate Repair in Tampa Bay, FL',
    metaDescription:
      'Tampa Bay gate repair for communities and commercial entries. Salt air, flat lots, and barrier arms in bay wind — different from a Lake County hillside gate.',
    eyebrow: 'Tampa Bay, FL',
    intro:
      'Tampa Bay gates fail from corrosion and from a high water table as much as from heat. Salt film on terminals, a limit switch that sticks after humid nights, and a barrier arm that will not stay put in an onshore breeze are ordinary calls here. They are not the same visit as a Clermont swing gate dragging uphill.',
    localContext:
      'The bay side and inland Hillsborough do not wear hardware the same way. An entrance closer to open water collects salt on limit switches, hinge pins, and connector blocks. A few miles inland, the complaint is more often heat, a flat apron that holds storm water, and a high-cycle barrier at a multifamily or commercial drive. Florida Security Concepts treats Tampa Bay as its own service area, with Clermont and Lake County still the home base.',
    conditionsHeading: 'What fails in Tampa Bay heat, storms, and salt air',
    conditions: [
      {
        title: 'Corrosion that looks like a bad board',
        body: 'White residue on terminals and a sticky limit switch will stop a gate that still has a healthy motor. Swapping the control board without cleaning and protecting the connections puts the new board in the same air. Coastal humidity does this faster than a dry inland housing.',
      },
      {
        title: 'Storm water that has nowhere to go',
        body: 'Flat lots and a high water table leave the apron wet after a bay thunderstorm. Loops stay occupied, slide tracks hold water, and swing gates push through standing water until a wheel climbs out of line. The operator is then blamed for a path problem.',
      },
      {
        title: 'Wind on barrier arms',
        body: 'Barrier arms at parking and multifamily entries take wind that a heavy swing leaf shrugs off. An arm that bounces, will not seat, or faults on obstruction in the afternoon sea breeze needs the arm, the spring, and the loop looked at together — not only a reset.',
      },
    ],
    beforeYouCall: [
      'Say whether the entrance is near open water or well inland, and whether the hardware is a swing gate, a slide gate, or a barrier arm.',
      'Look inside the operator only if you can do it safely, and note green or white buildup on terminals. If you are not comfortable opening it, leave it closed and describe the symptom.',
      'After rain, note whether water sits where the leaf or the arm travels, and whether the gate then stays open.',
      'If it is a barrier, say whether the arm is bent, whether it faults only on windy afternoons, and whether the loop still sees cars.',
      'Do not spray the housing with a hose. Salt and water pushed into the controller is a worse failure than the one you are trying to rinse off.',
    ],
    optionsHeading: 'How a Tampa Bay repair is different',
    options: [
      {
        title: 'Clean and protect, or replace',
        body: 'Some coastal faults clear once connections are cleaned, dried, and sealed, and the limit switch moves freely. Others have already eaten the switch or the board. The housing tells you which one it is. A phone description of “it stopped” does not.',
      },
      {
        title: 'Arms are not swing gates',
        body: 'A barrier-arm entrance fails at the arm, the spring, and the vehicle loop. Parts and checks that belong on a Lake County swing gate do not transfer. The visit is scoped to the arm that is actually on the lane.',
      },
      {
        title: 'Drainage is part of reliability',
        body: 'If every storm leaves the loop underwater, an electrical repair alone will not keep the gate closed. The note from the visit should say whether the apron needs attention before the next system of storms.',
      },
    ],
    serviceType: 'Gate repair',
    areaServed: tampaBayArea,
    parentServiceSlug: 'gate-automation',
    parentServiceLabel: 'Gate automation',
  },
  {
    service: 'access-control',
    slug: 'clermont-fl',
    path: '/access-control/clermont-fl',
    areaLabel: 'Clermont & Lake County',
    h1: 'Access Control in Clermont & Lake County, FL',
    title: 'Access Control in Clermont & Lake County, FL',
    metaDescription:
      'Access control for Clermont and Lake County communities. Vehicle gates, amenity gates, and set-back entries where a phone credential may have no signal.',
    eyebrow: 'Clermont · Lake County, FL',
    intro:
      'Access control in south Lake County is usually more than one door. The vehicle gate, a pool or amenity gate, and sometimes a pedestrian gate toward the water are three populations. A single shared code feels simple until a section of the community fills in and nobody can say who still has it.',
    localContext:
      'Clermont-area entrances are often set back from the road, on lots with weak cellular service at the pedestal even when a phone works in the clubhouse. Master-planned sections also deliver in phases, so the directory and the fob list lag the people who actually live there. Florida Security Concepts is based in Clermont and starts the conversation from the entrances you already have.',
    conditionsHeading: 'What heat, storms, and humidity do to the credential path',
    conditions: [
      {
        title: 'A directory that looks fine and never rings',
        body: 'Telephone entry and app-based open both depend on a path off the property. On a ridge lot that path is often cellular. Heat does not cause this. Distance and a pedestal set back in a low spot do. The screen can be bright and still never reach a resident.',
      },
      {
        title: 'Storms and a soaked pedestal',
        body: 'Wind-driven rain gets into keypads and reader gaskets that were fine in the dry season. Buttons stick, a prox reader reads every other fob, and staff assume the software is down. Drying and resealing the device is a different job from rebuilding the resident database.',
      },
      {
        title: 'Humidity on outdoor amenity readers',
        body: 'Pool and lake-access readers live in irrigation and humidity. A reader that fails only in the morning dew is a hardware environment problem. Moving that gate onto the same database as the vehicle entrance still matters, but it will not dry the reader.',
      },
    ],
    beforeYouCall: [
      'List the openings that are controlled today: vehicle gate, pedestrian gate, pool, clubhouse. Say whether they share one database or three unmanaged codes.',
      'From the pedestal, try a call or a mobile open and note whether it fails only at the gate. A success in the parking lot and a failure at the pedestal is a signal clue.',
      'Check whether new homes or new residents were added without credentials, and whether construction or vendor codes are still live.',
      'After rain, note sticky keys or a reader that works once it dries. Do not drill extra holes in the pedestal to “let it breathe.”',
      'Do not send gate codes, fob numbers, or passwords in a web form. Describe the symptom and who needs to get in.',
    ],
    optionsHeading: 'How the access options differ in Lake County',
    options: [
      {
        title: 'Fob on a local controller',
        body: 'A fob or card that the gate controller already knows still works when the cellular path is down. That is the reliable resident method on a set-back Clermont entrance. Revocation is only as good as the person who removes the credential when someone moves.',
      },
      {
        title: 'Mobile credentials, with a caveat',
        body: 'A phone credential is easy to issue and easy to revoke, which helps when sections are still closing. If the open command has to reach a cloud service from a pedestal with poor signal, residents will hate it. Test at the pedestal, not at the model.',
      },
      {
        title: 'Telephone entry versus a stale directory',
        body: 'Telephone entry fits guests when the directory matches current residents and someone is home to answer. It is a weak primary method for a phase that is half occupied. Pair it with a fallback a manager can actually perform.',
      },
      {
        title: 'One database for the amenity gate',
        body: 'A pool code written on a clipboard is not access control. Putting the amenity gate on the same revoked-when-they-move list as the vehicle gate is the change that matters, even when the reader hardware stays.',
      },
    ],
    serviceType: 'Access control',
    areaServed: clermontArea,
    parentServiceSlug: 'access-control',
    parentServiceLabel: 'Access control',
  },
  {
    service: 'access-control',
    slug: 'orlando-fl',
    path: '/access-control/orlando-fl',
    areaLabel: 'Orlando',
    h1: 'Access Control in Orlando, FL',
    title: 'Access Control in Orlando, FL',
    metaDescription:
      'Orlando access control for HOAs and property managers. Vendor volume, unanswered guest calls, and audit trails — how fobs, codes, and intercoms differ.',
    eyebrow: 'Orlando · Orange County, FL',
    intro:
      'Orlando entrances see more strangers in a day than a Lake County ridge gate sees in a week. Landscapers, deliveries, realtors, and guests all need a way in that is not the resident code. Access control here is the rule for each of those groups, plus a record the property manager can pull after something goes wrong.',
    localContext:
      'Portfolios in Orlando often mix a gated HOA with a multifamily driveway and a commercial side gate. A system that is excellent at the clubhouse demo fails when the vendor list lives in a group text and the telephone entry rings units where nobody is home during the day. The useful design starts from who is at the gate at 4 p.m., not from a feature list.',
    conditionsHeading: 'What heat, storms, and humidity do to Orlando entries',
    conditions: [
      {
        title: 'Pedestals that cook, then lie',
        body: 'A dark pedestal in an Orlando afternoon gets hot enough to reboot or to drop its network radio. The directory still paints names on the screen from local memory while calls never leave the property. Residents report “the gate is broken” when the leaf is waiting on a call that cannot complete.',
      },
      {
        title: 'Storms and the guest path',
        body: 'After a thunderstorm, power supplies and network switches at the entrance come back later than the operator does. The gate can be opened with a local fob and still refuse every guest call. That split — residents in, guests stuck — is the clue to bring.',
      },
      {
        title: 'Humidity on readers at secondary doors',
        body: 'Pool, gym, and package-room readers fail on a different schedule from the vehicle gate. If those doors are not on the same system, the manager hears about them as separate emergencies. They are one credential problem showing up in two places.',
      },
    ],
    beforeYouCall: [
      'Say who is stuck: residents, vendors, guests, or everyone. A vendor-only failure is rarely an operator failure.',
      'Note whether a resident fob still opens the gate when the directory will not place a call.',
      'Count how vendors get in today — standing code, time window, or a call to the office — and whether that code has been changed this year.',
      'If you manage more than one Orlando property, say whether you want the same credential rules on each site or a separate list per entrance.',
      'Do not include active codes or resident phone numbers in a message. Bring those to the consultation, not to a form.',
    ],
    optionsHeading: 'How Orlando access options differ',
    options: [
      {
        title: 'Time-bound vendor credentials',
        body: 'A landscaper or cleaner should enter on a credential that expires, during a window the board chose. A shared four-digit code cannot do that, and it will be on a truck clipboard by Friday. This is the highest-value change on a busy Orlando entrance.',
      },
      {
        title: 'Telephone entry versus video intercom',
        body: 'Telephone entry is enough when a resident can answer and the call path is reliable. Video helps when the person at the gate is a stranger and the resident needs to see the lane. Neither one works if nobody is home. Orlando shift schedules make a manager fallback part of the design, not an extra.',
      },
      {
        title: 'Mobile credentials for staff, fobs for residents',
        body: 'Staff and vendors gain the most from a phone credential you can revoke the day a contract ends. Residents on a set-back entrance are often happier with a fob the local controller already trusts. Using one method for every person is how projects disappoint.',
      },
      {
        title: 'An audit trail someone will open',
        body: 'The log only helps if the manager can export it without a site visit from the installer. Ask for that during the consultation. A system that “has reports” and no one can reach is not a record.',
      },
    ],
    serviceType: 'Access control',
    areaServed: orlandoArea,
    parentServiceSlug: 'access-control',
    parentServiceLabel: 'Access control',
  },
  {
    service: 'access-control',
    slug: 'kissimmee-fl',
    path: '/access-control/kissimmee-fl',
    areaLabel: 'Kissimmee',
    h1: 'Access Control in Kissimmee, FL',
    title: 'Access Control in Kissimmee, FL',
    metaDescription:
      'Kissimmee access control for communities with short stays and constant deliveries. Expiring guest access, cleaner credentials, and directories that churn.',
    eyebrow: 'Kissimmee · Osceola County, FL',
    intro:
      'Kissimmee credential lists go stale faster than resident communities expect. A unit changes occupants, a cleaner keeps yesterday’s fob, and a guest code posted for a weekend is still opening the gate next month. The gate operator wears out, and the board thinks the problem is mechanical.',
    localContext:
      'Short stays and a heavy delivery day are normal from Kissimmee through the surrounding Osceola communities. Package carriers arrive when residents are out. If the only guest method is a live phone call, the carrier leaves, the resident complains, and someone eventually tapes a code to the pedestal. The design has to assume the unit may be empty and the delivery still happens.',
    conditionsHeading: 'What heat, storms, and humidity expose',
    conditions: [
      {
        title: 'Codes that outlive the stay',
        body: 'Heat does not expire a PIN. A Kissimmee entrance that relies on a standing guest or cleaner code will cycle all afternoon for people who should no longer be on the property. The operator’s duty cycle and the credential policy are the same problem.',
      },
      {
        title: 'Storm outages and the fallback code',
        body: 'When power or the network blips, staff often enable one “temporary” code so guests can enter. Temporary becomes the new permanent because revoking it locks out a current guest. Write the fallback before hurricane season, including who turns it off.',
      },
      {
        title: 'Readers in wet, busy lanes',
        body: 'Humidity and constant use wear keypad membranes. A sticky keypad gets replaced with a shared code “until the part comes in,” and the part never gets installed. The symptom looks like software. It is often a membrane and a policy that slipped.',
      },
    ],
    beforeYouCall: [
      'Describe how a guest, a cleaner, and a package carrier get in today, in one sentence each.',
      'Say whether any code on the pedestal has been unchanged for more than a season.',
      'Note if the directory still lists owners or prior guests who are gone.',
      'After the last storm, say whether someone enabled a backup code and whether it is still active.',
      'Keep active PINs out of email and forms. Tell us the pattern, not the secret.',
    ],
    optionsHeading: 'How Kissimmee access options should differ',
    options: [
      {
        title: 'Expiring guest access',
        body: 'A short stay needs a credential that dies when the stay dies. A keypad can do that if the system issues a unique code per reservation. One community PIN cannot. This is the option that matches how Kissimmee units actually turn over.',
      },
      {
        title: 'Cleaners are vendors, not residents',
        body: 'Turnover crews should hold a time-bound vendor credential, not a resident fob that opens the amenity doors at midnight. Mixing those roles is how a lost fob becomes a weekend incident.',
      },
      {
        title: 'A delivery path that does not require someone to answer',
        body: 'Telephone entry fails when the unit is empty. A managed delivery window, a locker process, or a staffed fallback is a policy choice. The hardware should implement the policy you already want, not invent one at the keypad.',
      },
      {
        title: 'Directory hygiene is the maintenance',
        body: 'The best reader in Osceola County still fails the community if names are a year old. Whoever adds a resident has to be able to remove one the same day. That workflow matters more than a second camera on the pedestal.',
      },
    ],
    serviceType: 'Access control',
    areaServed: kissimmeeArea,
    parentServiceSlug: 'access-control',
    parentServiceLabel: 'Access control',
  },
  {
    service: 'access-control',
    slug: 'winter-garden-fl',
    path: '/access-control/winter-garden-fl',
    areaLabel: 'Winter Garden',
    h1: 'Access Control in Winter Garden, FL',
    title: 'Access Control in Winter Garden, FL',
    metaDescription:
      'Winter Garden access control for new and established communities. Builder keypads, clubhouse readers, and credentials that were never issued to new residents.',
    eyebrow: 'Winter Garden · Orange County, FL',
    intro:
      'Many Winter Garden sections opened with a builder keypad and one community code. That was enough while models were selling. It is not enough once residents, a clubhouse, and a vendor list all exist. The project is usually “replace the sticky code,” and the real decision is which openings share a database.',
    localContext:
      'Horizon West growth means adjacent sections can be on different hardware installed a year apart. The vehicle gate, the clubhouse door, and a pedestrian gate at the amenity were often bid separately. Residents get a fob for one and a code for another, and new closings wait weeks for anyone to add them. Older gates nearer downtown Winter Garden may already have a directory that the new section does not.',
    conditionsHeading: 'What heat, storms, and humidity reveal',
    conditions: [
      {
        title: 'A builder keypad in the sun',
        body: 'The original keypad was not chosen for a west-facing Winter Garden entrance. Membranes cook, digits stop registering, and the maintenance code gets shared so the gate can be opened while “a new keypad is ordered.” The order drifts. The shared code does not.',
      },
      {
        title: 'Rain on a pedestal that was never sealed',
        body: 'New pedestals sometimes ship with unused knockouts still loose. The first serious storm fills the can. Readers and the network switch fail, and the community falls back to the construction code because it still works on the local relay.',
      },
      {
        title: 'Irrigation overspray on amenity readers',
        body: 'Clubhouse and pool readers sit in beds that get watered every morning. Intermittent reads get blamed on “bad fobs” issued at closing. Wipe the reader and watch the overspray before you reissue the whole neighborhood.',
      },
    ],
    beforeYouCall: [
      'Say whether the vehicle gate still uses a builder or construction code, and who knows it.',
      'List openings that do not share that system: clubhouse, pool, pedestrian gate, guard kiosk if you have one.',
      'Note how a new resident receives a credential today, and how long that takes after closing.',
      'If a section is still under construction, say so. The credential plan has to survive the next phase, not only the homes that have closed.',
      'Do not send the construction code. Tell us that one exists.',
    ],
    optionsHeading: 'How Winter Garden access options differ',
    options: [
      {
        title: 'Keep the operator, replace the brain',
        body: 'The gate operator is often fine. The builder keypad and the single code are not. An advanced consultation can separate “new credentials on this operator” from “the leaf and the operator are already at the end of their life.” Those are different projects.',
      },
      {
        title: 'One database, including the clubhouse',
        body: 'A resident who is removed at the vehicle gate and still opens the clubhouse does not feel like one system. Winter Garden boards feel this first at the amenity, not at the street. Include that door in the scope even if the hardware is newer than the gate.',
      },
      {
        title: 'Issue credentials at closing',
        body: 'Mobile credentials help when homes are still closing every week, because there is no fob to hand across a trailer. Fobs are simpler where pedestal signal is poor. Many sections need both: mobile for the people managing turnover, fobs for residents.',
      },
      {
        title: 'Retire the construction code on a date',
        body: 'The construction code should have an end date on the controller, not a promise to delete it later. Until that happens, every other control is optional. This is the first setting to confirm.',
      },
    ],
    serviceType: 'Access control',
    areaServed: winterGardenArea,
    parentServiceSlug: 'access-control',
    parentServiceLabel: 'Access control',
  },
  {
    service: 'access-control',
    slug: 'tampa-bay-fl',
    path: '/access-control/tampa-bay-fl',
    areaLabel: 'Tampa Bay',
    h1: 'Access Control in Tampa Bay, FL',
    title: 'Access Control in Tampa Bay, FL',
    metaDescription:
      'Tampa Bay access control for communities and commercial sites. Salt on readers, barrier-arm lanes, and vehicle gates that do not share a database with the door.',
    eyebrow: 'Tampa Bay, FL',
    intro:
      'Tampa Bay access control fails in the weather before it fails in the software. Salt film on a prox reader, a pinpad sticky with humidity, and a barrier lane on a different list from the pedestrian door are the ordinary problems. A Clermont fob plan does not answer a bay-side reader that cannot see the card.',
    localContext:
      'Around the bay, communities and commercial sites often grew the vehicle entrance and the building door as separate purchases. Multifamily and condo properties add a parking barrier that a hillside HOA in Lake County does not have. Inland sites in the Tampa Bay area look more like an Orlando heat problem; sites nearer the water look like a corrosion problem. The consultation has to start with which of those you are standing in.',
    conditionsHeading: 'What heat, storms, and salt air do to readers',
    conditions: [
      {
        title: 'Readers that quit when the air is wet',
        body: 'A prox reader or keypad that works at noon and fails on a humid night is collecting salt and moisture, not “losing the database.” Cleaning, a better gasket, and a hood change the diagnosis. Replacing the head end does not.',
      },
      {
        title: 'Storms split the lane from the door',
        body: 'Lightning and power events often take the network switch at a barrier lane and leave the building controller up, or the reverse. Residents can enter the garage and not the lobby, and each vendor blames the other. One database with a noted fail behavior is the point of integrating them.',
      },
      {
        title: 'Heat on dark pedestals inland',
        body: 'Inland Tampa Bay pedestals see the same afternoon heat as Orlando. Screens dim, radios drop, and a cloud-only mobile open fails while a local card still works. Do not standardize the whole portfolio on a method the hottest pedestal cannot complete.',
      },
    ],
    beforeYouCall: [
      'Say whether this site is near open water or inland, and list the vehicle entrance separately from pedestrian doors.',
      'Note if a particular reader fails in humid weather or only after rain, and whether wiping it brings it back.',
      'Say whether the barrier or garage and the front door share a credential list today.',
      'If mobile open works in the office and fails in the lane, say that. It changes the recommendation.',
      'Leave card numbers and PINs out of the message.',
    ],
    optionsHeading: 'How Tampa Bay access options differ',
    options: [
      {
        title: 'Local cards where the air is harsh',
        body: 'A card or fob checked by the local controller survives a wet reader better than a phone command that must leave the property. Choose hardware with gaskets that match salt air if the entrance is near the water. Inland sites can be less strict and still should not be open cans.',
      },
      {
        title: 'Barrier lanes are their own design',
        body: 'A parking barrier wants a fast read and a loop, not a telephone directory built for a swing gate. Putting a full resident directory on an arm that a hundred cars use at 8 a.m. creates a queue. The arm and the lobby door can share identities without sharing a user interface.',
      },
      {
        title: 'Mobile for staff, not as the only resident method',
        body: 'Property staff gain the most from instant revocation on a phone. Residents at a corroded outdoor reader need a credential the local panel can still honor when the network is down. Offer both, and test the outdoor reader on a humid afternoon.',
      },
      {
        title: 'One list, two doors',
        body: 'The decision that reduces Tampa Bay service calls is administrative: when someone moves out, both the lane and the door lose them the same day. Hardware that cannot do that is the thing to replace. Hardware that can, and nobody uses it, is a training and ownership problem.',
      },
    ],
    serviceType: 'Access control',
    areaServed: tampaBayArea,
    parentServiceSlug: 'access-control',
    parentServiceLabel: 'Access control',
  },
  {
    service: 'security-cameras',
    slug: 'clermont-fl',
    path: '/security-cameras/clermont-fl',
    areaLabel: 'Clermont & Lake County',
    h1: 'Security Camera Installation in Clermont & Lake County, FL',
    title: 'Security Camera Installation Clermont FL & Lake County | FSC',
    metaDescription:
      'Security camera installation in Clermont and Lake County for HOAs, gated entries, storage, commercial lots, and homes. Based in Clermont. Call (352) 282-0692.',
    eyebrow: 'Clermont · Lake County, FL',
    intro:
      'Florida Security Concepts (FSC) installs security cameras in Clermont and across Lake County, including Minneola, Groveland, and Montverde. We are based in Clermont. We design camera coverage for HOA and gated-community entries, commercial lots and buildings, self-storage, multifamily, and homes, and we aim each camera at the scene you will actually need to review: the gate lane, the vehicle, the door, the lot. Book an advanced consultation to plan a new system or fix one that is not recording what you need. For an urgent problem, call (352) 282-0692. After-hours emergency service is by phone.',
    localContext:
      'Lake County properties put cameras through more than a flat Orlando parking lot does. Clermont entries sit on hills and fill, many face west into hard afternoon sun, ridge storms bring lightning and fast water, and irrigation overspray reaches anything mounted low. A camera that looks fine on install day can wash out at 5 p.m., fog up on a humid morning, or lose its recorder after a nearby strike. We plan placement, mounting, power, and surge protection for those conditions, then set recording and retention for how that property actually uses the footage.',
    conditionsHeading: 'What goes wrong with cameras in Lake County',
    conditions: [
      {
        title: 'Glare and backlight at west-facing entries',
        body: 'A camera pointed toward a west-facing gate can turn the lane into a silhouette in late-afternoon sun. Placement and lens choice matter more than adding another camera. We look at where the sun sits at the hours that matter.',
      },
      {
        title: 'Storms, lightning, and power',
        body: 'Ridge storms are hard on recorders, switches, and long camera runs. Surge protection, grounding, and a plan for power at the gate or the pole keep a strike from taking the whole system down.',
      },
      {
        title: 'Humidity, spray, and insects',
        body: 'Irrigation spray, humidity, and spiders on the lens degrade night images first. Mounting height, housing choice, and a maintenance check keep the picture clear when you need it.',
      },
    ],
    beforeYouCall: [
      'List the scenes you need to see: entry lane, exit lane, pedestrian gate, mailroom, lot, loading area, front door.',
      'Note what incidents you have had to review, and how far back you needed to go.',
      'Note whether there is power and network at the gate, pole, or building where a camera would go.',
      'If you have an existing system, write down the recorder brand and who can log in today.',
      'Know who should be able to view cameras remotely, so access can be limited to those people.',
    ],
    optionsHeading: 'What the install usually includes',
    options: [
      {
        title: 'Gate and entry cameras',
        body: 'A view of the lane that shows the vehicle, the gate, and the keypad or callbox, so a gate event has a picture attached. This pairs well with access control at HOA and commercial entries.',
      },
      {
        title: 'Lot, building, and perimeter coverage',
        body: 'Wide views for lots and yards, tighter views for doors and loading areas, and low-light cameras where the site is dark at night.',
      },
      {
        title: 'Recording, retention, and remote viewing',
        body: 'A recorder sized for the retention window the property needs, with remote viewing on a phone or computer for approved people only.',
      },
      {
        title: 'Upgrades and repairs to existing systems',
        body: 'Replacing failed cameras, re-aiming coverage, fixing recording gaps, and restoring remote access on systems already in place.',
      },
    ],
    serviceType: 'Security camera installation',
    areaServed: lakeCountyOperatorArea,
    parentServiceSlug: 'video-surveillance',
    parentServiceLabel: 'Video surveillance',
    faqs: [
      {
        q: 'Who installs security cameras in Clermont, FL?',
        a: 'Florida Security Concepts (FSC) installs security cameras in Clermont, FL. We are based in Clermont and serve Lake County, including Minneola, Groveland, and Montverde, plus Winter Garden. Book an advanced consultation at booqer.ai/shops/florida-security-concepts/book or call (352) 282-0692.',
      },
      {
        q: 'Does Florida Security Concepts install cameras for homes and businesses in Lake County?',
        a: 'Yes. FSC installs cameras for HOAs and gated communities, commercial properties, self-storage, multifamily, industrial sites, and homes in Lake County and Central Florida.',
      },
      {
        q: 'Can you put a camera on our community gate or entrance?',
        a: 'Yes. Gate and entry cameras are a core part of what we do. We aim the camera so the vehicle, the gate, and the keypad or callbox are in the picture, and we can tie camera views to access control events.',
      },
      {
        q: 'Can I watch my cameras from my phone?',
        a: 'Yes. We set up remote viewing on a phone or computer and limit access to the people who should have it.',
      },
      {
        q: 'How long is camera footage kept?',
        a: 'Retention is set per property. It is commonly 30, 60, or 90 days, sized to how far back the property needs to look when an incident comes up.',
      },
      {
        q: 'Do you repair or upgrade an existing camera system?',
        a: 'Yes. We replace failed cameras, fix recording gaps, re-aim coverage, and restore remote access on existing systems.',
      },
      {
        q: 'How do I get started with a camera installation in Clermont?',
        a: 'Book an advanced consultation through Booqer at booqer.ai/shops/florida-security-concepts/book, or call (352) 282-0692. The consultation covers the scenes you need to see, power and network, and retention. Open times are confirmed when you book.',
      },
      {
        q: 'Do you offer emergency service?',
        a: 'Yes. After-hours emergency service is available by phone at (352) 282-0692. Same-day when available.',
      },
    ],
  },
];

const byKey = new Map(localLandings.map((landing) => [`${landing.service}/${landing.slug}`, landing]));

export function getLocalLanding(service: LocalServiceKey, slug: string): LocalLanding | undefined {
  return byKey.get(`${service}/${slug}`);
}

export function landingsFor(service: LocalServiceKey): LocalLanding[] {
  return localLandings.filter((landing) => landing.service === service);
}

/** Service pages that should list the matching local pages. */
export function landingsForServicePage(serviceSlug: string): LocalLanding[] {
  if (serviceSlug === 'access-control') return landingsFor('access-control');
  if (serviceSlug === 'video-surveillance') return landingsFor('security-cameras');
  if (serviceSlug === 'gate-automation' || serviceSlug === 'security-gate-systems') return landingsFor('gate-repair');
  return [];
}
