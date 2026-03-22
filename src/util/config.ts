import { existsSync, readFileSync, writeFileSync, watchFile } from "fs";
import { parse, stringify } from "yaml";
import { Logger } from "./Logger";

/**
 * This file uses the synchronous functions from the fs
 * module because these functions should only be used
 * to load configs at the beginning of runtime
 *
 * Hint: This means you shouldn't load configs in the
 * middle of doing other shit, only when you start the
 * program.
 */

/**
 * Configuration loader/reloader
 */
export class ConfigManager {
    public static configCache = new Map<string, unknown>();
    public static logger: Logger;

    static {
        setImmediate(() => {
            this.logger = new Logger("Config Loader");
        });
    }

    /**
     * Load a YAML config file and set default values if config path is nonexistent
     *
     * Usage:
     * ```ts
     * const config = ConfigManager.loadConfig("config/services.yml", {
     *     enableMPP: false
     * });
     * ```
     * @param configPath Path to load config from
     * @param defaultConfig Config to use if none is present (will save to path if used, see saveDefault)
     * @param saveDefault Whether to save the default config if none is present
     * @returns Parsed YAML config
     */
    public static loadConfig<T>(
        configPath: string,
        defaultConfig: T,
        saveDefault = true
    ): T {
        // Config exists?
        if (existsSync(configPath)) {
            // Load config
            const data = readFileSync(configPath);
            const config = parse(data.toString());

            const defRecord = defaultConfig as Record<string, any>;
            let changed = false;

            function mix(
                obj: Record<string, unknown>,
                obj2: Record<string, unknown>
            ) {
                for (const key of Object.keys(obj2)) {
                    if (typeof obj[key] == "undefined") {
                        obj[key] = obj2[key];
                        changed = true;
                    }

                    if (
                        typeof obj[key] == "object" &&
                        !Array.isArray(obj[key])
                    ) {
                        mix(
                            obj[key] as Record<string, unknown>,
                            obj2[key] as Record<string, unknown>
                        );
                    }
                }
            }

            // Apply any missing default values
            mix(config, defRecord);

            // Save config if modified
            if (saveDefault && changed) this.writeConfig(configPath, config);

            if (!this.configCache.has(configPath)) {
                // File contents changed callback
                const watcher = watchFile(configPath, () => {
                    this.logger.info(
                        "Reloading config due to changes:",
                        configPath
                    );

                    this.loadConfig(configPath, defaultConfig, false);
                });
            }

            this.configCache.set(configPath, config);

            return this.getConfigProxy<T>(configPath);
            // return config;
        } else {
            // Write default config to disk and use that
            //logger.warn(`Config file "${configPath}" not found, writing default config to disk`);
            if (saveDefault) this.writeConfig(configPath, defaultConfig);

            if (!this.configCache.has(configPath)) {
                // File contents changed callback
                const watcher = watchFile(configPath, () => {
                    this.logger.info(
                        "Reloading config due to changes:",
                        configPath
                    );
                    this.loadConfig(configPath, defaultConfig, false);
                });
            }

            this.configCache.set(configPath, defaultConfig);
            return this.getConfigProxy<T>(configPath);
            // return defaultConfig;
        }
    }

    /**
     * Write a YAML config to disk
     * @param configPath
     * @param config
     */
    public static writeConfig<T>(configPath: string, config: T) {
        // Write config to disk unconditionally
        writeFileSync(
            configPath,
            stringify(config, {
                indent: 4
            })
        );
    }

    /**
     * Get a proxy to a config (for updating config objects regardless of scope)
     * @param configPath Path to config file
     * @returns Config proxy object
     */
    protected static getConfigProxy<T>(configPath: string) {
        const self = this;

        return new Proxy(
            {},
            {
                get(_target: unknown, name: string) {
                    // Get the updated in-memory version of the config
                    const config = self.configCache.get(configPath) as T;

                    if (config) {
                        if (config.hasOwnProperty(name))
                            return (config as Record<string, unknown>)[
                                name
                            ] as T[keyof T];
                    }
                }
            }
        ) as T;
    }

    /**
     * Get the in-memory config's value directly from the map (not a proxy object)
     */
    public static getOriginalConfigObject<T>(configPath: string) {
        return this.configCache.get(configPath) as T;
    }
}
