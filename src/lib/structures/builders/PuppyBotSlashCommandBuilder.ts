// import {
// 	SlashCommandBooleanOption as _SlashCommandBooleanOption,
// 	SlashCommandBuilder as _SlashCommandBuilder,
// 	SlashCommandChannelOption as _SlashCommandChannelOption,
// 	SlashCommandIntegerOption as _SlashCommandIntegerOption,
// 	SlashCommandMentionableOption as _SlashCommandMentionableOption,
// 	SlashCommandNumberOption as _SlashCommandNumberOption,
// 	SlashCommandRoleOption as _SlashCommandRoleOption,
// 	SlashCommandStringOption as _SlashCommandStringOption,
// 	SlashCommandSubcommandBuilder as _SlashCommandSubcommandBuilder,
// 	SlashCommandSubcommandGroupBuilder as _SlashCommandSubcommandGroupBuilder,
// 	SlashCommandSubcommandsOnlyBuilder as _SlashCommandSubcommandsOnlyBuilder,
// 	SlashCommandUserOption as _SlashCommandUserOption, 
// } from "@discordjs/builders";
// import type { PuppyBotCommand } from "../command/PuppyBotCommand";

// export namespace PuppyBot {
// 	export class SlashCommandBuilder<T extends PuppyBotCommand.CommandStructure> extends _SlashCommandBuilder {
// 		public override addSubcommandGroup<G extends PuppyBotCommand.ValidSubCommandGroup<T>>(input: SlashCommandSubcommandGroupBuilder<T, G> | ((subcommandGroup: SlashCommandSubcommandGroupBuilder<T, G>) => SlashCommandSubcommandGroupBuilder<T, G>)): SlashCommandSubcommandsOnlyBuilder {
// 			return super.addSubcommandGroup(input);
// 		}

// 		public override addSubcommand<S extends PuppyBotCommand.ValidSubCommand<T, undefined>>(input: SlashCommandSubcommandBuilder<T, undefined, S> | ((subcommandGroup: SlashCommandSubcommandBuilder<T, undefined, S>) => SlashCommandSubcommandBuilder<T, undefined, S>)): SlashCommandSubcommandsOnlyBuilder<T, undefined, S> {
// 			return super.addSubcommand(input);
// 		}

// 		public override addBooleanOption<O extends PuppyBotCommand.ValidOption<T, undefined, undefined>>(input: SlashCommandBooleanOption<T, undefined, undefined, O> | ((builder: _SlashCommandBooleanOption) => _SlashCommandBooleanOption)): Omit<this, "addSubcommand" | "addSubcommandGroup"> {
// 			return super.addBooleanOption(input);
// 		}

// 		public override addChannelOption(input: _SlashCommandChannelOption | ((builder: _SlashCommandChannelOption) => _SlashCommandChannelOption)): Omit<this, "addSubcommand" | "addSubcommandGroup"> {
// 			return super.addChannelOption(input);
// 		}

// 		public override addIntegerOption(input: _SlashCommandIntegerOption | Omit<_SlashCommandIntegerOption, "setAutocomplete"> | Omit<_SlashCommandIntegerOption, "addChoice" | "addChoices"> | ((builder: _SlashCommandIntegerOption) => _SlashCommandIntegerOption | Omit<_SlashCommandIntegerOption, "setAutocomplete"> | Omit<_SlashCommandIntegerOption, "addChoice" | "addChoices">)): Omit<this, "addSubcommand" | "addSubcommandGroup"> {
// 			return super.addIntegerOption(input);
// 		}

// 		public override addMentionableOption(input: _SlashCommandMentionableOption | ((builder: _SlashCommandMentionableOption) => _SlashCommandMentionableOption)): Omit<this, "addSubcommand" | "addSubcommandGroup"> {
// 			return super.addMentionableOption(input);
// 		}

// 		public override addNumberOption(input: _SlashCommandNumberOption | Omit<_SlashCommandNumberOption, "setAutocomplete"> | Omit<_SlashCommandNumberOption, "addChoice" | "addChoices"> | ((builder: _SlashCommandNumberOption) => _SlashCommandNumberOption | Omit<_SlashCommandNumberOption, "setAutocomplete"> | Omit<_SlashCommandNumberOption, "addChoice" | "addChoices">)): Omit<this, "addSubcommand" | "addSubcommandGroup"> {
// 			return super.addNumberOption(input);
// 		}

// 		public override addRoleOption(input: _SlashCommandRoleOption | ((builder: _SlashCommandRoleOption) => _SlashCommandRoleOption)): Omit<this, "addSubcommand" | "addSubcommandGroup"> {
// 			return super.addRoleOption(input);
// 		}

// 		public override addStringOption(input: _SlashCommandStringOption | Omit<_SlashCommandStringOption, "setAutocomplete"> | Omit<_SlashCommandStringOption, "addChoice" | "addChoices"> | ((builder: _SlashCommandStringOption) => _SlashCommandStringOption | Omit<_SlashCommandStringOption, "setAutocomplete"> | Omit<_SlashCommandStringOption, "addChoice" | "addChoices">)): Omit<this, "addSubcommand" | "addSubcommandGroup"> {
// 			return super.addStringOption(input);
// 		}

// 		public override addUserOption(input: _SlashCommandUserOption | ((builder: _SlashCommandUserOption) => _SlashCommandUserOption)): Omit<this, "addSubcommand" | "addSubcommandGroup"> {
// 			return super.addUserOption(input);
// 		}
// 	}

// 	export class SlashCommandSubcommandGroupBuilder<T extends PuppyBotCommand.CommandStructure, G extends PuppyBotCommand.ValidSubCommandGroup<T>> extends _SlashCommandSubcommandGroupBuilder {
// 		public override setName(name: string & G): this {
// 			return this.setName(name);
// 		}

// 		public override addSubcommand<S extends PuppyBotCommand.ValidSubCommand<T, G>>(input: SlashCommandSubcommandBuilder<T, G, S> | ((subcommandGroup: SlashCommandSubcommandBuilder<T, G, S>) => SlashCommandSubcommandBuilder<T, G, S>)): this {
// 			return super.addSubcommand(input);
// 		}
// 	}

// 	export class SlashCommandSubcommandBuilder<T extends PuppyBotCommand.CommandStructure, G extends PuppyBotCommand.ValidSubCommandGroup<T> | undefined, S extends PuppyBotCommand.ValidSubCommand<T, G>> extends _SlashCommandSubcommandBuilder {
// 		public override setName(name: string & S): this {
// 			return this.setName(name);
// 		}

// 		public override addBooleanOption<O extends PuppyBotCommand.ValidOption<T, G, S>>(input: SlashCommandBooleanOption<T, G, S, O> | ((builder: SlashCommandBooleanOption<T, G, S, O>) => SlashCommandBooleanOption<T, G, S, O>)): this {
// 			return super.addBooleanOption(input);
// 		}

// 		public override addChannelOption<O extends PuppyBotCommand.ValidOption<T, G, S>>(input: _SlashCommandChannelOption | ((builder: _SlashCommandChannelOption) => _SlashCommandChannelOption)): this {
// 			return super.addChannelOption(input);
// 		}

// 		public override addIntegerOption<O extends PuppyBotCommand.ValidOption<T, G, S>>(input: _SlashCommandIntegerOption | Omit<_SlashCommandIntegerOption, "setAutocomplete"> | Omit<_SlashCommandIntegerOption, "addChoice" | "addChoices"> | ((builder: _SlashCommandIntegerOption) => _SlashCommandIntegerOption | Omit<_SlashCommandIntegerOption, "setAutocomplete"> | Omit<_SlashCommandIntegerOption, "addChoice" | "addChoices">)): this {
// 			return super.addIntegerOption(input);
// 		}

// 		public override addMentionableOption<O extends PuppyBotCommand.ValidOption<T, G, S>>(input: _SlashCommandMentionableOption | ((builder: _SlashCommandMentionableOption) => _SlashCommandMentionableOption)): this {
// 			return super.addMentionableOption(input);
// 		}

// 		public override addNumberOption<O extends PuppyBotCommand.ValidOption<T, G, S>>(input: _SlashCommandNumberOption | Omit<_SlashCommandNumberOption, "setAutocomplete"> | Omit<_SlashCommandNumberOption, "addChoice" | "addChoices"> | ((builder: _SlashCommandNumberOption) => _SlashCommandNumberOption | Omit<_SlashCommandNumberOption, "setAutocomplete"> | Omit<_SlashCommandNumberOption, "addChoice" | "addChoices">)): this {
// 			return super.addNumberOption(input);
// 		}

// 		public override addRoleOption<O extends PuppyBotCommand.ValidOption<T, G, S>>(input: _SlashCommandRoleOption | ((builder: _SlashCommandRoleOption) => _SlashCommandRoleOption)): this {
// 			return super.addRoleOption(input);
// 		}

// 		public override addStringOption<O extends PuppyBotCommand.ValidOption<T, G, S>>(input: SlashCommandStringOption<T, G, S, O> | Omit<SlashCommandStringOption<T, G, S, O>, "setAutocomplete"> | Omit<SlashCommandStringOption<T, G, S, O>, "addChoice" | "addChoices"> | ((builder: SlashCommandStringOption<T, G, S, O>) => SlashCommandStringOption<T, G, S, O> | Omit<SlashCommandStringOption<T, G, S, O>, "setAutocomplete"> | Omit<SlashCommandStringOption<T, G, S, O>, "addChoice" | "addChoices">)): this {
// 			return super.addStringOption(input);
// 		}

// 		public override addUserOption<O extends PuppyBotCommand.ValidOption<T, G, S>>(input: _SlashCommandUserOption | ((builder: _SlashCommandUserOption) => _SlashCommandUserOption)): this {
// 			return super.addUserOption(input);
// 		}
// 	}

// 	export interface SlashCommandSubcommandsOnlyBuilder<T extends PuppyBotCommand.CommandStructure, G extends PuppyBotCommand.ValidSubCommandGroup<T> | undefined, S extends PuppyBotCommand.ValidSubCommand<T, G> | undefined> extends _SlashCommandSubcommandsOnlyBuilder, SlashCommandBuilder<T> {

// 	}

// 	export class SlashCommandBooleanOption<T extends PuppyBotCommand.CommandStructure, G extends PuppyBotCommand.ValidSubCommandGroup<T> | undefined, S extends PuppyBotCommand.ValidSubCommand<T, G> | undefined, O extends PuppyBotCommand.ValidOption<T, G, S>> extends _SlashCommandBooleanOption {
// 		public override setName(name: string & O): this {
// 			return super.setName(name);
// 		}
// 	}

// 	export class SlashCommandStringOption<T extends PuppyBotCommand.CommandStructure, G extends PuppyBotCommand.ValidSubCommandGroup<T> | undefined, S extends PuppyBotCommand.ValidSubCommand<T, G> | undefined, O extends PuppyBotCommand.ValidOption<T, G, S>> extends _SlashCommandStringOption {
// 		public override setName(name: string & O): this {
// 			return super.setName(name);
// 		}
// 	}
// }