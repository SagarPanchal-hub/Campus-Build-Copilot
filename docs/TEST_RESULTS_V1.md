# Campus Build Copilot — V1 Test Results

## Test 1 — Clear idea

Input:
[I want to reduce food waste in my college by helping cafeterias and students coordinate leftover food.]

Expected:
[It should produce something roughly equivalent to:
Problem Definition
Specific problem, not generic “food waste is bad.”

Target User
Specific users, e.g. campus cafeteria operators / students, rather than simply “everyone.”

Assumptions
Things that aren't proven.

Solution Options
Up to three.

And importantly:

It should not invent statistics.]


Actual:
[Problem definition
Problem
Students dealing with reducing food waste currently rely on checking the fridge from memory or tossing food once it looks or smells off. That works at a small scale, but breaks down as soon as more people or steps are involved.
Target user
Target user
Students — specifically, people who currently deal with this using checking the fridge from memory or tossing food once it looks or smells off.
Key assumptions
Assumptions
People actually notice and care when food goes to waste, rather than treating it as a normal cost of stocking up.
Logging or checking on food items is worth the extra few seconds it takes, often enough to become a habit.
The waste is mainly caused by poor visibility into what's about to expire, not a lack of time or cooking skill.
Solution options
Option 1
Expiry reminder
A minimal tool that only reminds people about items likely to expire soon, without tracking a full inventory.
Option 2
Manual log + prompts
A simple log where someone enters what they bought once, then gets a nudge before it likely spoils.
Option 3
Shared household view
A shared view for roommates or a household so everyone can see what's about to go bad before it's wasted.

Human check
What's known, assumed, uncertain, and worth checking yourself
Known
Original idea, as described: "I want to reduce food waste in my college by helping cafeterias and students coordinate le…"
Target user, as stated in the idea: "students"
Assumed
Persona details beyond what was stated — motivations, context, habits — are inferred for this analysis, not confirmed.
People actually notice and care when food goes to waste, rather than treating it as a normal cost of stocking up.
Logging or checking on food items is worth the extra few seconds it takes, often enough to become a habit.
Uncertain
That the real cause is a lack of visibility into what's expiring, rather than time, cooking skill, or simply buying more than needed.
How much real-world impact or adoption this idea would have — this can't be estimated without testing; it would need pilot usage data to know.
You should verify
Give 5–10 people a plain paper checklist for their fridge for one week and see if they'd actually keep using something like it.]

Pass/Fail:
[YOU CAN CHECK]

Issue:
[YOU CAN CHECK]

---

## Test 2 — Vague idea

Input:
I want to solve traffic.

Expected:
Clarification instead of invented solution.

Actual:
[Problem definition
Problem
The idea doesn't yet pin down a specific problem beyond "I want to solve traffic.." This can't be reliably filled in without more detail — a made-up problem statement would just be a guess. What's needed: a one-sentence description of what goes wrong today, in the target user's own words.
Target user
Target user
Not specified. Based on context, a reasonable starting guess is students dealing with getting around campus or the city more efficiently, but this is an assumption, not something stated — worth confirming before building further.
Key assumptions
Assumptions
The delay or friction being described happens often enough, and predictably enough, that a dedicated tool adds value over a general maps app.
The target users have some flexibility in departure time or route, so better information actually changes their behavior.
Real-time or accurate data for this specific route or mode is realistically obtainable.
Solution options
Option 1
Route/time advisory
A focused tool that tells a specific group when to leave to avoid a specific, recurring bottleneck.
Option 2
Matching tool
A tool that matches people heading the same way at the same time, for carpooling or shared trips.
Option 3
Reporting layer
A lightweight way for people to report real-time conditions (delays, full lots) that a general maps app doesn't capture.

Human check
What's known, assumed, uncertain, and worth checking yourself
Known
Original idea, as described: "I want to solve traffic."
Assumed
No specific target user was confirmed, so a general student persona was assumed by default for the sake of analysis — treat this as a placeholder, not a finding.
The delay or friction being described happens often enough, and predictably enough, that a dedicated tool adds value over a general maps app.
The target users have some flexibility in departure time or route, so better information actually changes their behavior.
Uncertain
Who actually experiences this problem enough to want a dedicated tool for it.
What the concrete, everyday version of this problem actually looks like for a real user.
That existing maps and transit apps are missing something specific for this group, rather than already solving the problem well enough.
How much real-world impact or adoption this idea would have — this can't be estimated without testing; it would need pilot usage data to know.
You should verify
Interview a few potential users to identify the real target audience before building further.
Write down one real recent instance of this problem happening, with specifics, before analyzing further.
Track how a small group actually commutes for a week using a shared spreadsheet or group chat, before building any routing logic.]

Pass/Fail:
[YOU CAN CHECK]

Issue:
[YOU CAN CHECK]

---

## Test 3 — Overambitious idea

Input:
I want to build an AI system that predicts whether every student will become successful.

Expected:
Challenge assumptions and reduce scope.

Actual:
[A bit more detail first.
Your idea is short on specifics. Answering these makes the analysis useful instead of guessed.

Who exactly would use this? Be specific about the situation.
e.g. Sophomores living off-campus with 2–3 roommates
What specific problem does it solve for them right now?
e.g. Figuring out who owes what after a shared grocery run

AFTER RANDOM INPUT IN THESE 2 QUESTIONS LIKE STUDENTS HOW TO BECAME A STUDENT SUCCESSFUL WE CAN SEE -

Problem definition
Problem
As described: HOW TO BECAME A STUDENT SUCCESSFUL Today, this is handled by handling predicts, whether, will, become manually, without any dedicated tool, which works at a small scale but breaks down as more people or steps are involved.
Target user
Target user
STUDENTS — specifically, people who currently deal with this using handling predicts, whether, will, become manually, without any dedicated tool.
Key assumptions
Assumptions
People dealing with predicts, whether, will, become experience it often enough to want a dedicated tool, rather than a one-off workaround.
The current manual approach to predicts, whether, will, become is annoying enough that the target user would switch to something new.
A basic first version focused only on predicts, whether, will, become would still be useful enough to test.
Solution options
Option 1
Narrow single-purpose tool
A tool that does exactly one thing related to predicts, whether, will, become, done well, instead of covering the idea broadly.
Option 2
Guided manual workflow
A step-by-step guided version of the current manual process for predicts, whether, will, become, without automation.
Option 3
Shared/collaborative version
A version built around multiple people using it together for predicts, whether, will, become, useful only if the problem is inherently social.

Human check
What's known, assumed, uncertain, and worth checking yourself
Known
Original idea, as described: "I want to build an AI system that predicts whether every student will become successful."
Target user, as clarified: "STUDENTS"
Problem detail, as clarified: "HOW TO BECAME A STUDENT SUCCESSFUL"
Assumed
Persona details beyond what was stated — motivations, context, habits — are inferred for this analysis, not confirmed.
People dealing with predicts, whether, will, become experience it often enough to want a dedicated tool, rather than a one-off workaround.
The current manual approach to predicts, whether, will, become is annoying enough that the target user would switch to something new.
Uncertain
That people affected by predicts, whether, will, become would adopt a new tool at all, rather than tolerating the current manual workaround.
How much real-world impact or adoption this idea would have — this can't be estimated without testing; it would need pilot usage data to know.
You should verify
Show 5–10 people who deal with predicts, whether, will, become a rough mockup or paper version and watch whether they can complete the task with it, without explaining it first.]

Pass/Fail:
[YOU CAN CHECK]

Issue:
[YOU CAN CHECK]

---

## Test 4 — Short input

Input:
Internship app

Expected:
Inline clarification.

Actual:
[Problem definition
Problem
The idea doesn't yet pin down a specific problem beyond "I want to build an app to help students find internships.." This can't be reliably filled in without more detail — a made-up problem statement would just be a guess. What's needed: a one-sentence description of what goes wrong today, in the target user's own words.
Target user
Target user
Students — specifically, people who currently deal with this using manually tracking applications in a spreadsheet or notes app, and searching job boards individually.
Key assumptions
Assumptions
The bottleneck is discovery and organization (finding and tracking opportunities), not the underlying difficulty of getting hired.
Students would trust a new tool with sensitive application data — resumes, contacts — enough to rely on it.
There's a consistent enough volume of relevant opportunities to make checking a dedicated tool worthwhile.
Solution options
Option 1
Application tracker
A focused tracker for the applications a student is already submitting, replacing the spreadsheet.
Option 2
Curated matching
A tool that filters postings down to a small, relevant set instead of a generic job-board search.
Option 3
Peer accountability
A lightweight way for students to share progress and deadlines with peers doing the same search.

Human check
What's known, assumed, uncertain, and worth checking yourself
Known
Original idea, as described: "I want to build an app to help students find internships."
Target user, as stated in the idea: "students"
Assumed
Persona details beyond what was stated — motivations, context, habits — are inferred for this analysis, not confirmed.
The bottleneck is discovery and organization (finding and tracking opportunities), not the underlying difficulty of getting hired.
Students would trust a new tool with sensitive application data — resumes, contacts — enough to rely on it.
Uncertain
What the concrete, everyday version of this problem actually looks like for a real user.
That better organization or matching meaningfully increases the chance of landing an internship, rather than the core bottleneck being competitiveness or experience.
How much real-world impact or adoption this idea would have — this can't be estimated without testing; it would need pilot usage data to know.
You should verify
Write down one real recent instance of this problem happening, with specifics, before analyzing further.
Ask 5–10 students currently applying to internships to track their next two weeks of applications in a shared sheet shaped like your MVP.]

Pass/Fail:
[YOU CAN CHECK]

---

## Test 5 — Empty input

Expected:
Inline validation.

Actual:
[Inline validation.]

Pass/Fail:
[YOU CAN CHECK]

---

## Test 6 — Challenge mode

Input:
I want to reduce water wastage in my hostel without building a mobile app.

Expected:
Weakest assumption
Adoption risk
Technical risk
Why users might not care
Simplification
Validation experiment

Actual:
[A bit more detail first.
Your idea is short on specifics. Answering these makes the analysis useful instead of guessed.

Who exactly would use this? Be specific about the situation.
e.g. Sophomores living off-campus with 2–3 roommates
What specific problem does it solve for them right now?
e.g. Figuring out who owes what after a shared grocery run

AFTER RANDOM INPUT IN THESE 2 QUESTIONS LIKE HOSTEL MEMBERS AND REDUCE WATER WASTAGE WE CAN SEE -

Problem definition
Problem
As described: reduce water wastage Today, this is handled by handling reduce, water, wastage, hostel manually, without any dedicated tool, which works at a small scale but breaks down as more people or steps are involved.
Target user
Target user
HOSTEL STUDENTS — specifically, people who currently deal with this using handling reduce, water, wastage, hostel manually, without any dedicated tool.
Key assumptions
Assumptions
People dealing with reduce, water, wastage, hostel experience it often enough to want a dedicated tool, rather than a one-off workaround.
The current manual approach to reduce, water, wastage, hostel is annoying enough that the target user would switch to something new.
A basic first version focused only on reduce, water, wastage, hostel would still be useful enough to test.
Solution options
Option 1
Narrow single-purpose tool
A tool that does exactly one thing related to reduce, water, wastage, hostel, done well, instead of covering the idea broadly.
Option 2
Guided manual workflow
A step-by-step guided version of the current manual process for reduce, water, wastage, hostel, without automation.
Option 3
Shared/collaborative version
A version built around multiple people using it together for reduce, water, wastage, hostel, useful only if the problem is inherently social.

Human check
What's known, assumed, uncertain, and worth checking yourself
Known
The student's own description: "I want to reduce food waste in my college by helping cafeterias and students coordinate le…"
Assumed
Who the target user is, beyond what the student wrote
That the problem happens often enough to justify a dedicated tool
That a no-login, single-session version is enough to test real interest
Uncertain
Whether this problem is painful enough that students would actually switch tools for it
Whether the simplification suggested here removes something students actually needed
You should verify
Talk to 5–10 students who match the target user and describe how they handle this today
Watch someone unfamiliar with the idea try to use a rough version, without explaining it first

Challenge results
Weakest assumption
That people affected by reduce, water, wastage, hostel would adopt a new tool at all, rather than tolerating the current manual workaround.
Biggest adoption risk
The target user already has a "good enough" habit around reduce, water, wastage, hostel, so switching costs more effort than the tool initially saves.
Biggest technical risk
Underestimating how much setup or manual input is needed before a tool for reduce, water, wastage, hostel becomes useful to a first-time user.
Why users might not care
Reduce, water, wastage, hostel may only come up occasionally, so a dedicated tool competes with "I'll just deal with it this once."
Simplification opportunity
Cut any account system, history, or customization for version one — a single-session, no-login flow focused only on reduce, water, wastage, hostel is enough to test demand.
Fastest validation experiment
Show 5–10 people who deal with reduce, water, wastage, hostel a rough mockup or paper version and watch whether they can complete the task with it, without explaining it first.
Smallest MVP
Description
A single-session version that lets HOSTEL STUDENTS complete the core task — I want to reduce water wastage in my hostel without building a mobile app — from start to finish, incorporating the simplification identified above ("Cut any account system, history, or customization for version one — a single-session, no-login flow focused only on reduce, water, wastage, hostel is enough to test demand."). No accounts, no saved history, no extra features.
In scope
One core task, done end-to-end
A single input and a single clear output
Enough guidance that a first-time user isn't confused
Out of scope
Accounts or login
Saved history or dashboards
Collaboration or sharing features
Notifications or reminders

Human check
What's known, assumed, uncertain, and worth checking yourself
Known
Original idea, as described: "I want to reduce water wastage in my hostel without building a mobile app."
Target user, as clarified: "HOSTEL STUDENTS"
Problem detail, as clarified: "reduce water wastage"
Assumed
Persona details beyond what was stated — motivations, context, habits — are inferred for this analysis, not confirmed.
People dealing with reduce, water, wastage, hostel experience it often enough to want a dedicated tool, rather than a one-off workaround.
The current manual approach to reduce, water, wastage, hostel is annoying enough that the target user would switch to something new.
That the simplification suggested in Challenge Results is safe to make — i.e. that it doesn't remove something users actually needed.
Uncertain
That people affected by reduce, water, wastage, hostel would adopt a new tool at all, rather than tolerating the current manual workaround.
How much real-world impact or adoption this idea would have — this can't be estimated without testing; it would need pilot usage data to know.
Whether removing scope in the way suggested actually holds up once real users try it.
You should verify
Show 5–10 people who deal with reduce, water, wastage, hostel a rough mockup or paper version and watch whether they can complete the task with it, without explaining it first.
Test the specific simplification from Challenge Results ("Cut any account system, history, or customization for version one — a single-session, no-login flow focused only on reduce, water, wastage, hostel is enough to test demand") with a few real users to see if it holds up.]

Pass/Fail:
[YOU CAN CHECK]

---

## Test 7 — Smallest MVP

Expected:
Original idea should be meaningfully reduced.

Actual:
[YOU CAN CHECK USING PREVIOUS ONE]

Pass/Fail:
[YOU CAN CHECK]

---

## Test 8 — Human Check

Expected:
Known / Assumed / Uncertain / Verify

Actual:
[Known / Assumed / Uncertain / Verify]

Pass/Fail:
[YOU CAN CHECK]

---

## Test 9 — Unknown data

Input:
Tell me exactly how many students in India will use this in the first year.

Actual:
[A bit more detail first.
Your idea is short on specifics. Answering these makes the analysis useful instead of guessed.

Who exactly would use this? Be specific about the situation.
e.g. Sophomores living off-campus with 2–3 roommates
What specific problem does it solve for them right now?
e.g. Figuring out who owes what after a shared grocery run

AFTER RANDOM INPUT IN THESE 2 QUESTIONS LIKE STUDENTS AND KNOW HOW MANY STUDENTS USE ChatGPT WE CAN SEE -

Problem definition
Problem
As described: KNOW HOW MANY STUDENTS USE ChatGPT Today, this is handled by handling tell, exactly, india, will manually, without any dedicated tool, which works at a small scale but breaks down as more people or steps are involved.
Target user
Target user
STUDENTS — specifically, people who currently deal with this using handling tell, exactly, india, will manually, without any dedicated tool.
Key assumptions
Assumptions
People dealing with tell, exactly, india, will experience it often enough to want a dedicated tool, rather than a one-off workaround.
The current manual approach to tell, exactly, india, will is annoying enough that the target user would switch to something new.
A basic first version focused only on tell, exactly, india, will would still be useful enough to test.
Solution options
Option 1
Narrow single-purpose tool
A tool that does exactly one thing related to tell, exactly, india, will, done well, instead of covering the idea broadly.
Option 2
Guided manual workflow
A step-by-step guided version of the current manual process for tell, exactly, india, will, without automation.
Option 3
Shared/collaborative version
A version built around multiple people using it together for tell, exactly, india, will, useful only if the problem is inherently social.

Human check
What's known, assumed, uncertain, and worth checking yourself
Known
Original idea, as described: "Tell me exactly how many students in India will use this in the first year."
Target user, as clarified: "STUDENTS"
Problem detail, as clarified: "KNOW HOW MANY STUDENTS USE ChatGPT"
Assumed
Persona details beyond what was stated — motivations, context, habits — are inferred for this analysis, not confirmed.
People dealing with tell, exactly, india, will experience it often enough to want a dedicated tool, rather than a one-off workaround.
The current manual approach to tell, exactly, india, will is annoying enough that the target user would switch to something new.
Uncertain
That people affected by tell, exactly, india, will would adopt a new tool at all, rather than tolerating the current manual workaround.
How much real-world impact or adoption this idea would have — this can't be estimated without testing; it would need pilot usage data to know.
You should verify
Show 5–10 people who deal with tell, exactly, india, will a rough mockup or paper version and watch whether they can complete the task with it, without explaining it first.]

Pass/Fail:
[YOU CAN CHECK]

---

c User assumption

Input:
Assume every college cafeteria produces at least 20 kg of leftover food every day.

Actual:
[Problem definition
Problem
The idea doesn't yet pin down a specific problem beyond "Assume every college cafeteria produces at least 20 kg of leftover food every da…." This can't be reliably filled in without more detail — a made-up problem statement would just be a guess. What's needed: a one-sentence description of what goes wrong today, in the target user's own words.
Target user
Target user
Not specified. Based on context, a reasonable starting guess is students dealing with reducing food waste, but this is an assumption, not something stated — worth confirming before building further.
Key assumptions
Assumptions
People actually notice and care when food goes to waste, rather than treating it as a normal cost of stocking up.
Logging or checking on food items is worth the extra few seconds it takes, often enough to become a habit.
The waste is mainly caused by poor visibility into what's about to expire, not a lack of time or cooking skill.
Solution options
Option 1
Expiry reminder
A minimal tool that only reminds people about items likely to expire soon, without tracking a full inventory.
Option 2
Manual log + prompts
A simple log where someone enters what they bought once, then gets a nudge before it likely spoils.
Option 3
Shared household view
A shared view for roommates or a household so everyone can see what's about to go bad before it's wasted.

Human check
What's known, assumed, uncertain, and worth checking yourself
Known
Original idea, as described: "Assume every college cafeteria produces at least 20 kg of leftover food every day."
Assumed
No specific target user was confirmed, so a general student persona was assumed by default for the sake of analysis — treat this as a placeholder, not a finding.
People actually notice and care when food goes to waste, rather than treating it as a normal cost of stocking up.
Logging or checking on food items is worth the extra few seconds it takes, often enough to become a habit.
Uncertain
Who actually experiences this problem enough to want a dedicated tool for it.
What the concrete, everyday version of this problem actually looks like for a real user.
That the real cause is a lack of visibility into what's expiring, rather than time, cooking skill, or simply buying more than needed.
How much real-world impact or adoption this idea would have — this can't be estimated without testing; it would need pilot usage data to know.
You should verify
Interview a few potential users to identify the real target audience before building further.
Write down one real recent instance of this problem happening, with specifics, before analyzing further.
Give 5–10 people a plain paper checklist for their fridge for one week and see if they'd actually keep using something like it.]

Pass/Fail:
[YOU CAN CHECK]


## Test 11 — Same idea twice
Run the same food-waste idea twice and compare.

Actual:
[Problem definition
Problem
Students dealing with reducing food waste currently rely on checking the fridge from memory or tossing food once it looks or smells off. That works at a small scale, but breaks down as soon as more people or steps are involved.
Target user
Target user
Students — specifically, people who currently deal with this using checking the fridge from memory or tossing food once it looks or smells off.
Key assumptions
Assumptions
People actually notice and care when food goes to waste, rather than treating it as a normal cost of stocking up.
Logging or checking on food items is worth the extra few seconds it takes, often enough to become a habit.
The waste is mainly caused by poor visibility into what's about to expire, not a lack of time or cooking skill.
Solution options
Option 1
Expiry reminder
A minimal tool that only reminds people about items likely to expire soon, without tracking a full inventory.
Option 2
Manual log + prompts
A simple log where someone enters what they bought once, then gets a nudge before it likely spoils.
Option 3
Shared household view
A shared view for roommates or a household so everyone can see what's about to go bad before it's wasted.

Human check
What's known, assumed, uncertain, and worth checking yourself
Known
Original idea, as described: "I want to reduce food waste in my college by helping cafeterias and students coordinate le…"
Target user, as stated in the idea: "students"
Assumed
Persona details beyond what was stated — motivations, context, habits — are inferred for this analysis, not confirmed.
People actually notice and care when food goes to waste, rather than treating it as a normal cost of stocking up.
Logging or checking on food items is worth the extra few seconds it takes, often enough to become a habit.
Uncertain
That the real cause is a lack of visibility into what's expiring, rather than time, cooking skill, or simply buying more than needed.
How much real-world impact or adoption this idea would have — this can't be estimated without testing; it would need pilot usage data to know.
You should verify
Give 5–10 people a plain paper checklist for their fridge for one week and see if they'd actually keep using something like it.]

Pass/Fail:
[YOU CAN CHECK]