import fs from 'node:fs';
import path from 'node:path';
import { FileSystemError } from '../core/errors.js';
const DEFAULT_IGNORED_DIRECTORIES = new Set([
    '.git',
    'node_modules',
    'dist',
    'build',
    'coverage',
    '.next',
    '.turbo',
    '.cache',
    'vendor',
    '__pycache__',
    '.pytest_cache',
    'target',
]);
const SENSITIVE_FILE_NAMES = new Set([
    '.env',
    '.env.local',
    '.env.production',
    '.env.development',
    '.env.test',
    'id_rsa',
    'id_ed25519',
    'id_ecdsa',
    'credentials',
    'credentials.json',
    'secrets.json',
]);
const SENSITIVE_EXTENSIONS = new Set(['.pem', '.key', '.p12', '.pfx', '.pkcs12']);
export class FileSystemService {
    static isSensitiveFile(filePath) {
        const baseName = path.basename(filePath).toLowerCase();
        const ext = path.extname(filePath).toLowerCase();
        if (SENSITIVE_FILE_NAMES.has(baseName))
            return true;
        if (baseName.startsWith('.env.') || baseName === '.env')
            return true;
        if (SENSITIVE_EXTENSIONS.has(ext))
            return true;
        return false;
    }
    static resolveSafePath(targetPath, options) {
        const root = path.resolve(options.projectRoot);
        const resolved = path.isAbsolute(targetPath)
            ? path.resolve(targetPath)
            : path.resolve(root, targetPath);
        // Verify canonical path does not escape project root if external paths are disallowed
        if (!options.allowExternalPaths) {
            const relative = path.relative(root, resolved);
            if (relative.startsWith('..') || path.isAbsolute(relative)) {
                throw new FileSystemError(`Path "${targetPath}" resolves outside project root "${root}".`, {
                    path: targetPath,
                    remediation: 'Provide a path located inside the current project, or enable allowExternalPaths in configuration.',
                });
            }
        }
        // Check symlink canonical path if target exists
        if (fs.existsSync(resolved)) {
            try {
                const real = fs.realpathSync(resolved);
                if (!options.allowExternalPaths) {
                    const relativeReal = path.relative(root, real);
                    if (relativeReal.startsWith('..') || path.isAbsolute(relativeReal)) {
                        throw new FileSystemError(`Symlink "${targetPath}" points to target outside project root.`, { path: targetPath });
                    }
                }
            }
            catch (err) {
                if (err instanceof FileSystemError)
                    throw err;
                throw new FileSystemError(`Failed to resolve real path for "${targetPath}".`, {
                    path: targetPath,
                    cause: err,
                });
            }
        }
        return resolved;
    }
    static async readFile(targetPath, options) {
        const resolved = this.resolveSafePath(targetPath, options);
        if (!fs.existsSync(resolved)) {
            throw new FileSystemError(`File "${targetPath}" does not exist.`, {
                path: targetPath,
                remediation: 'Ensure the file path is correct and exists on disk.',
            });
        }
        let stats;
        try {
            stats = fs.statSync(resolved);
        }
        catch (err) {
            throw new FileSystemError(`Unable to read metadata for "${targetPath}".`, {
                path: targetPath,
                cause: err,
            });
        }
        if (stats.isDirectory()) {
            throw new FileSystemError(`Path "${targetPath}" is a directory, not a file.`, {
                path: targetPath,
                remediation: 'Specify a file to read rather than a directory.',
            });
        }
        const maxKb = options.maxFileSizeKb ?? 512;
        const maxBytes = maxKb * 1024;
        if (stats.size > maxBytes) {
            throw new FileSystemError(`File size (${(stats.size / 1024).toFixed(1)} KB) exceeds configured limit (${maxKb} KB).`, {
                path: targetPath,
                remediation: `Increase security.maxFileSizeKb or select a smaller file.`,
            });
        }
        if (this.isSensitiveFile(resolved)) {
            throw new FileSystemError(`Access to sensitive file "${path.basename(resolved)}" is blocked by security policy.`, {
                path: targetPath,
                remediation: 'DevKit prevents reading environment files and credentials by default to safeguard secrets.',
            });
        }
        try {
            const content = await fs.promises.readFile(resolved, 'utf-8');
            return {
                content,
                sizeBytes: stats.size,
                path: resolved,
            };
        }
        catch (err) {
            throw new FileSystemError(`Failed to read file "${targetPath}".`, {
                path: targetPath,
                cause: err,
            });
        }
    }
    static listProjectFiles(dirPath, options) {
        const root = this.resolveSafePath(dirPath, options);
        const maxDepth = options.maxDepth ?? 5;
        const maxFiles = options.maxFiles ?? 500;
        const results = [];
        const traverse = (currentDir, depth) => {
            if (depth > maxDepth || results.length >= maxFiles)
                return;
            let entries;
            try {
                entries = fs.readdirSync(currentDir, { withFileTypes: true });
            }
            catch {
                return; // Ignore unreadable directories
            }
            for (const entry of entries) {
                if (results.length >= maxFiles)
                    break;
                const fullPath = path.join(currentDir, entry.name);
                if (entry.isDirectory()) {
                    if (!DEFAULT_IGNORED_DIRECTORIES.has(entry.name)) {
                        traverse(fullPath, depth + 1);
                    }
                }
                else if (entry.isFile()) {
                    if (!this.isSensitiveFile(fullPath)) {
                        const rel = path.relative(root, fullPath);
                        results.push(rel.replace(/\\/g, '/'));
                    }
                }
            }
        };
        traverse(root, 1);
        return results;
    }
    static async writeFileAtomic(targetPath, content, options) {
        const resolved = this.resolveSafePath(targetPath, options);
        const dir = path.dirname(resolved);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        const tmpPath = `${resolved}.tmp.${Date.now()}`;
        await fs.promises.writeFile(tmpPath, content, { encoding: 'utf-8', mode: 0o644 });
        await fs.promises.rename(tmpPath, resolved);
    }
}
//# sourceMappingURL=filesystem.js.map