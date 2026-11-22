# Portfolio configuration

This directory is the single editable data boundary for a portfolio fork. The
application and build both validate these JSON files before deployment.

| File             | Configure                                                                    |
| ---------------- | ---------------------------------------------------------------------------- |
| `profile.json`   | Identity, social links, biography, navigation, certifications, and UI labels |
| `projects.json`  | Project cards, technology lists, and project links                           |
| `skills.json`    | Skill groups, icon keys, notes, and optional brand colours                   |
| `education.json` | Institutions, qualifications, achievements, and optional logos               |
| `site.json`      | Canonical URL, search metadata, social preview metadata, and structured data |

Keep the existing object shapes and edit values only. Unknown keys, blank required
text, invalid URLs, duplicate navigation targets, and unsupported icon keys fail
the local quality pipeline with the relevant file and field path.

After editing configuration, run:

```bash
npm run check
```

Brand assets are the only customization inputs outside this directory. They live
under `public/` because browsers and social platforms require stable public URLs;
see the root README for the favicon, profile photo, and social-cover workflow.
