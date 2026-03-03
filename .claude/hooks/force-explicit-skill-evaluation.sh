#!/bin/bash
# UserPromptSubmit hook that forces explicit skill evaluation

cat <<'EOF'
INSTRUCTION: MANDATORY SKILL ACTIVATION SEQUENCE

Step 1 - GATHER CONTEXT:
If you are missing context because you haven't fetched a Linear ticket, use the `using-linear` skill to fetch the ticket first
If you are missing context because you haven't read a file, read the file first

Step 2 - EVALUATE (do this in your response):
For each skill in <available_skills>, state: [skill-name] - YES/NO - [reason]

Step 3 - ACTIVATE (do this immediately after Step 1):
IF any skills are YES → Use Skill(skill-name) tool for EACH relevant skill NOW
IF no skills are YES → State "No skills needed" and proceed

Step 4 - IMPLEMENT:
Only after Step 3 is complete, proceed with implementation.

CRITICAL: You MUST call Skill() tool in Step 3. Do NOT skip to implementation.
The evaluation (Step 2) is WORTHLESS unless you ACTIVATE (Step 3) the skills.

Example of correct sequence:
- research: NO - not a research task
- svelte5-runes: YES - need reactive state
- sveltekit-structure: YES - creating routes

[Then IMMEDIATELY use Skill() tool:]
> Skill(svelte5-runes)
> Skill(sveltekit-structure)

[THEN and ONLY THEN start implementation]
EOF
