// Shared gate-repair sequence. Steps match work the site already lists:
// operators, leaves and hardware, loop detectors, photo eyes and edges,
// a full-cycle test, and a maintenance recommendation. No prices, no
// response-time promise beyond "same-day when available."

export type GateRepairStep = {
  name: string;
  text: string;
};

export const gateRepairProcess = {
  name: 'What happens from your first call to a finished gate repair',
  description:
    'The sequence Florida Security Concepts follows on a gate repair, from the call and scheduling through diagnosis, the repair, a full-cycle test, and the walkthrough.',
  steps: [
    {
      name: 'Call and scheduling',
      text: 'Call (352) 282-0692 if the gate is down. Same-day when available. The contact form does not send a technician. If the lane is still usable, book an advanced consultation and tell us the city, the gate type (swing, slide, barrier, or vertical lift), and whether it fails open, closed, or halfway. That call does not dispatch a technician.',
    },
    {
      name: 'On-site diagnosis',
      text: 'On site we look at how the gate is failing before we swap parts. We check the operator, the leaf, the track or swing path, and the safety devices that can stop a cycle.',
    },
    {
      name: 'Operator, leaf, loop, and safety devices',
      text: 'The repair covers the work that applies to that gate. Operator work is the board, the motor, the limits, and the safety inputs. Leaf and hardware work is hinges, chain, rollers, and track. Loop work is the loop detector and the loop in the lane. Safety-device work is photo eyes and edges. A visit includes only the work the gate needs.',
    },
    {
      name: 'Full open-close cycle and safety reversal',
      text: 'We run the gate through a full open-close cycle and test safety reversal on the photo eyes and edges. The safety devices stay in the circuit.',
    },
    {
      name: 'Walkthrough and maintenance recommendation',
      text: 'We walk through what failed, what we did, and what we recommend next. When it fits the property, that includes a maintenance recommendation. How often maintenance happens is set for that site.',
    },
  ] satisfies GateRepairStep[],
};

/** Gate-repair landings where this sequence belongs: Clermont and the Lake County city pages. */
export const lakeCountyGateRepairSlugs = ['clermont-fl', 'minneola-fl', 'groveland-fl'] as const;

export function showsLakeCountyGateRepairProcess(service: string, slug: string): boolean {
  return service === 'gate-repair' && (lakeCountyGateRepairSlugs as readonly string[]).includes(slug);
}
