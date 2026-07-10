---
name: release
description: Cut a CalVer release for khalido.org — roll up commits since the last tag into CHANGELOG.md, tag it, publish a GitHub release, confirm the Pages deploy. Human-in-the-loop; nothing publishes without approval.
---

# /release

Cut a release for **khalido/khalido.org**: summarize what shipped since the last tag, update the changelog, tag, publish a GitHub release, confirm the deploy went live.

The design (adapted from the everx release skill, simplified for a personal static blog):

- **CalVer with the day**: `vYYYY.MM.DD` (e.g. `v2026.07.09`). Same-day second release → append `.1`. No SemVer — no API consumers; the tag marks a *period*.
- **`CHANGELOG.md` (repo root) is the canonical record**; the GitHub release is derived from it (Keep a Changelog model). Roll `## [Unreleased]` into a dated `## [YYYY.MM.DD]` section with categories `Added` / `Changed` / `Fixed` / `Removed` ("Fixed" = behaviour was wrong; "Changed" = worked but now differs). Leave a fresh empty `## [Unreleased]`.
- **Site changes only, not content.** Blog posts, TILs, and link posts are the product, not the changelog — RSS covers them. A release with only content commits rolls them into one line ("N new posts"). New *sections* or *tools* count as Added.
- **Rollup is done inline** — commit volume is small; no subagent fan-out. But keep the everx fact-check habit: before a concrete claim (a path, a flag, a "now does X") lands in the changelog, verify it against the code as it is now, not against the commit title. Commit titles can be stale or inverted.
- **Human-in-the-loop.** Draft → show the user → only after approval commit the changelog, tag, and publish. Tag + GitHub release are outward-facing.

## Steps

### 1. Find the range
```bash
git fetch --tags --quiet
git describe --tags --abbrev=0 2>/dev/null   # last tag; empty = first release ever
git status --short                            # warn if uncommitted changes would be left out
```
Range is `<last-tag>..HEAD`. First-ever release: everything since `CHANGELOG.md` was introduced — don't backfill older history, the changelog header already points at git log for that.

### 2. Gather input
```bash
git log <last-tag>..HEAD --format='%h %ci%n%s%n%b%n---'   # full messages, subject + body
git diff --stat <last-tag>..HEAD                          # structural hint
```
Full bodies in, never raw diffs. Separate content commits (posts under `src/content/`) from site commits — content gets one rolled-up line at most.

### 3. Draft
Update `CHANGELOG.md`: roll `[Unreleased]` into `## [YYYY.MM.DD] - YYYY-MM-DD`, add anything in the range the Unreleased section missed, account for every site commit (promote or roll up — drop nothing silently). Update the link footer: `[Unreleased]` compare link → `vNEW...HEAD`, add `[YYYY.MM.DD]` compare link (first release: link the tag itself).

Draft GitHub release notes from the changelog entry — same facts, friendlier shape:
```markdown
<1–2 line summary>

**Highlights**
- <the interesting stuff, one line each>

**Also**
- <everything else, one rolled-up line>
```
Voice: direct, declarative, no filler. Verify concrete claims against the code before they land.

### 4. Show the user — approval gate
Print the proposed tag, the new changelog section, and the release notes. **Stop. Get explicit approval.** Edit if asked.

### 5. Commit, tag, publish (only after approval)
```bash
git add CHANGELOG.md && git commit -m "docs: changelog for vYYYY.MM.DD"
git tag -a vYYYY.MM.DD -m "Release vYYYY.MM.DD"
git push origin main --follow-tags
gh release create vYYYY.MM.DD --title "vYYYY.MM.DD — <short theme>" --verify-tag --notes-file - <<'NOTES'
<the approved notes>
NOTES
```

### 6. Confirm the deploy (inline, a few commands)
The push triggers the Pages deploy (`.github/workflows/deploy.yml`).
```bash
gh run list --workflow=deploy.yml -L1        # wait for it to go green (gh run watch <id>)
curl -sS -o /dev/null -w "%{http_code}\n" https://khalido.org/   # want 200
```
Report the result at wrap-up so "released" means "confirmed live."
