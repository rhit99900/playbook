# UI Architecture & Formatting Recommendations

This note captures ideas for refining the current frontend structure without changing runtime behaviour yet. Use it as a checklist when you’re ready for a dedicated cleanup sprint.

---

## 1. Component Slicing & Folder Structure

1. **Feature-first directories**  
   - `components/application/indexed-files-list.tsx` now hosts embed form, list, pagination, and destructive actions. Split into:
     - `features/files/EmbedForm`
     - `features/files/FileRow` (pure presentation, no network hooks)
     - `features/files/FileBulkActions`
     - A `features/files/hooks.ts` file for shared state (fetching, selection, pagination).
   - Mirror that approach for `/admin/users`, prompt input, system stats, etc., so all business logic for a feature lives alongside its UI.

2. **Shared primitives**  
   - Promote repeated UX fragments (confirmation modals, destructive banners, empty states) into `components/common/`.
   - Example: replace inline `window.confirm` calls with a `<ConfirmDialog>` using Radix UI’s `AlertDialog`.

## 2. UI Standardisation

1. **Design tokens**  
   - Centralise colors, radius, spacing in `tailwind.config.cjs` or a `theme.ts`. Use semantic names (`--color-border-muted`) so swapping themes is trivial.
2. **Typography & spacing scale**  
   - Define a `Text` and `Heading` component that map `variant` → `className`. Many screens repeat `text-xs uppercase` combos that could live in a single place.
3. **Table/List patterns**  
   - Create an opinionated `DataList` abstraction combining checkbox column, metadata, and action menu. `IndexedFilesList`, `Users`, etc., can plug into it with render props.
4. **Feedback states**  
   - Standardise success/error banners (`<InlineAlert type="error" message="…">`). Right now errors are plain `<p>` tags with loose styling.

## 3. State & Networking

1. **React Query (TanStack)**  
   - Migrate imperative fetches (`fetchFiles`) to `useQuery` for caching, refetching, and background updates. Bulk deletion can then invalidate the `files` query instead of manual refresh logic.
2. **Custom hooks**  
   - `useAuthGate()` inside `PromptInput`/`FilesList` would reduce repeated `useEffect` blocks that check `session` then redirect.
3. **EventSource management**  
   - Wrap SSE logic in a hook (`useResponderStream`) that returns `start`, `stop`, `state`. `PromptInput` then only handles UI, and the hook can easily accept parameters for formatting.

## 4. Testing & Storybook

1. **Storybook**  
   - Add stories for the new primitives (FileRow, PromptResponse, ConfirmDialog). This encourages visual regression testing and documentation.
2. **Playwright smoke tests**  
   - Cover flows such as “Embed file”, “Bulk delete”, “Prompt streaming” to ensure future refactors don’t break critical paths.

## 5. Backend/Frontend Interface

1. **Typed client**  
   - Generate API bindings via `zodios` or `ts-rest` to keep controllers + client definitions in sync. Ensures `/stats`, `/files/index`, `/files/delete` all share the same zod schema.
2. **Error envelope**  
   - Standardise backend responses (`{ success, data, error }`). Frontend can then map error codes to toast messages.

---

### Implementation Order (suggested)
1. Introduce React Query + `useAuthGate`.
2. Refactor Files feature into feature-first folder (Embed form / List / Row / Bulk toolbar).
3. Build shared primitives (ConfirmDialog, InlineAlert, DataList).
4. Add Storybook stories + component tests.

This sequence keeps behavioural changes minimal at each step while progressively improving maintainability and presentation.
