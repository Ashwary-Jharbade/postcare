# Control Board: {{TICKET_NUMBER}}

> This file is auto-generated and maintained by the AI pipeline agents.
> **Humans**: Only modify the `Plan Approved` row to unblock development.

**Ticket**: {{TICKET_NUMBER}}
**Branch**: feature/{{TICKET_NUMBER}}-{{SLUG}}
**Last Updated**: {{DATE}}

---

## Pipeline Status

| Phase          | Status          | Notes                                    |
|----------------|-----------------|------------------------------------------|
| Planning       | `planning`      | Plan created, awaiting review            |
| Plan Approved  | `not-approved`  | ⬅️ Change to `approved` to unlock /develop |
| Development    | `not-started`   | —                                        |
| Testing        | `not-started`   | —                                        |
| Review         | `not-started`   | —                                        |

---

## Phase Checklist

### 📐 Planning
- [ ] `plan.md` created
- [ ] Scope clearly defined
- [ ] Architecture documented
- [ ] Task slices defined
- [ ] Open questions resolved
- [ ] **Team reviewed plan**
- [ ] **Plan approved** ← human sets above status to `approved`

### 🔨 Development
- [ ] `development.md` created
- [ ] Slice 1 implemented
- [ ] Slice 2 implemented
- [ ] *(add more as needed)*
- [ ] Lint passing
- [ ] Code committed to branch

### 🧪 Testing
- [ ] `testcases.md` created
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] All edge cases from plan covered

### 🔍 Review
- [ ] `/review` run
- [ ] Critical issues resolved
- [ ] Major issues resolved
- [ ] Ready for PR

---

## Decision & Notes Log

| Date | Event | Notes |
|------|-------|-------|
| {{DATE}} | Ticket initialised via `/plan` | — |
