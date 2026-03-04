# Changelog: evergreen_mechanical_services

**Changed At:** 2026-03-04T14:28:56.464Z
**Total Changes:** 28

## Changes

| Field | v1 Value | v2 Value | Reason |
|-------|----------|----------|--------|
| extraction_type | demo | onboarding_update | confirmed during onboarding call |
| business_hours.seasonal_hours | Looking at adding Saturday hours next ye... | Tom mentioned possibly adding Saturday h... | confirmed during onboarding call |
| business_hours.holiday_policy | null | Closed weekends except for emergencies. | confirmed during onboarding call |
| contact_info | [{"name":"Linda","role":"Office Manager"... | [{"name":"Linda","role":"Office Manager"... | confirmed during onboarding call |
| services_supported | ["Commercial plumbing (new construction ... | ["Commercial plumbing (new construction ... | confirmed during onboarding call |
| services_excluded | [] | ["Residential plumbing for homeowners","... | confirmed during onboarding call |
| emergency_definition | ["Burst pipes","Major water leaks","Sewe... | ["Burst or broken water pipes causing ac... | confirmed during onboarding call |
| emergency_routing_rules.escalation_chain | [{"tier":1,"name":"Linda (Dispatch Line)... | [{"tier":1,"name":"Jake","phone":"303-55... | confirmed during onboarding call |
| emergency_routing_rules.order | ["Attempt to reach dispatch line (monito... | ["For plumbing emergencies (burst pipes,... | confirmed during onboarding call |
| emergency_routing_rules.timeout_seconds | null | 30 | confirmed during onboarding call |
| emergency_routing_rules.fallback_action | null | If no one answers after all attempts, ta... | confirmed during onboarding call |
| non_emergency_routing_rules.action | Clara to answer calls, qualify intent, a... | Clara is to collect specific information... | confirmed during onboarding call |
| non_emergency_routing_rules.info_to_collect | ["name","phone_number","nature_of_issue"... | ["name","phone_number","company_name (if... | confirmed during onboarding call |
| non_emergency_routing_rules.callback_timeframe | During business hours | We will call back in the morning (next b... | confirmed during onboarding call |
| non_emergency_routing_rules.notes | null | Clara should never promise a specific ar... | confirmed during onboarding call |
| call_transfer_rules.during_hours_transfer | null | Linda Chen (Office Manager) at 303-555-0... | confirmed during onboarding call |
| call_transfer_rules.transfer_timeout_seconds | null | 20 | confirmed during onboarding call |
| call_transfer_rules.transfer_fail_action | null | Take a message for Linda Chen, and she w... | confirmed during onboarding call |
| call_transfer_rules.notes | [] | ["For clients specifically asking for To... | confirmed during onboarding call |
| integration_constraints | ["Integration with FieldEdge for dispatc... | ["Evergreen Mechanical Services uses Fie... | confirmed during onboarding call |
| after_hours_flow_summary | During after-hours (weekends and Monday-... | During after-hours (outside Mon-Fri, 7 A... | confirmed during onboarding call |
| office_hours_flow_summary | During business hours (Monday-Friday, 7 ... | During office hours (Monday through Frid... | confirmed during onboarding call |
| special_rules | ["AI agent must not promise specific arr... | ["Clara must never promise a specific ar... | confirmed during onboarding call |
| questions_or_unknowns | ["What is the exact process for non-emer... | [] | confirmed during onboarding call |
| notes | Evergreen Mechanical Services is a full-... | Updated with onboarding data. Operationa... | confirmed during onboarding call |
| version | null | v2 | confirmed during onboarding call |
| v1_date | null | 2024-11-25 | confirmed during onboarding call |
| v2_date | null | 2024-11-28 | confirmed during onboarding call |

## Fields Unchanged
- account_id
- business_hours.days
- business_hours.end_time
- business_hours.start_time
- business_hours.timezone
- company_name
- extraction_date
- office_address
- timezone

## Questions Resolved
- What is the exact process for non-emergency calls after hours? (e.g., voicemail, information collection only, specific message)
- What is the desired timeout for each tier in the emergency escalation chain before moving to the next contact?
- What is the exact routing for calls during office hours that Clara cannot resolve (e.g., transfer to Linda/Rachel/Amy)?
- What is the pricing for the Clara software?
- Are there any specific holiday policies?
- What is the plan for the potential Saturday hours next year?

## Questions Still Open
*None*
