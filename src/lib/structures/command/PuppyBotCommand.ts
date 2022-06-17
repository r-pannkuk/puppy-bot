import { ContextMenuCommandBuilder, SlashCommandBuilder, SlashCommandOptionsOnlyBuilder, SlashCommandSubcommandsOnlyBuilder } from "@discordjs/builders";
import { ApplicationCommandRegistry, Command, CommandOptionsRunTypeEnum, RegisterBehavior, UserError } from "@sapphire/framework";
import { SubCommandPluginCommand } from "@sapphire/plugin-subcommands";
import { Time } from "@sapphire/time-utilities";
import { Channel, ChatInputApplicationCommandData, CommandInteraction, ContextMenuInteraction, Guild, GuildMember, Message, MessageApplicationCommandData, MessagePayload, ReplyMessageOptions, Role, User, UserApplicationCommandData } from "discord.js";
import { envParseArray, envParseString } from "../../env/utils";

export const SLASH_ID_HINTS: Record<string, string> = {
    // Admin
    add: '982860770301841419',
    emojiusage: '982860771937648660',
    set: '982860772940070952',
    customcommand: '982860774038995024',
    error: '981503890765803541',
    ping: '981503980326752267',

    // Games
    awbw: '982860775062380614',

    // Memes
    correct: '981503891462029372',
    omedetou: '981503892426731620',
    duwang: '981503893445967924',
    sylphie: '981503894121242654',
    kinzo: '981503977357197313',
    magneto: '981503978988793946',
    superturn: '981503979844427786',

    // Music
    pause: '982860857656614932',
    play: '982860858608742480',
    resume: '982860859716010044',
    skip: '982860860689092639',
    stop: '982860861846749234',

    // Remind
    reminder: '982856607497089054',

    // RNG
    roll: '981504064586137670',
    groups: '981504065647296542',

    // BattleSystem
    trap: '982860944684236830',
}

export const CONTEXT_MENU_ID_HINTS: Record<string, string> = {
    'Track Emoji Usage': '978251479381065750',
    'Meme - Kinzo Whining': '978251481033605170',
}

export abstract class PuppyBotCommand extends SubCommandPluginCommand {
    public readonly guarded: Boolean;
    public readonly hidden: Boolean;

    public constructor(context: Command.Context, options: PuppyBotCommand.Options) {
        super(context, {
            cooldownDelay: 10 * Time.Second,
            cooldownLimit: 2,
            cooldownFilteredUsers: envParseArray("CLIENT_OWNERS"),
            generateDashLessAliases: true,
            ...options,
        });

        this.guarded = options.guarded ?? false;
        this.hidden = options.hidden ?? false;
    }

    public registerSlashCommand(registry: ApplicationCommandRegistry, slashBuilder?: ChatInputApplicationCommandData | SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder | SlashCommandOptionsOnlyBuilder | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'> | ((builder: SlashCommandBuilder) => SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder | SlashCommandOptionsOnlyBuilder | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>)) {
        if (!slashBuilder) {
            slashBuilder = new SlashCommandBuilder()
                .setName(this.name)
                .setDescription(this.description)
        }

        registry.registerChatInputCommand(slashBuilder, {
            behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
            guildIds: (!this.options?.runIn || this.options?.runIn?.includes(CommandOptionsRunTypeEnum.Dm)) ? undefined : [envParseString("DEV_GUILD_ID")],
            idHints: (slashBuilder.name in SLASH_ID_HINTS) ? [SLASH_ID_HINTS[slashBuilder.name]] : undefined,
        })
    }

    public registerContextMenuCommand(registry: ApplicationCommandRegistry, contextBuilder: UserApplicationCommandData | MessageApplicationCommandData | ContextMenuCommandBuilder | ((builder: ContextMenuCommandBuilder) => ContextMenuCommandBuilder)) {
        registry.registerContextMenuCommand(contextBuilder, {
            behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
            guildIds: (this.options?.runIn?.includes(CommandOptionsRunTypeEnum.Dm)) ? undefined : [envParseString('DEV_GUILD_ID')],
            idHints: (contextBuilder.name in CONTEXT_MENU_ID_HINTS) ? [CONTEXT_MENU_ID_HINTS[contextBuilder.name]] : undefined
        })
    }

    protected error(identifier: string | UserError, context?: unknown): never {
        throw typeof identifier === 'string' ? new UserError({ identifier, context }) : identifier;
    }

    protected async generateFollowUp(messageOrInteraction: Message | CommandInteraction | ContextMenuInteraction):
        Promise<(options: string | MessagePayload | ReplyMessageOptions) => Promise<Message<boolean>>> {
        if (messageOrInteraction instanceof Message) {
            messageOrInteraction = await messageOrInteraction.channel.send({
                content: `Generating embed...`
            })

            return async (options: string | MessagePayload | ReplyMessageOptions) => (messageOrInteraction as Message).reply(options);
        } else {
            if(!messageOrInteraction.replied) {
                await messageOrInteraction.deferReply({
                });
            }
            return async (options: string | MessagePayload | ReplyMessageOptions) => (messageOrInteraction as CommandInteraction).editReply(options) as Promise<Message<boolean>>;
        }
    }
}

export namespace PuppyBotCommand {
    export type Options = SubCommandPluginCommand.Options & {
        guarded?: boolean;
        hidden?: boolean;
    }

    export type Context = Command.Context;

    export interface CommandStructure { }

    // interface testCommandStructure {
    //     'group': {
    //         'sub-command1': {
    //             'option1.1': string,
    //             'option1.2': number,
    //         },
    //         'sub-command3': {
    //             'option3.1': number,
    //             'option3.2': string,
    //         }
    //     },
    //     'sub-command2': {
    //         'option2.1': string
    //         'option2.2': number
    //     },
    //     'option3.1': boolean,
    //     'option4.1': string
    // }

    export type ParameterType = boolean | Channel | number | Role | User | GuildMember | string | undefined | null | Array<any>;

    export type ValidSubCommandGroup<T extends CommandStructure> = keyof T
    export type ValidSubCommand<T extends CommandStructure, G extends ValidSubCommandGroup<T> | undefined = undefined> =
        (
            G extends ValidSubCommandGroup<T>
            ? keyof T[G]
            : {
                [s in keyof T]: T[s] extends object
                ? ({
                    [o in keyof T[s]]: T[s][o] extends ParameterType ? s : never
                }[keyof T[s]]) | (s extends {} ? s : never)
                : never
            }[keyof T]
        );
    export type ValidOption<T extends CommandStructure, G extends ValidSubCommandGroup<T> | undefined = undefined, S extends ValidSubCommand<T, G> | undefined = undefined> =
        (
            G extends ValidSubCommandGroup<T>
            ? (
                S extends ValidSubCommand<T, G>
                ? {
                    [k in keyof T[G]]: k extends S ? keyof T[G][k] : never
                }[keyof T[G]]
                : never
            ) : (
                S extends ValidSubCommand<T>
                ? {
                    [k in keyof T]: k extends S ? keyof T[k] : never
                }[keyof T]
                : (
                    S extends undefined
                    ? {
                        [k in keyof T]: T[k] extends ParameterType ? k : never
                    }[keyof T]
                    : never
                )
            )
        );
    export type ValidOptionType<T extends CommandStructure, G extends ValidSubCommandGroup<T> | undefined = undefined, S extends ValidSubCommand<T, G> | undefined = undefined, O extends ValidOption<T, G, S> | undefined = undefined> =
        G extends ValidSubCommandGroup<T> // G is a valid SubCommandGroup
        ? {
            [g in keyof T]: g extends G
            ? {
                [s in keyof T[g]]: s extends S
                ? {
                    [o in keyof T[g][s]]: o extends O ? T[g][s][o] : never
                }[keyof T[g][s]]
                : never
            }[keyof T[g]]
            : never
        }[keyof T]
        :
        S extends ValidSubCommand<T> // S is a valid SubCommand
        ? {
            [s in keyof T]: s extends S
            ? {
                [o in keyof T[s]]: o extends O ? T[s][o] : never
            }[keyof T[s]]
            : never
        }[keyof T]
        : {
            [o in keyof T]: o extends O ? T[o] : never
        }[keyof T]

    export type CommandOptions<T extends CommandStructure, G extends ValidSubCommandGroup<T> | undefined = undefined, S extends ValidSubCommand<T, G> | undefined = undefined> =
        {
            [o in ValidOption<T, G, S>]: ValidOptionType<T, G, S, o>
        }

    export interface Args<
        T extends PuppyBotCommand.CommandStructure,
        G extends PuppyBotCommand.ValidSubCommandGroup<T> | undefined = undefined,
        S extends PuppyBotCommand.ValidSubCommand<T, G> | undefined = undefined,
    > {
        messageOrInteraction: Message | CommandInteraction,
        subCommandGroup?: G | null,
        subCommand?: S | null,
        guild?: Guild | null,
        user: User,
        options: PuppyBotCommand.CommandOptions<T, G, S>
    }

}