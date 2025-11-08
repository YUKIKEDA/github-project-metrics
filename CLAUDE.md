# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a GitHub Action that fetches GitHub Issues and Projects (v2) data to measure team productivity. It generates comprehensive metrics including issue statistics, project field values, and statistical analysis. The action outputs JSON files (`issues.json` and `statistics.json`) and can deploy documentation to GitHub Pages using Docusaurus.

**Primary Language**: JavaScript (with JSDoc type annotations using TypeScript type definitions)
**Runtime**: Node.js 20 (GitHub Actions environment)
**Documentation**: Hosted at GitHub Pages (Docusaurus site in `docs/` directory)

## Development Commands

### Build
```bash
npm run build
```
- Bundles the action using Rollup
- Input: `src/index.js`
- Output: `dist/index.js` (ES module format with sourcemap)
- Uses `@rollup/plugin-commonjs` and `@rollup/plugin-node-resolve`

### Testing
There are no automated tests configured (`npm test` exits with error). Manual testing is done by running the action in a workflow.

### Documentation
Documentation is in the `docs/` directory (Docusaurus):
```bash
cd docs
npm ci                # Install dependencies
npm run build         # Build static site
npm start             # Development server
```

## Architecture

### Data Flow

1. **Entry Point** (`src/index.js`):
   - Reads action inputs (github-token, project-scope, organization-name, output-path, debug-json)
   - Orchestrates Issue and Project data fetching
   - Performs statistical analysis
   - Saves JSON outputs and GitHub Actions Summary

2. **Issues Module** (`src/issues.js`):
   - Fetches all issues (including PRs) via REST API with pagination
   - Retrieves issue events for each issue (timeline data)
   - Merges Project information into each issue

3. **Projects Module** (`src/projects.js`):
   - Fetches Projects v2 data via GraphQL
   - Delegates to `projectUtils.js` for actual fetching logic
   - Formats project data including custom field values

4. **Project Utils** (`src/projectUtils.js`):
   - Contains `fetchAllProjects()` and `getAllProjectItems()`
   - Handles GraphQL pagination for projects and project items
   - Supports both user-level and organization-level project scopes
   - Uses GraphQL fragments from `fragments.js`

5. **Fragments Module** (`src/fragments.js`):
   - Defines reusable GraphQL fragments for Projects v2 queries
   - Includes fragments for items, field values, and project metadata

6. **Statistics Module** (`src/statistics.js`):
   - Performs statistical analysis on issue metrics (lead time, cycle time, review time, complexity, comments, assignees)
   - Calculates descriptive statistics (mean, median, std dev, percentiles, skewness, kurtosis)
   - Detects anomalies using IQR and Z-score methods
   - Analyzes correlations between metrics

7. **IO Module** (`src/io.js`):
   - Handles file I/O operations
   - Writes JSON files to the specified output directory
   - Generates GitHub Actions Summary markdown
   - Creates summary tables for issues and statistics

### Type System

**Type Definitions** (`src/types.d.ts`):
- Global type declarations for TypeScript-checked JavaScript
- Core types: `Issue`, `Project`, `ProjectItem`, `ProjectFieldValue`, `IssueEvent`
- Statistical types: `StatisticalAnalysisResults`, `DescriptiveStatsResult`, `OutlierInfo`, `CorrelationResult`
- Referenced in JS files via `/// <reference path="./types.d.ts" />`
- All `.js` files use `//@ts-check` for type checking

### Key Data Structures

**Issue Object**:
- Contains REST API issue data (number, title, state, dates, user, assignees, labels, milestone, comments)
- Includes `events` array (timeline of issue changes)
- Includes `projects` array (Project information this issue belongs to)
- Project data embedded within each issue includes custom field values

**Project Object**:
- Contains GraphQL Projects v2 data (id, title, number, url, dates)
- Includes `items` array (issues/PRs/draft issues in the project)
- Each item has `fieldValues` array (custom field values like Status, Iteration, Estimation)

**ProjectFieldValue**:
- Supports multiple field types: SingleSelect, Text, Number, Date, Iteration, Milestone, User
- Field value stored in appropriate property (`value`, `iteration`, `milestone`, `users`)

### GraphQL vs REST API Usage

- **REST API**: Used for fetching issues and issue events (`octokit.rest.issues.*`)
- **GraphQL API**: Used for fetching Projects v2 data (`octokit.graphql()`)
- Projects v2 only support GraphQL (not REST)

## Action Inputs

- `github-token` (required): GitHub token with repo read permissions
- `project-scope` (required): "user" or "organization"
- `organization-name` (optional): Required when project-scope is "organization"
- `output-path` (optional): Output directory for JSON files (default: GITHUB_WORKSPACE)
- `debug-json` (optional): Enable detailed logging and JSON output (default: false)

## Action Outputs

**Files Generated**:
- `issues.json`: All issues with embedded project information and events
- `statistics.json`: Statistical analysis results

**GitHub Actions Summary**: Markdown summary written to `GITHUB_STEP_SUMMARY`

## Common Development Patterns

### Adding New Metrics to Statistical Analysis
1. Add metric extraction logic in `statistics.js` (see `extractMetrics()`)
2. Update the `StatisticalAnalysisResults` type in `src/types.d.ts`
3. Add metric to correlation analysis in `analyzeCorrelations()`
4. Update summary generation in `generateAnalysisSummary()`

### Adding New Project Field Types
1. Update GraphQL fragment in `src/fragments.js` to query the field
2. Update field value mapping in `src/projects.js` (see fieldValues.nodes.map())
3. Add type definition to `ProjectFieldValue` in `src/types.d.ts`

### Handling Pagination
- REST API pagination: Use while loop with `page` incrementing (see `src/issues.js`)
- GraphQL pagination: Use cursor-based pagination with `after` and `hasNextPage` (see `src/projectUtils.js`)

## GitHub Pages Deployment

The workflow `.github/workflows/docs-pages.yml`:
1. Runs this action to generate metrics data
2. Copies `issues.json` and `statistics.json` to `docs/static/data/`
3. Builds Docusaurus site
4. Deploys to GitHub Pages

The documentation site can consume the generated JSON files to display interactive dashboards.

## Important Notes

- All source files use JSDoc type annotations with TypeScript definitions
- The `dist/` directory is committed to the repository (required for GitHub Actions)
- Always run `npm run build` after modifying source files
- The action uses `@actions/core` and `@actions/github` packages for GitHub Actions integration
- GraphQL queries use fragments to keep code DRY
- Statistical analysis is optional and failures don't stop the action (warnings only)
