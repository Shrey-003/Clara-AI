# Changelog: coastal_alarm_systems

**Changed At:** 2026-03-04T14:28:28.612Z
**Total Changes:** 26

## Changes

| Field | v1 Value | v2 Value | Reason |
|-------|----------|----------|--------|
| extraction_type | demo | onboarding_update | confirmed during onboarding call |
| business_hours.holiday_policy | null | Observe major holidays but flexible for ... | confirmed during onboarding call |
| contact_info | [{"name":"Maria","role":"Receptionist","... | [{"name":"Maria","role":"Receptionist","... | confirmed during onboarding call |
| services_supported | ["Commercial fire alarm system installat... | ["Commercial fire alarm system installat... | confirmed during onboarding call |
| services_excluded | [] | ["Residential work","Home security syste... | confirmed during onboarding call |
| emergency_definition | ["Fire alarm system malfunctions (especi... | ["Fire alarm system malfunctions causing... | confirmed during onboarding call |
| emergency_routing_rules.order | ["Transfer to Maria's phone number","If ... | ["Call Maria (Tier 1) for 30 seconds","I... | confirmed during onboarding call |
| emergency_routing_rules.timeout_seconds | null | 30 | confirmed during onboarding call |
| emergency_routing_rules.fallback_action | null | Take a detailed message with urgency lev... | confirmed during onboarding call |
| non_emergency_routing_rules.action | Clara to answer calls, identify as non-e... | Clara to take a detailed message. | confirmed during onboarding call |
| non_emergency_routing_rules.info_to_collect | ["caller_name","caller_phone_number","re... | ["name","company","phone_number","system... | confirmed during onboarding call |
| non_emergency_routing_rules.callback_timeframe | Next business day | Next business day by 10 AM | confirmed during onboarding call |
| non_emergency_routing_rules.notes | null | Most non-emergency calls are requests fo... | confirmed during onboarding call |
| call_transfer_rules.during_hours_transfer | null | Maria at 813-555-0145 (primary). Tony at... | confirmed during onboarding call |
| call_transfer_rules.transfer_timeout_seconds | null | 20 | confirmed during onboarding call |
| call_transfer_rules.transfer_fail_action | null | Clara to handle the call, collect inform... | confirmed during onboarding call |
| call_transfer_rules.notes | [] | ["For existing customers asking for Tony... | confirmed during onboarding call |
| integration_constraints | ["Uses Connectwise Manage for ticketing ... | ["Uses Connectwise Manage for ticketing ... | confirmed during onboarding call |
| after_hours_flow_summary | During after-hours (evenings, weekends, ... | During after-hours, if a call is identif... | confirmed during onboarding call |
| office_hours_flow_summary | During office hours (Monday-Friday, 8 AM... | During business hours (Monday-Friday, 8 ... | confirmed during onboarding call |
| special_rules | ["Coastal Alarm Systems does not work we... | ["Coastal Alarm Systems observes major h... | confirmed during onboarding call |
| questions_or_unknowns | ["What is the desired timeout duration f... | [] | confirmed during onboarding call |
| notes | Coastal Alarm Systems is a commercial se... | Updated with onboarding data. Operationa... | confirmed during onboarding call |
| version | null | v2 | confirmed during onboarding call |
| v1_date | null | 2024-11-22 | confirmed during onboarding call |
| v2_date | null | 2024-11-25 | confirmed during onboarding call |

## Fields Unchanged
- account_id
- business_hours.days
- business_hours.end_time
- business_hours.seasonal_hours
- business_hours.start_time
- business_hours.timezone
- company_name
- emergency_routing_rules.escalation_chain
- extraction_date
- office_address
- timezone

## Questions Resolved
- What is the desired timeout duration for each tier in the emergency escalation chain before moving to the next contact?
- What is the fallback action if Pete (Tier 3) cannot be reached for an emergency?
- What is the specific pricing for Clara's service?
- Are there specific email addresses for Maria, Tony, or Pete for non-phone communication or notifications?
- Should Clara send a summary of non-emergency messages via email or integrate with Connectwise Manage for message logging (despite no current API integration)?

## Questions Still Open
*None*
