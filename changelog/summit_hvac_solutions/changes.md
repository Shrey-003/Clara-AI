# Changelog: summit_hvac_solutions

**Changed At:** 2026-03-04T14:29:47.392Z
**Total Changes:** 31

## Changes

| Field | v1 Value | v2 Value | Reason |
|-------|----------|----------|--------|
| extraction_type | demo | onboarding_update | confirmed during onboarding call |
| business_hours.days | ["Monday","Tuesday","Wednesday","Thursda... | ["Monday","Tuesday","Wednesday","Thursda... | confirmed during onboarding call |
| business_hours.start_time | 6 AM | 06:00 | confirmed during onboarding call |
| business_hours.end_time | 6 PM | 18:00 | confirmed during onboarding call |
| business_hours.timezone | Mountain Time | America/Phoenix | confirmed during onboarding call |
| business_hours.seasonal_hours | Saturdays are 7 AM to 2 PM, April throug... | Saturdays: 7 AM to 2 PM from April throu... | confirmed during onboarding call |
| business_hours.holiday_policy | null | Closed on all major holidays (New Year's... | confirmed during onboarding call |
| timezone | Mountain Time | America/Phoenix | confirmed during onboarding call |
| contact_info | [{"name":"Karen","role":"Office Manager"... | [{"name":"Karen","role":"Office Manager"... | confirmed during onboarding call |
| services_supported | ["Commercial AC installation","Commercia... | ["Commercial AC installation","Commercia... | confirmed during onboarding call |
| services_excluded | [] | ["Window AC units","Plumbing beyond what... | confirmed during onboarding call |
| emergency_definition | ["Complete AC failure in a commercial bu... | ["Complete AC failure at any commercial ... | confirmed during onboarding call |
| emergency_routing_rules.order | ["Clara to identify emergency, then tran... | ["transfer to Rick","transfer to Danny",... | confirmed during onboarding call |
| emergency_routing_rules.timeout_seconds | null | 60 | confirmed during onboarding call |
| emergency_routing_rules.fallback_action | null | Take a detailed message including name, ... | confirmed during onboarding call |
| non_emergency_routing_rules.action | Clara to take a message for non-emergenc... | Clara to answer calls, collect caller in... | confirmed during onboarding call |
| non_emergency_routing_rules.info_to_collect | ["name","phone_number","service_needed",... | ["name","phone_number","service_type","a... | confirmed during onboarding call |
| non_emergency_routing_rules.callback_timeframe | Next business morning | First thing next business day. | confirmed during onboarding call |
| non_emergency_routing_rules.notes | null | Existing customers receive priority call... | confirmed during onboarding call |
| call_transfer_rules.during_hours_transfer | null | Karen Wheeler (602-555-0134) for existin... | confirmed during onboarding call |
| call_transfer_rules.transfer_timeout_seconds | null | 30 | confirmed during onboarding call |
| call_transfer_rules.transfer_fail_action | null | Take a message. | confirmed during onboarding call |
| integration_constraints | ["Summit HVAC Solutions uses Housecall P... | ["Clara does not need to integrate with ... | confirmed during onboarding call |
| after_hours_flow_summary | During after-hours, Clara will first det... | During after-hours, Clara will answer ca... | confirmed during onboarding call |
| office_hours_flow_summary | During office hours (Monday-Friday 6 AM-... | During business hours, Clara will answer... | confirmed during onboarding call |
| special_rules | ["Summit HVAC Solutions prioritizes comm... | ["Never promise same-day service for non... | confirmed during onboarding call |
| questions_or_unknowns | ["What is the specific routing logic for... | [] | confirmed during onboarding call |
| notes | Summit HVAC Solutions is a 15-year-old c... | Updated with onboarding data. Operationa... | confirmed during onboarding call |
| version | null | v2 | confirmed during onboarding call |
| v1_date | null | 2024-11-20 | confirmed during onboarding call |
| v2_date | null | 2024-11-23 | confirmed during onboarding call |

## Fields Unchanged
- account_id
- call_transfer_rules.notes
- company_name
- emergency_routing_rules.escalation_chain
- extraction_date
- office_address

## Questions Resolved
- What is the specific routing logic for calls during office hours (e.g., transfer to Karen, schedule directly in Housecall Pro, etc.)?
- What is the pricing for the Clara AI software?
- Are there any specific commercial clients that should be treated as emergencies regardless of the issue type?
- What is the timeout duration for transferring emergency calls before escalating to the next tier?

## Questions Still Open
*None*
