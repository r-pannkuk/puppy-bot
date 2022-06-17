import type { CustomCommand } from "@prisma/client";
import { container } from "@sapphire/framework";
import { ButtonInteraction, Constants, ExcludeEnum, MessageButtonOptions, MessageEmbedOptions } from "discord.js";
import { Emojis } from "../../../utils/constants";
import { PuppyBotEmbed } from "../PuppyBotEmbed";

export enum _InteractionIds {
	EditContent = `CustomCommandEmbed.editContent`,
	AddAlias = `CustomCommandEmbed.addAlias`,
	RemoveAlias = `CustomCommandEmbed.removeAlias`,
	Rename = `CustomCommandEmbed.rename`,
	Remove = `CustomCommandEmbed.remove`
}

export const InteractionIds = { ..._InteractionIds }

export class CustomCommandEmbed extends PuppyBotEmbed {
	protected guildId?: string;
	protected schemaId?: string;

	public get guild() { return container.client.guilds.cache.get(this.guildId ?? ""); }
	public get schema() { return this.guild?.customCommandSystem.customCommands.get(this.schemaId as unknown as [commandId: string] ?? ""); }

	public get stringifyId() { return `**Id**: ${this.schema?.id}` }
	public get stringifyName() { return `**Name**: ${this.schema?.name}` }
	public get stringifyAliases() { return `**Aliases**: \`${this.schema?.aliases.join(', ')}\`` }
	public get stringifyNamePlusAliases() { return `**Names**: \`${[this.schema?.name].concat(this.schema?.aliases).join('\`, \`')}\`` }
	public get stringifyContent() { return `**Content**: ${this.schema?.content}` }
	public get stringifyOwner() { return `**Owner**: ${container.client.users.cache.get(this.schema?.ownerId ?? ``)}` }
	public get stringifyUseCount() { return `**Uses**: ${this.schema?.useCount ?? 0}` }
	public get stringifyCreatedAt() { return `**Created At**: ${new Date(this.schema?.createdAt ?? 0)}` }
	public get stringifyLastUsedAt() { return `**Last Used At**: ${new Date(this.schema?.lastUsedAt ?? 0)}` }

	public static actions: (MessageButtonOptions & { customId: string, run: (interaction: ButtonInteraction, command: CustomCommand) => any })[] = [
		// {
		// 	customId: InteractionIds.AddAlias,
		// 	type: Constants.MessageComponentTypes.BUTTON as ExcludeEnum<typeof Constants.MessageComponentTypes, "ACTION_ROW" | "SELECT_MENU">,
		// 	emoji: Emojis.Paperclips,
		// 	label: 'Add Alias',
		// 	style: Constants.MessageButtonStyles.SUCCESS as ExcludeEnum<typeof Constants.MessageButtonStyles, "LINK">,
		// 	run: async (_interaction, _command: CustomCommand) => {}
		// },
		// {
		// 	customId: InteractionIds.RemoveAlias,
		// 	type: Constants.MessageComponentTypes.BUTTON as ExcludeEnum<typeof Constants.MessageComponentTypes, "ACTION_ROW" | "SELECT_MENU">,
		// 	emoji: Emojis.Paperclips,
		// 	label: 'Remove Alias',
		// 	style: Constants.MessageButtonStyles.DANGER as ExcludeEnum<typeof Constants.MessageButtonStyles, "LINK">,
		// 	run: async (_interaction, _command: CustomCommand) => {}
		// },
		// {
		// 	customId: InteractionIds.Rename,
		// 	type: Constants.MessageComponentTypes.BUTTON as ExcludeEnum<typeof Constants.MessageComponentTypes, "ACTION_ROW" | "SELECT_MENU">,
		// 	emoji: Emojis.Pencil,
		// 	label: 'Rename',
		// 	style: Constants.MessageButtonStyles.SECONDARY as ExcludeEnum<typeof Constants.MessageButtonStyles, "LINK">,
		// 	run: async (_interaction, _command: CustomCommand) => {}
		// },
		// {
		// 	customId: InteractionIds.EditContent,
		// 	type: Constants.MessageComponentTypes.BUTTON as ExcludeEnum<typeof Constants.MessageComponentTypes, "ACTION_ROW" | "SELECT_MENU">,
		// 	emoji: Emojis.Memo,
		// 	label: 'Edit Content',
		// 	style: Constants.MessageButtonStyles.PRIMARY as ExcludeEnum<typeof Constants.MessageButtonStyles, "LINK">,
		// 	run: async (_interaction, _command: CustomCommand) => {}
		// },
		{
			customId: InteractionIds.Remove,
			type: Constants.MessageComponentTypes.BUTTON as ExcludeEnum<typeof Constants.MessageComponentTypes, "ACTION_ROW" | "SELECT_MENU">,
			emoji: Emojis.CrossMark,
			label: 'Remove',
			style: Constants.MessageButtonStyles.DANGER as ExcludeEnum<typeof Constants.MessageButtonStyles, "LINK">,
			run: async (interaction, command) => {
				await interaction.guild?.customCommandSystem.remove(command);
				return null;
			}
		},
	]

	public constructor(options: CustomCommandEmbed.Options) {
		super(options);

		if (options.schema) {
			this.guildId = options.schema.guildId;
			this.schemaId = options.schema.id;
		}

		let content: string[] = [];

		content = [
			this.stringifyNamePlusAliases,
			this.stringifyOwner,
			this.stringifyUseCount,
			this.stringifyCreatedAt,
			this.stringifyLastUsedAt,
			"",
			this.stringifyContent,
		]

		this.setFields([]);
		this.setDescription("");

		this.splitFields({
			content
		});

		this.setAuthor({
			name: `Command: ${this.schema?.name} <${this.schema?.id}>`
		})

		this.setFooter({
			text: `[Server: ${this.guild?.name}]`
		})
	}
}

export namespace CustomCommandEmbed {
	export type Options = MessageEmbedOptions & {
		schema: CustomCommand
	}
}