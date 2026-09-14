# Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Vue blog frontend UI and page layout without changing existing business logic.

**Architecture:** Treat the redesign as a presentation-layer change. Keep existing stores, services, routes, query parsing, form handlers, and editor behavior intact while updating tokens, CSS, page composition, and reusable component surfaces.

**Tech Stack:** Vue 3, Pinia, Vue Router, Vite, Vitest, Less.

---

### Task 1: Design Tokens And Global Shell

**Files:**
- Modify: `src/assets/base.css`
- Modify: `src/App.vue`
- Modify: `src/components/navigation/TopHeaderLayout.vue`
- Modify: `src/components/navigation/TopNavigation.vue`
- Modify: `src/components/navigation/MobileTopTabs.vue`
- Modify: `src/components/navigation/TopBrand.vue`
- Modify: `src/components/navigation/TopFooter.vue`

- [x] Add Sora + IBM Plex Sans + JetBrains Mono font pairing.
- [x] Replace the old blue-heavy and warm content palette with graphite, signal cyan, emerald, amber, and magenta tokens.
- [x] Reduce radius tokens to 6px/8px and remove large floating-glass navigation shell styling.
- [x] Update desktop and mobile navigation to use the new signal-console surface.

### Task 2: Home And Core Pages

**Files:**
- Create: `src/assets/signal-lab-hero.png`
- Modify: `src/views/HomeView.vue`
- Modify: `src/views/ArticleListView.vue`
- Modify: `src/views/AboutView.vue`
- Modify: `src/views/LoginView.vue`
- Modify: `src/views/RegisterView.vue`
- Modify: `src/views/ProfileArticlesView.vue`
- Modify: `src/views/Search.vue`

- [x] Use the signal-lab bitmap hero asset on the homepage while preserving `usePostsStore`.
- [x] Redesign the article list header, list shell, and filter surface without changing filtering or pagination.
- [x] Redesign profile, auth, profile-articles, and search surfaces without changing handlers or service calls.

### Task 3: Shared Component Cleanup

**Files:**
- Modify: `src/components/Article.vue`
- Modify: `src/components/comment/CommentSection.vue`
- Modify: `src/components/search/TopSearchBox.vue`
- Modify: `src/components/search/MobileSearchSheet.vue`
- Modify: `src/components/search/SearchDropdownContent.vue`
- Modify: `src/components/post/ArticleFilters.vue`
- Modify: `src/components/post/PostCard.vue`
- Modify: `src/components/post/FeaturedHero.vue`
- Modify: `src/components/post/EditorToolbar.vue`
- Modify: `src/components/post/StatusBar.vue`
- Modify: `src/components/ui/DropdownSelect.vue`
- Modify: `src/components/ui/DatePickerInput.vue`

- [x] Remove radial/orb background patterns from shared components.
- [x] Normalize explicit `letter-spacing` to `0`.
- [x] Replace visible oversized pill/card radii with radius tokens.
- [x] Keep existing props, emits, data flow, and methods unchanged.

### Task 4: Verification

**Files:**
- Inspect: current worktree

- [x] Run `npm run test:run`. (29 files / 93 tests passed)
- [x] Run `npm run type-check`. (passed)
- [x] Run `npm run lint`. (passed)
- [x] Run `npm run build`. (built in 5.52s)
- [x] Run source scans for old visual patterns. (0 `radial-gradient(circle …)`, 0 non-zero `letter-spacing`)
- [x] Inspect the rendered app in browser at desktop and mobile sizes. (home, article-list, about, login, register, write, search — light + dark, desktop + mobile; no overlap/cropping/unreadable text)
