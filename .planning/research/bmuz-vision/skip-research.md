# Asking only what's still open — how forms and interviews decide what to skip

F234 — Steps ask only what's still open, task 1. Read 2026-11-13 by Claude (pages read first-hand with curl; quotes are the pages' own words).
Why: after two Sirius Smugglers runs Muzzy said BMUZ is "so strongly on rails that it guides me down paths that aren't useful", and set the rules: never skip something the project needs ("if you need to know something, ask"), and "already decided" must not skip "a bunch of other questions".
Scope: how adaptive forms, survey tools and longitudinal interviews decide ask / confirm / skip, and the mistakes they warn about. Only what changes how BMUZ's Ideate and Define steps decide.

## 1. Every question has a reason, and the reason is who needs the answer
- GOV.UK's form guide: "Only add a question if you know: that you need the information to deliver the service · why you need the information · what you'll do with it · which users need to give you the information". The list "is called a 'question protocol'… it's about how you'll use the answers… It gives you a way of challenging and pushing back against unnecessary questions". [1]
- The same guide: "Use 'branching' questions so people only have to answer questions that are relevant to them." [1]
- GOV.UK question pages: "Make sure to only ask for a piece of information once within a single journey. Whenever possible, do not ask a user to re-enter information they've already provided." [2]

**So:** each step names what it collects and who uses it later (Design, the build, the store page). That is the question protocol; it is also the test for a skip: an answer nobody later needs may be left; one a later stage needs is asked when it's missing.

## 2. Decide per question from what you already hold, not by jumping ahead
- Qualtrics names three kinds: "Display Logic displays or hides a question based on any information you already have about the current respondent. Branch Logic does the same but for blocks of questions… Skip Logic sends the respondent to a different part of the survey based on their answer to a specific question." [3]
- Display logic can be based on "Embedded Data: Use any information you have stored about the respondent". [4]
- Skip logic jumps over everything in between: respondents are sent "to future questions within the current block, to the end of the current block, or to the end of the survey"; "skip logic can only be used to send respondents forward in the survey, not backward." [3]
- SurveyMonkey: skip logic lets you "skip respondents to future points in your survey, show or hide questions, show or hide pages". [5]

**So:** a jump ("skip to the end of the block") is the shape Muzzy warned against: one answer drops many questions. BMUZ wants display logic: each question shown or not from what the design document already holds, one at a time. "Already decided" settles one question and nothing past it.

## 3. Prefill and confirm: people accept what they're shown, even when it's wrong
- Longitudinal surveys remind people of their last answer before asking again (proactive dependent interviewing), "to assist respondent recall and reduce spurious changes". But it "may however provide scope for new errors if respondents falsely accept the previous information". When a wrong preload was shown by mistake, "A large proportion of respondents accepted the false preload", mostly when the real answer was hard to work out. [6]
- NN/g on defaults: "people tend to stick to the defaults"; users "click the top hit not because it's any better, but simply because it's first", and defaults should be "a representative value" and "a frequent value". [7]

**So:** a confirm ("Your rules say X. Keep it?") is cheap but easy to wave through. It is right for something read from the material that might be read wrong; it must show the words and where they came from, so a misreading is visible. It is not a way to skip: a creative tapping "Keep" on a wrong reading is the known failure, so BMUZ only skips what is written in the document as a fixed rule or a decision, and confirms everything it had to read into.

## 4. Never a silent skip: show what was left out, and let it be changed in one move
- GOV.UK check answers: "If you have questions that are optional, let users know that they've skipped it without giving an answer by showing their response as 'Not provided'." [8]
- "You should provide a 'Change' link next to each section… When they've finished, the 'Continue' button should return them to the check answers page. They should not need to go through the rest of the transaction again." [8]
- "If a user changes their response in a way that means you need to ask them more questions, do this before returning them to the check answers page." [8]
- Allow "'I do not know' or 'I'm not sure' if they are valid responses" [2]: an answer can be "not yet", which is different from "skipped".

**So:** at each stage's end, list what wasn't asked and why, each with a one-word way back ("reopen 2"). Reopening runs that one step and comes back to where you were, never the whole stage again.

## 5. Mistakes they warn about
- **Asking what you already have** (GOV.UK [2]): the Sirius Smugglers runs' "if you read the rules, you'd already know the answer".
- **One answer skipping a block** (Qualtrics skip logic [3]): "already decided" turning off several questions.
- **Skipping because a section looks filled:** display logic tests one stored value [4], not "is the page full"; a chapter with three loose lines can still miss the one answer a step needs.
- **Trusting a preload too much** [6]: a confirm on a wrong reading gets accepted. Confirm shows the source; only fixed rules and decisions skip.
- **Hidden gaps:** a skipped optional question is shown as "Not provided" [8], not left out.

## What this means for BMUZ
1. **Each step names what it collects** (the GDD chapter, the field, the line that asks for it) and **who needs it later** (Design, the build, the store page): BMUZ's question protocol, kept in the pipeline file.
2. **Before each Ideate and Define step the engine decides, per field, from the design document itself**: a `Fixed:` rule from the creative's material or a decision already made = **there** (skip it); something read in or said loosely (`Clear:`, "my reading") = **unsure** (confirm it, showing the words and their source); nothing, or only ideas and open questions = **missing** (ask it). The step is skipped only when every field is there; otherwise it runs, confirming what's unsure and asking what's missing. A field a later stage needs is never skipped while it's missing.
3. **Every decision is journaled** with its field and reason, so a skip can always be traced.
4. **"Already decided" settles the one question on screen** (its field, nothing else): display logic, never skip logic.
5. **Each stage ends with "I didn't ask about …: why"**, each reopenable with one word; reopening runs that step alone and comes back.
6. **A new idea still gets every question:** its document holds only ideas and open questions, so nothing is there and nothing is skipped.

## Sources
1. GOV.UK Service Manual, "Structuring forms" — https://www.gov.uk/service-manual/design/form-structure
2. GOV.UK Design System, "Question pages" — https://design-system.service.gov.uk/patterns/question-pages/
3. Qualtrics Support, "Skip Logic" — https://www.qualtrics.com/support/survey-platform/survey-module/question-options/skip-logic/
4. Qualtrics Support, "Display Logic" — https://www.qualtrics.com/support/survey-platform/survey-module/question-options/display-logic/
5. SurveyMonkey Help, "Skip logic" — https://help.surveymonkey.com/en/surveymonkey/create/skip-logic/
6. Johannes Eggs & Annette Jäckle, "Dependent Interviewing and Sub-Optimal Responding", Survey Research Methods 9(1), 15–29, 2015 — https://doi.org/10.18148/srm/2015.v9i1.5860 (abstract read at https://ojs.ub.uni-konstanz.de/srm/article/view/5860)
7. Jakob Nielsen, "The Power of Defaults", Nielsen Norman Group — https://www.nngroup.com/articles/the-power-of-defaults/
8. GOV.UK Design System, "Check answers" — https://design-system.service.gov.uk/patterns/check-answers/

Tried and not used: Typeform's hidden-fields help page (refused automated reading, 403); an ISER working paper on dependent interviewing at EconStor (behind a bot check, not bypassed); the SAGE encyclopedia entry (redirects to a login).
