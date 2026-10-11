# Contributing to DevKit

Thank you for your interest in contributing to DevKit! This project is built to deliver a minimal, reliable, keyboard-first CLI for professional developers.

---

## Development Setup

### Prerequisites
- Node.js LTS (`>= 20.0.0`)
- npm (`>= 10.0.0`)
- Git (`>= 2.0.0`)

### Local Setup
```bash
# 1. Clone repository
git clone https://github.com/your-username/devkit.git
cd devkit

# 2. Install dependencies
npm ci

# 3. Build project
npm run build

# 4. Link binary globally for local testing
npm link
```

Now `devkit` can be run from any directory using your local development build.

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Run DevKit directly from TypeScript source via `tsx` |
| `npm run build` | Compile TypeScript source to `dist/` |
| `npm test` | Run unit and integration tests via Vitest |
| `npm run test:watch` | Run tests in interactive watch mode |
| `npm run test:coverage` | Run tests and generate coverage report |
| `npm run typecheck` | Verify strict TypeScript types across codebase |
| `npm run lint` | Check ESLint rules across `src/` and `tests/` |
| `npm run lint:fix` | Automatically fix fixable ESLint issues |
| `npm run format` | Check Prettier formatting |
| `npm run format:fix` | Apply Prettier code formatting |
| `npm pack --dry-run` | Inspect packaged distribution contents |

---

## Architectural Guidelines

1. **Separation of Concerns**:
   - Keep UI rendering (`src/ui/`) distinct from core logic (`src/core/`) and commands (`src/commands/`).
   - All filesystem operations must pass through `FileSystemService`.
   - All process execution must pass through `ProcessRunner`.
2. **Security by Default**:
   - Never allow path traversal beyond project boundaries without explicit configuration.
   - Never log or expose secrets, API keys, or credentials.
   - Always validate external inputs using Zod schemas.
3. **Restrained Terminal UX**:
   - Avoid emojis, decorative ASCII banners, or noisy animations in non-interactive commands.
   - Respect `NO_COLOR` and `FORCE_COLOR` standards.
   - Ensure non-interactive commands exit cleanly with documented exit codes.

---

## Submitting Pull Requests

1. Create a feature branch: `git checkout -b feature/my-new-feature`.
2. Verify all quality checks pass before pushing:
   ```bash
   npm run typecheck
   npm run lint
   npm run format
   npm test
   npm run build
   ```
3. Commit with clear, descriptive commit messages.
4. Open a pull request against the `main` branch.
