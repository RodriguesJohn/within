# Evals

These check whether Atlas succeeds by the brief's terms: it does the work, and a human can always see what it's doing, how far along it is, where it's stuck, and how to step in.

```
evals/
  criteria.md        the success criteria (A observability, B behaviour, C outcome), each with an id
  cases/<TICKET>.json one case per input: the scenario (faults to inject) + what should happen
  run_evals.py       automatic checks on output/<TICKET>/run.json
  judge-prompt.md    rubric for the criteria code can't check (B9, C1, C3)
  results/latest.json last run
```

## Run

```bash
python3 agents/atlas/evals/run_evals.py           # all cases
python3 agents/atlas/evals/run_evals.py WIT-142   # one case
```

Results show as ✓ pass, ✗ fail, ! warn, … pending. A **pending** result means the run hasn't reached the point where that check applies yet. It only becomes a fail once the run reaches `review` or `done` without meeting it. The script exits 1 if any check fails.

## Add a case

1. Add `input/<TICKET>.json` (the assignment).
2. Add `cases/<TICKET>.json`, giving the scenario and the expected results: `final_status`, `must_call`, `outputs_include`, and optionally `ask_human`, `forbidden_in_edits` and `run_tests_min_repeat`.
3. Run the agent so it writes `output/<TICKET>/run.json`, then run the evals.
