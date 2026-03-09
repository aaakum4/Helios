<div align="center">
     <img src="public/icon.png" alt="Helios logo" width="256">
     <h1>Helios</h1>
     <p>The control room organising your future.</p>
     </div>
     <br>
     <img width="1423" height="970" alt="Screenshot 2026-03-03 at 6 50 02 pm" src="https://github.com/user-attachments/assets/49e456fd-c738-41aa-8d2d-3bb5872252ee" />
</div>

---

An app designed to help students, or anyone who needs help with management or organisation by having all the useful apps and features in one place.

### Background
In my final year of school, juggling assessments, homework, deadlines, and study time has made it clear how disjointed existing tools are. Across my years I have tried Todoist, Notion, Timetable, YTP, and many other but I think that the biggest problem was that any one of these app's couldn't do it all. This is where I am trying to step up, my project is an attempt to build the app I wish I’d had, a central control room for managing school life, with features like assessment tracking, task management, calendars, study timers, and structured note-taking. While student-focused, the system is designed to be extensible for anyone who wants better control over their time and responsibilities.

---

> [!NOTE]
> Helios is in an early beta stage. If you encounter any issues and something you think should be added/changed, please report them too [our issue tracker](https://github.com/aaakum4/Helios/issues/new).

## Access

Demo
Live App: [https://helios-sigma.vercel.app/](https://helios-app-ui.vercel.app/)

## Roadmap

Before the first stable release, I would like the following features to be implemented:

- [x] An app logo
- [x] An easy to use UI
- [x] Creation of timetables
- [x] To-do list
- [x] All other nodes functional and operational
- [x] User friendly
- [x] Nodes work with each other
- [ ] ...

## Known Limitations

- No account system yet
- Data stored locally in browser
- Some features may reset

## Prerequisites

None — just:
- A modern browser (Chrome, Edge, Safari, Firefox)
- Internet connection

That’s it.

## Priority Email Reminders (Desktop)

Priority timetable reminders use SMTP from the Electron main process.
Set these variables in `.env` for email delivery:

- `SMTP_HOST`
- `SMTP_PORT` (for example `587`)
- `SMTP_SECURE` (`true` for SSL, usually `false` for STARTTLS on 587)
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM` (sender address)

Without SMTP config, the priority reminder UI still works, but emails are not sent.

## Using Helios

Please refer to the [Getting Started]() tutorial.
NONE YET!

## Licensing
All files, unless otherwise stated, are licensed under the Lesser GPL v3.0 or later. A copy of the license can be found in the `LICENSE` file.

All assets which contain [Helios brand images]() are property of the Helios organisation and may not be used without permission.
