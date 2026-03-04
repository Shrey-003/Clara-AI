# Changelog: patriot_fire_protection

**Changed At:** 2026-03-04T14:29:17.284Z
**Total Changes:** 26

## Changes

| Field | v1 Value | v2 Value | Reason |
|-------|----------|----------|--------|
| extraction_type | demo | onboarding_update | confirmed during onboarding call |
| business_hours.days | ["Monday","Tuesday","Wednesday","Thursda... | ["Monday","Tuesday","Wednesday","Thursda... | confirmed during onboarding call |
| business_hours.seasonal_hours | Saturday crew works 8 AM to 12 PM for sc... | Saturday crew from 8 AM to 12 PM for sch... | confirmed during onboarding call |
| contact_info | [{"name":"Carlos","role":"Dispatcher","p... | [{"name":"Carlos","role":"Dispatcher","p... | confirmed during onboarding call |
| services_supported | ["fire sprinkler system installation","f... | ["fire sprinkler system installation","f... | confirmed during onboarding call |
| services_excluded | [] | ["Residential fire alarms","Security ala... | confirmed during onboarding call |
| emergency_definition | ["Fire sprinkler leaks","fire alarm malf... | ["Active fire sprinkler system leaks","F... | confirmed during onboarding call |
| emergency_routing_rules.escalation_chain | [{"tier":1,"name":"Carlos","phone":"713-... | [{"tier":1,"name":"Carlos (Dispatcher)",... | confirmed during onboarding call |
| emergency_routing_rules.order | ["transfer to Carlos (Dispatcher)","if C... | ["Transfer to Carlos (Dispatcher)","If n... | confirmed during onboarding call |
| emergency_routing_rules.fallback_action | null | If no one picks up after all three attem... | confirmed during onboarding call |
| non_emergency_routing_rules.action | Clara to answer calls, qualify intent, c... | Clara is to take a message for all non-e... | confirmed during onboarding call |
| non_emergency_routing_rules.info_to_collect | ["name","phone_number","reason_for_call"... | ["name","company_name","phone_number","p... | confirmed during onboarding call |
| non_emergency_routing_rules.callback_timeframe | next business day | Next business day | confirmed during onboarding call |
| non_emergency_routing_rules.notes | Many non-emergency calls are for inspect... | Clara should never promise a response ti... | confirmed during onboarding call |
| call_transfer_rules.during_hours_transfer | null | Monitoring company calls (e.g., ADT, Sim... | confirmed during onboarding call |
| call_transfer_rules.transfer_timeout_seconds | 45 | null | confirmed during onboarding call |
| call_transfer_rules.notes | ["Transfer timeout and fail action rules... | ["Monitoring company calls are considere... | confirmed during onboarding call |
| integration_constraints | ["Patriot Fire Protection uses ServiceTr... | ["Clara should never create sprinkler jo... | confirmed during onboarding call |
| after_hours_flow_summary | During after-hours (outside of Monday-Fr... | During after-hours, Clara will first det... | confirmed during onboarding call |
| office_hours_flow_summary | During office hours (Monday-Friday, 8 AM... | During office hours (Monday-Friday, 8 AM... | confirmed during onboarding call |
| special_rules | ["Automated systems must not create spri... | ["Patriot Fire Protection is licensed on... | confirmed during onboarding call |
| questions_or_unknowns | ["What is the fallback action if the on-... | [] | confirmed during onboarding call |
| notes | Patriot Fire Protection is an 8-year-old... | Updated with onboarding data. Operationa... | confirmed during onboarding call |
| version | null | v2 | confirmed during onboarding call |
| v1_date | null | 2024-11-18 | confirmed during onboarding call |
| v2_date | null | 2024-11-21 | confirmed during onboarding call |

## Fields Unchanged
- account_id
- business_hours.end_time
- business_hours.holiday_policy
- business_hours.start_time
- business_hours.timezone
- call_transfer_rules.transfer_fail_action
- company_name
- emergency_routing_rules.timeout_seconds
- extraction_date
- office_address
- timezone

## Questions Resolved
- What is the fallback action if the on-call technician (Luis) does not pick up during an emergency transfer?
- Is there a specific list of 'critical clients' or is the 'hospital' example indicative of any critical infrastructure client?
- What is the pricing for the AI software?
- What is the corporate structure of Patriot Fire Protection?
- Are there any specific requirements for a 2nd phone number status?
- What are the planned testing or kickoff dates for Clara?

## Questions Still Open
*None*
