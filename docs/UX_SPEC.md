# Campus Build Copilot — UX Specification

## Architecture

Single-page, state-driven experience.

No:
- login
- account
- navigation menu
- tabs
- settings
- history
- unnecessary screens

## State Flow

Home
→ Analyze Loading
→ Analysis Results
→ Challenge Loading
→ Challenge Results + Smallest MVP
→ Human Check

Errors appear inline without replacing the whole page.

## Home

Headline:
Turn your idea into a real MVP.

Supporting text:
We will challenge your idea, not just cheer it on.

Components:
- large idea input
- example placeholder
- soft guidance
- Analyze My Idea button

## Analysis Output

Fixed order:

1. Problem Definition
2. Target User
3. Key Assumptions
4. Solution Options
5. Challenge My Idea

## Challenge Output

1. Weakest Assumption
2. Biggest Adoption Risk
3. Biggest Technical Risk
4. Why Users Might Not Care
5. Simplification Opportunity
6. Fastest Validation Experiment

## Smallest MVP

Appears after Challenge.

Show:
- MVP description
- In Scope
- Out of Scope

## Human Check

Always visible at the bottom.

Show:
- Known
- Assumed
- Uncertain
- You Should Verify

## Important Behavior

If the user's idea lacks enough information for useful analysis:
ask 1–2 targeted clarification questions rather than inventing assumptions as facts.

## UX Principles

- one primary action at a time
- minimal visual clutter
- constructive but honest tone
- clear distinction between facts and assumptions
- no fake certainty
- no fabricated evidence
- responsive design
- accessible controls

## MVP Scope

Do not implement:
- authentication
- accounts
- history
- analytics
- social features
- detailed technical architecture
- 7-day build plan
- demo script