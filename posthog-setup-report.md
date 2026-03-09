<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into **Helios**, an Electron-based productivity desktop app. The integration uses `posthog-node` (v5.26.2) in the Electron main process as the analytics backend, with a secure IPC bridge exposing event capture to the React renderer — keeping the API key safely server-side and never exposed to the browser context.

A stable per-installation anonymous distinct ID is generated on first launch and persisted to the user's app data directory, ensuring consistent user identity across sessions without requiring an account.

Five additional tracking gaps were closed in this session, adding new event captures across the Timetable, Todo, and Settings components.

## Files changed

| File | Changes |
|------|---------|
| `electron/main.js` | Initialized PostHog client from env vars; stable distinct ID generation via `initDistinctId()`; IPC handlers for `posthog:capture` and `posthog:get-distinct-id`; `app_launched` event on ready; graceful `shutdown()` on quit; `uncaughtException` / `unhandledRejection` error capture |
| `electron/preload.js` | Exposed `window.posthog.capture()` and `window.posthog.getDistinctId()` to renderer via `contextBridge` |
| `src/components/StartupScreen.jsx` | `app_launched` event when user clicks to launch the app |
| `src/apps/nodes/Pomodoro.jsx` | `pomodoro_session_started`, `pomodoro_session_paused`, `pomodoro_session_reset`, `pomodoro_session_completed`, `pomodoro_subject_added` |
| `src/apps/nodes/FocusTracker.jsx` | `focus_tracker_session_started`, `focus_tracker_session_stopped`, `focus_tracker_subject_created`, `focus_tracker_subject_deleted` |
| `src/apps/nodes/Todo.jsx` | `todo_added`, `todo_completed`, **`todo_subheading_added`**, **`todo_subheading_deleted`** |
| `src/apps/nodes/Reflection.jsx` | `reflection_submitted`, `journal_entry_saved` |
| `src/apps/nodes/Timetable.jsx` | `timetable_block_created`, `timetable_block_deleted`, **`timetable_block_edited`**, **`timetable_blocks_synced`** |
| `src/components/MainScreen/Settings/SettingsModal.jsx` | `settings_theme_changed`, `settings_palette_changed`, `settings_reset_tutorials`, **`settings_glow_changed`** |
| `.env` | `POSTHOG_API_KEY` and `POSTHOG_HOST` confirmed and updated |

## Events instrumented

| Event | Description | File |
|-------|-------------|------|
| `app_launched` | App window opened (also captured at OS level in main process) | `electron/main.js`, `src/components/StartupScreen.jsx` |
| `pomodoro_session_started` | User started or resumed a Pomodoro work/break session | `src/apps/nodes/Pomodoro.jsx` |
| `pomodoro_session_completed` | A Pomodoro work session timer reached zero | `src/apps/nodes/Pomodoro.jsx` |
| `pomodoro_session_paused` | User paused an active Pomodoro session | `src/apps/nodes/Pomodoro.jsx` |
| `pomodoro_session_reset` | User reset the Pomodoro timer | `src/apps/nodes/Pomodoro.jsx` |
| `pomodoro_subject_added` | User added a new Pomodoro subject | `src/apps/nodes/Pomodoro.jsx` |
| `focus_tracker_session_started` | User started a manual focus tracking session | `src/apps/nodes/FocusTracker.jsx` |
| `focus_tracker_session_stopped` | User stopped a manual focus tracking session | `src/apps/nodes/FocusTracker.jsx` |
| `focus_tracker_subject_created` | User created a new focus tracking subject | `src/apps/nodes/FocusTracker.jsx` |
| `focus_tracker_subject_deleted` | User deleted a focus tracking subject | `src/apps/nodes/FocusTracker.jsx` |
| `todo_added` | User added a new todo item | `src/apps/nodes/Todo.jsx` |
| `todo_completed` | User marked a todo as completed | `src/apps/nodes/Todo.jsx` |
| `todo_subheading_added` | User created a new todo list category/subheading | `src/apps/nodes/Todo.jsx` |
| `todo_subheading_deleted` | User deleted a todo list category (captures todo count inside it) | `src/apps/nodes/Todo.jsx` |
| `reflection_submitted` | User submitted daily reflection answers | `src/apps/nodes/Reflection.jsx` |
| `journal_entry_saved` | User saved or edited a journal entry | `src/apps/nodes/Reflection.jsx` |
| `timetable_block_created` | User created a new timetable block | `src/apps/nodes/Timetable.jsx` |
| `timetable_block_edited` | User saved edits to an existing timetable block | `src/apps/nodes/Timetable.jsx` |
| `timetable_block_deleted` | User deleted a timetable block | `src/apps/nodes/Timetable.jsx` |
| `timetable_blocks_synced` | User copied blocks from one rotation period to another | `src/apps/nodes/Timetable.jsx` |
| `settings_theme_changed` | User changed the app theme (light/dark/system) | `src/components/MainScreen/Settings/SettingsModal.jsx` |
| `settings_palette_changed` | User changed the color palette | `src/components/MainScreen/Settings/SettingsModal.jsx` |
| `settings_glow_changed` | User changed the window glow color | `src/components/MainScreen/Settings/SettingsModal.jsx` |
| `settings_reset_tutorials` | User reset all tutorial states | `src/components/MainScreen/Settings/SettingsModal.jsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- 📊 **Dashboard: Analytics basics** — https://us.posthog.com/project/329489/dashboard/1342823

  - 📈 [Daily Focus Activity (Pomodoro & Focus Tracker)](https://us.posthog.com/project/329489/insights/6xTYKQgM) — Day-by-day line chart of completed Pomodoro sessions and stopped Focus Tracker sessions
  - 🔽 [Pomodoro Session Completion Funnel](https://us.posthog.com/project/329489/insights/knkVbEGI) — Conversion funnel: App Launched → Started Pomodoro → Completed Pomodoro
  - 📊 [Content Creation Overview (Todos, Reflections, Journal)](https://us.posthog.com/project/329489/insights/vKyj61Lw) — Weekly bar chart of todos, reflections, and journal entries
  - 🎨 [Settings Customization Activity](https://us.posthog.com/project/329489/insights/9F49VPUY) — Theme, palette, and glow color change frequency
  - 🗓️ [Timetable Block Lifecycle (Create / Edit / Sync / Delete)](https://us.posthog.com/project/329489/insights/nl5DbNQf) — Weekly breakdown of all timetable operations

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/posthog-integration-javascript_node/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
