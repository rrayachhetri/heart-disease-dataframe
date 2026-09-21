# CardioSense

**A free, open-source tool that helps people understand their heart disease risk — and connects them with a doctor who can actually help.**

> ⚠️ CardioSense is an educational project, not a certified medical device. It should never replace advice from a real doctor.

---

## What is this?

Heart disease is the leading cause of death worldwide, and a huge part of the problem is that most people never get a simple risk check until something has already gone wrong. CardioSense is a small step toward fixing that.

In a few minutes, anyone can:

- 📝 **Answer a short health questionnaire** (age, blood pressure, cholesterol, and a few other everyday clinical details — no lab visit required to get a first estimate).
- 📊 **Get an instant risk score**, explained in plain English — not just a number, but *which factors are pushing it up or down* and *how it compares* to real medical research data from thousands of patients.
- 🩺 **Find a doctor who takes their insurance** — searching both doctors registered on CardioSense and real physicians from the public U.S. National Provider Identifier registry — and **book an appointment directly**, without phone tag.

It's built to be transparent: the risk-scoring model, the explanations, and the doctor-matching logic are all open source, so nothing is a black box.

## Who it's for

- **Patients & the general public** — curious about their heart health and want a clear, judgment-free starting point.
- **Students & researchers** — a real, working example of an explainable ML model trained on published clinical datasets.
- **Developers** — a complete, realistic full-stack reference app (React + FastAPI + ML + auth + booking) worth learning from or extending.

## What's inside

| | |
|---|---|
| 🤖 **Risk prediction** | A machine learning model trained on 920 real patient records from four public clinical research studies, estimating heart disease risk from 13 everyday health measurements. |
| 💡 **Explainable results** | Every result shows exactly which factors mattered most for *that* prediction — no black-box scores. |
| 📈 **Population comparison** | See how your numbers compare to real research populations, not just an abstract "average." |
| 🔎 **Doctor search** | Find doctors who accept your insurance, sourced both from CardioSense's own directory and the live public NPI registry. |
| 📅 **Self-service booking** | Doctors publish their own open appointment times; patients book them directly — no back-and-forth. |
| 🔐 **Accounts & privacy** | Simple, secure sign-up for patients and doctors; your history is tied to your account, not shared publicly. |

## Try it / build on it

This repository contains the full source code:

- [`heart-disease/`](heart-disease/) — the application itself (backend API, ML model, and web app).
- [`heart-disease/README.md`](heart-disease/README.md) — full technical documentation: architecture, setup, API reference, and the ML model details.
- [`heart-disease/ui/README.md`](heart-disease/ui/README.md) — everything about running, testing, and developing the web frontend.

If you just want to run it locally, start with the Quick Start section in [`heart-disease/README.md`](heart-disease/README.md).

## Project values

- **Transparency over black boxes** — every risk score comes with a plain-language explanation.
- **Access over gatekeeping** — free to use, and designed to help people get to a real doctor faster, not replace one.
- **Open source** — the code, the model, and the methodology are all here to read, question, and improve.

---

*Not affiliated with any hospital, insurer, or health system. Educational and research use only.*
