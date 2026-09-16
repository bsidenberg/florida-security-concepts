import { getLocation } from '@/data/locations';
export type LeadFormDefaults = { service?: string; propertyType?: string; city?: string; urgency?: string; serviceSlug?: string; industrySlug?: string; locationSlug?: string };
const serviceQueries: Record<string,string> = { 'preventive-maintenance':'Maintenance / service', maintenance:'Maintenance / service', repair:'Repair / service', retrofit:'Retrofit / upgrade', 'security-gate-systems':'New gate system', 'gate-automation':'Gate automation', 'access-control':'Access control', 'video-surveillance':'Video surveillance', 'security-system-integration':'Full security system integration', 'emergency-service':'Emergency repair' };
const propertyQueries: Record<string,string> = { 'hoa-gated-communities':'HOA / gated community', 'multifamily-apartments-condos':'Multifamily / apartment / condo', 'storage-facilities':'Storage facility', 'commercial-properties':'Commercial property', 'industrial-warehouses':'Industrial / warehouse', 'residential-estates':'Residential / estate' };
const timingQueries: Record<string,string> = { emergency:'Emergency', 'this-week':'This week', thisweek:'This week', 'this-month':'This month', thismonth:'This month', planning:'Planning / budgeting', 'planning-budgeting':'Planning / budgeting' };
export function queryDefaults(params: Record<string,string|string[]|undefined> = {}): LeadFormDefaults {
  const read = (key: string) => typeof params[key] === 'string' ? (params[key] as string).trim() : '';
  const service = read('service'), industry = read('industry'), location = getLocation(read('location'));
  return { service:serviceQueries[service], serviceSlug:serviceQueries[service] ? service : undefined, propertyType:propertyQueries[industry], industrySlug:propertyQueries[industry] ? industry : undefined, city:location?.city, locationSlug:location?.slug, urgency:timingQueries[read('urgency').toLowerCase()] || (service === 'emergency-service' ? 'Emergency' : undefined) };
}
