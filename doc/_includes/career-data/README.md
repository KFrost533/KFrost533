# Career Data Source for myself

`work-experiences.json` is the single source of truth for career history used by both:
- `doc/Career_JP.md`
- `doc/Career_EN.md`

`learning-technologies.json` is the source for the "learning technologies" table in:
- `_includes/career/technology-totals-jp.md`
- `_includes/career/technology-totals-en.md`

`future-learning-plan.json` is the source for the learning plan tables in:
- `_includes/career/learning-plan-jp.md`
- `_includes/career/learning-plan-en.md`

`future-work-roadmap.json` is the source for the period-based career roadmap tables in:
- `_includes/career/future-work-roadmap-jp.html`
- `_includes/career/future-work-roadmap-en.html`

`language-skills.json` is the source for language skill tables in:
- `_includes/career/language-skills-jp.md`
- `_includes/career/language-skills-en.md`

`certifications.json` is the source for certification tables in:
- `_includes/career/certifications-jp.html`
- `_includes/career/certifications-en.html`

`personal-projects.json` is the source for personal project tables in:
- `_includes/career/personal-projects-jp.html`
- `_includes/career/personal-projects-en.html`

`career-summary.json` is the source for career summary tables in:
- `_includes/career/career-summary-jp.html`
- `_includes/career/career-summary-en.html`

## Browser Editor
`editor.html` provides a table-based UI to update/add rows for each `career-data` JSON.

1. Start editor from repository root.

```bash
npm run career:editor
```

2. Browser opens `http://localhost:8090/editor.html` automatically.
3. Click `career-data フォルダを開く` and select `doc/career-data`.
4. Select a dataset, edit rows, then click `更新` or `全体保存`.
5. Click `+ 追加` to append a new row.
6. Run `npm run career:update` after saving JSON to regenerate include files.
7. If you do not want to commit raw data JSON, click `.local.json を作成`.

Input rules in the editor:
- `stringArray` columns: one item per line.
- `JSON` columns: valid JSON only.
- `work-experiences` and `certifications` are displayed in flattened table form, then converted back to their original JSON schema on save.

## Local-Only Data (Not Committed)
Generator now prefers `*.local.json` over `*.json` when local files exist.

Examples:
- `work-experiences.local.json`
- `career-summary.local.json`

These local files are ignored by git via `doc/career-data/.gitignore`.

Recommended workflow:
1. Create `.local.json` from editor button once per dataset.
2. Edit local files via editor.
3. Run `npm run career:update` to regenerate publishable include files.
4. Commit generated includes/pages only when needed.

## How To Add A New Experience
1. Copy `work-experience-template.json`.
2. Append the new object to `work-experiences.json`.
3. Set `isCurrent`:
   - Current role: `isCurrent: true`, `endYm: null`
   - Finished role: `isCurrent: false`, `endYm: "YYYY-MM"`
4. Keep exactly one `isCurrent: true` (latest role only).
5. For each technology, set duration as numbers:

```json
{ "name": "Python", "years": 2, "months": 3 }
```

Optional fields:

```json
{
   "name": "QuickSight",
   "years": 0,
   "months": 6,
   "learning": true,
   "certifications": ["AWS Certified Solutions Architect - Associate"]
}
```

6. Use the same technology name if you want total duration to be merged automatically.
7. Run:

```bash
npm run career:update
```

## How To Manage Learning Technologies
1. Edit `learning-technologies.json`.
2. Add entries with JP/EN display names and duration:

```json
{ "jpName": "Kubernetes", "enName": "Kubernetes", "years": 0, "months": 2 }
```

3. Optional certifications:

```json
{
   "jpName": "AWS",
   "enName": "AWS",
   "years": 0,
   "months": 6,
   "certifications": ["AWS Certified Solutions Architect - Associate"]
}
```

4. Run `npm run career:update` to refresh generated tables.

## How To Manage Future Learning Plan
1. Edit `future-learning-plan.json`.
2. Add plan items with JP/EN fields for priority, domain, technologies, timeline, and purpose.
3. Run `npm run career:update` to regenerate learning plan include files.

## How To Manage Future Work Roadmap
1. Edit `future-work-roadmap.json`.
2. Add roadmap items with JP/EN fields for period, objective, initiatives, and success metrics.
3. Run `npm run career:update` to regenerate roadmap include files.

## How To Manage Language Skills
1. Edit `language-skills.json`.
2. Add JP/EN values for language name, level, experience, and usage.
3. Run `npm run career:update` to regenerate language skill include files.

## How To Manage Certifications
1. Edit `certifications.json`.
2. Add groups with JP/EN category labels and certification items.
3. For each item, set JP/EN values for obtained date/score and usage.
4. Run `npm run career:update` to regenerate certification include files.

## How To Manage Personal Projects
1. Edit `personal-projects.json`.
2. Add JP/EN values for name, period, technologies, achievements, and progress.
3. Optionally set `linkUrl` and JP/EN link labels.
4. Run `npm run career:update` to regenerate personal project include files.

## How To Manage Career Summary
1. Edit `career-summary.json`.
2. Add JP/EN labels and values for each summary row.
3. Use `listJp` / `listEn` when you need bullet-like lines under a row.
4. Run `npm run career:update` to regenerate career summary include files.

## Notes
- The script auto-calculates total experience months from the earliest `startYm` to current month.
- The latest role duration is auto-updated when `isCurrent: true`.
- Technology totals are auto-summed across all experiences and output to JP/EN include files.
- Rating rule in totals table:
   - `learning=true` => `⭐`
   - `total >= 3 years` => `⭐⭐⭐⭐`
   - `total >= 2 years` => `⭐⭐⭐`
   - `total >= 1 year` => `⭐⭐`
   - otherwise => `⭐`
- Certification notes are shown in totals table when `certifications` is set.
- Skill years are not auto-updated by design and should remain manual.
