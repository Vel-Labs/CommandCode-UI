# Models Reference For The GUI

Retrieved: 2026-06-06

Official source:

- https://commandcode.ai/docs/reference/cli/models

Local CLI evidence:

- `cmd --help` documents `-m, --model <model>` as "Run on a specific model this session".
- `cmd --help` documents `--list-models` as "List the models available for use".
- `cmd --help` documents `/model` as "Switch between Command Code models".
- `cmd --help` documents `/configure-models` as "Choose which model runs each built-in task".
- `cmd --list-models` returns a provider-grouped catalog and says users can pass the full id or the short name after the last slash.

This page records the model behavior the GUI is allowed to expose. It is not an upstream Command Code replacement.

## Current GUI Boundary

Implemented:

- The runtime model picker lists models from Command Code `--list-models`.
- The picker passes a selected value through the documented `--model` flag when a new session starts.
- Model favorites are local GUI presentation preferences only.
- Search filters documented model ids, short names, providers, and displayed descriptions from `--list-models` output.
- Active session labels use session-start metadata or transcript metadata, not the current global picker.
- Settings > Models separates single-session model selection from `/configure-models` task routing.

Not implemented:

- The GUI does not define model availability, aliases, pricing, context windows, or capability metadata.
- The GUI does not edit task routing config directly.
- The GUI does not infer routing tables from terminal output.
- The GUI does not claim image support for a text-only model without a configured vision adapter that produces visible text context first.
- The GUI does not expose a standalone model-listing command of its own; listing remains delegated to Command Code.

## Single-Session Model Selection

The GUI may pass the selected model to Command Code when starting a session:

```text
cmd --model <model>
```

The selected value is command input, not GUI semantics. Display labels and command values stay separate:

- command value: the exact model id or short name passed to `--model`
- session label: the model captured at session start or discovered from transcript metadata
- missing old metadata: `Default at start`

Changing the global picker must not relabel already-open sessions.

## Task Routing

Command Code owns built-in task routing. The documented interactive entry point is:

```text
/configure-models
```

The GUI may:

- expose a button or command palette action that sends `/configure-models`
- preview that `/configure-models` will open the Command Code helper
- explain that task routing is separate from single-session model selection

The GUI must not:

- write persistent task routing files until the config format and scope behavior are documented and tested
- infer compaction, title generation, or background-task assignments from arbitrary terminal output
- present a preview as an applied routing change

## Vision Adapter Routing

Preferred vision-model routing is future/plugin-owned in V1 unless Command Code exposes a documented adapter or routing contract.

If a future adapter converts images or screenshots into text context:

- the generated text context must be visible before it is sent to the coding model
- the UI must distinguish "model saw adapter text" from "model saw the image"
- adapter configuration must not imply native image support for a text-only model

## Validation Checklist

- `cmd --help` still documents `--model`, `--list-models`, `/model`, and `/configure-models`.
- `cmd --list-models` still returns model ids the GUI can parse without invented metadata.
- Starting a session with an explicit model captures that model in session metadata.
- Opening or resuming an old session without model metadata shows `Default at start`.
- Settings > Models remains read-only for persistent task routing until a scoped write contract exists.
