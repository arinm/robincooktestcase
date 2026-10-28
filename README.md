# Task time tracker

A Vue 3 app for a Customer Success agent working through a restaurant's tasks. Switch tasks without losing notes,
track the time spent on each one, and send the task ID and elapsed seconds to the imaginary backend on completion.

## Run it

```sh
bun install
bun run dev
```

| Command                      | What it does                                                      |
| ---------------------------- | ----------------------------------------------------------------- |
| `bun run build`              | Type-check and build for production                               |
| `bun run test:e2e`           | Run Cypress e2e tests against the production preview on port 4173 |
| `bun run test:e2e:dev`       | Open Cypress against the dev server                               |
| `bun run test:component`     | Run Cypress component and parser tests                            |
| `bun run type-check:cypress` | Type-check the Cypress specs separately                           |
| `bun run lint`               | Lint and fix files                                                |

Run `bun run build` before `bun run test:e2e`, which serves the last production build.

## Planning

### Components and state

```text
App.vue
└── RouterView
    └── TasksView
        ├── TaskNav         task list
        ├── TaskTimer       time and progress
        └── KeepAlive
            └── TaskDetail  content and notes
```

- The open task is in the URL (`/tasks/:taskId`).
- Tasks and time live in Pinia, because all three areas read them.
- Notes stay local in `TaskDetail`, and `KeepAlive` keeps them between switches.

### Estimate

| Part              | Scope                                                           | Time    |
| ----------------- | --------------------------------------------------------------- | ------- |
| 1. Foundation     | Zod schema and types, API adapter, stores, routing, layout      | ~2h 30m |
| 2. UI             | Nav, timer, detail                                              | ~30m    |
| 3. Tests and docs | Cypress (switching, pause/resume, payload) ~30m, README ~1h 30m | ~2h     |

Total about 5h.

Times are actual, working with an AI coding assistant. It sped up the UI most and tests. The foundation took longest because that is where the decisions are: the time model, where state lives, validation at the boundary.

### Backend suggestions

- Most important is to send an ISO timestamp for the due date instead of `yesterday`, `today` or `tomorrow`: `"due_at": "2026-10-27T17:00:00+01:00"`.
- Store work sessions per task and agent, sent while the agent works, for example on every switch: `POST /tasks/{id}/time-entries` with `{ "agent_id": 7, "started_at": "2026-10-27T14:02:10+01:00", "ended_at": "2026-10-27T14:09:45+01:00" }`. This shows where the interruptions are, and the time isn't lost if the tab closes before completion.
- Return tracked time and completion status when loading tasks. A persisted Pinia store only helps in the same browser, so the server should be the source of truth.
- Count each completion only once. If a retry after a timeout sends it again, the server shouldn't store the time twice (an idempotent `PUT /tasks/{id}/completion`).

## States

Loading, empty, load error with retry, partial failure, unknown task, saving (button disabled), save error with retry, and completed (notes read-only).

## Decisions

- Elapsed time comes from timestamps, not a counter. A throttled background tab loses nothing, and tracking goes on while the tab is hidden, since the agent may be on a call in another window.
- Only the selected task runs. Switching pauses one task and resumes the other. Past the estimate the time keeps counting and the progress bar stops at 100%.
- Time freezes on completion. The payload is `{ task_id, time_spent_seconds }` in whole seconds, and a failed save retries with the same time.
- Tasks are validated with Zod at the API boundary. Invalid and duplicate ones are skipped and counted, a response that isn't a list fails the load.
- The provided backend stays unchanged, an adapter maps its fields. Two 500 ms delays, on load and on save, make those states visible and would go away with a real backend.

## Tests

E2E tests use `cy.clock()` / `cy.tick()` and a stub on `console.log` for the save payload, component tests stub `fetchTasks` for load states.

| Test                                         | Why                                              |
| -------------------------------------------- | ------------------------------------------------ |
| Switching keeps notes                        | Required: switch without losing input            |
| Pause and resume                             | Required: the timer pauses and resumes on switch |
| Counting starts on open, continues past plan | No time is lost or counted for the wrong task    |
| Completing sends the ID and time             | Optional requirement: checks the payload         |
| Failed save, then retry                      | The tracked time isn't lost                      |
| Load states and parser                       | The imaginary backend never produces these cases |

## Limitations and next steps

- State is in memory. Reloading resets timers, completion status and notes. The next step would be persistence, with an explicit rule for resuming a timer after a long absence and restoring completed tasks.
- The list loads once. A future background refresh would need to merge updates by ID while preserving tracked time and notes.
- Opened task details stay cached. This is sufficient for the small supplied list. A larger workload would need a cache limit and a separate place to retain unsaved notes.
- Pausing happens through task switching. There's no manual pause button. The UI is in English, and the task content remains in German as provided.

## The task

<details>
<summary>Original assignment</summary>

This is a base installation of Vue 3 with TypeScript and Cypress similar to our own development environment.

Your task is to develop an application/component to display the information stored in src/data/dummy.json.
This task is a simplified version of a component we have developed in the past.

The goal is to display the information for different tasks for a user.
There are several tasks that can be switched between and completed.
The time spent on each task should be tracked and displayed as well as sent to the imaginary backend.

### User Story

As a user, I am working in the Customer Success department and my job is it to make restaurants better. I have a system
that assigns me tasks that I need to complete. Because many of the tasks needs to be done while talking to the
restaurant on the phone, I need to be able to switch between multiple tasks of the same restaurant quickly without
losing data (like text inputs) in the hidden tasks. We want to be able to analyse afterward how much time we spent on each task
to optimize our processes and also for me that I can see how much time I spent on each task and know when I need to finish it.

### Planning Phase

After reading these requirements spent a few minutes to plan your approach.

- Create a simple diagram or list of the components you will need,
    how they will interact and how data gets passed and/or stored
- Plan the project and create an estimate of how long each part will take (No need to split it into more than two or three parts)
- Document any suggestions or requirements for the backend where you receive and store your data

### UI Requirements

We want a 3 part layout

1. The left hand side has a navigation where the user can switch between tasks.
2. The top shows a timer for the current task with time spent, time planned for the task, and a visual representation of the progress
3. A main content area that shows the task information and allows the user to mark the task as completed.

### Functionality Requirements

1. The user can switch between tasks at any time
2. The timer for a task pauses and resumes when switching between tasks
3. The user can mark a task as completed, which sends a message with the task id and time spent to the imaginary backend

### Technical Requirements

1. Code needs to explain itself. Comment where necessary but don't overdo it
2. Code readability is important. Use meaningful variable names and split your code into functions where it makes sense
3. Use the provided useImaginaryBackend to mock the backend calls
4. Use meaningful state management to hold you timer data. You can use pinia for that, but it is not required for this task.
5. Keep in mind what happens if the tab loses fokus. You can ignore data loss when the user closes the tab.
6. Write Cypress test(s) for your application and/or component(s)

- The test(s) should cover the functionality of switching between tasks
- The test(s) should cover the functionality of pausing and resuming the timer
- Optionally hook into your save call to the imaginary backend to validate the data that is sent

### No one is born a master

If you have any questions or need help, please ask us. We are a team, and we are here to help each other.

### Submitting your work

- Create a fork of this repository and push your work to it
- Prepare a small presentation of your work, explaining your approach and the challenges you faced

</details>
