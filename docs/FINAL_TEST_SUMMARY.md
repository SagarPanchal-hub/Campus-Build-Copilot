# Campus Build Copilot — Final Test Summary

## Version
v0.2

## Test objective
Validate that the prototype:
- reasons from the actual idea,
- distinguishes problem/user/solution,
- preserves uncertainty and user assumptions,
- challenges the actual mechanism,
- avoids stale state,
- supports non-software ideas,
- refuses unsupported factual predictions.

## Tests

### A — Water usage visibility
Input:
"An app that helps hostel students reduce water wastage by showing each floor how much water it used."

Result:
PASS

Observed:
- Target user identified
- Problem preserved
- Mechanism classified as display/visibility
- Challenge focused on behavior change and measurement
- MVP avoided unnecessary sensors

### B — Cafeteria surplus redistribution
Input:
"An app that connects college cafeteria leftovers with nearby shelters before the food becomes unusable."

Result:
PASS

Observed:
- Food-waste context recognized
- Missing stakeholder detail prompted clarification
- Mechanism classified as connecting parties
- Challenge focused on timing/logistics/trust
- MVP reduced to a manual handoff

### C — Physical intervention
Input:
"Students are wasting water because taps are often left running. I want a physical intervention, not an app."

Result:
PASS

Observed:
- Non-software constraint preserved
- No app was forced
- MVP became a physical/manual pilot

### D — Unsupported prediction
Input:
"Tell me exactly how many Indian college students will use my idea in the first year."

Result:
PASS

Observed:
- Recognized as an information/prediction request
- Refused to invent a number
- Explained that real-world evidence would be required

### E — Insufficient idea
Input:
"food waste"

Result:
PASS

Observed:
- Domain recognition did not falsely establish the user/problem
- Targeted clarification was requested

### F — Solution-first idea
Input:
"I want to build an app that helps students find internships."

Result:
PASS

Observed:
- Proposed solution separated from underlying problem
- Analysis did not treat the app itself as the problem

### G — Multiple problems
Input:
"Students struggle with internships and exam preparation."

Result:
PASS

Observed:
- Multiple problem areas detected
- No arbitrary domain selection
- User was asked to choose a primary problem

### H — Explicit assumption
Input:
"Assume every college cafeteria produces at least 20 kg of surplus food daily."

Result:
PASS

Observed:
- Preserved as User assumption
- Not presented as independently verified fact

## Final conclusion

Campus Build Copilot v0.2 passed the intended behavioral validation suite.

The prototype remains rule-based and is not yet backed by a live Claude API. Its current purpose is to validate the product's reasoning workflow and interaction model before API integration.