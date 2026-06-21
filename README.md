# SkillSignal — 3D Job Market Visualizer

SkillSignal is a Three.js data visualization project built around a career-transition story: job-market data is loaded, transformed into structured skill-demand signals, and displayed as an interactive 3D chart.

## What it shows

- JavaScript data transformation
- Three.js 3D rendering
- JSON data modeling
- Skill-frequency counting
- DOM interaction through a side panel
- Hover and click interaction with 3D objects
- A clear path from static data to API-backed data

## Current version

Version 1 uses a local static dataset:

```txt
data/jobsData.json
```

Each job record includes:

```json
{
  "title": "Junior Web Developer",
  "company": "Example Company",
  "location": "Remote",
  "level": "junior",
  "category": "Web Development",
  "salaryMin": 55000,
  "salaryMax": 72000,
  "skills": ["JavaScript", "HTML", "CSS", "GitHub"]
}
```

The app transforms the data into skill demand objects:

```js
[
  { skill: "JavaScript", count: 10 },
  { skill: "Python", count: 9 },
  { skill: "SQL", count: 8 }
]
```

Then each skill becomes a 3D bar.

## How to run locally

Because the app uses `fetch()` to load `jobsData.json`, open it through a local server instead of double-clicking `index.html`.

### Option 1: Python

```bash
cd skillsignal-threejs
python -m http.server 5173
```

Then open:

```txt
http://localhost:5173
```

### Option 2: VS Code Live Server

Open the folder in VS Code, right-click `index.html`, and choose **Open with Live Server**.

## Project structure

```txt
skillsignal-threejs/
├── data/
│   └── jobsData.json
├── src/
│   └── app.js
├── index.html
├── styles.css
└── README.md
```

## Data flow

```txt
jobsData.json
   ↓
fetch local JSON
   ↓
normalize job records
   ↓
count skill frequency
   ↓
calculate remote/junior/salary signals
   ↓
render 3D bars in Three.js
   ↓
click bar → update side panel
```

## Good next features

1. Add filters for remote, hybrid, onsite, junior, and mid-level roles.
2. Add category colors for web development, data engineering, analytics, and cloud.
3. Add a second view for salary ranges.
4. Add a real API or scraped/exported CSV pipeline later.
5. Add a screenshot and short demo GIF for the portfolio README.

## Portfolio description

SkillSignal is a Three.js data visualization project that models job-market-style data, transforms raw job records into skill-frequency signals, and renders demand patterns as an interactive 3D chart. The project demonstrates JavaScript, JSON handling, data transformation, DOM interaction, visual design, and data engineering thinking.
