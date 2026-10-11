import fs from 'node:fs';
import path from 'node:path';
export class ProjectDiscoveryService {
    static detect(projectRoot = process.cwd()) {
        const root = path.resolve(projectRoot);
        const isGitRepo = fs.existsSync(path.join(root, '.git'));
        const details = {};
        let detectedType = 'unknown';
        let projectName = path.basename(root);
        let packageManager;
        let language;
        let framework;
        // Check Node / TypeScript
        const pkgPath = path.join(root, 'package.json');
        const tsconfigPath = path.join(root, 'tsconfig.json');
        if (fs.existsSync(pkgPath)) {
            try {
                const pkgContent = fs.readFileSync(pkgPath, 'utf-8');
                const pkgJson = JSON.parse(pkgContent);
                if (pkgJson.name)
                    projectName = pkgJson.name;
                if (fs.existsSync(tsconfigPath)) {
                    detectedType = 'typescript';
                    language = 'TypeScript';
                }
                else {
                    detectedType = 'node';
                    language = 'JavaScript';
                }
                // Framework detection
                const deps = { ...pkgJson.dependencies, ...pkgJson.devDependencies };
                if (deps['next'])
                    framework = 'Next.js';
                else if (deps['react'])
                    framework = 'React';
                else if (deps['vue'])
                    framework = 'Vue';
                else if (deps['@angular/core'])
                    framework = 'Angular';
                else if (deps['express'])
                    framework = 'Express';
                else if (deps['fastify'])
                    framework = 'Fastify';
                // Package manager detection via lockfiles
                if (fs.existsSync(path.join(root, 'pnpm-lock.yaml'))) {
                    packageManager = 'pnpm';
                }
                else if (fs.existsSync(path.join(root, 'yarn.lock'))) {
                    packageManager = 'yarn';
                }
                else if (fs.existsSync(path.join(root, 'bun.lockb')) ||
                    fs.existsSync(path.join(root, 'bun.lock'))) {
                    packageManager = 'bun';
                }
                else if (fs.existsSync(path.join(root, 'package-lock.json'))) {
                    packageManager = 'npm';
                }
                else {
                    packageManager = 'npm';
                }
            }
            catch {
                detectedType = 'node';
            }
        }
        else if (fs.existsSync(path.join(root, 'Cargo.toml'))) {
            detectedType = 'rust';
            language = 'Rust';
            packageManager = 'cargo';
        }
        else if (fs.existsSync(path.join(root, 'go.mod'))) {
            detectedType = 'go';
            language = 'Go';
            packageManager = 'go';
        }
        else if (fs.existsSync(path.join(root, 'pyproject.toml')) ||
            fs.existsSync(path.join(root, 'requirements.txt')) ||
            fs.existsSync(path.join(root, 'Pipfile'))) {
            detectedType = 'python';
            language = 'Python';
            if (fs.existsSync(path.join(root, 'poetry.lock'))) {
                packageManager = 'poetry';
            }
            else if (fs.existsSync(path.join(root, 'Pipfile.lock'))) {
                packageManager = 'pipenv';
            }
            else {
                packageManager = 'pip';
            }
        }
        if (language)
            details['Language'] = language;
        if (framework)
            details['Framework'] = framework;
        if (packageManager)
            details['Package Manager'] = packageManager;
        if (isGitRepo)
            details['VCS'] = 'Git';
        return {
            type: detectedType,
            name: projectName,
            rootPath: root,
            isGitRepo,
            packageManager,
            language,
            framework,
            details,
        };
    }
}
//# sourceMappingURL=project-discovery.js.map