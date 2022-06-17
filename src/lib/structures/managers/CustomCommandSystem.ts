import type { CustomCommand } from "@prisma/client";
import { container, UserError } from "@sapphire/framework";
import { CacheType, Collection, CommandInteraction, Guild, Message } from "discord.js";
import type { IGuildManager } from "./IGuildManager";

export class CustomCommandSystem implements IGuildManager {
	protected cache: Collection<[commandId: string], CustomCommand>;
	protected guildId: string;

	public get guild() {
		return container.client.guilds.cache.get(this.guildId);
	}

	public get customCommands() {
		return this.cache;
	}

	public get commandNamesInUse() {
		return this.cache.reduce((sum, command) => {
			sum.push(command.id);
			sum.concat(command.aliases);
			return sum;
		}, new Array<string>())
	}

	public constructor(guild: Guild) {
		this.guildId = guild.id;
		this.cache = new Collection();

		// (async () => {
		// 	await this.loadFromDB();
		// })()
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

	public async loadFromDB() {
		this.cache = new Collection(
			Array.from(
				await container.database.customCommand.findMany({
					where: {
						guildId: this.guildId
					}
				}) ?? [], (value) => [value.id as unknown as [commandId: string], value]
			)
		);

		// for (var [, command] of this.cache) {
		// 	await this.addCommandToStore(command);
		// }
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

		this.cache.set(command.id as unknown as [commandId: string], command);
		// await this.addCommandToStore(command);

		return command;
	}

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
			foundCommand = this.cache.get(command.id as unknown as [commandId: string]);
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

		this.cache.set(command.id as unknown as [commandId: string], command);
		// await this.addCommandToStore(command);

		return command;
	}

	public async remove(command: {
		id?: string,
		name?: string,
		aliases?: string[]
	}) {
		let foundCommand: CustomCommand | undefined;
		if (command.id) {
			foundCommand = this.cache.get(command.id as unknown as [commandId: string]);
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

		this.cache.delete(foundCommand.id as unknown as [commandId: string]);
		// this.deleteCommandFromStore(foundCommand);
	}

	public async removeAll() {
		for (var [id,] of this.customCommands) {
			await this.remove({ id: id.toString() });
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