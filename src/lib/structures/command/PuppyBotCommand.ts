import { ApplicationCommandRegistryRegisterOptions, Command, RegisterBehavior, UserError } from "@sapphire/framework";
import { Subcommand } from "@sapphire/plugin-subcommands";
import { Time } from "@sapphire/time-utilities";
import { Channel, CommandInteraction, Guild, GuildMember, Message, MessagePayload, Role, User, InteractionEditReplyOptions, ChatInputCommandInteraction, ContextMenuCommandInteraction, MessageReplyOptions } from "discord.js";
import { envParseArray, envParseString } from "../../env/utils";

export const SLASH_ID_HINTS: Record<string, string[]> = {
    // Admin
    add: ['987672065626742834', '987664877751517194',],
    emojiusage: ['987672066960531546', '987664878762356806',],
    set: ['987672070378901524', '987664880997896192',],
    customcommand: ['987672073075851324', '987664882050678794',],
    error: ['987664183111847986', '987664883006963722',],
    ping: ['987664272400195675', '987665053945847858',],

    // Games
    awbw: ['987672152780206110', '987664964653285386',],

    // Memes
    correct: ['987664184093319178', '987664965609607188',],
    omedetou: ['987664184907022366', '987664966146465794',],
    duwang: ['987664185599078440', '987664967249559602',],
    sylphie: ['987664186396012584', '987664968008732672',],
    kinzo: ['987664270009434112', '987664968897945670',],
    magneto: ['987664270646976524', '987664971137695794',],
    superturn: ['987664271846572062', '987664972207251466',],
    liar: ['1271278210482700309', '1271278210482700309'],

    // Music
    pause: ['987672155665891348', '987664973054476398',],
    play: ['987672156789940224', '987664974279229460',],
    resume: ['987672157830148142', '987664975331991572',],
    skip: ['987672239786823700', '987665051718676480',],
    stop: ['987672240311111691', '987665052867891230',],

    // Remind
    reminder: ['987664273624936449', '987665054927294504',],

    // RNG
    roll: ['987664357322289192', '987665056760201287',],
    groups: ['987664358588969010', '987665057947209758',],

    // BattleSystem
    trap: ['987672241842049044', '987665058979020840',],
}

export const CONTEXT_MENU_ID_HINTS: Record<string, string[]> = {
    'Track Emoji Usage': ['987672068281757726', '987664879873847336',],
    'Meme - Kinzo Whining': ['987672154021703730', '987664969283817532',],
    'Meme - Liar': ['1271278210608529461', '1271278210608529461',],
}

export abstract class PuppyBotCommand extends Subcommand {
    public readonly guarded: Boolean;
    public readonly hidden: Boolean;

    protected slashCommandOptions: ApplicationCommandRegistryRegisterOptions = {
        behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
        guildIds: (!this.options?.runIn /* || this.options?.runIn?.includes(CommandOptionsRunTypeEnum.Dm) */) ? undefined : [envParseString("DEV_GUILD_ID")],
        idHints: (this.name in SLASH_ID_HINTS) ? SLASH_ID_HINTS[this.name] : undefined,
    }

    protected contextCommandOptions: ApplicationCommandRegistryRegisterOptions = {
        behaviorWhenNotIdentical: RegisterBehavior.Overwrite,
        guildIds: /*(this.options?.runIn?.includes(CommandOptionsRunTypeEnum.Dm)) ? undefined : */ [envParseString('DEV_GUILD_ID')],
        idHints: (this.name in CONTEXT_MENU_ID_HINTS) ? CONTEXT_MENU_ID_HINTS[this.name] : undefined
    }

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

    protected error(identifier: string | UserError, context?: unknown): never {
        throw typeof identifier === 'string' ? new UserError({ identifier, context }) : identifier;
    }

    protected async generateFollowUp(messageOrInteraction: Message | ChatInputCommandInteraction | ContextMenuCommandInteraction) {
        if (messageOrInteraction instanceof Message) {
            messageOrInteraction = await messageOrInteraction.channel.send({
                content: `Generating embed...`
            })

            return async (options: string | MessagePayload | MessageReplyOptions) => {
                const reply = await (messageOrInteraction as Message).reply(options);
                await messageOrInteraction.channel?.messages.cache.get(messageOrInteraction.id)?.delete();
                return reply;
            };
        } else {
            if (!messageOrInteraction.replied) {
                await messageOrInteraction.deferReply({
                });
            }
            return async (options: string | MessagePayload | InteractionEditReplyOptions) => (messageOrInteraction as CommandInteraction).editReply(options);
        }
    }
}

export namespace PuppyBotCommand {
    export type Options = Subcommand.Options & {
        guarded?: boolean;
        hidden?: boolean;
    }

    export type Context = Command.Context;

    export interface CommandStructure { }

    export type ParameterType = boolean | Channel | number | Role | User | GuildMember | string | undefined | null | Array<any>;

    export type ValidSubCommandGroup<T extends CommandStructure> = {
        [g in keyof T]: T[g] extends SubCommandNoOptions
        ? never
        : (T[g] extends object
            ? ({
                [s in keyof T[g]]: T[g][s] extends object
                ? ({
                    [o in keyof T[g][s]]: T[g][s][o] extends ParameterType ? g : never
                }[keyof T[g][s]]) : never
            }[keyof T[g]])
            : never
        )
    }[keyof T];

    export type SubCommandNoOptions = Record<string, never>

    export type ValidSubCommand<
        T extends CommandStructure,
        G extends (ValidSubCommandGroup<T> | undefined) = undefined
    > =
        (
            G extends undefined
            ?
            {
                [s in keyof T]: T[s] extends object
                ? ({
                    [o in keyof T[s]]: T[s][o] extends ParameterType ? s : never
                }[keyof T[s]])
                : T[s] extends SubCommandNoOptions ? s : never
            }[keyof T]
            :
            {
                [g in keyof T]: g extends G ? (
                    {
                        [s in keyof T[g]]: T[g][s] extends object
                        ? ({
                            [o in keyof T[g][s]]: T[g][s][o] extends ParameterType ? s : never
                        }[keyof T[g][s]])
                        : T[g][s] extends SubCommandNoOptions ? s : never
                    }[keyof T[g]]
                ) : never
            }[keyof T]
        );

    export type ValidOption<
        T extends CommandStructure,
        G extends ValidSubCommandGroup<T> | undefined = undefined,
        S extends ValidSubCommand<
            T,
            G
        > | undefined = undefined
    > =
        S extends undefined
        ?
        {
            [o in keyof T]: T[o] extends ParameterType ? o : never
        }[keyof T]
        :
        (
            G extends undefined
            ?
            {
                [s in keyof T]: s extends S
                ? {
                    [o in keyof T[s]]: T[s][o] extends ParameterType ? o : never
                }[keyof T[s]]
                : never
            }[keyof T]
            :
            {
                [g in keyof T]: g extends G ? (
                    {
                        [s in keyof T[g]]: s extends S
                        ? ({
                            [o in keyof T[g][s]]: T[g][s][o] extends ParameterType ? o : never
                        }[keyof T[g][s]])
                        : never
                    }[keyof T[g]]
                ) : never
            }[keyof T]
        )

    export type ValidOptionType<
        T extends CommandStructure,
        G extends ValidSubCommandGroup<T> | undefined = undefined,
        S extends ValidSubCommand<T, G> | undefined = undefined,
        O extends ValidOption<T, G, S> | undefined = undefined
    > =
        S extends undefined
        ?
        {
            [o in keyof T]: o extends O ? T[o] : never
        }[keyof T]
        :
        (
            G extends undefined
            ?
            {
                [s in keyof T]: s extends S
                ? {
                    [o in keyof T[s]]: o extends O ? T[s][o] : never
                }[keyof T[s]]
                : never
            }[keyof T]
            :
            {
                [g in keyof T]: g extends G ? (
                    {
                        [s in keyof T[g]]: s extends S
                        ? ({
                            [o in keyof T[g][s]]: o extends O ? T[g][s][o] : never
                        }[keyof T[g][s]])
                        : never
                    }[keyof T[g]]
                ) : never
            }[keyof T]
        )

    export type CommandOptions<
        T extends CommandStructure,
        G extends ValidSubCommandGroup<T> | undefined = undefined,
        S extends ValidSubCommand<T, G> | undefined = undefined
    > =
        {
            [o in ValidOption<T, G, S>]: ValidOptionType<T, G, S, o>
        }

    export interface Args<
        T extends PuppyBotCommand.CommandStructure,
        G extends PuppyBotCommand.ValidSubCommandGroup<T> | undefined = undefined,
        S extends PuppyBotCommand.ValidSubCommand<T, G> | undefined = undefined,
    > {
        messageOrInteraction: Message | ChatInputCommandInteraction,
        guild?: Guild | null,
        user: User,
        options: PuppyBotCommand.CommandOptions<T, G, S>
    }

    // interface testCommandStructure {
    //     'group': {
    //         'sub-command1': {
    //             'option1.1': string,
    //             'option1.2': number,
    //         },
    //         'sub-command2': {
    //             'option2.1': number,
    //             'option2.2': string,
    //         }
    //     },
    //     'sub-command3': {
    //         'option3.1': string
    //         'option3.2': number
    //     },
    //     'sub-command4': {
    //         'option4.1': boolean
    //         'option4.2': number
    //     },
    //     'sub-command-no-options': SubCommandNoOptions,
    //     'option5.1': boolean,
    //     'option6.1': string
    // }

    // var TestSubCommandGroup: ValidSubCommandGroup<testCommandStructure>;
    // var TestSubCommandGroupDefined: ValidSubCommand<testCommandStructure, 'group'>;
    // var TestSubCommandGroupUndefined: ValidSubCommand<testCommandStructure, undefined>;
    // var TestOption1: ValidOption<testCommandStructure, 'group', 'sub-command1'>;
    // var TestOption2: ValidOption<testCommandStructure, 'group', 'sub-command2'>;
    // var TestOption3: ValidOption<testCommandStructure, undefined, 'sub-command3'>;
    // var TestOption4: ValidOption<testCommandStructure, undefined, 'sub-command4'>;
    // var TestOptionNone: ValidOption<testCommandStructure, undefined, 'sub-command-no-options'>;
    // var TestOptionType1_1: ValidOptionType<testCommandStructure, 'group', 'sub-command1', 'option1.1'>;
    // var TestOptionType1_2: ValidOptionType<testCommandStructure, 'group', 'sub-command1', 'option1.2'>;
    // var TestOptionType2_1: ValidOptionType<testCommandStructure, 'group', 'sub-command2', 'option2.1'>;
    // var TestOptionType2_2: ValidOptionType<testCommandStructure, 'group', 'sub-command2', 'option2.2'>;
    // var TestOptionType3_1: ValidOptionType<testCommandStructure, undefined, 'sub-command3', 'option3.1'>;
    // var TestOptionType3_2: ValidOptionType<testCommandStructure, undefined, 'sub-command3', 'option3.2'>;
    // var TestOptionType4_1: ValidOptionType<testCommandStructure, undefined, 'sub-command4', 'option4.1'>;
    // var TestOptionType4_2: ValidOptionType<testCommandStructure, undefined, 'sub-command4', 'option4.2'>;
    // var TestOptionTypeNone: ValidOptionType<testCommandStructure, undefined, 'sub-command-no-options', undefined>;
    // var TestOptionType5: ValidOptionType<testCommandStructure, undefined, undefined, 'option5.1'>;
    // var TestOptionType6: ValidOptionType<testCommandStructure, undefined, undefined, 'option6.1'>;
    // var TestCommandOption1: CommandOptions<testCommandStructure, 'group', 'sub-command1'>;
    // var TestCommandOption2: CommandOptions<testCommandStructure, 'group', 'sub-command2'>;
    // var TestCommandOption3: CommandOptions<testCommandStructure, undefined, 'sub-command3'>;
    // var TestCommandOption4: CommandOptions<testCommandStructure, undefined, 'sub-command4'>;
    // var TestCommandOptionNone: CommandOptions<testCommandStructure, undefined, 'sub-command-no-options'>;
    // var TestCommandOptionBase: CommandOptions<testCommandStructure, undefined, undefined>;
    // var TestArgs: Args<testCommandStructure, 'group', 'sub-command2'>;
    
    // assert(TestSubCommandGroup = 'group');
    // assert(TestSubCommandGroupDefined = 'sub-command1');
    // assert(TestSubCommandGroupDefined = 'sub-command2');
    // assert(TestSubCommandGroupUndefined = 'sub-command3');
    // assert(TestSubCommandGroupUndefined = 'sub-command4');
    // assert(TestSubCommandGroupUndefined = 'sub-command-no-options');
    // assert(TestOption1 = 'option1.1');
    // assert(TestOption1 = 'option1.2');
    // assert(TestOption2 = 'option2.1');
    // assert(TestOption2 = 'option2.2');
    // assert(TestOption3 = 'option3.1');
    // assert(TestOption3 = 'option3.2');
    // assert(TestOption4 = 'option4.1');
    // assert(TestOption4 = 'option4.2');
    // assert(TestOptionNone = 'never')
    // assert(TestOptionType1_1 = 'string');
    // assert(TestOptionType1_2 = 1.0);
    // assert(TestOptionType2_1 = 1.0);
    // assert(TestOptionType2_2 = 'string');
    // assert(TestOptionType3_1 = 'string');
    // assert(TestOptionType3_2 = 1.0);
    // assert(TestOptionType4_1 = false);
    // assert(TestOptionType4_2 = 1.0);
    // assert(TestOptionType5 = true);
    // assert(TestOptionType6 = 'string');
    // assert(TestCommandOption1 = {
    //     "option1.1": "test",
    //     "option1.2": 1.0,
    // });
    // assert(TestCommandOption2 = {
    //     "option2.1": 1.0,
    //     "option2.2": "test",
    // });
    // assert(TestCommandOption3 = {
    //     "option3.1": "test",
    //     "option3.2": 1.0,
    // });
    // assert(TestCommandOption4 = {
    //     "option4.1": false,
    //     "option4.2": 1.0,
    // });
    // assert(TestCommandOptionNone = {

    // });
    // assert(TestCommandOptionBase = {
    //     "option5.1": true,
    //     "option6.1": "test"
    // });

    // assert(TestArgs = {
    //     messageOrInteraction: Message.prototype,
    //     guild: Guild.prototype,
    //     user: User.prototype,
    //     options: {
    //         "option2.1": 1.0,
    //         "option2.2": "test"
    //     }
    // })
}