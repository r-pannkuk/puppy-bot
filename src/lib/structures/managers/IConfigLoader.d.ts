export abstract interface IConfigLoader<Config> {
	// protected _config: Config | undefined = undefined;
	get config() {
		return this._config;
	}
	public async loadConfig(): Promise<void>;
}
