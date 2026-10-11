class CommandRegistry {
    commands = new Map();
    register(def) {
        if (this.commands.has(def.name)) {
            throw new Error(`Command "${def.name}" is already registered.`);
        }
        this.commands.set(def.name, def);
    }
    get(name) {
        return (this.commands.get(name) ||
            Array.from(this.commands.values()).find((cmd) => cmd.aliases?.includes(name)));
    }
    getAll() {
        return Array.from(this.commands.values());
    }
    getInteractiveCommands() {
        return this.getAll().filter((cmd) => cmd.interactive);
    }
}
export const commandRegistry = new CommandRegistry();
//# sourceMappingURL=command-registry.js.map