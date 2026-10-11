# DevKit Architecture

This document details the architectural decisions, component contracts, and design principles implemented in DevKit.

```mermaid
graph TD
  User([User / Shell]) --> Entry["src/index.ts (Hashbang / CLI Runner)"]
  Entry --> CLI["src/cli.ts (Commander Dispatcher)"]

  CLI -->|No Args / TTY| UI["src/ui/App.tsx (Ink / React Interactive Mode)"]
  CLI -->|Subcommands / CI| Commands["src/commands/* (Non-Interactive Subcommands)"]

  UI --> CommandPalette["src/ui/CommandPalette.tsx"]
  UI --> OutputPanel["src/ui/OutputPanel.tsx"]
  UI --> StatusBar["src/ui/StatusBar.tsx"]

  Commands --> Registry["src/core/command-registry.ts"]
  UI --> Registry

  Commands --> Services["src/services/*"]
  Commands --> AI["src/ai/*"]
  Commands --> Core["src/core/*"]

  subgraph Services
    FS["filesystem.ts (Path traversal defense, secret exclusion)"]
    Git["git.ts (Read-only status & diff analysis)"]
    Discovery["project-discovery.ts (Node, Rust, Go, Python)"]
    Process["process-runner.ts (Non-shell spawn, timeout, tree-kill)"]
  end

  subgraph AI
    Provider["provider.ts (Mock & OpenAI-compatible streaming)"]
    Context["context.ts (Untrusted boundary, secret redaction)"]
    Tools["tools.ts (Strict allowlist & typed schemas)"]
    Approval["approval.ts (Mutating operation guard)"]
  end

  subgraph Core
    Config["config.ts (Hierarchical Zod config)"]
    Errors["errors.ts (Typed error hierarchy & exit codes)"]
    Logger["logger.ts (Secret redaction & JSON mode)"]
    Terminal["terminal.ts (NO_COLOR / FORCE_COLOR / ANSI)"]
    Cancellation["cancellation.ts (Cooperative tokens)"]
  end
```

## Core Architectural Decisions

### 1. Separation of Interaction and Business Logic
The application logic resides in commands (`src/commands/`) and services (`src/services/`). Both the interactive Ink terminal UI (`src/ui/`) and non-interactive Commander CLI (`src/cli.ts`) invoke identical command definitions through `ExecutionContext`. This ensures 100% behavioral equivalence regardless of whether a command was triggered from the interactive palette or a shell script.

### 2. Single Source of Truth for Command Metadata
`src/core/command-registry.ts` registers command names, descriptions, options, arguments, categories, and actions. This eliminates duplicated command documentation and ensures the interactive palette and `--help` output stay perfectly in sync.

### 3. Deep Defense Security Model
- **Filesystem Boundaries**: Path resolution checks canonical paths via `fs.realpathSync` to ensure symbolic links and relative path sequences cannot escape the project root directory.
- **Secret Redaction**: Every string logged, printed, or sent to AI context passes through secret redaction patterns to prevent accidental leaks of API tokens or credentials.
- **Safe Process Spawning**: Shell execution is disabled by default (`shell: false`). Windows batch scripts (`.cmd` / `.bat`) require explicit escaping and path quoting.

### 4. Deterministic Error and Exit Code Mapping
All errors inherit from `DevKitError` and map to stable exit codes (e.g. `ExitCode.FILESYSTEM_ERROR = 3`, `ExitCode.GIT_ERROR = 4`). Script authors can reliably automate workflows based on exit codes.

### 5. Cooperative Cancellation
`CancellationTokenSource` and `CancellationToken` propagate abort signals across asynchronous tasks, process runners, HTTP streaming connections, and child processes, ensuring graceful resource cleanup upon `SIGINT` (Ctrl+C).
