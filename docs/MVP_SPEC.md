# Campus Build Copilot — MVP Specification

## Product Goal

Help college students with a project idea turn that vague idea into a clearer, smaller and testable MVP.

## Primary User

College students with beginner-to-intermediate technical ability who have a project idea but struggle to decide what problem to solve, who to solve it for and what the first realistic version should be.

## Core Product Loop

Idea
→ Analyze
→ Clarify Problem
→ Identify User
→ Expose Assumptions
→ Challenge Idea
→ Reduce Scope
→ Define Smallest MVP
→ Human Check

## MVP Features

### 1. Idea Input

The user describes their project idea in natural language.

### 2. Analyze My Idea

Claude generates:

- Problem Definition
- Target User
- Key Assumptions

### 3. Solution Options

Claude proposes up to three possible approaches.

### 4. Challenge My Idea

Claude stress-tests the idea by identifying:

- Weakest assumption
- Biggest adoption risk
- Biggest technical risk
- Likely reason users may not care
- Simplification opportunity
- Fastest validation experiment

### 5. Smallest MVP

Claude identifies the smallest version of the idea that is worth testing.

### 6. Human Check

Every major response should distinguish:

- Known information
- Assumptions
- Uncertainty
- What the user should verify in the real world

## Explicitly Out of Scope for MVP

- 7-Day Build Plan
- Demo Script
- Detailed Technical Architecture
- User authentication
- Accounts
- Analytics
- Social features
- Project management
- Real-world market-size claims
- Guaranteed success predictions

## Product Differentiation

Campus Build Copilot should not behave like a generic encouraging chatbot.

It should:

- challenge assumptions
- identify scope problems
- distinguish facts from assumptions
- avoid fabricated evidence
- recommend simpler MVPs
- encourage real-world validation

## Product Tone

Constructive and honest.

The system should challenge ideas without discouraging the student.

Avoid:
- harsh criticism
- unnecessary negativity
- hype
- fake certainty

## Success Criteria

A user should leave the experience with:

1. A clearer problem
2. A specific target user
3. Visible assumptions
4. A smaller MVP
5. At least one validation experiment
6. A clear understanding of what still needs to be verified