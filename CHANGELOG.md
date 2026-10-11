# Changelog

All notable changes to DevKit will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-10-09

### Added
- **Interactive Command Palette**: React and Ink-powered terminal UI with arrow navigation, search filtering, and output capture.
- **CLI Commands**:
  - `init`: Safe workspace configuration initializer.
  - `doctor`: Comprehensive diagnostic suite checking Node.js LTS, Git, package managers, and permissions.
  - `explain`: Safe file inspection and AI code analysis.
  - `review`: Read-only Git status, diff calculation, and AI review summaries.
  - `chat`: Conversational AI interface with streaming and project context.
- **Multi-Ecosystem Discovery**: Automatic detection of TypeScript, Node.js, Rust, Go, Python, and Git project roots.
- **Security Engine**:
  - Project boundary isolation preventing path traversal (`../../`).
  - Sensitive file masking (`.env`, `id_rsa`, `*.pem`, `*.key`).
  - Secret redaction for API keys, Bearer tokens, and passwords.
  - Native argument array process execution avoiding shell interpolation.
  - Mutating tool approval policy.
- **AI Provider Abstraction**:
  - Deterministic `MockAIProvider` for offline operation and automated testing.
  - `OpenAICompatibleProvider` with streaming support for OpenAI, Anthropic, Gemini, and local LLMs.
- **Configuration Engine**:
  - Hierarchical precedence: CLI flags > Environment variables > Project config > User config > Defaults.
  - Zod validation and safe atomic persistence.
- **Quality & CI**:
  - Full Vitest test suite with 38 unit and integration tests.
  - TypeScript strict type checking with zero errors.
  - ESLint and Prettier formatting checks.
  - GitHub Actions CI matrix across Linux, macOS, and Windows on Node 20 & 22.
