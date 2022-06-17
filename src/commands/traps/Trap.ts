import { SlashCommandBuilder } from "@discordjs/builders";
import { BattleTrapRecordType, BattleTrapState } from "@prisma/client";
import { ApplyOptions } from "@sapphire/decorators";
import type { ApplicationCommandRegistry, Args, ChatInputCommandContext } from "@sapphire/framework";
import { ButtonInteraction, CommandInteraction, Guild, InteractionReplyOptions, Message, MessageActionRow, MessageButton, MessageEmbed, MessagePayload, User } from "discord.js";
import { PuppyBotCommand } from "../../lib/structures/command/PuppyBotCommand";
import type { BattleSystem } from "../../lib/structures/managers/BattleSystem";
import { ClearPaginatedMessage } from "../../lib/structures/message/battleSystem/traps/clear/ClearPaginatedMessage";
import { CreateEmbed } from "../../lib/structures/message/battleSystem/traps/create/CreateEmbed";
import { ListEmbed } from "../../lib/structures/message/battleSystem/traps/list/ListEmbed";
import { ListHiddenPaginatedMessage } from "../../lib/structures/message/battleSystem/traps/list/ListHiddenPaginatedMessage";
import { ListPaginatedMessage } from "../../lib/structures/message/battleSystem/traps/list/ListPaginatedMessage";

const SHORT_DESCRIPTION = 'Create and manage traps triggered by other users.';
const DEFAULT_LIST_SIZE = 10;

@ApplyOptions<PuppyBotCommand.Options>({
    name: 'trap',
    aliases: [],
    description: SHORT_DESCRIPTION,
    detailedDescription: SHORT_DESCRIPTION + ' Examples:\n' +
        `\`!trap <phrase>\``,
    requiredUserPermissions: ['VIEW_CHANNEL'],
    requiredClientPermissions: ['VIEW_CHANNEL'],
    nsfw: false,
    runIn: 'GUILD_ANY',
    subCommands: [
        {
            input: 'list',
            output: 'messageRunList',
            type: 'method'
        },
        {
            input: 'create',
            output: 'messageRunCreate',
            type: 'method'
        },
        {
            input: 'clear',
            output: 'messageRunClear',
            type: 'method'
        },
        {
            input: 'disarm',
            output: 'messageRunDisarm',
            type: 'method'
        }
    ]
})
export class TrapCommand extends PuppyBotCommand {
    public override registerApplicationCommands(registry: ApplicationCommandRegistry) {
        this.registerSlashCommand(registry, new SlashCommandBuilder()
            .setName(this.name)
            .setDescription(this.description)
            .addSubcommandGroup((builder) =>
                builder
                    .setName('list')
                    .setDescription('Lists statistics about traps.')
                    .addSubcommand((builder) =>
                        builder
                            .setName('mine')
                            .setDescription('List your own traps.  Only you can see them.')
                    )
                    .addSubcommand((builder) =>
                        builder
                            .setName('untriggered')
                            .setDescription('List how many traps are currently active in the server.')
                    )
                    .addSubcommand((builder) =>
                        builder
                            .setName('top-traps')
                            .setDescription('List the top traps triggered in the server.')
                            .addIntegerOption((option) =>
                                option
                                    .setMinValue(1)
                                    .setMaxValue(100)
                                    .setName('amount')
                                    .setDescription('Enter the number of entries to fetch.')
                            )
                    )
                    .addSubcommand((builder) =>
                        builder
                            .setName('top-fails')
                            .setDescription('List the top traps that blew up their owners.')
                            .addIntegerOption((option) =>
                                option
                                    .setMinValue(1)
                                    .setMaxValue(100)
                                    .setName('amount')
                                    .setDescription('Enter the number of entries to fetch.')
                            )
                    )
            )
            .addSubcommand((builder) =>
                builder
                    .setName('create')
                    .setDescription('Create a new trap with a given trapped phrase.')
                    .addStringOption((option) =>
                        option
                            .setName('phrase')
                            .setDescription('Enter the phrase you want to trap.  Longer phrases do more damage.')
                            .setRequired(true)
                    )
            )
            .addSubcommand((builder) =>
                builder
                    .setName('clear')
                    .setDescription('Choose to clear any of your current trap.')
            )
            .addSubcommand((builder) =>
                builder
                    .setName('disarm')
                    .setDescription('Attempt to disarm a trap preemptively.')
                    .addStringOption((option) =>
                        option
                            .setName('phrase')
                            .setDescription('Enter the phrase you want to trap.  Longer phrases do more damage.')
                            .setRequired(true)
                    )
            )
        )
    }

    public override async chatInputRun(interaction: CommandInteraction, _context: ChatInputCommandContext) {
        var subCommandGroup = interaction.options.getSubcommandGroup(false);
        var subCommand = interaction.options.getSubcommand(true);
        var phrase = interaction.options.getString('phrase');
        var amount = interaction.options.getInteger('amount') ?? DEFAULT_LIST_SIZE;

        const guild = interaction.guild!;
        const user = interaction.user;

        this.run(interaction, guild, user, {
            subCommandGroup: subCommandGroup,
            subCommand: subCommand,
            phrase: phrase,
            amount: amount
        })
    }

    public async messageRunList(message: Message, args: Args) {
        const guild = message.guild!;
        const user = message.author;
        const option = args.getOption('amount');
        const rest = await args.restResult('string');
        const subCommand = rest.success ? rest.value : 'mine';

        var amount: number | undefined = undefined;
        if (option !== null) {
            try {
                amount = parseInt(option);
            } catch {
                this.error(`Unable to parse \`\`amount\`\`.  Please enter a valid number.`, option);
            }
        }

        this.run(message, guild, user, {
            subCommandGroup: 'list',
            subCommand: subCommand,
            amount: amount
        })
    }
    public async messageRunCreate(message: Message, args: Args) {
        const guild = message.guild!;
        const user = message.author;
        var phrase = args.getOption('phrase');

        this.run(message, guild, user, {
            subCommand: 'create',
            phrase: phrase,
        })
    }
    public async messageRunClear(message: Message, _args: Args) {
        const guild = message.guild!;
        const user = message.author;

        this.run(message, guild, user, {
            subCommand: 'clear',
        })
    }
    public async messageRunDisarm(message: Message, args: Args) {
        const guild = message.guild!;
        const user = message.author;
        var phrase = args.getOption('phrase');

        this.run(message, guild, user, {
            subCommand: 'disarm',
            phrase: phrase,
        })
    }

    public async run(messageOrInteraction: Message | CommandInteraction
        , guild: Guild
        , user: User
        , args: {
            subCommandGroup?: string | null,
            subCommand?: string | null,
            phrase?: string | null,
            amount?: number | null
        }) {
        if (args.subCommandGroup === 'list') {
            if (args.subCommand === 'mine') {
                await this.handleListMine(messageOrInteraction, guild, user);
            } else if (args.subCommand === 'untriggered') {
                await this.handleListUntriggered(messageOrInteraction, guild);
            } else if (args.subCommand === 'top-traps' || args.subCommand === 'top traps') {
                await this.handleListTopTraps(messageOrInteraction, guild, args.amount);
            } else if (args.subCommand === 'top-fails' || args.subCommand === 'top fails') {
                await this.handleListTopFails(messageOrInteraction, guild, args.amount);
            }
        } else {
            if (args.subCommand === 'create') {
                if (!args.phrase) this.error(`No argument \`\`phrase\`\` found.`, args)
                await this.handleCreate(messageOrInteraction, guild, user, args.phrase);
            } else if (args.subCommand === 'clear') {
                await this.handleClear(messageOrInteraction, guild, user);
            } else if (args.subCommand === 'disarm') {
                if (!args.phrase) this.error(`No argument \`\`phrase\`\` found.`, args)
                await this.handleDisarm(messageOrInteraction, guild, user, args.phrase!);
            }
        }
    }

    public async handleListMine(messageOrInteraction: Message | CommandInteraction, guild: Guild, user: User) {
        return this.handleClear(messageOrInteraction, guild, user);
        // if (messageOrInteraction instanceof Message) {
        //     messageOrInteraction = await user.send({
        //         content: `Trap Information Below: `
        //     })
        // } else {
        //     messageOrInteraction = await messageOrInteraction.deferReply({
        //         fetchReply: true
        //     }) as Message;
        // }

        // const battleUser = await guild.battleSystem.generateBattleUser(user.id);

        // const paginatedMessage = new CheckPaginatedMessage({
        //     battleUser: battleUser,
        //     guild: guild,
        // })

        // await paginatedMessage.run(messageOrInteraction, user);
    }

    public async handleListUntriggered(messageOrInteraction: Message | CommandInteraction, guild: Guild, amount?: number | null) {
        if (!amount) {
            amount = DEFAULT_LIST_SIZE;
        }

        if (messageOrInteraction instanceof Message) {
            messageOrInteraction = await messageOrInteraction.channel.send({
                content: `Hinting at active traps in the server:`
            })
        } else {
            await messageOrInteraction.deferReply({
            });
        }

        const paginatedMessage = new ListHiddenPaginatedMessage({
            guild: guild,
            recordSorter: ((a: BattleSystem.Trap.Record.Instance, b: BattleSystem.Trap.Record.Instance) =>
                b.getTrap().damage() - a.getTrap().damage()
            ),
            recordFilter: ((record) => record.type === BattleTrapRecordType.Create && record.getTrap().state === BattleTrapState.Armed),
        } as ListHiddenPaginatedMessage.Options)

        await paginatedMessage.run(messageOrInteraction);
    }

    /**
     * Displays the top number of traps that have fired on this server, sorted by damage.
     * @param messageOrInteraction The message or interaction to reply to.
     * @param guild Guild that this command was invoked from.
     * @param amount The amount of entries to fetch.
     */
    public async handleListTopTraps(messageOrInteraction: Message | CommandInteraction, guild: Guild, amount?: number | null) {
        if (!amount) {
            amount = DEFAULT_LIST_SIZE;
        }

        if (messageOrInteraction instanceof Message) {
            messageOrInteraction = await messageOrInteraction.channel.send({
                content: `Showing the top ${amount} traps by damage: `
            })
        } else {
            await messageOrInteraction.deferReply({
            });
        }

        type TriggerPayload = BattleSystem.Trap.Record.Payload.Trigger;

        const paginatedMessage = new ListPaginatedMessage({
            guild: guild,
            recordSorter: ((a: BattleSystem.Trap.Record.Instance, b: BattleSystem.Trap.Record.Instance) =>
                (b.payload as TriggerPayload).damage.total - (a.payload as TriggerPayload).damage.total),
            recordFilter: ((record) => record.type === BattleTrapRecordType.Trigger &&
                (record.payload as TriggerPayload).victim.userId !== (record.payload as TriggerPayload).owner.userId
            ),
        } as ListPaginatedMessage.Options)

        await paginatedMessage.run(messageOrInteraction);
    }

    public async handleListTopFails(messageOrInteraction: Message | CommandInteraction, guild: Guild, amount?: number | null) {
        if (!amount) {
            amount = DEFAULT_LIST_SIZE;
        }

        if (messageOrInteraction instanceof Message) {
            messageOrInteraction = await messageOrInteraction.channel.send({
                content: `Showing the top ${amount} traps that misfired: `
            })
        } else {
            await messageOrInteraction.deferReply({
            });
        }

        type TriggerPayload = BattleSystem.Trap.Record.Payload.Trigger;

        const paginatedMessage = new ListPaginatedMessage({
            guild,
            recordSorter: ((a: BattleSystem.Trap.Record.Instance, b: BattleSystem.Trap.Record.Instance) =>
                (b.payload as TriggerPayload).damage.total -
                (a.payload as TriggerPayload).damage.total),
            recordFilter: ((record) => record.type === BattleTrapRecordType.Trigger &&
                (record.payload as TriggerPayload).victim.userId === (record.payload as TriggerPayload).owner.userId
            )
        } as ListPaginatedMessage.Options)

        await paginatedMessage.run(messageOrInteraction);
    }

    public async handleCreate(messageOrInteraction: Message | CommandInteraction, guild: Guild, user: User, phrase: string) {
        let followUp: (options: string | MessagePayload | InteractionReplyOptions) => Promise<any>;
        if (messageOrInteraction instanceof Message) {
            messageOrInteraction = await user.send({
                content: `Generating embed...`
            })

            followUp = async (options) => (messageOrInteraction as Message).edit(options);
        } else {
            await messageOrInteraction.deferReply({
                ephemeral: true
            });
            followUp = async (options) => (messageOrInteraction as CommandInteraction).editReply(options);
        }

        const abilityAttempt = await guild.battleSystem.checkAttemptTrap(user)

        if (abilityAttempt.error) {
            await followUp({
                ephemeral: true,
                content: abilityAttempt.error
            })
            return;
        }

        const trap = await guild.battleSystem.createTrap(messageOrInteraction, user, phrase.toLowerCase());
        const embed = new CreateEmbed({
            trap: trap
        });

        await followUp({ embeds: [embed] });
    }

    public async handleClear(messageOrInteraction: Message | CommandInteraction, guild: Guild, user: User) {
        const battleUser = await guild.battleSystem.generateBattleUser(user);

        if (battleUser.getActiveTraps().size === 0) {
            const embed = new MessageEmbed({
                title: `No traps found.`,
                description: `No traps were found for this user.  Please create a trap using the \`\`/trap create\`\` command.`
            });

            if (messageOrInteraction instanceof Message) {
                await messageOrInteraction.author.send({
                    embeds: [embed]
                });
            } else {
                await messageOrInteraction.reply({
                    ephemeral: true,
                    embeds: [embed]
                })
            }
            return;
        }

        let followUp: (options: string | MessagePayload | InteractionReplyOptions) => Promise<any>;
        if (messageOrInteraction instanceof Message) {
            messageOrInteraction = await messageOrInteraction.author.send({
                content: `Generating embed...`,
            })
            followUp = async (options) => (messageOrInteraction as Message).edit(options);
        } else {
            // Sending to a user here instead of ephemeral since ephemeral breaks.
            await messageOrInteraction.deferReply({
                ephemeral: true,
            })
            followUp = async (options) => (messageOrInteraction as CommandInteraction).editReply(options);
        }

        if (battleUser.getActiveTraps().size === 1) {
            const trap = battleUser.getActiveTraps().first()!;
            var message: Message = await followUp({
                embeds: [
                    new ListEmbed({
                        record: trap.records.first()!
                    })
                ],
                components: [
                    new MessageActionRow()
                        .addComponents(
                            new MessageButton(ClearPaginatedMessage.clearAction)
                        )
                ]
            });
            message.createMessageComponentCollector({
                filter: (interaction) => interaction.customId === ClearPaginatedMessage.clearAction.customId && interaction.user.id === user.id,
                dispose: true,
            })
                .addListener('collect', async (interaction: ButtonInteraction) => {
                    await guild.battleSystem.removeTrap(message, trap);

                    await interaction.update({
                        embeds: [
                            new ListEmbed({
                                record: guild.battleSystem.trapRecords
                                    .filter(record => record.trapId === trap.id && record.type === BattleTrapRecordType.Remove).first()!
                            })
                        ],
                        components: []
                    })
                })
        } else {
            const paginatedMessage = new ClearPaginatedMessage({
                guild,
                user,
            })
            await paginatedMessage.run(messageOrInteraction, user);

            // Doing this to automatically instigate a component, thereby allowing ephemeral message.
            // This is hacky and awful and I hate it.
            // await (paginatedMessage.response as Message).createMessageComponentCollector({
            //     componentType: Constants.MessageComponentTypes.SELECT_MENU,
            //     filter: (interaction) => interaction.customId === InteractionIds.GoToPage
            // }).addListener('collected', async (interaction: SelectMenuInteraction) => {
            //     if (interaction.isSelectMenu() && interaction.customId === InteractionIds.GoToPage) {
            // 		paginatedMessage.index = parseInt(interaction.values[0], 10);
            // 	}
            // })

            // this.container.client.emit('interactionCreate', new SelectMenuInteraction(this.container.client, {
            //     custom_id: InteractionIds.GoToPage,
            //     component_type: 3,
            //     values: ['1'],
            // }))
        }
    }

    public async handleDisarm(messageOrInteraction: Message | CommandInteraction, guild: Guild, user: User, phrase: string) {
        let followUp: (options: string | MessagePayload | InteractionReplyOptions) => Promise<any>;
        if (messageOrInteraction instanceof Message) {
            messageOrInteraction = await messageOrInteraction.channel.send({
                content: `Generating embed...`
            })

            followUp = async (options) => (messageOrInteraction as Message).reply(options);
        } else {
            await messageOrInteraction.deferReply({
            });
            followUp = async (options) => (messageOrInteraction as CommandInteraction).editReply(options);
        }

        const matchedTraps = guild.battleSystem.traps.filter((trap) => trap.state === BattleTrapState.Armed && trap.phrase === phrase.toLowerCase())

        if (matchedTraps.size > 0) {
            let recordIds: string[] = [];

            for (const [, trap] of matchedTraps) {
                let record: BattleSystem.Trap.Record.Instance;
                if (trap.getBattleUser().userId === user.id) {
                    record = await guild.battleSystem.removeTrap(messageOrInteraction, trap);
                } else {
                    record = await guild.battleSystem.disarmTrap(messageOrInteraction, trap);
                }
                recordIds.push(record.id);
            }

            const paginatedMessage = new ListPaginatedMessage({
                guild: guild,
                recordFilter: (record) => recordIds.indexOf(record.id) !== -1,
                recordSorter: (a, b) => recordIds.indexOf(a.id) - recordIds.indexOf(b.id),
            });

            paginatedMessage.run(messageOrInteraction, user);
        } else {
            await followUp({
                content: `You failed to disarm any traps.`,
            });
        }
    }
}