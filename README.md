# DevKit

> Production-ready, keyboard-first interactive developer CLI and workspace toolkit.

DevKit is a fast, restrained, and modular command-line tool designed for daily software engineering workflows. Built with TypeScript, Node.js LTS, React, and Ink, it provides both an interactive terminal command palette and non-interactive scripted subcommands.

---

## Key Highlights

- **Dual Interaction Modes**:
  - **Mode A (Interactive Palette)**: Running `devkit` opens a compact, searchable command center with arrow navigation and contextual action details.
  - **Mode B (Direct Subcommands)**: Fast, non-interactive execution for terminal automation, scripts, and CI/CD pipelines (e.g. `devkit doctor`, `devkit explain <file>`).
- **Comprehensive Environment Diagnostics**: `devkit doctor` verifies Node.js LTS runtime, Git availability, package managers (npm, pnpm, yarn, bun), filesystem permissions, and AI readiness.
- **Multi-Ecosystem Project Discovery**: Automatically detects TypeScript, Node.js, Rust, Go, Python, and Git project roots.
- **Read-Only Git Review**: Inspects uncommitted changes, staged/unstaged counts, diff statistics, and provides optional AI-assisted code review without altering branches, commits, or staging areas.
- **Deep Security Architecture**:
  - Strict project boundary enforcement preventing directory traversal escapes (`../../`).
  - Automatic masking and exclusion of sensitive files (`.env`, `id_rsa`, `*.pem`, `*.key`, `credentials.json`).
  - Automatic secret redaction for API keys (`sk-...`, `Bearer ...`, passwords).
  - Native process execution with explicit argument arrays—no shell interpolation.
  - Strict allowlist for diagnostic commands; mutating operations require explicit approval.
- **Vendor-Agnostic AI Integration**: Clean provider abstraction supporting local mock/offline mode, OpenAI, Anthropic, Gemini, and custom OpenAI-compatible endpoints with streaming.

---

## Prerequisites

- **Node.js**: `>= 20.0.0` (LTS recommended: Node 20 or Node 22)
- **Git**: `>= 2.0.0` (optional, for Git-based inspection commands)
- **Platforms**: Windows (PowerShell/CMD), macOS, Linux

---

## Installation

### Global Installation
```bash
npm install -g devkit
```

### Local Project Installation
```bash
npm install --save-dev devkit
```

### Run with `npx`
```bash
npx devkit --help
```

---

## Quickstart

### 1. Interactive Command Palette
Open DevKit in interactive mode by running the executable without arguments:
```bash
devkit
```
**Keyboard Controls:**
- `↑` / `↓`: Navigate commands
- `Enter`: Select and execute action
- `/`: Filter and search commands
- `Esc` or `q`: Dismiss current screen or exit
- `Ctrl + C`: Clean cancellation

### 2. Diagnose Environment
Diagnose local tools, runtime versions, and permissions:
```bash
devkit doctor
```

### 3. Initialize Workspace Configuration
Initialize a safe `.devkitrc.json` configuration file in your project:
```bash
devkit init
```

### 4. Inspect and Explain Code
Generate architectural and code explanations for a project file:
```bash
devkit explain src/index.ts
```

### 5. Review Git Working Tree
Inspect unstaged and staged git changes and diff stats:
```bash
devkit review
```
With AI review feedback:
```bash
devkit review --ai
```

### 6. Terminal AI Chat
Run a single query:
```bash
devkit chat --message "Summarize project architecture"
```
Or start an interactive multi-turn session:
```bash
devkit chat
```

---

## Command Reference

| Command | Usage | Description | Interactive |
| :--- | :--- | :--- | :---: |
| `devkit` | `devkit` | Launches interactive command palette | Yes |
| `doctor` | `devkit doctor [--verbose]` | Diagnoses Node, Git, package managers, and config | Yes |
| `init` | `devkit init [-f, --force]` | Initializes `.devkitrc.json` project config | Yes |
| `explain` | `devkit explain <file> [--no-stream]` | Analyzes source file structure and metrics | Yes |
| `review` | `devkit review [--staged] [--ai]` | Inspects uncommitted changes and diff metrics | Yes |
| `chat` | `devkit chat [-m, --message <text>]` | Conversational assistant with workspace context | Yes |

### Global Flags
- `--help`: Display CLI usage and command documentation.
- `--version`: Output current DevKit version.
- `-c, --config <path>`: Specify custom configuration file path.
- `--debug`: Enable verbose debug logging and stack traces.
- `--json`: Output structured machine-readable JSON logs.
- `--no-color`: Disable ANSI color codes (respects `NO_COLOR`).

---

## Configuration Hierarchy

DevKit resolves settings through a strict 5-tier precedence order:

1. **CLI Overrides**: Flags passed on the command line (`--config`, `--provider`, `--stream`, etc.).
2. **Environment Variables**:
   - `GEMINI_API_KEY`: Google Gemini API key (default AI provider).
   - `OPENAI_API_KEY`: OpenAI API key.
   - `ANTHROPIC_API_KEY`: Anthropic Claude API key.
   - `DEVKIT_AI_API_KEY`: Generic provider API key override.
   - `DEVKIT_AI_PROVIDER`: `gemini` (default), `openai`, `anthropic`, or `mock`.
   - `DEVKIT_AI_MODEL`: Model identifier (default: `gemini-flash-lite-latest`).
   - `DEVKIT_AI_BASE_URL`: Custom API endpoint URL.
   - `DEVKIT_MAX_FILE_SIZE_KB`: Maximum file size permitted for inspection (default: `512`).
   - *Automatic `.env` Discovery*: DevKit automatically reads `GEMINI_API_KEY` or `DEVKIT_AI_API_KEY` from the local `.env` file of whatever project folder you run it in.
3. **Project Configuration**: `.devkitrc.json` or `devkit.config.json` in the project root.
4. **User Configuration**:
   - Linux/macOS: `~/.config/devkit/config.json`
   - Windows: `%APPDATA%\devkit\config.json`
5. **Built-in Safe Defaults**: Offline mock mode when keys are absent, secret redaction enabled, strict boundaries.

### Example `.devkitrc.json`
```json
{
  "$schema": "https://json.schemastore.org/devkit.json",
  "appName": "devkit",
  "ai": {
    "provider": "gemini",
    "model": "gemini-flash-lite-latest",
    "temperature": 0.2,
    "maxTokens": 2048,
    "timeoutMs": 60000
  },
  "security": {
    "allowExternalPaths": false,
    "maxFileSizeKb": 512,
    "redactSecrets": true
  },
  "ui": {
    "theme": "default",
    "interactive": true
  }
}
```

---

## Security Model & Defenses

1. **Path Traversal Prevention**:
   All file paths are validated against the resolved project root. Attempts to access paths escaping the boundary (e.g. `../../etc/passwd` or `../../Windows`) are rejected with `ExitCode 3 (FILESYSTEM_ERROR)`.
2. **Sensitive File Masking**:
   Files matching `.env*`, `id_rsa*`, `*.pem`, `*.key`, `credentials.json`, and `secrets.json` cannot be read or sent to AI context by default.
3. **Automatic Secret Redaction**:
   All log streams and AI context pipelines automatically redact OpenAI keys (`sk-...`), Anthropic keys (`sk-ant-...`), Google API keys (`AIza...`), Bearer tokens, and password assignments.
4. **No Arbitrary Shell Execution**:
   Process execution avoids shell string interpolation (`shell: false`). Native argument arrays are passed directly to `child_process.spawn`. Windows batch scripts (`.cmd`) use controlled execution with space-path quoting.
5. **Approval Policy for Mutating Operations**:
   Read-only operations run safely. Mutating tools (`apply_patch`, file writes) require explicit interactive approval or confirmation.
6. **Untrusted Content Demarcation**:
   Source files and commit diffs are explicitly marked as untrusted artifacts in model prompts, preventing prompt injection instructions embedded in repository files from overriding CLI security policies.

---

## Error Handling & Exit Codes

DevKit uses deterministic, typed exit codes for scripting and CI pipelines:

| Exit Code | Constant | Meaning |
| :---: | :--- | :--- |
| `0` | `SUCCESS` | Command completed successfully |
| `1` | `GENERAL_ERROR` | Unexpected or unhandled runtime error |
| `2` | `VALIDATION_ERROR` | Invalid arguments or option values |
| `3` | `FILESYSTEM_ERROR` | File not found, permission denied, or boundary escape |
| `4` | `GIT_ERROR` | Git not installed or not in a repository |
| `5` | `AI_ERROR` | AI API failure, authentication error, or rate limit |
| `6` | `CONFIG_ERROR` | Malformed or invalid configuration schema |
| `7` | `PROCESS_ERROR` | Subprocess spawn failure or non-zero exit |
| `130` | `CANCELLATION` | Operation cancelled via SIGINT / Ctrl+C |

---

## Development & Testing

```bash
# Clone and install dependencies
git clone https://github.com/example/devkit.git
cd devkit
npm install

# Run TypeScript type checking
npm run typecheck

# Run ESLint
npm run lint

# Check Prettier code formatting
npm run format

# Run Vitest unit and integration tests
npm test

# Build production distribution
npm run build

# Verify npm package distribution
npm pack --dry-run
```

---

## License

MIT License. Copyright (c) 2026 DevKit Authors.
