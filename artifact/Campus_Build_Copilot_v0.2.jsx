import React, { useState, useRef } from "react";
import {
  CheckCircle2,
  HelpCircle,
  AlertCircle,
  Eye,
  Loader2,
  AlertTriangle,
  ArrowRight,
  Quote,
} from "lucide-react";
 
/* ------------------------------------------------------------------------
 * AI LAYER (mocked, but idea-specific)
 * ------------------------------------------------------------------------
 * These functions are the only places that talk to "the model." Right now
 * they generate content deterministically from the actual idea text and
 * clarification answers (no live model call yet), so the rest of the UI
 * can be validated without a connection.
 *
 * To wire up a real Claude API call later, replace the generation logic
 * inside analyzeIdea() / challengeIdea() / buildSmallestMVP() with a
 * fetch() to /v1/messages, keeping the same inputs (originalIdea,
 * clarificationAnswers, prior analysis/challenge) and the same output
 * shape the components below already expect.
 * ---------------------------------------------------------------------- */
 
function snippet(text, max = 90) {
  const clean = (text || "").trim().replace(/\s+/g, " ");
  return clean.length > max ? clean.slice(0, max).trim() + "…" : clean;
}
 
function wordCount(text) {
  return (text || "").trim().split(/\s+/).filter(Boolean).length;
}
 
function capitalize(text) {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}
 
// Recognizes a non-answer like "idk", "not sure", "n/a" so we never treat
// a vague clarification answer as a confirmed fact.
function isVagueAnswer(text) {
  const t = (text || "").trim().toLowerCase();
  if (!t) return true;
  if (t.length < 3) return true;
  return /^(idk|i don't know|i dont know|not sure|unsure|no idea|dunno|n\/a|na|maybe|none|not really)\.?$/.test(t);
}
 
// Strips common lead-in phrasing so we're left with the core activity,
// e.g. "an app that helps students split rent" -> "split rent".
function extractCoreIdea(text) {
  let t = (text || "").trim();
  t = t.replace(/^(i want to build|i want to make|i'm building|i am building|i'm making|i am making|i'd like to build|i would like to build)\s+/i, "");
  t = t.replace(/^(an|a)\s+(app|application|website|platform|tool|service|system|program|prototype)\s+(that|which)\s+/i, "");
  t = t.replace(/^(an|a)\s+(app|application|website|platform|tool|service|system|program|prototype)\s+(for|to)\s+/i, "");
  t = t.replace(/^(that|which)\s+/i, "");
  t = t.replace(/[.!]+$/, "");
  return t.trim() || (text || "").trim();
}
 
const STOPWORDS = new Set([
  "that","which","with","from","this","have","would","could","should","about","into","when","where","while",
  "there","their","students","student","people","person","some","most","many","also","just","only","really",
  "want","need","help","helps","helping","build","building","make","making","create","creating","idea","app",
  "tool","platform","website","service","system","program","without","using","between","because","being","than",
  "them","they","your","around","other","more","less","very","like","such","each","every","those","these",
  "chatbot","dashboard","assistant","bot","develop","design","powered",
]);
 
// Pulls out a handful of distinct content words to keep generic (no
// matched domain) output tied to the actual idea rather than boilerplate.
function extractKeywords(text, max = 4) {
  const words = (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w));
  const seen = [];
  for (const w of words) {
    if (!seen.includes(w)) seen.push(w);
    if (seen.length >= max) break;
  }
  return seen;
}
 
// Common role/user-type nouns. Used both to detect whether an idea already
// names its audience, and to decide whether clarification is needed.
const USER_TYPE_PATTERN = /\b(students?|freshm[ae]n|sophomores?|juniors?|seniors?|roommates?|tenants?|renters?|professors?|instructors?|advisors?|employees?|employers?|recruiters?|managers?|employers?|customers?|clients?|shoppers?|commuters?|drivers?|riders?|passengers?|patients?|athletes?|coaches?|parents?|freelancers?|interns?|founders?|small business(?:es)?|residents?|neighbors?|volunteers?|organizers?|club members?)\b/i;
 
// Common problem/pain indicator words. Used to detect whether an idea
// already implies a concrete problem, separate from naming a domain.
const PROBLEM_SIGNAL_PATTERN = /\b(waste[ds]?|wasting|wastage|avoid|prevent|reduce|manage|managing|track(?:ing)?|struggle|struggling|difficult|hard to|can'?t|cannot|don'?t know|missing|disorganized|expensive|unsafe|unclear|confusing|lose|losing|forget(?:ting)?|scam|fraud|delay(?:ed|s)?|stuck|overwhelm(?:ed|ing)?|late|missed|inefficient|slow|frustrat(?:ing|ed)|annoying|risk|unsure|complicated)\b/i;
 
// ------------------------------------------------------------------------
// INPUT INTENT + EXTRACTION HELPERS
// ------------------------------------------------------------------------
// Distinguishes what a raw submission actually is before it's treated as a
// product idea to analyze, so a factual question can't be silently turned
// into a fake idea, and an explicit user assumption isn't lost or presented
// as a confirmed fact.
 
// Detects a request for a specific, unknowable number/prediction (market
// size, adoption, user counts, revenue, etc.) rather than a product idea.
function classifyIntent(text) {
  const t = (text || "").trim();
  const lower = t.toLowerCase();
  const asksForNumber = /\b(how many|how much|what percentage|what number|exactly how many|predict|estimate|projected|forecast)\b/.test(lower);
  const asksAboutUnknowable = /\b(users?|students?|people|revenue|market|adopt(?:ion)?|customers?|sales|downloads|succeed|success)\b/.test(lower);
  const looksLikeQuestion = t.endsWith("?") || /^(tell me|what is|what will|how many|how much|can you tell)/i.test(t);
  if (looksLikeQuestion && asksForNumber && asksAboutUnknowable) {
    return "information_question";
  }
  if (/ignore (all|previous|your|the above) instructions|disregard (all|previous) instructions/i.test(lower)) {
    return "unrelated_instruction";
  }
  return "idea";
}
 
// Any embedded instruction trying to make the system assert certainty
// ("guaranteed to succeed", "say this will work") is neutralized: it's
// never treated as evidence, and no output ever claims guaranteed success.
function containsInjectionAttempt(text) {
  return /ignore (all|previous|your|the above) instructions|guaranteed to succeed|say (this|it) (is|will)|definitely (will|succeed)/i.test(text || "");
}
 
// Removes sentences that try to instruct the system directly, so they
// never influence domain/mechanism detection or reasoning — only display
// (Known, quoting the original idea) ever shows the untouched original.
function stripInjectionClauses(text) {
  const sentences = (text || "").split(/(?<=[.!?])\s+|\n+/);
  return sentences.filter((s) => !containsInjectionAttempt(s)).join(" ").trim() || text;
}
 
const SOLUTION_NOUN = "(?:ai[- ]?powered\\s+)?(?:app|application|website|platform|tool|dashboard|bot|chatbot|assistant|system)";
 
// Separates a proposed solution ("build an AI chatbot for X", "I want an
// app...", "a platform that...") from the underlying problem, so the
// solution itself is never treated as the problem statement. Returns null
// if the idea isn't solution-first.
function extractProposedSolution(text) {
  const t = (text || "").trim();
 
  let m = t.match(new RegExp(`\\b(?:i want to build|i want|i'm building|i am building|i am thinking of building|i'd like to build|my idea is to (?:build|create|make)|we could use|is to build|is to create)\\s+(an|a)\\s+(${SOLUTION_NOUN})\\b\\s*(?:that|to|for)?\\s*(.*)`, "i"));
  if (m) return { solutionPhrase: `${m[1]} ${m[2]}`.trim(), remainder: (m[3] || "").trim() };
 
  m = t.match(new RegExp(`\\b(?:build|create|make|develop|design)\\s+(an|a)\\s+(${SOLUTION_NOUN})\\b\\s*(?:that|to|for)?\\s*(.*)`, "i"));
  if (m) return { solutionPhrase: `${m[1]} ${m[2]}`.trim(), remainder: (m[3] || "").trim() };
 
  m = t.match(new RegExp(`^(an|a)\\s+(${SOLUTION_NOUN})\\b\\s*(?:that|to|for)?\\s*(.*)`, "i"));
  if (m) return { solutionPhrase: `${m[1]} ${m[2]}`.trim(), remainder: (m[3] || "").trim() };
 
  return null;
}
 
// Splits an idea into clauses and flags when more than one distinct,
// recognized problem domain is present, so the tool doesn't silently
// merge or arbitrarily pick between unrelated problems.
function detectMultipleProblems(text) {
  const clauses = (text || "").split(/,| and | as well as |;|\. /i).map((c) => c.trim()).filter(Boolean);
  const domains = new Set();
  clauses.forEach((c) => {
    const d = detectDomain(c);
    if (d !== "generic") domains.add(d);
  });
  return domains.size > 1 ? Array.from(domains) : null;
}
 
// Pulls out any clause the user explicitly introduced with "assume" /
// "assuming" so it can be preserved verbatim and labeled as an unverified
// user assumption rather than folded into system-inferred Assumed items.
function extractUserAssumptions(...texts) {
  const found = [];
  for (const text of texts) {
    if (!text) continue;
    const sentences = text.split(/(?<=[.!?])\s+|\n+/);
    for (const s of sentences) {
      if (/^\s*assum(e|ing)\b/i.test(s.trim())) {
        found.push(s.trim());
      }
    }
  }
  return found;
}
 
// Whether the idea explicitly rules out building software (app/website),
// so MVP and solution framing can talk about a physical/process/service
// intervention instead of accounts, logins, and screens.
function detectSolutionMedium(text) {
  const t = (text || "").toLowerCase();
  if (/\bwithout (building |making )?(a |an )?(mobile |web )?app\b|\bnot an app\b|\bno app\b|\bwithout (an |a )?app\b|\bphysical (intervention|change|solution)\b|\bnot software\b/.test(t)) {
    return "non_software";
  }
  return "software";
}
 
// Detects a plain contradiction between a stated target user in the idea
// text and a differently-worded target user given during clarification, so
// one isn't silently discarded in favor of the other without a note.
function detectContradiction(originalIdea, clarificationAnswers) {
  const stated = originalIdea.match(USER_TYPE_PATTERN);
  const clarified = clarificationAnswers && clarificationAnswers.targetUser;
  if (!stated || !clarified || isVagueAnswer(clarified)) return null;
  const statedWord = stated[0].toLowerCase();
  const clarifiedWords = clarified.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  const overlaps = clarifiedWords.some((w) => w.includes(statedWord) || statedWord.includes(w));
  if (overlaps) return null;
  return { stated: stated[0], clarified: clarified.trim() };
}
 
// Defensive check applied before rendering any generated section: catches
// empty/undefined output or output that still contains an unresolved
// template artifact, and swaps in a safe, honest fallback instead of
// silently displaying something broken or stale.
function sanitizeText(text, fallback) {
  if (typeof text !== "string" || !text.trim() || /undefined|\[object Object\]|NaN/.test(text)) {
    return fallback || "This section needs more information before it can be generated reliably.";
  }
  return text;
}
 
/* ------------------------------------------------------------------------
 * MECHANISM ENGINE
 * ------------------------------------------------------------------------
 * This is what makes two ideas in the same domain produce different
 * reasoning: instead of reading everything off DOMAIN_LIBRARY[domain], we
 * extract the actual mechanism the user described (what the thing DOES —
 * "shows usage", "connects X with Y", "reminds", "detects") and reason
 * from that. DOMAIN_LIBRARY is only consulted afterward for a light
 * vocabulary/existing-alternative flavor, never for the core content.
 * ---------------------------------------------------------------------- */
 
// Pulls out the clause describing what the proposed thing actually does,
// e.g. "shows each floor how much water it used" / "connects cafeteria
// leftovers with nearby shelters". Falls back to the cleaned core idea.
function extractMechanism(text, proposedSolution) {
  const source = proposedSolution ? proposedSolution.remainder : text;
  if (source) {
    const m = source.match(/^(?:that|to|for|which)?\s*(.+)/i);
    if (m && m[1] && m[1].trim().length > 3) return m[1].trim().replace(/[.!]+$/, "");
  }
  return extractCoreIdea(text);
}
 
// Classifies the mechanism into a small set of functional types. This,
// not the domain, drives solution/challenge/MVP content.
function classifyMechanism(mechanismText, medium) {
  const t = (mechanismText || "").toLowerCase();
  // Explicit non-software requests (item Q) always win — a physical/
  // operational fix isn't disqualified by the idea also mentioning "not
  // an app" or similar negated software words.
  if (medium === "non_software") return "physical_intervention";
  if (/\bconnect|match(?:es|ing)?|link[s]?\b.*\bwith\b|between\b/.test(t)) return "connects_parties";
  if (/\bshow|display|visuali[sz]e|see (how|their)|report[s]?\b/.test(t)) return "display_data";
  if (/\bdetect|predict|flag|identif(?:y|ies)|classif/.test(t)) return "automates_detects";
  if (/\bremind|notif|alert/.test(t)) return "reminds_notifies";
  if (/\btrack|log(?:s|ging)?|record/.test(t)) return "tracks_logs";
  if (/\bschedul|coordinat|book(?:ing)?|match(?:es|ing)? (?:times|slots)/.test(t)) return "coordinates_schedules";
  if (/\beducat|inform|teach|explain|checklist/.test(t)) return "educates_informs";
  return "generic_tool";
}
 
const MECHANISM_CHALLENGE = {
  display_data: {
    weakestAssumption: "That seeing usage or activity data is the missing piece — people often already know roughly what's happening and don't act on a number alone without an added incentive or consequence.",
    biggestAdoptionRisk: "A display or report only changes anything if people actually check it regularly; a screen or page nobody looks at changes nothing.",
    biggestTechnicalRisk: "Getting accurate, trustworthy per-unit data (per floor, per person) usually needs metering or instrumentation a first version won't have — without it, the numbers shown may be misleading.",
    whyUsersMightNotCare: "If no individual bears the cost or consequence of what's shown, a shared number is easy to shrug off as 'someone else's problem.'",
    simplificationOpportunity: "Skip live or automatic data collection for version one — post a manually-updated number and see if visibility alone changes anything before automating it.",
    fastestValidationExperiment: "Post a manually-tracked number for one unit for two weeks and compare it against a similar unit with no visible number at all.",
  },
  connects_parties: {
    weakestAssumption: "That the two sides don't already have a way to connect — an informal relationship, a phone call, or an existing volunteer arrangement may already handle this well enough.",
    biggestAdoptionRisk: "This only works if both sides show up on a compatible schedule; if either side is inconsistent, the match fails regardless of how good the matching is.",
    biggestTechnicalRisk: "Matching supply and demand with the right timing (before something spoils or a slot closes) needs real-time status that a first version, without live updates, likely can't guarantee.",
    whyUsersMightNotCare: "Whoever provides the supply may have no incentive to log or report it unless doing so costs them essentially zero extra effort.",
    simplificationOpportunity: "Skip matching logic entirely for version one — connect exactly one supplier to one recipient manually and see if the handoff itself works.",
    fastestValidationExperiment: "Arrange and complete one real handoff by phone or message, and track exactly what goes wrong, before building any coordination tool.",
  },
  tracks_logs: {
    weakestAssumption: "That the information needed is something people will log accurately and consistently themselves, rather than something that needs independent observation.",
    biggestAdoptionRisk: "Manual logging is exactly the kind of task people intend to keep up with and then quietly abandon within the first couple of weeks.",
    biggestTechnicalRisk: "Without automatic capture, accuracy depends entirely on user discipline — any decision built on that data inherits that uncertainty.",
    whyUsersMightNotCare: "If the payoff for logging is delayed or small, the extra step stops feeling worth it quickly.",
    simplificationOpportunity: "Drop the log for version one — observe or measure the situation directly yourself for a short period instead of asking anyone to track it.",
    fastestValidationExperiment: "Manually track the same thing yourself, in the real setting, for a week, and see if the pattern you're assuming is actually there.",
  },
  reminds_notifies: {
    weakestAssumption: "That the target group is missing this because they forget, rather than because of a deeper constraint — cost, access, or willingness.",
    biggestAdoptionRisk: "Reminders are easy to ignore or mute after the first few, especially if they don't map to something the person can act on immediately.",
    biggestTechnicalRisk: "Getting the timing and trigger logic right is harder than it looks, and getting it wrong erodes trust in the reminders fast.",
    whyUsersMightNotCare: "If people already have their own way of remembering, a new source of reminders competes with, rather than replaces, what they use.",
    simplificationOpportunity: "Replace the automated trigger with a single, manually-sent reminder to a small group and see if that alone helps.",
    fastestValidationExperiment: "Manually send the intended reminder to a small group at the right moment for two weeks and track whether behavior actually changes.",
  },
  automates_detects: {
    weakestAssumption: "That automatic detection would be reliable enough to trust — false positives or misses could make the tool worse than doing nothing.",
    biggestAdoptionRisk: "People are unlikely to trust an automated flag they don't understand for something consequential; low trust means the alerts get ignored.",
    biggestTechnicalRisk: "Reliable detection needs real, representative data to build and test against, which a student project realistically won't have access to.",
    whyUsersMightNotCare: "Even a moderate false-positive rate teaches people to dismiss the tool's output entirely.",
    simplificationOpportunity: "Drop automated detection for version one — use a manual checklist or human review, and only revisit automation once there's a track record.",
    fastestValidationExperiment: "Manually apply the intended logic to 10–20 real past cases and check how often it would have been right.",
  },
  coordinates_schedules: {
    weakestAssumption: "That coordination itself is the bottleneck, rather than availability, willingness, or capacity on one side.",
    biggestAdoptionRisk: "Coordination only works if everyone involved keeps their own status current; one inconsistent participant breaks it for the rest.",
    biggestTechnicalRisk: "Keeping schedules in sync across everyone, especially with last-minute changes, is more complex than a simple booking flow suggests.",
    whyUsersMightNotCare: "If informal coordination (texts, calls) already works most of the time, switching may not feel worth it.",
    simplificationOpportunity: "Coordinate one real instance manually before building any scheduling logic.",
    fastestValidationExperiment: "Manually coordinate a handful of real instances and track exactly where the friction happens.",
  },
  educates_informs: {
    weakestAssumption: "That lack of information is the actual barrier — the target group may already know the facts and still not act differently.",
    biggestAdoptionRisk: "People rarely seek out educational content unless already motivated, which limits reach regardless of quality.",
    biggestTechnicalRisk: "Keeping the information accurate and current requires ongoing upkeep a one-time build won't provide.",
    whyUsersMightNotCare: "Being told about a problem doesn't reliably change behavior, especially if acting on it costs time or money.",
    simplificationOpportunity: "Skip building a content platform — hand the exact information directly to a few people and see if it changes anything first.",
    fastestValidationExperiment: "Share the core information directly with 5–10 people and observe whether their behavior actually shifts afterward.",
  },
  physical_intervention: {
    weakestAssumption: "That the intervention will actually be maintained once installed — most physical or process changes degrade without a clear owner.",
    biggestAdoptionRisk: "Whoever is supposed to maintain the change may deprioritize it once it's no longer new.",
    biggestTechnicalRisk: "Measuring whether the intervention actually worked, without instrumentation, is harder than it looks.",
    whyUsersMightNotCare: "If nobody is personally accountable for the outcome, a physical change is easy to work around or ignore.",
    simplificationOpportunity: "Pilot the change in the smallest possible unit before expanding it anywhere else.",
    fastestValidationExperiment: "Run the change in one location for a fixed period and directly compare it to a similar location without the change.",
  },
  generic_tool: {
    weakestAssumption: "That the target user would adopt something new for this at all, rather than tolerating the current workaround indefinitely.",
    biggestAdoptionRisk: "The target user already has a \"good enough\" habit here, so switching costs more effort than the tool initially saves.",
    biggestTechnicalRisk: "Underestimating how much setup or manual input is needed before this becomes useful to a first-time user.",
    whyUsersMightNotCare: "This may only come up occasionally, so a dedicated fix competes with \"I'll just deal with it this once.\"",
    simplificationOpportunity: "Cut every feature except the single core action for version one, and test with a no-login, single-session flow.",
    fastestValidationExperiment: "Show a rough mockup or paper version to 5–10 real target users and watch whether they can complete the task with it.",
  },
};
 
const MECHANISM_ASSUMPTIONS = {
  display_data: ["People will look at the display or number regularly enough for it to influence behavior.", "Seeing the data is the missing piece, rather than motivation or ability to act on it."],
  connects_parties: ["Both sides are willing and able to participate on a compatible schedule.", "There isn't already an informal channel that handles this well enough."],
  tracks_logs: ["The target user is willing to log this consistently, by hand, without automation.", "What gets logged is accurate enough to be useful without independent verification."],
  reminds_notifies: ["The target group is missing this due to forgetting, not a deeper constraint.", "A reminder from a new source would get more attention than what they already use."],
  automates_detects: ["Enough real, representative data exists (or can be gathered) to make detection meaningfully accurate.", "Users would trust an automated result enough to act on it."],
  coordinates_schedules: ["All parties involved would keep their own availability or status current.", "Coordination is the actual bottleneck, not capacity or willingness."],
  educates_informs: ["Not knowing the information is a real barrier here, not just an inconvenience.", "Delivering information changes behavior, not just awareness."],
  physical_intervention: ["Someone will take ownership of maintaining the change after it's made.", "The cause is what's assumed (e.g. behavior), rather than infrastructure or design."],
  generic_tool: ["The target user experiences this often enough to want a dedicated fix.", "A basic first version would still be useful enough to test."],
};
 
const MECHANISM_SOLUTION_ALTS = {
  display_data: { title: "Manual/paper version of the display", description: "The same information shown, but manually updated instead of automated — enough to test whether visibility alone changes behavior." },
  connects_parties: { title: "Manual single-match pilot", description: "Connect exactly one supplier to one recipient by hand (a call, a message) before building any matching logic." },
  tracks_logs: { title: "Direct observation instead of logging", description: "Measure or observe the situation directly for a short period instead of relying on anyone to log it themselves." },
  reminds_notifies: { title: "Manually-sent reminder", description: "Send the same reminder by hand to a small group and see if timing/awareness was really the gap." },
  automates_detects: { title: "Manual checklist instead of automation", description: "Apply the intended detection logic by hand to real cases first, before trusting any automated version." },
  coordinates_schedules: { title: "Manual one-off coordination", description: "Coordinate a single real instance by phone or message before building scheduling logic." },
  educates_informs: { title: "Direct, one-to-one delivery", description: "Hand the exact information to a few real people directly, instead of building a content platform." },
  physical_intervention: { title: "Single-location pilot", description: "Apply the change in the smallest possible unit (one room, one floor) before expanding it." },
  generic_tool: { title: "Manual/assisted version", description: "A version of the current manual process with light assistance, without full automation." },
};
 
const MECHANISM_MVP_SCOPE = {
  display_data: { inScope: ["One unit's usage or activity shown, manually updated", "A simple, understandable number or chart — no trend history needed yet", "Enough context that the number makes sense on its own"], outScope: ["Automatic or sensor-based data collection", "Per-person breakdowns", "Notifications or cross-unit comparisons"] },
  connects_parties: { inScope: ["Exactly one supplier matched to one recipient", "A manual way to confirm the handoff happened", "Enough info for both sides to trust it's real"], outScope: ["Automated matching logic", "Multiple simultaneous matches", "In-app messaging or accounts"] },
  tracks_logs: { inScope: ["Logging one specific item or action, end-to-end", "A single input and a single clear output", "Enough guidance that a first-time user isn't confused"], outScope: ["Automatic data capture", "Historical dashboards", "Accounts or saved history"] },
  reminds_notifies: { inScope: ["One manually-triggered reminder for one small group", "A single, clear moment for the reminder", "A simple way to see whether it was acted on"], outScope: ["Automated triggers", "Personalized scheduling logic", "Notification settings/preferences"] },
  automates_detects: { inScope: ["A manual checklist replicating the intended logic", "Applying it to a handful of real cases", "A simple way to record the outcome"], outScope: ["Any automated/ML detection", "Real-time monitoring", "Live data-source integration"] },
  coordinates_schedules: { inScope: ["Coordinating exactly one real instance manually", "A single confirmed booking or match", "Enough info for both sides to show up"], outScope: ["Automated scheduling logic", "Handling conflicts at scale", "Accounts or calendars"] },
  educates_informs: { inScope: ["The core information delivered directly to a handful of people", "One clear call to action", "A simple way to see if behavior changed"], outScope: ["A full content platform", "Ongoing content updates", "Accounts or personalization"] },
  physical_intervention: { inScope: ["One specific location or group", "The intervention itself", "A simple manual way to measure before/after"], outScope: ["Any mobile or web app", "Automated tracking or sensors", "Rolling out beyond the pilot group"] },
  generic_tool: { inScope: ["One core task, done end-to-end", "A single input and a single clear output", "Enough guidance that a first-time user isn't confused"], outScope: ["Accounts or login", "Saved history or dashboards", "Collaboration or sharing features"] },
};
 
/* ------------------------------------------------------------------------
 * DOMAIN LIBRARY
 * ------------------------------------------------------------------------
 * Each domain packages the vocabulary needed to reason about a category of
 * idea in a materially different way from the others (food waste vs.
 * traffic vs. internships vs. fraud, etc.). detectDomain() matches idea
 * text against `match` and picks the first hit; "generic" is the fallback
 * for anything that doesn't match a known category.
 * ---------------------------------------------------------------------- */
 
 
const DOMAIN_LIBRARY = {
  food_waste: {
    match: /food waste|leftover|expir|spoil|compost|meal plan|grocery|groceries/i,
    activityNoun: "reducing food waste",
    workaround: "checking the fridge from memory or tossing food once it looks or smells off",
    assumptions: [
      "People actually notice and care when food goes to waste, rather than treating it as a normal cost of stocking up.",
      "Logging or checking on food items is worth the extra few seconds it takes, often enough to become a habit.",
      "The waste is mainly caused by poor visibility into what's about to expire, not a lack of time or cooking skill.",
    ],
    solutions: [
      { title: "Expiry reminder", description: "A minimal tool that only reminds people about items likely to expire soon, without tracking a full inventory." },
      { title: "Manual log + prompts", description: "A simple log where someone enters what they bought once, then gets a nudge before it likely spoils." },
      { title: "Shared household view", description: "A shared view for roommates or a household so everyone can see what's about to go bad before it's wasted." },
    ],
    weakestAssumption: "That the real cause is a lack of visibility into what's expiring, rather than time, cooking skill, or simply buying more than needed.",
    adoptionRisk: "Logging food takes ongoing effort, and the payoff (a few dollars of food saved) may not feel worth maintaining the habit past the first week.",
    technicalRisk: "Keeping expiry data accurate without manual entry is hard — barcode or receipt scanning adds real complexity for a first version.",
    whyNotCare: "Wasting a bit of food rarely feels costly enough in the moment to change behavior, especially compared to the effort of tracking it.",
    simplification: "Drop inventory tracking entirely for version one — start with a single feature: a reminder for the two or three items most likely to expire this week.",
    validation: "Give 5–10 people a plain paper checklist for their fridge for one week and see if they'd actually keep using something like it.",
  },
 
  transportation: {
    match: /traffic|commut|parking|carpool|rideshare|bus route|bike share|shuttle|congestion/i,
    activityNoun: "getting around campus or the city more efficiently",
    workaround: "checking a maps app manually or just leaving extra early to absorb delays",
    assumptions: [
      "The delay or friction being described happens often enough, and predictably enough, that a dedicated tool adds value over a general maps app.",
      "The target users have some flexibility in departure time or route, so better information actually changes their behavior.",
      "Real-time or accurate data for this specific route or mode is realistically obtainable.",
    ],
    solutions: [
      { title: "Route/time advisory", description: "A focused tool that tells a specific group when to leave to avoid a specific, recurring bottleneck." },
      { title: "Matching tool", description: "A tool that matches people heading the same way at the same time, for carpooling or shared trips." },
      { title: "Reporting layer", description: "A lightweight way for people to report real-time conditions (delays, full lots) that a general maps app doesn't capture." },
    ],
    weakestAssumption: "That existing maps and transit apps are missing something specific for this group, rather than already solving the problem well enough.",
    adoptionRisk: "Commuting habits are sticky — people default to whatever route they already know, even if it's slightly slower.",
    technicalRisk: "Getting real-time, accurate data (traffic, parking, transit) for a small niche case is often harder and more expensive than it looks.",
    whyNotCare: "A few minutes saved on a commute rarely feels worth installing and checking a new app.",
    simplification: "Narrow to one specific, recurring bottleneck (one lot, one route, one shuttle) instead of solving transportation broadly.",
    validation: "Track how a small group actually commutes for a week using a shared spreadsheet or group chat, before building any routing logic.",
  },
 
  career_internship: {
    match: /internship|resum[eé]|job application|career fair|recruiting|job search|networking event/i,
    activityNoun: "finding or applying to internships",
    workaround: "manually tracking applications in a spreadsheet or notes app, and searching job boards individually",
    assumptions: [
      "The bottleneck is discovery and organization (finding and tracking opportunities), not the underlying difficulty of getting hired.",
      "Students would trust a new tool with sensitive application data — resumes, contacts — enough to rely on it.",
      "There's a consistent enough volume of relevant opportunities to make checking a dedicated tool worthwhile.",
    ],
    solutions: [
      { title: "Application tracker", description: "A focused tracker for the applications a student is already submitting, replacing the spreadsheet." },
      { title: "Curated matching", description: "A tool that filters postings down to a small, relevant set instead of a generic job-board search." },
      { title: "Peer accountability", description: "A lightweight way for students to share progress and deadlines with peers doing the same search." },
    ],
    weakestAssumption: "That better organization or matching meaningfully increases the chance of landing an internship, rather than the core bottleneck being competitiveness or experience.",
    adoptionRisk: "Students already use spreadsheets, LinkedIn, and Handshake — switching means proving clear extra value fast.",
    technicalRisk: "Reliably pulling and de-duplicating live internship postings from multiple sources without paid API access is harder than it looks.",
    whyNotCare: "During the busiest weeks of the search, students may not have time to learn a new tool, even a helpful one.",
    simplification: "Skip live postings entirely for version one — let students manually add postings they've already found, and just track status and deadlines.",
    validation: "Ask 5–10 students currently applying to internships to track their next two weeks of applications in a shared sheet shaped like your MVP.",
  },
 
  financial_fraud: {
    match: /fraud|scam|phishing|identity theft|fake charge|money launder/i,
    activityNoun: "detecting or preventing financial fraud",
    workaround: "manually checking bank statements or relying on the bank's own fraud alerts",
    assumptions: [
      "Target users would recognize a fraud alert as trustworthy and act on it quickly, rather than dismissing it as noise.",
      "The specific fraud pattern being targeted is common enough among the target group to justify a dedicated tool.",
      "A student-built version could access enough real, safe transaction signal to say anything meaningful about a given charge.",
    ],
    solutions: [
      { title: "Education / checklist tool", description: "A tool that helps someone evaluate a suspicious message or charge against a clear checklist, without needing account access." },
      { title: "Manual reporting hub", description: "A place for a specific community, like a campus, to report and see recent scam patterns targeting them." },
      { title: "Guided response flow", description: "A step-by-step flow for what to do immediately after suspecting fraud, rather than trying to detect it automatically." },
    ],
    weakestAssumption: "That people would trust an automated flag over their own judgment or their bank's existing fraud systems.",
    adoptionRisk: "People mostly think about fraud protection right after being scammed — by then, the tool wasn't there when it was needed.",
    technicalRisk: "Real fraud detection requires transaction-level and fraud-labeled data that a student project realistically cannot obtain or process safely.",
    whyNotCare: "Most people assume fraud 'won't happen to them' until it already has, which limits interest in a prevention tool ahead of time.",
    simplification: "Drop automated detection entirely for version one — start with an educational checklist and a place to report scams seen on campus.",
    validation: "Share a short list of real recent scam examples with 5–10 students and see whether they'd actually change behavior based on it, before building any detection logic.",
  },
 
  resource_conservation: {
    match: /water wast|wasting water|water being wasted|water conservation|water usage|water shortage|electricity waste|energy waste|power (outage|shortage)|hostel water|dorm water|utility (waste|usage)/i,
    activityNoun: "reducing water or utility waste in a shared facility",
    workaround: "informal reminders, notices, or relying on individuals to self-regulate usage",
    assumptions: [
      "The waste is caused by behavior (taps left running, long showers) rather than leaks or faulty fixtures, which a behavioral fix wouldn't solve.",
      "The people using the resource would change behavior if given better visibility or reminders, rather than treating it as someone else's responsibility.",
      "Facility staff or management would support and enforce whatever intervention is proposed.",
    ],
    solutions: [
      { title: "Usage visibility", description: "A simple, visible display or regular report of usage for a floor or building, without any app for residents to install." },
      { title: "Fixture-level fix", description: "Identifying and fixing specific high-waste fixtures (leaky taps, running toilets) — an operational fix, not a behavioral one." },
      { title: "Manual pilot", description: "A short manual campaign (signage, verbal reminders) in one wing or floor, measured against a control area." },
    ],
    weakestAssumption: "That the waste is mainly behavioral, when it may just as easily be leaking or faulty infrastructure that no amount of reminders will fix.",
    adoptionRisk: "Shared-resource problems suffer from diffused responsibility — if no single person owns the outcome, reminders alone rarely change collective behavior.",
    technicalRisk: "Measuring actual water/utility usage per person or per wing usually requires submetering hardware that a first version likely won't have.",
    whyNotCare: "Individual residents don't pay the utility bill directly, so they have little personal incentive to change behavior.",
    simplification: "Skip any tracking system for version one — start by simply auditing fixtures in one building for leaks, which needs no software at all.",
    validation: "Compare metered or estimated usage in one wing before and after a single manual intervention (signage or a fixed fixture) for two weeks.",
  },
 
  finance_roommate: {
    match: /split rent|split bill|roommate|shared expense|subletting|sublet|apartment search|dorm|lease|shared budget|budgeting with/i,
    activityNoun: "splitting shared costs or managing a shared budget with roommates",
    workaround: "doing the math in a group chat or a shared spreadsheet",
    assumptions: [
      "The current group-chat or spreadsheet method is actually causing friction (disputes, forgotten payments), not just mild annoyance.",
      "Every roommate would be willing to adopt a new tool together, not just the one person who's annoyed by the current mess.",
      "The tracking and math is the hard part, rather than the awkwardness of asking someone to actually pay.",
    ],
    solutions: [
      { title: "Shared ledger", description: "A simple shared ledger that tracks who paid for what and who owes whom, replacing the spreadsheet." },
      { title: "Split calculator", description: "A single-use calculator for splitting one bill or purchase at a time, with no ongoing account needed." },
      { title: "Reminder layer", description: "A tool focused only on reminding people when a shared payment is due, layered on top of however they already split costs." },
    ],
    weakestAssumption: "That better tracking fixes the actual friction, when the real issue may be one roommate being slow to pay regardless of what tracks it.",
    adoptionRisk: "It only works if every roommate uses it — one holdout who keeps using cash or a side chat breaks the whole system.",
    technicalRisk: "Handling real money movement safely adds real complexity; tracking who-owes-whom without moving money is much simpler for a first version.",
    whyNotCare: "Roommates who already trust each other may not feel a tracking tool is worth the setup effort.",
    simplification: "Track who-owes-whom only — don't move real money in version one; let people settle up however they already do.",
    validation: "Get 2–3 real roommate groups to use a shared spreadsheet shaped like your MVP for two weeks and see if it actually reduces the back-and-forth.",
  },
 
  scheduling_productivity: {
    match: /schedule|calendar|deadline|time management|study plan|productivity|to-?do list|task list/i,
    activityNoun: "managing schedules, deadlines, or tasks",
    workaround: "using a generic calendar app or a paper planner",
    assumptions: [
      "The problem is really about staying organized, not about motivation or overall workload.",
      "A dedicated tool would actually get opened daily, rather than becoming one more app that's ignored after a week.",
      "The specific structure being proposed matches how the target group naturally thinks about their time.",
    ],
    solutions: [
      { title: "Focused single-view planner", description: "A single, minimal view of only the next few deadlines, instead of a full-featured calendar." },
      { title: "Automatic reminders", description: "A layer that sits on top of an existing calendar and adds targeted reminders for the moments people actually miss." },
      { title: "Shared accountability", description: "A shared view where a small group can see each other's deadlines for mutual accountability." },
    ],
    weakestAssumption: "That the target group's issue is a lack of a tool, rather than a lack of consistent habit, which a new tool alone won't fix.",
    adoptionRisk: "Productivity tools have some of the highest abandonment rates — most are dropped within the first two weeks.",
    technicalRisk: "Syncing reliably with existing calendars (Google, Outlook, school systems) across platforms is more work than it appears.",
    whyNotCare: "People who are already organized won't feel the need, and people who aren't may not stick with any new system, however good.",
    simplification: "Drop syncing entirely for version one — a single manual list a person re-checks each morning is enough to test whether the structure itself helps.",
    validation: "Have 5–10 people use a plain paper or notes-app version of the same structure for a week before building any software.",
  },
 
  academic_study: {
    match: /study group|tutoring|flashcards?|exam prep|lecture notes|course selection|grades|studying/i,
    activityNoun: "studying or preparing for exams",
    workaround: "reviewing notes alone or forming ad-hoc study groups over text",
    assumptions: [
      "Students would actually use a structured tool consistently, rather than falling back to cramming close to the exam.",
      "The specific study method being proposed fits how the target course is actually tested.",
      "Enough students in the same course would need this at the same time for a group or matching feature to work.",
    ],
    solutions: [
      { title: "Personal review tool", description: "A tool focused on one student's own review process, with no group or matching component." },
      { title: "Study group matcher", description: "A tool that matches students in the same course or section into small study groups." },
      { title: "Shared notes hub", description: "A shared space where students in a course pool and organize notes together." },
    ],
    weakestAssumption: "That the bottleneck is study structure or access to materials, rather than time available or the difficulty of the material itself.",
    adoptionRisk: "Study habits are personal and often social — students may prefer their existing group chat over a new dedicated tool.",
    technicalRisk: "Matching or content-sharing features only work well once there's a critical mass of students in the same course actively using it.",
    whyNotCare: "Right before exams, most students default to whatever they already know rather than learning a new tool under time pressure.",
    simplification: "Start with a single-user version, with no matching or sharing, so it's useful to exactly one student on day one.",
    validation: "Ask 5–10 students in one course to try the method manually (e.g. on paper) for a week and see if it actually changes how they study.",
  },
 
  mental_health: {
    match: /stress|anxiety|burnout|mental health|wellbeing|well-being|therapy|sleep habits/i,
    activityNoun: "managing stress or wellbeing",
    workaround: "talking to friends, journaling informally, or not addressing it at all",
    assumptions: [
      "Target users would be comfortable using an app for something this personal, rather than preferring a person.",
      "The tool can meaningfully help without professional oversight, which raises real responsibility questions.",
      "Engagement would hold up over weeks, not just the first time someone feels stressed.",
    ],
    solutions: [
      { title: "Lightweight check-in tool", description: "A simple, private daily check-in with no diagnosis or advice, just a record over time." },
      { title: "Resource connector", description: "A tool that points students to real campus mental health resources based on what they describe, rather than trying to help directly." },
      { title: "Peer support structure", description: "A structured way for students to check in on each other, rather than the app doing the support itself." },
    ],
    weakestAssumption: "That a student-built tool is an appropriate substitute for professional support, rather than a bridge to it.",
    adoptionRisk: "People experiencing real stress or burnout have the least energy to adopt and maintain a new habit or tool.",
    technicalRisk: "This space carries real safety and privacy responsibilities — for example, what happens if someone discloses a crisis — that need real answers before launch, not after.",
    whyNotCare: "Stigma, or simply not wanting to log feelings, can make people avoid a tool like this even if they'd benefit.",
    simplification: "Narrow scope to something concrete and low-risk, like a single daily check-in, and explicitly route anything serious to real campus resources rather than handling it in-app.",
    validation: "Talk directly to 5–10 students about how they currently cope with stress, and to a campus counseling resource about what's appropriate for a peer-built tool, before designing further.",
  },
 
  social_dating: {
    match: /dating|matchmak|friend finder|meet people|icebreaker|social event/i,
    activityNoun: "helping students meet people or make friends",
    workaround: "existing social apps, clubs, or just meeting people organically through class and friends",
    assumptions: [
      "There's a real gap that existing apps or clubs don't already fill for this specific group or context.",
      "Enough people in the target group would join at the same time for matching to actually work.",
      "People would trust a new, small app with something this personal.",
    ],
    solutions: [
      { title: "Interest-based matching", description: "A narrow matching tool built around one specific shared context — a class, a dorm, a club." },
      { title: "Event-based connector", description: "A tool focused on getting people to a specific shared event, rather than one-on-one matching." },
      { title: "Icebreaker layer", description: "A lightweight feature that gives people a reason or prompt to talk to someone they've already been matched or grouped with." },
    ],
    weakestAssumption: "That the target group actually struggles to meet people, rather than lacking time or being selective.",
    adoptionRisk: "Social apps have a cold-start problem: nobody wants to join a mostly-empty app, so early growth is the hardest part.",
    technicalRisk: "Matching quality is hard to judge without real usage data, and a small first version won't have enough users to test it properly.",
    whyNotCare: "People with an active social life may not see the need, and people who do want it may feel embarrassed to be seen using it.",
    simplification: "Start within one small, existing group — a class, a dorm floor, a club — instead of trying to serve the whole campus at once.",
    validation: "Run one in-person or group-chat version of the matching idea manually with a small group before building anything automated.",
  },
 
  marketplace: {
    match: /buy and sell|marketplace|secondhand|textbook exchange|resale|resell/i,
    activityNoun: "buying, selling, or exchanging items between students",
    workaround: "posting in a campus Facebook group or group chat",
    assumptions: [
      "Existing groups or marketplaces aren't already good enough for this specific category of item.",
      "Enough buyers and sellers would show up on both sides at the same time for the marketplace to have anything to browse.",
      "Students would trust in-person exchanges arranged through a new, unfamiliar app.",
    ],
    solutions: [
      { title: "Category-specific listing board", description: "A narrow board for one specific category, like textbooks or move-out furniture, instead of a general marketplace." },
      { title: "Time-boxed exchange event", description: "A tool built around a specific recurring window, like end-of-semester move-out, rather than always-on listings." },
      { title: "Request-based matching", description: "A tool where people post what they're looking for and get matched to sellers, instead of browsing listings." },
    ],
    weakestAssumption: "That a new app can attract enough buyers and sellers at once to be useful, rather than existing groups already having that critical mass.",
    adoptionRisk: "Two-sided marketplaces need both buyers and sellers active from day one, a much harder cold start than a single-user tool.",
    technicalRisk: "Handling payments, trust, and dispute cases safely adds real complexity beyond just listing items.",
    whyNotCare: "If a free Facebook group already works well enough, students may not see a reason to switch.",
    simplification: "Narrow to one specific category and one specific time window, like textbooks at the start of a semester, rather than a general marketplace.",
    validation: "Post in an existing campus group manually, structured like your MVP, and see if real listings and responses happen before building a dedicated app.",
  },
 
  sustainability: {
    match: /recycling|sustainab|carbon footprint|plastic waste|energy usage/i,
    activityNoun: "encouraging more sustainable behavior on campus",
    workaround: "existing campus recycling programs or general awareness campaigns",
    assumptions: [
      "The barrier is awareness or convenience, rather than a lack of motivation to act sustainably.",
      "Target users would change behavior based on information alone, without an added incentive.",
      "The specific action being tracked or encouraged is something a student can realistically measure.",
    ],
    solutions: [
      { title: "Convenience-focused tool", description: "A tool that makes one specific sustainable action easier or more obvious in the moment, rather than tracking behavior broadly." },
      { title: "Campus-specific info hub", description: "A simple hub for campus-specific sustainability info — what's recyclable where, program details — that's currently scattered." },
      { title: "Small-group challenge", description: "A lightweight challenge or leaderboard for a small group, like a dorm or a class, around one specific behavior." },
    ],
    weakestAssumption: "That giving people more information or visibility changes behavior, rather than convenience or existing habits being the real barrier.",
    adoptionRisk: "Sustainability tools often appeal to people who are already engaged, while the people who most need to change behavior may not opt in.",
    technicalRisk: "Measuring real environmental impact accurately is difficult and easy to overstate.",
    whyNotCare: "Individual actions can feel too small to matter, which can reduce motivation to engage with a personal tracking tool.",
    simplification: "Focus on one specific, concrete action — like reducing one kind of waste in one building — instead of sustainability broadly.",
    validation: "Observe or survey a small group's actual behavior around the one action you're targeting before building a tracking feature.",
  },
 
  health_fitness: {
    match: /workout|fitness|\bgym\b|nutrition tracking|exercise routine/i,
    activityNoun: "helping students stay consistent with fitness or exercise",
    workaround: "existing fitness apps, a gym's own app, or no tracking at all",
    assumptions: [
      "The barrier is tracking or planning, rather than motivation, time, or access to a gym.",
      "Students would keep logging consistently past the first week or two.",
      "The target group doesn't already have a fitness app or habit that covers this.",
    ],
    solutions: [
      { title: "Minimal habit tracker", description: "A single-purpose tracker for one specific habit, like showing up, rather than a full fitness platform." },
      { title: "Accountability pairing", description: "A tool that pairs students together for mutual accountability rather than tracking solo." },
      { title: "Campus-specific planner", description: "A tool tailored to specific campus resources, like gym hours or intramural schedules, that general fitness apps don't cover." },
    ],
    weakestAssumption: "That better tracking or planning is the missing piece, rather than time, motivation, or access being the real constraint.",
    adoptionRisk: "Fitness apps have very high early drop-off; most new habits fade within a few weeks regardless of the tool.",
    technicalRisk: "Competing with mature, well-funded fitness apps on tracking accuracy or features is unrealistic for a first version.",
    whyNotCare: "People who are motivated may already have a system, and people who aren't may not stick with a new tool either.",
    simplification: "Narrow to one very specific habit or moment, like just showing up to a recurring group session, instead of general fitness tracking.",
    validation: "Get 5–10 students to try the accountability structure manually, e.g. a shared chat, for two weeks before building any app.",
  },
};
 
function detectDomain(text) {
  const t = text || "";
  for (const key of Object.keys(DOMAIN_LIBRARY)) {
    if (DOMAIN_LIBRARY[key].match.test(t)) return key;
  }
  return "generic";
}
 
// Fallback content for ideas that don't match a known domain. Still tied
// to the actual idea via extracted keywords and the cleaned core phrase,
// rather than a single fixed wrapper sentence.
function genericDomainContent(coreIdea, keywords, medium) {
  const kw = keywords.length ? keywords.join(", ") : "the specifics of this idea";
  const isPhysical = medium === "non_software";
  // Only two solution directions here, on purpose — for an unmatched
  // domain there isn't enough signal to responsibly claim a third
  // meaningfully different approach exists.
  const solutions = isPhysical
    ? [
        { title: `A single, low-cost change to ${kw}`, description: `One targeted, non-software change aimed directly at ${kw} — a sign, a schedule, a checklist, a rule change — rather than a built tool.` },
        { title: `A manual pilot around ${kw}`, description: `A short, manually-run pilot (tracked on paper or a spreadsheet) of the intervention, before anything is automated.` },
      ]
    : [
        { title: `A narrow tool for ${kw}`, description: `A tool that does exactly one thing related to ${kw}, done well, instead of covering the idea broadly.` },
        { title: `A manual/assisted version of ${kw}`, description: `A version of the current manual process for ${kw} with light assistance, without full automation.` },
      ];
  return {
    activityNoun: coreIdea,
    workaround: isPhysical ? `dealing with ${kw} through ad-hoc, manual effort` : `handling ${kw} manually, without any dedicated tool`,
    assumptions: [
      `The people affected by ${kw} experience it often enough to want a dedicated fix, rather than a one-off workaround.`,
      `The current manual approach to ${kw} is costly or annoying enough that they'd change how they do it.`,
      `A basic first version focused only on ${kw} would still be useful enough to test.`,
    ],
    solutions,
    weakestAssumption: `That the people affected by ${kw} would change their behavior at all, rather than tolerating the current situation.`,
    adoptionRisk: isPhysical
      ? `Whoever is responsible for maintaining the change (staff, volunteers, a schedule) may not keep it up once the novelty wears off.`
      : `The target user already has a "good enough" habit around ${kw}, so switching costs more effort than the tool initially saves.`,
    technicalRisk: isPhysical
      ? `Getting accurate, honest measurement of whether ${kw} actually improved, without expensive equipment, is harder than it looks.`
      : `Underestimating how much setup or manual input is needed before a tool for ${kw} becomes useful to a first-time user.`,
    whyNotCare: `${capitalize(kw)} may only come up occasionally, so a fix competes with "I'll just deal with it this once."`,
    simplification: isPhysical
      ? `Pilot the change in one small, contained location or group before rolling it out anywhere else.`
      : `Cut any account system, history, or customization for version one — a single-session, no-login flow focused only on ${kw} is enough to test demand.`,
    validation: isPhysical
      ? `Run the intervention manually in one location for a short, fixed period and measure the before/after difference directly, without building anything.`
      : `Show 5–10 people who deal with ${kw} a rough mockup or paper version and watch whether they can complete the task with it, without explaining it first.`,
  };
}
 
function resolveDomainContent(originalIdea) {
  const cleaned = stripInjectionClauses(originalIdea);
  const proposedSolution = extractProposedSolution(cleaned);
  const problemContext = proposedSolution ? proposedSolution.remainder || cleaned : cleaned;
  const coreIdea = extractCoreIdea(problemContext);
  const domainKey = detectDomain(problemContext);
  const medium = detectSolutionMedium(originalIdea);
  const mechanismText = extractMechanism(problemContext, null);
  const mechanismType = classifyMechanism(mechanismText, medium);
  const domainContent = domainKey !== "generic" ? DOMAIN_LIBRARY[domainKey] : genericDomainContent(coreIdea, extractKeywords(problemContext), medium);
  return { domainKey, coreIdea, medium, proposedSolution, mechanismText, mechanismType, content: domainContent };
}
 
// Determines whether the who/what is Known (explicitly stated by the
// user, either in the original idea or a clarification answer), vague
// (the user was asked but couldn't say), or missing entirely.
function resolveWho(originalIdea, clarificationAnswers) {
  const clarified = clarificationAnswers && clarificationAnswers.targetUser;
  if (clarified && !isVagueAnswer(clarified)) {
    return { status: "known", source: "clarification", text: clarified.trim() };
  }
  const stated = originalIdea.match(USER_TYPE_PATTERN);
  if (stated) {
    return { status: "known", source: "idea", text: stated[0] };
  }
  if (clarified && isVagueAnswer(clarified)) {
    return { status: "vague", source: "clarification", text: null };
  }
  return { status: "missing", source: null, text: null };
}
 
function resolveWhat(originalIdea, clarificationAnswers) {
  const clarified = clarificationAnswers && clarificationAnswers.problemDetail;
  if (clarified && !isVagueAnswer(clarified)) {
    return { status: "known", source: "clarification", text: clarified.trim() };
  }
  const stated = PROBLEM_SIGNAL_PATTERN.test(originalIdea);
  if (stated) {
    return { status: "known", source: "idea", text: null };
  }
  if (clarified && isVagueAnswer(clarified)) {
    return { status: "vague", source: "clarification", text: null };
  }
  return { status: "missing", source: null, text: null };
}
 
// Not word-count alone, and a matched domain is NOT by itself proof that
// the target user or problem is known (item 1) — a domain keyword only
// picks question wording. A single generic problem-signal word ("risk",
// "manage", "track") is also not proof of a real problem definition
// (item 7) — it takes real elaboration (a few distinct content words) to
// count the problem as known from the idea text alone.
function getMissingFields(ideaText) {
  const trimmed = (ideaText || "").trim();
  const tooShort = wordCount(trimmed) < 5;
  const domainKey = detectDomain(trimmed);
  const hasUserSignal = USER_TYPE_PATTERN.test(trimmed);
  const hasElaboratedProblem = PROBLEM_SIGNAL_PATTERN.test(trimmed) && extractKeywords(trimmed, 6).length >= 3;
  return {
    needsUser: tooShort || !hasUserSignal,
    needsProblem: tooShort || !hasElaboratedProblem,
    domainKey,
  };
}
 
function needsClarification(ideaText) {
  const { needsUser, needsProblem } = getMissingFields(ideaText);
  return needsUser || needsProblem;
}
 
// Domain-tailored clarification copy (item D) — same two structured
// fields (targetUser, problemDetail) underneath, different questions.
const CLARIFY_QUESTIONS = {
  transportation: {
    userLabel: "Who is affected, and where exactly does this happen?",
    userPlaceholder: "e.g. Students walking from North dorms to the science building",
    problemLabel: "What's the concrete situation — a specific route, time, or bottleneck?",
    problemPlaceholder: "e.g. The 8am shuttle is consistently full before the last stop",
  },
  career_internship: {
    userLabel: "Who exactly is stuck — which students, at what stage?",
    userPlaceholder: "e.g. First-generation sophomores applying for their first internship",
    problemLabel: "What's the exact bottleneck — finding postings, tracking, or something else?",
    problemPlaceholder: "e.g. Losing track of deadlines across 15+ applications",
  },
  food_waste: {
    userLabel: "Who controls the surplus food, specifically?",
    userPlaceholder: "e.g. Cafeteria kitchen staff at the end of dinner service",
    problemLabel: "Where does coordination actually fail?",
    problemPlaceholder: "e.g. No one knows a local shelter wants the leftovers in time",
  },
  resource_conservation: {
    userLabel: "Who is using the resource, and who is responsible for the facility?",
    userPlaceholder: "e.g. Hostel residents on one floor; the hostel warden manages upkeep",
    problemLabel: "Where specifically is the waste happening?",
    problemPlaceholder: "e.g. Taps left running in the shared bathroom overnight",
  },
  financial_fraud: {
    userLabel: "Who is the intended user — potential victims, or people reporting fraud?",
    userPlaceholder: "e.g. Students who've received suspicious payment requests",
    problemLabel: "What specific fraud pattern are you targeting?",
    problemPlaceholder: "e.g. Fake job-offer scams asking for an upfront deposit",
  },
};
function getClarificationQuestions(originalIdea) {
  const { domainKey } = getMissingFields(originalIdea);
  return (
    CLARIFY_QUESTIONS[domainKey] || {
      userLabel: "Who exactly would use this? Be specific about the situation.",
      userPlaceholder: "e.g. Sophomores living off-campus with 2–3 roommates",
      problemLabel: "What specific problem does it solve for them right now?",
      problemPlaceholder: "e.g. Figuring out who owes what after a shared grocery run",
    }
  );
}
 
// Mock: Analyze My Idea. Uses originalIdea + clarificationAnswers together;
// clarification answers are never decorative — they directly determine
// what's written into Target User / Problem Definition and are marked Known.
function analyzeIdea(originalIdea, clarificationAnswers) {
  const { coreIdea, content, medium, proposedSolution, mechanismText, mechanismType } = resolveDomainContent(originalIdea);
  const who = resolveWho(originalIdea, clarificationAnswers);
  const what = resolveWhat(originalIdea, clarificationAnswers);
  const userAssumptions = extractUserAssumptions(
    originalIdea,
    clarificationAnswers && clarificationAnswers.targetUser,
    clarificationAnswers && clarificationAnswers.problemDetail
  );
  const contradiction = detectContradiction(originalIdea, clarificationAnswers);
  const injectionNoted = containsInjectionAttempt(originalIdea) || containsInjectionAttempt(
    `${(clarificationAnswers && clarificationAnswers.targetUser) || ""} ${(clarificationAnswers && clarificationAnswers.problemDetail) || ""}`
  );
 
  let problem;
  if (what.status === "known" && what.text) {
    problem = `As described: ${what.text} Today, this is handled by ${content.workaround}, which works at a small scale but breaks down as more people or steps are involved.`;
  } else if (what.status === "known") {
    problem = `${capitalize(content.activityNoun)} is currently handled by ${content.workaround}. That works at a small scale, but breaks down as soon as more people or steps are involved.`;
  } else {
    problem = `The idea doesn't yet pin down a specific problem beyond "${snippet(originalIdea, 80)}." This can't be reliably filled in without more detail — a made-up problem statement would just be a guess. What's needed: a one-sentence description of what goes wrong today, in the target user's own words.`;
  }
  if (proposedSolution) {
    problem = `Proposed solution (as described): ${proposedSolution.solutionPhrase}. That's a solution, not the problem itself — the underlying problem: ${problem.charAt(0).toLowerCase() + problem.slice(1)}`;
  }
 
  let targetUser;
  if (who.status === "known") {
    targetUser = `${capitalize(who.text)} — specifically, people who currently deal with this using ${content.workaround}.`;
  } else if (who.status === "vague") {
    targetUser = `The target user isn't established yet — the earlier answer wasn't specific enough to build on, and inventing a persona here would be a guess presented as a fact. What's needed: naming one concrete group tied to this specific problem, rather than a broad category.`;
  } else {
    targetUser = `Not specified in the idea. Naming this precisely would need to come from you — guessing a persona here would be presented as a fact when it isn't one.`;
  }
  if (contradiction) {
    targetUser = `${targetUser} Note: the idea mentioned "${contradiction.stated}" but the clarification named "${contradiction.clarified}" — these may not be the same group. Using "${contradiction.clarified}" (the more specific answer) for this analysis; let us know if that's wrong.`;
  }
 
  const solutions = generateSolutions(mechanismText, mechanismType, who, medium);
  const assumptions = (MECHANISM_ASSUMPTIONS[mechanismType] || MECHANISM_ASSUMPTIONS.generic_tool).map((a) => sanitizeText(a));
  const previewChallenge = computeChallenge(mechanismType, content);
 
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        coreIdea,
        medium,
        content,
        mechanismText,
        mechanismType,
        proposedSolution,
        problem: sanitizeText(problem),
        targetUser: sanitizeText(targetUser),
        assumptions,
        solutions,
        userAssumptions,
        contradiction,
        injectionNoted,
        previewChallenge,
        who,
        what,
      });
    }, 1100);
  });
}
 
// Pure, synchronous reasoning core shared by the analysis preview and the
// actual Challenge step — driven by the mechanism type extracted from THIS
// idea, not by the domain. DOMAIN_LIBRARY only supplies a light "existing
// alternative" flavor line, never the core content.
function computeChallenge(mechanismType, content) {
  const base = MECHANISM_CHALLENGE[mechanismType] || MECHANISM_CHALLENGE.generic_tool;
  const workaround = (content && content.workaround) || "an informal manual workaround";
  return {
    weakestAssumption: base.weakestAssumption,
    biggestAdoptionRisk: `${base.biggestAdoptionRisk} Today this is handled by ${workaround} — for some, that may already be good enough (existing-alternative risk).`,
    biggestTechnicalRisk: base.biggestTechnicalRisk,
    whyUsersMightNotCare: base.whyUsersMightNotCare,
    simplificationOpportunity: base.simplificationOpportunity,
    fastestValidationExperiment: base.fastestValidationExperiment,
  };
}
 
// Builds solution directions from the ACTUAL mechanism described in this
// idea (item 2/6) — DOMAIN_LIBRARY is not consulted here at all, so two
// ideas sharing a domain but describing different mechanisms diverge.
function generateSolutions(mechanismText, mechanismType, who, medium) {
  const audience = who && who.status === "known" ? who.text : "one specific group";
  const asDescribed = {
    title: "As described",
    description: `Build exactly the mechanism you described — ${mechanismText} — scoped to ${audience} only, with everything else deliberately left out for now.`,
  };
  const alt = MECHANISM_SOLUTION_ALTS[mechanismType] || MECHANISM_SOLUTION_ALTS.generic_tool;
  const solutions = [asDescribed, alt];
 
  // A genuinely narrower pivot that changes the problem, per item H,
  // labeled as such rather than presented as equivalent.
  if (mechanismType === "connects_parties") {
    solutions.push({
      title: "Possible narrower alternative",
      description: "Instead of matching many-to-many, focus on one recurring partnership (one supplier, one recipient). This changes the problem from marketplace-matching to single-relationship logistics — easier to build, but it serves far fewer people.",
    });
  } else if (mechanismType === "automates_detects") {
    solutions.push({
      title: "Possible narrower alternative",
      description: "Instead of automated detection, focus only on education/awareness for the same audience. This changes the problem from catching bad actors to helping people recognize risk themselves — far more buildable, but it doesn't stop anything directly.",
    });
  } else if (medium === "non_software" && mechanismType !== "physical_intervention") {
    solutions.push({
      title: "Possible narrower alternative",
      description: "Instead of the described mechanism, a purely manual/physical process change (signage, a schedule, a rule) could address part of this without building anything at all — narrower in effect, but immediately testable.",
    });
  }
  return solutions;
}
 
// Mock: Challenge My Idea. Wraps the same computeChallenge() core used for
// the analysis-stage preview, so results are identical either way.
// during analysis, so risks/assumptions stay specific to this idea.
function challengeIdea(originalIdea, clarificationAnswers, analysis) {
  const mechanismType = (analysis && analysis.mechanismType) || classifyMechanism(extractMechanism(originalIdea, null), detectSolutionMedium(originalIdea));
  const content = (analysis && analysis.content) || resolveDomainContent(originalIdea).content;
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(computeChallenge(mechanismType, content));
    }, 1100);
  });
}
 
// Derived from originalIdea + clarificationAnswers + currentAnalysis +
// currentChallenge together, so it's specific to the current idea and
// can't carry over text from a previous one.
function buildSmallestMVP(originalIdea, clarificationAnswers, analysis, challenge) {
  const { coreIdea, medium, mechanismType } = analysis || resolveDomainContent(originalIdea);
  const audience =
    analysis && analysis.who && analysis.who.status === "known"
      ? analysis.who.text
      : "one target user";
  const simplification = sanitizeText(challenge && challenge.simplificationOpportunity, "the simplest version of this idea");
 
  if (medium === "non_software") {
    return {
      description: `A single, contained pilot that applies the core idea — ${coreIdea} — to one small group or location, incorporating the simplification identified above ("${simplification}"). No app, no software build, just the intervention itself and a way to measure it manually.`,
      inScope: [
        "One specific location or group",
        "The intervention itself (a process, sign, schedule, or rule change)",
        "A simple manual way to measure before/after",
      ],
      outScope: [
        "Any mobile or web app",
        "Automated tracking or sensors",
        "Rolling it out beyond the pilot group",
        "Ongoing accounts or notifications",
      ],
    };
  }
 
  const scope = MECHANISM_MVP_SCOPE[mechanismType] || MECHANISM_MVP_SCOPE.generic_tool;
  return {
    description: `A version scoped to exactly one mechanism — ${coreIdea} — for ${audience} only, incorporating the simplification identified above ("${simplification}").`,
    inScope: scope.inScope,
    outScope: scope.outScope,
  };
}
 
// Human Check provenance rules:
//   Known           = explicitly stated by the user.
//   User assumption = explicitly asserted by the user, not independently verified.
//   Assumed         = inferred by the system, presented as a hypothesis, not fact.
//   Uncertain       = cannot currently be established.
//   Verify          = a concrete, idea-specific action to check it in the real world.
function buildHumanCheck(stage, originalIdea, clarificationAnswers, analysis, challenge) {
  const known = [`Original idea, as described: "${snippet(originalIdea, 90)}"`];
  const userAssumption = [];
  const assumed = [];
  const uncertain = [];
  const verify = [];
 
  if (analysis) {
    const { who, what } = analysis;
    const effectiveChallenge = challenge || analysis.previewChallenge;
 
    if (who.status === "known") {
      known.push(`Target user, as ${who.source === "clarification" ? "clarified" : "stated in the idea"}: "${who.text}"`);
      assumed.push("Persona details beyond what was stated — motivations, context, habits — are inferred for this analysis, not confirmed.");
    } else {
      uncertain.push("Who actually experiences this problem enough to want a fix for it — not established, and not guessed here.");
      verify.push("Identify one concrete target group for this idea before building further.");
    }
 
    if (what.status === "known" && what.text) {
      known.push(`Problem detail, as clarified: "${what.text}"`);
    } else if (what.status !== "known") {
      uncertain.push("What the concrete, everyday version of this problem actually looks like for a real user.");
      verify.push("Write down one real recent instance of this problem happening, with specifics, before analyzing further.");
    }
 
    if (analysis.contradiction) {
      uncertain.push(`Whether "${analysis.contradiction.stated}" (from the idea) and "${analysis.contradiction.clarified}" (from clarification) are actually the same group — currently using the clarified answer.`);
    }
 
    if (analysis.injectionNoted) {
      uncertain.push("The input included wording aimed at the system rather than describing the idea; it was not treated as evidence, and no outcome is ever claimed as guaranteed.");
    }
 
    // Explicit user-stated assumptions ("Assume...") are their own
    // category — never folded into Known or system-inferred Assumed.
    (analysis.userAssumptions || []).forEach((a) => userAssumption.push(a));
 
    // The system's own key assumptions come from reasoning about THIS
    // idea's mechanism (analysis.assumptions), not a fixed domain list.
    assumed.push(...(analysis.assumptions || []).slice(0, 2));
    uncertain.push(sanitizeText(effectiveChallenge && effectiveChallenge.weakestAssumption, "Whether the core assumption behind this idea holds up in practice."));
    uncertain.push("How much real-world impact or adoption this idea would have — this can't be estimated without testing; it would need pilot usage data to know.");
    verify.push(sanitizeText(effectiveChallenge && effectiveChallenge.fastestValidationExperiment, "Test a rough, manual version of this idea with a few real people before building anything."));
  }
 
  if (challenge) {
    assumed.push("That the simplification suggested in Challenge Results is safe to make — i.e. that it doesn't remove something users actually needed.");
    uncertain.push("Whether removing scope in the way suggested actually holds up once real users try it.");
    verify.push(`Test the specific simplification from Challenge Results ("${challenge.simplificationOpportunity.split(".")[0]}") with a few real users to see if it holds up.`);
  }
 
  return { known, userAssumption, assumed, uncertain, verify };
}
 
/* ------------------------------------------------------------------------
 * UI COMPONENTS
 * ---------------------------------------------------------------------- */
 
function SectionCard({ accent, label, children }) {
  return (
    <div className={`cbc-card cbc-accent-${accent}`}>
      <div className="cbc-card-label">{label}</div>
      <div className="cbc-card-body">{children}</div>
    </div>
  );
}
 
function Spinner({ text }) {
  return (
    <div className="cbc-loading">
      <Loader2 className="cbc-spin" size={20} strokeWidth={2} />
      <span>{text}</span>
    </div>
  );
}
 
function HumanCheck({ data }) {
  if (!data) return null;
  const rows = [
    { key: "known", title: "Known", icon: CheckCircle2, tone: "known", items: data.known },
    { key: "userAssumption", title: "User assumption", icon: Quote, tone: "userassumption", items: data.userAssumption, wide: true },
    { key: "assumed", title: "Assumed", icon: HelpCircle, tone: "assumed", items: data.assumed },
    { key: "uncertain", title: "Uncertain", icon: AlertCircle, tone: "uncertain", items: data.uncertain },
    { key: "verify", title: "You should verify", icon: Eye, tone: "verify", items: data.verify },
  ];
  return (
    <div className="cbc-humancheck">
      <div className="cbc-hc-corner cbc-hc-corner-tl" />
      <div className="cbc-hc-corner cbc-hc-corner-tr" />
      <div className="cbc-hc-corner cbc-hc-corner-bl" />
      <div className="cbc-hc-corner cbc-hc-corner-br" />
      <div className="cbc-hc-header">
        <span className="cbc-hc-title">Human check</span>
        <span className="cbc-hc-sub">What's known, user-asserted, assumed, uncertain, and worth checking yourself</span>
      </div>
      <div className="cbc-hc-grid">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <div className={`cbc-hc-row${row.wide ? " cbc-hc-row-wide" : ""}`} key={row.key}>
              <div className={`cbc-hc-rowhead cbc-tone-${row.tone}`}>
                <Icon size={15} strokeWidth={2} />
                <span>{row.title}</span>
              </div>
              {(row.items || []).length === 0 ? (
                <div className="cbc-hc-empty">Nothing yet at this stage.</div>
              ) : (
                <ul className="cbc-hc-list">
                  {row.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
 
/* ------------------------------------------------------------------------
 * MAIN APP
 * ---------------------------------------------------------------------- */
 
export default function CampusBuildCopilot() {
  const [stage, setStage] = useState("home"); // home | clarify | analyzing | analysis | challenging | challenge
  const [originalIdea, setOriginalIdea] = useState("");
  const [error, setError] = useState("");
  const [clarificationAnswers, setClarificationAnswers] = useState({ targetUser: "", problemDetail: "" });
  const [currentAnalysis, setCurrentAnalysis] = useState(null);
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [currentMVP, setCurrentMVP] = useState(null);
  const [currentHumanCheck, setCurrentHumanCheck] = useState(null);
  const textareaRef = useRef(null);
  // Guards against a stale async response (from a previous idea, or a
  // request superseded by "Start over") landing after a newer one has
  // already started — this is what prevents an old idea's content from
  // ever appearing inside a later, unrelated session.
  const requestIdRef = useRef(0);
 
  // Full reset — never carries state, sample text, or generated content
  // from a previous idea into a new run. Bumping requestIdRef also
  // invalidates any in-flight async response from before the reset.
  function resetAll() {
    requestIdRef.current += 1;
    setStage("home");
    setOriginalIdea("");
    setError("");
    setClarificationAnswers({ targetUser: "", problemDetail: "" });
    setCurrentAnalysis(null);
    setCurrentChallenge(null);
    setCurrentMVP(null);
    setCurrentHumanCheck(null);
  }
 
  function handleAnalyzeClick() {
    setError("");
    const trimmed = originalIdea.trim();
    if (!trimmed) {
      setError("Add a short description of your idea before analyzing it.");
      textareaRef.current?.focus();
      return;
    }
 
    const intent = classifyIntent(trimmed);
    if (intent === "information_question") {
      setError(
        "That reads as a request for a specific number, not a product idea. This can't be determined reliably from a description alone — it would need real evidence, such as a pilot launch or a survey of the actual target group, to answer honestly. Try describing what you'd build instead, and validation experiments can help estimate real interest later."
      );
      return;
    }
    if (intent === "unrelated_instruction") {
      setError("This doesn't look like a project idea to analyze — describe what you're trying to build.");
      return;
    }
 
    // Multiple distinct problems: don't silently pick one by domain-library
    // ordering — ask the user to choose before continuing (item 4).
    const multiProblemDomains = detectMultipleProblems(trimmed);
    if (multiProblemDomains) {
      setError(
        `This idea touches more than one distinct problem (${multiProblemDomains.join(", ").replace(/_/g, " ")}). Pick one to focus on for this pass — rewrite the idea around just that one problem and analyze again.`
      );
      return;
    }
 
    // Invalidate any in-flight request and reset generated state from a
    // previous idea before starting a new one.
    requestIdRef.current += 1;
    setCurrentAnalysis(null);
    setCurrentChallenge(null);
    setCurrentMVP(null);
    setCurrentHumanCheck(null);
    if (needsClarification(trimmed)) {
      setClarificationAnswers({ targetUser: "", problemDetail: "" });
      setStage("clarify");
      return;
    }
    runAnalysis(trimmed, null);
  }
 
  function runAnalysis(ideaText, clarification) {
    setStage("analyzing");
    const requestId = requestIdRef.current;
    analyzeIdea(ideaText, clarification)
      .then((result) => {
        if (requestId !== requestIdRef.current) return; // superseded — discard
        setCurrentAnalysis(result);
        setCurrentHumanCheck(buildHumanCheck("analysis", ideaText, clarification, result, null));
        setStage("analysis");
      })
      .catch(() => {
        if (requestId !== requestIdRef.current) return;
        setError("Something went wrong analyzing this idea. Please try again.");
        setStage("home");
      });
  }
 
  function handleClarifySubmit() {
    const { needsUser, needsProblem } = getMissingFields(originalIdea);
    const { targetUser, problemDetail } = clarificationAnswers;
    if ((needsUser && !targetUser.trim()) || (needsProblem && !problemDetail.trim())) {
      setError("Answer the question(s) below so the analysis has something real to work with.");
      return;
    }
    setError("");
    // originalIdea is left untouched — clarification answers stay in their
    // own structured state and are passed alongside it, never concatenated in.
    runAnalysis(originalIdea, clarificationAnswers);
  }
 
  function handleChallengeClick() {
    setStage("challenging");
    const requestId = requestIdRef.current;
    challengeIdea(originalIdea, clarificationAnswers, currentAnalysis)
      .then((result) => {
        if (requestId !== requestIdRef.current) return; // superseded — discard
        const mvp = buildSmallestMVP(originalIdea, clarificationAnswers, currentAnalysis, result);
        setCurrentChallenge(result);
        setCurrentMVP(mvp);
        setCurrentHumanCheck(buildHumanCheck("challenge", originalIdea, clarificationAnswers, currentAnalysis, result));
        setStage("challenge");
      })
      .catch(() => {
        if (requestId !== requestIdRef.current) return;
        setError("Something went wrong challenging this idea. Please try again.");
        setStage("analysis");
      });
  }
 
  const showHeaderReset = stage !== "home";
 
  return (
    <div className="cbc-app">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap');
 
        .cbc-app {
          --ink: #1c2333;
          --ink-soft: #4b5567;
          --paper: #eef0ec;
          --surface: #ffffff;
          --line: #ccd1d6;
          --blueprint: #2f5c8a;
          --blueprint-dark: #24466b;
          --rust: #ab4d30;
          --moss: #43704a;
          --amber: #92700f;
          --slate: #5b6472;
          font-family: 'IBM Plex Sans', sans-serif;
          background: var(--paper);
          color: var(--ink);
          min-height: 100%;
          width: 100%;
          box-sizing: border-box;
          padding: 32px 20px 64px;
          display: flex;
          justify-content: center;
        }
        .cbc-app *, .cbc-app *::before, .cbc-app *::after { box-sizing: border-box; }
        @media (prefers-reduced-motion: reduce) {
          .cbc-app * { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; }
        }
 
        .cbc-shell { width: 100%; max-width: 640px; }
 
        .cbc-topbar {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-bottom: 28px;
          gap: 12px;
        }
        .cbc-brand {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12.5px;
          color: var(--ink-soft);
          letter-spacing: 0.02em;
        }
        .cbc-reset {
          font-family: 'IBM Plex Sans', sans-serif;
          font-size: 13px;
          color: var(--blueprint-dark);
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 0;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .cbc-reset:hover { color: var(--rust); }
        .cbc-reset:focus-visible { outline: 2px solid var(--blueprint); outline-offset: 3px; }
 
        .cbc-headline {
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 700;
          font-size: clamp(28px, 5vw, 38px);
          line-height: 1.15;
          margin: 0 0 10px;
          color: var(--ink);
        }
        .cbc-sub {
          font-size: 16px;
          color: var(--ink-soft);
          margin: 0 0 28px;
          max-width: 46ch;
          line-height: 1.5;
        }
 
        .cbc-field { margin-bottom: 10px; }
        .cbc-textarea {
          width: 100%;
          min-height: 140px;
          resize: vertical;
          font-family: 'IBM Plex Sans', sans-serif;
          font-size: 15.5px;
          line-height: 1.5;
          color: var(--ink);
          background: var(--surface);
          border: 1.5px solid var(--line);
          border-radius: 3px;
          padding: 14px 16px;
        }
        .cbc-textarea:focus-visible {
          outline: none;
          border-color: var(--blueprint);
          box-shadow: 0 0 0 3px rgba(47, 92, 138, 0.15);
        }
        .cbc-hint {
          font-size: 13px;
          color: var(--slate);
          margin: 8px 0 20px;
          line-height: 1.5;
        }
 
        .cbc-error {
          display: flex;
          gap: 8px;
          align-items: flex-start;
          font-size: 13.5px;
          color: var(--rust);
          background: #fbeee9;
          border: 1px solid #e3b8a6;
          border-radius: 3px;
          padding: 10px 12px;
          margin: 0 0 18px;
          line-height: 1.45;
        }
        .cbc-error svg { flex-shrink: 0; margin-top: 1px; }
 
        .cbc-btn {
          font-family: 'IBM Plex Sans', sans-serif;
          font-weight: 600;
          font-size: 15px;
          color: #fff;
          background: var(--blueprint);
          border: none;
          border-radius: 3px;
          padding: 12px 22px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .cbc-btn:hover { background: var(--blueprint-dark); }
        .cbc-btn:focus-visible { outline: 2px solid var(--ink); outline-offset: 3px; }
        .cbc-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .cbc-btn-secondary {
          background: transparent;
          color: var(--blueprint-dark);
          border: 1.5px solid var(--blueprint-dark);
        }
        .cbc-btn-secondary:hover { background: rgba(47, 92, 138, 0.08); }
 
        .cbc-loading {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 15px;
          color: var(--ink-soft);
          padding: 30px 2px;
        }
        .cbc-spin { animation: cbc-rotate 0.9s linear infinite; color: var(--blueprint); }
        @keyframes cbc-rotate { to { transform: rotate(360deg); } }
 
        .cbc-note {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11.5px;
          color: var(--slate);
          margin: 4px 0 22px;
        }
 
        .cbc-blockheader {
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 600;
          font-size: 20px;
          margin: 36px 0 14px;
          color: var(--ink);
        }
        .cbc-blockheader:first-of-type { margin-top: 0; }
 
        .cbc-card {
          background: var(--surface);
          border: 1px solid var(--line);
          border-left-width: 3px;
          border-radius: 2px;
          padding: 16px 18px;
          margin-bottom: 12px;
        }
        .cbc-accent-blueprint { border-left-color: var(--blueprint); }
        .cbc-accent-amber { border-left-color: var(--amber); }
        .cbc-accent-rust { border-left-color: var(--rust); }
        .cbc-accent-moss { border-left-color: var(--moss); }
        .cbc-card-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11.5px;
          color: var(--ink-soft);
          margin-bottom: 6px;
        }
        .cbc-card-body { font-size: 15px; line-height: 1.55; color: var(--ink); }
        .cbc-card-body ul { margin: 0; padding-left: 20px; }
        .cbc-card-body li { margin-bottom: 6px; }
        .cbc-card-body li:last-child { margin-bottom: 0; }
 
        .cbc-solutions { display: grid; gap: 10px; }
        .cbc-solution-title { font-weight: 600; margin-bottom: 3px; }
 
        .cbc-mvp-cols {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        @media (max-width: 480px) {
          .cbc-mvp-cols { grid-template-columns: 1fr; }
        }
        .cbc-mvp-col-title {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11.5px;
          margin-bottom: 8px;
        }
        .cbc-mvp-col-title.in { color: var(--moss); }
        .cbc-mvp-col-title.out { color: var(--slate); }
        .cbc-mvp-col ul { margin: 0; padding-left: 18px; font-size: 14.5px; line-height: 1.5; }
        .cbc-mvp-col li { margin-bottom: 6px; }
 
        .cbc-humancheck {
          position: relative;
          border: 1px solid var(--line);
          background: var(--surface);
          padding: 22px 22px 18px;
          margin-top: 34px;
          border-radius: 2px;
        }
        .cbc-hc-corner {
          position: absolute;
          width: 12px;
          height: 12px;
          border-color: var(--blueprint-dark);
        }
        .cbc-hc-corner-tl { top: -1px; left: -1px; border-top: 2px solid; border-left: 2px solid; }
        .cbc-hc-corner-tr { top: -1px; right: -1px; border-top: 2px solid; border-right: 2px solid; }
        .cbc-hc-corner-bl { bottom: -1px; left: -1px; border-bottom: 2px solid; border-left: 2px solid; }
        .cbc-hc-corner-br { bottom: -1px; right: -1px; border-bottom: 2px solid; border-right: 2px solid; }
        .cbc-hc-header { margin-bottom: 18px; }
        .cbc-hc-title {
          display: block;
          font-family: 'Space Grotesk', sans-serif;
          font-weight: 600;
          font-size: 18px;
          color: var(--ink);
        }
        .cbc-hc-sub { display: block; font-size: 13px; color: var(--ink-soft); margin-top: 3px; }
        .cbc-hc-grid { display: grid; gap: 16px; grid-template-columns: 1fr 1fr; }
        @media (max-width: 480px) {
          .cbc-hc-grid { grid-template-columns: 1fr; }
        }
        .cbc-hc-rowhead {
          display: flex;
          align-items: center;
          gap: 7px;
          font-weight: 600;
          font-size: 13.5px;
          margin-bottom: 8px;
        }
        .cbc-tone-known { color: var(--moss); }
        .cbc-tone-assumed { color: var(--amber); }
        .cbc-tone-uncertain { color: var(--slate); }
        .cbc-tone-verify { color: var(--blueprint-dark); }
        .cbc-tone-userassumption { color: var(--rust); }
        .cbc-hc-row-wide { grid-column: 1 / -1; }
        .cbc-hc-list { margin: 0; padding-left: 19px; font-size: 13.5px; line-height: 1.5; color: var(--ink); }
        .cbc-hc-list li { margin-bottom: 6px; }
        .cbc-hc-empty { font-size: 13px; color: var(--slate); font-style: italic; }
 
        .cbc-clarify-q { margin-bottom: 16px; }
        .cbc-clarify-q label {
          display: block;
          font-size: 14.5px;
          font-weight: 600;
          margin-bottom: 6px;
          color: var(--ink);
        }
        .cbc-clarify-input {
          width: 100%;
          font-family: 'IBM Plex Sans', sans-serif;
          font-size: 15px;
          padding: 10px 12px;
          border: 1.5px solid var(--line);
          border-radius: 3px;
          color: var(--ink);
        }
        .cbc-clarify-input:focus-visible {
          outline: none;
          border-color: var(--blueprint);
          box-shadow: 0 0 0 3px rgba(47, 92, 138, 0.15);
        }
 
        .cbc-actions { display: flex; gap: 12px; margin-top: 20px; flex-wrap: wrap; }
      `}</style>
 
      <div className="cbc-shell">
        <div className="cbc-topbar">
          <span className="cbc-brand">Campus Build Copilot</span>
          {showHeaderReset && (
            <button className="cbc-reset" onClick={resetAll}>
              Start over
            </button>
          )}
        </div>
 
        {stage === "home" && (
          <>
            <h1 className="cbc-headline">Turn your idea into a real MVP.</h1>
            <p className="cbc-sub">We will challenge your idea, not just cheer it on.</p>
 
            <div className="cbc-field">
              <textarea
                ref={textareaRef}
                className="cbc-textarea"
                placeholder="e.g. An app that helps students split rent and utility payments with roommates without the group-chat math."
                value={originalIdea}
                onChange={(e) => setOriginalIdea(e.target.value)}
              />
            </div>
            <p className="cbc-hint">
              A sentence or two is fine. Mention who it's for if you can — that helps the analysis.
            </p>
 
            {error && (
              <div className="cbc-error">
                <AlertTriangle size={16} strokeWidth={2} />
                <span>{error}</span>
              </div>
            )}
 
            <button className="cbc-btn" onClick={handleAnalyzeClick}>
              Analyze my idea
            </button>
          </>
        )}
 
        {stage === "clarify" && (
          <>
            <h1 className="cbc-headline">A bit more detail first.</h1>
            <p className="cbc-sub">
              Your idea is short on specifics. Answering this makes the analysis useful instead of guessed.
            </p>
 
            {(() => {
              const { needsUser, needsProblem } = getMissingFields(originalIdea);
              const q = getClarificationQuestions(originalIdea);
              return (
                <>
                  {needsUser && (
                    <div className="cbc-clarify-q">
                      <label htmlFor="cbc-who">{q.userLabel}</label>
                      <input
                        id="cbc-who"
                        className="cbc-clarify-input"
                        value={clarificationAnswers.targetUser}
                        onChange={(e) => setClarificationAnswers({ ...clarificationAnswers, targetUser: e.target.value })}
                        placeholder={q.userPlaceholder}
                      />
                    </div>
                  )}
                  {needsProblem && (
                    <div className="cbc-clarify-q">
                      <label htmlFor="cbc-what">{q.problemLabel}</label>
                      <input
                        id="cbc-what"
                        className="cbc-clarify-input"
                        value={clarificationAnswers.problemDetail}
                        onChange={(e) => setClarificationAnswers({ ...clarificationAnswers, problemDetail: e.target.value })}
                        placeholder={q.problemPlaceholder}
                      />
                    </div>
                  )}
                </>
              );
            })()}
 
            {error && (
              <div className="cbc-error">
                <AlertTriangle size={16} strokeWidth={2} />
                <span>{error}</span>
              </div>
            )}
 
            <div className="cbc-actions">
              <button className="cbc-btn" onClick={handleClarifySubmit}>
                Continue to analysis
              </button>
              <button className="cbc-btn cbc-btn-secondary" onClick={() => setStage("home")}>
                Back
              </button>
            </div>
          </>
        )}
 
        {stage === "analyzing" && <Spinner text="Analyzing your idea…" />}
 
        {(stage === "analysis" || stage === "challenging" || stage === "challenge") && currentAnalysis && (
          <>
            <p className="cbc-note">Sample response for this prototype — not generated by live AI yet.</p>
 
            <h2 className="cbc-blockheader">Problem definition</h2>
            <SectionCard accent="blueprint" label="Problem">
              {currentAnalysis.problem}
            </SectionCard>
 
            <h2 className="cbc-blockheader">Target user</h2>
            <SectionCard accent="blueprint" label="Target user">
              {currentAnalysis.targetUser}
            </SectionCard>
 
            <h2 className="cbc-blockheader">Key assumptions</h2>
            <SectionCard accent="amber" label="Assumptions">
              <ul>
                {currentAnalysis.assumptions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </SectionCard>
 
            <h2 className="cbc-blockheader">Solution options</h2>
            <div className="cbc-solutions">
              {currentAnalysis.solutions.map((s, i) => (
                <SectionCard accent="blueprint" label={`Option ${i + 1}`} key={i}>
                  <div className="cbc-solution-title">{s.title}</div>
                  {s.description}
                </SectionCard>
              ))}
            </div>
 
            {stage === "analysis" && (
              <div className="cbc-actions">
                <button className="cbc-btn" onClick={handleChallengeClick}>
                  Challenge my idea
                </button>
              </div>
            )}
 
            {stage === "challenging" && <Spinner text="Stress-testing your idea…" />}
 
            {stage === "challenge" && currentChallenge && currentMVP && (
              <>
                <h2 className="cbc-blockheader">Challenge results</h2>
                <SectionCard accent="rust" label="Weakest assumption">{currentChallenge.weakestAssumption}</SectionCard>
                <SectionCard accent="rust" label="Biggest adoption risk">{currentChallenge.biggestAdoptionRisk}</SectionCard>
                <SectionCard accent="rust" label="Biggest technical risk">{currentChallenge.biggestTechnicalRisk}</SectionCard>
                <SectionCard accent="rust" label="Why users might not care">{currentChallenge.whyUsersMightNotCare}</SectionCard>
                <SectionCard accent="amber" label="Simplification opportunity">{currentChallenge.simplificationOpportunity}</SectionCard>
                <SectionCard accent="moss" label="Fastest validation experiment">{currentChallenge.fastestValidationExperiment}</SectionCard>
 
                <h2 className="cbc-blockheader">Smallest MVP</h2>
                <SectionCard accent="moss" label="Description">{currentMVP.description}</SectionCard>
                <div className="cbc-mvp-cols">
                  <div className="cbc-mvp-col">
                    <div className="cbc-mvp-col-title in">In scope</div>
                    <ul>
                      {currentMVP.inScope.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="cbc-mvp-col">
                    <div className="cbc-mvp-col-title out">Out of scope</div>
                    <ul>
                      {currentMVP.outScope.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            )}
 
            <HumanCheck data={currentHumanCheck} />
          </>
        )}
      </div>
    </div>
  );
}