# Agents: the context behind the web app

There is one agent for now: **Atlas**, the code agent (`web/src/data.js` → `PEOPLE.atlas`). Its folder holds everything it needs to work a ticket behind the web app, plus the evals that decide whether it succeeded.

```
agents/atlas/
  agent.json                  identity, model, prompt files, tool list, limits
  system-prompt/
    00-shared-context.md      Within product, status model, rules (loaded first)
    01-role.md                Atlas's scope, how it works, when to stop and ask
  tools/
    integrations.json         providers: base URL, auth env vars, scopes, status (placeholder | live)
    shared/*.json             report_progress, set_status, ask_human, post_message, attach_output, handoff  (backed by Tracker)
    code/*.json               search_code, read_file, edit_file, run_command, run_tests, list_env_vars, create_branch
    tracker/*.json            Within's own API: get/list/update tickets, read run, read messages
    github/*.json             open PR, get PR, review comments + replies, check runs, search issues
    figma/*.json              read file/nodes, export frames, read/post comments
    slack/*.json              surface highlights: post highlight, DM a person, daily digest, read thread
  input/<TICKET>.json         what Atlas receives when a ticket is assigned
  output/<TICKET>/
    run.json                  live run state the ticket view renders
    <artifact files>          files listed in run.json → outputs (type "file")
  evals/                      criteria of success + cases + runner (see evals/README.md)
```

## Contracts

**Tool file:** Anthropic tool format plus one flag.
```json
{ "name": "...", "description": "...", "input_schema": { "type": "object", ... }, "requires_approval": false }
```
If `requires_approval` is true, the runtime pauses the run, sets status `approval` and fills `run.approval` before the call executes.

Integration tools also carry `"placeholder": true` and an `api` block saying which endpoint they will call:
```json
"api": { "provider": "github", "method": "POST", "endpoint": "/repos/{owner}/{repo}/pulls" }
```
To make one live, implement the endpoint, set the provider's `status` to `"live"` in `integrations.json`, and remove `placeholder` from its tools.

**Input** (`input/<TICKET>.json`)
```
ticket        { id, title, team, priority, labels, description, acceptance_criteria[] }
assigned_by   human id from PEOPLE
assigned_at   ISO timestamp
context       { repo?, branch_base?, environments?, links[] }
messages[]    human messages on this ticket { from, t, text }
```

**Output** (`output/<TICKET>/run.json`): a superset of the ticket fields in `web/src/data.js`.
```
ticket_id, agent, status        status ∈ queued | progress | stuck | approval | review | done
steps[], step                   plan + 0-based index of the current step
now_doing                       one-line live summary (null when not running)
blocker?                        { title, detail, question, suggestions[] }   when stuck
approval?                       { action, reason, tool_call_id }             when approval
log[]                           { t, kind: start|step|error|approval|done, text }
trace[]                         { t, step, kind: thought|tool_call, ... }
                                tool_call → { id, tool, input, output | error }
outputs[]                       { type: branch|pr|file, label, path? }
chat[]                          { from: agent|user, t, kind?, text }
```

## Adding more agents later

Copy `atlas/`, then rewrite `agent.json`, `system-prompt/01-role.md`, `tools/code/` and the eval cases. Keep `system-prompt/00-shared-context.md` and `tools/shared/` the same across agents.
