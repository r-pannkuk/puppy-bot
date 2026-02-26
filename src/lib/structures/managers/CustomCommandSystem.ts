import type { CustomCommand } from "@prisma/client";
import { container, UserError } from "@sapphire/framework";
import { CacheType, Collection, CommandInteraction, Guild, Message } from "discord.js";
import type { IGuildManager } from "./IGuildManager";

/**
 * Manages the set of custom commands for a single Discord guild.
 *
 * Commands are persisted in MongoDB and cached in-memory at startup via
 * {@link loadFromDB}. All mutating operations (add, edit, remove) write
 * through to the database and update the cache atomically.
 *
 * If the in-memory cache is empty when a command lookup is needed (e.g., due
 * to a startup failure), use {@link getByNameOrAliasWithFallback} which will
 * query the database directly before returning `null`.
 */
export class CustomCommandSystem implements IGuildManager {
	protected cache: Collection<string, CustomCommand>;
	protected guildId: string;

	public get guild() {
		return container.client.guilds.cache.get(this.guildId);
	}

	public get customCommands() {
		return this.cache;
	}

	/** Returns a flat list of all command IDs and alias strings in use. */
	public get commandNamesInUse() {
		return this.cache.reduce((sum, command) => {
			sum.push(command.id, ...command.aliases);
			return sum;
		}, new Array<string>());
	}

	public constructor(guild: Guild) {
		this.guildId = guild.id;
		this.cache = new Collection();
	}

	// private async addCommandToStore(command: CustomCommand) {
	// 	const commandStore = container.stores.get('commands');

	// 	const applicationCommandRegistry = container.applicationCommandRegistries.acquire(command.name);

	// 	const createdCommand = new PuppyBotCustomCommand({
	// 		schema: command,
	// 	});
	// 	await createdCommand.registerApplicationCommands(applicationCommandRegistry);
	// 	await commandStore.insert(createdCommand);
	// }

	// private async deleteCommandFromStore(command: CustomCommand) {
	// 	const commandStore = container.stores.get('commands');

	// 	var key = `${command.guildId}-${command.name}`
	// 	if (commandStore.has(key)) {
	// 		const foundCommand = await commandStore.get(key)! as PuppyBotCustomCommand;
	// 		await foundCommand.unregisterApplicationCommands();
	// 		commandStore.delete(key);
	// 	} else {
	// 		throw new UserError({
	// 			identifier: `Command not found.`,
	// 			context: command
	// 		})
	// 	}
	// }

	/**
	 * Loads all custom commands for this guild from MongoDB into the
	 * in-memory cache. Called once during guild initialization.
	 */
	public async loadFromDB() {
		const commands = await container.database.customCommand.findMany({
			where: { guildId: this.guildId }
		});
		this.cache = new Collection(
			commands.map((command) => [command.id, command] as [string, CustomCommand])
		);
	}

	public contains(command: {
		id?: string,
		name?: string,
	}) {
		return this.cache.some((value) =>
			value.id === command.id ||
			value.name === command.name
		)
	}

	public containsNameOrAlias(command: {
		id?: string,
		name?: string,
		aliases?: string[],
	}) {
		return this.cache.some((value) =>
			value.id === command.id ||
			value.name === command.name ||
			value.aliases?.includes(command.name ?? ``) ||
			(command.aliases?.some(alias => alias === value.name) ?? false) ||
			(command.aliases?.some(alias => value.aliases.includes(alias)) ?? false)
		)
	}

	/**
	 * Looks up a command by its name or any of its aliases.
	 * Only searches the in-memory cache.
	 */
	public getByNameOrAlias(command: {
		id?: string,
		name?: string,
		aliases?: string[],
	}) {
		return this.cache.find((value) =>
			value.id === command.id ||
			value.name === command.name ||
			value.aliases?.includes(command.name ?? ``) ||
			(command.aliases?.some(alias => alias === value.name) ?? false) ||
			(command.aliases?.some(alias => value.aliases.includes(alias)) ?? false)
		)
	}

	/**
	 * Like {@link getByNameOrAlias} but falls back to a direct MongoDB query
	 * when the in-memory cache is empty or the command is not found in cache.
	 *
	 * Use this in message-handling paths where a startup failure may have left
	 * the cache empty, to avoid silently ignoring valid custom commands.
	 */
	public async getByNameOrAliasWithFallback(name: string): Promise<CustomCommand | null> {
		const cached = this.getByNameOrAlias({ name });
		if (cached) return cached;

		// Cache miss — query DB directly and repopulate the entry.
		const fromDb = await container.database.customCommand.findFirst({
			where: {
				guildId: this.guildId,
				OR: [{ name }, { aliases: { has: name } }],
			}
		});

		if (fromDb) {
			this.cache.set(fromDb.id, fromDb);
		}
		return fromDb ?? null;
	}

	public async add(command: CustomCommand | {
		name: string,
		aliases?: string[],
		ownerId: string,
		content: string,
		createdAt?: Date,
		lastUsedAt?: Date,
		useCount?: number
	}) {
		if (this.containsNameOrAlias(command)) {
			throw new UserError({
				identifier: `Command already exists.`,
				context: command
			})
		}

		command = await container.database.customCommand.create({
			data: {
				guildId: this.guildId,
				name: command.name,
				aliases: command.aliases ?? [],
				ownerId: command.ownerId,
				content: command.content,
				createdAt: command.createdAt ?? new Date(Date.now()),
				lastUsedAt: command.lastUsedAt,
				useCount: command.useCount ?? 0,
			}
		})

		this.cache.set(command.id, command);

		return command;
	}

	/**
	 * Updates an existing command's content or aliases in both the database
	 * and the in-memory cache. Aliases are merged (union) with existing aliases.
	 */
	public async edit(command: CustomCommand | {
		id?: string,
		name?: string,
		aliases?: string[],
		ownerId?: string,
		content?: string,
		createdAt?: Date,
		lastUsedAt?: Date,
		useCount?: number
	}) {
		if (!command.id && !command.name) {
			throw new UserError({
				identifier: `Need at least an ID or Name to identify a command.`,
				context: command
			})
		}

		let foundCommand: CustomCommand | undefined;
		if (command.id) {
			foundCommand = this.cache.get(command.id);
		} else {
			foundCommand = this.getByNameOrAlias(command);
		}

		if (!foundCommand) {
			throw new UserError({
				identifier: `Could not find existing command.`,
				context: command
			})
		}

		command = {
			...foundCommand,
			...command,
			aliases: Array.from(new Set(foundCommand.aliases.concat(command.aliases ?? []))),
		} as {
			id?: string,
			aliases: string[]
		};

		delete command.id;

		command = await container.database.customCommand.update({
			where: {
				id: foundCommand.id
			},
			data: command
		})

		this.cache.set(command.id, command);

		return command;
	}

	/**
	 * Deletes a command from both the database and the in-memory cache.
	 * Accepts either an `id` or `name` to identify the command.
	 */
	public async remove(command: {
		id?: string,
		name?: string,
		aliases?: string[]
	}) {
		let foundCommand: CustomCommand | undefined;
		if (command.id) {
			foundCommand = this.cache.get(command.id);
		} else {
			foundCommand = this.getByNameOrAlias(command);
		}

		if (!foundCommand) {
			throw new UserError({
				identifier: `Could not find existing command.`,
				context: command
			})
		}

		await container.database.customCommand.delete({
			where: {
				id: foundCommand.id
			}
		})

		this.cache.delete(foundCommand.id);
	}

	public async removeAll() {
		for (const [id] of this.customCommands) {
			await this.remove({ id });
		}
	}

	public async run(messageOrInteraction: Message<boolean> | CommandInteraction<CacheType>, command: CustomCommand | string) {
		if (typeof command === 'string') {
			const foundCommand = this.getByNameOrAlias({
				name: command
			});

			if (!foundCommand) {
				throw new UserError({
					identifier: `Could not find existing command.`,
					context: command
				})
			}
			command = foundCommand;
		}

		if(messageOrInteraction instanceof Message) {
			await messageOrInteraction.reply(command.content);
		} else {
			if(messageOrInteraction.deferred || messageOrInteraction.replied) {
				await messageOrInteraction.editReply(command.content);
			} else {
				await messageOrInteraction.reply(command.content);
			}
		}

		command.useCount += 1;
		command.lastUsedAt = new Date(Date.now());

		await this.edit(command);

		// const instigatedCommand = container.stores.get('commands').get(`${command.id}-${command.name}`);

		// if (instigatedCommand) {
		// 	return (instigatedCommand as PuppyBotCustomCommand).run(messageOrInteraction);
		// }
	}
}