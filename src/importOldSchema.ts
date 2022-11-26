import { BattleTrap, BattleTrapRecord, BattleTrapRecordType, BattleTrapState, BattleUser, CustomCommand, Prisma, PrismaClient, Reminder, ReminderEvent, ReminderEventType, ReminderSchedule, ReminderTargetType, } from '@prisma/client';
const transform = require('jsonpath-object-transform');

const GUILD_ID = '319291359376703488';

interface UserTemplate {
	stats: {
		experience: number,
		health: number,
		energy: number,
	},
	info: {
		createdAt: string,
		lastEditedAt: string,
	},
	userId: string,
	guildId: string,
	battleTraps: TrapTemplate[],
}

const UserTemplate = {
	stats: {
		experience: "$._stats._experience",
		health: "$._stats._health",
		energy: "$._stats._energy",
	},
	info: {
		createdAt: "$._createdAt",
		lastEditedAt: "$._lastEdited",
	},
	userId: "$._id",
	battleTraps: [],
}

interface TrapTemplate {
	phrase: string,
	createdAt: string,
	state: string,
	records: Omit<Omit<BattleTrapRecord, 'id'>, 'trapId'>[],
}

const TrapTemplate = {
	phrase: "$._phrase",
	createdAt: "$._createdAt",
	state: "$._firedAt",
	records: [],
}


// interface CreatePayloadTemplate {
// 	config: {
// 		version: string,
// 	},
// 	damage: {
// 		baseDamage: number,
// 		durationDamage: number,
// 		numCharactersDamage: number,
// 		wordDamage: number,
// 	},
// 	owner: {
// 		battleUserId: string,
// 		energy: number,
// 		experience: number,
// 		health: number,
// 		userId: string,
// 	},
// 	invocation: {
// 		channelId: string,
// 		messageId: string,
// 		type: string,
// 		interactionid: string,
// 	},
// 	experience: {
// 		base: number,
// 		bonus: number,
// 	}
// }

// interface RemovePayloadTemplate extends CreatePayloadTemplate {
// 	createdAt: string,
// 	duration: number,
// 	removedAt: string,
// }

// interface TriggerPayloadTemplate extends CreatePayloadTemplate {
// 	createdAt: string,
// 	duration: number,
// 	trigger: {
// 		channelId: string,
// 		messageId: string,
// 		type: string,
// 	},
// 	firedAt: string
// 	victim: {
// 		battleUserId: string,
// 		energy: number,
// 		experience: number,
// 		health: number,
// 		userId: string,
// 	}
// }

// interface DisarmPayloadTemplate extends CreatePayloadTemplate {
// 	createdAt: string,
// 	duration: number,
// 	disarmer: {
// 		battleUserId: string,
// 		energy: number,
// 		experience: number,
// 		health: number,
// 		userId: string,
// 	},
// 	disarmedAt: string,
// }

// const TrapRecordTemplate = {
// 	type: BattleTrapRecordType.Create,
// 	guildId: "???",
// 	payload: {
// 		config: {
// 			version: "???",
// 		},
// 		damage: {
// 			baseDamage: "???",
// 			durationDamage: "???",
// 			numCharactersDamage: "???",
// 			wordDamage: "???",
// 		},
// 		owner: {
// 			battleUserId: "???",
// 			energy: "???",
// 			experience: "???",
// 			health: "???",
// 			userId: "???",
// 		},
// 		invocation: {
// 			channelId: "???",
// 			messageId: "???",
// 			type: "Message",
// 			interactionid: "???",
// 		},
// 		experience: {
// 			base: "???",
// 			bonus: "???",
// 		},
// 	}
// }

interface CustomCommandTemplate {
	guildId: string,
	name: string,
	aliases: string[],
	ownerId: string,
	content: string,
	createdAt: string,
	useCount: number,
	lastUsedAt: string,
}

const CustomCommandTemplate = {
	aliases: [],
	content: "$._content",
	createdAt: "$._creationDate",
	lastUsedAt: "$._lastUsedDate",
	name: "$._name",
	ownerId: "$._owner",
	useCount: "$._useCount",
}

interface ReminderTemplate {
	target: {
		type: string,
		mentionableIds: string[],
		channelId: string,
	},
	createdAt: string,
	ownerId: string,
	content: string,
	isDisabled: boolean,
	schedules: ReminderScheduleTemplate[],
	events: ReminderEventTemplate[]
}

const ReminderTemplate = {
	content: "$.message",
	ownerId: "$.author",
	target: {
		channelId: "$.discordChannelId",
		mentionableIds: [],
		type: "User",
	},
	schedules: [],
	events: [],
}

interface ReminderEventTemplate {
	location: {
		channelId: string,
		guildId: string,
		messageId: string,
	},
	createdAt: Date,
	eventType: string,
	payload: {
		userId?: string,
	}
}

const ReminderScheduleTemplate = {
	createdAt: "$.creationTime",
	lastEditedAt: "",
	reminderTime: "$.reminderTime",
	repeat: {
		interval: "$.repeatInterval",
		isRepeating: "$.isRepeat",
	}
}

interface ReminderScheduleTemplate {
	repeat: {
		isRepeating: boolean,
		isInfinite: boolean,
		interval: number,
	},
	createdAt: Date,
	lastEditedAt: Date,
	reminderTime: Date,
	isDisabled: boolean,
}

const ReminderEventTemplate = {
	createdAt: "",
	eventType: ReminderEventType.Fire,
	location: {
		channelId: "$.discordChannelId",
		guildId: "$.discordGuildId",
		messageId: "$.discordMessageId",
	},
	payload: {
	}
}

const afkt = {
	"battle": {
		"users": {
			"260288776360820736": {
				"_id": "260288776360820736",
				"_description": null,
				"_createdAt": 1561655857407,
				"_inventory": {
					"_items": [
						{
							"id": 8,
							"_lastUsed": 1604434093004,
							"_acquired": "2020-11-03T20:08:12.944Z",
							"_quantity": 1
						},
						{
							"id": 35,
							"_lastUsed": 1607253829307,
							"_acquired": "2020-08-31T21:55:39.255Z",
							"_quantity": 1
						},
						{
							"id": 2,
							"_lastUsed": 1597210519189,
							"_acquired": "2020-08-02T21:05:54.588Z",
							"_quantity": 1
						},
						{
							"id": 1,
							"_lastUsed": 1596402042200,
							"_acquired": "2020-07-25T09:50:01.138Z",
							"_quantity": 1
						},
						{
							"id": 36,
							"_lastUsed": 1596479108309,
							"_acquired": "2020-08-03T18:25:08.249Z",
							"_quantity": 1
						},
						{
							"id": 12,
							"_lastUsed": 1610695073918,
							"_acquired": 1610695073845,
							"_quantity": 1
						}
					]
				},
				"_stats": {
					"_experience": 2.320125138571844e+22,
					"_health": 800,
					"_energy": 1500
				},
				"_lastPelt": 1610695073845,
				"_traps": [
					"b95ae470-3a92-11eb-81a5-b568b3d79ca7"
				],
				"_lastEdited": 1649638268389
			},
			"108378183253913600": {
				"_id": "108378183253913600",
				"_description": null,
				"_createdAt": 1562100863053,
				"_inventory": {
					"_items": [
						{
							"id": 13,
							"_lastUsed": 1641660004656,
							"_acquired": 1641229740544,
							"_quantity": 1
						},
						{
							"id": 29,
							"_lastUsed": 1641408380517,
							"_acquired": 1641320640038,
							"_quantity": 1
						},
						{
							"id": 27,
							"_lastUsed": 1639289123262,
							"_acquired": 1639289123052,
							"_quantity": 1
						},
						{
							"id": 12,
							"_lastUsed": 1641408361432,
							"_acquired": 1639028945753,
							"_quantity": 1
						},
						{
							"id": 11,
							"_lastUsed": 1641659988743,
							"_acquired": "2020-11-03T20:06:42.420Z",
							"_quantity": 1
						},
						{
							"id": 10,
							"_lastUsed": 1641408377605,
							"_acquired": "2020-08-25T17:40:11.861Z",
							"_quantity": 1
						},
						{
							"id": 9,
							"_lastUsed": 1641659976954,
							"_acquired": "2020-08-10T23:22:10.926Z",
							"_quantity": 1
						},
						{
							"id": 7,
							"_lastUsed": 1641659990948,
							"_acquired": "2020-08-04T19:53:47.681Z",
							"_quantity": 1
						},
						{
							"id": 35,
							"_lastUsed": 1641659986771,
							"_acquired": "2020-08-04T01:56:11.685Z",
							"_quantity": 1
						},
						{
							"id": 5,
							"_lastUsed": 1640040641340,
							"_acquired": "2020-08-03T20:09:00.411Z",
							"_quantity": 1
						},
						{
							"id": 18,
							"_lastUsed": 1641659994993,
							"_acquired": "2020-08-03T21:40:08.936Z",
							"_quantity": 1
						},
						{
							"id": 4,
							"_lastUsed": 1641408344586,
							"_acquired": "2020-08-03T17:33:36.332Z",
							"_quantity": 1
						},
						{
							"id": 17,
							"_lastUsed": 1641659978746,
							"_acquired": "2020-08-03T00:53:41.715Z",
							"_quantity": 1
						},
						{
							"id": 16,
							"_lastUsed": 1641659997088,
							"_acquired": "2020-08-03T18:17:42.453Z",
							"_quantity": 1
						},
						{
							"id": 3,
							"_lastUsed": 1641229734919,
							"_acquired": "2020-08-02T18:46:48.484Z",
							"_quantity": 1
						},
						{
							"id": 2,
							"_lastUsed": 1640040659417,
							"_acquired": "2020-08-02T16:05:13.313Z",
							"_quantity": 1
						},
						{
							"id": 1,
							"_lastUsed": 1641229813589,
							"_acquired": "2020-08-01T21:06:49.984Z",
							"_quantity": 1
						},
						{
							"id": 6,
							"_lastUsed": 1642531533320,
							"_acquired": "2020-08-04T14:30:39.270Z",
							"_quantity": 1
						},
						{
							"id": 36,
							"_lastUsed": 1642531538247,
							"_acquired": "2020-08-02T05:25:32.340Z",
							"_quantity": 1
						},
						{
							"id": 23,
							"_lastUsed": 1642531535693,
							"_acquired": "2020-09-09T21:15:52.137Z",
							"_quantity": 1
						},
						{
							"id": 8,
							"_lastUsed": 1642531552570,
							"_acquired": "2020-08-09T19:16:11.601Z",
							"_quantity": 1
						},
						{
							"id": 21,
							"_lastUsed": 1642531522724,
							"_acquired": "2020-08-10T01:28:09.288Z",
							"_quantity": 1
						},
						{
							"id": 25,
							"_lastUsed": 1642531540698,
							"_acquired": "2020-11-06T04:48:14.181Z",
							"_quantity": 1
						}
					]
				},
				"_stats": {
					"_experience": 14053,
					"_health": 666,
					"_energy": 1300
				},
				"_lastPelt": 1642531552408,
				"_traps": [
					"6fdb6150-d118-11ea-85a9-21ffa8d806bc"
				],
				"_lastEdited": 1649638268424
			},
			"304354673647812608": {
				"_id": "304354673647812608",
				"_description": null,
				"_createdAt": 1562100945933,
				"_inventory": {
					"_items": [
						{
							"id": 9,
							"_lastUsed": 1615327842896,
							"_acquired": "2020-09-24T20:34:02.686Z",
							"_quantity": 1
						},
						{
							"id": 8,
							"_lastUsed": 1600979658955,
							"_acquired": "2020-09-21T23:43:48.826Z",
							"_quantity": 1
						},
						{
							"id": 21,
							"_lastUsed": 1600979685687,
							"_acquired": "2020-09-22T02:10:23.399Z",
							"_quantity": 1
						},
						{
							"id": 7,
							"_lastUsed": 1600979677156,
							"_acquired": "2020-09-16T18:12:35.737Z",
							"_quantity": 1
						},
						{
							"id": 35,
							"_lastUsed": 1600783747518,
							"_acquired": "2020-09-15T16:12:39.609Z",
							"_quantity": 1
						},
						{
							"id": 6,
							"_lastUsed": 1603819928308,
							"_acquired": "2020-09-15T20:19:38.553Z",
							"_quantity": 1
						},
						{
							"id": 5,
							"_lastUsed": 1600783758023,
							"_acquired": "2020-09-15T11:19:55.528Z",
							"_quantity": 1
						},
						{
							"id": 18,
							"_lastUsed": 1600783742783,
							"_acquired": "2020-09-15T13:41:10.862Z",
							"_quantity": 1
						},
						{
							"id": 4,
							"_lastUsed": 1600979682606,
							"_acquired": "2020-09-14T10:53:01.591Z",
							"_quantity": 1
						},
						{
							"id": 17,
							"_lastUsed": 1600979667299,
							"_acquired": "2020-09-14T20:05:17.569Z",
							"_quantity": 1
						},
						{
							"id": 16,
							"_lastUsed": 1600979679626,
							"_acquired": "2020-09-13T11:29:00.915Z",
							"_quantity": 1
						},
						{
							"id": 3,
							"_lastUsed": 1600783763116,
							"_acquired": "2020-09-13T14:15:52.627Z",
							"_quantity": 1
						},
						{
							"id": 2,
							"_lastUsed": 1600979655274,
							"_acquired": "2020-09-11T19:38:03.109Z",
							"_quantity": 1
						},
						{
							"id": 36,
							"_lastUsed": 1603803372508,
							"_acquired": "2020-09-10T12:47:33.867Z",
							"_quantity": 1
						},
						{
							"id": 1,
							"_lastUsed": 1600979674515,
							"_acquired": "2020-09-10T00:15:48.285Z",
							"_quantity": 1
						}
					]
				},
				"_stats": {
					"_experience": 3538,
					"_health": 400,
					"_energy": 1000
				},
				"_lastPelt": 1615327842786,
				"_traps": [
					"ecdde880-d721-11ea-91cc-3981e0f228e1"
				],
				"_lastEdited": 1649638268464
			},
			"138398309776621569": {
				"_id": "138398309776621569",
				"_description": null,
				"_createdAt": 1562101091167,
				"_inventory": {
					"_items": [
						{
							"id": 13,
							"_lastUsed": 1640737379439,
							"_acquired": 1639451167084,
							"_quantity": 1
						},
						{
							"id": 12,
							"_lastUsed": 1643247704210,
							"_acquired": "2020-11-17T01:57:33.263Z",
							"_quantity": 1
						},
						{
							"id": 27,
							"_lastUsed": 1642531525733,
							"_acquired": 1609033447334,
							"_quantity": 1
						},
						{
							"id": 25,
							"_lastUsed": 1639711778442,
							"_acquired": "2020-11-01T21:47:57.699Z",
							"_quantity": 1
						},
						{
							"id": 10,
							"_lastUsed": 1640737397079,
							"_acquired": "2020-09-24T22:01:04.452Z",
							"_quantity": 1
						},
						{
							"id": 23,
							"_lastUsed": 1640737393344,
							"_acquired": "2020-10-01T18:32:33.169Z",
							"_quantity": 1
						},
						{
							"id": 21,
							"_lastUsed": 1640737388804,
							"_acquired": "2020-08-27T17:09:32.533Z",
							"_quantity": 1
						},
						{
							"id": 7,
							"_lastUsed": 1640737374138,
							"_acquired": "2020-08-17T22:54:44.707Z",
							"_quantity": 1
						},
						{
							"id": 6,
							"_lastUsed": 1642531556930,
							"_acquired": "2020-08-14T19:05:31.132Z",
							"_quantity": 1
						},
						{
							"id": 5,
							"_lastUsed": 1640737375207,
							"_acquired": "2020-08-09T12:30:33.291Z",
							"_quantity": 1
						},
						{
							"id": 18,
							"_lastUsed": 1640737386061,
							"_acquired": "2020-08-09T22:43:46.743Z",
							"_quantity": 1
						},
						{
							"id": 17,
							"_lastUsed": 1639711760050,
							"_acquired": "2020-08-04T22:09:21.779Z",
							"_quantity": 1
						},
						{
							"id": 4,
							"_lastUsed": 1640737376323,
							"_acquired": "2020-08-03T00:49:21.746Z",
							"_quantity": 1
						},
						{
							"id": 3,
							"_lastUsed": 1639711763725,
							"_acquired": "2020-08-01T21:06:32.748Z",
							"_quantity": 1
						},
						{
							"id": 16,
							"_lastUsed": 1640737363181,
							"_acquired": "2020-07-29T23:15:05.446Z",
							"_quantity": 1
						},
						{
							"id": 2,
							"_lastUsed": 1640737357462,
							"_acquired": "2020-08-04T19:13:29.305Z",
							"_quantity": 1
						},
						{
							"id": 1,
							"_lastUsed": 1640737377211,
							"_acquired": "2020-07-25T19:48:51.694Z",
							"_quantity": 1
						},
						{
							"id": 36,
							"_lastUsed": 1640737378389,
							"_acquired": "2020-08-07T17:09:19.284Z",
							"_quantity": 1
						},
						{
							"id": 35,
							"_lastUsed": 1643247697046,
							"_acquired": "2020-08-13T20:35:36.677Z",
							"_quantity": 1
						},
						{
							"id": 9,
							"_lastUsed": 1643247684259,
							"_acquired": "2020-09-13T01:53:12.856Z",
							"_quantity": 1
						},
						{
							"id": 11,
							"_lastUsed": 1643247698810,
							"_acquired": "2020-10-29T01:19:15.097Z",
							"_quantity": 1
						},
						{
							"id": 8,
							"_lastUsed": 1643247688309,
							"_acquired": "2020-08-25T19:17:08.575Z",
							"_quantity": 1
						},
						{
							"id": 14,
							"_lastUsed": 1643247700669,
							"_acquired": 1639711751046,
							"_quantity": 1
						},
						{
							"id": 29,
							"_lastUsed": 1643247692664,
							"_acquired": 1639427026814,
							"_quantity": 1
						},
						{
							"id": 30,
							"_lastUsed": 1643247689990,
							"_acquired": 1640283308096,
							"_quantity": 1
						}
					]
				},
				"_stats": {
					"_experience": 25164,
					"_health": 800,
					"_energy": 1500
				},
				"_lastPelt": 1643247704081,
				"_traps": [
					"6f3e72c0-ce5f-11ea-afe4-67fc924e2936",
					"33ab73a0-3149-11eb-9170-39cfe4f2e7de",
					"054bda2b-5bc3-4b06-b3e1-d2bc3c0e959c",
					"87082fdb-6e89-4d94-93e1-b61bdfe48150",
					"75eacae9-e57a-4339-9ae9-4041e8e849e1"
				],
				"_lastEdited": 1649638268494
			},
			"230860022555344896": {
				"_id": "230860022555344896",
				"_description": null,
				"_createdAt": 1563851610519,
				"_inventory": {
					"_items": [
						{
							"id": 16,
							"_lastUsed": 1610579672408,
							"_acquired": 1610579672144,
							"_quantity": 1
						}
					]
				},
				"_stats": {
					"_experience": 115,
					"_health": 75,
					"_energy": 300
				},
				"_lastPelt": 1610579672144,
				"_traps": [
					"a61672a5-809a-4f9a-b607-4af988776a97"
				],
				"_lastEdited": 1649638268537
			},
			"undefined": {
				"_id": null,
				"_createdAt": 1563851610533,
				"_inventory": [],
				"_stats": {
					"experience": 0,
					"health": 0
				},
				"_traps": []
			},
			"174037015858249730": {
				"_id": "174037015858249730",
				"_description": null,
				"_createdAt": 1563927048060,
				"_inventory": {
					"_items": [
						{
							"id": 3,
							"_lastUsed": 1611979378121,
							"_acquired": 1611971283787,
							"_quantity": 1
						},
						{
							"id": 1,
							"_lastUsed": 1611979374352,
							"_acquired": "2020-07-25T22:24:21.280Z",
							"_quantity": 1
						},
						{
							"id": 4,
							"_lastUsed": 1611979406109,
							"_acquired": "2020-08-02T21:03:16.565Z",
							"_quantity": 1
						},
						{
							"id": 2,
							"_lastUsed": 1611979400898,
							"_acquired": "2020-08-02T00:31:27.111Z",
							"_quantity": 1
						},
						{
							"id": 17,
							"_lastUsed": 1611979409773,
							"_acquired": "2020-08-05T03:08:59.205Z",
							"_quantity": 1
						},
						{
							"id": 16,
							"_lastUsed": 1611979447394,
							"_acquired": 1611979447302,
							"_quantity": 1
						}
					]
				},
				"_stats": {
					"_experience": 387,
					"_health": 150,
					"_energy": 500
				},
				"_lastPelt": 1611979447302,
				"_traps": [],
				"_lastEdited": 1649638268599
			},
			"106548618344812544": {
				"_id": "106548618344812544",
				"_description": null,
				"_createdAt": 1577597713025,
				"_inventory": {
					"_items": []
				},
				"_stats": {
					"_experience": 0,
					"_health": 10,
					"_energy": 100
				},
				"_lastPelt": 1595667081473,
				"_traps": [],
				"_lastEdited": 1649638268630
			},
			"147077165895254016": {
				"_id": "147077165895254016",
				"_description": null,
				"_createdAt": 1577597779546,
				"_inventory": {
					"_items": []
				},
				"_stats": {
					"_experience": 0,
					"_health": 10,
					"_energy": 100
				},
				"_lastPelt": 1595667081484,
				"_traps": [],
				"_lastEdited": 1649638268662
			},
			"134062007547723777": {
				"_id": "134062007547723777",
				"_description": null,
				"_createdAt": 1577608372611,
				"_inventory": {
					"_items": [
						{
							"id": 13,
							"_lastUsed": 1599254896338,
							"_acquired": "2020-09-04T21:28:16.262Z",
							"_quantity": 1
						},
						{
							"id": 12,
							"_lastUsed": 1599925781475,
							"_acquired": "2020-08-22T18:32:18.004Z",
							"_quantity": 1
						},
						{
							"id": 11,
							"_lastUsed": 1598277256182,
							"_acquired": "2020-08-19T16:31:23.958Z",
							"_quantity": 1
						},
						{
							"id": 23,
							"_lastUsed": 1599489193379,
							"_acquired": "2020-08-16T19:01:17.608Z",
							"_quantity": 1
						},
						{
							"id": 10,
							"_lastUsed": 1598277271945,
							"_acquired": "2020-08-16T16:46:34.464Z",
							"_quantity": 1
						},
						{
							"id": 9,
							"_lastUsed": 1599489184216,
							"_acquired": "2020-08-11T13:38:40.474Z",
							"_quantity": 1
						},
						{
							"id": 8,
							"_lastUsed": 1599489154342,
							"_acquired": "2020-08-10T23:20:15.808Z",
							"_quantity": 1
						},
						{
							"id": 21,
							"_lastUsed": 1599925816057,
							"_acquired": "2020-08-11T00:22:20.769Z",
							"_quantity": 1
						},
						{
							"id": 7,
							"_lastUsed": 1598277188027,
							"_acquired": "2020-08-08T02:26:24.471Z",
							"_quantity": 1
						},
						{
							"id": 35,
							"_lastUsed": 1599408080784,
							"_acquired": "2020-08-04T20:11:58.526Z",
							"_quantity": 1
						},
						{
							"id": 6,
							"_lastUsed": 1598277230463,
							"_acquired": "2020-08-04T18:30:25.940Z",
							"_quantity": 1
						},
						{
							"id": 18,
							"_lastUsed": 1598038325116,
							"_acquired": "2020-08-04T17:21:56.867Z",
							"_quantity": 1
						},
						{
							"id": 5,
							"_lastUsed": 1599489138191,
							"_acquired": "2020-08-04T15:57:20.477Z",
							"_quantity": 1
						},
						{
							"id": 4,
							"_lastUsed": 1599408084604,
							"_acquired": "2020-08-03T18:19:53.238Z",
							"_quantity": 1
						},
						{
							"id": 17,
							"_lastUsed": 1598121117230,
							"_acquired": "2020-08-03T18:21:06.850Z",
							"_quantity": 1
						},
						{
							"id": 16,
							"_lastUsed": 1598277171014,
							"_acquired": "2020-08-03T18:19:57.152Z",
							"_quantity": 1
						},
						{
							"id": 3,
							"_lastUsed": 1599925773721,
							"_acquired": "2020-08-02T18:00:28.900Z",
							"_quantity": 1
						},
						{
							"id": 2,
							"_lastUsed": 1599489176238,
							"_acquired": "2020-08-02T00:28:29.344Z",
							"_quantity": 1
						},
						{
							"id": 1,
							"_lastUsed": 1599489188663,
							"_acquired": "2020-08-01T21:07:08.676Z",
							"_quantity": 1
						},
						{
							"id": 36,
							"_lastUsed": 1598465609151,
							"_acquired": "2020-08-02T19:56:10.495Z",
							"_quantity": 1
						},
						{
							"id": 25,
							"_lastUsed": 1599408047096,
							"_acquired": "2020-08-20T00:17:39.878Z",
							"_quantity": 1
						},
						{
							"id": 27,
							"_lastUsed": 1599925791608,
							"_acquired": "2020-08-22T23:19:25.960Z",
							"_quantity": 1
						},
						{
							"id": 29,
							"_lastUsed": 1599408071868,
							"_acquired": "2020-09-05T00:35:05.996Z",
							"_quantity": 1
						}
					]
				},
				"_stats": {
					"_experience": 13744,
					"_health": 666,
					"_energy": 1300
				},
				"_lastPelt": 1599266105997,
				"_traps": [],
				"_lastEdited": 1649638268690
			},
			"173026718423056384": {
				"_id": "173026718423056384",
				"_description": null,
				"_createdAt": 1577616294996,
				"_inventory": {
					"_items": [
						{
							"id": 11,
							"_lastUsed": 1612023751922,
							"_acquired": 1607811619173,
							"_quantity": 1
						},
						{
							"id": 10,
							"_lastUsed": 1612023760303,
							"_acquired": "2020-09-12T13:59:49.546Z",
							"_quantity": 1
						},
						{
							"id": 23,
							"_lastUsed": 1612023744135,
							"_acquired": "2020-09-12T17:04:19.833Z",
							"_quantity": 1
						},
						{
							"id": 9,
							"_lastUsed": 1612023765494,
							"_acquired": "2020-09-10T19:31:17.389Z",
							"_quantity": 1
						},
						{
							"id": 8,
							"_lastUsed": 1612023774055,
							"_acquired": "2020-09-09T22:23:50.621Z",
							"_quantity": 1
						},
						{
							"id": 21,
							"_lastUsed": 1612023803552,
							"_acquired": "2020-09-10T08:48:32.232Z",
							"_quantity": 1
						},
						{
							"id": 7,
							"_lastUsed": 1612023771869,
							"_acquired": "2020-09-08T12:59:20.399Z",
							"_quantity": 1
						},
						{
							"id": 35,
							"_lastUsed": 1612023821013,
							"_acquired": "2020-09-07T23:30:40.721Z",
							"_quantity": 1
						},
						{
							"id": 6,
							"_lastUsed": 1612023755896,
							"_acquired": "2020-09-08T10:57:07.496Z",
							"_quantity": 1
						},
						{
							"id": 18,
							"_lastUsed": 1612023758078,
							"_acquired": "2020-09-07T21:48:43.298Z",
							"_quantity": 1
						},
						{
							"id": 5,
							"_lastUsed": 1612023775899,
							"_acquired": "2020-09-07T19:42:25.552Z",
							"_quantity": 1
						},
						{
							"id": 4,
							"_lastUsed": 1612023750699,
							"_acquired": "2020-09-07T16:51:41.710Z",
							"_quantity": 1
						},
						{
							"id": 17,
							"_lastUsed": 1612023769139,
							"_acquired": "2020-09-08T00:44:40.626Z",
							"_quantity": 1
						},
						{
							"id": 16,
							"_lastUsed": 1612023802176,
							"_acquired": "2020-09-07T15:51:37.291Z",
							"_quantity": 1
						},
						{
							"id": 3,
							"_lastUsed": 1612023823303,
							"_acquired": "2020-09-07T18:33:41.684Z",
							"_quantity": 1
						},
						{
							"id": 2,
							"_lastUsed": 1612023762864,
							"_acquired": "2020-09-07T14:50:27.985Z",
							"_quantity": 1
						},
						{
							"id": 1,
							"_lastUsed": 1612023767134,
							"_acquired": "2020-09-07T13:48:50.471Z",
							"_quantity": 1
						},
						{
							"id": 36,
							"_lastUsed": 1612023753574,
							"_acquired": "2020-09-07T20:44:24.143Z",
							"_quantity": 1
						},
						{
							"id": 25,
							"_lastUsed": 1612023668127,
							"_acquired": 1612023668034,
							"_quantity": 1
						}
					]
				},
				"_stats": {
					"_experience": 7609,
					"_health": 450,
					"_energy": 1100
				},
				"_lastPelt": 1612023668034,
				"_traps": [],
				"_lastEdited": 1649638268773
			},
			"98556365965897728": {
				"_id": "98556365965897728",
				"_description": null,
				"_createdAt": 1577756919120,
				"_inventory": {
					"_items": []
				},
				"_stats": {
					"_experience": 1008,
					"_health": 250,
					"_energy": 700
				},
				"_lastPelt": 1595667081517,
				"_traps": [
					"def1be40-38ab-11eb-9170-39cfe4f2e7de"
				],
				"_lastEdited": 1649638268833
			},
			"191286686607474698": {
				"_id": "191286686607474698",
				"_description": null,
				"_createdAt": 1578109202286,
				"_inventory": {
					"_items": []
				},
				"_stats": {
					"_experience": 718,
					"_health": 200,
					"_energy": 600
				},
				"_lastPelt": 1595667081525,
				"_traps": [],
				"_lastEdited": 1649638268879
			},
			"287188227667001345": {
				"_id": "287188227667001345",
				"_description": null,
				"_createdAt": 1580283224097,
				"_inventory": {
					"_items": [
						{
							"id": 1,
							"_lastUsed": 1596596951997,
							"_acquired": "2020-07-25T23:36:59.296Z",
							"_quantity": 1
						},
						{
							"id": 2,
							"_lastUsed": 1596596965079,
							"_acquired": "2020-08-05T03:09:25.041Z",
							"_quantity": 1
						}
					]
				},
				"_stats": {
					"_experience": 3247,
					"_health": 350,
					"_energy": 900
				},
				"_lastPelt": 1596596965041,
				"_traps": [
					"29ded370-c82b-11eb-a346-d1c3d22f9879",
					"ba7ee87e-f3d8-45f1-ab25-02fe3364cd86",
					"d5bf502b-b2e2-42f2-927e-7a0b8b725281"
				],
				"_lastEdited": 1649638268913
			},
			"177423709114466304": {
				"_id": "177423709114466304",
				"_description": null,
				"_createdAt": 1591927397363,
				"_inventory": {
					"_items": [
						{
							"id": 16,
							"_lastUsed": 1615327849512,
							"_acquired": 1612373221304,
							"_quantity": 1
						},
						{
							"id": 2,
							"_lastUsed": 1615327845856,
							"_acquired": 1611971144874,
							"_quantity": 1
						},
						{
							"id": 36,
							"_lastUsed": 1615327842057,
							"_acquired": 1610579613611,
							"_quantity": 1
						},
						{
							"id": 1,
							"_lastUsed": 1615327852568,
							"_acquired": 1611984168772,
							"_quantity": 1
						},
						{
							"id": 3,
							"_lastUsed": 1615327829159,
							"_acquired": 1615327829056,
							"_quantity": 1
						}
					]
				},
				"_stats": {
					"_experience": 1190,
					"_health": 250,
					"_energy": 700
				},
				"_lastPelt": 1615327829056,
				"_traps": [
					"ef6307b0-ac83-11eb-986a-3dc12a3ab507",
					"a8636504-ea17-4997-8d47-af617da78109"
				],
				"_lastEdited": 1649638268948
			},
			"110374796960759808": {
				"_id": "110374796960759808",
				"_description": null,
				"_createdAt": 1595529407158,
				"_inventory": {
					"_items": [
						{
							"id": 36,
							"_lastUsed": 1604263878889,
							"_acquired": "2020-11-01T20:51:18.800Z",
							"_quantity": 1
						}
					]
				},
				"_stats": {
					"_experience": 0,
					"_health": 10,
					"_energy": 100
				},
				"_lastPelt": 1604263878800,
				"_traps": [],
				"_lastEdited": 1649638268984
			},
			"null": {
				"_id": null,
				"_description": null,
				"_createdAt": 1563851610533,
				"_inventory": {
					"_items": []
				},
				"_stats": {
					"_experience": 0,
					"_health": 10,
					"_energy": 100
				},
				"_lastPelt": 0,
				"_traps": [],
				"_lastEdited": 1649638269018
			},
			"222169605253234689": {
				"_id": "222169605253234689",
				"_description": null,
				"_createdAt": 1596006549117,
				"_inventory": {
					"_items": []
				},
				"_stats": {
					"_experience": 0,
					"_health": 10,
					"_energy": 100
				},
				"_lastPelt": 0,
				"_traps": [
					"707f5dd0-4569-11eb-ada4-53e5fe685ad5"
				],
				"_lastEdited": 1649638269052
			},
			"463799097586090014": {
				"_id": "463799097586090014",
				"_description": null,
				"_createdAt": 1596066583942,
				"_inventory": {
					"_items": [
						{
							"id": 15,
							"_lastUsed": 1641408386294,
							"_acquired": 1639618680435,
							"_quantity": 1
						},
						{
							"id": 32,
							"_lastUsed": 1643334812267,
							"_acquired": 1640210913135,
							"_quantity": 1
						},
						{
							"id": 30,
							"_lastUsed": 1642007447663,
							"_acquired": "2020-10-04T18:05:04.223Z",
							"_quantity": 1
						},
						{
							"id": 14,
							"_lastUsed": 1643415741628,
							"_acquired": "2020-10-24T16:55:13.990Z",
							"_quantity": 1
						},
						{
							"id": 13,
							"_lastUsed": 1643415745824,
							"_acquired": "2020-09-24T19:40:00.263Z",
							"_quantity": 1
						},
						{
							"id": 12,
							"_lastUsed": 1641660214388,
							"_acquired": "2020-09-15T01:08:49.187Z",
							"_quantity": 1
						},
						{
							"id": 27,
							"_lastUsed": 1642815746906,
							"_acquired": "2020-09-15T12:43:56.964Z",
							"_quantity": 1
						},
						{
							"id": 11,
							"_lastUsed": 1641408348217,
							"_acquired": "2020-09-11T01:40:15.064Z",
							"_quantity": 1
						},
						{
							"id": 25,
							"_lastUsed": 1641141830638,
							"_acquired": "2020-09-11T13:20:06.970Z",
							"_quantity": 1
						},
						{
							"id": 10,
							"_lastUsed": 1607810851746,
							"_acquired": "2020-09-07T14:13:09.677Z",
							"_quantity": 1
						},
						{
							"id": 23,
							"_lastUsed": 1640463933365,
							"_acquired": "2020-09-07T17:23:53.196Z",
							"_quantity": 1
						},
						{
							"id": 9,
							"_lastUsed": 1640642498912,
							"_acquired": "2020-09-04T21:13:39.591Z",
							"_quantity": 1
						},
						{
							"id": 8,
							"_lastUsed": 1641658351100,
							"_acquired": "2020-08-25T17:24:56.769Z",
							"_quantity": 1
						},
						{
							"id": 21,
							"_lastUsed": 1607810856951,
							"_acquired": "2020-08-26T13:31:18.919Z",
							"_quantity": 1
						},
						{
							"id": 7,
							"_lastUsed": 1640210899785,
							"_acquired": "2020-08-19T18:10:39.619Z",
							"_quantity": 1
						},
						{
							"id": 6,
							"_lastUsed": 1642815738141,
							"_acquired": "2020-08-16T01:36:09.367Z",
							"_quantity": 1
						},
						{
							"id": 35,
							"_lastUsed": 1640372359742,
							"_acquired": "2020-08-16T15:02:14.944Z",
							"_quantity": 1
						},
						{
							"id": 5,
							"_lastUsed": 1640643330437,
							"_acquired": "2020-08-12T13:35:25.958Z",
							"_quantity": 1
						},
						{
							"id": 4,
							"_lastUsed": 1607810874319,
							"_acquired": "2020-08-09T04:55:31.296Z",
							"_quantity": 1
						},
						{
							"id": 16,
							"_lastUsed": 1641660222543,
							"_acquired": "2020-08-04T17:52:00.063Z",
							"_quantity": 1
						},
						{
							"id": 3,
							"_lastUsed": 1640446621034,
							"_acquired": "2020-08-04T23:10:56.185Z",
							"_quantity": 1
						},
						{
							"id": 2,
							"_lastUsed": 1643334807823,
							"_acquired": "2020-08-03T18:31:45.358Z",
							"_quantity": 1
						},
						{
							"id": 1,
							"_lastUsed": 1641660206892,
							"_acquired": "2020-08-02T00:13:54.193Z",
							"_quantity": 1
						},
						{
							"id": 36,
							"_lastUsed": 1640643337501,
							"_acquired": "2020-08-01T21:07:23.091Z",
							"_quantity": 1
						},
						{
							"id": 17,
							"_lastUsed": 1642815716483,
							"_acquired": "2020-08-09T14:57:00.346Z",
							"_quantity": 1
						},
						{
							"id": 18,
							"_lastUsed": 1642815707869,
							"_acquired": "2020-08-12T19:47:40.077Z",
							"_quantity": 1
						},
						{
							"id": 29,
							"_lastUsed": 1642815727041,
							"_acquired": "2020-09-22T13:02:03.513Z",
							"_quantity": 1
						},
						{
							"id": 34,
							"_lastUsed": 1642815719691,
							"_acquired": 1640372400134,
							"_quantity": 1
						}
					]
				},
				"_stats": {
					"_experience": 34565,
					"_health": 800,
					"_energy": 1500
				},
				"_lastPelt": 1642815738018,
				"_traps": [
					"a3f216e0-115b-11eb-b142-7d074a5bd367",
					"ce5e1bf0-4ddc-11eb-9d4c-1d96b3cb019c",
					"4ee89c50-c961-11eb-a346-d1c3d22f9879",
					"c2617a4a-c9cb-4d2c-895e-31f3e0991ada",
					"c15298d3-4cfb-4c14-bf99-f3fd18f84c87"
				],
				"_lastEdited": 1649638269081
			},
			"310031015932329985": {
				"_id": "310031015932329985",
				"_description": null,
				"_createdAt": 1596331078120,
				"_inventory": {
					"_items": [
						{
							"id": 5,
							"_lastUsed": 1611979460356,
							"_acquired": 1611979460260,
							"_quantity": 1
						},
						{
							"id": 1,
							"_lastUsed": 1611979366921,
							"_acquired": "2020-09-07T15:15:12.406Z",
							"_quantity": 1
						},
						{
							"id": 18,
							"_lastUsed": 1615327809193,
							"_acquired": 1615327809060,
							"_quantity": 1
						}
					]
				},
				"_stats": {
					"_experience": 934,
					"_health": 200,
					"_energy": 600
				},
				"_lastPelt": 1615327809060,
				"_traps": [
					"006d4910-5d49-11eb-a0bb-934ada818db8"
				],
				"_lastEdited": 1649638269111
			},
			"382544116808155137": {
				"_id": "382544116808155137",
				"_description": null,
				"_createdAt": 1596479108231,
				"_inventory": {
					"_items": []
				},
				"_stats": {
					"_experience": 0,
					"_health": 10,
					"_energy": 100
				},
				"_lastPelt": 0,
				"_traps": [],
				"_lastEdited": 1649638269144
			},
			"67105938368110592": {
				"_id": "67105938368110592",
				"_description": null,
				"_createdAt": 1596490808920,
				"_inventory": {
					"_items": []
				},
				"_stats": {
					"_experience": 0,
					"_health": 10,
					"_energy": 100
				},
				"_lastPelt": 0,
				"_traps": [],
				"_lastEdited": 1649638269174
			},
			"184397827101818880": {
				"_id": "184397827101818880",
				"_description": null,
				"_createdAt": 1596775208137,
				"_inventory": {
					"_items": []
				},
				"_stats": {
					"_experience": 0,
					"_health": 10,
					"_energy": 100
				},
				"_lastPelt": 0,
				"_traps": [],
				"_lastEdited": 1649638269206
			},
			"331669086813814784": {
				"_id": "331669086813814784",
				"_description": null,
				"_createdAt": 1596985020324,
				"_inventory": {
					"_items": []
				},
				"_stats": {
					"_experience": 0,
					"_health": 10,
					"_energy": 100
				},
				"_lastPelt": 0,
				"_traps": [],
				"_lastEdited": 1649638269242
			},
			"126855914694115328": {
				"_id": "126855914694115328",
				"_description": null,
				"_createdAt": 1597350936641,
				"_inventory": {
					"_items": []
				},
				"_stats": {
					"_experience": 0,
					"_health": 10,
					"_energy": 100
				},
				"_lastPelt": 0,
				"_traps": [
					"79c23dc0-c97d-11eb-a346-d1c3d22f9879"
				],
				"_lastEdited": 1649638269282
			},
			"102193621104623616": {
				"_id": "102193621104623616",
				"_description": null,
				"_createdAt": 1597542120347,
				"_inventory": {
					"_items": []
				},
				"_stats": {
					"_experience": 0,
					"_health": 10,
					"_energy": 100
				},
				"_lastPelt": 0,
				"_traps": [],
				"_lastEdited": 1649638269384
			},
			"126089074644746241": {
				"_id": "126089074644746241",
				"_description": null,
				"_createdAt": 1597609539218,
				"_inventory": {
					"_items": []
				},
				"_stats": {
					"_experience": 0,
					"_health": 10,
					"_energy": 100
				},
				"_lastPelt": 0,
				"_traps": [],
				"_lastEdited": 1649638269447
			},
			"157643090700664833": {
				"_id": "157643090700664833",
				"_description": null,
				"_createdAt": 1598383028550,
				"_inventory": {
					"_items": []
				},
				"_stats": {
					"_experience": 0,
					"_health": 10,
					"_energy": 100
				},
				"_lastPelt": 0,
				"_traps": [],
				"_lastEdited": 1649638269481
			},
			"147910788076666880": {
				"_id": "147910788076666880",
				"_description": null,
				"_createdAt": 1598548172506,
				"_inventory": {
					"_items": []
				},
				"_stats": {
					"_experience": 0,
					"_health": 10,
					"_energy": 100
				},
				"_lastPelt": 0,
				"_traps": [],
				"_lastEdited": 1649638269512
			},
			"117098753499987976": {
				"_id": "117098753499987976",
				"_description": null,
				"_createdAt": 1599507723246,
				"_inventory": {
					"_items": []
				},
				"_stats": {
					"_experience": 0,
					"_health": 10,
					"_energy": 100
				},
				"_lastPelt": 0,
				"_traps": [],
				"_lastEdited": 1649638269547
			},
			"170726711200186369": {
				"_id": "170726711200186369",
				"_description": null,
				"_createdAt": 1599512726591,
				"_inventory": {
					"_items": []
				},
				"_stats": {
					"_experience": 0,
					"_health": 10,
					"_energy": 100
				},
				"_lastPelt": 0,
				"_traps": [],
				"_lastEdited": 1649638269583
			},
			"344393587041107970": {
				"_id": "344393587041107970",
				"_description": null,
				"_createdAt": 1599513786231,
				"_inventory": {
					"_items": []
				},
				"_stats": {
					"_experience": 0,
					"_health": 10,
					"_energy": 100
				},
				"_lastPelt": 0,
				"_traps": [],
				"_lastEdited": 1649638269621
			},
			"233346606957723648": {
				"_id": "233346606957723648",
				"_description": null,
				"_createdAt": 1599513788980,
				"_inventory": {
					"_items": []
				},
				"_stats": {
					"_experience": 0,
					"_health": 10,
					"_energy": 100
				},
				"_lastPelt": 0,
				"_traps": [],
				"_lastEdited": 1649638269658
			},
			"251840494747910144": {
				"_id": "251840494747910144",
				"_description": null,
				"_createdAt": 1599513799793,
				"_inventory": {
					"_items": []
				},
				"_stats": {
					"_experience": 0,
					"_health": 10,
					"_energy": 100
				},
				"_lastPelt": 0,
				"_traps": [],
				"_lastEdited": 1649638269688
			},
			"87392680094482432": {
				"_id": "87392680094482432",
				"_description": null,
				"_createdAt": 1599515474091,
				"_inventory": {
					"_items": []
				},
				"_stats": {
					"_experience": 0,
					"_health": 10,
					"_energy": 100
				},
				"_lastPelt": 0,
				"_traps": [],
				"_lastEdited": 1649638269725
			},
			"190888601729368065": {
				"_id": "190888601729368065",
				"_description": null,
				"_createdAt": 1599515489214,
				"_inventory": {
					"_items": []
				},
				"_stats": {
					"_experience": 0,
					"_health": 10,
					"_energy": 100
				},
				"_lastPelt": 0,
				"_traps": [],
				"_lastEdited": 1649638269762
			},
			"225371827315146753": {
				"_id": "225371827315146753",
				"_description": null,
				"_createdAt": 1599515493827,
				"_inventory": {
					"_items": []
				},
				"_stats": {
					"_experience": 0,
					"_health": 10,
					"_energy": 100
				},
				"_lastPelt": 0,
				"_traps": [],
				"_lastEdited": 1649638269794
			},
			"262416863168823297": {
				"_id": "262416863168823297",
				"_description": null,
				"_createdAt": 1599516757352,
				"_inventory": {
					"_items": []
				},
				"_stats": {
					"_experience": 0,
					"_health": 10,
					"_energy": 100
				},
				"_lastPelt": 0,
				"_traps": [],
				"_lastEdited": 1649638269826
			},
			"267028522147643392": {
				"_id": "267028522147643392",
				"_description": null,
				"_createdAt": 1599516775819,
				"_inventory": {
					"_items": []
				},
				"_stats": {
					"_experience": 0,
					"_health": 10,
					"_energy": 100
				},
				"_lastPelt": 0,
				"_traps": [],
				"_lastEdited": 1649638269857
			},
			"116261111954669573": {
				"_id": "116261111954669573",
				"_description": null,
				"_createdAt": 1599597003364,
				"_inventory": {
					"_items": []
				},
				"_stats": {
					"_experience": 0,
					"_health": 10,
					"_energy": 100
				},
				"_lastPelt": 0,
				"_traps": [],
				"_lastEdited": 1649638269905
			},
			"162706413066518529": {
				"_id": "162706413066518529",
				"_description": null,
				"_createdAt": 1599748153210,
				"_inventory": {
					"_items": []
				},
				"_stats": {
					"_experience": 0,
					"_health": 10,
					"_energy": 100
				},
				"_lastPelt": 0,
				"_traps": [],
				"_lastEdited": 1649638270015
			},
			"226113652183400448": {
				"_id": "226113652183400448",
				"_description": null,
				"_createdAt": 1599772020922,
				"_inventory": {
					"_items": []
				},
				"_stats": {
					"_experience": 0,
					"_health": 10,
					"_energy": 100
				},
				"_lastPelt": 0,
				"_traps": [],
				"_lastEdited": 1649638270049
			},
			"361715541318041603": {
				"_id": "361715541318041603",
				"_description": null,
				"_createdAt": 1599789116677,
				"_inventory": {
					"_items": []
				},
				"_stats": {
					"_experience": 0,
					"_health": 10,
					"_energy": 100
				},
				"_lastPelt": 0,
				"_traps": [],
				"_lastEdited": 1649638270081
			},
			"141334012374286336": {
				"_id": "141334012374286336",
				"_description": null,
				"_createdAt": 1599838448915,
				"_inventory": {
					"_items": []
				},
				"_stats": {
					"_experience": 0,
					"_health": 10,
					"_energy": 100
				},
				"_lastPelt": 0,
				"_traps": [],
				"_lastEdited": 1649638270115
			},
			"66006112104611840": {
				"_id": "66006112104611840",
				"_description": null,
				"_createdAt": 1600044965619,
				"_inventory": {
					"_items": []
				},
				"_stats": {
					"_experience": 0,
					"_health": 10,
					"_energy": 100
				},
				"_lastPelt": 0,
				"_traps": [],
				"_lastEdited": 1649638270149
			},
			"183045213307011072": {
				"_id": "183045213307011072",
				"_description": null,
				"_createdAt": 1600168795485,
				"_inventory": {
					"_items": []
				},
				"_stats": {
					"_experience": 0,
					"_health": 10,
					"_energy": 100
				},
				"_lastPelt": 0,
				"_traps": [],
				"_lastEdited": 1649638270182
			},
			"388544914990039040": {
				"_id": "388544914990039040",
				"_description": null,
				"_createdAt": 1600206982081,
				"_inventory": {
					"_items": []
				},
				"_stats": {
					"_experience": 0,
					"_health": 10,
					"_energy": 100
				},
				"_lastPelt": 0,
				"_traps": [],
				"_lastEdited": 1649638270220
			},
			"108419428047130624": {
				"_id": "108419428047130624",
				"_description": null,
				"_createdAt": 1601622994730,
				"_inventory": {
					"_items": []
				},
				"_stats": {
					"_experience": 0,
					"_health": 10,
					"_energy": 100
				},
				"_lastPelt": 0,
				"_traps": [],
				"_lastEdited": 1649638270258
			},
			"211283870736187394": {
				"_id": "211283870736187394",
				"_description": null,
				"_createdAt": 1605489072624,
				"_inventory": {
					"_items": [
						{
							"id": 5,
							"_lastUsed": 1607463250654,
							"_acquired": "2020-12-08T21:34:10.570Z",
							"_quantity": 1
						}
					]
				},
				"_stats": {
					"_experience": 3250,
					"_health": 350,
					"_energy": 900
				},
				"_lastPelt": 1607463250570,
				"_traps": [],
				"_lastEdited": 1649638270294
			},
			"247451712397246465": {
				"_id": "247451712397246465",
				"_description": null,
				"_createdAt": 1605567330245,
				"_inventory": {
					"_items": []
				},
				"_stats": {
					"_experience": 0,
					"_health": 10,
					"_energy": 100
				},
				"_lastPelt": 0,
				"_traps": [],
				"_lastEdited": 1649638270332
			},
			"121027813028528128": {
				"_id": "121027813028528128",
				"_description": null,
				"_createdAt": 1607384175885,
				"_inventory": {
					"_items": []
				},
				"_stats": {
					"_experience": 0,
					"_health": 10,
					"_energy": 100
				},
				"_lastPelt": 0,
				"_traps": [],
				"_lastEdited": 1649638270373
			},
			"366528667100250113": {
				"_id": "366528667100250113",
				"_description": null,
				"_createdAt": 1621970976257,
				"_inventory": {
					"_items": []
				},
				"_stats": {
					"_experience": 333,
					"_health": 110,
					"_energy": 400
				},
				"_lastPelt": 0,
				"_traps": [],
				"_lastEdited": 1649638270414
			},
			"106905104627580928": {
				"_id": "106905104627580928",
				"_description": null,
				"_createdAt": 1639427026733,
				"_inventory": {
					"_items": []
				},
				"_stats": {
					"_experience": 0,
					"_health": 10,
					"_energy": 100
				},
				"_lastPelt": 0,
				"_traps": [],
				"_lastEdited": 1649638270454
			},
			"178602758662782983": {
				"_id": "178602758662782983",
				"_description": null,
				"_createdAt": 1639427484943,
				"_inventory": {
					"_items": []
				},
				"_stats": {
					"_experience": 0,
					"_health": 10,
					"_energy": 100
				},
				"_lastPelt": 0,
				"_traps": [],
				"_lastEdited": 1649638270487
			},
			"102241941147635712": {
				"_id": "102241941147635712",
				"_description": null,
				"_createdAt": 1640211136753,
				"_inventory": {
					"_items": []
				},
				"_stats": {
					"_experience": 0,
					"_health": 10,
					"_energy": 100
				},
				"_lastPelt": 0,
				"_traps": [],
				"_lastEdited": 1649638270544
			},
			"265892172178391051": {
				"_id": "265892172178391051",
				"_description": null,
				"_createdAt": 1640283308029,
				"_inventory": {
					"_items": []
				},
				"_stats": {
					"_experience": 0,
					"_health": 10,
					"_energy": 100
				},
				"_lastPelt": 0,
				"_traps": [],
				"_lastEdited": 1649638270641
			},
			"363914170867122197": {
				"_id": "363914170867122197",
				"_description": null,
				"_createdAt": 1640394005818,
				"_inventory": {
					"_items": []
				},
				"_stats": {
					"_experience": 0,
					"_health": 10,
					"_energy": 100
				},
				"_lastPelt": 0,
				"_traps": [],
				"_lastEdited": 1649638270675
			},
			"176105699707715584": {
				"_id": "176105699707715584",
				"_description": null,
				"_createdAt": 1641229740477,
				"_inventory": {
					"_items": []
				},
				"_stats": {
					"_experience": 0,
					"_health": 10,
					"_energy": 100
				},
				"_lastPelt": 0,
				"_traps": [],
				"_lastEdited": 1649638270714
			}
		},
		"traps": {
			"6f3e72c0-ce5f-11ea-afe4-67fc924e2936": {
				"_id": "6f3e72c0-ce5f-11ea-afe4-67fc924e2936",
				"_phrase": "finished homework",
				"_owner": "138398309776621569",
				"_victim": null,
				"_createdAt": 1595671987180,
				"_firedAt": null,
				"_messageId": "736526439246987314"
			},
			"6fdb6150-d118-11ea-85a9-21ffa8d806bc": {
				"_id": "6fdb6150-d118-11ea-85a9-21ffa8d806bc",
				"_phrase": "space x",
				"_owner": "108378183253913600",
				"_victim": null,
				"_createdAt": 1595971347426,
				"_firedAt": null,
				"_messageId": "737782046763646999"
			},
			"ecdde880-d721-11ea-91cc-3981e0f228e1": {
				"_id": "ecdde880-d721-11ea-91cc-3981e0f228e1",
				"_phrase": "imbecile",
				"_owner": "304354673647812608",
				"_victim": null,
				"_createdAt": 1596635129604,
				"_firedAt": null,
				"_messageId": "740566151112818759"
			},
			"a3f216e0-115b-11eb-b142-7d074a5bd367": {
				"_id": "a3f216e0-115b-11eb-b142-7d074a5bd367",
				"_phrase": "fuck frc",
				"_owner": "463799097586090014",
				"_victim": null,
				"_createdAt": 1603037085514,
				"_firedAt": null,
				"_messageId": "767417900247941170"
			},
			"33ab73a0-3149-11eb-9170-39cfe4f2e7de": {
				"_id": "33ab73a0-3149-11eb-9170-39cfe4f2e7de",
				"_phrase": "hear da summons",
				"_owner": "138398309776621569",
				"_victim": null,
				"_createdAt": 1606547603415,
				"_firedAt": null,
				"_messageId": "782142079051890689"
			},
			"def1be40-38ab-11eb-9170-39cfe4f2e7de": {
				"_id": "def1be40-38ab-11eb-9170-39cfe4f2e7de",
				"_phrase": "according to keikaku",
				"_owner": "98556365965897728",
				"_victim": null,
				"_createdAt": 1607359639586,
				"_firedAt": null,
				"_messageId": "785548005830426706"
			},
			"b95ae470-3a92-11eb-81a5-b568b3d79ca7": {
				"_id": "b95ae470-3a92-11eb-81a5-b568b3d79ca7",
				"_phrase": "weak trap",
				"_owner": "260288776360820736",
				"_victim": null,
				"_createdAt": 1607568741426,
				"_firedAt": null,
				"_messageId": "786425042619203654"
			},
			"707f5dd0-4569-11eb-ada4-53e5fe685ad5": {
				"_id": "707f5dd0-4569-11eb-ada4-53e5fe685ad5",
				"_phrase": "another hinder trap",
				"_owner": "222169605253234689",
				"_victim": null,
				"_createdAt": 1608760472618,
				"_firedAt": null,
				"_messageId": "791423524723621909"
			},
			"ce5e1bf0-4ddc-11eb-9d4c-1d96b3cb019c": {
				"_id": "ce5e1bf0-4ddc-11eb-9d4c-1d96b3cb019c",
				"_phrase": "satsuki route",
				"_owner": "463799097586090014",
				"_victim": null,
				"_createdAt": 1609689631532,
				"_firedAt": null,
				"_messageId": "795320700457844776"
			},
			"006d4910-5d49-11eb-a0bb-934ada818db8": {
				"_id": "006d4910-5d49-11eb-a0bb-934ada818db8",
				"_phrase": "how did you not say that",
				"_owner": "310031015932329985",
				"_victim": null,
				"_createdAt": 1611385368606,
				"_firedAt": null,
				"_messageId": "802433137304666112"
			},
			"ef6307b0-ac83-11eb-986a-3dc12a3ab507": {
				"_id": "ef6307b0-ac83-11eb-986a-3dc12a3ab507",
				"_phrase": "lego star wars",
				"_owner": "177423709114466304",
				"_victim": null,
				"_createdAt": 1620096822184,
				"_firedAt": null,
				"_messageId": "838971621573132330"
			},
			"29ded370-c82b-11eb-a346-d1c3d22f9879": {
				"_id": "29ded370-c82b-11eb-a346-d1c3d22f9879",
				"_phrase": "600 billion explosive tags",
				"_owner": "287188227667001345",
				"_victim": null,
				"_createdAt": 1623137327650,
				"_firedAt": null,
				"_messageId": "851724425971105803"
			},
			"4ee89c50-c961-11eb-a346-d1c3d22f9879": {
				"_id": "4ee89c50-c961-11eb-a346-d1c3d22f9879",
				"_phrase": "cammie vs sagat",
				"_owner": "463799097586090014",
				"_victim": null,
				"_createdAt": 1623270533774,
				"_firedAt": null,
				"_messageId": "852283132811018261"
			},
			"79c23dc0-c97d-11eb-a346-d1c3d22f9879": {
				"_id": "79c23dc0-c97d-11eb-a346-d1c3d22f9879",
				"_phrase": "what time is raid",
				"_owner": "126855914694115328",
				"_victim": null,
				"_createdAt": 1623282631577,
				"_firedAt": null,
				"_messageId": "852333874838241291"
			},
			"c2617a4a-c9cb-4d2c-895e-31f3e0991ada": {
				"_id": "c2617a4a-c9cb-4d2c-895e-31f3e0991ada",
				"_phrase": "kira yamato",
				"_owner": "463799097586090014",
				"_victim": null,
				"_createdAt": 1636822517520,
				"_firedAt": null,
				"_messageId": "909124272616796200"
			},
			"ba7ee87e-f3d8-45f1-ab25-02fe3364cd86": {
				"_id": "ba7ee87e-f3d8-45f1-ab25-02fe3364cd86",
				"_phrase": "Lenta",
				"_owner": "287188227667001345",
				"_victim": null,
				"_createdAt": 1636899527724,
				"_firedAt": null,
				"_messageId": "909447276932530186"
			},
			"a61672a5-809a-4f9a-b607-4af988776a97": {
				"_id": "a61672a5-809a-4f9a-b607-4af988776a97",
				"_phrase": "off season",
				"_owner": "230860022555344896",
				"_victim": null,
				"_createdAt": 1637448614270,
				"_firedAt": null,
				"_messageId": "911750312514174976"
			},
			"054bda2b-5bc3-4b06-b3e1-d2bc3c0e959c": {
				"_id": "054bda2b-5bc3-4b06-b3e1-d2bc3c0e959c",
				"_phrase": "the same kind of stand",
				"_owner": "138398309776621569",
				"_victim": null,
				"_createdAt": 1639546683245,
				"_firedAt": null,
				"_messageId": "920550251553755137"
			},
			"a8636504-ea17-4997-8d47-af617da78109": {
				"_id": "a8636504-ea17-4997-8d47-af617da78109",
				"_phrase": "elderly",
				"_owner": "177423709114466304",
				"_victim": null,
				"_createdAt": 1643927188410,
				"_firedAt": null,
				"_messageId": "938923421134377012"
			},
			"87082fdb-6e89-4d94-93e1-b61bdfe48150": {
				"_id": "87082fdb-6e89-4d94-93e1-b61bdfe48150",
				"_phrase": "how does it work exactly",
				"_owner": "138398309776621569",
				"_victim": null,
				"_createdAt": 1645010941494,
				"_firedAt": null,
				"_messageId": "943469012002689024"
			},
			"d5bf502b-b2e2-42f2-927e-7a0b8b725281": {
				"_id": "d5bf502b-b2e2-42f2-927e-7a0b8b725281",
				"_phrase": "summon scroll",
				"_owner": "287188227667001345",
				"_victim": null,
				"_createdAt": 1645047802086,
				"_firedAt": null,
				"_messageId": "943623615407083620"
			},
			"c15298d3-4cfb-4c14-bf99-f3fd18f84c87": {
				"_id": "c15298d3-4cfb-4c14-bf99-f3fd18f84c87",
				"_phrase": "is that an overhead",
				"_owner": "463799097586090014",
				"_victim": null,
				"_createdAt": 1645195970006,
				"_firedAt": null,
				"_messageId": "944245075955826708"
			},
			"75eacae9-e57a-4339-9ae9-4041e8e849e1": {
				"_id": "75eacae9-e57a-4339-9ae9-4041e8e849e1",
				"_phrase": "i hate brizen",
				"_owner": "138398309776621569",
				"_victim": null,
				"_createdAt": 1645703589825,
				"_firedAt": null,
				"_messageId": "946374189215010827"
			}
		},
		"topRankings": {
			"traps": [
				{
					"_id": "07bc06a0-ede8-11ea-8dbc-03992ff515b3",
					"_phrase": "darksouls 2",
					"_owner": "191286686607474698",
					"_victim": "138398309776621569",
					"_createdAt": 1599139140616,
					"_firedAt": 1636583571999,
					"_messageId": "751068734239539332"
				},
				{
					"_id": "2904ea40-f59d-11ea-88c8-bb6ace38b74d",
					"_phrase": "small baby",
					"_owner": "173026718423056384",
					"_victim": "287188227667001345",
					"_createdAt": 1599986593506,
					"_firedAt": 1636898155437,
					"_messageId": "754623209554444288"
				},
				{
					"_id": "0e4fbe20-813c-11eb-9fd0-071fd390e343",
					"_phrase": "gun to your head",
					"_owner": "211283870736187394",
					"_victim": "310031015932329985",
					"_createdAt": 1615338050300,
					"_firedAt": 1637093814812,
					"_messageId": "819011885198082078"
				},
				{
					"_id": "b9a77180-5ea7-11eb-8546-1f1ae4d38820",
					"_phrase": "big green",
					"_owner": "287188227667001345",
					"_victim": "138398309776621569",
					"_createdAt": 1611536003221,
					"_firedAt": 1636720641371,
					"_messageId": "803064943435841566"
				},
				{
					"_id": "2f209a90-3a2c-11eb-87c6-8f2f6508d7b6",
					"_phrase": "Good feature",
					"_owner": "304354673647812608",
					"_victim": "174037015858249730",
					"_createdAt": 1607524700855,
					"_firedAt": 1631952143418,
					"_messageId": "786240323168108545"
				},
				{
					"_id": "3635de20-f1c6-11ea-abb5-df96cc470b47",
					"_phrase": "no jutsu",
					"_owner": "287188227667001345",
					"_victim": "138398309776621569",
					"_createdAt": 1599564420351,
					"_firedAt": 1622888057395,
					"_messageId": "752852486901202976"
				},
				{
					"_id": "282402d0-8208-11eb-9fd0-071fd390e343",
					"_phrase": "how lame",
					"_owner": "211283870736187394",
					"_victim": "260288776360820736",
					"_createdAt": 1615425710971,
					"_firedAt": 1636979983654,
					"_messageId": "819379561388703774"
				},
				{
					"_id": "81aec590-b66c-11eb-b884-3fc8901eadac",
					"_phrase": "tank's fault",
					"_owner": "138398309776621569",
					"_victim": "174037015858249730",
					"_createdAt": 1621186271334,
					"_firedAt": 1639079754629,
					"_messageId": "843541102875246642"
				},
				{
					"_id": "7f4e69d0-e3e6-11ea-9761-5ff2893586c1",
					"_phrase": "are you gonna be ok",
					"_owner": "138398309776621569",
					"_victim": "287188227667001345",
					"_createdAt": 1598038970603,
					"_firedAt": 1611384874079,
					"_messageId": "746454287051390987"
				},
				{
					"_id": "a34ac080-d659-11ea-af6d-6d1ef8a371e8",
					"_phrase": "akft",
					"_owner": "134062007547723777",
					"_victim": "147077165895254016",
					"_createdAt": 1596549106822,
					"_firedAt": 1612901525413,
					"_messageId": "740205345343012875"
				}
			],
			"users": [
				{
					"_id": "260288776360820736",
					"_description": null,
					"_createdAt": 1561655857407,
					"_inventory": {
						"_items": [
							{
								"id": 2,
								"_lastUsed": 1597210519189,
								"_acquired": "2020-08-02T21:05:54.588Z",
								"_quantity": 1
							},
							{
								"id": 1,
								"_lastUsed": 1596402042200,
								"_acquired": "2020-07-25T09:50:01.138Z",
								"_quantity": 1
							},
							{
								"id": 36,
								"_lastUsed": 1596479108309,
								"_acquired": "2020-08-03T18:25:08.249Z",
								"_quantity": 1
							},
							{
								"id": 35,
								"_lastUsed": 1598910939301,
								"_acquired": "2020-08-31T21:55:39.255Z",
								"_quantity": 1
							}
						]
					},
					"_stats": {
						"_experience": 2.320125138571844e+22,
						"_health": 800,
						"_energy": 1500
					},
					"_lastPelt": 1598910939255,
					"_traps": [],
					"_lastEdited": 1649638270714
				},
				{
					"_id": "463799097586090014",
					"_description": null,
					"_createdAt": 1596066583942,
					"_inventory": {
						"_items": [
							{
								"id": 15,
								"_lastUsed": 1641408386294,
								"_acquired": 1639618680435,
								"_quantity": 1
							},
							{
								"id": 32,
								"_lastUsed": 1643334812267,
								"_acquired": 1640210913135,
								"_quantity": 1
							},
							{
								"id": 30,
								"_lastUsed": 1642007447663,
								"_acquired": "2020-10-04T18:05:04.223Z",
								"_quantity": 1
							},
							{
								"id": 14,
								"_lastUsed": 1643415741628,
								"_acquired": "2020-10-24T16:55:13.990Z",
								"_quantity": 1
							},
							{
								"id": 13,
								"_lastUsed": 1643415745824,
								"_acquired": "2020-09-24T19:40:00.263Z",
								"_quantity": 1
							},
							{
								"id": 12,
								"_lastUsed": 1641660214388,
								"_acquired": "2020-09-15T01:08:49.187Z",
								"_quantity": 1
							},
							{
								"id": 27,
								"_lastUsed": 1642815746906,
								"_acquired": "2020-09-15T12:43:56.964Z",
								"_quantity": 1
							},
							{
								"id": 11,
								"_lastUsed": 1641408348217,
								"_acquired": "2020-09-11T01:40:15.064Z",
								"_quantity": 1
							},
							{
								"id": 25,
								"_lastUsed": 1641141830638,
								"_acquired": "2020-09-11T13:20:06.970Z",
								"_quantity": 1
							},
							{
								"id": 10,
								"_lastUsed": 1607810851746,
								"_acquired": "2020-09-07T14:13:09.677Z",
								"_quantity": 1
							},
							{
								"id": 23,
								"_lastUsed": 1640463933365,
								"_acquired": "2020-09-07T17:23:53.196Z",
								"_quantity": 1
							},
							{
								"id": 9,
								"_lastUsed": 1640642498912,
								"_acquired": "2020-09-04T21:13:39.591Z",
								"_quantity": 1
							},
							{
								"id": 8,
								"_lastUsed": 1641658351100,
								"_acquired": "2020-08-25T17:24:56.769Z",
								"_quantity": 1
							},
							{
								"id": 21,
								"_lastUsed": 1607810856951,
								"_acquired": "2020-08-26T13:31:18.919Z",
								"_quantity": 1
							},
							{
								"id": 7,
								"_lastUsed": 1640210899785,
								"_acquired": "2020-08-19T18:10:39.619Z",
								"_quantity": 1
							},
							{
								"id": 6,
								"_lastUsed": 1642815738141,
								"_acquired": "2020-08-16T01:36:09.367Z",
								"_quantity": 1
							},
							{
								"id": 35,
								"_lastUsed": 1640372359742,
								"_acquired": "2020-08-16T15:02:14.944Z",
								"_quantity": 1
							},
							{
								"id": 5,
								"_lastUsed": 1640643330437,
								"_acquired": "2020-08-12T13:35:25.958Z",
								"_quantity": 1
							},
							{
								"id": 4,
								"_lastUsed": 1607810874319,
								"_acquired": "2020-08-09T04:55:31.296Z",
								"_quantity": 1
							},
							{
								"id": 16,
								"_lastUsed": 1641660222543,
								"_acquired": "2020-08-04T17:52:00.063Z",
								"_quantity": 1
							},
							{
								"id": 3,
								"_lastUsed": 1640446621034,
								"_acquired": "2020-08-04T23:10:56.185Z",
								"_quantity": 1
							},
							{
								"id": 2,
								"_lastUsed": 1643334807823,
								"_acquired": "2020-08-03T18:31:45.358Z",
								"_quantity": 1
							},
							{
								"id": 1,
								"_lastUsed": 1641660206892,
								"_acquired": "2020-08-02T00:13:54.193Z",
								"_quantity": 1
							},
							{
								"id": 36,
								"_lastUsed": 1640643337501,
								"_acquired": "2020-08-01T21:07:23.091Z",
								"_quantity": 1
							},
							{
								"id": 17,
								"_lastUsed": 1642815716483,
								"_acquired": "2020-08-09T14:57:00.346Z",
								"_quantity": 1
							},
							{
								"id": 18,
								"_lastUsed": 1642815707869,
								"_acquired": "2020-08-12T19:47:40.077Z",
								"_quantity": 1
							},
							{
								"id": 29,
								"_lastUsed": 1642815727041,
								"_acquired": "2020-09-22T13:02:03.513Z",
								"_quantity": 1
							},
							{
								"id": 34,
								"_lastUsed": 1642815719691,
								"_acquired": 1640372400134,
								"_quantity": 1
							}
						]
					},
					"_stats": {
						"_experience": 34565,
						"_health": 800,
						"_energy": 1500
					},
					"_lastPelt": 1642815738018,
					"_traps": [
						"a3f216e0-115b-11eb-b142-7d074a5bd367",
						"ce5e1bf0-4ddc-11eb-9d4c-1d96b3cb019c",
						"4ee89c50-c961-11eb-a346-d1c3d22f9879",
						"c2617a4a-c9cb-4d2c-895e-31f3e0991ada",
						"c15298d3-4cfb-4c14-bf99-f3fd18f84c87"
					],
					"_lastEdited": 1649638270714
				},
				{
					"_id": "138398309776621569",
					"_description": null,
					"_createdAt": 1562101091167,
					"_inventory": {
						"_items": [
							{
								"id": 13,
								"_lastUsed": 1640737379439,
								"_acquired": 1639451167084,
								"_quantity": 1
							},
							{
								"id": 12,
								"_lastUsed": 1643247704210,
								"_acquired": "2020-11-17T01:57:33.263Z",
								"_quantity": 1
							},
							{
								"id": 27,
								"_lastUsed": 1642531525733,
								"_acquired": 1609033447334,
								"_quantity": 1
							},
							{
								"id": 25,
								"_lastUsed": 1639711778442,
								"_acquired": "2020-11-01T21:47:57.699Z",
								"_quantity": 1
							},
							{
								"id": 10,
								"_lastUsed": 1640737397079,
								"_acquired": "2020-09-24T22:01:04.452Z",
								"_quantity": 1
							},
							{
								"id": 23,
								"_lastUsed": 1640737393344,
								"_acquired": "2020-10-01T18:32:33.169Z",
								"_quantity": 1
							},
							{
								"id": 21,
								"_lastUsed": 1640737388804,
								"_acquired": "2020-08-27T17:09:32.533Z",
								"_quantity": 1
							},
							{
								"id": 7,
								"_lastUsed": 1640737374138,
								"_acquired": "2020-08-17T22:54:44.707Z",
								"_quantity": 1
							},
							{
								"id": 6,
								"_lastUsed": 1642531556930,
								"_acquired": "2020-08-14T19:05:31.132Z",
								"_quantity": 1
							},
							{
								"id": 5,
								"_lastUsed": 1640737375207,
								"_acquired": "2020-08-09T12:30:33.291Z",
								"_quantity": 1
							},
							{
								"id": 18,
								"_lastUsed": 1640737386061,
								"_acquired": "2020-08-09T22:43:46.743Z",
								"_quantity": 1
							},
							{
								"id": 17,
								"_lastUsed": 1639711760050,
								"_acquired": "2020-08-04T22:09:21.779Z",
								"_quantity": 1
							},
							{
								"id": 4,
								"_lastUsed": 1640737376323,
								"_acquired": "2020-08-03T00:49:21.746Z",
								"_quantity": 1
							},
							{
								"id": 3,
								"_lastUsed": 1639711763725,
								"_acquired": "2020-08-01T21:06:32.748Z",
								"_quantity": 1
							},
							{
								"id": 16,
								"_lastUsed": 1640737363181,
								"_acquired": "2020-07-29T23:15:05.446Z",
								"_quantity": 1
							},
							{
								"id": 2,
								"_lastUsed": 1640737357462,
								"_acquired": "2020-08-04T19:13:29.305Z",
								"_quantity": 1
							},
							{
								"id": 1,
								"_lastUsed": 1640737377211,
								"_acquired": "2020-07-25T19:48:51.694Z",
								"_quantity": 1
							},
							{
								"id": 36,
								"_lastUsed": 1640737378389,
								"_acquired": "2020-08-07T17:09:19.284Z",
								"_quantity": 1
							},
							{
								"id": 35,
								"_lastUsed": 1643247697046,
								"_acquired": "2020-08-13T20:35:36.677Z",
								"_quantity": 1
							},
							{
								"id": 9,
								"_lastUsed": 1643247684259,
								"_acquired": "2020-09-13T01:53:12.856Z",
								"_quantity": 1
							},
							{
								"id": 11,
								"_lastUsed": 1643247698810,
								"_acquired": "2020-10-29T01:19:15.097Z",
								"_quantity": 1
							},
							{
								"id": 8,
								"_lastUsed": 1643247688309,
								"_acquired": "2020-08-25T19:17:08.575Z",
								"_quantity": 1
							},
							{
								"id": 14,
								"_lastUsed": 1643247700669,
								"_acquired": 1639711751046,
								"_quantity": 1
							},
							{
								"id": 29,
								"_lastUsed": 1643247692664,
								"_acquired": 1639427026814,
								"_quantity": 1
							},
							{
								"id": 30,
								"_lastUsed": 1643247689990,
								"_acquired": 1640283308096,
								"_quantity": 1
							}
						]
					},
					"_stats": {
						"_experience": 25164,
						"_health": 800,
						"_energy": 1500
					},
					"_lastPelt": 1643247704081,
					"_traps": [
						"6f3e72c0-ce5f-11ea-afe4-67fc924e2936",
						"33ab73a0-3149-11eb-9170-39cfe4f2e7de",
						"054bda2b-5bc3-4b06-b3e1-d2bc3c0e959c",
						"87082fdb-6e89-4d94-93e1-b61bdfe48150",
						"75eacae9-e57a-4339-9ae9-4041e8e849e1"
					],
					"_lastEdited": 1649638270714
				},
				{
					"_id": "108378183253913600",
					"_description": null,
					"_createdAt": 1562100863053,
					"_inventory": {
						"_items": [
							{
								"id": 13,
								"_lastUsed": 1641660004656,
								"_acquired": 1641229740544,
								"_quantity": 1
							},
							{
								"id": 29,
								"_lastUsed": 1641408380517,
								"_acquired": 1641320640038,
								"_quantity": 1
							},
							{
								"id": 27,
								"_lastUsed": 1639289123262,
								"_acquired": 1639289123052,
								"_quantity": 1
							},
							{
								"id": 12,
								"_lastUsed": 1641408361432,
								"_acquired": 1639028945753,
								"_quantity": 1
							},
							{
								"id": 11,
								"_lastUsed": 1641659988743,
								"_acquired": "2020-11-03T20:06:42.420Z",
								"_quantity": 1
							},
							{
								"id": 10,
								"_lastUsed": 1641408377605,
								"_acquired": "2020-08-25T17:40:11.861Z",
								"_quantity": 1
							},
							{
								"id": 9,
								"_lastUsed": 1641659976954,
								"_acquired": "2020-08-10T23:22:10.926Z",
								"_quantity": 1
							},
							{
								"id": 7,
								"_lastUsed": 1641659990948,
								"_acquired": "2020-08-04T19:53:47.681Z",
								"_quantity": 1
							},
							{
								"id": 35,
								"_lastUsed": 1641659986771,
								"_acquired": "2020-08-04T01:56:11.685Z",
								"_quantity": 1
							},
							{
								"id": 5,
								"_lastUsed": 1640040641340,
								"_acquired": "2020-08-03T20:09:00.411Z",
								"_quantity": 1
							},
							{
								"id": 18,
								"_lastUsed": 1641659994993,
								"_acquired": "2020-08-03T21:40:08.936Z",
								"_quantity": 1
							},
							{
								"id": 4,
								"_lastUsed": 1641408344586,
								"_acquired": "2020-08-03T17:33:36.332Z",
								"_quantity": 1
							},
							{
								"id": 17,
								"_lastUsed": 1641659978746,
								"_acquired": "2020-08-03T00:53:41.715Z",
								"_quantity": 1
							},
							{
								"id": 16,
								"_lastUsed": 1641659997088,
								"_acquired": "2020-08-03T18:17:42.453Z",
								"_quantity": 1
							},
							{
								"id": 3,
								"_lastUsed": 1641229734919,
								"_acquired": "2020-08-02T18:46:48.484Z",
								"_quantity": 1
							},
							{
								"id": 2,
								"_lastUsed": 1640040659417,
								"_acquired": "2020-08-02T16:05:13.313Z",
								"_quantity": 1
							},
							{
								"id": 1,
								"_lastUsed": 1641229813589,
								"_acquired": "2020-08-01T21:06:49.984Z",
								"_quantity": 1
							},
							{
								"id": 6,
								"_lastUsed": 1642531533320,
								"_acquired": "2020-08-04T14:30:39.270Z",
								"_quantity": 1
							},
							{
								"id": 36,
								"_lastUsed": 1642531538247,
								"_acquired": "2020-08-02T05:25:32.340Z",
								"_quantity": 1
							},
							{
								"id": 23,
								"_lastUsed": 1642531535693,
								"_acquired": "2020-09-09T21:15:52.137Z",
								"_quantity": 1
							},
							{
								"id": 8,
								"_lastUsed": 1642531552570,
								"_acquired": "2020-08-09T19:16:11.601Z",
								"_quantity": 1
							},
							{
								"id": 21,
								"_lastUsed": 1642531522724,
								"_acquired": "2020-08-10T01:28:09.288Z",
								"_quantity": 1
							},
							{
								"id": 25,
								"_lastUsed": 1642531540698,
								"_acquired": "2020-11-06T04:48:14.181Z",
								"_quantity": 1
							}
						]
					},
					"_stats": {
						"_experience": 14053,
						"_health": 666,
						"_energy": 1300
					},
					"_lastPelt": 1642531552408,
					"_traps": [
						"6fdb6150-d118-11ea-85a9-21ffa8d806bc"
					],
					"_lastEdited": 1649638270714
				},
				{
					"_id": "134062007547723777",
					"_description": null,
					"_createdAt": 1577608372611,
					"_inventory": {
						"_items": [
							{
								"id": 13,
								"_lastUsed": 1599254896338,
								"_acquired": "2020-09-04T21:28:16.262Z",
								"_quantity": 1
							},
							{
								"id": 12,
								"_lastUsed": 1599925781475,
								"_acquired": "2020-08-22T18:32:18.004Z",
								"_quantity": 1
							},
							{
								"id": 11,
								"_lastUsed": 1598277256182,
								"_acquired": "2020-08-19T16:31:23.958Z",
								"_quantity": 1
							},
							{
								"id": 23,
								"_lastUsed": 1599489193379,
								"_acquired": "2020-08-16T19:01:17.608Z",
								"_quantity": 1
							},
							{
								"id": 10,
								"_lastUsed": 1598277271945,
								"_acquired": "2020-08-16T16:46:34.464Z",
								"_quantity": 1
							},
							{
								"id": 9,
								"_lastUsed": 1599489184216,
								"_acquired": "2020-08-11T13:38:40.474Z",
								"_quantity": 1
							},
							{
								"id": 8,
								"_lastUsed": 1599489154342,
								"_acquired": "2020-08-10T23:20:15.808Z",
								"_quantity": 1
							},
							{
								"id": 21,
								"_lastUsed": 1599925816057,
								"_acquired": "2020-08-11T00:22:20.769Z",
								"_quantity": 1
							},
							{
								"id": 7,
								"_lastUsed": 1598277188027,
								"_acquired": "2020-08-08T02:26:24.471Z",
								"_quantity": 1
							},
							{
								"id": 35,
								"_lastUsed": 1599408080784,
								"_acquired": "2020-08-04T20:11:58.526Z",
								"_quantity": 1
							},
							{
								"id": 6,
								"_lastUsed": 1598277230463,
								"_acquired": "2020-08-04T18:30:25.940Z",
								"_quantity": 1
							},
							{
								"id": 18,
								"_lastUsed": 1598038325116,
								"_acquired": "2020-08-04T17:21:56.867Z",
								"_quantity": 1
							},
							{
								"id": 5,
								"_lastUsed": 1599489138191,
								"_acquired": "2020-08-04T15:57:20.477Z",
								"_quantity": 1
							},
							{
								"id": 4,
								"_lastUsed": 1599408084604,
								"_acquired": "2020-08-03T18:19:53.238Z",
								"_quantity": 1
							},
							{
								"id": 17,
								"_lastUsed": 1598121117230,
								"_acquired": "2020-08-03T18:21:06.850Z",
								"_quantity": 1
							},
							{
								"id": 16,
								"_lastUsed": 1598277171014,
								"_acquired": "2020-08-03T18:19:57.152Z",
								"_quantity": 1
							},
							{
								"id": 3,
								"_lastUsed": 1599925773721,
								"_acquired": "2020-08-02T18:00:28.900Z",
								"_quantity": 1
							},
							{
								"id": 2,
								"_lastUsed": 1599489176238,
								"_acquired": "2020-08-02T00:28:29.344Z",
								"_quantity": 1
							},
							{
								"id": 1,
								"_lastUsed": 1599489188663,
								"_acquired": "2020-08-01T21:07:08.676Z",
								"_quantity": 1
							},
							{
								"id": 36,
								"_lastUsed": 1598465609151,
								"_acquired": "2020-08-02T19:56:10.495Z",
								"_quantity": 1
							},
							{
								"id": 25,
								"_lastUsed": 1599408047096,
								"_acquired": "2020-08-20T00:17:39.878Z",
								"_quantity": 1
							},
							{
								"id": 27,
								"_lastUsed": 1599925791608,
								"_acquired": "2020-08-22T23:19:25.960Z",
								"_quantity": 1
							},
							{
								"id": 29,
								"_lastUsed": 1599408071868,
								"_acquired": "2020-09-05T00:35:05.996Z",
								"_quantity": 1
							}
						]
					},
					"_stats": {
						"_experience": 13744,
						"_health": 666,
						"_energy": 1300
					},
					"_lastPelt": 1599266105997,
					"_traps": [],
					"_lastEdited": 1649638270714
				},
				{
					"_id": "173026718423056384",
					"_description": null,
					"_createdAt": 1577616294996,
					"_inventory": {
						"_items": [
							{
								"id": 11,
								"_lastUsed": 1612023751922,
								"_acquired": 1607811619173,
								"_quantity": 1
							},
							{
								"id": 10,
								"_lastUsed": 1612023760303,
								"_acquired": "2020-09-12T13:59:49.546Z",
								"_quantity": 1
							},
							{
								"id": 23,
								"_lastUsed": 1612023744135,
								"_acquired": "2020-09-12T17:04:19.833Z",
								"_quantity": 1
							},
							{
								"id": 9,
								"_lastUsed": 1612023765494,
								"_acquired": "2020-09-10T19:31:17.389Z",
								"_quantity": 1
							},
							{
								"id": 8,
								"_lastUsed": 1612023774055,
								"_acquired": "2020-09-09T22:23:50.621Z",
								"_quantity": 1
							},
							{
								"id": 21,
								"_lastUsed": 1612023803552,
								"_acquired": "2020-09-10T08:48:32.232Z",
								"_quantity": 1
							},
							{
								"id": 7,
								"_lastUsed": 1612023771869,
								"_acquired": "2020-09-08T12:59:20.399Z",
								"_quantity": 1
							},
							{
								"id": 35,
								"_lastUsed": 1612023821013,
								"_acquired": "2020-09-07T23:30:40.721Z",
								"_quantity": 1
							},
							{
								"id": 6,
								"_lastUsed": 1612023755896,
								"_acquired": "2020-09-08T10:57:07.496Z",
								"_quantity": 1
							},
							{
								"id": 18,
								"_lastUsed": 1612023758078,
								"_acquired": "2020-09-07T21:48:43.298Z",
								"_quantity": 1
							},
							{
								"id": 5,
								"_lastUsed": 1612023775899,
								"_acquired": "2020-09-07T19:42:25.552Z",
								"_quantity": 1
							},
							{
								"id": 4,
								"_lastUsed": 1612023750699,
								"_acquired": "2020-09-07T16:51:41.710Z",
								"_quantity": 1
							},
							{
								"id": 17,
								"_lastUsed": 1612023769139,
								"_acquired": "2020-09-08T00:44:40.626Z",
								"_quantity": 1
							},
							{
								"id": 16,
								"_lastUsed": 1612023802176,
								"_acquired": "2020-09-07T15:51:37.291Z",
								"_quantity": 1
							},
							{
								"id": 3,
								"_lastUsed": 1612023823303,
								"_acquired": "2020-09-07T18:33:41.684Z",
								"_quantity": 1
							},
							{
								"id": 2,
								"_lastUsed": 1612023762864,
								"_acquired": "2020-09-07T14:50:27.985Z",
								"_quantity": 1
							},
							{
								"id": 1,
								"_lastUsed": 1612023767134,
								"_acquired": "2020-09-07T13:48:50.471Z",
								"_quantity": 1
							},
							{
								"id": 36,
								"_lastUsed": 1612023753574,
								"_acquired": "2020-09-07T20:44:24.143Z",
								"_quantity": 1
							},
							{
								"id": 25,
								"_lastUsed": 1612023668127,
								"_acquired": 1612023668034,
								"_quantity": 1
							}
						]
					},
					"_stats": {
						"_experience": 7609,
						"_health": 450,
						"_energy": 1100
					},
					"_lastPelt": 1612023668034,
					"_traps": [],
					"_lastEdited": 1649638270714
				},
				{
					"_id": "304354673647812608",
					"_description": null,
					"_createdAt": 1562100945933,
					"_inventory": {
						"_items": [
							{
								"id": 9,
								"_lastUsed": 1615327842896,
								"_acquired": "2020-09-24T20:34:02.686Z",
								"_quantity": 1
							},
							{
								"id": 8,
								"_lastUsed": 1600979658955,
								"_acquired": "2020-09-21T23:43:48.826Z",
								"_quantity": 1
							},
							{
								"id": 21,
								"_lastUsed": 1600979685687,
								"_acquired": "2020-09-22T02:10:23.399Z",
								"_quantity": 1
							},
							{
								"id": 7,
								"_lastUsed": 1600979677156,
								"_acquired": "2020-09-16T18:12:35.737Z",
								"_quantity": 1
							},
							{
								"id": 35,
								"_lastUsed": 1600783747518,
								"_acquired": "2020-09-15T16:12:39.609Z",
								"_quantity": 1
							},
							{
								"id": 6,
								"_lastUsed": 1603819928308,
								"_acquired": "2020-09-15T20:19:38.553Z",
								"_quantity": 1
							},
							{
								"id": 5,
								"_lastUsed": 1600783758023,
								"_acquired": "2020-09-15T11:19:55.528Z",
								"_quantity": 1
							},
							{
								"id": 18,
								"_lastUsed": 1600783742783,
								"_acquired": "2020-09-15T13:41:10.862Z",
								"_quantity": 1
							},
							{
								"id": 4,
								"_lastUsed": 1600979682606,
								"_acquired": "2020-09-14T10:53:01.591Z",
								"_quantity": 1
							},
							{
								"id": 17,
								"_lastUsed": 1600979667299,
								"_acquired": "2020-09-14T20:05:17.569Z",
								"_quantity": 1
							},
							{
								"id": 16,
								"_lastUsed": 1600979679626,
								"_acquired": "2020-09-13T11:29:00.915Z",
								"_quantity": 1
							},
							{
								"id": 3,
								"_lastUsed": 1600783763116,
								"_acquired": "2020-09-13T14:15:52.627Z",
								"_quantity": 1
							},
							{
								"id": 2,
								"_lastUsed": 1600979655274,
								"_acquired": "2020-09-11T19:38:03.109Z",
								"_quantity": 1
							},
							{
								"id": 36,
								"_lastUsed": 1603803372508,
								"_acquired": "2020-09-10T12:47:33.867Z",
								"_quantity": 1
							},
							{
								"id": 1,
								"_lastUsed": 1600979674515,
								"_acquired": "2020-09-10T00:15:48.285Z",
								"_quantity": 1
							}
						]
					},
					"_stats": {
						"_experience": 3538,
						"_health": 400,
						"_energy": 1000
					},
					"_lastPelt": 1615327842786,
					"_traps": [
						"ecdde880-d721-11ea-91cc-3981e0f228e1"
					],
					"_lastEdited": 1649638270714
				},
				{
					"_id": "211283870736187394",
					"_description": null,
					"_createdAt": 1605489072624,
					"_inventory": {
						"_items": [
							{
								"id": 5,
								"_lastUsed": 1607463250654,
								"_acquired": "2020-12-08T21:34:10.570Z",
								"_quantity": 1
							}
						]
					},
					"_stats": {
						"_experience": 3250,
						"_health": 350,
						"_energy": 900
					},
					"_lastPelt": 1607463250570,
					"_traps": [],
					"_lastEdited": 1649638270714
				},
				{
					"_id": "287188227667001345",
					"_description": null,
					"_createdAt": 1580283224097,
					"_inventory": {
						"_items": [
							{
								"id": 1,
								"_lastUsed": 1596596951997,
								"_acquired": "2020-07-25T23:36:59.296Z",
								"_quantity": 1
							},
							{
								"id": 2,
								"_lastUsed": 1596596965079,
								"_acquired": "2020-08-05T03:09:25.041Z",
								"_quantity": 1
							}
						]
					},
					"_stats": {
						"_experience": 3247,
						"_health": 350,
						"_energy": 900
					},
					"_lastPelt": 1596596965041,
					"_traps": [
						"29ded370-c82b-11eb-a346-d1c3d22f9879",
						"ba7ee87e-f3d8-45f1-ab25-02fe3364cd86",
						"d5bf502b-b2e2-42f2-927e-7a0b8b725281"
					],
					"_lastEdited": 1649638270714
				},
				{
					"_id": "177423709114466304",
					"_description": null,
					"_createdAt": 1591927397363,
					"_inventory": {
						"_items": [
							{
								"id": 16,
								"_lastUsed": 1615327849512,
								"_acquired": 1612373221304,
								"_quantity": 1
							},
							{
								"id": 2,
								"_lastUsed": 1615327845856,
								"_acquired": 1611971144874,
								"_quantity": 1
							},
							{
								"id": 36,
								"_lastUsed": 1615327842057,
								"_acquired": 1610579613611,
								"_quantity": 1
							},
							{
								"id": 1,
								"_lastUsed": 1615327852568,
								"_acquired": 1611984168772,
								"_quantity": 1
							},
							{
								"id": 3,
								"_lastUsed": 1615327829159,
								"_acquired": 1615327829056,
								"_quantity": 1
							}
						]
					},
					"_stats": {
						"_experience": 1190,
						"_health": 250,
						"_energy": 700
					},
					"_lastPelt": 1615327829056,
					"_traps": [
						"ef6307b0-ac83-11eb-986a-3dc12a3ab507",
						"a8636504-ea17-4997-8d47-af617da78109"
					],
					"_lastEdited": 1649638270714
				}
			],
			"blunders": [
				{
					"_id": "5a0df830-ec82-11ea-ae04-91347590a6b4",
					"_phrase": "go to hell",
					"_owner": "177423709114466304",
					"_victim": "177423709114466304",
					"_createdAt": 1598985518897,
					"_firedAt": 1619745629181,
					"_messageId": "750424398372274226"
				},
				{
					"_id": "56bc8150-1a37-11eb-a8e8-ddea7806f94f",
					"_phrase": "desynch",
					"_owner": "463799097586090014",
					"_victim": "463799097586090014",
					"_createdAt": 1604011054563,
					"_firedAt": 1623200708088,
					"_messageId": "771503022173323315"
				},
				{
					"_id": "78fe1400-3d4f-11eb-89ff-6d0bc6dd2d35",
					"_phrase": "gilgamesh",
					"_owner": "211283870736187394",
					"_victim": "211283870736187394",
					"_createdAt": 1607869710652,
					"_firedAt": 1615324884988,
					"_messageId": "787687399202619392"
				},
				{
					"_id": "440ec350-eae5-11ea-b210-9b6a2bfad497",
					"_phrase": "happy birthday",
					"_owner": "463799097586090014",
					"_victim": "463799097586090014",
					"_createdAt": 1598808099843,
					"_firedAt": 1605132530025,
					"_messageId": "749680248857034823"
				},
				{
					"_id": "b0ab7f20-d731-11ea-91cc-3981e0f228e1",
					"_phrase": "monke",
					"_owner": "177423709114466304",
					"_victim": "177423709114466304",
					"_createdAt": 1596641900559,
					"_firedAt": 1598985425231,
					"_messageId": "740594550502064179"
				},
				{
					"_id": "3c5f4580-5f93-11eb-8546-1f1ae4d38820",
					"_phrase": "bug net",
					"_owner": "138398309776621569",
					"_victim": "138398309776621569",
					"_createdAt": 1611637154261,
					"_firedAt": 1613677444088,
					"_messageId": "803489202838831104"
				},
				{
					"_id": "92941314-264d-4a68-8d16-baa44f80db98",
					"_phrase": "with a gun",
					"_owner": "177423709114466304",
					"_victim": "177423709114466304",
					"_createdAt": 1640043226417,
					"_firedAt": 1641885867340,
					"_messageId": "922632904817926174"
				},
				{
					"_id": "e79885d3-478e-4d0c-aef4-3dd9f7f7dc32",
					"_phrase": "i struggle to",
					"_owner": "138398309776621569",
					"_victim": "138398309776621569",
					"_createdAt": 1645010631118,
					"_firedAt": 1645703514010,
					"_messageId": "943467710111678494"
				},
				{
					"_id": "7cbf31f0-cf8f-11eb-91ce-85fd9af1c58c",
					"_phrase": "testament",
					"_owner": "366528667100250113",
					"_victim": "366528667100250113",
					"_createdAt": 1623950074507,
					"_firedAt": 1624741270563,
					"_messageId": "855133332605763625"
				},
				{
					"_id": "157d2d90-3a97-11eb-81a5-b568b3d79ca7",
					"_phrase": "gilgamesh",
					"_owner": "211283870736187394",
					"_victim": "211283870736187394",
					"_createdAt": 1607570613990,
					"_firedAt": 1607869641540,
					"_messageId": "786432896659095602"
				}
			]
		}
	},
	"admin": {
		"deleteChannelID": "474341320517746689",
		"trapChannelID": "437775375213264926",
		"roleChannelID": "475440958935400448",
		"accountChannelID": null,
		"gulagChannelID": null,
		"moderationChannelID": "720243590974144595",
		"moderationRoleID": "720243816824700948",
		"allowGulagUnmoderated": true
	},
	"points": {
		"users": {
			"260288776360820736": {
				"_id": "260288776360820736",
				"_accounts": [],
				"_createdAt": 1561762972282,
				"_currentBalance": 100000014739,
				"_lifetimeBalance": 100000024259,
				"_bets": {
					"1a5d2850-99f9-11e9-943d-03015f6e23b5": "3bc148a0-99f9-11e9-943d-03015f6e23b5",
					"a60fea20-9d0c-11e9-943d-03015f6e23b5": "e49aa820-9d0c-11e9-943d-03015f6e23b5",
					"36e08410-9d0d-11e9-943d-03015f6e23b5": "3b87ec10-9d0d-11e9-943d-03015f6e23b5",
					"4638ed60-a840-11e9-bd28-b354ce9f3528": "91094d30-a840-11e9-bd28-b354ce9f3528",
					"5e10c3a0-9f92-11ea-8919-d395d3434d4b": "6827ecb0-9f92-11ea-8919-d395d3434d4b",
					"8ebe76f0-9f92-11ea-8919-d395d3434d4b": "9eaa1650-9f92-11ea-8919-d395d3434d4b",
					"cdd08d60-9f92-11ea-8919-d395d3434d4b": "6bb697c0-ca7e-11ea-b7ca-497f43bcd90a",
					"a965aed0-a8d3-11e9-bd28-b354ce9f3528": "6ce8e0c0-ca7f-11ea-b7ca-497f43bcd90a",
					"da969110-f097-11ea-bb5d-f3bf67cc597f": "e73ec540-f097-11ea-bb5d-f3bf67cc597f",
					"1efb9660-1c09-11eb-bbdc-c5ae2af77fc6": "add46280-1c0a-11eb-bbdc-c5ae2af77fc6",
					"e8979330-b352-11eb-92b2-a32ed7e3969a": "b0ad5bc0-b41b-11eb-92b2-a32ed7e3969a"
				},
				"_changes": [
					"2637fa60-99f9-11e9-943d-03015f6e23b5",
					"37a9c490-99f9-11e9-943d-03015f6e23b5",
					"3b188580-99f9-11e9-943d-03015f6e23b5",
					"3bc148a0-99f9-11e9-943d-03015f6e23b5",
					"a99dcbd0-9d0c-11e9-943d-03015f6e23b5",
					"c63fd030-9d0c-11e9-943d-03015f6e23b5",
					"e45784a0-9d0c-11e9-943d-03015f6e23b5",
					"e49aa820-9d0c-11e9-943d-03015f6e23b5",
					"3b87ec10-9d0d-11e9-943d-03015f6e23b5",
					"4ddd8691-9d0d-11e9-943d-03015f6e23b5",
					"83fc3cb0-a840-11e9-bd28-b354ce9f3528",
					"8a599210-a840-11e9-bd28-b354ce9f3528",
					"8ab65810-a840-11e9-bd28-b354ce9f3528",
					"8ae99d10-a840-11e9-bd28-b354ce9f3528",
					"8b4fd8f0-a840-11e9-bd28-b354ce9f3528",
					"8bb77460-a840-11e9-bd28-b354ce9f3528",
					"8c165d40-a840-11e9-bd28-b354ce9f3528",
					"8c495420-a840-11e9-bd28-b354ce9f3528",
					"8c780540-a840-11e9-bd28-b354ce9f3528",
					"8ca5a4f0-a840-11e9-bd28-b354ce9f3528",
					"8cd78a60-a840-11e9-bd28-b354ce9f3528",
					"8d42f660-a840-11e9-bd28-b354ce9f3528",
					"8ddf3660-a840-11e9-bd28-b354ce9f3528",
					"8e474700-a840-11e9-bd28-b354ce9f3528",
					"91094d30-a840-11e9-bd28-b354ce9f3528",
					"b823a3a0-a8d3-11e9-bd28-b354ce9f3528",
					"295b6ad0-001d-11ea-a693-714a24e863fc",
					"6827ecb0-9f92-11ea-8919-d395d3434d4b",
					"9eaa1650-9f92-11ea-8919-d395d3434d4b",
					"a4042c81-9f92-11ea-8919-d395d3434d4b",
					"a64b3652-9f92-11ea-8919-d395d3434d4b",
					"d06df492-9f92-11ea-8919-d395d3434d4b",
					"7c95f200-b5ae-11ea-83b1-cf73ad225062",
					"6bb697c0-ca7e-11ea-b7ca-497f43bcd90a",
					"6c5b1fb0-ca7f-11ea-b7ca-497f43bcd90a",
					"6ce8e0c0-ca7f-11ea-b7ca-497f43bcd90a",
					"81bf0ba1-ca7f-11ea-b7ca-497f43bcd90a",
					"62503b32-ccba-11ea-b62a-3b3a5e6c9540",
					"e73ec540-f097-11ea-bb5d-f3bf67cc597f",
					"add46280-1c0a-11eb-bbdc-c5ae2af77fc6",
					"ce396253-1c0a-11eb-bbdc-c5ae2af77fc6",
					"ee4f59c0-b352-11eb-92b2-a32ed7e3969a",
					"b0269f90-b41b-11eb-92b2-a32ed7e3969a",
					"b0ad5bc0-b41b-11eb-92b2-a32ed7e3969a",
					"4cef4c41-c22d-11eb-a61a-2b20bf2044ac"
				],
				"_grants": [
					"37a9c490-99f9-11e9-943d-03015f6e23b5",
					"3a1cc060-99f9-11e9-943d-03015f6e23b5",
					"3b188580-99f9-11e9-943d-03015f6e23b5",
					"41a612a0-99f9-11e9-943d-03015f6e23b5",
					"f73ee4d0-9a0c-11e9-943d-03015f6e23b5",
					"dd6314d0-9d0b-11e9-943d-03015f6e23b5",
					"c0e4cfa0-9d0c-11e9-943d-03015f6e23b5",
					"c63fd030-9d0c-11e9-943d-03015f6e23b5",
					"c92cb6f0-9d0c-11e9-943d-03015f6e23b5",
					"cc2d25b0-9d0c-11e9-943d-03015f6e23b5",
					"d2279a90-9d0c-11e9-943d-03015f6e23b5",
					"e45784a0-9d0c-11e9-943d-03015f6e23b5",
					"8a599210-a840-11e9-bd28-b354ce9f3528",
					"8ae99d10-a840-11e9-bd28-b354ce9f3528",
					"8bb77460-a840-11e9-bd28-b354ce9f3528",
					"8c495420-a840-11e9-bd28-b354ce9f3528",
					"8ca5a4f0-a840-11e9-bd28-b354ce9f3528",
					"8d42f660-a840-11e9-bd28-b354ce9f3528",
					"8e474700-a840-11e9-bd28-b354ce9f3528",
					"7f5d2500-0017-11ea-9ecd-f984eb8b6e33",
					"295b6ad0-001d-11ea-a693-714a24e863fc",
					"3a6bdb20-001d-11ea-a693-714a24e863fc",
					"830ab820-0021-11ea-a693-714a24e863fc",
					"25ac5000-9f93-11ea-8919-d395d3434d4b",
					"4accb500-9f93-11ea-8919-d395d3434d4b",
					"9f3ef2c0-ac08-11ea-882e-ed9f313dc034",
					"7c95f200-b5ae-11ea-83b1-cf73ad225062",
					"6c5b1fb0-ca7f-11ea-b7ca-497f43bcd90a",
					"2bf31640-b41b-11eb-92b2-a32ed7e3969a",
					"9cc78450-b41b-11eb-92b2-a32ed7e3969a",
					"b0269f90-b41b-11eb-92b2-a32ed7e3969a"
				]
			},
			"174037015858249730": {
				"_id": "174037015858249730",
				"_accounts": [],
				"_createdAt": 1561763094909,
				"_currentBalance": 999999993250,
				"_lifetimeBalance": 1000000007750,
				"_bets": {
					"1a5d2850-99f9-11e9-943d-03015f6e23b5": "406be4f0-99f9-11e9-943d-03015f6e23b5",
					"4638ed60-a840-11e9-bd28-b354ce9f3528": "62883de0-a840-11e9-bd28-b354ce9f3528",
					"a965aed0-a8d3-11e9-bd28-b354ce9f3528": "af5b41b0-a8d3-11e9-bd28-b354ce9f3528",
					"3e5cac10-0017-11ea-9ecd-f984eb8b6e33": "feca2bf0-001f-11ea-a693-714a24e863fc",
					"1ce0d3a0-8040-11ea-9be4-9969d6450102": "2e0f5340-8040-11ea-9be4-9969d6450102",
					"cdd08d60-9f92-11ea-8919-d395d3434d4b": "d3212db0-9f92-11ea-8919-d395d3434d4b",
					"1efb9660-1c09-11eb-bbdc-c5ae2af77fc6": "22849610-1c09-11eb-bbdc-c5ae2af77fc6",
					"593f0280-6db2-11eb-ab2e-25fa00710320": "70b48800-6dc0-11eb-ab2e-25fa00710320",
					"e8979330-b352-11eb-92b2-a32ed7e3969a": "d9187d00-b36d-11eb-92b2-a32ed7e3969a"
				},
				"_changes": [
					"24753bc0-99f9-11e9-943d-03015f6e23b5",
					"3a1cc060-99f9-11e9-943d-03015f6e23b5",
					"3fd215f0-99f9-11e9-943d-03015f6e23b5",
					"406be4f0-99f9-11e9-943d-03015f6e23b5",
					"5614fc60-a840-11e9-bd28-b354ce9f3528",
					"5d6bccf0-a840-11e9-bd28-b354ce9f3528",
					"5e085b10-a840-11e9-bd28-b354ce9f3528",
					"5e824600-a840-11e9-bd28-b354ce9f3528",
					"5ee24050-a840-11e9-bd28-b354ce9f3528",
					"60814a50-a840-11e9-bd28-b354ce9f3528",
					"60d7a7b0-a840-11e9-bd28-b354ce9f3528",
					"610917f0-a840-11e9-bd28-b354ce9f3528",
					"61316070-a840-11e9-bd28-b354ce9f3528",
					"61625b80-a840-11e9-bd28-b354ce9f3528",
					"61a13940-a840-11e9-bd28-b354ce9f3528",
					"61c3b560-a840-11e9-bd28-b354ce9f3528",
					"61f3ed20-a840-11e9-bd28-b354ce9f3528",
					"6252fd10-a840-11e9-bd28-b354ce9f3528",
					"62883de0-a840-11e9-bd28-b354ce9f3528",
					"af5b41b0-a8d3-11e9-bd28-b354ce9f3528",
					"08420bf0-0019-11ea-a693-714a24e863fc",
					"3a6bdb20-001d-11ea-a693-714a24e863fc",
					"f3d83340-001f-11ea-a693-714a24e863fc",
					"fdd9b170-001f-11ea-a693-714a24e863fc",
					"feca2bf0-001f-11ea-a693-714a24e863fc",
					"1fe512f0-8040-11ea-9be4-9969d6450102",
					"2cf22370-8040-11ea-9be4-9969d6450102",
					"2e0f5340-8040-11ea-9be4-9969d6450102",
					"d06df491-9f92-11ea-8919-d395d3434d4b",
					"d3212db0-9f92-11ea-8919-d395d3434d4b",
					"62503b30-ccba-11ea-b62a-3b3a5e6c9540",
					"22849610-1c09-11eb-bbdc-c5ae2af77fc6",
					"ce396250-1c0a-11eb-bbdc-c5ae2af77fc6",
					"70b48800-6dc0-11eb-ab2e-25fa00710320",
					"d9187d00-b36d-11eb-92b2-a32ed7e3969a",
					"4cef2531-c22d-11eb-a61a-2b20bf2044ac"
				],
				"_grants": [
					"3fd215f0-99f9-11e9-943d-03015f6e23b5",
					"5d6bccf0-a840-11e9-bd28-b354ce9f3528",
					"5e824600-a840-11e9-bd28-b354ce9f3528",
					"60814a50-a840-11e9-bd28-b354ce9f3528",
					"610917f0-a840-11e9-bd28-b354ce9f3528",
					"61625b80-a840-11e9-bd28-b354ce9f3528",
					"61c3b560-a840-11e9-bd28-b354ce9f3528",
					"6252fd10-a840-11e9-bd28-b354ce9f3528",
					"f3d83340-001f-11ea-a693-714a24e863fc",
					"fdd9b170-001f-11ea-a693-714a24e863fc",
					"2cf22370-8040-11ea-9be4-9969d6450102"
				]
			},
			"138398309776621569": {
				"_id": "138398309776621569",
				"_accounts": [],
				"_createdAt": 1561763143883,
				"_currentBalance": 3916,
				"_lifetimeBalance": 500000014436,
				"_bets": {
					"1a5d2850-99f9-11e9-943d-03015f6e23b5": "cb5cc880-99fa-11e9-943d-03015f6e23b5",
					"a60fea20-9d0c-11e9-943d-03015f6e23b5": "f6b116c0-9d0c-11e9-943d-03015f6e23b5",
					"36e08410-9d0d-11e9-943d-03015f6e23b5": "39259210-9d0d-11e9-943d-03015f6e23b5",
					"4638ed60-a840-11e9-bd28-b354ce9f3528": "4adf9210-a840-11e9-bd28-b354ce9f3528",
					"a965aed0-a8d3-11e9-bd28-b354ce9f3528": "ad9e4f70-a8d3-11e9-bd28-b354ce9f3528",
					"3e5cac10-0017-11ea-9ecd-f984eb8b6e33": "86f0d780-0017-11ea-9ecd-f984eb8b6e33",
					"1ce0d3a0-8040-11ea-9be4-9969d6450102": "222c1cc0-8040-11ea-9be4-9969d6450102",
					"5e10c3a0-9f92-11ea-8919-d395d3434d4b": "628b0120-9f92-11ea-8919-d395d3434d4b",
					"cdd08d60-9f92-11ea-8919-d395d3434d4b": "e3fd95b0-9f92-11ea-8919-d395d3434d4b",
					"da969110-f097-11ea-bb5d-f3bf67cc597f": "06308600-f098-11ea-bb5d-f3bf67cc597f",
					"1efb9660-1c09-11eb-bbdc-c5ae2af77fc6": "25cce340-1c09-11eb-bbdc-c5ae2af77fc6",
					"593f0280-6db2-11eb-ab2e-25fa00710320": "69690ca0-6dc1-11eb-ab2e-25fa00710320",
					"e8979330-b352-11eb-92b2-a32ed7e3969a": "1bfd88b0-b353-11eb-92b2-a32ed7e3969a"
				},
				"_changes": [
					"41a612a0-99f9-11e9-943d-03015f6e23b5",
					"cb5cc880-99fa-11e9-943d-03015f6e23b5",
					"ac046b90-9d0c-11e9-943d-03015f6e23b5",
					"c0e4cfa0-9d0c-11e9-943d-03015f6e23b5",
					"c3ee6620-9d0c-11e9-943d-03015f6e23b5",
					"c46a73f0-9d0c-11e9-943d-03015f6e23b5",
					"f5805ef0-9d0c-11e9-943d-03015f6e23b5",
					"f6b116c0-9d0c-11e9-943d-03015f6e23b5",
					"39259210-9d0d-11e9-943d-03015f6e23b5",
					"4ddd8690-9d0d-11e9-943d-03015f6e23b5",
					"4adf9210-a840-11e9-bd28-b354ce9f3528",
					"ad9e4f70-a8d3-11e9-bd28-b354ce9f3528",
					"60799510-0017-11ea-9ecd-f984eb8b6e33",
					"7f5d2500-0017-11ea-9ecd-f984eb8b6e33",
					"85035f60-0017-11ea-9ecd-f984eb8b6e33",
					"86f0d780-0017-11ea-9ecd-f984eb8b6e33",
					"830ab820-0021-11ea-a693-714a24e863fc",
					"222c1cc0-8040-11ea-9be4-9969d6450102",
					"628b0120-9f92-11ea-8919-d395d3434d4b",
					"a64b3651-9f92-11ea-8919-d395d3434d4b",
					"d06df490-9f92-11ea-8919-d395d3434d4b",
					"e3fd95b0-9f92-11ea-8919-d395d3434d4b",
					"9f3ef2c0-ac08-11ea-882e-ed9f313dc034",
					"81bf0ba0-ca7f-11ea-b7ca-497f43bcd90a",
					"06308600-f098-11ea-bb5d-f3bf67cc597f",
					"235839c0-1c09-11eb-bbdc-c5ae2af77fc6",
					"25355e30-1c09-11eb-bbdc-c5ae2af77fc6",
					"25cce340-1c09-11eb-bbdc-c5ae2af77fc6",
					"ce396251-1c0a-11eb-bbdc-c5ae2af77fc6",
					"201d8b00-6db4-11eb-ab2e-25fa00710320",
					"68282830-6dc1-11eb-ab2e-25fa00710320",
					"69690ca0-6dc1-11eb-ab2e-25fa00710320",
					"4eb0aed1-6dcc-11eb-ab2e-25fa00710320",
					"1bfd88b0-b353-11eb-92b2-a32ed7e3969a",
					"4ceeb000-c22d-11eb-a61a-2b20bf2044ac"
				],
				"_grants": [
					"c3ee6620-9d0c-11e9-943d-03015f6e23b5",
					"f5805ef0-9d0c-11e9-943d-03015f6e23b5",
					"85035f60-0017-11ea-9ecd-f984eb8b6e33",
					"25355e30-1c09-11eb-bbdc-c5ae2af77fc6",
					"68282830-6dc1-11eb-ab2e-25fa00710320"
				]
			},
			"310031015932329985": {
				"_id": "310031015932329985",
				"_accounts": [],
				"_createdAt": 1561771608990,
				"_currentBalance": 10666,
				"_lifetimeBalance": 11666,
				"_bets": {
					"593f0280-6db2-11eb-ab2e-25fa00710320": "f0e00120-6dc1-11eb-ab2e-25fa00710320"
				},
				"_changes": [
					"f73ee4d0-9a0c-11e9-943d-03015f6e23b5",
					"d2279a90-9d0c-11e9-943d-03015f6e23b5",
					"f0e00120-6dc1-11eb-ab2e-25fa00710320",
					"4eb0aed2-6dcc-11eb-ab2e-25fa00710320"
				],
				"_grants": []
			},
			"108378183253913600": {
				"_id": "108378183253913600",
				"_accounts": [],
				"_createdAt": 1562100989598,
				"_currentBalance": 4989,
				"_lifetimeBalance": 5000,
				"_bets": {
					"a60fea20-9d0c-11e9-943d-03015f6e23b5": "b5e01240-9d0c-11e9-943d-03015f6e23b5",
					"5e10c3a0-9f92-11ea-8919-d395d3434d4b": "7ab279e0-9f92-11ea-8919-d395d3434d4b",
					"8ebe76f0-9f92-11ea-8919-d395d3434d4b": "983c6d40-9f92-11ea-8919-d395d3434d4b"
				},
				"_changes": [
					"dd6314d0-9d0b-11e9-943d-03015f6e23b5",
					"b1667100-9d0c-11e9-943d-03015f6e23b5",
					"b2703fe0-9d0c-11e9-943d-03015f6e23b5",
					"b5e01240-9d0c-11e9-943d-03015f6e23b5",
					"7ab279e0-9f92-11ea-8919-d395d3434d4b",
					"983c6d40-9f92-11ea-8919-d395d3434d4b",
					"a4042c80-9f92-11ea-8919-d395d3434d4b",
					"a64b3654-9f92-11ea-8919-d395d3434d4b",
					"4accb500-9f93-11ea-8919-d395d3434d4b"
				],
				"_grants": [
					"b2703fe0-9d0c-11e9-943d-03015f6e23b5"
				]
			},
			"304354673647812608": {
				"_id": "304354673647812608",
				"_accounts": [],
				"_createdAt": 1562101385184,
				"_currentBalance": 3500,
				"_lifetimeBalance": 5000,
				"_bets": {
					"3e5cac10-0017-11ea-9ecd-f984eb8b6e33": "8dd78120-0017-11ea-9ecd-f984eb8b6e33"
				},
				"_changes": [
					"c92cb6f0-9d0c-11e9-943d-03015f6e23b5",
					"8dd78120-0017-11ea-9ecd-f984eb8b6e33"
				],
				"_grants": []
			},
			"191286686607474698": {
				"_id": "191286686607474698",
				"_accounts": [],
				"_createdAt": 1562101390220,
				"_currentBalance": 4990,
				"_lifetimeBalance": 5000,
				"_bets": {
					"a60fea20-9d0c-11e9-943d-03015f6e23b5": "e7137050-9d0c-11e9-943d-03015f6e23b5"
				},
				"_changes": [
					"cc2d25b0-9d0c-11e9-943d-03015f6e23b5",
					"e7137050-9d0c-11e9-943d-03015f6e23b5"
				],
				"_grants": []
			},
			"382544116808155137": {
				"_id": "382544116808155137",
				"_accounts": [],
				"_createdAt": 1572991157183,
				"_currentBalance": 0,
				"_lifetimeBalance": 0,
				"_bets": {
					"3e5cac10-0017-11ea-9ecd-f984eb8b6e33": "83171fc0-0017-11ea-9ecd-f984eb8b6e33",
					"1efb9660-1c09-11eb-bbdc-c5ae2af77fc6": "25f4b690-1c09-11eb-bbdc-c5ae2af77fc6"
				},
				"_changes": [
					"83171fc0-0017-11ea-9ecd-f984eb8b6e33",
					"25f4b690-1c09-11eb-bbdc-c5ae2af77fc6",
					"ce396252-1c0a-11eb-bbdc-c5ae2af77fc6"
				],
				"_grants": []
			},
			"230860022555344896": {
				"_id": "230860022555344896",
				"_accounts": [],
				"_createdAt": 1587084212479,
				"_currentBalance": 0,
				"_lifetimeBalance": 0,
				"_bets": {
					"1ce0d3a0-8040-11ea-9be4-9969d6450102": "76a27070-8044-11ea-9be4-9969d6450102"
				},
				"_changes": [
					"76a27070-8044-11ea-9be4-9969d6450102"
				],
				"_grants": []
			},
			"147077165895254016": {
				"_id": "147077165895254016",
				"_accounts": [],
				"_createdAt": 1590526164212,
				"_currentBalance": 0,
				"_lifetimeBalance": 0,
				"_bets": {
					"5e10c3a0-9f92-11ea-8919-d395d3434d4b": "61bdc610-9f92-11ea-8919-d395d3434d4b"
				},
				"_changes": [
					"61bdc610-9f92-11ea-8919-d395d3434d4b",
					"a64b3650-9f92-11ea-8919-d395d3434d4b"
				],
				"_grants": []
			},
			"177423709114466304": {
				"_id": "177423709114466304",
				"_accounts": [],
				"_createdAt": 1590526178168,
				"_currentBalance": 1000,
				"_lifetimeBalance": 1000,
				"_bets": {
					"5e10c3a0-9f92-11ea-8919-d395d3434d4b": "6a0efc30-9f92-11ea-8919-d395d3434d4b",
					"e8979330-b352-11eb-92b2-a32ed7e3969a": "91b4e120-b353-11eb-92b2-a32ed7e3969a"
				},
				"_changes": [
					"6a0efc30-9f92-11ea-8919-d395d3434d4b",
					"a64b3653-9f92-11ea-8919-d395d3434d4b",
					"91b4e120-b353-11eb-92b2-a32ed7e3969a",
					"9cc78450-b41b-11eb-92b2-a32ed7e3969a",
					"4cef2530-c22d-11eb-a61a-2b20bf2044ac"
				],
				"_grants": []
			},
			"287188227667001345": {
				"_id": "287188227667001345",
				"_accounts": [],
				"_createdAt": 1590526345526,
				"_currentBalance": 10766,
				"_lifetimeBalance": 11766,
				"_bets": {
					"cdd08d60-9f92-11ea-8919-d395d3434d4b": "eaa9f570-9f92-11ea-8919-d395d3434d4b",
					"593f0280-6db2-11eb-ab2e-25fa00710320": "62885440-6db2-11eb-ab2e-25fa00710320"
				},
				"_changes": [
					"eaa9f570-9f92-11ea-8919-d395d3434d4b",
					"25ac5000-9f93-11ea-8919-d395d3434d4b",
					"2c7a6890-9f93-11ea-8919-d395d3434d4b",
					"62503b31-ccba-11ea-b62a-3b3a5e6c9540",
					"62885440-6db2-11eb-ab2e-25fa00710320",
					"4eb0aed0-6dcc-11eb-ab2e-25fa00710320"
				],
				"_grants": [
					"2c7a6890-9f93-11ea-8919-d395d3434d4b"
				]
			},
			"[object Object]": {
				"_id": {
					"_id": "138398309776621569",
					"_accounts": [],
					"_createdAt": 1561763143883,
					"_currentBalance": 0,
					"_lifetimeBalance": 10010,
					"_bets": {
						"1a5d2850-99f9-11e9-943d-03015f6e23b5": "cb5cc880-99fa-11e9-943d-03015f6e23b5",
						"a60fea20-9d0c-11e9-943d-03015f6e23b5": "f6b116c0-9d0c-11e9-943d-03015f6e23b5",
						"36e08410-9d0d-11e9-943d-03015f6e23b5": "39259210-9d0d-11e9-943d-03015f6e23b5",
						"4638ed60-a840-11e9-bd28-b354ce9f3528": "4adf9210-a840-11e9-bd28-b354ce9f3528"
					},
					"_changes": [
						"41a612a0-99f9-11e9-943d-03015f6e23b5",
						"cb5cc880-99fa-11e9-943d-03015f6e23b5",
						"ac046b90-9d0c-11e9-943d-03015f6e23b5",
						"c0e4cfa0-9d0c-11e9-943d-03015f6e23b5",
						"c3ee6620-9d0c-11e9-943d-03015f6e23b5",
						"c46a73f0-9d0c-11e9-943d-03015f6e23b5",
						"f5805ef0-9d0c-11e9-943d-03015f6e23b5",
						"f6b116c0-9d0c-11e9-943d-03015f6e23b5",
						"39259210-9d0d-11e9-943d-03015f6e23b5",
						"4ddd8690-9d0d-11e9-943d-03015f6e23b5",
						"4adf9210-a840-11e9-bd28-b354ce9f3528"
					],
					"_grants": [
						"c3ee6620-9d0c-11e9-943d-03015f6e23b5",
						"f5805ef0-9d0c-11e9-943d-03015f6e23b5"
					]
				},
				"_accounts": [],
				"_createdAt": 1595245957482,
				"_currentBalance": 0,
				"_lifetimeBalance": 0,
				"_bets": {},
				"_changes": [],
				"_grants": [
					"81bf0ba0-ca7f-11ea-b7ca-497f43bcd90a",
					"81bf0ba1-ca7f-11ea-b7ca-497f43bcd90a",
					"62503b30-ccba-11ea-b62a-3b3a5e6c9540",
					"62503b31-ccba-11ea-b62a-3b3a5e6c9540",
					"62503b32-ccba-11ea-b62a-3b3a5e6c9540",
					"ce396250-1c0a-11eb-bbdc-c5ae2af77fc6",
					"ce396251-1c0a-11eb-bbdc-c5ae2af77fc6",
					"ce396252-1c0a-11eb-bbdc-c5ae2af77fc6",
					"ce396253-1c0a-11eb-bbdc-c5ae2af77fc6",
					"4eb0aed0-6dcc-11eb-ab2e-25fa00710320",
					"4eb0aed1-6dcc-11eb-ab2e-25fa00710320",
					"4eb0aed2-6dcc-11eb-ab2e-25fa00710320",
					"4ceeb000-c22d-11eb-a61a-2b20bf2044ac",
					"4cef2530-c22d-11eb-a61a-2b20bf2044ac",
					"4cef2531-c22d-11eb-a61a-2b20bf2044ac",
					"4cef4c40-c22d-11eb-a61a-2b20bf2044ac",
					"4cef4c41-c22d-11eb-a61a-2b20bf2044ac"
				]
			},
			"173026718423056384": {
				"_id": "173026718423056384",
				"_accounts": [],
				"_createdAt": 1599434651268,
				"_currentBalance": 0,
				"_lifetimeBalance": 0,
				"_bets": {
					"da969110-f097-11ea-bb5d-f3bf67cc597f": "11cdd9e0-f098-11ea-bb5d-f3bf67cc597f"
				},
				"_changes": [
					"11cdd9e0-f098-11ea-bb5d-f3bf67cc597f"
				],
				"_grants": []
			},
			"211283870736187394": {
				"_id": "211283870736187394",
				"_accounts": [],
				"_createdAt": 1620845796794,
				"_currentBalance": 1250,
				"_lifetimeBalance": 2250,
				"_bets": {
					"e8979330-b352-11eb-92b2-a32ed7e3969a": "328d9bb0-b41b-11eb-92b2-a32ed7e3969a"
				},
				"_changes": [
					"c7093920-b353-11eb-92b2-a32ed7e3969a",
					"2bf31640-b41b-11eb-92b2-a32ed7e3969a",
					"323e9150-b41b-11eb-92b2-a32ed7e3969a",
					"328d9bb0-b41b-11eb-92b2-a32ed7e3969a",
					"4cef4c40-c22d-11eb-a61a-2b20bf2044ac"
				],
				"_grants": [
					"323e9150-b41b-11eb-92b2-a32ed7e3969a"
				]
			}
		},
		"awards": {
			"37a9c490-99f9-11e9-943d-03015f6e23b5": {
				"_id": "37a9c490-99f9-11e9-943d-03015f6e23b5",
				"_type": 2,
				"_granter": "260288776360820736",
				"_user": "260288776360820736",
				"_amount": 5000,
				"_source": {
					"_type": 2,
					"_id": null
				}
			},
			"3a1cc060-99f9-11e9-943d-03015f6e23b5": {
				"_id": "3a1cc060-99f9-11e9-943d-03015f6e23b5",
				"_type": 2,
				"_granter": "260288776360820736",
				"_user": "174037015858249730",
				"_amount": 5000,
				"_source": {
					"_type": 2,
					"_id": null
				}
			},
			"41a612a0-99f9-11e9-943d-03015f6e23b5": {
				"_id": "41a612a0-99f9-11e9-943d-03015f6e23b5",
				"_type": 2,
				"_granter": "260288776360820736",
				"_user": "138398309776621569",
				"_amount": 5000,
				"_source": {
					"_type": 2,
					"_id": null
				}
			},
			"f73ee4d0-9a0c-11e9-943d-03015f6e23b5": {
				"_id": "f73ee4d0-9a0c-11e9-943d-03015f6e23b5",
				"_type": 2,
				"_granter": "260288776360820736",
				"_user": "310031015932329985",
				"_amount": 5000,
				"_source": {
					"_type": 2,
					"_id": null
				}
			},
			"dd6314d0-9d0b-11e9-943d-03015f6e23b5": {
				"_id": "dd6314d0-9d0b-11e9-943d-03015f6e23b5",
				"_type": 2,
				"_granter": "260288776360820736",
				"_user": "108378183253913600",
				"_amount": 5000,
				"_source": {
					"_type": 2,
					"_id": null
				}
			},
			"c0e4cfa0-9d0c-11e9-943d-03015f6e23b5": {
				"_id": "c0e4cfa0-9d0c-11e9-943d-03015f6e23b5",
				"_type": 2,
				"_granter": "260288776360820736",
				"_user": "138398309776621569",
				"_amount": 5000,
				"_source": {
					"_type": 2,
					"_id": null
				}
			},
			"c63fd030-9d0c-11e9-943d-03015f6e23b5": {
				"_id": "c63fd030-9d0c-11e9-943d-03015f6e23b5",
				"_type": 2,
				"_granter": "260288776360820736",
				"_user": "260288776360820736",
				"_amount": 5000,
				"_source": {
					"_type": 2,
					"_id": null
				}
			},
			"c92cb6f0-9d0c-11e9-943d-03015f6e23b5": {
				"_id": "c92cb6f0-9d0c-11e9-943d-03015f6e23b5",
				"_type": 2,
				"_granter": "260288776360820736",
				"_user": "304354673647812608",
				"_amount": 5000,
				"_source": {
					"_type": 2,
					"_id": null
				}
			},
			"cc2d25b0-9d0c-11e9-943d-03015f6e23b5": {
				"_id": "cc2d25b0-9d0c-11e9-943d-03015f6e23b5",
				"_type": 2,
				"_granter": "260288776360820736",
				"_user": "191286686607474698",
				"_amount": 5000,
				"_source": {
					"_type": 2,
					"_id": null
				}
			},
			"d2279a90-9d0c-11e9-943d-03015f6e23b5": {
				"_id": "d2279a90-9d0c-11e9-943d-03015f6e23b5",
				"_type": 2,
				"_granter": "260288776360820736",
				"_user": "310031015932329985",
				"_amount": 5000,
				"_source": {
					"_type": 2,
					"_id": null
				}
			},
			"7f5d2500-0017-11ea-9ecd-f984eb8b6e33": {
				"_id": "7f5d2500-0017-11ea-9ecd-f984eb8b6e33",
				"_type": 2,
				"_granter": "260288776360820736",
				"_user": "138398309776621569",
				"_amount": 5000,
				"_source": {
					"_type": 2,
					"_id": null
				}
			},
			"295b6ad0-001d-11ea-a693-714a24e863fc": {
				"_id": "295b6ad0-001d-11ea-a693-714a24e863fc",
				"_type": 2,
				"_granter": "260288776360820736",
				"_user": "260288776360820736",
				"_amount": 99999999999,
				"_source": {
					"_type": 2,
					"_id": null
				}
			},
			"3a6bdb20-001d-11ea-a693-714a24e863fc": {
				"_id": "3a6bdb20-001d-11ea-a693-714a24e863fc",
				"_type": 2,
				"_granter": "260288776360820736",
				"_user": "174037015858249730",
				"_amount": 999999999999,
				"_source": {
					"_type": 2,
					"_id": null
				}
			},
			"f3d83340-001f-11ea-a693-714a24e863fc": {
				"_id": "f3d83340-001f-11ea-a693-714a24e863fc",
				"_type": 2,
				"_granter": "174037015858249730",
				"_user": "174037015858249730",
				"_amount": 1,
				"_source": {
					"_type": 2,
					"_id": null
				}
			},
			"830ab820-0021-11ea-a693-714a24e863fc": {
				"_id": "830ab820-0021-11ea-a693-714a24e863fc",
				"_type": 1,
				"_granter": "260288776360820736",
				"_user": "138398309776621569",
				"_amount": -500000000000,
				"_source": {
					"_type": 2,
					"_id": null
				}
			},
			"a4042c80-9f92-11ea-8919-d395d3434d4b": {
				"_id": "a4042c80-9f92-11ea-8919-d395d3434d4b",
				"_type": 4,
				"_granter": {
					"_id": "260288776360820736",
					"_accounts": [],
					"_createdAt": 1561762972282,
					"_currentBalance": 99999949999,
					"_lifetimeBalance": 100000010009,
					"_bets": {
						"1a5d2850-99f9-11e9-943d-03015f6e23b5": "3bc148a0-99f9-11e9-943d-03015f6e23b5",
						"a60fea20-9d0c-11e9-943d-03015f6e23b5": "e49aa820-9d0c-11e9-943d-03015f6e23b5",
						"36e08410-9d0d-11e9-943d-03015f6e23b5": "3b87ec10-9d0d-11e9-943d-03015f6e23b5",
						"4638ed60-a840-11e9-bd28-b354ce9f3528": "91094d30-a840-11e9-bd28-b354ce9f3528",
						"a965aed0-a8d3-11e9-bd28-b354ce9f3528": "b823a3a0-a8d3-11e9-bd28-b354ce9f3528",
						"5e10c3a0-9f92-11ea-8919-d395d3434d4b": "6827ecb0-9f92-11ea-8919-d395d3434d4b"
					},
					"_changes": [
						"2637fa60-99f9-11e9-943d-03015f6e23b5",
						"37a9c490-99f9-11e9-943d-03015f6e23b5",
						"3b188580-99f9-11e9-943d-03015f6e23b5",
						"3bc148a0-99f9-11e9-943d-03015f6e23b5",
						"a99dcbd0-9d0c-11e9-943d-03015f6e23b5",
						"c63fd030-9d0c-11e9-943d-03015f6e23b5",
						"e45784a0-9d0c-11e9-943d-03015f6e23b5",
						"e49aa820-9d0c-11e9-943d-03015f6e23b5",
						"3b87ec10-9d0d-11e9-943d-03015f6e23b5",
						"4ddd8691-9d0d-11e9-943d-03015f6e23b5",
						"83fc3cb0-a840-11e9-bd28-b354ce9f3528",
						"8a599210-a840-11e9-bd28-b354ce9f3528",
						"8ab65810-a840-11e9-bd28-b354ce9f3528",
						"8ae99d10-a840-11e9-bd28-b354ce9f3528",
						"8b4fd8f0-a840-11e9-bd28-b354ce9f3528",
						"8bb77460-a840-11e9-bd28-b354ce9f3528",
						"8c165d40-a840-11e9-bd28-b354ce9f3528",
						"8c495420-a840-11e9-bd28-b354ce9f3528",
						"8c780540-a840-11e9-bd28-b354ce9f3528",
						"8ca5a4f0-a840-11e9-bd28-b354ce9f3528",
						"8cd78a60-a840-11e9-bd28-b354ce9f3528",
						"8d42f660-a840-11e9-bd28-b354ce9f3528",
						"8ddf3660-a840-11e9-bd28-b354ce9f3528",
						"8e474700-a840-11e9-bd28-b354ce9f3528",
						"91094d30-a840-11e9-bd28-b354ce9f3528",
						"b823a3a0-a8d3-11e9-bd28-b354ce9f3528",
						"295b6ad0-001d-11ea-a693-714a24e863fc",
						"6827ecb0-9f92-11ea-8919-d395d3434d4b"
					],
					"_grants": [
						"37a9c490-99f9-11e9-943d-03015f6e23b5",
						"3a1cc060-99f9-11e9-943d-03015f6e23b5",
						"3b188580-99f9-11e9-943d-03015f6e23b5",
						"41a612a0-99f9-11e9-943d-03015f6e23b5",
						"f73ee4d0-9a0c-11e9-943d-03015f6e23b5",
						"dd6314d0-9d0b-11e9-943d-03015f6e23b5",
						"c0e4cfa0-9d0c-11e9-943d-03015f6e23b5",
						"c63fd030-9d0c-11e9-943d-03015f6e23b5",
						"c92cb6f0-9d0c-11e9-943d-03015f6e23b5",
						"cc2d25b0-9d0c-11e9-943d-03015f6e23b5",
						"d2279a90-9d0c-11e9-943d-03015f6e23b5",
						"e45784a0-9d0c-11e9-943d-03015f6e23b5",
						"8a599210-a840-11e9-bd28-b354ce9f3528",
						"8ae99d10-a840-11e9-bd28-b354ce9f3528",
						"8bb77460-a840-11e9-bd28-b354ce9f3528",
						"8c495420-a840-11e9-bd28-b354ce9f3528",
						"8ca5a4f0-a840-11e9-bd28-b354ce9f3528",
						"8d42f660-a840-11e9-bd28-b354ce9f3528",
						"8e474700-a840-11e9-bd28-b354ce9f3528",
						"7f5d2500-0017-11ea-9ecd-f984eb8b6e33",
						"295b6ad0-001d-11ea-a693-714a24e863fc",
						"3a6bdb20-001d-11ea-a693-714a24e863fc",
						"830ab820-0021-11ea-a693-714a24e863fc"
					]
				},
				"_user": "108378183253913600",
				"_amount": 0,
				"_source": {
					"_type": 3,
					"_id": "983c6d40-9f92-11ea-8919-d395d3434d4b"
				}
			},
			"a4042c81-9f92-11ea-8919-d395d3434d4b": {
				"_id": "a4042c81-9f92-11ea-8919-d395d3434d4b",
				"_type": 4,
				"_granter": {
					"_id": "260288776360820736",
					"_accounts": [],
					"_createdAt": 1561762972282,
					"_currentBalance": 99999949999,
					"_lifetimeBalance": 100000010009,
					"_bets": {
						"1a5d2850-99f9-11e9-943d-03015f6e23b5": "3bc148a0-99f9-11e9-943d-03015f6e23b5",
						"a60fea20-9d0c-11e9-943d-03015f6e23b5": "e49aa820-9d0c-11e9-943d-03015f6e23b5",
						"36e08410-9d0d-11e9-943d-03015f6e23b5": "3b87ec10-9d0d-11e9-943d-03015f6e23b5",
						"4638ed60-a840-11e9-bd28-b354ce9f3528": "91094d30-a840-11e9-bd28-b354ce9f3528",
						"a965aed0-a8d3-11e9-bd28-b354ce9f3528": "b823a3a0-a8d3-11e9-bd28-b354ce9f3528",
						"5e10c3a0-9f92-11ea-8919-d395d3434d4b": "6827ecb0-9f92-11ea-8919-d395d3434d4b"
					},
					"_changes": [
						"2637fa60-99f9-11e9-943d-03015f6e23b5",
						"37a9c490-99f9-11e9-943d-03015f6e23b5",
						"3b188580-99f9-11e9-943d-03015f6e23b5",
						"3bc148a0-99f9-11e9-943d-03015f6e23b5",
						"a99dcbd0-9d0c-11e9-943d-03015f6e23b5",
						"c63fd030-9d0c-11e9-943d-03015f6e23b5",
						"e45784a0-9d0c-11e9-943d-03015f6e23b5",
						"e49aa820-9d0c-11e9-943d-03015f6e23b5",
						"3b87ec10-9d0d-11e9-943d-03015f6e23b5",
						"4ddd8691-9d0d-11e9-943d-03015f6e23b5",
						"83fc3cb0-a840-11e9-bd28-b354ce9f3528",
						"8a599210-a840-11e9-bd28-b354ce9f3528",
						"8ab65810-a840-11e9-bd28-b354ce9f3528",
						"8ae99d10-a840-11e9-bd28-b354ce9f3528",
						"8b4fd8f0-a840-11e9-bd28-b354ce9f3528",
						"8bb77460-a840-11e9-bd28-b354ce9f3528",
						"8c165d40-a840-11e9-bd28-b354ce9f3528",
						"8c495420-a840-11e9-bd28-b354ce9f3528",
						"8c780540-a840-11e9-bd28-b354ce9f3528",
						"8ca5a4f0-a840-11e9-bd28-b354ce9f3528",
						"8cd78a60-a840-11e9-bd28-b354ce9f3528",
						"8d42f660-a840-11e9-bd28-b354ce9f3528",
						"8ddf3660-a840-11e9-bd28-b354ce9f3528",
						"8e474700-a840-11e9-bd28-b354ce9f3528",
						"91094d30-a840-11e9-bd28-b354ce9f3528",
						"b823a3a0-a8d3-11e9-bd28-b354ce9f3528",
						"295b6ad0-001d-11ea-a693-714a24e863fc",
						"6827ecb0-9f92-11ea-8919-d395d3434d4b"
					],
					"_grants": [
						"37a9c490-99f9-11e9-943d-03015f6e23b5",
						"3a1cc060-99f9-11e9-943d-03015f6e23b5",
						"3b188580-99f9-11e9-943d-03015f6e23b5",
						"41a612a0-99f9-11e9-943d-03015f6e23b5",
						"f73ee4d0-9a0c-11e9-943d-03015f6e23b5",
						"dd6314d0-9d0b-11e9-943d-03015f6e23b5",
						"c0e4cfa0-9d0c-11e9-943d-03015f6e23b5",
						"c63fd030-9d0c-11e9-943d-03015f6e23b5",
						"c92cb6f0-9d0c-11e9-943d-03015f6e23b5",
						"cc2d25b0-9d0c-11e9-943d-03015f6e23b5",
						"d2279a90-9d0c-11e9-943d-03015f6e23b5",
						"e45784a0-9d0c-11e9-943d-03015f6e23b5",
						"8a599210-a840-11e9-bd28-b354ce9f3528",
						"8ae99d10-a840-11e9-bd28-b354ce9f3528",
						"8bb77460-a840-11e9-bd28-b354ce9f3528",
						"8c495420-a840-11e9-bd28-b354ce9f3528",
						"8ca5a4f0-a840-11e9-bd28-b354ce9f3528",
						"8d42f660-a840-11e9-bd28-b354ce9f3528",
						"8e474700-a840-11e9-bd28-b354ce9f3528",
						"7f5d2500-0017-11ea-9ecd-f984eb8b6e33",
						"295b6ad0-001d-11ea-a693-714a24e863fc",
						"3a6bdb20-001d-11ea-a693-714a24e863fc",
						"830ab820-0021-11ea-a693-714a24e863fc"
					]
				},
				"_user": "260288776360820736",
				"_amount": 500000,
				"_source": {
					"_type": 3,
					"_id": "9eaa1650-9f92-11ea-8919-d395d3434d4b"
				}
			},
			"a64b3650-9f92-11ea-8919-d395d3434d4b": {
				"_id": "a64b3650-9f92-11ea-8919-d395d3434d4b",
				"_type": 4,
				"_granter": {
					"_id": "260288776360820736",
					"_accounts": [],
					"_createdAt": 1561762972282,
					"_currentBalance": 99999999999,
					"_lifetimeBalance": 100000010009,
					"_bets": {
						"1a5d2850-99f9-11e9-943d-03015f6e23b5": "3bc148a0-99f9-11e9-943d-03015f6e23b5",
						"a60fea20-9d0c-11e9-943d-03015f6e23b5": "e49aa820-9d0c-11e9-943d-03015f6e23b5",
						"36e08410-9d0d-11e9-943d-03015f6e23b5": "3b87ec10-9d0d-11e9-943d-03015f6e23b5",
						"4638ed60-a840-11e9-bd28-b354ce9f3528": "91094d30-a840-11e9-bd28-b354ce9f3528",
						"a965aed0-a8d3-11e9-bd28-b354ce9f3528": "b823a3a0-a8d3-11e9-bd28-b354ce9f3528"
					},
					"_changes": [
						"2637fa60-99f9-11e9-943d-03015f6e23b5",
						"37a9c490-99f9-11e9-943d-03015f6e23b5",
						"3b188580-99f9-11e9-943d-03015f6e23b5",
						"3bc148a0-99f9-11e9-943d-03015f6e23b5",
						"a99dcbd0-9d0c-11e9-943d-03015f6e23b5",
						"c63fd030-9d0c-11e9-943d-03015f6e23b5",
						"e45784a0-9d0c-11e9-943d-03015f6e23b5",
						"e49aa820-9d0c-11e9-943d-03015f6e23b5",
						"3b87ec10-9d0d-11e9-943d-03015f6e23b5",
						"4ddd8691-9d0d-11e9-943d-03015f6e23b5",
						"83fc3cb0-a840-11e9-bd28-b354ce9f3528",
						"8a599210-a840-11e9-bd28-b354ce9f3528",
						"8ab65810-a840-11e9-bd28-b354ce9f3528",
						"8ae99d10-a840-11e9-bd28-b354ce9f3528",
						"8b4fd8f0-a840-11e9-bd28-b354ce9f3528",
						"8bb77460-a840-11e9-bd28-b354ce9f3528",
						"8c165d40-a840-11e9-bd28-b354ce9f3528",
						"8c495420-a840-11e9-bd28-b354ce9f3528",
						"8c780540-a840-11e9-bd28-b354ce9f3528",
						"8ca5a4f0-a840-11e9-bd28-b354ce9f3528",
						"8cd78a60-a840-11e9-bd28-b354ce9f3528",
						"8d42f660-a840-11e9-bd28-b354ce9f3528",
						"8ddf3660-a840-11e9-bd28-b354ce9f3528",
						"8e474700-a840-11e9-bd28-b354ce9f3528",
						"91094d30-a840-11e9-bd28-b354ce9f3528",
						"b823a3a0-a8d3-11e9-bd28-b354ce9f3528",
						"295b6ad0-001d-11ea-a693-714a24e863fc"
					],
					"_grants": [
						"37a9c490-99f9-11e9-943d-03015f6e23b5",
						"3a1cc060-99f9-11e9-943d-03015f6e23b5",
						"3b188580-99f9-11e9-943d-03015f6e23b5",
						"41a612a0-99f9-11e9-943d-03015f6e23b5",
						"f73ee4d0-9a0c-11e9-943d-03015f6e23b5",
						"dd6314d0-9d0b-11e9-943d-03015f6e23b5",
						"c0e4cfa0-9d0c-11e9-943d-03015f6e23b5",
						"c63fd030-9d0c-11e9-943d-03015f6e23b5",
						"c92cb6f0-9d0c-11e9-943d-03015f6e23b5",
						"cc2d25b0-9d0c-11e9-943d-03015f6e23b5",
						"d2279a90-9d0c-11e9-943d-03015f6e23b5",
						"e45784a0-9d0c-11e9-943d-03015f6e23b5",
						"8a599210-a840-11e9-bd28-b354ce9f3528",
						"8ae99d10-a840-11e9-bd28-b354ce9f3528",
						"8bb77460-a840-11e9-bd28-b354ce9f3528",
						"8c495420-a840-11e9-bd28-b354ce9f3528",
						"8ca5a4f0-a840-11e9-bd28-b354ce9f3528",
						"8d42f660-a840-11e9-bd28-b354ce9f3528",
						"8e474700-a840-11e9-bd28-b354ce9f3528",
						"7f5d2500-0017-11ea-9ecd-f984eb8b6e33",
						"295b6ad0-001d-11ea-a693-714a24e863fc",
						"3a6bdb20-001d-11ea-a693-714a24e863fc",
						"830ab820-0021-11ea-a693-714a24e863fc"
					]
				},
				"_user": "147077165895254016",
				"_amount": 0,
				"_source": {
					"_type": 3,
					"_id": "61bdc610-9f92-11ea-8919-d395d3434d4b"
				}
			},
			"a64b3651-9f92-11ea-8919-d395d3434d4b": {
				"_id": "a64b3651-9f92-11ea-8919-d395d3434d4b",
				"_type": 4,
				"_granter": {
					"_id": "260288776360820736",
					"_accounts": [],
					"_createdAt": 1561762972282,
					"_currentBalance": 99999999999,
					"_lifetimeBalance": 100000010009,
					"_bets": {
						"1a5d2850-99f9-11e9-943d-03015f6e23b5": "3bc148a0-99f9-11e9-943d-03015f6e23b5",
						"a60fea20-9d0c-11e9-943d-03015f6e23b5": "e49aa820-9d0c-11e9-943d-03015f6e23b5",
						"36e08410-9d0d-11e9-943d-03015f6e23b5": "3b87ec10-9d0d-11e9-943d-03015f6e23b5",
						"4638ed60-a840-11e9-bd28-b354ce9f3528": "91094d30-a840-11e9-bd28-b354ce9f3528",
						"a965aed0-a8d3-11e9-bd28-b354ce9f3528": "b823a3a0-a8d3-11e9-bd28-b354ce9f3528"
					},
					"_changes": [
						"2637fa60-99f9-11e9-943d-03015f6e23b5",
						"37a9c490-99f9-11e9-943d-03015f6e23b5",
						"3b188580-99f9-11e9-943d-03015f6e23b5",
						"3bc148a0-99f9-11e9-943d-03015f6e23b5",
						"a99dcbd0-9d0c-11e9-943d-03015f6e23b5",
						"c63fd030-9d0c-11e9-943d-03015f6e23b5",
						"e45784a0-9d0c-11e9-943d-03015f6e23b5",
						"e49aa820-9d0c-11e9-943d-03015f6e23b5",
						"3b87ec10-9d0d-11e9-943d-03015f6e23b5",
						"4ddd8691-9d0d-11e9-943d-03015f6e23b5",
						"83fc3cb0-a840-11e9-bd28-b354ce9f3528",
						"8a599210-a840-11e9-bd28-b354ce9f3528",
						"8ab65810-a840-11e9-bd28-b354ce9f3528",
						"8ae99d10-a840-11e9-bd28-b354ce9f3528",
						"8b4fd8f0-a840-11e9-bd28-b354ce9f3528",
						"8bb77460-a840-11e9-bd28-b354ce9f3528",
						"8c165d40-a840-11e9-bd28-b354ce9f3528",
						"8c495420-a840-11e9-bd28-b354ce9f3528",
						"8c780540-a840-11e9-bd28-b354ce9f3528",
						"8ca5a4f0-a840-11e9-bd28-b354ce9f3528",
						"8cd78a60-a840-11e9-bd28-b354ce9f3528",
						"8d42f660-a840-11e9-bd28-b354ce9f3528",
						"8ddf3660-a840-11e9-bd28-b354ce9f3528",
						"8e474700-a840-11e9-bd28-b354ce9f3528",
						"91094d30-a840-11e9-bd28-b354ce9f3528",
						"b823a3a0-a8d3-11e9-bd28-b354ce9f3528",
						"295b6ad0-001d-11ea-a693-714a24e863fc"
					],
					"_grants": [
						"37a9c490-99f9-11e9-943d-03015f6e23b5",
						"3a1cc060-99f9-11e9-943d-03015f6e23b5",
						"3b188580-99f9-11e9-943d-03015f6e23b5",
						"41a612a0-99f9-11e9-943d-03015f6e23b5",
						"f73ee4d0-9a0c-11e9-943d-03015f6e23b5",
						"dd6314d0-9d0b-11e9-943d-03015f6e23b5",
						"c0e4cfa0-9d0c-11e9-943d-03015f6e23b5",
						"c63fd030-9d0c-11e9-943d-03015f6e23b5",
						"c92cb6f0-9d0c-11e9-943d-03015f6e23b5",
						"cc2d25b0-9d0c-11e9-943d-03015f6e23b5",
						"d2279a90-9d0c-11e9-943d-03015f6e23b5",
						"e45784a0-9d0c-11e9-943d-03015f6e23b5",
						"8a599210-a840-11e9-bd28-b354ce9f3528",
						"8ae99d10-a840-11e9-bd28-b354ce9f3528",
						"8bb77460-a840-11e9-bd28-b354ce9f3528",
						"8c495420-a840-11e9-bd28-b354ce9f3528",
						"8ca5a4f0-a840-11e9-bd28-b354ce9f3528",
						"8d42f660-a840-11e9-bd28-b354ce9f3528",
						"8e474700-a840-11e9-bd28-b354ce9f3528",
						"7f5d2500-0017-11ea-9ecd-f984eb8b6e33",
						"295b6ad0-001d-11ea-a693-714a24e863fc",
						"3a6bdb20-001d-11ea-a693-714a24e863fc",
						"830ab820-0021-11ea-a693-714a24e863fc"
					]
				},
				"_user": "138398309776621569",
				"_amount": 0,
				"_source": {
					"_type": 3,
					"_id": "628b0120-9f92-11ea-8919-d395d3434d4b"
				}
			},
			"a64b3652-9f92-11ea-8919-d395d3434d4b": {
				"_id": "a64b3652-9f92-11ea-8919-d395d3434d4b",
				"_type": 4,
				"_granter": {
					"_id": "260288776360820736",
					"_accounts": [],
					"_createdAt": 1561762972282,
					"_currentBalance": 99999999999,
					"_lifetimeBalance": 100000010009,
					"_bets": {
						"1a5d2850-99f9-11e9-943d-03015f6e23b5": "3bc148a0-99f9-11e9-943d-03015f6e23b5",
						"a60fea20-9d0c-11e9-943d-03015f6e23b5": "e49aa820-9d0c-11e9-943d-03015f6e23b5",
						"36e08410-9d0d-11e9-943d-03015f6e23b5": "3b87ec10-9d0d-11e9-943d-03015f6e23b5",
						"4638ed60-a840-11e9-bd28-b354ce9f3528": "91094d30-a840-11e9-bd28-b354ce9f3528",
						"a965aed0-a8d3-11e9-bd28-b354ce9f3528": "b823a3a0-a8d3-11e9-bd28-b354ce9f3528"
					},
					"_changes": [
						"2637fa60-99f9-11e9-943d-03015f6e23b5",
						"37a9c490-99f9-11e9-943d-03015f6e23b5",
						"3b188580-99f9-11e9-943d-03015f6e23b5",
						"3bc148a0-99f9-11e9-943d-03015f6e23b5",
						"a99dcbd0-9d0c-11e9-943d-03015f6e23b5",
						"c63fd030-9d0c-11e9-943d-03015f6e23b5",
						"e45784a0-9d0c-11e9-943d-03015f6e23b5",
						"e49aa820-9d0c-11e9-943d-03015f6e23b5",
						"3b87ec10-9d0d-11e9-943d-03015f6e23b5",
						"4ddd8691-9d0d-11e9-943d-03015f6e23b5",
						"83fc3cb0-a840-11e9-bd28-b354ce9f3528",
						"8a599210-a840-11e9-bd28-b354ce9f3528",
						"8ab65810-a840-11e9-bd28-b354ce9f3528",
						"8ae99d10-a840-11e9-bd28-b354ce9f3528",
						"8b4fd8f0-a840-11e9-bd28-b354ce9f3528",
						"8bb77460-a840-11e9-bd28-b354ce9f3528",
						"8c165d40-a840-11e9-bd28-b354ce9f3528",
						"8c495420-a840-11e9-bd28-b354ce9f3528",
						"8c780540-a840-11e9-bd28-b354ce9f3528",
						"8ca5a4f0-a840-11e9-bd28-b354ce9f3528",
						"8cd78a60-a840-11e9-bd28-b354ce9f3528",
						"8d42f660-a840-11e9-bd28-b354ce9f3528",
						"8ddf3660-a840-11e9-bd28-b354ce9f3528",
						"8e474700-a840-11e9-bd28-b354ce9f3528",
						"91094d30-a840-11e9-bd28-b354ce9f3528",
						"b823a3a0-a8d3-11e9-bd28-b354ce9f3528",
						"295b6ad0-001d-11ea-a693-714a24e863fc"
					],
					"_grants": [
						"37a9c490-99f9-11e9-943d-03015f6e23b5",
						"3a1cc060-99f9-11e9-943d-03015f6e23b5",
						"3b188580-99f9-11e9-943d-03015f6e23b5",
						"41a612a0-99f9-11e9-943d-03015f6e23b5",
						"f73ee4d0-9a0c-11e9-943d-03015f6e23b5",
						"dd6314d0-9d0b-11e9-943d-03015f6e23b5",
						"c0e4cfa0-9d0c-11e9-943d-03015f6e23b5",
						"c63fd030-9d0c-11e9-943d-03015f6e23b5",
						"c92cb6f0-9d0c-11e9-943d-03015f6e23b5",
						"cc2d25b0-9d0c-11e9-943d-03015f6e23b5",
						"d2279a90-9d0c-11e9-943d-03015f6e23b5",
						"e45784a0-9d0c-11e9-943d-03015f6e23b5",
						"8a599210-a840-11e9-bd28-b354ce9f3528",
						"8ae99d10-a840-11e9-bd28-b354ce9f3528",
						"8bb77460-a840-11e9-bd28-b354ce9f3528",
						"8c495420-a840-11e9-bd28-b354ce9f3528",
						"8ca5a4f0-a840-11e9-bd28-b354ce9f3528",
						"8d42f660-a840-11e9-bd28-b354ce9f3528",
						"8e474700-a840-11e9-bd28-b354ce9f3528",
						"7f5d2500-0017-11ea-9ecd-f984eb8b6e33",
						"295b6ad0-001d-11ea-a693-714a24e863fc",
						"3a6bdb20-001d-11ea-a693-714a24e863fc",
						"830ab820-0021-11ea-a693-714a24e863fc"
					]
				},
				"_user": "260288776360820736",
				"_amount": 50000,
				"_source": {
					"_type": 3,
					"_id": "6827ecb0-9f92-11ea-8919-d395d3434d4b"
				}
			},
			"a64b3653-9f92-11ea-8919-d395d3434d4b": {
				"_id": "a64b3653-9f92-11ea-8919-d395d3434d4b",
				"_type": 4,
				"_granter": {
					"_id": "260288776360820736",
					"_accounts": [],
					"_createdAt": 1561762972282,
					"_currentBalance": 99999999999,
					"_lifetimeBalance": 100000010009,
					"_bets": {
						"1a5d2850-99f9-11e9-943d-03015f6e23b5": "3bc148a0-99f9-11e9-943d-03015f6e23b5",
						"a60fea20-9d0c-11e9-943d-03015f6e23b5": "e49aa820-9d0c-11e9-943d-03015f6e23b5",
						"36e08410-9d0d-11e9-943d-03015f6e23b5": "3b87ec10-9d0d-11e9-943d-03015f6e23b5",
						"4638ed60-a840-11e9-bd28-b354ce9f3528": "91094d30-a840-11e9-bd28-b354ce9f3528",
						"a965aed0-a8d3-11e9-bd28-b354ce9f3528": "b823a3a0-a8d3-11e9-bd28-b354ce9f3528"
					},
					"_changes": [
						"2637fa60-99f9-11e9-943d-03015f6e23b5",
						"37a9c490-99f9-11e9-943d-03015f6e23b5",
						"3b188580-99f9-11e9-943d-03015f6e23b5",
						"3bc148a0-99f9-11e9-943d-03015f6e23b5",
						"a99dcbd0-9d0c-11e9-943d-03015f6e23b5",
						"c63fd030-9d0c-11e9-943d-03015f6e23b5",
						"e45784a0-9d0c-11e9-943d-03015f6e23b5",
						"e49aa820-9d0c-11e9-943d-03015f6e23b5",
						"3b87ec10-9d0d-11e9-943d-03015f6e23b5",
						"4ddd8691-9d0d-11e9-943d-03015f6e23b5",
						"83fc3cb0-a840-11e9-bd28-b354ce9f3528",
						"8a599210-a840-11e9-bd28-b354ce9f3528",
						"8ab65810-a840-11e9-bd28-b354ce9f3528",
						"8ae99d10-a840-11e9-bd28-b354ce9f3528",
						"8b4fd8f0-a840-11e9-bd28-b354ce9f3528",
						"8bb77460-a840-11e9-bd28-b354ce9f3528",
						"8c165d40-a840-11e9-bd28-b354ce9f3528",
						"8c495420-a840-11e9-bd28-b354ce9f3528",
						"8c780540-a840-11e9-bd28-b354ce9f3528",
						"8ca5a4f0-a840-11e9-bd28-b354ce9f3528",
						"8cd78a60-a840-11e9-bd28-b354ce9f3528",
						"8d42f660-a840-11e9-bd28-b354ce9f3528",
						"8ddf3660-a840-11e9-bd28-b354ce9f3528",
						"8e474700-a840-11e9-bd28-b354ce9f3528",
						"91094d30-a840-11e9-bd28-b354ce9f3528",
						"b823a3a0-a8d3-11e9-bd28-b354ce9f3528",
						"295b6ad0-001d-11ea-a693-714a24e863fc"
					],
					"_grants": [
						"37a9c490-99f9-11e9-943d-03015f6e23b5",
						"3a1cc060-99f9-11e9-943d-03015f6e23b5",
						"3b188580-99f9-11e9-943d-03015f6e23b5",
						"41a612a0-99f9-11e9-943d-03015f6e23b5",
						"f73ee4d0-9a0c-11e9-943d-03015f6e23b5",
						"dd6314d0-9d0b-11e9-943d-03015f6e23b5",
						"c0e4cfa0-9d0c-11e9-943d-03015f6e23b5",
						"c63fd030-9d0c-11e9-943d-03015f6e23b5",
						"c92cb6f0-9d0c-11e9-943d-03015f6e23b5",
						"cc2d25b0-9d0c-11e9-943d-03015f6e23b5",
						"d2279a90-9d0c-11e9-943d-03015f6e23b5",
						"e45784a0-9d0c-11e9-943d-03015f6e23b5",
						"8a599210-a840-11e9-bd28-b354ce9f3528",
						"8ae99d10-a840-11e9-bd28-b354ce9f3528",
						"8bb77460-a840-11e9-bd28-b354ce9f3528",
						"8c495420-a840-11e9-bd28-b354ce9f3528",
						"8ca5a4f0-a840-11e9-bd28-b354ce9f3528",
						"8d42f660-a840-11e9-bd28-b354ce9f3528",
						"8e474700-a840-11e9-bd28-b354ce9f3528",
						"7f5d2500-0017-11ea-9ecd-f984eb8b6e33",
						"295b6ad0-001d-11ea-a693-714a24e863fc",
						"3a6bdb20-001d-11ea-a693-714a24e863fc",
						"830ab820-0021-11ea-a693-714a24e863fc"
					]
				},
				"_user": "177423709114466304",
				"_amount": 0,
				"_source": {
					"_type": 3,
					"_id": "6a0efc30-9f92-11ea-8919-d395d3434d4b"
				}
			},
			"a64b3654-9f92-11ea-8919-d395d3434d4b": {
				"_id": "a64b3654-9f92-11ea-8919-d395d3434d4b",
				"_type": 4,
				"_granter": {
					"_id": "260288776360820736",
					"_accounts": [],
					"_createdAt": 1561762972282,
					"_currentBalance": 99999999999,
					"_lifetimeBalance": 100000010009,
					"_bets": {
						"1a5d2850-99f9-11e9-943d-03015f6e23b5": "3bc148a0-99f9-11e9-943d-03015f6e23b5",
						"a60fea20-9d0c-11e9-943d-03015f6e23b5": "e49aa820-9d0c-11e9-943d-03015f6e23b5",
						"36e08410-9d0d-11e9-943d-03015f6e23b5": "3b87ec10-9d0d-11e9-943d-03015f6e23b5",
						"4638ed60-a840-11e9-bd28-b354ce9f3528": "91094d30-a840-11e9-bd28-b354ce9f3528",
						"a965aed0-a8d3-11e9-bd28-b354ce9f3528": "b823a3a0-a8d3-11e9-bd28-b354ce9f3528"
					},
					"_changes": [
						"2637fa60-99f9-11e9-943d-03015f6e23b5",
						"37a9c490-99f9-11e9-943d-03015f6e23b5",
						"3b188580-99f9-11e9-943d-03015f6e23b5",
						"3bc148a0-99f9-11e9-943d-03015f6e23b5",
						"a99dcbd0-9d0c-11e9-943d-03015f6e23b5",
						"c63fd030-9d0c-11e9-943d-03015f6e23b5",
						"e45784a0-9d0c-11e9-943d-03015f6e23b5",
						"e49aa820-9d0c-11e9-943d-03015f6e23b5",
						"3b87ec10-9d0d-11e9-943d-03015f6e23b5",
						"4ddd8691-9d0d-11e9-943d-03015f6e23b5",
						"83fc3cb0-a840-11e9-bd28-b354ce9f3528",
						"8a599210-a840-11e9-bd28-b354ce9f3528",
						"8ab65810-a840-11e9-bd28-b354ce9f3528",
						"8ae99d10-a840-11e9-bd28-b354ce9f3528",
						"8b4fd8f0-a840-11e9-bd28-b354ce9f3528",
						"8bb77460-a840-11e9-bd28-b354ce9f3528",
						"8c165d40-a840-11e9-bd28-b354ce9f3528",
						"8c495420-a840-11e9-bd28-b354ce9f3528",
						"8c780540-a840-11e9-bd28-b354ce9f3528",
						"8ca5a4f0-a840-11e9-bd28-b354ce9f3528",
						"8cd78a60-a840-11e9-bd28-b354ce9f3528",
						"8d42f660-a840-11e9-bd28-b354ce9f3528",
						"8ddf3660-a840-11e9-bd28-b354ce9f3528",
						"8e474700-a840-11e9-bd28-b354ce9f3528",
						"91094d30-a840-11e9-bd28-b354ce9f3528",
						"b823a3a0-a8d3-11e9-bd28-b354ce9f3528",
						"295b6ad0-001d-11ea-a693-714a24e863fc"
					],
					"_grants": [
						"37a9c490-99f9-11e9-943d-03015f6e23b5",
						"3a1cc060-99f9-11e9-943d-03015f6e23b5",
						"3b188580-99f9-11e9-943d-03015f6e23b5",
						"41a612a0-99f9-11e9-943d-03015f6e23b5",
						"f73ee4d0-9a0c-11e9-943d-03015f6e23b5",
						"dd6314d0-9d0b-11e9-943d-03015f6e23b5",
						"c0e4cfa0-9d0c-11e9-943d-03015f6e23b5",
						"c63fd030-9d0c-11e9-943d-03015f6e23b5",
						"c92cb6f0-9d0c-11e9-943d-03015f6e23b5",
						"cc2d25b0-9d0c-11e9-943d-03015f6e23b5",
						"d2279a90-9d0c-11e9-943d-03015f6e23b5",
						"e45784a0-9d0c-11e9-943d-03015f6e23b5",
						"8a599210-a840-11e9-bd28-b354ce9f3528",
						"8ae99d10-a840-11e9-bd28-b354ce9f3528",
						"8bb77460-a840-11e9-bd28-b354ce9f3528",
						"8c495420-a840-11e9-bd28-b354ce9f3528",
						"8ca5a4f0-a840-11e9-bd28-b354ce9f3528",
						"8d42f660-a840-11e9-bd28-b354ce9f3528",
						"8e474700-a840-11e9-bd28-b354ce9f3528",
						"7f5d2500-0017-11ea-9ecd-f984eb8b6e33",
						"295b6ad0-001d-11ea-a693-714a24e863fc",
						"3a6bdb20-001d-11ea-a693-714a24e863fc",
						"830ab820-0021-11ea-a693-714a24e863fc"
					]
				},
				"_user": "108378183253913600",
				"_amount": 4990,
				"_source": {
					"_type": 3,
					"_id": "7ab279e0-9f92-11ea-8919-d395d3434d4b"
				}
			},
			"d06df490-9f92-11ea-8919-d395d3434d4b": {
				"_id": "d06df490-9f92-11ea-8919-d395d3434d4b",
				"_type": 4,
				"_granter": {
					"_id": "260288776360820736",
					"_accounts": [],
					"_createdAt": 1561762972282,
					"_currentBalance": 4990,
					"_lifetimeBalance": 10010,
					"_bets": {
						"1a5d2850-99f9-11e9-943d-03015f6e23b5": "3bc148a0-99f9-11e9-943d-03015f6e23b5",
						"a60fea20-9d0c-11e9-943d-03015f6e23b5": "e49aa820-9d0c-11e9-943d-03015f6e23b5",
						"36e08410-9d0d-11e9-943d-03015f6e23b5": "3b87ec10-9d0d-11e9-943d-03015f6e23b5"
					},
					"_changes": [
						"2637fa60-99f9-11e9-943d-03015f6e23b5",
						"37a9c490-99f9-11e9-943d-03015f6e23b5",
						"3b188580-99f9-11e9-943d-03015f6e23b5",
						"3bc148a0-99f9-11e9-943d-03015f6e23b5",
						"a99dcbd0-9d0c-11e9-943d-03015f6e23b5",
						"c63fd030-9d0c-11e9-943d-03015f6e23b5",
						"e45784a0-9d0c-11e9-943d-03015f6e23b5",
						"e49aa820-9d0c-11e9-943d-03015f6e23b5",
						"3b87ec10-9d0d-11e9-943d-03015f6e23b5",
						"4ddd8691-9d0d-11e9-943d-03015f6e23b5"
					],
					"_grants": [
						"37a9c490-99f9-11e9-943d-03015f6e23b5",
						"3a1cc060-99f9-11e9-943d-03015f6e23b5",
						"3b188580-99f9-11e9-943d-03015f6e23b5",
						"41a612a0-99f9-11e9-943d-03015f6e23b5",
						"f73ee4d0-9a0c-11e9-943d-03015f6e23b5",
						"dd6314d0-9d0b-11e9-943d-03015f6e23b5",
						"c0e4cfa0-9d0c-11e9-943d-03015f6e23b5",
						"c63fd030-9d0c-11e9-943d-03015f6e23b5",
						"c92cb6f0-9d0c-11e9-943d-03015f6e23b5",
						"cc2d25b0-9d0c-11e9-943d-03015f6e23b5",
						"d2279a90-9d0c-11e9-943d-03015f6e23b5",
						"e45784a0-9d0c-11e9-943d-03015f6e23b5"
					]
				},
				"_user": "138398309776621569",
				"_amount": 4990,
				"_source": {
					"_type": 3,
					"_id": "4adf9210-a840-11e9-bd28-b354ce9f3528"
				}
			},
			"d06df491-9f92-11ea-8919-d395d3434d4b": {
				"_id": "d06df491-9f92-11ea-8919-d395d3434d4b",
				"_type": 4,
				"_granter": {
					"_id": "260288776360820736",
					"_accounts": [],
					"_createdAt": 1561762972282,
					"_currentBalance": 4990,
					"_lifetimeBalance": 10010,
					"_bets": {
						"1a5d2850-99f9-11e9-943d-03015f6e23b5": "3bc148a0-99f9-11e9-943d-03015f6e23b5",
						"a60fea20-9d0c-11e9-943d-03015f6e23b5": "e49aa820-9d0c-11e9-943d-03015f6e23b5",
						"36e08410-9d0d-11e9-943d-03015f6e23b5": "3b87ec10-9d0d-11e9-943d-03015f6e23b5"
					},
					"_changes": [
						"2637fa60-99f9-11e9-943d-03015f6e23b5",
						"37a9c490-99f9-11e9-943d-03015f6e23b5",
						"3b188580-99f9-11e9-943d-03015f6e23b5",
						"3bc148a0-99f9-11e9-943d-03015f6e23b5",
						"a99dcbd0-9d0c-11e9-943d-03015f6e23b5",
						"c63fd030-9d0c-11e9-943d-03015f6e23b5",
						"e45784a0-9d0c-11e9-943d-03015f6e23b5",
						"e49aa820-9d0c-11e9-943d-03015f6e23b5",
						"3b87ec10-9d0d-11e9-943d-03015f6e23b5",
						"4ddd8691-9d0d-11e9-943d-03015f6e23b5"
					],
					"_grants": [
						"37a9c490-99f9-11e9-943d-03015f6e23b5",
						"3a1cc060-99f9-11e9-943d-03015f6e23b5",
						"3b188580-99f9-11e9-943d-03015f6e23b5",
						"41a612a0-99f9-11e9-943d-03015f6e23b5",
						"f73ee4d0-9a0c-11e9-943d-03015f6e23b5",
						"dd6314d0-9d0b-11e9-943d-03015f6e23b5",
						"c0e4cfa0-9d0c-11e9-943d-03015f6e23b5",
						"c63fd030-9d0c-11e9-943d-03015f6e23b5",
						"c92cb6f0-9d0c-11e9-943d-03015f6e23b5",
						"cc2d25b0-9d0c-11e9-943d-03015f6e23b5",
						"d2279a90-9d0c-11e9-943d-03015f6e23b5",
						"e45784a0-9d0c-11e9-943d-03015f6e23b5"
					]
				},
				"_user": "174037015858249730",
				"_amount": 0,
				"_source": {
					"_type": 3,
					"_id": "62883de0-a840-11e9-bd28-b354ce9f3528"
				}
			},
			"d06df492-9f92-11ea-8919-d395d3434d4b": {
				"_id": "d06df492-9f92-11ea-8919-d395d3434d4b",
				"_type": 4,
				"_granter": {
					"_id": "260288776360820736",
					"_accounts": [],
					"_createdAt": 1561762972282,
					"_currentBalance": 4990,
					"_lifetimeBalance": 10010,
					"_bets": {
						"1a5d2850-99f9-11e9-943d-03015f6e23b5": "3bc148a0-99f9-11e9-943d-03015f6e23b5",
						"a60fea20-9d0c-11e9-943d-03015f6e23b5": "e49aa820-9d0c-11e9-943d-03015f6e23b5",
						"36e08410-9d0d-11e9-943d-03015f6e23b5": "3b87ec10-9d0d-11e9-943d-03015f6e23b5"
					},
					"_changes": [
						"2637fa60-99f9-11e9-943d-03015f6e23b5",
						"37a9c490-99f9-11e9-943d-03015f6e23b5",
						"3b188580-99f9-11e9-943d-03015f6e23b5",
						"3bc148a0-99f9-11e9-943d-03015f6e23b5",
						"a99dcbd0-9d0c-11e9-943d-03015f6e23b5",
						"c63fd030-9d0c-11e9-943d-03015f6e23b5",
						"e45784a0-9d0c-11e9-943d-03015f6e23b5",
						"e49aa820-9d0c-11e9-943d-03015f6e23b5",
						"3b87ec10-9d0d-11e9-943d-03015f6e23b5",
						"4ddd8691-9d0d-11e9-943d-03015f6e23b5"
					],
					"_grants": [
						"37a9c490-99f9-11e9-943d-03015f6e23b5",
						"3a1cc060-99f9-11e9-943d-03015f6e23b5",
						"3b188580-99f9-11e9-943d-03015f6e23b5",
						"41a612a0-99f9-11e9-943d-03015f6e23b5",
						"f73ee4d0-9a0c-11e9-943d-03015f6e23b5",
						"dd6314d0-9d0b-11e9-943d-03015f6e23b5",
						"c0e4cfa0-9d0c-11e9-943d-03015f6e23b5",
						"c63fd030-9d0c-11e9-943d-03015f6e23b5",
						"c92cb6f0-9d0c-11e9-943d-03015f6e23b5",
						"cc2d25b0-9d0c-11e9-943d-03015f6e23b5",
						"d2279a90-9d0c-11e9-943d-03015f6e23b5",
						"e45784a0-9d0c-11e9-943d-03015f6e23b5"
					]
				},
				"_user": "260288776360820736",
				"_amount": 4990,
				"_source": {
					"_type": 3,
					"_id": "91094d30-a840-11e9-bd28-b354ce9f3528"
				}
			},
			"25ac5000-9f93-11ea-8919-d395d3434d4b": {
				"_id": "25ac5000-9f93-11ea-8919-d395d3434d4b",
				"_type": 2,
				"_granter": "260288776360820736",
				"_user": "287188227667001345",
				"_amount": 10000,
				"_source": {
					"_type": 2,
					"_id": null
				}
			},
			"2c7a6890-9f93-11ea-8919-d395d3434d4b": {
				"_id": "2c7a6890-9f93-11ea-8919-d395d3434d4b",
				"_type": 2,
				"_granter": "287188227667001345",
				"_user": "287188227667001345",
				"_amount": 100,
				"_source": {
					"_type": 2,
					"_id": null
				}
			},
			"4accb500-9f93-11ea-8919-d395d3434d4b": {
				"_id": "4accb500-9f93-11ea-8919-d395d3434d4b",
				"_type": 1,
				"_granter": "260288776360820736",
				"_user": "108378183253913600",
				"_amount": -1,
				"_source": {
					"_type": 2,
					"_id": null
				}
			},
			"9f3ef2c0-ac08-11ea-882e-ed9f313dc034": {
				"_id": "9f3ef2c0-ac08-11ea-882e-ed9f313dc034",
				"_type": 2,
				"_granter": "260288776360820736",
				"_user": "138398309776621569",
				"_amount": 10,
				"_source": {
					"_type": 2,
					"_id": null
				}
			},
			"7c95f200-b5ae-11ea-83b1-cf73ad225062": {
				"_id": "7c95f200-b5ae-11ea-83b1-cf73ad225062",
				"_type": 2,
				"_granter": "260288776360820736",
				"_user": "260288776360820736",
				"_amount": 10000,
				"_source": {
					"_type": 2,
					"_id": null
				}
			},
			"ce396250-1c0a-11eb-bbdc-c5ae2af77fc6": {
				"_id": "ce396250-1c0a-11eb-bbdc-c5ae2af77fc6",
				"_type": 4,
				"_granter": {
					"_id": "260288776360820736",
					"_accounts": [],
					"_createdAt": 1561762972282,
					"_currentBalance": 100000014489,
					"_lifetimeBalance": 100000023009,
					"_bets": {
						"1a5d2850-99f9-11e9-943d-03015f6e23b5": "3bc148a0-99f9-11e9-943d-03015f6e23b5",
						"a60fea20-9d0c-11e9-943d-03015f6e23b5": "e49aa820-9d0c-11e9-943d-03015f6e23b5",
						"36e08410-9d0d-11e9-943d-03015f6e23b5": "3b87ec10-9d0d-11e9-943d-03015f6e23b5",
						"4638ed60-a840-11e9-bd28-b354ce9f3528": "91094d30-a840-11e9-bd28-b354ce9f3528",
						"5e10c3a0-9f92-11ea-8919-d395d3434d4b": "6827ecb0-9f92-11ea-8919-d395d3434d4b",
						"8ebe76f0-9f92-11ea-8919-d395d3434d4b": "9eaa1650-9f92-11ea-8919-d395d3434d4b",
						"cdd08d60-9f92-11ea-8919-d395d3434d4b": "6bb697c0-ca7e-11ea-b7ca-497f43bcd90a",
						"a965aed0-a8d3-11e9-bd28-b354ce9f3528": "6ce8e0c0-ca7f-11ea-b7ca-497f43bcd90a",
						"da969110-f097-11ea-bb5d-f3bf67cc597f": "e73ec540-f097-11ea-bb5d-f3bf67cc597f"
					},
					"_changes": [
						"2637fa60-99f9-11e9-943d-03015f6e23b5",
						"37a9c490-99f9-11e9-943d-03015f6e23b5",
						"3b188580-99f9-11e9-943d-03015f6e23b5",
						"3bc148a0-99f9-11e9-943d-03015f6e23b5",
						"a99dcbd0-9d0c-11e9-943d-03015f6e23b5",
						"c63fd030-9d0c-11e9-943d-03015f6e23b5",
						"e45784a0-9d0c-11e9-943d-03015f6e23b5",
						"e49aa820-9d0c-11e9-943d-03015f6e23b5",
						"3b87ec10-9d0d-11e9-943d-03015f6e23b5",
						"4ddd8691-9d0d-11e9-943d-03015f6e23b5",
						"83fc3cb0-a840-11e9-bd28-b354ce9f3528",
						"8a599210-a840-11e9-bd28-b354ce9f3528",
						"8ab65810-a840-11e9-bd28-b354ce9f3528",
						"8ae99d10-a840-11e9-bd28-b354ce9f3528",
						"8b4fd8f0-a840-11e9-bd28-b354ce9f3528",
						"8bb77460-a840-11e9-bd28-b354ce9f3528",
						"8c165d40-a840-11e9-bd28-b354ce9f3528",
						"8c495420-a840-11e9-bd28-b354ce9f3528",
						"8c780540-a840-11e9-bd28-b354ce9f3528",
						"8ca5a4f0-a840-11e9-bd28-b354ce9f3528",
						"8cd78a60-a840-11e9-bd28-b354ce9f3528",
						"8d42f660-a840-11e9-bd28-b354ce9f3528",
						"8ddf3660-a840-11e9-bd28-b354ce9f3528",
						"8e474700-a840-11e9-bd28-b354ce9f3528",
						"91094d30-a840-11e9-bd28-b354ce9f3528",
						"b823a3a0-a8d3-11e9-bd28-b354ce9f3528",
						"295b6ad0-001d-11ea-a693-714a24e863fc",
						"6827ecb0-9f92-11ea-8919-d395d3434d4b",
						"9eaa1650-9f92-11ea-8919-d395d3434d4b",
						"a4042c81-9f92-11ea-8919-d395d3434d4b",
						"a64b3652-9f92-11ea-8919-d395d3434d4b",
						"d06df492-9f92-11ea-8919-d395d3434d4b",
						"7c95f200-b5ae-11ea-83b1-cf73ad225062",
						"6bb697c0-ca7e-11ea-b7ca-497f43bcd90a",
						"6c5b1fb0-ca7f-11ea-b7ca-497f43bcd90a",
						"6ce8e0c0-ca7f-11ea-b7ca-497f43bcd90a",
						"81bf0ba1-ca7f-11ea-b7ca-497f43bcd90a",
						"62503b32-ccba-11ea-b62a-3b3a5e6c9540",
						"e73ec540-f097-11ea-bb5d-f3bf67cc597f"
					],
					"_grants": [
						"37a9c490-99f9-11e9-943d-03015f6e23b5",
						"3a1cc060-99f9-11e9-943d-03015f6e23b5",
						"3b188580-99f9-11e9-943d-03015f6e23b5",
						"41a612a0-99f9-11e9-943d-03015f6e23b5",
						"f73ee4d0-9a0c-11e9-943d-03015f6e23b5",
						"dd6314d0-9d0b-11e9-943d-03015f6e23b5",
						"c0e4cfa0-9d0c-11e9-943d-03015f6e23b5",
						"c63fd030-9d0c-11e9-943d-03015f6e23b5",
						"c92cb6f0-9d0c-11e9-943d-03015f6e23b5",
						"cc2d25b0-9d0c-11e9-943d-03015f6e23b5",
						"d2279a90-9d0c-11e9-943d-03015f6e23b5",
						"e45784a0-9d0c-11e9-943d-03015f6e23b5",
						"8a599210-a840-11e9-bd28-b354ce9f3528",
						"8ae99d10-a840-11e9-bd28-b354ce9f3528",
						"8bb77460-a840-11e9-bd28-b354ce9f3528",
						"8c495420-a840-11e9-bd28-b354ce9f3528",
						"8ca5a4f0-a840-11e9-bd28-b354ce9f3528",
						"8d42f660-a840-11e9-bd28-b354ce9f3528",
						"8e474700-a840-11e9-bd28-b354ce9f3528",
						"7f5d2500-0017-11ea-9ecd-f984eb8b6e33",
						"295b6ad0-001d-11ea-a693-714a24e863fc",
						"3a6bdb20-001d-11ea-a693-714a24e863fc",
						"830ab820-0021-11ea-a693-714a24e863fc",
						"25ac5000-9f93-11ea-8919-d395d3434d4b",
						"4accb500-9f93-11ea-8919-d395d3434d4b",
						"9f3ef2c0-ac08-11ea-882e-ed9f313dc034",
						"7c95f200-b5ae-11ea-83b1-cf73ad225062",
						"6c5b1fb0-ca7f-11ea-b7ca-497f43bcd90a"
					]
				},
				"_user": "174037015858249730",
				"_amount": 1000,
				"_source": {
					"_type": 3,
					"_id": "22849610-1c09-11eb-bbdc-c5ae2af77fc6"
				}
			},
			"ce396251-1c0a-11eb-bbdc-c5ae2af77fc6": {
				"_id": "ce396251-1c0a-11eb-bbdc-c5ae2af77fc6",
				"_type": 4,
				"_granter": {
					"_id": "260288776360820736",
					"_accounts": [],
					"_createdAt": 1561762972282,
					"_currentBalance": 100000014489,
					"_lifetimeBalance": 100000023009,
					"_bets": {
						"1a5d2850-99f9-11e9-943d-03015f6e23b5": "3bc148a0-99f9-11e9-943d-03015f6e23b5",
						"a60fea20-9d0c-11e9-943d-03015f6e23b5": "e49aa820-9d0c-11e9-943d-03015f6e23b5",
						"36e08410-9d0d-11e9-943d-03015f6e23b5": "3b87ec10-9d0d-11e9-943d-03015f6e23b5",
						"4638ed60-a840-11e9-bd28-b354ce9f3528": "91094d30-a840-11e9-bd28-b354ce9f3528",
						"5e10c3a0-9f92-11ea-8919-d395d3434d4b": "6827ecb0-9f92-11ea-8919-d395d3434d4b",
						"8ebe76f0-9f92-11ea-8919-d395d3434d4b": "9eaa1650-9f92-11ea-8919-d395d3434d4b",
						"cdd08d60-9f92-11ea-8919-d395d3434d4b": "6bb697c0-ca7e-11ea-b7ca-497f43bcd90a",
						"a965aed0-a8d3-11e9-bd28-b354ce9f3528": "6ce8e0c0-ca7f-11ea-b7ca-497f43bcd90a",
						"da969110-f097-11ea-bb5d-f3bf67cc597f": "e73ec540-f097-11ea-bb5d-f3bf67cc597f"
					},
					"_changes": [
						"2637fa60-99f9-11e9-943d-03015f6e23b5",
						"37a9c490-99f9-11e9-943d-03015f6e23b5",
						"3b188580-99f9-11e9-943d-03015f6e23b5",
						"3bc148a0-99f9-11e9-943d-03015f6e23b5",
						"a99dcbd0-9d0c-11e9-943d-03015f6e23b5",
						"c63fd030-9d0c-11e9-943d-03015f6e23b5",
						"e45784a0-9d0c-11e9-943d-03015f6e23b5",
						"e49aa820-9d0c-11e9-943d-03015f6e23b5",
						"3b87ec10-9d0d-11e9-943d-03015f6e23b5",
						"4ddd8691-9d0d-11e9-943d-03015f6e23b5",
						"83fc3cb0-a840-11e9-bd28-b354ce9f3528",
						"8a599210-a840-11e9-bd28-b354ce9f3528",
						"8ab65810-a840-11e9-bd28-b354ce9f3528",
						"8ae99d10-a840-11e9-bd28-b354ce9f3528",
						"8b4fd8f0-a840-11e9-bd28-b354ce9f3528",
						"8bb77460-a840-11e9-bd28-b354ce9f3528",
						"8c165d40-a840-11e9-bd28-b354ce9f3528",
						"8c495420-a840-11e9-bd28-b354ce9f3528",
						"8c780540-a840-11e9-bd28-b354ce9f3528",
						"8ca5a4f0-a840-11e9-bd28-b354ce9f3528",
						"8cd78a60-a840-11e9-bd28-b354ce9f3528",
						"8d42f660-a840-11e9-bd28-b354ce9f3528",
						"8ddf3660-a840-11e9-bd28-b354ce9f3528",
						"8e474700-a840-11e9-bd28-b354ce9f3528",
						"91094d30-a840-11e9-bd28-b354ce9f3528",
						"b823a3a0-a8d3-11e9-bd28-b354ce9f3528",
						"295b6ad0-001d-11ea-a693-714a24e863fc",
						"6827ecb0-9f92-11ea-8919-d395d3434d4b",
						"9eaa1650-9f92-11ea-8919-d395d3434d4b",
						"a4042c81-9f92-11ea-8919-d395d3434d4b",
						"a64b3652-9f92-11ea-8919-d395d3434d4b",
						"d06df492-9f92-11ea-8919-d395d3434d4b",
						"7c95f200-b5ae-11ea-83b1-cf73ad225062",
						"6bb697c0-ca7e-11ea-b7ca-497f43bcd90a",
						"6c5b1fb0-ca7f-11ea-b7ca-497f43bcd90a",
						"6ce8e0c0-ca7f-11ea-b7ca-497f43bcd90a",
						"81bf0ba1-ca7f-11ea-b7ca-497f43bcd90a",
						"62503b32-ccba-11ea-b62a-3b3a5e6c9540",
						"e73ec540-f097-11ea-bb5d-f3bf67cc597f"
					],
					"_grants": [
						"37a9c490-99f9-11e9-943d-03015f6e23b5",
						"3a1cc060-99f9-11e9-943d-03015f6e23b5",
						"3b188580-99f9-11e9-943d-03015f6e23b5",
						"41a612a0-99f9-11e9-943d-03015f6e23b5",
						"f73ee4d0-9a0c-11e9-943d-03015f6e23b5",
						"dd6314d0-9d0b-11e9-943d-03015f6e23b5",
						"c0e4cfa0-9d0c-11e9-943d-03015f6e23b5",
						"c63fd030-9d0c-11e9-943d-03015f6e23b5",
						"c92cb6f0-9d0c-11e9-943d-03015f6e23b5",
						"cc2d25b0-9d0c-11e9-943d-03015f6e23b5",
						"d2279a90-9d0c-11e9-943d-03015f6e23b5",
						"e45784a0-9d0c-11e9-943d-03015f6e23b5",
						"8a599210-a840-11e9-bd28-b354ce9f3528",
						"8ae99d10-a840-11e9-bd28-b354ce9f3528",
						"8bb77460-a840-11e9-bd28-b354ce9f3528",
						"8c495420-a840-11e9-bd28-b354ce9f3528",
						"8ca5a4f0-a840-11e9-bd28-b354ce9f3528",
						"8d42f660-a840-11e9-bd28-b354ce9f3528",
						"8e474700-a840-11e9-bd28-b354ce9f3528",
						"7f5d2500-0017-11ea-9ecd-f984eb8b6e33",
						"295b6ad0-001d-11ea-a693-714a24e863fc",
						"3a6bdb20-001d-11ea-a693-714a24e863fc",
						"830ab820-0021-11ea-a693-714a24e863fc",
						"25ac5000-9f93-11ea-8919-d395d3434d4b",
						"4accb500-9f93-11ea-8919-d395d3434d4b",
						"9f3ef2c0-ac08-11ea-882e-ed9f313dc034",
						"7c95f200-b5ae-11ea-83b1-cf73ad225062",
						"6c5b1fb0-ca7f-11ea-b7ca-497f43bcd90a"
					]
				},
				"_user": "138398309776621569",
				"_amount": 1000,
				"_source": {
					"_type": 3,
					"_id": "25cce340-1c09-11eb-bbdc-c5ae2af77fc6"
				}
			},
			"ce396252-1c0a-11eb-bbdc-c5ae2af77fc6": {
				"_id": "ce396252-1c0a-11eb-bbdc-c5ae2af77fc6",
				"_type": 4,
				"_granter": {
					"_id": "260288776360820736",
					"_accounts": [],
					"_createdAt": 1561762972282,
					"_currentBalance": 100000014489,
					"_lifetimeBalance": 100000023009,
					"_bets": {
						"1a5d2850-99f9-11e9-943d-03015f6e23b5": "3bc148a0-99f9-11e9-943d-03015f6e23b5",
						"a60fea20-9d0c-11e9-943d-03015f6e23b5": "e49aa820-9d0c-11e9-943d-03015f6e23b5",
						"36e08410-9d0d-11e9-943d-03015f6e23b5": "3b87ec10-9d0d-11e9-943d-03015f6e23b5",
						"4638ed60-a840-11e9-bd28-b354ce9f3528": "91094d30-a840-11e9-bd28-b354ce9f3528",
						"5e10c3a0-9f92-11ea-8919-d395d3434d4b": "6827ecb0-9f92-11ea-8919-d395d3434d4b",
						"8ebe76f0-9f92-11ea-8919-d395d3434d4b": "9eaa1650-9f92-11ea-8919-d395d3434d4b",
						"cdd08d60-9f92-11ea-8919-d395d3434d4b": "6bb697c0-ca7e-11ea-b7ca-497f43bcd90a",
						"a965aed0-a8d3-11e9-bd28-b354ce9f3528": "6ce8e0c0-ca7f-11ea-b7ca-497f43bcd90a",
						"da969110-f097-11ea-bb5d-f3bf67cc597f": "e73ec540-f097-11ea-bb5d-f3bf67cc597f"
					},
					"_changes": [
						"2637fa60-99f9-11e9-943d-03015f6e23b5",
						"37a9c490-99f9-11e9-943d-03015f6e23b5",
						"3b188580-99f9-11e9-943d-03015f6e23b5",
						"3bc148a0-99f9-11e9-943d-03015f6e23b5",
						"a99dcbd0-9d0c-11e9-943d-03015f6e23b5",
						"c63fd030-9d0c-11e9-943d-03015f6e23b5",
						"e45784a0-9d0c-11e9-943d-03015f6e23b5",
						"e49aa820-9d0c-11e9-943d-03015f6e23b5",
						"3b87ec10-9d0d-11e9-943d-03015f6e23b5",
						"4ddd8691-9d0d-11e9-943d-03015f6e23b5",
						"83fc3cb0-a840-11e9-bd28-b354ce9f3528",
						"8a599210-a840-11e9-bd28-b354ce9f3528",
						"8ab65810-a840-11e9-bd28-b354ce9f3528",
						"8ae99d10-a840-11e9-bd28-b354ce9f3528",
						"8b4fd8f0-a840-11e9-bd28-b354ce9f3528",
						"8bb77460-a840-11e9-bd28-b354ce9f3528",
						"8c165d40-a840-11e9-bd28-b354ce9f3528",
						"8c495420-a840-11e9-bd28-b354ce9f3528",
						"8c780540-a840-11e9-bd28-b354ce9f3528",
						"8ca5a4f0-a840-11e9-bd28-b354ce9f3528",
						"8cd78a60-a840-11e9-bd28-b354ce9f3528",
						"8d42f660-a840-11e9-bd28-b354ce9f3528",
						"8ddf3660-a840-11e9-bd28-b354ce9f3528",
						"8e474700-a840-11e9-bd28-b354ce9f3528",
						"91094d30-a840-11e9-bd28-b354ce9f3528",
						"b823a3a0-a8d3-11e9-bd28-b354ce9f3528",
						"295b6ad0-001d-11ea-a693-714a24e863fc",
						"6827ecb0-9f92-11ea-8919-d395d3434d4b",
						"9eaa1650-9f92-11ea-8919-d395d3434d4b",
						"a4042c81-9f92-11ea-8919-d395d3434d4b",
						"a64b3652-9f92-11ea-8919-d395d3434d4b",
						"d06df492-9f92-11ea-8919-d395d3434d4b",
						"7c95f200-b5ae-11ea-83b1-cf73ad225062",
						"6bb697c0-ca7e-11ea-b7ca-497f43bcd90a",
						"6c5b1fb0-ca7f-11ea-b7ca-497f43bcd90a",
						"6ce8e0c0-ca7f-11ea-b7ca-497f43bcd90a",
						"81bf0ba1-ca7f-11ea-b7ca-497f43bcd90a",
						"62503b32-ccba-11ea-b62a-3b3a5e6c9540",
						"e73ec540-f097-11ea-bb5d-f3bf67cc597f"
					],
					"_grants": [
						"37a9c490-99f9-11e9-943d-03015f6e23b5",
						"3a1cc060-99f9-11e9-943d-03015f6e23b5",
						"3b188580-99f9-11e9-943d-03015f6e23b5",
						"41a612a0-99f9-11e9-943d-03015f6e23b5",
						"f73ee4d0-9a0c-11e9-943d-03015f6e23b5",
						"dd6314d0-9d0b-11e9-943d-03015f6e23b5",
						"c0e4cfa0-9d0c-11e9-943d-03015f6e23b5",
						"c63fd030-9d0c-11e9-943d-03015f6e23b5",
						"c92cb6f0-9d0c-11e9-943d-03015f6e23b5",
						"cc2d25b0-9d0c-11e9-943d-03015f6e23b5",
						"d2279a90-9d0c-11e9-943d-03015f6e23b5",
						"e45784a0-9d0c-11e9-943d-03015f6e23b5",
						"8a599210-a840-11e9-bd28-b354ce9f3528",
						"8ae99d10-a840-11e9-bd28-b354ce9f3528",
						"8bb77460-a840-11e9-bd28-b354ce9f3528",
						"8c495420-a840-11e9-bd28-b354ce9f3528",
						"8ca5a4f0-a840-11e9-bd28-b354ce9f3528",
						"8d42f660-a840-11e9-bd28-b354ce9f3528",
						"8e474700-a840-11e9-bd28-b354ce9f3528",
						"7f5d2500-0017-11ea-9ecd-f984eb8b6e33",
						"295b6ad0-001d-11ea-a693-714a24e863fc",
						"3a6bdb20-001d-11ea-a693-714a24e863fc",
						"830ab820-0021-11ea-a693-714a24e863fc",
						"25ac5000-9f93-11ea-8919-d395d3434d4b",
						"4accb500-9f93-11ea-8919-d395d3434d4b",
						"9f3ef2c0-ac08-11ea-882e-ed9f313dc034",
						"7c95f200-b5ae-11ea-83b1-cf73ad225062",
						"6c5b1fb0-ca7f-11ea-b7ca-497f43bcd90a"
					]
				},
				"_user": "382544116808155137",
				"_amount": 0,
				"_source": {
					"_type": 3,
					"_id": "25f4b690-1c09-11eb-bbdc-c5ae2af77fc6"
				}
			},
			"ce396253-1c0a-11eb-bbdc-c5ae2af77fc6": {
				"_id": "ce396253-1c0a-11eb-bbdc-c5ae2af77fc6",
				"_type": 4,
				"_granter": {
					"_id": "260288776360820736",
					"_accounts": [],
					"_createdAt": 1561762972282,
					"_currentBalance": 100000014489,
					"_lifetimeBalance": 100000023009,
					"_bets": {
						"1a5d2850-99f9-11e9-943d-03015f6e23b5": "3bc148a0-99f9-11e9-943d-03015f6e23b5",
						"a60fea20-9d0c-11e9-943d-03015f6e23b5": "e49aa820-9d0c-11e9-943d-03015f6e23b5",
						"36e08410-9d0d-11e9-943d-03015f6e23b5": "3b87ec10-9d0d-11e9-943d-03015f6e23b5",
						"4638ed60-a840-11e9-bd28-b354ce9f3528": "91094d30-a840-11e9-bd28-b354ce9f3528",
						"5e10c3a0-9f92-11ea-8919-d395d3434d4b": "6827ecb0-9f92-11ea-8919-d395d3434d4b",
						"8ebe76f0-9f92-11ea-8919-d395d3434d4b": "9eaa1650-9f92-11ea-8919-d395d3434d4b",
						"cdd08d60-9f92-11ea-8919-d395d3434d4b": "6bb697c0-ca7e-11ea-b7ca-497f43bcd90a",
						"a965aed0-a8d3-11e9-bd28-b354ce9f3528": "6ce8e0c0-ca7f-11ea-b7ca-497f43bcd90a",
						"da969110-f097-11ea-bb5d-f3bf67cc597f": "e73ec540-f097-11ea-bb5d-f3bf67cc597f"
					},
					"_changes": [
						"2637fa60-99f9-11e9-943d-03015f6e23b5",
						"37a9c490-99f9-11e9-943d-03015f6e23b5",
						"3b188580-99f9-11e9-943d-03015f6e23b5",
						"3bc148a0-99f9-11e9-943d-03015f6e23b5",
						"a99dcbd0-9d0c-11e9-943d-03015f6e23b5",
						"c63fd030-9d0c-11e9-943d-03015f6e23b5",
						"e45784a0-9d0c-11e9-943d-03015f6e23b5",
						"e49aa820-9d0c-11e9-943d-03015f6e23b5",
						"3b87ec10-9d0d-11e9-943d-03015f6e23b5",
						"4ddd8691-9d0d-11e9-943d-03015f6e23b5",
						"83fc3cb0-a840-11e9-bd28-b354ce9f3528",
						"8a599210-a840-11e9-bd28-b354ce9f3528",
						"8ab65810-a840-11e9-bd28-b354ce9f3528",
						"8ae99d10-a840-11e9-bd28-b354ce9f3528",
						"8b4fd8f0-a840-11e9-bd28-b354ce9f3528",
						"8bb77460-a840-11e9-bd28-b354ce9f3528",
						"8c165d40-a840-11e9-bd28-b354ce9f3528",
						"8c495420-a840-11e9-bd28-b354ce9f3528",
						"8c780540-a840-11e9-bd28-b354ce9f3528",
						"8ca5a4f0-a840-11e9-bd28-b354ce9f3528",
						"8cd78a60-a840-11e9-bd28-b354ce9f3528",
						"8d42f660-a840-11e9-bd28-b354ce9f3528",
						"8ddf3660-a840-11e9-bd28-b354ce9f3528",
						"8e474700-a840-11e9-bd28-b354ce9f3528",
						"91094d30-a840-11e9-bd28-b354ce9f3528",
						"b823a3a0-a8d3-11e9-bd28-b354ce9f3528",
						"295b6ad0-001d-11ea-a693-714a24e863fc",
						"6827ecb0-9f92-11ea-8919-d395d3434d4b",
						"9eaa1650-9f92-11ea-8919-d395d3434d4b",
						"a4042c81-9f92-11ea-8919-d395d3434d4b",
						"a64b3652-9f92-11ea-8919-d395d3434d4b",
						"d06df492-9f92-11ea-8919-d395d3434d4b",
						"7c95f200-b5ae-11ea-83b1-cf73ad225062",
						"6bb697c0-ca7e-11ea-b7ca-497f43bcd90a",
						"6c5b1fb0-ca7f-11ea-b7ca-497f43bcd90a",
						"6ce8e0c0-ca7f-11ea-b7ca-497f43bcd90a",
						"81bf0ba1-ca7f-11ea-b7ca-497f43bcd90a",
						"62503b32-ccba-11ea-b62a-3b3a5e6c9540",
						"e73ec540-f097-11ea-bb5d-f3bf67cc597f"
					],
					"_grants": [
						"37a9c490-99f9-11e9-943d-03015f6e23b5",
						"3a1cc060-99f9-11e9-943d-03015f6e23b5",
						"3b188580-99f9-11e9-943d-03015f6e23b5",
						"41a612a0-99f9-11e9-943d-03015f6e23b5",
						"f73ee4d0-9a0c-11e9-943d-03015f6e23b5",
						"dd6314d0-9d0b-11e9-943d-03015f6e23b5",
						"c0e4cfa0-9d0c-11e9-943d-03015f6e23b5",
						"c63fd030-9d0c-11e9-943d-03015f6e23b5",
						"c92cb6f0-9d0c-11e9-943d-03015f6e23b5",
						"cc2d25b0-9d0c-11e9-943d-03015f6e23b5",
						"d2279a90-9d0c-11e9-943d-03015f6e23b5",
						"e45784a0-9d0c-11e9-943d-03015f6e23b5",
						"8a599210-a840-11e9-bd28-b354ce9f3528",
						"8ae99d10-a840-11e9-bd28-b354ce9f3528",
						"8bb77460-a840-11e9-bd28-b354ce9f3528",
						"8c495420-a840-11e9-bd28-b354ce9f3528",
						"8ca5a4f0-a840-11e9-bd28-b354ce9f3528",
						"8d42f660-a840-11e9-bd28-b354ce9f3528",
						"8e474700-a840-11e9-bd28-b354ce9f3528",
						"7f5d2500-0017-11ea-9ecd-f984eb8b6e33",
						"295b6ad0-001d-11ea-a693-714a24e863fc",
						"3a6bdb20-001d-11ea-a693-714a24e863fc",
						"830ab820-0021-11ea-a693-714a24e863fc",
						"25ac5000-9f93-11ea-8919-d395d3434d4b",
						"4accb500-9f93-11ea-8919-d395d3434d4b",
						"9f3ef2c0-ac08-11ea-882e-ed9f313dc034",
						"7c95f200-b5ae-11ea-83b1-cf73ad225062",
						"6c5b1fb0-ca7f-11ea-b7ca-497f43bcd90a"
					]
				},
				"_user": "260288776360820736",
				"_amount": 1000,
				"_source": {
					"_type": 3,
					"_id": "add46280-1c0a-11eb-bbdc-c5ae2af77fc6"
				}
			},
			"2bf31640-b41b-11eb-92b2-a32ed7e3969a": {
				"_id": "2bf31640-b41b-11eb-92b2-a32ed7e3969a",
				"_type": 2,
				"_granter": "260288776360820736",
				"_user": "211283870736187394",
				"_amount": 1000,
				"_source": {
					"_type": 2,
					"_id": null
				}
			},
			"9cc78450-b41b-11eb-92b2-a32ed7e3969a": {
				"_id": "9cc78450-b41b-11eb-92b2-a32ed7e3969a",
				"_type": 2,
				"_granter": "260288776360820736",
				"_user": "177423709114466304",
				"_amount": 1000,
				"_source": {
					"_type": 2,
					"_id": null
				}
			}
		},
		"penalties": {},
		"bets": {},
		"betPools": {
			"db5e24b0-99f8-11e9-943d-03015f6e23b5": {
				"_id": "db5e24b0-99f8-11e9-943d-03015f6e23b5",
				"_name": "Who will get to 80 first?",
				"_source": {
					"_type": 2,
					"_id": null
				},
				"_owner": {
					"_id": "260288776360820736",
					"_accounts": [],
					"_createdAt": 1561762972282,
					"_currentBalance": 0,
					"_lifetimeBalance": 0,
					"_bets": {},
					"_changes": [],
					"_grants": []
				},
				"_winner": "Death",
				"_lastEditedBy": null,
				"_lastEdited": 1561763013984,
				"_options": [
					"Randy (gtbadboi (snail))",
					"Death"
				],
				"_betSize": 5000,
				"_bets": {},
				"_status": 4,
				"_message": {
					"_id": "595819812211523614",
					"color": "DARK_GREY",
					"author": "Who will get to 80 first?",
					"authorIcon": null,
					"thumbnail": "https:\u002F\u002Fwww.onlygfx.com\u002Fwp-content\u002Fuploads\u002F2018\u002F04\u002Fcompleted-stamp-3.png",
					"closing": "\n\nBets have been paid awarded."
				}
			},
			"1a5d2850-99f9-11e9-943d-03015f6e23b5": {
				"_id": "1a5d2850-99f9-11e9-943d-03015f6e23b5",
				"_name": "Who will get to 80 first?",
				"_source": {
					"_type": 2,
					"_id": null
				},
				"_owner": {
					"_id": "260288776360820736",
					"_accounts": [],
					"_createdAt": 1561762972282,
					"_currentBalance": 0,
					"_lifetimeBalance": 0,
					"_bets": {},
					"_changes": [],
					"_grants": []
				},
				"_winner": "Death",
				"_lastEdited": 1563332861861,
				"_options": [
					"Randy (gtbadboi (snail))",
					"Death"
				],
				"_betSize": 5000,
				"_bets": {
					"24753bc0-99f9-11e9-943d-03015f6e23b5": {
						"_id": "24753bc0-99f9-11e9-943d-03015f6e23b5",
						"_type": 3,
						"_granter": null,
						"_user": "174037015858249730",
						"_amount": 0,
						"_source": {
							"_type": 5,
							"_id": "594302166446112768"
						},
						"_betPool": "1a5d2850-99f9-11e9-943d-03015f6e23b5",
						"_wager": 0,
						"_payout": 0,
						"_outcome": "Death",
						"_status": 7
					},
					"2637fa60-99f9-11e9-943d-03015f6e23b5": {
						"_id": "2637fa60-99f9-11e9-943d-03015f6e23b5",
						"_type": 3,
						"_granter": null,
						"_user": "260288776360820736",
						"_amount": 0,
						"_source": {
							"_type": 5,
							"_id": "594302166446112768"
						},
						"_betPool": "1a5d2850-99f9-11e9-943d-03015f6e23b5",
						"_wager": 0,
						"_payout": 0,
						"_outcome": "Death",
						"_status": 7
					},
					"3bc148a0-99f9-11e9-943d-03015f6e23b5": {
						"_id": "3bc148a0-99f9-11e9-943d-03015f6e23b5",
						"_type": 3,
						"_granter": null,
						"_user": "260288776360820736",
						"_amount": -5000,
						"_source": {
							"_type": 5,
							"_id": "594302166446112768"
						},
						"_betPool": "1a5d2850-99f9-11e9-943d-03015f6e23b5",
						"_wager": 5000,
						"_payout": 7500,
						"_outcome": "Death",
						"_status": 6
					},
					"406be4f0-99f9-11e9-943d-03015f6e23b5": {
						"_id": "406be4f0-99f9-11e9-943d-03015f6e23b5",
						"_type": 3,
						"_granter": null,
						"_user": "174037015858249730",
						"_amount": -5000,
						"_source": {
							"_type": 5,
							"_id": "594302166446112768"
						},
						"_betPool": "1a5d2850-99f9-11e9-943d-03015f6e23b5",
						"_wager": 5000,
						"_payout": 7500,
						"_outcome": "Death",
						"_status": 6
					},
					"cb5cc880-99fa-11e9-943d-03015f6e23b5": {
						"_id": "cb5cc880-99fa-11e9-943d-03015f6e23b5",
						"_type": 3,
						"_granter": null,
						"_user": "138398309776621569",
						"_amount": -5000,
						"_source": {
							"_type": 5,
							"_id": "594302166446112768"
						},
						"_betPool": "1a5d2850-99f9-11e9-943d-03015f6e23b5",
						"_wager": 5000,
						"_payout": 0,
						"_outcome": "Randy (gtbadboi (snail))",
						"_status": 2
					}
				},
				"_status": 4,
				"_message": {
					"_id": "600886222310604838",
					"color": "DARK_GREY",
					"author": "Who will get to 80 first?",
					"authorIcon": null,
					"thumbnail": "https:\u002F\u002Fwww.onlygfx.com\u002Fwp-content\u002Fuploads\u002F2018\u002F04\u002Fcompleted-stamp-3.png",
					"closing": "\n\nBets have been paid awarded."
				}
			},
			"a60fea20-9d0c-11e9-943d-03015f6e23b5": {
				"_id": "a60fea20-9d0c-11e9-943d-03015f6e23b5",
				"_name": "WHO RENAMED SPLINTER?! (Murder mystery edition)",
				"_source": {
					"_type": 2,
					"_id": null
				},
				"_owner": {
					"_id": "138398309776621569",
					"_accounts": [],
					"_createdAt": 1561763143883,
					"_currentBalance": 0,
					"_lifetimeBalance": 5000,
					"_bets": {
						"1a5d2850-99f9-11e9-943d-03015f6e23b5": "cb5cc880-99fa-11e9-943d-03015f6e23b5"
					},
					"_changes": [
						"41a612a0-99f9-11e9-943d-03015f6e23b5",
						"cb5cc880-99fa-11e9-943d-03015f6e23b5"
					],
					"_grants": []
				},
				"_winner": "Dog",
				"_lastEdited": 1562101498708,
				"_options": [
					"Native",
					"Dog",
					"Haze",
					"Huz"
				],
				"_betSize": 10,
				"_bets": {
					"a99dcbd0-9d0c-11e9-943d-03015f6e23b5": {
						"_id": "a99dcbd0-9d0c-11e9-943d-03015f6e23b5",
						"_type": 3,
						"_granter": null,
						"_user": "260288776360820736",
						"_amount": 0,
						"_source": {
							"_type": 5,
							"_id": "595720882564104194"
						},
						"_betPool": "a60fea20-9d0c-11e9-943d-03015f6e23b5",
						"_wager": 0,
						"_payout": 0,
						"_outcome": "Huz",
						"_status": 7
					},
					"ac046b90-9d0c-11e9-943d-03015f6e23b5": {
						"_id": "ac046b90-9d0c-11e9-943d-03015f6e23b5",
						"_type": 3,
						"_granter": null,
						"_user": "138398309776621569",
						"_amount": 0,
						"_source": {
							"_type": 5,
							"_id": "595720882564104194"
						},
						"_betPool": "a60fea20-9d0c-11e9-943d-03015f6e23b5",
						"_wager": 0,
						"_payout": 0,
						"_outcome": "Dog",
						"_status": 7
					},
					"b1667100-9d0c-11e9-943d-03015f6e23b5": {
						"_id": "b1667100-9d0c-11e9-943d-03015f6e23b5",
						"_type": 3,
						"_granter": null,
						"_user": "108378183253913600",
						"_amount": -10,
						"_source": {
							"_type": 5,
							"_id": "595720882564104194"
						},
						"_betPool": "a60fea20-9d0c-11e9-943d-03015f6e23b5",
						"_wager": 10,
						"_payout": 0,
						"_outcome": "Dog",
						"_status": 7
					},
					"b5e01240-9d0c-11e9-943d-03015f6e23b5": {
						"_id": "b5e01240-9d0c-11e9-943d-03015f6e23b5",
						"_type": 3,
						"_granter": null,
						"_user": "108378183253913600",
						"_amount": -10,
						"_source": {
							"_type": 5,
							"_id": "595720882564104194"
						},
						"_betPool": "a60fea20-9d0c-11e9-943d-03015f6e23b5",
						"_wager": 10,
						"_payout": 20,
						"_outcome": "Dog",
						"_status": 6
					},
					"c46a73f0-9d0c-11e9-943d-03015f6e23b5": {
						"_id": "c46a73f0-9d0c-11e9-943d-03015f6e23b5",
						"_type": 3,
						"_granter": null,
						"_user": "138398309776621569",
						"_amount": -10,
						"_source": {
							"_type": 5,
							"_id": "595720882564104194"
						},
						"_betPool": "a60fea20-9d0c-11e9-943d-03015f6e23b5",
						"_wager": 10,
						"_payout": 0,
						"_outcome": "Dog",
						"_status": 7
					},
					"e49aa820-9d0c-11e9-943d-03015f6e23b5": {
						"_id": "e49aa820-9d0c-11e9-943d-03015f6e23b5",
						"_type": 3,
						"_granter": null,
						"_user": "260288776360820736",
						"_amount": -10,
						"_source": {
							"_type": 5,
							"_id": "595720882564104194"
						},
						"_betPool": "a60fea20-9d0c-11e9-943d-03015f6e23b5",
						"_wager": 10,
						"_payout": 0,
						"_outcome": "Huz",
						"_status": 2
					},
					"e7137050-9d0c-11e9-943d-03015f6e23b5": {
						"_id": "e7137050-9d0c-11e9-943d-03015f6e23b5",
						"_type": 3,
						"_granter": null,
						"_user": "191286686607474698",
						"_amount": -10,
						"_source": {
							"_type": 5,
							"_id": "595720882564104194"
						},
						"_betPool": "a60fea20-9d0c-11e9-943d-03015f6e23b5",
						"_wager": 10,
						"_payout": 20,
						"_outcome": "Dog",
						"_status": 6
					},
					"f6b116c0-9d0c-11e9-943d-03015f6e23b5": {
						"_id": "f6b116c0-9d0c-11e9-943d-03015f6e23b5",
						"_type": 3,
						"_granter": null,
						"_user": "138398309776621569",
						"_amount": -10,
						"_source": {
							"_type": 5,
							"_id": "595720882564104194"
						},
						"_betPool": "a60fea20-9d0c-11e9-943d-03015f6e23b5",
						"_wager": 10,
						"_payout": 20,
						"_outcome": "Dog",
						"_status": 6
					}
				},
				"_status": 4,
				"_message": {
					"_id": "595720882564104194",
					"color": "DARK_GREY",
					"author": "WHO RENAMED SPLINTER?! (Murder mystery edition)",
					"authorIcon": null,
					"thumbnail": "https:\u002F\u002Fwww.onlygfx.com\u002Fwp-content\u002Fuploads\u002F2018\u002F04\u002Fcompleted-stamp-3.png",
					"closing": "\n\nBets have been paid awarded."
				}
			},
			"36e08410-9d0d-11e9-943d-03015f6e23b5": {
				"_id": "36e08410-9d0d-11e9-943d-03015f6e23b5",
				"_name": "36e08410-9d0d-11e9-943d-03015f6e23b5",
				"_source": {
					"_type": 2,
					"_id": null
				},
				"_owner": {
					"_id": "260288776360820736",
					"_accounts": [],
					"_createdAt": 1561762972282,
					"_currentBalance": 4990,
					"_lifetimeBalance": 10000,
					"_bets": {
						"1a5d2850-99f9-11e9-943d-03015f6e23b5": "3bc148a0-99f9-11e9-943d-03015f6e23b5",
						"a60fea20-9d0c-11e9-943d-03015f6e23b5": "e49aa820-9d0c-11e9-943d-03015f6e23b5"
					},
					"_changes": [
						"2637fa60-99f9-11e9-943d-03015f6e23b5",
						"37a9c490-99f9-11e9-943d-03015f6e23b5",
						"3b188580-99f9-11e9-943d-03015f6e23b5",
						"3bc148a0-99f9-11e9-943d-03015f6e23b5",
						"a99dcbd0-9d0c-11e9-943d-03015f6e23b5",
						"c63fd030-9d0c-11e9-943d-03015f6e23b5",
						"e45784a0-9d0c-11e9-943d-03015f6e23b5",
						"e49aa820-9d0c-11e9-943d-03015f6e23b5"
					],
					"_grants": [
						"37a9c490-99f9-11e9-943d-03015f6e23b5",
						"3a1cc060-99f9-11e9-943d-03015f6e23b5",
						"3b188580-99f9-11e9-943d-03015f6e23b5",
						"41a612a0-99f9-11e9-943d-03015f6e23b5",
						"f73ee4d0-9a0c-11e9-943d-03015f6e23b5",
						"dd6314d0-9d0b-11e9-943d-03015f6e23b5",
						"c0e4cfa0-9d0c-11e9-943d-03015f6e23b5",
						"c63fd030-9d0c-11e9-943d-03015f6e23b5",
						"c92cb6f0-9d0c-11e9-943d-03015f6e23b5",
						"cc2d25b0-9d0c-11e9-943d-03015f6e23b5",
						"d2279a90-9d0c-11e9-943d-03015f6e23b5",
						"e45784a0-9d0c-11e9-943d-03015f6e23b5"
					]
				},
				"_winner": "uhhh",
				"_lastEdited": 1562101607801,
				"_options": [
					"uhhh"
				],
				"_betSize": 10,
				"_bets": {
					"39259210-9d0d-11e9-943d-03015f6e23b5": {
						"_id": "39259210-9d0d-11e9-943d-03015f6e23b5",
						"_type": 3,
						"_granter": null,
						"_user": "138398309776621569",
						"_amount": -10,
						"_source": {
							"_type": 5,
							"_id": "595721901515472927"
						},
						"_betPool": "36e08410-9d0d-11e9-943d-03015f6e23b5",
						"_wager": 10,
						"_payout": 10,
						"_outcome": "uhhh",
						"_status": 6
					},
					"3b87ec10-9d0d-11e9-943d-03015f6e23b5": {
						"_id": "3b87ec10-9d0d-11e9-943d-03015f6e23b5",
						"_type": 3,
						"_granter": null,
						"_user": "260288776360820736",
						"_amount": -10,
						"_source": {
							"_type": 5,
							"_id": "595721901515472927"
						},
						"_betPool": "36e08410-9d0d-11e9-943d-03015f6e23b5",
						"_wager": 10,
						"_payout": 10,
						"_outcome": "uhhh",
						"_status": 6
					}
				},
				"_status": 4,
				"_message": {
					"_id": "595721901515472927",
					"color": "DARK_GREY",
					"author": "36e08410-9d0d-11e9-943d-03015f6e23b5",
					"authorIcon": null,
					"thumbnail": "https:\u002F\u002Fwww.onlygfx.com\u002Fwp-content\u002Fuploads\u002F2018\u002F04\u002Fcompleted-stamp-3.png",
					"closing": "\n\nBets have been paid awarded."
				}
			},
			"01ffe030-9d33-11e9-943d-03015f6e23b5": {
				"_id": "01ffe030-9d33-11e9-943d-03015f6e23b5",
				"_name": "01ffe030-9d33-11e9-943d-03015f6e23b5",
				"_source": {
					"_type": 2,
					"_id": null
				},
				"_owner": {
					"_id": "260288776360820736",
					"_accounts": [],
					"_createdAt": 1561762972282,
					"_currentBalance": 4990,
					"_lifetimeBalance": 10010,
					"_bets": {
						"1a5d2850-99f9-11e9-943d-03015f6e23b5": "3bc148a0-99f9-11e9-943d-03015f6e23b5",
						"a60fea20-9d0c-11e9-943d-03015f6e23b5": "e49aa820-9d0c-11e9-943d-03015f6e23b5",
						"36e08410-9d0d-11e9-943d-03015f6e23b5": "3b87ec10-9d0d-11e9-943d-03015f6e23b5"
					},
					"_changes": [
						"2637fa60-99f9-11e9-943d-03015f6e23b5",
						"37a9c490-99f9-11e9-943d-03015f6e23b5",
						"3b188580-99f9-11e9-943d-03015f6e23b5",
						"3bc148a0-99f9-11e9-943d-03015f6e23b5",
						"a99dcbd0-9d0c-11e9-943d-03015f6e23b5",
						"c63fd030-9d0c-11e9-943d-03015f6e23b5",
						"e45784a0-9d0c-11e9-943d-03015f6e23b5",
						"e49aa820-9d0c-11e9-943d-03015f6e23b5",
						"3b87ec10-9d0d-11e9-943d-03015f6e23b5",
						"4ddd8691-9d0d-11e9-943d-03015f6e23b5"
					],
					"_grants": [
						"37a9c490-99f9-11e9-943d-03015f6e23b5",
						"3a1cc060-99f9-11e9-943d-03015f6e23b5",
						"3b188580-99f9-11e9-943d-03015f6e23b5",
						"41a612a0-99f9-11e9-943d-03015f6e23b5",
						"f73ee4d0-9a0c-11e9-943d-03015f6e23b5",
						"dd6314d0-9d0b-11e9-943d-03015f6e23b5",
						"c0e4cfa0-9d0c-11e9-943d-03015f6e23b5",
						"c63fd030-9d0c-11e9-943d-03015f6e23b5",
						"c92cb6f0-9d0c-11e9-943d-03015f6e23b5",
						"cc2d25b0-9d0c-11e9-943d-03015f6e23b5",
						"d2279a90-9d0c-11e9-943d-03015f6e23b5",
						"e45784a0-9d0c-11e9-943d-03015f6e23b5"
					]
				},
				"_winner": null,
				"_lastEdited": 1563332909949,
				"_options": [
					"Dog",
					"Dog"
				],
				"_betSize": 5000,
				"_bets": {},
				"_status": 5,
				"_message": {
					"_id": "600886224353361945",
					"color": "DARK_RED",
					"author": "01ffe030-9d33-11e9-943d-03015f6e23b5",
					"authorIcon": null,
					"thumbnail": "https:\u002F\u002Fupload.wikimedia.org\u002Fwikipedia\u002Fcommons\u002Fthumb\u002F3\u002F31\u002FProhibitionSign2.svg\u002F1200px-ProhibitionSign2.svg.png",
					"closing": "\n\n**Users**: Place bets by reacting to 1⃣, 2⃣, ...\n**Admin**: Close bets with ✅ or refund with 🚫."
				}
			},
			"4638ed60-a840-11e9-bd28-b354ce9f3528": {
				"_id": "4638ed60-a840-11e9-bd28-b354ce9f3528",
				"_name": "Will dog ever fix the bot?",
				"_source": {
					"_type": 2,
					"_id": null
				},
				"_owner": {
					"_id": "260288776360820736",
					"_accounts": [],
					"_createdAt": 1561762972282,
					"_currentBalance": 4990,
					"_lifetimeBalance": 10010,
					"_bets": {
						"1a5d2850-99f9-11e9-943d-03015f6e23b5": "3bc148a0-99f9-11e9-943d-03015f6e23b5",
						"a60fea20-9d0c-11e9-943d-03015f6e23b5": "e49aa820-9d0c-11e9-943d-03015f6e23b5",
						"36e08410-9d0d-11e9-943d-03015f6e23b5": "3b87ec10-9d0d-11e9-943d-03015f6e23b5"
					},
					"_changes": [
						"2637fa60-99f9-11e9-943d-03015f6e23b5",
						"37a9c490-99f9-11e9-943d-03015f6e23b5",
						"3b188580-99f9-11e9-943d-03015f6e23b5",
						"3bc148a0-99f9-11e9-943d-03015f6e23b5",
						"a99dcbd0-9d0c-11e9-943d-03015f6e23b5",
						"c63fd030-9d0c-11e9-943d-03015f6e23b5",
						"e45784a0-9d0c-11e9-943d-03015f6e23b5",
						"e49aa820-9d0c-11e9-943d-03015f6e23b5",
						"3b87ec10-9d0d-11e9-943d-03015f6e23b5",
						"4ddd8691-9d0d-11e9-943d-03015f6e23b5"
					],
					"_grants": [
						"37a9c490-99f9-11e9-943d-03015f6e23b5",
						"3a1cc060-99f9-11e9-943d-03015f6e23b5",
						"3b188580-99f9-11e9-943d-03015f6e23b5",
						"41a612a0-99f9-11e9-943d-03015f6e23b5",
						"f73ee4d0-9a0c-11e9-943d-03015f6e23b5",
						"dd6314d0-9d0b-11e9-943d-03015f6e23b5",
						"c0e4cfa0-9d0c-11e9-943d-03015f6e23b5",
						"c63fd030-9d0c-11e9-943d-03015f6e23b5",
						"c92cb6f0-9d0c-11e9-943d-03015f6e23b5",
						"cc2d25b0-9d0c-11e9-943d-03015f6e23b5",
						"d2279a90-9d0c-11e9-943d-03015f6e23b5",
						"e45784a0-9d0c-11e9-943d-03015f6e23b5"
					]
				},
				"_winner": null,
				"_lastEdited": 1590526349913,
				"_options": [
					"Yes",
					"No"
				],
				"_betSize": 5000,
				"_bets": {
					"4adf9210-a840-11e9-bd28-b354ce9f3528": {
						"_id": "4adf9210-a840-11e9-bd28-b354ce9f3528",
						"_type": 3,
						"_granter": null,
						"_user": "138398309776621569",
						"_amount": -4990,
						"_source": {
							"_type": 5,
							"_id": "600886737845354499"
						},
						"_betPool": "4638ed60-a840-11e9-bd28-b354ce9f3528",
						"_wager": 4990,
						"_payout": 0,
						"_outcome": "No",
						"_status": 7
					},
					"5614fc60-a840-11e9-bd28-b354ce9f3528": {
						"_id": "5614fc60-a840-11e9-bd28-b354ce9f3528",
						"_type": 3,
						"_granter": null,
						"_user": "174037015858249730",
						"_amount": 0,
						"_source": {
							"_type": 5,
							"_id": "600886737845354499"
						},
						"_betPool": "4638ed60-a840-11e9-bd28-b354ce9f3528",
						"_wager": 0,
						"_payout": 0,
						"_outcome": "No",
						"_status": 7
					},
					"5e085b10-a840-11e9-bd28-b354ce9f3528": {
						"_id": "5e085b10-a840-11e9-bd28-b354ce9f3528",
						"_type": 3,
						"_granter": null,
						"_user": "174037015858249730",
						"_amount": 0,
						"_source": {
							"_type": 5,
							"_id": "600886737845354499"
						},
						"_betPool": "4638ed60-a840-11e9-bd28-b354ce9f3528",
						"_wager": 0,
						"_payout": 0,
						"_outcome": "No",
						"_status": 7
					},
					"5ee24050-a840-11e9-bd28-b354ce9f3528": {
						"_id": "5ee24050-a840-11e9-bd28-b354ce9f3528",
						"_type": 3,
						"_granter": null,
						"_user": "174037015858249730",
						"_amount": 0,
						"_source": {
							"_type": 5,
							"_id": "600886737845354499"
						},
						"_betPool": "4638ed60-a840-11e9-bd28-b354ce9f3528",
						"_wager": 0,
						"_payout": 0,
						"_outcome": "No",
						"_status": 7
					},
					"60d7a7b0-a840-11e9-bd28-b354ce9f3528": {
						"_id": "60d7a7b0-a840-11e9-bd28-b354ce9f3528",
						"_type": 3,
						"_granter": null,
						"_user": "174037015858249730",
						"_amount": 0,
						"_source": {
							"_type": 5,
							"_id": "600886737845354499"
						},
						"_betPool": "4638ed60-a840-11e9-bd28-b354ce9f3528",
						"_wager": 0,
						"_payout": 0,
						"_outcome": "No",
						"_status": 7
					},
					"61316070-a840-11e9-bd28-b354ce9f3528": {
						"_id": "61316070-a840-11e9-bd28-b354ce9f3528",
						"_type": 3,
						"_granter": null,
						"_user": "174037015858249730",
						"_amount": 0,
						"_source": {
							"_type": 5,
							"_id": "600886737845354499"
						},
						"_betPool": "4638ed60-a840-11e9-bd28-b354ce9f3528",
						"_wager": 0,
						"_payout": 0,
						"_outcome": "No",
						"_status": 7
					},
					"61a13940-a840-11e9-bd28-b354ce9f3528": {
						"_id": "61a13940-a840-11e9-bd28-b354ce9f3528",
						"_type": 3,
						"_granter": null,
						"_user": "174037015858249730",
						"_amount": 0,
						"_source": {
							"_type": 5,
							"_id": "600886737845354499"
						},
						"_betPool": "4638ed60-a840-11e9-bd28-b354ce9f3528",
						"_wager": 0,
						"_payout": 0,
						"_outcome": "No",
						"_status": 7
					},
					"61f3ed20-a840-11e9-bd28-b354ce9f3528": {
						"_id": "61f3ed20-a840-11e9-bd28-b354ce9f3528",
						"_type": 3,
						"_granter": null,
						"_user": "174037015858249730",
						"_amount": 0,
						"_source": {
							"_type": 5,
							"_id": "600886737845354499"
						},
						"_betPool": "4638ed60-a840-11e9-bd28-b354ce9f3528",
						"_wager": 0,
						"_payout": 0,
						"_outcome": "No",
						"_status": 7
					},
					"62883de0-a840-11e9-bd28-b354ce9f3528": {
						"_id": "62883de0-a840-11e9-bd28-b354ce9f3528",
						"_type": 3,
						"_granter": null,
						"_user": "174037015858249730",
						"_amount": 0,
						"_source": {
							"_type": 5,
							"_id": "600886737845354499"
						},
						"_betPool": "4638ed60-a840-11e9-bd28-b354ce9f3528",
						"_wager": 0,
						"_payout": 0,
						"_outcome": "No",
						"_status": 7
					},
					"83fc3cb0-a840-11e9-bd28-b354ce9f3528": {
						"_id": "83fc3cb0-a840-11e9-bd28-b354ce9f3528",
						"_type": 3,
						"_granter": null,
						"_user": "260288776360820736",
						"_amount": -4990,
						"_source": {
							"_type": 5,
							"_id": "600886737845354499"
						},
						"_betPool": "4638ed60-a840-11e9-bd28-b354ce9f3528",
						"_wager": 4990,
						"_payout": 0,
						"_outcome": "Yes",
						"_status": 7
					},
					"8ab65810-a840-11e9-bd28-b354ce9f3528": {
						"_id": "8ab65810-a840-11e9-bd28-b354ce9f3528",
						"_type": 3,
						"_granter": null,
						"_user": "260288776360820736",
						"_amount": -4990,
						"_source": {
							"_type": 5,
							"_id": "600886737845354499"
						},
						"_betPool": "4638ed60-a840-11e9-bd28-b354ce9f3528",
						"_wager": 4990,
						"_payout": 0,
						"_outcome": "Yes",
						"_status": 7
					},
					"8b4fd8f0-a840-11e9-bd28-b354ce9f3528": {
						"_id": "8b4fd8f0-a840-11e9-bd28-b354ce9f3528",
						"_type": 3,
						"_granter": null,
						"_user": "260288776360820736",
						"_amount": -4990,
						"_source": {
							"_type": 5,
							"_id": "600886737845354499"
						},
						"_betPool": "4638ed60-a840-11e9-bd28-b354ce9f3528",
						"_wager": 4990,
						"_payout": 0,
						"_outcome": "Yes",
						"_status": 7
					},
					"8c165d40-a840-11e9-bd28-b354ce9f3528": {
						"_id": "8c165d40-a840-11e9-bd28-b354ce9f3528",
						"_type": 3,
						"_granter": null,
						"_user": "260288776360820736",
						"_amount": -4990,
						"_source": {
							"_type": 5,
							"_id": "600886737845354499"
						},
						"_betPool": "4638ed60-a840-11e9-bd28-b354ce9f3528",
						"_wager": 4990,
						"_payout": 0,
						"_outcome": "Yes",
						"_status": 7
					},
					"8c780540-a840-11e9-bd28-b354ce9f3528": {
						"_id": "8c780540-a840-11e9-bd28-b354ce9f3528",
						"_type": 3,
						"_granter": null,
						"_user": "260288776360820736",
						"_amount": -4990,
						"_source": {
							"_type": 5,
							"_id": "600886737845354499"
						},
						"_betPool": "4638ed60-a840-11e9-bd28-b354ce9f3528",
						"_wager": 4990,
						"_payout": 0,
						"_outcome": "Yes",
						"_status": 7
					},
					"8cd78a60-a840-11e9-bd28-b354ce9f3528": {
						"_id": "8cd78a60-a840-11e9-bd28-b354ce9f3528",
						"_type": 3,
						"_granter": null,
						"_user": "260288776360820736",
						"_amount": -4990,
						"_source": {
							"_type": 5,
							"_id": "600886737845354499"
						},
						"_betPool": "4638ed60-a840-11e9-bd28-b354ce9f3528",
						"_wager": 4990,
						"_payout": 0,
						"_outcome": "Yes",
						"_status": 7
					},
					"8ddf3660-a840-11e9-bd28-b354ce9f3528": {
						"_id": "8ddf3660-a840-11e9-bd28-b354ce9f3528",
						"_type": 3,
						"_granter": null,
						"_user": "260288776360820736",
						"_amount": -4990,
						"_source": {
							"_type": 5,
							"_id": "600886737845354499"
						},
						"_betPool": "4638ed60-a840-11e9-bd28-b354ce9f3528",
						"_wager": 4990,
						"_payout": 0,
						"_outcome": "Yes",
						"_status": 7
					},
					"91094d30-a840-11e9-bd28-b354ce9f3528": {
						"_id": "91094d30-a840-11e9-bd28-b354ce9f3528",
						"_type": 3,
						"_granter": null,
						"_user": "260288776360820736",
						"_amount": -4990,
						"_source": {
							"_type": 5,
							"_id": "600886737845354499"
						},
						"_betPool": "4638ed60-a840-11e9-bd28-b354ce9f3528",
						"_wager": 4990,
						"_payout": 0,
						"_outcome": "Yes",
						"_status": 7
					}
				},
				"_status": 5,
				"_message": {
					"_id": "714942882385231972",
					"color": "DARK_RED",
					"author": "Will dog ever fix the bot?",
					"authorIcon": null,
					"thumbnail": "https:\u002F\u002Fupload.wikimedia.org\u002Fwikipedia\u002Fcommons\u002Fthumb\u002F3\u002F31\u002FProhibitionSign2.svg\u002F1200px-ProhibitionSign2.svg.png",
					"closing": "\n\n**Users**: Place bets by reacting to 1⃣, 2⃣, ...\n**Admin**: Close bets with ✅ or refund with 🚫."
				}
			},
			"a965aed0-a8d3-11e9-bd28-b354ce9f3528": {
				"_id": "a965aed0-a8d3-11e9-bd28-b354ce9f3528",
				"_name": "Thugs vs Randy to level 80",
				"_source": {
					"_type": 2,
					"_id": null
				},
				"_owner": {
					"_id": "138398309776621569",
					"_accounts": [],
					"_createdAt": 1561763143883,
					"_currentBalance": 0,
					"_lifetimeBalance": 10010,
					"_bets": {
						"1a5d2850-99f9-11e9-943d-03015f6e23b5": "cb5cc880-99fa-11e9-943d-03015f6e23b5",
						"a60fea20-9d0c-11e9-943d-03015f6e23b5": "f6b116c0-9d0c-11e9-943d-03015f6e23b5",
						"36e08410-9d0d-11e9-943d-03015f6e23b5": "39259210-9d0d-11e9-943d-03015f6e23b5",
						"4638ed60-a840-11e9-bd28-b354ce9f3528": "4adf9210-a840-11e9-bd28-b354ce9f3528"
					},
					"_changes": [
						"41a612a0-99f9-11e9-943d-03015f6e23b5",
						"cb5cc880-99fa-11e9-943d-03015f6e23b5",
						"ac046b90-9d0c-11e9-943d-03015f6e23b5",
						"c0e4cfa0-9d0c-11e9-943d-03015f6e23b5",
						"c3ee6620-9d0c-11e9-943d-03015f6e23b5",
						"c46a73f0-9d0c-11e9-943d-03015f6e23b5",
						"f5805ef0-9d0c-11e9-943d-03015f6e23b5",
						"f6b116c0-9d0c-11e9-943d-03015f6e23b5",
						"39259210-9d0d-11e9-943d-03015f6e23b5",
						"4ddd8690-9d0d-11e9-943d-03015f6e23b5",
						"4adf9210-a840-11e9-bd28-b354ce9f3528"
					],
					"_grants": [
						"c3ee6620-9d0c-11e9-943d-03015f6e23b5",
						"f5805ef0-9d0c-11e9-943d-03015f6e23b5"
					]
				},
				"_winner": "Randy",
				"_lastEdited": 1595245957466,
				"_options": [
					"Thugs",
					"Randy"
				],
				"_betSize": 1500,
				"_bets": {
					"ad9e4f70-a8d3-11e9-bd28-b354ce9f3528": {
						"_id": "ad9e4f70-a8d3-11e9-bd28-b354ce9f3528",
						"_type": 3,
						"_granter": null,
						"_user": "138398309776621569",
						"_amount": 0,
						"_source": {
							"_type": 5,
							"_id": "601152246834659339"
						},
						"_betPool": "a965aed0-a8d3-11e9-bd28-b354ce9f3528",
						"_wager": 0,
						"_payout": 0,
						"_outcome": "Randy",
						"_status": 6
					},
					"af5b41b0-a8d3-11e9-bd28-b354ce9f3528": {
						"_id": "af5b41b0-a8d3-11e9-bd28-b354ce9f3528",
						"_type": 3,
						"_granter": null,
						"_user": "174037015858249730",
						"_amount": 0,
						"_source": {
							"_type": 5,
							"_id": "601152246834659339"
						},
						"_betPool": "a965aed0-a8d3-11e9-bd28-b354ce9f3528",
						"_wager": 0,
						"_payout": 0,
						"_outcome": "Thugs",
						"_status": 2
					},
					"b823a3a0-a8d3-11e9-bd28-b354ce9f3528": {
						"_id": "b823a3a0-a8d3-11e9-bd28-b354ce9f3528",
						"_type": 3,
						"_granter": null,
						"_user": "260288776360820736",
						"_amount": 0,
						"_source": {
							"_type": 5,
							"_id": "601152246834659339"
						},
						"_betPool": "a965aed0-a8d3-11e9-bd28-b354ce9f3528",
						"_wager": 0,
						"_payout": 0,
						"_outcome": "Randy",
						"_status": 7
					},
					"6ce8e0c0-ca7f-11ea-b7ca-497f43bcd90a": {
						"_id": "6ce8e0c0-ca7f-11ea-b7ca-497f43bcd90a",
						"_type": 3,
						"_granter": null,
						"_user": "260288776360820736",
						"_amount": -1500,
						"_source": {
							"_type": 5,
							"_id": "734739299861528677"
						},
						"_betPool": "a965aed0-a8d3-11e9-bd28-b354ce9f3528",
						"_wager": 1500,
						"_payout": 1500,
						"_outcome": "Randy",
						"_status": 6
					}
				},
				"_status": 4,
				"_message": {
					"_id": "734739299861528677",
					"color": "DARK_GREY",
					"author": "Thugs vs Randy to level 80",
					"authorIcon": null,
					"thumbnail": "https:\u002F\u002Fwww.onlygfx.com\u002Fwp-content\u002Fuploads\u002F2018\u002F04\u002Fcompleted-stamp-3.png",
					"closing": "\n\nBets have been paid awarded."
				}
			},
			"3e5cac10-0017-11ea-9ecd-f984eb8b6e33": {
				"_id": "3e5cac10-0017-11ea-9ecd-f984eb8b6e33",
				"_name": "Who will reach 80 first?",
				"_source": {
					"_type": 2,
					"_id": null
				},
				"_owner": {
					"_id": "260288776360820736",
					"_accounts": [],
					"_createdAt": 1561762972282,
					"_currentBalance": 0,
					"_lifetimeBalance": 10010,
					"_bets": {
						"1a5d2850-99f9-11e9-943d-03015f6e23b5": "3bc148a0-99f9-11e9-943d-03015f6e23b5",
						"a60fea20-9d0c-11e9-943d-03015f6e23b5": "e49aa820-9d0c-11e9-943d-03015f6e23b5",
						"36e08410-9d0d-11e9-943d-03015f6e23b5": "3b87ec10-9d0d-11e9-943d-03015f6e23b5",
						"4638ed60-a840-11e9-bd28-b354ce9f3528": "91094d30-a840-11e9-bd28-b354ce9f3528",
						"a965aed0-a8d3-11e9-bd28-b354ce9f3528": "b823a3a0-a8d3-11e9-bd28-b354ce9f3528"
					},
					"_changes": [
						"2637fa60-99f9-11e9-943d-03015f6e23b5",
						"37a9c490-99f9-11e9-943d-03015f6e23b5",
						"3b188580-99f9-11e9-943d-03015f6e23b5",
						"3bc148a0-99f9-11e9-943d-03015f6e23b5",
						"a99dcbd0-9d0c-11e9-943d-03015f6e23b5",
						"c63fd030-9d0c-11e9-943d-03015f6e23b5",
						"e45784a0-9d0c-11e9-943d-03015f6e23b5",
						"e49aa820-9d0c-11e9-943d-03015f6e23b5",
						"3b87ec10-9d0d-11e9-943d-03015f6e23b5",
						"4ddd8691-9d0d-11e9-943d-03015f6e23b5",
						"83fc3cb0-a840-11e9-bd28-b354ce9f3528",
						"8a599210-a840-11e9-bd28-b354ce9f3528",
						"8ab65810-a840-11e9-bd28-b354ce9f3528",
						"8ae99d10-a840-11e9-bd28-b354ce9f3528",
						"8b4fd8f0-a840-11e9-bd28-b354ce9f3528",
						"8bb77460-a840-11e9-bd28-b354ce9f3528",
						"8c165d40-a840-11e9-bd28-b354ce9f3528",
						"8c495420-a840-11e9-bd28-b354ce9f3528",
						"8c780540-a840-11e9-bd28-b354ce9f3528",
						"8ca5a4f0-a840-11e9-bd28-b354ce9f3528",
						"8cd78a60-a840-11e9-bd28-b354ce9f3528",
						"8d42f660-a840-11e9-bd28-b354ce9f3528",
						"8ddf3660-a840-11e9-bd28-b354ce9f3528",
						"8e474700-a840-11e9-bd28-b354ce9f3528",
						"91094d30-a840-11e9-bd28-b354ce9f3528",
						"b823a3a0-a8d3-11e9-bd28-b354ce9f3528"
					],
					"_grants": [
						"37a9c490-99f9-11e9-943d-03015f6e23b5",
						"3a1cc060-99f9-11e9-943d-03015f6e23b5",
						"3b188580-99f9-11e9-943d-03015f6e23b5",
						"41a612a0-99f9-11e9-943d-03015f6e23b5",
						"f73ee4d0-9a0c-11e9-943d-03015f6e23b5",
						"dd6314d0-9d0b-11e9-943d-03015f6e23b5",
						"c0e4cfa0-9d0c-11e9-943d-03015f6e23b5",
						"c63fd030-9d0c-11e9-943d-03015f6e23b5",
						"c92cb6f0-9d0c-11e9-943d-03015f6e23b5",
						"cc2d25b0-9d0c-11e9-943d-03015f6e23b5",
						"d2279a90-9d0c-11e9-943d-03015f6e23b5",
						"e45784a0-9d0c-11e9-943d-03015f6e23b5",
						"8a599210-a840-11e9-bd28-b354ce9f3528",
						"8ae99d10-a840-11e9-bd28-b354ce9f3528",
						"8bb77460-a840-11e9-bd28-b354ce9f3528",
						"8c495420-a840-11e9-bd28-b354ce9f3528",
						"8ca5a4f0-a840-11e9-bd28-b354ce9f3528",
						"8d42f660-a840-11e9-bd28-b354ce9f3528",
						"8e474700-a840-11e9-bd28-b354ce9f3528"
					]
				},
				"_winner": "Randy",
				"_lastEdited": 1595247851659,
				"_options": [
					"Thugs",
					"Akaecius",
					"Randy",
					"Nanamo"
				],
				"_betSize": 1500,
				"_bets": {
					"60799510-0017-11ea-9ecd-f984eb8b6e33": {
						"_id": "60799510-0017-11ea-9ecd-f984eb8b6e33",
						"_type": 3,
						"_granter": null,
						"_user": "138398309776621569",
						"_amount": 0,
						"_source": {
							"_type": 5,
							"_id": "641395660364447749"
						},
						"_betPool": "3e5cac10-0017-11ea-9ecd-f984eb8b6e33",
						"_wager": 0,
						"_payout": 0,
						"_outcome": "Akaecius",
						"_status": 7
					},
					"83171fc0-0017-11ea-9ecd-f984eb8b6e33": {
						"_id": "83171fc0-0017-11ea-9ecd-f984eb8b6e33",
						"_type": 3,
						"_granter": null,
						"_user": "382544116808155137",
						"_amount": 0,
						"_source": {
							"_type": 5,
							"_id": "641395660364447749"
						},
						"_betPool": "3e5cac10-0017-11ea-9ecd-f984eb8b6e33",
						"_wager": 0,
						"_payout": 0,
						"_outcome": "Nanamo",
						"_status": 2
					},
					"86f0d780-0017-11ea-9ecd-f984eb8b6e33": {
						"_id": "86f0d780-0017-11ea-9ecd-f984eb8b6e33",
						"_type": 3,
						"_granter": null,
						"_user": "138398309776621569",
						"_amount": -1500,
						"_source": {
							"_type": 5,
							"_id": "641395660364447749"
						},
						"_betPool": "3e5cac10-0017-11ea-9ecd-f984eb8b6e33",
						"_wager": 1500,
						"_payout": 0,
						"_outcome": "Akaecius",
						"_status": 2
					},
					"8dd78120-0017-11ea-9ecd-f984eb8b6e33": {
						"_id": "8dd78120-0017-11ea-9ecd-f984eb8b6e33",
						"_type": 3,
						"_granter": null,
						"_user": "304354673647812608",
						"_amount": -1500,
						"_source": {
							"_type": 5,
							"_id": "641395660364447749"
						},
						"_betPool": "3e5cac10-0017-11ea-9ecd-f984eb8b6e33",
						"_wager": 1500,
						"_payout": 0,
						"_outcome": "Thugs",
						"_status": 2
					},
					"08420bf0-0019-11ea-a693-714a24e863fc": {
						"_id": "08420bf0-0019-11ea-a693-714a24e863fc",
						"_type": 3,
						"_granter": null,
						"_user": "174037015858249730",
						"_amount": 0,
						"_source": {
							"_type": 5,
							"_id": "641395660364447749"
						},
						"_betPool": "3e5cac10-0017-11ea-9ecd-f984eb8b6e33",
						"_wager": 0,
						"_payout": 0,
						"_outcome": "Akaecius",
						"_status": 7
					},
					"feca2bf0-001f-11ea-a693-714a24e863fc": {
						"_id": "feca2bf0-001f-11ea-a693-714a24e863fc",
						"_type": 3,
						"_granter": null,
						"_user": "174037015858249730",
						"_amount": -1500,
						"_source": {
							"_type": 5,
							"_id": "641395660364447749"
						},
						"_betPool": "3e5cac10-0017-11ea-9ecd-f984eb8b6e33",
						"_wager": 1500,
						"_payout": 0,
						"_outcome": "Akaecius",
						"_status": 2
					}
				},
				"_status": 4,
				"_message": {
					"_id": "714942906104021002",
					"color": "DARK_GREY",
					"author": "Who will reach 80 first?",
					"authorIcon": null,
					"thumbnail": "https:\u002F\u002Fwww.onlygfx.com\u002Fwp-content\u002Fuploads\u002F2018\u002F04\u002Fcompleted-stamp-3.png",
					"closing": "\n\nBets have been paid awarded."
				}
			},
			"1ce0d3a0-8040-11ea-9be4-9969d6450102": {
				"_id": "1ce0d3a0-8040-11ea-9be4-9969d6450102",
				"_name": "Who will get to 80 first? Round 2",
				"_source": {
					"_type": 2,
					"_id": null
				},
				"_owner": {
					"_id": "138398309776621569",
					"_accounts": [],
					"_createdAt": 1561763143883,
					"_currentBalance": -499999996500,
					"_lifetimeBalance": 15010,
					"_bets": {
						"1a5d2850-99f9-11e9-943d-03015f6e23b5": "cb5cc880-99fa-11e9-943d-03015f6e23b5",
						"a60fea20-9d0c-11e9-943d-03015f6e23b5": "f6b116c0-9d0c-11e9-943d-03015f6e23b5",
						"36e08410-9d0d-11e9-943d-03015f6e23b5": "39259210-9d0d-11e9-943d-03015f6e23b5",
						"4638ed60-a840-11e9-bd28-b354ce9f3528": "4adf9210-a840-11e9-bd28-b354ce9f3528",
						"a965aed0-a8d3-11e9-bd28-b354ce9f3528": "ad9e4f70-a8d3-11e9-bd28-b354ce9f3528",
						"3e5cac10-0017-11ea-9ecd-f984eb8b6e33": "86f0d780-0017-11ea-9ecd-f984eb8b6e33"
					},
					"_changes": [
						"41a612a0-99f9-11e9-943d-03015f6e23b5",
						"cb5cc880-99fa-11e9-943d-03015f6e23b5",
						"ac046b90-9d0c-11e9-943d-03015f6e23b5",
						"c0e4cfa0-9d0c-11e9-943d-03015f6e23b5",
						"c3ee6620-9d0c-11e9-943d-03015f6e23b5",
						"c46a73f0-9d0c-11e9-943d-03015f6e23b5",
						"f5805ef0-9d0c-11e9-943d-03015f6e23b5",
						"f6b116c0-9d0c-11e9-943d-03015f6e23b5",
						"39259210-9d0d-11e9-943d-03015f6e23b5",
						"4ddd8690-9d0d-11e9-943d-03015f6e23b5",
						"4adf9210-a840-11e9-bd28-b354ce9f3528",
						"ad9e4f70-a8d3-11e9-bd28-b354ce9f3528",
						"60799510-0017-11ea-9ecd-f984eb8b6e33",
						"7f5d2500-0017-11ea-9ecd-f984eb8b6e33",
						"85035f60-0017-11ea-9ecd-f984eb8b6e33",
						"86f0d780-0017-11ea-9ecd-f984eb8b6e33",
						"830ab820-0021-11ea-a693-714a24e863fc"
					],
					"_grants": [
						"c3ee6620-9d0c-11e9-943d-03015f6e23b5",
						"f5805ef0-9d0c-11e9-943d-03015f6e23b5",
						"85035f60-0017-11ea-9ecd-f984eb8b6e33"
					]
				},
				"_winner": "noremacc",
				"_lastEditedBy": {
					"_id": null,
					"_accounts": [],
					"_createdAt": 1590526375420,
					"_currentBalance": 0,
					"_lifetimeBalance": 0,
					"_bets": {},
					"_changes": [],
					"_grants": []
				},
				"_lastEdited": 1590526375420,
				"_options": [
					"Snailjuice (Randy)",
					"noremacc"
				],
				"_betSize": 5000,
				"_bets": {
					"1fe512f0-8040-11ea-9be4-9969d6450102": {
						"_id": "1fe512f0-8040-11ea-9be4-9969d6450102",
						"_type": 3,
						"_granter": null,
						"_user": "174037015858249730",
						"_amount": -5000,
						"_source": {
							"_type": 5,
							"_id": "700498865648042084"
						},
						"_betPool": "1ce0d3a0-8040-11ea-9be4-9969d6450102",
						"_wager": 5000,
						"_payout": 0,
						"_outcome": "noremacc",
						"_status": 7
					},
					"222c1cc0-8040-11ea-9be4-9969d6450102": {
						"_id": "222c1cc0-8040-11ea-9be4-9969d6450102",
						"_type": 3,
						"_granter": null,
						"_user": "138398309776621569",
						"_amount": 499999996500,
						"_source": {
							"_type": 5,
							"_id": "700498865648042084"
						},
						"_betPool": "1ce0d3a0-8040-11ea-9be4-9969d6450102",
						"_wager": -499999996500,
						"_payout": 0,
						"_outcome": "noremacc",
						"_status": 3
					},
					"2e0f5340-8040-11ea-9be4-9969d6450102": {
						"_id": "2e0f5340-8040-11ea-9be4-9969d6450102",
						"_type": 3,
						"_granter": null,
						"_user": "174037015858249730",
						"_amount": -5000,
						"_source": {
							"_type": 5,
							"_id": "700498865648042084"
						},
						"_betPool": "1ce0d3a0-8040-11ea-9be4-9969d6450102",
						"_wager": 5000,
						"_payout": 0,
						"_outcome": "noremacc",
						"_status": 3
					},
					"76a27070-8044-11ea-9be4-9969d6450102": {
						"_id": "76a27070-8044-11ea-9be4-9969d6450102",
						"_type": 3,
						"_granter": null,
						"_user": "230860022555344896",
						"_amount": 0,
						"_source": {
							"_type": 5,
							"_id": "700498865648042084"
						},
						"_betPool": "1ce0d3a0-8040-11ea-9be4-9969d6450102",
						"_wager": 0,
						"_payout": 0,
						"_outcome": "Snailjuice (Randy)",
						"_status": 2
					}
				},
				"_status": 3,
				"_message": {
					"_id": "714942908482191414",
					"color": "GOLD",
					"author": "Who will get to 80 first? Round 2",
					"authorIcon": null,
					"thumbnail": "https:\u002F\u002Fwww.onlygfx.com\u002Fwp-content\u002Fuploads\u002F2018\u002F04\u002Fcompleted-stamp-3.png",
					"closing": "\n\nWinning bets will be notified shortly."
				}
			},
			"5e10c3a0-9f92-11ea-8919-d395d3434d4b": {
				"_id": "5e10c3a0-9f92-11ea-8919-d395d3434d4b",
				"_name": "5e10c3a0-9f92-11ea-8919-d395d3434d4b",
				"_source": {
					"_type": 2,
					"_id": null
				},
				"_owner": {
					"_id": "260288776360820736",
					"_accounts": [],
					"_createdAt": 1561762972282,
					"_currentBalance": 99999999999,
					"_lifetimeBalance": 100000010009,
					"_bets": {
						"1a5d2850-99f9-11e9-943d-03015f6e23b5": "3bc148a0-99f9-11e9-943d-03015f6e23b5",
						"a60fea20-9d0c-11e9-943d-03015f6e23b5": "e49aa820-9d0c-11e9-943d-03015f6e23b5",
						"36e08410-9d0d-11e9-943d-03015f6e23b5": "3b87ec10-9d0d-11e9-943d-03015f6e23b5",
						"4638ed60-a840-11e9-bd28-b354ce9f3528": "91094d30-a840-11e9-bd28-b354ce9f3528",
						"a965aed0-a8d3-11e9-bd28-b354ce9f3528": "b823a3a0-a8d3-11e9-bd28-b354ce9f3528"
					},
					"_changes": [
						"2637fa60-99f9-11e9-943d-03015f6e23b5",
						"37a9c490-99f9-11e9-943d-03015f6e23b5",
						"3b188580-99f9-11e9-943d-03015f6e23b5",
						"3bc148a0-99f9-11e9-943d-03015f6e23b5",
						"a99dcbd0-9d0c-11e9-943d-03015f6e23b5",
						"c63fd030-9d0c-11e9-943d-03015f6e23b5",
						"e45784a0-9d0c-11e9-943d-03015f6e23b5",
						"e49aa820-9d0c-11e9-943d-03015f6e23b5",
						"3b87ec10-9d0d-11e9-943d-03015f6e23b5",
						"4ddd8691-9d0d-11e9-943d-03015f6e23b5",
						"83fc3cb0-a840-11e9-bd28-b354ce9f3528",
						"8a599210-a840-11e9-bd28-b354ce9f3528",
						"8ab65810-a840-11e9-bd28-b354ce9f3528",
						"8ae99d10-a840-11e9-bd28-b354ce9f3528",
						"8b4fd8f0-a840-11e9-bd28-b354ce9f3528",
						"8bb77460-a840-11e9-bd28-b354ce9f3528",
						"8c165d40-a840-11e9-bd28-b354ce9f3528",
						"8c495420-a840-11e9-bd28-b354ce9f3528",
						"8c780540-a840-11e9-bd28-b354ce9f3528",
						"8ca5a4f0-a840-11e9-bd28-b354ce9f3528",
						"8cd78a60-a840-11e9-bd28-b354ce9f3528",
						"8d42f660-a840-11e9-bd28-b354ce9f3528",
						"8ddf3660-a840-11e9-bd28-b354ce9f3528",
						"8e474700-a840-11e9-bd28-b354ce9f3528",
						"91094d30-a840-11e9-bd28-b354ce9f3528",
						"b823a3a0-a8d3-11e9-bd28-b354ce9f3528",
						"295b6ad0-001d-11ea-a693-714a24e863fc"
					],
					"_grants": [
						"37a9c490-99f9-11e9-943d-03015f6e23b5",
						"3a1cc060-99f9-11e9-943d-03015f6e23b5",
						"3b188580-99f9-11e9-943d-03015f6e23b5",
						"41a612a0-99f9-11e9-943d-03015f6e23b5",
						"f73ee4d0-9a0c-11e9-943d-03015f6e23b5",
						"dd6314d0-9d0b-11e9-943d-03015f6e23b5",
						"c0e4cfa0-9d0c-11e9-943d-03015f6e23b5",
						"c63fd030-9d0c-11e9-943d-03015f6e23b5",
						"c92cb6f0-9d0c-11e9-943d-03015f6e23b5",
						"cc2d25b0-9d0c-11e9-943d-03015f6e23b5",
						"d2279a90-9d0c-11e9-943d-03015f6e23b5",
						"e45784a0-9d0c-11e9-943d-03015f6e23b5",
						"8a599210-a840-11e9-bd28-b354ce9f3528",
						"8ae99d10-a840-11e9-bd28-b354ce9f3528",
						"8bb77460-a840-11e9-bd28-b354ce9f3528",
						"8c495420-a840-11e9-bd28-b354ce9f3528",
						"8ca5a4f0-a840-11e9-bd28-b354ce9f3528",
						"8d42f660-a840-11e9-bd28-b354ce9f3528",
						"8e474700-a840-11e9-bd28-b354ce9f3528",
						"7f5d2500-0017-11ea-9ecd-f984eb8b6e33",
						"295b6ad0-001d-11ea-a693-714a24e863fc",
						"3a6bdb20-001d-11ea-a693-714a24e863fc",
						"830ab820-0021-11ea-a693-714a24e863fc"
					]
				},
				"_winner": null,
				"_lastEdited": 1590526279221,
				"_options": [
					"Waaaah",
					"Uuuuuuu"
				],
				"_betSize": 50000,
				"_bets": {
					"61bdc610-9f92-11ea-8919-d395d3434d4b": {
						"_id": "61bdc610-9f92-11ea-8919-d395d3434d4b",
						"_type": 3,
						"_granter": null,
						"_user": "147077165895254016",
						"_amount": 0,
						"_source": {
							"_type": 5,
							"_id": "714943268378509382"
						},
						"_betPool": "5e10c3a0-9f92-11ea-8919-d395d3434d4b",
						"_wager": 0,
						"_payout": 0,
						"_outcome": "Uuuuuuu",
						"_status": 7
					},
					"628b0120-9f92-11ea-8919-d395d3434d4b": {
						"_id": "628b0120-9f92-11ea-8919-d395d3434d4b",
						"_type": 3,
						"_granter": null,
						"_user": "138398309776621569",
						"_amount": 0,
						"_source": {
							"_type": 5,
							"_id": "714943268378509382"
						},
						"_betPool": "5e10c3a0-9f92-11ea-8919-d395d3434d4b",
						"_wager": 0,
						"_payout": 0,
						"_outcome": "Uuuuuuu",
						"_status": 7
					},
					"6827ecb0-9f92-11ea-8919-d395d3434d4b": {
						"_id": "6827ecb0-9f92-11ea-8919-d395d3434d4b",
						"_type": 3,
						"_granter": null,
						"_user": "260288776360820736",
						"_amount": -50000,
						"_source": {
							"_type": 5,
							"_id": "714943268378509382"
						},
						"_betPool": "5e10c3a0-9f92-11ea-8919-d395d3434d4b",
						"_wager": 50000,
						"_payout": 0,
						"_outcome": "Waaaah",
						"_status": 7
					},
					"6a0efc30-9f92-11ea-8919-d395d3434d4b": {
						"_id": "6a0efc30-9f92-11ea-8919-d395d3434d4b",
						"_type": 3,
						"_granter": null,
						"_user": "177423709114466304",
						"_amount": 0,
						"_source": {
							"_type": 5,
							"_id": "714943268378509382"
						},
						"_betPool": "5e10c3a0-9f92-11ea-8919-d395d3434d4b",
						"_wager": 0,
						"_payout": 0,
						"_outcome": "Uuuuuuu",
						"_status": 7
					},
					"7ab279e0-9f92-11ea-8919-d395d3434d4b": {
						"_id": "7ab279e0-9f92-11ea-8919-d395d3434d4b",
						"_type": 3,
						"_granter": null,
						"_user": "108378183253913600",
						"_amount": -4990,
						"_source": {
							"_type": 5,
							"_id": "714943268378509382"
						},
						"_betPool": "5e10c3a0-9f92-11ea-8919-d395d3434d4b",
						"_wager": 4990,
						"_payout": 0,
						"_outcome": "Uuuuuuu",
						"_status": 7
					}
				},
				"_status": 5,
				"_message": {
					"_id": "714943268378509382",
					"color": "DARK_RED",
					"author": "5e10c3a0-9f92-11ea-8919-d395d3434d4b",
					"authorIcon": null,
					"thumbnail": "https:\u002F\u002Fupload.wikimedia.org\u002Fwikipedia\u002Fcommons\u002Fthumb\u002F3\u002F31\u002FProhibitionSign2.svg\u002F1200px-ProhibitionSign2.svg.png",
					"closing": "\n\n**Users**: Place bets by reacting to 1⃣, 2⃣, ...\n**Admin**: Close bets with ✅ or refund with 🚫."
				}
			},
			"8ebe76f0-9f92-11ea-8919-d395d3434d4b": {
				"_id": "8ebe76f0-9f92-11ea-8919-d395d3434d4b",
				"_name": "This is a name maybe",
				"_source": {
					"_type": 2,
					"_id": null
				},
				"_owner": {
					"_id": "260288776360820736",
					"_accounts": [],
					"_createdAt": 1561762972282,
					"_currentBalance": 99999949999,
					"_lifetimeBalance": 100000010009,
					"_bets": {
						"1a5d2850-99f9-11e9-943d-03015f6e23b5": "3bc148a0-99f9-11e9-943d-03015f6e23b5",
						"a60fea20-9d0c-11e9-943d-03015f6e23b5": "e49aa820-9d0c-11e9-943d-03015f6e23b5",
						"36e08410-9d0d-11e9-943d-03015f6e23b5": "3b87ec10-9d0d-11e9-943d-03015f6e23b5",
						"4638ed60-a840-11e9-bd28-b354ce9f3528": "91094d30-a840-11e9-bd28-b354ce9f3528",
						"a965aed0-a8d3-11e9-bd28-b354ce9f3528": "b823a3a0-a8d3-11e9-bd28-b354ce9f3528",
						"5e10c3a0-9f92-11ea-8919-d395d3434d4b": "6827ecb0-9f92-11ea-8919-d395d3434d4b"
					},
					"_changes": [
						"2637fa60-99f9-11e9-943d-03015f6e23b5",
						"37a9c490-99f9-11e9-943d-03015f6e23b5",
						"3b188580-99f9-11e9-943d-03015f6e23b5",
						"3bc148a0-99f9-11e9-943d-03015f6e23b5",
						"a99dcbd0-9d0c-11e9-943d-03015f6e23b5",
						"c63fd030-9d0c-11e9-943d-03015f6e23b5",
						"e45784a0-9d0c-11e9-943d-03015f6e23b5",
						"e49aa820-9d0c-11e9-943d-03015f6e23b5",
						"3b87ec10-9d0d-11e9-943d-03015f6e23b5",
						"4ddd8691-9d0d-11e9-943d-03015f6e23b5",
						"83fc3cb0-a840-11e9-bd28-b354ce9f3528",
						"8a599210-a840-11e9-bd28-b354ce9f3528",
						"8ab65810-a840-11e9-bd28-b354ce9f3528",
						"8ae99d10-a840-11e9-bd28-b354ce9f3528",
						"8b4fd8f0-a840-11e9-bd28-b354ce9f3528",
						"8bb77460-a840-11e9-bd28-b354ce9f3528",
						"8c165d40-a840-11e9-bd28-b354ce9f3528",
						"8c495420-a840-11e9-bd28-b354ce9f3528",
						"8c780540-a840-11e9-bd28-b354ce9f3528",
						"8ca5a4f0-a840-11e9-bd28-b354ce9f3528",
						"8cd78a60-a840-11e9-bd28-b354ce9f3528",
						"8d42f660-a840-11e9-bd28-b354ce9f3528",
						"8ddf3660-a840-11e9-bd28-b354ce9f3528",
						"8e474700-a840-11e9-bd28-b354ce9f3528",
						"91094d30-a840-11e9-bd28-b354ce9f3528",
						"b823a3a0-a8d3-11e9-bd28-b354ce9f3528",
						"295b6ad0-001d-11ea-a693-714a24e863fc",
						"6827ecb0-9f92-11ea-8919-d395d3434d4b"
					],
					"_grants": [
						"37a9c490-99f9-11e9-943d-03015f6e23b5",
						"3a1cc060-99f9-11e9-943d-03015f6e23b5",
						"3b188580-99f9-11e9-943d-03015f6e23b5",
						"41a612a0-99f9-11e9-943d-03015f6e23b5",
						"f73ee4d0-9a0c-11e9-943d-03015f6e23b5",
						"dd6314d0-9d0b-11e9-943d-03015f6e23b5",
						"c0e4cfa0-9d0c-11e9-943d-03015f6e23b5",
						"c63fd030-9d0c-11e9-943d-03015f6e23b5",
						"c92cb6f0-9d0c-11e9-943d-03015f6e23b5",
						"cc2d25b0-9d0c-11e9-943d-03015f6e23b5",
						"d2279a90-9d0c-11e9-943d-03015f6e23b5",
						"e45784a0-9d0c-11e9-943d-03015f6e23b5",
						"8a599210-a840-11e9-bd28-b354ce9f3528",
						"8ae99d10-a840-11e9-bd28-b354ce9f3528",
						"8bb77460-a840-11e9-bd28-b354ce9f3528",
						"8c495420-a840-11e9-bd28-b354ce9f3528",
						"8ca5a4f0-a840-11e9-bd28-b354ce9f3528",
						"8d42f660-a840-11e9-bd28-b354ce9f3528",
						"8e474700-a840-11e9-bd28-b354ce9f3528",
						"7f5d2500-0017-11ea-9ecd-f984eb8b6e33",
						"295b6ad0-001d-11ea-a693-714a24e863fc",
						"3a6bdb20-001d-11ea-a693-714a24e863fc",
						"830ab820-0021-11ea-a693-714a24e863fc"
					]
				},
				"_winner": null,
				"_lastEdited": 1590526275400,
				"_options": [
					"Option 1",
					"Option 2"
				],
				"_betSize": 500000,
				"_bets": {
					"983c6d40-9f92-11ea-8919-d395d3434d4b": {
						"_id": "983c6d40-9f92-11ea-8919-d395d3434d4b",
						"_type": 3,
						"_granter": null,
						"_user": "108378183253913600",
						"_amount": 0,
						"_source": {
							"_type": 5,
							"_id": "714943610445103138"
						},
						"_betPool": "8ebe76f0-9f92-11ea-8919-d395d3434d4b",
						"_wager": 0,
						"_payout": 0,
						"_outcome": "Option 1",
						"_status": 7
					},
					"9eaa1650-9f92-11ea-8919-d395d3434d4b": {
						"_id": "9eaa1650-9f92-11ea-8919-d395d3434d4b",
						"_type": 3,
						"_granter": null,
						"_user": "260288776360820736",
						"_amount": -500000,
						"_source": {
							"_type": 5,
							"_id": "714943610445103138"
						},
						"_betPool": "8ebe76f0-9f92-11ea-8919-d395d3434d4b",
						"_wager": 500000,
						"_payout": 0,
						"_outcome": "Option 2",
						"_status": 7
					}
				},
				"_status": 5,
				"_message": {
					"_id": "714943610445103138",
					"color": "DARK_RED",
					"author": "This is a name maybe",
					"authorIcon": null,
					"thumbnail": "https:\u002F\u002Fupload.wikimedia.org\u002Fwikipedia\u002Fcommons\u002Fthumb\u002F3\u002F31\u002FProhibitionSign2.svg\u002F1200px-ProhibitionSign2.svg.png",
					"closing": "\n\n**Users**: Place bets by reacting to 1⃣, 2⃣, ...\n**Admin**: Close bets with ✅ or refund with 🚫."
				}
			},
			"cdd08d60-9f92-11ea-8919-d395d3434d4b": {
				"_id": "cdd08d60-9f92-11ea-8919-d395d3434d4b",
				"_name": "Who will finish Ao first",
				"_source": {
					"_type": 2,
					"_id": null
				},
				"_owner": {
					"_id": "287188227667001345",
					"_accounts": [],
					"_createdAt": 1590526345526,
					"_currentBalance": 0,
					"_lifetimeBalance": 0,
					"_bets": {},
					"_changes": [],
					"_grants": []
				},
				"_winner": "Dog",
				"_lastEdited": 1595491147362,
				"_options": [
					"Native",
					"Dog"
				],
				"_betSize": 1000,
				"_bets": {
					"d3212db0-9f92-11ea-8919-d395d3434d4b": {
						"_id": "d3212db0-9f92-11ea-8919-d395d3434d4b",
						"_type": 3,
						"_granter": null,
						"_user": "174037015858249730",
						"_amount": -1000,
						"_source": {
							"_type": 5,
							"_id": "714944054588080209"
						},
						"_betPool": "cdd08d60-9f92-11ea-8919-d395d3434d4b",
						"_wager": 1000,
						"_payout": 1500,
						"_outcome": "Dog",
						"_status": 6
					},
					"e3fd95b0-9f92-11ea-8919-d395d3434d4b": {
						"_id": "e3fd95b0-9f92-11ea-8919-d395d3434d4b",
						"_type": 3,
						"_granter": null,
						"_user": "138398309776621569",
						"_amount": -1000,
						"_source": {
							"_type": 5,
							"_id": "714944054588080209"
						},
						"_betPool": "cdd08d60-9f92-11ea-8919-d395d3434d4b",
						"_wager": 1000,
						"_payout": 0,
						"_outcome": "Native",
						"_status": 2
					},
					"eaa9f570-9f92-11ea-8919-d395d3434d4b": {
						"_id": "eaa9f570-9f92-11ea-8919-d395d3434d4b",
						"_type": 3,
						"_granter": null,
						"_user": "287188227667001345",
						"_amount": 0,
						"_source": {
							"_type": 5,
							"_id": "714944054588080209"
						},
						"_betPool": "cdd08d60-9f92-11ea-8919-d395d3434d4b",
						"_wager": 0,
						"_payout": 0,
						"_outcome": "Dog",
						"_status": 6
					},
					"6bb697c0-ca7e-11ea-b7ca-497f43bcd90a": {
						"_id": "6bb697c0-ca7e-11ea-b7ca-497f43bcd90a",
						"_type": 3,
						"_granter": null,
						"_user": "260288776360820736",
						"_amount": -1000,
						"_source": {
							"_type": 5,
							"_id": "714944054588080209"
						},
						"_betPool": "cdd08d60-9f92-11ea-8919-d395d3434d4b",
						"_wager": 1000,
						"_payout": 1500,
						"_outcome": "Dog",
						"_status": 6
					}
				},
				"_status": 4,
				"_message": {
					"_id": "714944054588080209",
					"color": "DARK_GREY",
					"author": "Who will finish Ao first",
					"authorIcon": null,
					"thumbnail": "https:\u002F\u002Fwww.onlygfx.com\u002Fwp-content\u002Fuploads\u002F2018\u002F04\u002Fcompleted-stamp-3.png",
					"closing": "\n\nBets have been paid awarded."
				}
			},
			"acd8aab0-f097-11ea-bb5d-f3bf67cc597f": {
				"_id": "acd8aab0-f097-11ea-bb5d-f3bf67cc597f",
				"_name": "acd8aab0-f097-11ea-bb5d-f3bf67cc597f",
				"_source": {
					"_type": 2,
					"_id": null
				},
				"_owner": {
					"_id": "138398309776621569",
					"_accounts": [],
					"_createdAt": 1561763143883,
					"_currentBalance": 4000,
					"_lifetimeBalance": 500000011520,
					"_bets": {
						"1a5d2850-99f9-11e9-943d-03015f6e23b5": "cb5cc880-99fa-11e9-943d-03015f6e23b5",
						"a60fea20-9d0c-11e9-943d-03015f6e23b5": "f6b116c0-9d0c-11e9-943d-03015f6e23b5",
						"36e08410-9d0d-11e9-943d-03015f6e23b5": "39259210-9d0d-11e9-943d-03015f6e23b5",
						"4638ed60-a840-11e9-bd28-b354ce9f3528": "4adf9210-a840-11e9-bd28-b354ce9f3528",
						"a965aed0-a8d3-11e9-bd28-b354ce9f3528": "ad9e4f70-a8d3-11e9-bd28-b354ce9f3528",
						"3e5cac10-0017-11ea-9ecd-f984eb8b6e33": "86f0d780-0017-11ea-9ecd-f984eb8b6e33",
						"1ce0d3a0-8040-11ea-9be4-9969d6450102": "222c1cc0-8040-11ea-9be4-9969d6450102",
						"5e10c3a0-9f92-11ea-8919-d395d3434d4b": "628b0120-9f92-11ea-8919-d395d3434d4b",
						"cdd08d60-9f92-11ea-8919-d395d3434d4b": "e3fd95b0-9f92-11ea-8919-d395d3434d4b"
					},
					"_changes": [
						"41a612a0-99f9-11e9-943d-03015f6e23b5",
						"cb5cc880-99fa-11e9-943d-03015f6e23b5",
						"ac046b90-9d0c-11e9-943d-03015f6e23b5",
						"c0e4cfa0-9d0c-11e9-943d-03015f6e23b5",
						"c3ee6620-9d0c-11e9-943d-03015f6e23b5",
						"c46a73f0-9d0c-11e9-943d-03015f6e23b5",
						"f5805ef0-9d0c-11e9-943d-03015f6e23b5",
						"f6b116c0-9d0c-11e9-943d-03015f6e23b5",
						"39259210-9d0d-11e9-943d-03015f6e23b5",
						"4ddd8690-9d0d-11e9-943d-03015f6e23b5",
						"4adf9210-a840-11e9-bd28-b354ce9f3528",
						"ad9e4f70-a8d3-11e9-bd28-b354ce9f3528",
						"60799510-0017-11ea-9ecd-f984eb8b6e33",
						"7f5d2500-0017-11ea-9ecd-f984eb8b6e33",
						"85035f60-0017-11ea-9ecd-f984eb8b6e33",
						"86f0d780-0017-11ea-9ecd-f984eb8b6e33",
						"830ab820-0021-11ea-a693-714a24e863fc",
						"222c1cc0-8040-11ea-9be4-9969d6450102",
						"628b0120-9f92-11ea-8919-d395d3434d4b",
						"a64b3651-9f92-11ea-8919-d395d3434d4b",
						"d06df490-9f92-11ea-8919-d395d3434d4b",
						"e3fd95b0-9f92-11ea-8919-d395d3434d4b",
						"9f3ef2c0-ac08-11ea-882e-ed9f313dc034",
						"81bf0ba0-ca7f-11ea-b7ca-497f43bcd90a"
					],
					"_grants": [
						"c3ee6620-9d0c-11e9-943d-03015f6e23b5",
						"f5805ef0-9d0c-11e9-943d-03015f6e23b5",
						"85035f60-0017-11ea-9ecd-f984eb8b6e33"
					]
				},
				"_winner": null,
				"_lastEdited": 1599434515770,
				"_options": [
					"Will the clash team get mad at each other?"
				],
				"_betSize": 1000,
				"_bets": {},
				"_status": 5,
				"_message": {
					"_id": "752307486546985091",
					"color": "DARK_RED",
					"author": "acd8aab0-f097-11ea-bb5d-f3bf67cc597f",
					"authorIcon": null,
					"thumbnail": "https:\u002F\u002Fupload.wikimedia.org\u002Fwikipedia\u002Fcommons\u002Fthumb\u002F3\u002F31\u002FProhibitionSign2.svg\u002F1200px-ProhibitionSign2.svg.png",
					"closing": "\n\n**Users**: Place bets by reacting to 1⃣, 2⃣, ...\n**Admin**: Close bets with ✅ or refund with 🚫."
				}
			},
			"da969110-f097-11ea-bb5d-f3bf67cc597f": {
				"_id": "da969110-f097-11ea-bb5d-f3bf67cc597f",
				"_name": "Will the clash team get mad at each other?",
				"_source": {
					"_type": 2,
					"_id": null
				},
				"_owner": {
					"_id": "260288776360820736",
					"_accounts": [],
					"_createdAt": 1561762972282,
					"_currentBalance": 100000015489,
					"_lifetimeBalance": 100000023009,
					"_bets": {
						"1a5d2850-99f9-11e9-943d-03015f6e23b5": "3bc148a0-99f9-11e9-943d-03015f6e23b5",
						"a60fea20-9d0c-11e9-943d-03015f6e23b5": "e49aa820-9d0c-11e9-943d-03015f6e23b5",
						"36e08410-9d0d-11e9-943d-03015f6e23b5": "3b87ec10-9d0d-11e9-943d-03015f6e23b5",
						"4638ed60-a840-11e9-bd28-b354ce9f3528": "91094d30-a840-11e9-bd28-b354ce9f3528",
						"5e10c3a0-9f92-11ea-8919-d395d3434d4b": "6827ecb0-9f92-11ea-8919-d395d3434d4b",
						"8ebe76f0-9f92-11ea-8919-d395d3434d4b": "9eaa1650-9f92-11ea-8919-d395d3434d4b",
						"cdd08d60-9f92-11ea-8919-d395d3434d4b": "6bb697c0-ca7e-11ea-b7ca-497f43bcd90a",
						"a965aed0-a8d3-11e9-bd28-b354ce9f3528": "6ce8e0c0-ca7f-11ea-b7ca-497f43bcd90a"
					},
					"_changes": [
						"2637fa60-99f9-11e9-943d-03015f6e23b5",
						"37a9c490-99f9-11e9-943d-03015f6e23b5",
						"3b188580-99f9-11e9-943d-03015f6e23b5",
						"3bc148a0-99f9-11e9-943d-03015f6e23b5",
						"a99dcbd0-9d0c-11e9-943d-03015f6e23b5",
						"c63fd030-9d0c-11e9-943d-03015f6e23b5",
						"e45784a0-9d0c-11e9-943d-03015f6e23b5",
						"e49aa820-9d0c-11e9-943d-03015f6e23b5",
						"3b87ec10-9d0d-11e9-943d-03015f6e23b5",
						"4ddd8691-9d0d-11e9-943d-03015f6e23b5",
						"83fc3cb0-a840-11e9-bd28-b354ce9f3528",
						"8a599210-a840-11e9-bd28-b354ce9f3528",
						"8ab65810-a840-11e9-bd28-b354ce9f3528",
						"8ae99d10-a840-11e9-bd28-b354ce9f3528",
						"8b4fd8f0-a840-11e9-bd28-b354ce9f3528",
						"8bb77460-a840-11e9-bd28-b354ce9f3528",
						"8c165d40-a840-11e9-bd28-b354ce9f3528",
						"8c495420-a840-11e9-bd28-b354ce9f3528",
						"8c780540-a840-11e9-bd28-b354ce9f3528",
						"8ca5a4f0-a840-11e9-bd28-b354ce9f3528",
						"8cd78a60-a840-11e9-bd28-b354ce9f3528",
						"8d42f660-a840-11e9-bd28-b354ce9f3528",
						"8ddf3660-a840-11e9-bd28-b354ce9f3528",
						"8e474700-a840-11e9-bd28-b354ce9f3528",
						"91094d30-a840-11e9-bd28-b354ce9f3528",
						"b823a3a0-a8d3-11e9-bd28-b354ce9f3528",
						"295b6ad0-001d-11ea-a693-714a24e863fc",
						"6827ecb0-9f92-11ea-8919-d395d3434d4b",
						"9eaa1650-9f92-11ea-8919-d395d3434d4b",
						"a4042c81-9f92-11ea-8919-d395d3434d4b",
						"a64b3652-9f92-11ea-8919-d395d3434d4b",
						"d06df492-9f92-11ea-8919-d395d3434d4b",
						"7c95f200-b5ae-11ea-83b1-cf73ad225062",
						"6bb697c0-ca7e-11ea-b7ca-497f43bcd90a",
						"6c5b1fb0-ca7f-11ea-b7ca-497f43bcd90a",
						"6ce8e0c0-ca7f-11ea-b7ca-497f43bcd90a",
						"81bf0ba1-ca7f-11ea-b7ca-497f43bcd90a",
						"62503b32-ccba-11ea-b62a-3b3a5e6c9540"
					],
					"_grants": [
						"37a9c490-99f9-11e9-943d-03015f6e23b5",
						"3a1cc060-99f9-11e9-943d-03015f6e23b5",
						"3b188580-99f9-11e9-943d-03015f6e23b5",
						"41a612a0-99f9-11e9-943d-03015f6e23b5",
						"f73ee4d0-9a0c-11e9-943d-03015f6e23b5",
						"dd6314d0-9d0b-11e9-943d-03015f6e23b5",
						"c0e4cfa0-9d0c-11e9-943d-03015f6e23b5",
						"c63fd030-9d0c-11e9-943d-03015f6e23b5",
						"c92cb6f0-9d0c-11e9-943d-03015f6e23b5",
						"cc2d25b0-9d0c-11e9-943d-03015f6e23b5",
						"d2279a90-9d0c-11e9-943d-03015f6e23b5",
						"e45784a0-9d0c-11e9-943d-03015f6e23b5",
						"8a599210-a840-11e9-bd28-b354ce9f3528",
						"8ae99d10-a840-11e9-bd28-b354ce9f3528",
						"8bb77460-a840-11e9-bd28-b354ce9f3528",
						"8c495420-a840-11e9-bd28-b354ce9f3528",
						"8ca5a4f0-a840-11e9-bd28-b354ce9f3528",
						"8d42f660-a840-11e9-bd28-b354ce9f3528",
						"8e474700-a840-11e9-bd28-b354ce9f3528",
						"7f5d2500-0017-11ea-9ecd-f984eb8b6e33",
						"295b6ad0-001d-11ea-a693-714a24e863fc",
						"3a6bdb20-001d-11ea-a693-714a24e863fc",
						"830ab820-0021-11ea-a693-714a24e863fc",
						"25ac5000-9f93-11ea-8919-d395d3434d4b",
						"4accb500-9f93-11ea-8919-d395d3434d4b",
						"9f3ef2c0-ac08-11ea-882e-ed9f313dc034",
						"7c95f200-b5ae-11ea-83b1-cf73ad225062",
						"6c5b1fb0-ca7f-11ea-b7ca-497f43bcd90a"
					]
				},
				"_winner": "No",
				"_lastEdited": 1599446590530,
				"_options": [
					"Yes",
					"No"
				],
				"_betSize": 1000,
				"_bets": {
					"e73ec540-f097-11ea-bb5d-f3bf67cc597f": {
						"_id": "e73ec540-f097-11ea-bb5d-f3bf67cc597f",
						"_type": 3,
						"_granter": null,
						"_user": "260288776360820736",
						"_amount": -1000,
						"_source": {
							"_type": 5,
							"_id": "752307808191512607"
						},
						"_betPool": "da969110-f097-11ea-bb5d-f3bf67cc597f",
						"_wager": 1000,
						"_payout": 0,
						"_outcome": "Yes",
						"_status": 2
					},
					"06308600-f098-11ea-bb5d-f3bf67cc597f": {
						"_id": "06308600-f098-11ea-bb5d-f3bf67cc597f",
						"_type": 3,
						"_granter": null,
						"_user": "138398309776621569",
						"_amount": -1000,
						"_source": {
							"_type": 5,
							"_id": "752307808191512607"
						},
						"_betPool": "da969110-f097-11ea-bb5d-f3bf67cc597f",
						"_wager": 1000,
						"_payout": 0,
						"_outcome": "Yes",
						"_status": 2
					},
					"11cdd9e0-f098-11ea-bb5d-f3bf67cc597f": {
						"_id": "11cdd9e0-f098-11ea-bb5d-f3bf67cc597f",
						"_type": 3,
						"_granter": null,
						"_user": "173026718423056384",
						"_amount": 0,
						"_source": {
							"_type": 5,
							"_id": "752307808191512607"
						},
						"_betPool": "da969110-f097-11ea-bb5d-f3bf67cc597f",
						"_wager": 0,
						"_payout": 0,
						"_outcome": "No",
						"_status": 3
					}
				},
				"_status": 4,
				"_message": {
					"_id": "752307808191512607",
					"color": "DARK_GREY",
					"author": "Will the clash team get mad at each other?",
					"authorIcon": null,
					"thumbnail": "https:\u002F\u002Fwww.onlygfx.com\u002Fwp-content\u002Fuploads\u002F2018\u002F04\u002Fcompleted-stamp-3.png",
					"closing": "\n\nBets have been paid awarded."
				}
			},
			"f298a780-f097-11ea-bb5d-f3bf67cc597f": {
				"_id": "f298a780-f097-11ea-bb5d-f3bf67cc597f",
				"_name": "Will the clash team get mad at each other?",
				"_source": {
					"_type": 2,
					"_id": null
				},
				"_owner": {
					"_id": "138398309776621569",
					"_accounts": [],
					"_createdAt": 1561763143883,
					"_currentBalance": 4000,
					"_lifetimeBalance": 500000011520,
					"_bets": {
						"1a5d2850-99f9-11e9-943d-03015f6e23b5": "cb5cc880-99fa-11e9-943d-03015f6e23b5",
						"a60fea20-9d0c-11e9-943d-03015f6e23b5": "f6b116c0-9d0c-11e9-943d-03015f6e23b5",
						"36e08410-9d0d-11e9-943d-03015f6e23b5": "39259210-9d0d-11e9-943d-03015f6e23b5",
						"4638ed60-a840-11e9-bd28-b354ce9f3528": "4adf9210-a840-11e9-bd28-b354ce9f3528",
						"a965aed0-a8d3-11e9-bd28-b354ce9f3528": "ad9e4f70-a8d3-11e9-bd28-b354ce9f3528",
						"3e5cac10-0017-11ea-9ecd-f984eb8b6e33": "86f0d780-0017-11ea-9ecd-f984eb8b6e33",
						"1ce0d3a0-8040-11ea-9be4-9969d6450102": "222c1cc0-8040-11ea-9be4-9969d6450102",
						"5e10c3a0-9f92-11ea-8919-d395d3434d4b": "628b0120-9f92-11ea-8919-d395d3434d4b",
						"cdd08d60-9f92-11ea-8919-d395d3434d4b": "e3fd95b0-9f92-11ea-8919-d395d3434d4b"
					},
					"_changes": [
						"41a612a0-99f9-11e9-943d-03015f6e23b5",
						"cb5cc880-99fa-11e9-943d-03015f6e23b5",
						"ac046b90-9d0c-11e9-943d-03015f6e23b5",
						"c0e4cfa0-9d0c-11e9-943d-03015f6e23b5",
						"c3ee6620-9d0c-11e9-943d-03015f6e23b5",
						"c46a73f0-9d0c-11e9-943d-03015f6e23b5",
						"f5805ef0-9d0c-11e9-943d-03015f6e23b5",
						"f6b116c0-9d0c-11e9-943d-03015f6e23b5",
						"39259210-9d0d-11e9-943d-03015f6e23b5",
						"4ddd8690-9d0d-11e9-943d-03015f6e23b5",
						"4adf9210-a840-11e9-bd28-b354ce9f3528",
						"ad9e4f70-a8d3-11e9-bd28-b354ce9f3528",
						"60799510-0017-11ea-9ecd-f984eb8b6e33",
						"7f5d2500-0017-11ea-9ecd-f984eb8b6e33",
						"85035f60-0017-11ea-9ecd-f984eb8b6e33",
						"86f0d780-0017-11ea-9ecd-f984eb8b6e33",
						"830ab820-0021-11ea-a693-714a24e863fc",
						"222c1cc0-8040-11ea-9be4-9969d6450102",
						"628b0120-9f92-11ea-8919-d395d3434d4b",
						"a64b3651-9f92-11ea-8919-d395d3434d4b",
						"d06df490-9f92-11ea-8919-d395d3434d4b",
						"e3fd95b0-9f92-11ea-8919-d395d3434d4b",
						"9f3ef2c0-ac08-11ea-882e-ed9f313dc034",
						"81bf0ba0-ca7f-11ea-b7ca-497f43bcd90a"
					],
					"_grants": [
						"c3ee6620-9d0c-11e9-943d-03015f6e23b5",
						"f5805ef0-9d0c-11e9-943d-03015f6e23b5",
						"85035f60-0017-11ea-9ecd-f984eb8b6e33"
					]
				},
				"_winner": null,
				"_lastEdited": 1599434635194,
				"_options": [
					"Yes",
					"No"
				],
				"_betSize": 1000,
				"_bets": {},
				"_status": 5,
				"_message": {
					"_id": "752307977221963848",
					"color": "DARK_RED",
					"author": "Will the clash team get mad at each other?",
					"authorIcon": null,
					"thumbnail": "https:\u002F\u002Fupload.wikimedia.org\u002Fwikipedia\u002Fcommons\u002Fthumb\u002F3\u002F31\u002FProhibitionSign2.svg\u002F1200px-ProhibitionSign2.svg.png",
					"closing": "\n\n**Users**: Place bets by reacting to 1⃣, 2⃣, ...\n**Admin**: Close bets with ✅ or refund with 🚫."
				}
			},
			"1efb9660-1c09-11eb-bbdc-c5ae2af77fc6": {
				"_id": "1efb9660-1c09-11eb-bbdc-c5ae2af77fc6",
				"_name": "How long until Dog blue screens?",
				"_source": {
					"_type": 2,
					"_id": null
				},
				"_owner": {
					"_id": "260288776360820736",
					"_accounts": [],
					"_createdAt": 1561762972282,
					"_currentBalance": 100000014489,
					"_lifetimeBalance": 100000023009,
					"_bets": {
						"1a5d2850-99f9-11e9-943d-03015f6e23b5": "3bc148a0-99f9-11e9-943d-03015f6e23b5",
						"a60fea20-9d0c-11e9-943d-03015f6e23b5": "e49aa820-9d0c-11e9-943d-03015f6e23b5",
						"36e08410-9d0d-11e9-943d-03015f6e23b5": "3b87ec10-9d0d-11e9-943d-03015f6e23b5",
						"4638ed60-a840-11e9-bd28-b354ce9f3528": "91094d30-a840-11e9-bd28-b354ce9f3528",
						"5e10c3a0-9f92-11ea-8919-d395d3434d4b": "6827ecb0-9f92-11ea-8919-d395d3434d4b",
						"8ebe76f0-9f92-11ea-8919-d395d3434d4b": "9eaa1650-9f92-11ea-8919-d395d3434d4b",
						"cdd08d60-9f92-11ea-8919-d395d3434d4b": "6bb697c0-ca7e-11ea-b7ca-497f43bcd90a",
						"a965aed0-a8d3-11e9-bd28-b354ce9f3528": "6ce8e0c0-ca7f-11ea-b7ca-497f43bcd90a",
						"da969110-f097-11ea-bb5d-f3bf67cc597f": "e73ec540-f097-11ea-bb5d-f3bf67cc597f"
					},
					"_changes": [
						"2637fa60-99f9-11e9-943d-03015f6e23b5",
						"37a9c490-99f9-11e9-943d-03015f6e23b5",
						"3b188580-99f9-11e9-943d-03015f6e23b5",
						"3bc148a0-99f9-11e9-943d-03015f6e23b5",
						"a99dcbd0-9d0c-11e9-943d-03015f6e23b5",
						"c63fd030-9d0c-11e9-943d-03015f6e23b5",
						"e45784a0-9d0c-11e9-943d-03015f6e23b5",
						"e49aa820-9d0c-11e9-943d-03015f6e23b5",
						"3b87ec10-9d0d-11e9-943d-03015f6e23b5",
						"4ddd8691-9d0d-11e9-943d-03015f6e23b5",
						"83fc3cb0-a840-11e9-bd28-b354ce9f3528",
						"8a599210-a840-11e9-bd28-b354ce9f3528",
						"8ab65810-a840-11e9-bd28-b354ce9f3528",
						"8ae99d10-a840-11e9-bd28-b354ce9f3528",
						"8b4fd8f0-a840-11e9-bd28-b354ce9f3528",
						"8bb77460-a840-11e9-bd28-b354ce9f3528",
						"8c165d40-a840-11e9-bd28-b354ce9f3528",
						"8c495420-a840-11e9-bd28-b354ce9f3528",
						"8c780540-a840-11e9-bd28-b354ce9f3528",
						"8ca5a4f0-a840-11e9-bd28-b354ce9f3528",
						"8cd78a60-a840-11e9-bd28-b354ce9f3528",
						"8d42f660-a840-11e9-bd28-b354ce9f3528",
						"8ddf3660-a840-11e9-bd28-b354ce9f3528",
						"8e474700-a840-11e9-bd28-b354ce9f3528",
						"91094d30-a840-11e9-bd28-b354ce9f3528",
						"b823a3a0-a8d3-11e9-bd28-b354ce9f3528",
						"295b6ad0-001d-11ea-a693-714a24e863fc",
						"6827ecb0-9f92-11ea-8919-d395d3434d4b",
						"9eaa1650-9f92-11ea-8919-d395d3434d4b",
						"a4042c81-9f92-11ea-8919-d395d3434d4b",
						"a64b3652-9f92-11ea-8919-d395d3434d4b",
						"d06df492-9f92-11ea-8919-d395d3434d4b",
						"7c95f200-b5ae-11ea-83b1-cf73ad225062",
						"6bb697c0-ca7e-11ea-b7ca-497f43bcd90a",
						"6c5b1fb0-ca7f-11ea-b7ca-497f43bcd90a",
						"6ce8e0c0-ca7f-11ea-b7ca-497f43bcd90a",
						"81bf0ba1-ca7f-11ea-b7ca-497f43bcd90a",
						"62503b32-ccba-11ea-b62a-3b3a5e6c9540",
						"e73ec540-f097-11ea-bb5d-f3bf67cc597f"
					],
					"_grants": [
						"37a9c490-99f9-11e9-943d-03015f6e23b5",
						"3a1cc060-99f9-11e9-943d-03015f6e23b5",
						"3b188580-99f9-11e9-943d-03015f6e23b5",
						"41a612a0-99f9-11e9-943d-03015f6e23b5",
						"f73ee4d0-9a0c-11e9-943d-03015f6e23b5",
						"dd6314d0-9d0b-11e9-943d-03015f6e23b5",
						"c0e4cfa0-9d0c-11e9-943d-03015f6e23b5",
						"c63fd030-9d0c-11e9-943d-03015f6e23b5",
						"c92cb6f0-9d0c-11e9-943d-03015f6e23b5",
						"cc2d25b0-9d0c-11e9-943d-03015f6e23b5",
						"d2279a90-9d0c-11e9-943d-03015f6e23b5",
						"e45784a0-9d0c-11e9-943d-03015f6e23b5",
						"8a599210-a840-11e9-bd28-b354ce9f3528",
						"8ae99d10-a840-11e9-bd28-b354ce9f3528",
						"8bb77460-a840-11e9-bd28-b354ce9f3528",
						"8c495420-a840-11e9-bd28-b354ce9f3528",
						"8ca5a4f0-a840-11e9-bd28-b354ce9f3528",
						"8d42f660-a840-11e9-bd28-b354ce9f3528",
						"8e474700-a840-11e9-bd28-b354ce9f3528",
						"7f5d2500-0017-11ea-9ecd-f984eb8b6e33",
						"295b6ad0-001d-11ea-a693-714a24e863fc",
						"3a6bdb20-001d-11ea-a693-714a24e863fc",
						"830ab820-0021-11ea-a693-714a24e863fc",
						"25ac5000-9f93-11ea-8919-d395d3434d4b",
						"4accb500-9f93-11ea-8919-d395d3434d4b",
						"9f3ef2c0-ac08-11ea-882e-ed9f313dc034",
						"7c95f200-b5ae-11ea-83b1-cf73ad225062",
						"6c5b1fb0-ca7f-11ea-b7ca-497f43bcd90a"
					]
				},
				"_winner": null,
				"_lastEdited": 1604211830004,
				"_options": [
					"\u003C 30 minutes",
					"30 minutes - 1 hour",
					"1 hour - 2 hours",
					"2 hours - 4 hours",
					"4 hours - End of Session",
					"No BSOD"
				],
				"_betSize": 1000,
				"_bets": {
					"22849610-1c09-11eb-bbdc-c5ae2af77fc6": {
						"_id": "22849610-1c09-11eb-bbdc-c5ae2af77fc6",
						"_type": 3,
						"_granter": null,
						"_user": "174037015858249730",
						"_amount": -1000,
						"_source": {
							"_type": 5,
							"_id": "772342102172106764"
						},
						"_betPool": "1efb9660-1c09-11eb-bbdc-c5ae2af77fc6",
						"_wager": 1000,
						"_payout": 0,
						"_outcome": "\u003C 30 minutes",
						"_status": 7
					},
					"235839c0-1c09-11eb-bbdc-c5ae2af77fc6": {
						"_id": "235839c0-1c09-11eb-bbdc-c5ae2af77fc6",
						"_type": 3,
						"_granter": null,
						"_user": "138398309776621569",
						"_amount": -1000,
						"_source": {
							"_type": 5,
							"_id": "772342102172106764"
						},
						"_betPool": "1efb9660-1c09-11eb-bbdc-c5ae2af77fc6",
						"_wager": 1000,
						"_payout": 0,
						"_outcome": "\u003C 30 minutes",
						"_status": 7
					},
					"25cce340-1c09-11eb-bbdc-c5ae2af77fc6": {
						"_id": "25cce340-1c09-11eb-bbdc-c5ae2af77fc6",
						"_type": 3,
						"_granter": null,
						"_user": "138398309776621569",
						"_amount": -1000,
						"_source": {
							"_type": 5,
							"_id": "772342102172106764"
						},
						"_betPool": "1efb9660-1c09-11eb-bbdc-c5ae2af77fc6",
						"_wager": 1000,
						"_payout": 0,
						"_outcome": "30 minutes - 1 hour",
						"_status": 7
					},
					"25f4b690-1c09-11eb-bbdc-c5ae2af77fc6": {
						"_id": "25f4b690-1c09-11eb-bbdc-c5ae2af77fc6",
						"_type": 3,
						"_granter": null,
						"_user": "382544116808155137",
						"_amount": 0,
						"_source": {
							"_type": 5,
							"_id": "772342102172106764"
						},
						"_betPool": "1efb9660-1c09-11eb-bbdc-c5ae2af77fc6",
						"_wager": 0,
						"_payout": 0,
						"_outcome": "1 hour - 2 hours",
						"_status": 7
					},
					"add46280-1c0a-11eb-bbdc-c5ae2af77fc6": {
						"_id": "add46280-1c0a-11eb-bbdc-c5ae2af77fc6",
						"_type": 3,
						"_granter": null,
						"_user": "260288776360820736",
						"_amount": -1000,
						"_source": {
							"_type": 5,
							"_id": "772342102172106764"
						},
						"_betPool": "1efb9660-1c09-11eb-bbdc-c5ae2af77fc6",
						"_wager": 1000,
						"_payout": 0,
						"_outcome": "1 hour - 2 hours",
						"_status": 7
					}
				},
				"_status": 5,
				"_message": {
					"_id": "772342102172106764",
					"color": "DARK_RED",
					"author": "How long until Dog blue screens?",
					"authorIcon": null,
					"thumbnail": "https:\u002F\u002Fupload.wikimedia.org\u002Fwikipedia\u002Fcommons\u002Fthumb\u002F3\u002F31\u002FProhibitionSign2.svg\u002F1200px-ProhibitionSign2.svg.png",
					"closing": "\n\n**Users**: Place bets by reacting to 1⃣, 2⃣, ...\n**Admin**: Close bets with ✅ or refund with 🚫."
				}
			},
			"593f0280-6db2-11eb-ab2e-25fa00710320": {
				"_id": "593f0280-6db2-11eb-ab2e-25fa00710320",
				"_name": "Who will fail us tonight?",
				"_source": {
					"_type": 2,
					"_id": null
				},
				"_owner": {
					"_id": "260288776360820736",
					"_accounts": [],
					"_createdAt": 1561762972282,
					"_currentBalance": 100000014489,
					"_lifetimeBalance": 100000023009,
					"_bets": {
						"1a5d2850-99f9-11e9-943d-03015f6e23b5": "3bc148a0-99f9-11e9-943d-03015f6e23b5",
						"a60fea20-9d0c-11e9-943d-03015f6e23b5": "e49aa820-9d0c-11e9-943d-03015f6e23b5",
						"36e08410-9d0d-11e9-943d-03015f6e23b5": "3b87ec10-9d0d-11e9-943d-03015f6e23b5",
						"4638ed60-a840-11e9-bd28-b354ce9f3528": "91094d30-a840-11e9-bd28-b354ce9f3528",
						"5e10c3a0-9f92-11ea-8919-d395d3434d4b": "6827ecb0-9f92-11ea-8919-d395d3434d4b",
						"8ebe76f0-9f92-11ea-8919-d395d3434d4b": "9eaa1650-9f92-11ea-8919-d395d3434d4b",
						"cdd08d60-9f92-11ea-8919-d395d3434d4b": "6bb697c0-ca7e-11ea-b7ca-497f43bcd90a",
						"a965aed0-a8d3-11e9-bd28-b354ce9f3528": "6ce8e0c0-ca7f-11ea-b7ca-497f43bcd90a",
						"da969110-f097-11ea-bb5d-f3bf67cc597f": "e73ec540-f097-11ea-bb5d-f3bf67cc597f",
						"1efb9660-1c09-11eb-bbdc-c5ae2af77fc6": "add46280-1c0a-11eb-bbdc-c5ae2af77fc6"
					},
					"_changes": [
						"2637fa60-99f9-11e9-943d-03015f6e23b5",
						"37a9c490-99f9-11e9-943d-03015f6e23b5",
						"3b188580-99f9-11e9-943d-03015f6e23b5",
						"3bc148a0-99f9-11e9-943d-03015f6e23b5",
						"a99dcbd0-9d0c-11e9-943d-03015f6e23b5",
						"c63fd030-9d0c-11e9-943d-03015f6e23b5",
						"e45784a0-9d0c-11e9-943d-03015f6e23b5",
						"e49aa820-9d0c-11e9-943d-03015f6e23b5",
						"3b87ec10-9d0d-11e9-943d-03015f6e23b5",
						"4ddd8691-9d0d-11e9-943d-03015f6e23b5",
						"83fc3cb0-a840-11e9-bd28-b354ce9f3528",
						"8a599210-a840-11e9-bd28-b354ce9f3528",
						"8ab65810-a840-11e9-bd28-b354ce9f3528",
						"8ae99d10-a840-11e9-bd28-b354ce9f3528",
						"8b4fd8f0-a840-11e9-bd28-b354ce9f3528",
						"8bb77460-a840-11e9-bd28-b354ce9f3528",
						"8c165d40-a840-11e9-bd28-b354ce9f3528",
						"8c495420-a840-11e9-bd28-b354ce9f3528",
						"8c780540-a840-11e9-bd28-b354ce9f3528",
						"8ca5a4f0-a840-11e9-bd28-b354ce9f3528",
						"8cd78a60-a840-11e9-bd28-b354ce9f3528",
						"8d42f660-a840-11e9-bd28-b354ce9f3528",
						"8ddf3660-a840-11e9-bd28-b354ce9f3528",
						"8e474700-a840-11e9-bd28-b354ce9f3528",
						"91094d30-a840-11e9-bd28-b354ce9f3528",
						"b823a3a0-a8d3-11e9-bd28-b354ce9f3528",
						"295b6ad0-001d-11ea-a693-714a24e863fc",
						"6827ecb0-9f92-11ea-8919-d395d3434d4b",
						"9eaa1650-9f92-11ea-8919-d395d3434d4b",
						"a4042c81-9f92-11ea-8919-d395d3434d4b",
						"a64b3652-9f92-11ea-8919-d395d3434d4b",
						"d06df492-9f92-11ea-8919-d395d3434d4b",
						"7c95f200-b5ae-11ea-83b1-cf73ad225062",
						"6bb697c0-ca7e-11ea-b7ca-497f43bcd90a",
						"6c5b1fb0-ca7f-11ea-b7ca-497f43bcd90a",
						"6ce8e0c0-ca7f-11ea-b7ca-497f43bcd90a",
						"81bf0ba1-ca7f-11ea-b7ca-497f43bcd90a",
						"62503b32-ccba-11ea-b62a-3b3a5e6c9540",
						"e73ec540-f097-11ea-bb5d-f3bf67cc597f",
						"add46280-1c0a-11eb-bbdc-c5ae2af77fc6",
						"ce396253-1c0a-11eb-bbdc-c5ae2af77fc6"
					],
					"_grants": [
						"37a9c490-99f9-11e9-943d-03015f6e23b5",
						"3a1cc060-99f9-11e9-943d-03015f6e23b5",
						"3b188580-99f9-11e9-943d-03015f6e23b5",
						"41a612a0-99f9-11e9-943d-03015f6e23b5",
						"f73ee4d0-9a0c-11e9-943d-03015f6e23b5",
						"dd6314d0-9d0b-11e9-943d-03015f6e23b5",
						"c0e4cfa0-9d0c-11e9-943d-03015f6e23b5",
						"c63fd030-9d0c-11e9-943d-03015f6e23b5",
						"c92cb6f0-9d0c-11e9-943d-03015f6e23b5",
						"cc2d25b0-9d0c-11e9-943d-03015f6e23b5",
						"d2279a90-9d0c-11e9-943d-03015f6e23b5",
						"e45784a0-9d0c-11e9-943d-03015f6e23b5",
						"8a599210-a840-11e9-bd28-b354ce9f3528",
						"8ae99d10-a840-11e9-bd28-b354ce9f3528",
						"8bb77460-a840-11e9-bd28-b354ce9f3528",
						"8c495420-a840-11e9-bd28-b354ce9f3528",
						"8ca5a4f0-a840-11e9-bd28-b354ce9f3528",
						"8d42f660-a840-11e9-bd28-b354ce9f3528",
						"8e474700-a840-11e9-bd28-b354ce9f3528",
						"7f5d2500-0017-11ea-9ecd-f984eb8b6e33",
						"295b6ad0-001d-11ea-a693-714a24e863fc",
						"3a6bdb20-001d-11ea-a693-714a24e863fc",
						"830ab820-0021-11ea-a693-714a24e863fc",
						"25ac5000-9f93-11ea-8919-d395d3434d4b",
						"4accb500-9f93-11ea-8919-d395d3434d4b",
						"9f3ef2c0-ac08-11ea-882e-ed9f313dc034",
						"7c95f200-b5ae-11ea-83b1-cf73ad225062",
						"6c5b1fb0-ca7f-11ea-b7ca-497f43bcd90a"
					]
				},
				"_winner": "No one (only fools would choose this)",
				"_lastEditedBy": null,
				"_lastEdited": 1613200982589,
				"_options": [
					"Haze",
					"Dog",
					"Native",
					"Randy",
					"Huz",
					"Presto",
					"No one (only fools would choose this)"
				],
				"_betSize": 1000,
				"_bets": {
					"62885440-6db2-11eb-ab2e-25fa00710320": {
						"_id": "62885440-6db2-11eb-ab2e-25fa00710320",
						"_type": 3,
						"_granter": null,
						"_user": "287188227667001345",
						"_amount": -1000,
						"_source": {
							"_type": 5,
							"_id": "810001612490932295"
						},
						"_betPool": "593f0280-6db2-11eb-ab2e-25fa00710320",
						"_wager": 1000,
						"_payout": 1666,
						"_outcome": "No one (only fools would choose this)",
						"_status": 6
					},
					"201d8b00-6db4-11eb-ab2e-25fa00710320": {
						"_id": "201d8b00-6db4-11eb-ab2e-25fa00710320",
						"_type": 3,
						"_granter": null,
						"_user": "138398309776621569",
						"_amount": -1000,
						"_source": {
							"_type": 5,
							"_id": "810001612490932295"
						},
						"_betPool": "593f0280-6db2-11eb-ab2e-25fa00710320",
						"_wager": 1000,
						"_payout": 0,
						"_outcome": "Randy",
						"_status": 7
					},
					"70b48800-6dc0-11eb-ab2e-25fa00710320": {
						"_id": "70b48800-6dc0-11eb-ab2e-25fa00710320",
						"_type": 3,
						"_granter": null,
						"_user": "174037015858249730",
						"_amount": -1000,
						"_source": {
							"_type": 5,
							"_id": "810001612490932295"
						},
						"_betPool": "593f0280-6db2-11eb-ab2e-25fa00710320",
						"_wager": 1000,
						"_payout": 0,
						"_outcome": "Presto",
						"_status": 2
					},
					"69690ca0-6dc1-11eb-ab2e-25fa00710320": {
						"_id": "69690ca0-6dc1-11eb-ab2e-25fa00710320",
						"_type": 3,
						"_granter": null,
						"_user": "138398309776621569",
						"_amount": -1000,
						"_source": {
							"_type": 5,
							"_id": "810001612490932295"
						},
						"_betPool": "593f0280-6db2-11eb-ab2e-25fa00710320",
						"_wager": 1000,
						"_payout": 1666,
						"_outcome": "No one (only fools would choose this)",
						"_status": 6
					},
					"f0e00120-6dc1-11eb-ab2e-25fa00710320": {
						"_id": "f0e00120-6dc1-11eb-ab2e-25fa00710320",
						"_type": 3,
						"_granter": null,
						"_user": "310031015932329985",
						"_amount": -1000,
						"_source": {
							"_type": 5,
							"_id": "810001612490932295"
						},
						"_betPool": "593f0280-6db2-11eb-ab2e-25fa00710320",
						"_wager": 1000,
						"_payout": 1666,
						"_outcome": "No one (only fools would choose this)",
						"_status": 6
					}
				},
				"_status": 4,
				"_message": {
					"_id": "810001612490932295",
					"color": "DARK_GREY",
					"author": "Who will fail us tonight?",
					"authorIcon": null,
					"thumbnail": "https:\u002F\u002Fwww.onlygfx.com\u002Fwp-content\u002Fuploads\u002F2018\u002F04\u002Fcompleted-stamp-3.png",
					"closing": "\n\nBets have been paid awarded."
				}
			},
			"e8979330-b352-11eb-92b2-a32ed7e3969a": {
				"_id": "e8979330-b352-11eb-92b2-a32ed7e3969a",
				"_name": "Who will hit 80 first?",
				"_source": {
					"_type": 2,
					"_id": null
				},
				"_owner": {
					"_id": "260288776360820736",
					"_accounts": [],
					"_createdAt": 1561762972282,
					"_currentBalance": 100000014489,
					"_lifetimeBalance": 100000023009,
					"_bets": {
						"1a5d2850-99f9-11e9-943d-03015f6e23b5": "3bc148a0-99f9-11e9-943d-03015f6e23b5",
						"a60fea20-9d0c-11e9-943d-03015f6e23b5": "e49aa820-9d0c-11e9-943d-03015f6e23b5",
						"36e08410-9d0d-11e9-943d-03015f6e23b5": "3b87ec10-9d0d-11e9-943d-03015f6e23b5",
						"4638ed60-a840-11e9-bd28-b354ce9f3528": "91094d30-a840-11e9-bd28-b354ce9f3528",
						"5e10c3a0-9f92-11ea-8919-d395d3434d4b": "6827ecb0-9f92-11ea-8919-d395d3434d4b",
						"8ebe76f0-9f92-11ea-8919-d395d3434d4b": "9eaa1650-9f92-11ea-8919-d395d3434d4b",
						"cdd08d60-9f92-11ea-8919-d395d3434d4b": "6bb697c0-ca7e-11ea-b7ca-497f43bcd90a",
						"a965aed0-a8d3-11e9-bd28-b354ce9f3528": "6ce8e0c0-ca7f-11ea-b7ca-497f43bcd90a",
						"da969110-f097-11ea-bb5d-f3bf67cc597f": "e73ec540-f097-11ea-bb5d-f3bf67cc597f",
						"1efb9660-1c09-11eb-bbdc-c5ae2af77fc6": "add46280-1c0a-11eb-bbdc-c5ae2af77fc6"
					},
					"_changes": [
						"2637fa60-99f9-11e9-943d-03015f6e23b5",
						"37a9c490-99f9-11e9-943d-03015f6e23b5",
						"3b188580-99f9-11e9-943d-03015f6e23b5",
						"3bc148a0-99f9-11e9-943d-03015f6e23b5",
						"a99dcbd0-9d0c-11e9-943d-03015f6e23b5",
						"c63fd030-9d0c-11e9-943d-03015f6e23b5",
						"e45784a0-9d0c-11e9-943d-03015f6e23b5",
						"e49aa820-9d0c-11e9-943d-03015f6e23b5",
						"3b87ec10-9d0d-11e9-943d-03015f6e23b5",
						"4ddd8691-9d0d-11e9-943d-03015f6e23b5",
						"83fc3cb0-a840-11e9-bd28-b354ce9f3528",
						"8a599210-a840-11e9-bd28-b354ce9f3528",
						"8ab65810-a840-11e9-bd28-b354ce9f3528",
						"8ae99d10-a840-11e9-bd28-b354ce9f3528",
						"8b4fd8f0-a840-11e9-bd28-b354ce9f3528",
						"8bb77460-a840-11e9-bd28-b354ce9f3528",
						"8c165d40-a840-11e9-bd28-b354ce9f3528",
						"8c495420-a840-11e9-bd28-b354ce9f3528",
						"8c780540-a840-11e9-bd28-b354ce9f3528",
						"8ca5a4f0-a840-11e9-bd28-b354ce9f3528",
						"8cd78a60-a840-11e9-bd28-b354ce9f3528",
						"8d42f660-a840-11e9-bd28-b354ce9f3528",
						"8ddf3660-a840-11e9-bd28-b354ce9f3528",
						"8e474700-a840-11e9-bd28-b354ce9f3528",
						"91094d30-a840-11e9-bd28-b354ce9f3528",
						"b823a3a0-a8d3-11e9-bd28-b354ce9f3528",
						"295b6ad0-001d-11ea-a693-714a24e863fc",
						"6827ecb0-9f92-11ea-8919-d395d3434d4b",
						"9eaa1650-9f92-11ea-8919-d395d3434d4b",
						"a4042c81-9f92-11ea-8919-d395d3434d4b",
						"a64b3652-9f92-11ea-8919-d395d3434d4b",
						"d06df492-9f92-11ea-8919-d395d3434d4b",
						"7c95f200-b5ae-11ea-83b1-cf73ad225062",
						"6bb697c0-ca7e-11ea-b7ca-497f43bcd90a",
						"6c5b1fb0-ca7f-11ea-b7ca-497f43bcd90a",
						"6ce8e0c0-ca7f-11ea-b7ca-497f43bcd90a",
						"81bf0ba1-ca7f-11ea-b7ca-497f43bcd90a",
						"62503b32-ccba-11ea-b62a-3b3a5e6c9540",
						"e73ec540-f097-11ea-bb5d-f3bf67cc597f",
						"add46280-1c0a-11eb-bbdc-c5ae2af77fc6",
						"ce396253-1c0a-11eb-bbdc-c5ae2af77fc6"
					],
					"_grants": [
						"37a9c490-99f9-11e9-943d-03015f6e23b5",
						"3a1cc060-99f9-11e9-943d-03015f6e23b5",
						"3b188580-99f9-11e9-943d-03015f6e23b5",
						"41a612a0-99f9-11e9-943d-03015f6e23b5",
						"f73ee4d0-9a0c-11e9-943d-03015f6e23b5",
						"dd6314d0-9d0b-11e9-943d-03015f6e23b5",
						"c0e4cfa0-9d0c-11e9-943d-03015f6e23b5",
						"c63fd030-9d0c-11e9-943d-03015f6e23b5",
						"c92cb6f0-9d0c-11e9-943d-03015f6e23b5",
						"cc2d25b0-9d0c-11e9-943d-03015f6e23b5",
						"d2279a90-9d0c-11e9-943d-03015f6e23b5",
						"e45784a0-9d0c-11e9-943d-03015f6e23b5",
						"8a599210-a840-11e9-bd28-b354ce9f3528",
						"8ae99d10-a840-11e9-bd28-b354ce9f3528",
						"8bb77460-a840-11e9-bd28-b354ce9f3528",
						"8c495420-a840-11e9-bd28-b354ce9f3528",
						"8ca5a4f0-a840-11e9-bd28-b354ce9f3528",
						"8d42f660-a840-11e9-bd28-b354ce9f3528",
						"8e474700-a840-11e9-bd28-b354ce9f3528",
						"7f5d2500-0017-11ea-9ecd-f984eb8b6e33",
						"295b6ad0-001d-11ea-a693-714a24e863fc",
						"3a6bdb20-001d-11ea-a693-714a24e863fc",
						"830ab820-0021-11ea-a693-714a24e863fc",
						"25ac5000-9f93-11ea-8919-d395d3434d4b",
						"4accb500-9f93-11ea-8919-d395d3434d4b",
						"9f3ef2c0-ac08-11ea-882e-ed9f313dc034",
						"7c95f200-b5ae-11ea-83b1-cf73ad225062",
						"6c5b1fb0-ca7f-11ea-b7ca-497f43bcd90a"
					]
				},
				"_winner": "Hinder [BANNED]x4300000000",
				"_lastEditedBy": null,
				"_lastEdited": 1622478538494,
				"_options": [
					"Hinder [BANNED]x4300000000",
					"Thugs"
				],
				"_betSize": 1000,
				"_bets": {
					"ee4f59c0-b352-11eb-92b2-a32ed7e3969a": {
						"_id": "ee4f59c0-b352-11eb-92b2-a32ed7e3969a",
						"_type": 3,
						"_granter": null,
						"_user": "260288776360820736",
						"_amount": -1000,
						"_source": {
							"_type": 5,
							"_id": "842111485203054633"
						},
						"_betPool": "e8979330-b352-11eb-92b2-a32ed7e3969a",
						"_wager": 1000,
						"_payout": 0,
						"_outcome": "Hinder [BANNED]x4300000000",
						"_status": 7
					},
					"1bfd88b0-b353-11eb-92b2-a32ed7e3969a": {
						"_id": "1bfd88b0-b353-11eb-92b2-a32ed7e3969a",
						"_type": 3,
						"_granter": null,
						"_user": "138398309776621569",
						"_amount": -1000,
						"_source": {
							"_type": 5,
							"_id": "842111485203054633"
						},
						"_betPool": "e8979330-b352-11eb-92b2-a32ed7e3969a",
						"_wager": 1000,
						"_payout": 1250,
						"_outcome": "Hinder [BANNED]x4300000000",
						"_status": 6
					},
					"91b4e120-b353-11eb-92b2-a32ed7e3969a": {
						"_id": "91b4e120-b353-11eb-92b2-a32ed7e3969a",
						"_type": 3,
						"_granter": null,
						"_user": "177423709114466304",
						"_amount": 0,
						"_source": {
							"_type": 5,
							"_id": "842111485203054633"
						},
						"_betPool": "e8979330-b352-11eb-92b2-a32ed7e3969a",
						"_wager": 0,
						"_payout": 0,
						"_outcome": "Hinder [BANNED]x4300000000",
						"_status": 6
					},
					"c7093920-b353-11eb-92b2-a32ed7e3969a": {
						"_id": "c7093920-b353-11eb-92b2-a32ed7e3969a",
						"_type": 3,
						"_granter": null,
						"_user": "211283870736187394",
						"_amount": 0,
						"_source": {
							"_type": 5,
							"_id": "842111485203054633"
						},
						"_betPool": "e8979330-b352-11eb-92b2-a32ed7e3969a",
						"_wager": 0,
						"_payout": 0,
						"_outcome": "Hinder [BANNED]x4300000000",
						"_status": 7
					},
					"d9187d00-b36d-11eb-92b2-a32ed7e3969a": {
						"_id": "d9187d00-b36d-11eb-92b2-a32ed7e3969a",
						"_type": 3,
						"_granter": null,
						"_user": "174037015858249730",
						"_amount": -1000,
						"_source": {
							"_type": 5,
							"_id": "842111485203054633"
						},
						"_betPool": "e8979330-b352-11eb-92b2-a32ed7e3969a",
						"_wager": 1000,
						"_payout": 1250,
						"_outcome": "Hinder [BANNED]x4300000000",
						"_status": 6
					},
					"328d9bb0-b41b-11eb-92b2-a32ed7e3969a": {
						"_id": "328d9bb0-b41b-11eb-92b2-a32ed7e3969a",
						"_type": 3,
						"_granter": null,
						"_user": "211283870736187394",
						"_amount": -1000,
						"_source": {
							"_type": 5,
							"_id": "842111485203054633"
						},
						"_betPool": "e8979330-b352-11eb-92b2-a32ed7e3969a",
						"_wager": 1000,
						"_payout": 1250,
						"_outcome": "Hinder [BANNED]x4300000000",
						"_status": 6
					},
					"b0ad5bc0-b41b-11eb-92b2-a32ed7e3969a": {
						"_id": "b0ad5bc0-b41b-11eb-92b2-a32ed7e3969a",
						"_type": 3,
						"_granter": null,
						"_user": "260288776360820736",
						"_amount": -1000,
						"_source": {
							"_type": 5,
							"_id": "842111485203054633"
						},
						"_betPool": "e8979330-b352-11eb-92b2-a32ed7e3969a",
						"_wager": 1000,
						"_payout": 1250,
						"_outcome": "Hinder [BANNED]x4300000000",
						"_status": 6
					}
				},
				"_status": 4,
				"_message": {
					"_id": "842111485203054633",
					"color": "DARK_GREY",
					"author": "Who will hit 80 first?",
					"authorIcon": null,
					"thumbnail": "https:\u002F\u002Fwww.onlygfx.com\u002Fwp-content\u002Fuploads\u002F2018\u002F04\u002Fcompleted-stamp-3.png",
					"closing": "\n\nBets have been paid awarded."
				}
			}
		},
		"authorizedRoles": [
			"319305211283767297",
			"319297882375061508",
			"319373030339903488"
		],
		"4eb0aed0-6dcc-11eb-ab2e-25fa00710320": {
			"_id": "4eb0aed0-6dcc-11eb-ab2e-25fa00710320",
			"_type": 2,
			"_granter": {
				"_id": "260288776360820736",
				"_accounts": [],
				"_createdAt": 1561762972282,
				"_currentBalance": 100000014489,
				"_lifetimeBalance": 100000023009,
				"_bets": {
					"1a5d2850-99f9-11e9-943d-03015f6e23b5": "3bc148a0-99f9-11e9-943d-03015f6e23b5",
					"a60fea20-9d0c-11e9-943d-03015f6e23b5": "e49aa820-9d0c-11e9-943d-03015f6e23b5",
					"36e08410-9d0d-11e9-943d-03015f6e23b5": "3b87ec10-9d0d-11e9-943d-03015f6e23b5",
					"4638ed60-a840-11e9-bd28-b354ce9f3528": "91094d30-a840-11e9-bd28-b354ce9f3528",
					"5e10c3a0-9f92-11ea-8919-d395d3434d4b": "6827ecb0-9f92-11ea-8919-d395d3434d4b",
					"8ebe76f0-9f92-11ea-8919-d395d3434d4b": "9eaa1650-9f92-11ea-8919-d395d3434d4b",
					"cdd08d60-9f92-11ea-8919-d395d3434d4b": "6bb697c0-ca7e-11ea-b7ca-497f43bcd90a",
					"a965aed0-a8d3-11e9-bd28-b354ce9f3528": "6ce8e0c0-ca7f-11ea-b7ca-497f43bcd90a",
					"da969110-f097-11ea-bb5d-f3bf67cc597f": "e73ec540-f097-11ea-bb5d-f3bf67cc597f",
					"1efb9660-1c09-11eb-bbdc-c5ae2af77fc6": "add46280-1c0a-11eb-bbdc-c5ae2af77fc6"
				},
				"_changes": [
					"2637fa60-99f9-11e9-943d-03015f6e23b5",
					"37a9c490-99f9-11e9-943d-03015f6e23b5",
					"3b188580-99f9-11e9-943d-03015f6e23b5",
					"3bc148a0-99f9-11e9-943d-03015f6e23b5",
					"a99dcbd0-9d0c-11e9-943d-03015f6e23b5",
					"c63fd030-9d0c-11e9-943d-03015f6e23b5",
					"e45784a0-9d0c-11e9-943d-03015f6e23b5",
					"e49aa820-9d0c-11e9-943d-03015f6e23b5",
					"3b87ec10-9d0d-11e9-943d-03015f6e23b5",
					"4ddd8691-9d0d-11e9-943d-03015f6e23b5",
					"83fc3cb0-a840-11e9-bd28-b354ce9f3528",
					"8a599210-a840-11e9-bd28-b354ce9f3528",
					"8ab65810-a840-11e9-bd28-b354ce9f3528",
					"8ae99d10-a840-11e9-bd28-b354ce9f3528",
					"8b4fd8f0-a840-11e9-bd28-b354ce9f3528",
					"8bb77460-a840-11e9-bd28-b354ce9f3528",
					"8c165d40-a840-11e9-bd28-b354ce9f3528",
					"8c495420-a840-11e9-bd28-b354ce9f3528",
					"8c780540-a840-11e9-bd28-b354ce9f3528",
					"8ca5a4f0-a840-11e9-bd28-b354ce9f3528",
					"8cd78a60-a840-11e9-bd28-b354ce9f3528",
					"8d42f660-a840-11e9-bd28-b354ce9f3528",
					"8ddf3660-a840-11e9-bd28-b354ce9f3528",
					"8e474700-a840-11e9-bd28-b354ce9f3528",
					"91094d30-a840-11e9-bd28-b354ce9f3528",
					"b823a3a0-a8d3-11e9-bd28-b354ce9f3528",
					"295b6ad0-001d-11ea-a693-714a24e863fc",
					"6827ecb0-9f92-11ea-8919-d395d3434d4b",
					"9eaa1650-9f92-11ea-8919-d395d3434d4b",
					"a4042c81-9f92-11ea-8919-d395d3434d4b",
					"a64b3652-9f92-11ea-8919-d395d3434d4b",
					"d06df492-9f92-11ea-8919-d395d3434d4b",
					"7c95f200-b5ae-11ea-83b1-cf73ad225062",
					"6bb697c0-ca7e-11ea-b7ca-497f43bcd90a",
					"6c5b1fb0-ca7f-11ea-b7ca-497f43bcd90a",
					"6ce8e0c0-ca7f-11ea-b7ca-497f43bcd90a",
					"81bf0ba1-ca7f-11ea-b7ca-497f43bcd90a",
					"62503b32-ccba-11ea-b62a-3b3a5e6c9540",
					"e73ec540-f097-11ea-bb5d-f3bf67cc597f",
					"add46280-1c0a-11eb-bbdc-c5ae2af77fc6",
					"ce396253-1c0a-11eb-bbdc-c5ae2af77fc6"
				],
				"_grants": [
					"37a9c490-99f9-11e9-943d-03015f6e23b5",
					"3a1cc060-99f9-11e9-943d-03015f6e23b5",
					"3b188580-99f9-11e9-943d-03015f6e23b5",
					"41a612a0-99f9-11e9-943d-03015f6e23b5",
					"f73ee4d0-9a0c-11e9-943d-03015f6e23b5",
					"dd6314d0-9d0b-11e9-943d-03015f6e23b5",
					"c0e4cfa0-9d0c-11e9-943d-03015f6e23b5",
					"c63fd030-9d0c-11e9-943d-03015f6e23b5",
					"c92cb6f0-9d0c-11e9-943d-03015f6e23b5",
					"cc2d25b0-9d0c-11e9-943d-03015f6e23b5",
					"d2279a90-9d0c-11e9-943d-03015f6e23b5",
					"e45784a0-9d0c-11e9-943d-03015f6e23b5",
					"8a599210-a840-11e9-bd28-b354ce9f3528",
					"8ae99d10-a840-11e9-bd28-b354ce9f3528",
					"8bb77460-a840-11e9-bd28-b354ce9f3528",
					"8c495420-a840-11e9-bd28-b354ce9f3528",
					"8ca5a4f0-a840-11e9-bd28-b354ce9f3528",
					"8d42f660-a840-11e9-bd28-b354ce9f3528",
					"8e474700-a840-11e9-bd28-b354ce9f3528",
					"7f5d2500-0017-11ea-9ecd-f984eb8b6e33",
					"295b6ad0-001d-11ea-a693-714a24e863fc",
					"3a6bdb20-001d-11ea-a693-714a24e863fc",
					"830ab820-0021-11ea-a693-714a24e863fc",
					"25ac5000-9f93-11ea-8919-d395d3434d4b",
					"4accb500-9f93-11ea-8919-d395d3434d4b",
					"9f3ef2c0-ac08-11ea-882e-ed9f313dc034",
					"7c95f200-b5ae-11ea-83b1-cf73ad225062",
					"6c5b1fb0-ca7f-11ea-b7ca-497f43bcd90a"
				]
			},
			"_user": "287188227667001345",
			"_amount": 1666,
			"_source": {
				"_type": 3,
				"_id": "62885440-6db2-11eb-ab2e-25fa00710320"
			}
		},
		"4eb0aed1-6dcc-11eb-ab2e-25fa00710320": {
			"_id": "4eb0aed1-6dcc-11eb-ab2e-25fa00710320",
			"_type": 2,
			"_granter": {
				"_id": "260288776360820736",
				"_accounts": [],
				"_createdAt": 1561762972282,
				"_currentBalance": 100000014489,
				"_lifetimeBalance": 100000023009,
				"_bets": {
					"1a5d2850-99f9-11e9-943d-03015f6e23b5": "3bc148a0-99f9-11e9-943d-03015f6e23b5",
					"a60fea20-9d0c-11e9-943d-03015f6e23b5": "e49aa820-9d0c-11e9-943d-03015f6e23b5",
					"36e08410-9d0d-11e9-943d-03015f6e23b5": "3b87ec10-9d0d-11e9-943d-03015f6e23b5",
					"4638ed60-a840-11e9-bd28-b354ce9f3528": "91094d30-a840-11e9-bd28-b354ce9f3528",
					"5e10c3a0-9f92-11ea-8919-d395d3434d4b": "6827ecb0-9f92-11ea-8919-d395d3434d4b",
					"8ebe76f0-9f92-11ea-8919-d395d3434d4b": "9eaa1650-9f92-11ea-8919-d395d3434d4b",
					"cdd08d60-9f92-11ea-8919-d395d3434d4b": "6bb697c0-ca7e-11ea-b7ca-497f43bcd90a",
					"a965aed0-a8d3-11e9-bd28-b354ce9f3528": "6ce8e0c0-ca7f-11ea-b7ca-497f43bcd90a",
					"da969110-f097-11ea-bb5d-f3bf67cc597f": "e73ec540-f097-11ea-bb5d-f3bf67cc597f",
					"1efb9660-1c09-11eb-bbdc-c5ae2af77fc6": "add46280-1c0a-11eb-bbdc-c5ae2af77fc6"
				},
				"_changes": [
					"2637fa60-99f9-11e9-943d-03015f6e23b5",
					"37a9c490-99f9-11e9-943d-03015f6e23b5",
					"3b188580-99f9-11e9-943d-03015f6e23b5",
					"3bc148a0-99f9-11e9-943d-03015f6e23b5",
					"a99dcbd0-9d0c-11e9-943d-03015f6e23b5",
					"c63fd030-9d0c-11e9-943d-03015f6e23b5",
					"e45784a0-9d0c-11e9-943d-03015f6e23b5",
					"e49aa820-9d0c-11e9-943d-03015f6e23b5",
					"3b87ec10-9d0d-11e9-943d-03015f6e23b5",
					"4ddd8691-9d0d-11e9-943d-03015f6e23b5",
					"83fc3cb0-a840-11e9-bd28-b354ce9f3528",
					"8a599210-a840-11e9-bd28-b354ce9f3528",
					"8ab65810-a840-11e9-bd28-b354ce9f3528",
					"8ae99d10-a840-11e9-bd28-b354ce9f3528",
					"8b4fd8f0-a840-11e9-bd28-b354ce9f3528",
					"8bb77460-a840-11e9-bd28-b354ce9f3528",
					"8c165d40-a840-11e9-bd28-b354ce9f3528",
					"8c495420-a840-11e9-bd28-b354ce9f3528",
					"8c780540-a840-11e9-bd28-b354ce9f3528",
					"8ca5a4f0-a840-11e9-bd28-b354ce9f3528",
					"8cd78a60-a840-11e9-bd28-b354ce9f3528",
					"8d42f660-a840-11e9-bd28-b354ce9f3528",
					"8ddf3660-a840-11e9-bd28-b354ce9f3528",
					"8e474700-a840-11e9-bd28-b354ce9f3528",
					"91094d30-a840-11e9-bd28-b354ce9f3528",
					"b823a3a0-a8d3-11e9-bd28-b354ce9f3528",
					"295b6ad0-001d-11ea-a693-714a24e863fc",
					"6827ecb0-9f92-11ea-8919-d395d3434d4b",
					"9eaa1650-9f92-11ea-8919-d395d3434d4b",
					"a4042c81-9f92-11ea-8919-d395d3434d4b",
					"a64b3652-9f92-11ea-8919-d395d3434d4b",
					"d06df492-9f92-11ea-8919-d395d3434d4b",
					"7c95f200-b5ae-11ea-83b1-cf73ad225062",
					"6bb697c0-ca7e-11ea-b7ca-497f43bcd90a",
					"6c5b1fb0-ca7f-11ea-b7ca-497f43bcd90a",
					"6ce8e0c0-ca7f-11ea-b7ca-497f43bcd90a",
					"81bf0ba1-ca7f-11ea-b7ca-497f43bcd90a",
					"62503b32-ccba-11ea-b62a-3b3a5e6c9540",
					"e73ec540-f097-11ea-bb5d-f3bf67cc597f",
					"add46280-1c0a-11eb-bbdc-c5ae2af77fc6",
					"ce396253-1c0a-11eb-bbdc-c5ae2af77fc6"
				],
				"_grants": [
					"37a9c490-99f9-11e9-943d-03015f6e23b5",
					"3a1cc060-99f9-11e9-943d-03015f6e23b5",
					"3b188580-99f9-11e9-943d-03015f6e23b5",
					"41a612a0-99f9-11e9-943d-03015f6e23b5",
					"f73ee4d0-9a0c-11e9-943d-03015f6e23b5",
					"dd6314d0-9d0b-11e9-943d-03015f6e23b5",
					"c0e4cfa0-9d0c-11e9-943d-03015f6e23b5",
					"c63fd030-9d0c-11e9-943d-03015f6e23b5",
					"c92cb6f0-9d0c-11e9-943d-03015f6e23b5",
					"cc2d25b0-9d0c-11e9-943d-03015f6e23b5",
					"d2279a90-9d0c-11e9-943d-03015f6e23b5",
					"e45784a0-9d0c-11e9-943d-03015f6e23b5",
					"8a599210-a840-11e9-bd28-b354ce9f3528",
					"8ae99d10-a840-11e9-bd28-b354ce9f3528",
					"8bb77460-a840-11e9-bd28-b354ce9f3528",
					"8c495420-a840-11e9-bd28-b354ce9f3528",
					"8ca5a4f0-a840-11e9-bd28-b354ce9f3528",
					"8d42f660-a840-11e9-bd28-b354ce9f3528",
					"8e474700-a840-11e9-bd28-b354ce9f3528",
					"7f5d2500-0017-11ea-9ecd-f984eb8b6e33",
					"295b6ad0-001d-11ea-a693-714a24e863fc",
					"3a6bdb20-001d-11ea-a693-714a24e863fc",
					"830ab820-0021-11ea-a693-714a24e863fc",
					"25ac5000-9f93-11ea-8919-d395d3434d4b",
					"4accb500-9f93-11ea-8919-d395d3434d4b",
					"9f3ef2c0-ac08-11ea-882e-ed9f313dc034",
					"7c95f200-b5ae-11ea-83b1-cf73ad225062",
					"6c5b1fb0-ca7f-11ea-b7ca-497f43bcd90a"
				]
			},
			"_user": "138398309776621569",
			"_amount": 1666,
			"_source": {
				"_type": 3,
				"_id": "69690ca0-6dc1-11eb-ab2e-25fa00710320"
			}
		},
		"4eb0aed2-6dcc-11eb-ab2e-25fa00710320": {
			"_id": "4eb0aed2-6dcc-11eb-ab2e-25fa00710320",
			"_type": 2,
			"_granter": {
				"_id": "260288776360820736",
				"_accounts": [],
				"_createdAt": 1561762972282,
				"_currentBalance": 100000014489,
				"_lifetimeBalance": 100000023009,
				"_bets": {
					"1a5d2850-99f9-11e9-943d-03015f6e23b5": "3bc148a0-99f9-11e9-943d-03015f6e23b5",
					"a60fea20-9d0c-11e9-943d-03015f6e23b5": "e49aa820-9d0c-11e9-943d-03015f6e23b5",
					"36e08410-9d0d-11e9-943d-03015f6e23b5": "3b87ec10-9d0d-11e9-943d-03015f6e23b5",
					"4638ed60-a840-11e9-bd28-b354ce9f3528": "91094d30-a840-11e9-bd28-b354ce9f3528",
					"5e10c3a0-9f92-11ea-8919-d395d3434d4b": "6827ecb0-9f92-11ea-8919-d395d3434d4b",
					"8ebe76f0-9f92-11ea-8919-d395d3434d4b": "9eaa1650-9f92-11ea-8919-d395d3434d4b",
					"cdd08d60-9f92-11ea-8919-d395d3434d4b": "6bb697c0-ca7e-11ea-b7ca-497f43bcd90a",
					"a965aed0-a8d3-11e9-bd28-b354ce9f3528": "6ce8e0c0-ca7f-11ea-b7ca-497f43bcd90a",
					"da969110-f097-11ea-bb5d-f3bf67cc597f": "e73ec540-f097-11ea-bb5d-f3bf67cc597f",
					"1efb9660-1c09-11eb-bbdc-c5ae2af77fc6": "add46280-1c0a-11eb-bbdc-c5ae2af77fc6"
				},
				"_changes": [
					"2637fa60-99f9-11e9-943d-03015f6e23b5",
					"37a9c490-99f9-11e9-943d-03015f6e23b5",
					"3b188580-99f9-11e9-943d-03015f6e23b5",
					"3bc148a0-99f9-11e9-943d-03015f6e23b5",
					"a99dcbd0-9d0c-11e9-943d-03015f6e23b5",
					"c63fd030-9d0c-11e9-943d-03015f6e23b5",
					"e45784a0-9d0c-11e9-943d-03015f6e23b5",
					"e49aa820-9d0c-11e9-943d-03015f6e23b5",
					"3b87ec10-9d0d-11e9-943d-03015f6e23b5",
					"4ddd8691-9d0d-11e9-943d-03015f6e23b5",
					"83fc3cb0-a840-11e9-bd28-b354ce9f3528",
					"8a599210-a840-11e9-bd28-b354ce9f3528",
					"8ab65810-a840-11e9-bd28-b354ce9f3528",
					"8ae99d10-a840-11e9-bd28-b354ce9f3528",
					"8b4fd8f0-a840-11e9-bd28-b354ce9f3528",
					"8bb77460-a840-11e9-bd28-b354ce9f3528",
					"8c165d40-a840-11e9-bd28-b354ce9f3528",
					"8c495420-a840-11e9-bd28-b354ce9f3528",
					"8c780540-a840-11e9-bd28-b354ce9f3528",
					"8ca5a4f0-a840-11e9-bd28-b354ce9f3528",
					"8cd78a60-a840-11e9-bd28-b354ce9f3528",
					"8d42f660-a840-11e9-bd28-b354ce9f3528",
					"8ddf3660-a840-11e9-bd28-b354ce9f3528",
					"8e474700-a840-11e9-bd28-b354ce9f3528",
					"91094d30-a840-11e9-bd28-b354ce9f3528",
					"b823a3a0-a8d3-11e9-bd28-b354ce9f3528",
					"295b6ad0-001d-11ea-a693-714a24e863fc",
					"6827ecb0-9f92-11ea-8919-d395d3434d4b",
					"9eaa1650-9f92-11ea-8919-d395d3434d4b",
					"a4042c81-9f92-11ea-8919-d395d3434d4b",
					"a64b3652-9f92-11ea-8919-d395d3434d4b",
					"d06df492-9f92-11ea-8919-d395d3434d4b",
					"7c95f200-b5ae-11ea-83b1-cf73ad225062",
					"6bb697c0-ca7e-11ea-b7ca-497f43bcd90a",
					"6c5b1fb0-ca7f-11ea-b7ca-497f43bcd90a",
					"6ce8e0c0-ca7f-11ea-b7ca-497f43bcd90a",
					"81bf0ba1-ca7f-11ea-b7ca-497f43bcd90a",
					"62503b32-ccba-11ea-b62a-3b3a5e6c9540",
					"e73ec540-f097-11ea-bb5d-f3bf67cc597f",
					"add46280-1c0a-11eb-bbdc-c5ae2af77fc6",
					"ce396253-1c0a-11eb-bbdc-c5ae2af77fc6"
				],
				"_grants": [
					"37a9c490-99f9-11e9-943d-03015f6e23b5",
					"3a1cc060-99f9-11e9-943d-03015f6e23b5",
					"3b188580-99f9-11e9-943d-03015f6e23b5",
					"41a612a0-99f9-11e9-943d-03015f6e23b5",
					"f73ee4d0-9a0c-11e9-943d-03015f6e23b5",
					"dd6314d0-9d0b-11e9-943d-03015f6e23b5",
					"c0e4cfa0-9d0c-11e9-943d-03015f6e23b5",
					"c63fd030-9d0c-11e9-943d-03015f6e23b5",
					"c92cb6f0-9d0c-11e9-943d-03015f6e23b5",
					"cc2d25b0-9d0c-11e9-943d-03015f6e23b5",
					"d2279a90-9d0c-11e9-943d-03015f6e23b5",
					"e45784a0-9d0c-11e9-943d-03015f6e23b5",
					"8a599210-a840-11e9-bd28-b354ce9f3528",
					"8ae99d10-a840-11e9-bd28-b354ce9f3528",
					"8bb77460-a840-11e9-bd28-b354ce9f3528",
					"8c495420-a840-11e9-bd28-b354ce9f3528",
					"8ca5a4f0-a840-11e9-bd28-b354ce9f3528",
					"8d42f660-a840-11e9-bd28-b354ce9f3528",
					"8e474700-a840-11e9-bd28-b354ce9f3528",
					"7f5d2500-0017-11ea-9ecd-f984eb8b6e33",
					"295b6ad0-001d-11ea-a693-714a24e863fc",
					"3a6bdb20-001d-11ea-a693-714a24e863fc",
					"830ab820-0021-11ea-a693-714a24e863fc",
					"25ac5000-9f93-11ea-8919-d395d3434d4b",
					"4accb500-9f93-11ea-8919-d395d3434d4b",
					"9f3ef2c0-ac08-11ea-882e-ed9f313dc034",
					"7c95f200-b5ae-11ea-83b1-cf73ad225062",
					"6c5b1fb0-ca7f-11ea-b7ca-497f43bcd90a"
				]
			},
			"_user": "310031015932329985",
			"_amount": 1666,
			"_source": {
				"_type": 3,
				"_id": "f0e00120-6dc1-11eb-ab2e-25fa00710320"
			}
		},
		"4ceeb000-c22d-11eb-a61a-2b20bf2044ac": {
			"_id": "4ceeb000-c22d-11eb-a61a-2b20bf2044ac",
			"_type": 2,
			"_granter": {
				"_id": "260288776360820736",
				"_accounts": [],
				"_createdAt": 1561762972282,
				"_currentBalance": 100000014489,
				"_lifetimeBalance": 100000023009,
				"_bets": {
					"1a5d2850-99f9-11e9-943d-03015f6e23b5": "3bc148a0-99f9-11e9-943d-03015f6e23b5",
					"a60fea20-9d0c-11e9-943d-03015f6e23b5": "e49aa820-9d0c-11e9-943d-03015f6e23b5",
					"36e08410-9d0d-11e9-943d-03015f6e23b5": "3b87ec10-9d0d-11e9-943d-03015f6e23b5",
					"4638ed60-a840-11e9-bd28-b354ce9f3528": "91094d30-a840-11e9-bd28-b354ce9f3528",
					"5e10c3a0-9f92-11ea-8919-d395d3434d4b": "6827ecb0-9f92-11ea-8919-d395d3434d4b",
					"8ebe76f0-9f92-11ea-8919-d395d3434d4b": "9eaa1650-9f92-11ea-8919-d395d3434d4b",
					"cdd08d60-9f92-11ea-8919-d395d3434d4b": "6bb697c0-ca7e-11ea-b7ca-497f43bcd90a",
					"a965aed0-a8d3-11e9-bd28-b354ce9f3528": "6ce8e0c0-ca7f-11ea-b7ca-497f43bcd90a",
					"da969110-f097-11ea-bb5d-f3bf67cc597f": "e73ec540-f097-11ea-bb5d-f3bf67cc597f",
					"1efb9660-1c09-11eb-bbdc-c5ae2af77fc6": "add46280-1c0a-11eb-bbdc-c5ae2af77fc6"
				},
				"_changes": [
					"2637fa60-99f9-11e9-943d-03015f6e23b5",
					"37a9c490-99f9-11e9-943d-03015f6e23b5",
					"3b188580-99f9-11e9-943d-03015f6e23b5",
					"3bc148a0-99f9-11e9-943d-03015f6e23b5",
					"a99dcbd0-9d0c-11e9-943d-03015f6e23b5",
					"c63fd030-9d0c-11e9-943d-03015f6e23b5",
					"e45784a0-9d0c-11e9-943d-03015f6e23b5",
					"e49aa820-9d0c-11e9-943d-03015f6e23b5",
					"3b87ec10-9d0d-11e9-943d-03015f6e23b5",
					"4ddd8691-9d0d-11e9-943d-03015f6e23b5",
					"83fc3cb0-a840-11e9-bd28-b354ce9f3528",
					"8a599210-a840-11e9-bd28-b354ce9f3528",
					"8ab65810-a840-11e9-bd28-b354ce9f3528",
					"8ae99d10-a840-11e9-bd28-b354ce9f3528",
					"8b4fd8f0-a840-11e9-bd28-b354ce9f3528",
					"8bb77460-a840-11e9-bd28-b354ce9f3528",
					"8c165d40-a840-11e9-bd28-b354ce9f3528",
					"8c495420-a840-11e9-bd28-b354ce9f3528",
					"8c780540-a840-11e9-bd28-b354ce9f3528",
					"8ca5a4f0-a840-11e9-bd28-b354ce9f3528",
					"8cd78a60-a840-11e9-bd28-b354ce9f3528",
					"8d42f660-a840-11e9-bd28-b354ce9f3528",
					"8ddf3660-a840-11e9-bd28-b354ce9f3528",
					"8e474700-a840-11e9-bd28-b354ce9f3528",
					"91094d30-a840-11e9-bd28-b354ce9f3528",
					"b823a3a0-a8d3-11e9-bd28-b354ce9f3528",
					"295b6ad0-001d-11ea-a693-714a24e863fc",
					"6827ecb0-9f92-11ea-8919-d395d3434d4b",
					"9eaa1650-9f92-11ea-8919-d395d3434d4b",
					"a4042c81-9f92-11ea-8919-d395d3434d4b",
					"a64b3652-9f92-11ea-8919-d395d3434d4b",
					"d06df492-9f92-11ea-8919-d395d3434d4b",
					"7c95f200-b5ae-11ea-83b1-cf73ad225062",
					"6bb697c0-ca7e-11ea-b7ca-497f43bcd90a",
					"6c5b1fb0-ca7f-11ea-b7ca-497f43bcd90a",
					"6ce8e0c0-ca7f-11ea-b7ca-497f43bcd90a",
					"81bf0ba1-ca7f-11ea-b7ca-497f43bcd90a",
					"62503b32-ccba-11ea-b62a-3b3a5e6c9540",
					"e73ec540-f097-11ea-bb5d-f3bf67cc597f",
					"add46280-1c0a-11eb-bbdc-c5ae2af77fc6",
					"ce396253-1c0a-11eb-bbdc-c5ae2af77fc6"
				],
				"_grants": [
					"37a9c490-99f9-11e9-943d-03015f6e23b5",
					"3a1cc060-99f9-11e9-943d-03015f6e23b5",
					"3b188580-99f9-11e9-943d-03015f6e23b5",
					"41a612a0-99f9-11e9-943d-03015f6e23b5",
					"f73ee4d0-9a0c-11e9-943d-03015f6e23b5",
					"dd6314d0-9d0b-11e9-943d-03015f6e23b5",
					"c0e4cfa0-9d0c-11e9-943d-03015f6e23b5",
					"c63fd030-9d0c-11e9-943d-03015f6e23b5",
					"c92cb6f0-9d0c-11e9-943d-03015f6e23b5",
					"cc2d25b0-9d0c-11e9-943d-03015f6e23b5",
					"d2279a90-9d0c-11e9-943d-03015f6e23b5",
					"e45784a0-9d0c-11e9-943d-03015f6e23b5",
					"8a599210-a840-11e9-bd28-b354ce9f3528",
					"8ae99d10-a840-11e9-bd28-b354ce9f3528",
					"8bb77460-a840-11e9-bd28-b354ce9f3528",
					"8c495420-a840-11e9-bd28-b354ce9f3528",
					"8ca5a4f0-a840-11e9-bd28-b354ce9f3528",
					"8d42f660-a840-11e9-bd28-b354ce9f3528",
					"8e474700-a840-11e9-bd28-b354ce9f3528",
					"7f5d2500-0017-11ea-9ecd-f984eb8b6e33",
					"295b6ad0-001d-11ea-a693-714a24e863fc",
					"3a6bdb20-001d-11ea-a693-714a24e863fc",
					"830ab820-0021-11ea-a693-714a24e863fc",
					"25ac5000-9f93-11ea-8919-d395d3434d4b",
					"4accb500-9f93-11ea-8919-d395d3434d4b",
					"9f3ef2c0-ac08-11ea-882e-ed9f313dc034",
					"7c95f200-b5ae-11ea-83b1-cf73ad225062",
					"6c5b1fb0-ca7f-11ea-b7ca-497f43bcd90a"
				]
			},
			"_user": "138398309776621569",
			"_amount": 1250,
			"_source": {
				"_type": 3,
				"_id": "1bfd88b0-b353-11eb-92b2-a32ed7e3969a"
			}
		},
		"4cef2530-c22d-11eb-a61a-2b20bf2044ac": {
			"_id": "4cef2530-c22d-11eb-a61a-2b20bf2044ac",
			"_type": 2,
			"_granter": {
				"_id": "260288776360820736",
				"_accounts": [],
				"_createdAt": 1561762972282,
				"_currentBalance": 100000014489,
				"_lifetimeBalance": 100000023009,
				"_bets": {
					"1a5d2850-99f9-11e9-943d-03015f6e23b5": "3bc148a0-99f9-11e9-943d-03015f6e23b5",
					"a60fea20-9d0c-11e9-943d-03015f6e23b5": "e49aa820-9d0c-11e9-943d-03015f6e23b5",
					"36e08410-9d0d-11e9-943d-03015f6e23b5": "3b87ec10-9d0d-11e9-943d-03015f6e23b5",
					"4638ed60-a840-11e9-bd28-b354ce9f3528": "91094d30-a840-11e9-bd28-b354ce9f3528",
					"5e10c3a0-9f92-11ea-8919-d395d3434d4b": "6827ecb0-9f92-11ea-8919-d395d3434d4b",
					"8ebe76f0-9f92-11ea-8919-d395d3434d4b": "9eaa1650-9f92-11ea-8919-d395d3434d4b",
					"cdd08d60-9f92-11ea-8919-d395d3434d4b": "6bb697c0-ca7e-11ea-b7ca-497f43bcd90a",
					"a965aed0-a8d3-11e9-bd28-b354ce9f3528": "6ce8e0c0-ca7f-11ea-b7ca-497f43bcd90a",
					"da969110-f097-11ea-bb5d-f3bf67cc597f": "e73ec540-f097-11ea-bb5d-f3bf67cc597f",
					"1efb9660-1c09-11eb-bbdc-c5ae2af77fc6": "add46280-1c0a-11eb-bbdc-c5ae2af77fc6"
				},
				"_changes": [
					"2637fa60-99f9-11e9-943d-03015f6e23b5",
					"37a9c490-99f9-11e9-943d-03015f6e23b5",
					"3b188580-99f9-11e9-943d-03015f6e23b5",
					"3bc148a0-99f9-11e9-943d-03015f6e23b5",
					"a99dcbd0-9d0c-11e9-943d-03015f6e23b5",
					"c63fd030-9d0c-11e9-943d-03015f6e23b5",
					"e45784a0-9d0c-11e9-943d-03015f6e23b5",
					"e49aa820-9d0c-11e9-943d-03015f6e23b5",
					"3b87ec10-9d0d-11e9-943d-03015f6e23b5",
					"4ddd8691-9d0d-11e9-943d-03015f6e23b5",
					"83fc3cb0-a840-11e9-bd28-b354ce9f3528",
					"8a599210-a840-11e9-bd28-b354ce9f3528",
					"8ab65810-a840-11e9-bd28-b354ce9f3528",
					"8ae99d10-a840-11e9-bd28-b354ce9f3528",
					"8b4fd8f0-a840-11e9-bd28-b354ce9f3528",
					"8bb77460-a840-11e9-bd28-b354ce9f3528",
					"8c165d40-a840-11e9-bd28-b354ce9f3528",
					"8c495420-a840-11e9-bd28-b354ce9f3528",
					"8c780540-a840-11e9-bd28-b354ce9f3528",
					"8ca5a4f0-a840-11e9-bd28-b354ce9f3528",
					"8cd78a60-a840-11e9-bd28-b354ce9f3528",
					"8d42f660-a840-11e9-bd28-b354ce9f3528",
					"8ddf3660-a840-11e9-bd28-b354ce9f3528",
					"8e474700-a840-11e9-bd28-b354ce9f3528",
					"91094d30-a840-11e9-bd28-b354ce9f3528",
					"b823a3a0-a8d3-11e9-bd28-b354ce9f3528",
					"295b6ad0-001d-11ea-a693-714a24e863fc",
					"6827ecb0-9f92-11ea-8919-d395d3434d4b",
					"9eaa1650-9f92-11ea-8919-d395d3434d4b",
					"a4042c81-9f92-11ea-8919-d395d3434d4b",
					"a64b3652-9f92-11ea-8919-d395d3434d4b",
					"d06df492-9f92-11ea-8919-d395d3434d4b",
					"7c95f200-b5ae-11ea-83b1-cf73ad225062",
					"6bb697c0-ca7e-11ea-b7ca-497f43bcd90a",
					"6c5b1fb0-ca7f-11ea-b7ca-497f43bcd90a",
					"6ce8e0c0-ca7f-11ea-b7ca-497f43bcd90a",
					"81bf0ba1-ca7f-11ea-b7ca-497f43bcd90a",
					"62503b32-ccba-11ea-b62a-3b3a5e6c9540",
					"e73ec540-f097-11ea-bb5d-f3bf67cc597f",
					"add46280-1c0a-11eb-bbdc-c5ae2af77fc6",
					"ce396253-1c0a-11eb-bbdc-c5ae2af77fc6"
				],
				"_grants": [
					"37a9c490-99f9-11e9-943d-03015f6e23b5",
					"3a1cc060-99f9-11e9-943d-03015f6e23b5",
					"3b188580-99f9-11e9-943d-03015f6e23b5",
					"41a612a0-99f9-11e9-943d-03015f6e23b5",
					"f73ee4d0-9a0c-11e9-943d-03015f6e23b5",
					"dd6314d0-9d0b-11e9-943d-03015f6e23b5",
					"c0e4cfa0-9d0c-11e9-943d-03015f6e23b5",
					"c63fd030-9d0c-11e9-943d-03015f6e23b5",
					"c92cb6f0-9d0c-11e9-943d-03015f6e23b5",
					"cc2d25b0-9d0c-11e9-943d-03015f6e23b5",
					"d2279a90-9d0c-11e9-943d-03015f6e23b5",
					"e45784a0-9d0c-11e9-943d-03015f6e23b5",
					"8a599210-a840-11e9-bd28-b354ce9f3528",
					"8ae99d10-a840-11e9-bd28-b354ce9f3528",
					"8bb77460-a840-11e9-bd28-b354ce9f3528",
					"8c495420-a840-11e9-bd28-b354ce9f3528",
					"8ca5a4f0-a840-11e9-bd28-b354ce9f3528",
					"8d42f660-a840-11e9-bd28-b354ce9f3528",
					"8e474700-a840-11e9-bd28-b354ce9f3528",
					"7f5d2500-0017-11ea-9ecd-f984eb8b6e33",
					"295b6ad0-001d-11ea-a693-714a24e863fc",
					"3a6bdb20-001d-11ea-a693-714a24e863fc",
					"830ab820-0021-11ea-a693-714a24e863fc",
					"25ac5000-9f93-11ea-8919-d395d3434d4b",
					"4accb500-9f93-11ea-8919-d395d3434d4b",
					"9f3ef2c0-ac08-11ea-882e-ed9f313dc034",
					"7c95f200-b5ae-11ea-83b1-cf73ad225062",
					"6c5b1fb0-ca7f-11ea-b7ca-497f43bcd90a"
				]
			},
			"_user": "177423709114466304",
			"_amount": 0,
			"_source": {
				"_type": 3,
				"_id": "91b4e120-b353-11eb-92b2-a32ed7e3969a"
			}
		},
		"4cef2531-c22d-11eb-a61a-2b20bf2044ac": {
			"_id": "4cef2531-c22d-11eb-a61a-2b20bf2044ac",
			"_type": 2,
			"_granter": {
				"_id": "260288776360820736",
				"_accounts": [],
				"_createdAt": 1561762972282,
				"_currentBalance": 100000014489,
				"_lifetimeBalance": 100000023009,
				"_bets": {
					"1a5d2850-99f9-11e9-943d-03015f6e23b5": "3bc148a0-99f9-11e9-943d-03015f6e23b5",
					"a60fea20-9d0c-11e9-943d-03015f6e23b5": "e49aa820-9d0c-11e9-943d-03015f6e23b5",
					"36e08410-9d0d-11e9-943d-03015f6e23b5": "3b87ec10-9d0d-11e9-943d-03015f6e23b5",
					"4638ed60-a840-11e9-bd28-b354ce9f3528": "91094d30-a840-11e9-bd28-b354ce9f3528",
					"5e10c3a0-9f92-11ea-8919-d395d3434d4b": "6827ecb0-9f92-11ea-8919-d395d3434d4b",
					"8ebe76f0-9f92-11ea-8919-d395d3434d4b": "9eaa1650-9f92-11ea-8919-d395d3434d4b",
					"cdd08d60-9f92-11ea-8919-d395d3434d4b": "6bb697c0-ca7e-11ea-b7ca-497f43bcd90a",
					"a965aed0-a8d3-11e9-bd28-b354ce9f3528": "6ce8e0c0-ca7f-11ea-b7ca-497f43bcd90a",
					"da969110-f097-11ea-bb5d-f3bf67cc597f": "e73ec540-f097-11ea-bb5d-f3bf67cc597f",
					"1efb9660-1c09-11eb-bbdc-c5ae2af77fc6": "add46280-1c0a-11eb-bbdc-c5ae2af77fc6"
				},
				"_changes": [
					"2637fa60-99f9-11e9-943d-03015f6e23b5",
					"37a9c490-99f9-11e9-943d-03015f6e23b5",
					"3b188580-99f9-11e9-943d-03015f6e23b5",
					"3bc148a0-99f9-11e9-943d-03015f6e23b5",
					"a99dcbd0-9d0c-11e9-943d-03015f6e23b5",
					"c63fd030-9d0c-11e9-943d-03015f6e23b5",
					"e45784a0-9d0c-11e9-943d-03015f6e23b5",
					"e49aa820-9d0c-11e9-943d-03015f6e23b5",
					"3b87ec10-9d0d-11e9-943d-03015f6e23b5",
					"4ddd8691-9d0d-11e9-943d-03015f6e23b5",
					"83fc3cb0-a840-11e9-bd28-b354ce9f3528",
					"8a599210-a840-11e9-bd28-b354ce9f3528",
					"8ab65810-a840-11e9-bd28-b354ce9f3528",
					"8ae99d10-a840-11e9-bd28-b354ce9f3528",
					"8b4fd8f0-a840-11e9-bd28-b354ce9f3528",
					"8bb77460-a840-11e9-bd28-b354ce9f3528",
					"8c165d40-a840-11e9-bd28-b354ce9f3528",
					"8c495420-a840-11e9-bd28-b354ce9f3528",
					"8c780540-a840-11e9-bd28-b354ce9f3528",
					"8ca5a4f0-a840-11e9-bd28-b354ce9f3528",
					"8cd78a60-a840-11e9-bd28-b354ce9f3528",
					"8d42f660-a840-11e9-bd28-b354ce9f3528",
					"8ddf3660-a840-11e9-bd28-b354ce9f3528",
					"8e474700-a840-11e9-bd28-b354ce9f3528",
					"91094d30-a840-11e9-bd28-b354ce9f3528",
					"b823a3a0-a8d3-11e9-bd28-b354ce9f3528",
					"295b6ad0-001d-11ea-a693-714a24e863fc",
					"6827ecb0-9f92-11ea-8919-d395d3434d4b",
					"9eaa1650-9f92-11ea-8919-d395d3434d4b",
					"a4042c81-9f92-11ea-8919-d395d3434d4b",
					"a64b3652-9f92-11ea-8919-d395d3434d4b",
					"d06df492-9f92-11ea-8919-d395d3434d4b",
					"7c95f200-b5ae-11ea-83b1-cf73ad225062",
					"6bb697c0-ca7e-11ea-b7ca-497f43bcd90a",
					"6c5b1fb0-ca7f-11ea-b7ca-497f43bcd90a",
					"6ce8e0c0-ca7f-11ea-b7ca-497f43bcd90a",
					"81bf0ba1-ca7f-11ea-b7ca-497f43bcd90a",
					"62503b32-ccba-11ea-b62a-3b3a5e6c9540",
					"e73ec540-f097-11ea-bb5d-f3bf67cc597f",
					"add46280-1c0a-11eb-bbdc-c5ae2af77fc6",
					"ce396253-1c0a-11eb-bbdc-c5ae2af77fc6"
				],
				"_grants": [
					"37a9c490-99f9-11e9-943d-03015f6e23b5",
					"3a1cc060-99f9-11e9-943d-03015f6e23b5",
					"3b188580-99f9-11e9-943d-03015f6e23b5",
					"41a612a0-99f9-11e9-943d-03015f6e23b5",
					"f73ee4d0-9a0c-11e9-943d-03015f6e23b5",
					"dd6314d0-9d0b-11e9-943d-03015f6e23b5",
					"c0e4cfa0-9d0c-11e9-943d-03015f6e23b5",
					"c63fd030-9d0c-11e9-943d-03015f6e23b5",
					"c92cb6f0-9d0c-11e9-943d-03015f6e23b5",
					"cc2d25b0-9d0c-11e9-943d-03015f6e23b5",
					"d2279a90-9d0c-11e9-943d-03015f6e23b5",
					"e45784a0-9d0c-11e9-943d-03015f6e23b5",
					"8a599210-a840-11e9-bd28-b354ce9f3528",
					"8ae99d10-a840-11e9-bd28-b354ce9f3528",
					"8bb77460-a840-11e9-bd28-b354ce9f3528",
					"8c495420-a840-11e9-bd28-b354ce9f3528",
					"8ca5a4f0-a840-11e9-bd28-b354ce9f3528",
					"8d42f660-a840-11e9-bd28-b354ce9f3528",
					"8e474700-a840-11e9-bd28-b354ce9f3528",
					"7f5d2500-0017-11ea-9ecd-f984eb8b6e33",
					"295b6ad0-001d-11ea-a693-714a24e863fc",
					"3a6bdb20-001d-11ea-a693-714a24e863fc",
					"830ab820-0021-11ea-a693-714a24e863fc",
					"25ac5000-9f93-11ea-8919-d395d3434d4b",
					"4accb500-9f93-11ea-8919-d395d3434d4b",
					"9f3ef2c0-ac08-11ea-882e-ed9f313dc034",
					"7c95f200-b5ae-11ea-83b1-cf73ad225062",
					"6c5b1fb0-ca7f-11ea-b7ca-497f43bcd90a"
				]
			},
			"_user": "174037015858249730",
			"_amount": 1250,
			"_source": {
				"_type": 3,
				"_id": "d9187d00-b36d-11eb-92b2-a32ed7e3969a"
			}
		},
		"4cef4c40-c22d-11eb-a61a-2b20bf2044ac": {
			"_id": "4cef4c40-c22d-11eb-a61a-2b20bf2044ac",
			"_type": 2,
			"_granter": {
				"_id": "260288776360820736",
				"_accounts": [],
				"_createdAt": 1561762972282,
				"_currentBalance": 100000014489,
				"_lifetimeBalance": 100000023009,
				"_bets": {
					"1a5d2850-99f9-11e9-943d-03015f6e23b5": "3bc148a0-99f9-11e9-943d-03015f6e23b5",
					"a60fea20-9d0c-11e9-943d-03015f6e23b5": "e49aa820-9d0c-11e9-943d-03015f6e23b5",
					"36e08410-9d0d-11e9-943d-03015f6e23b5": "3b87ec10-9d0d-11e9-943d-03015f6e23b5",
					"4638ed60-a840-11e9-bd28-b354ce9f3528": "91094d30-a840-11e9-bd28-b354ce9f3528",
					"5e10c3a0-9f92-11ea-8919-d395d3434d4b": "6827ecb0-9f92-11ea-8919-d395d3434d4b",
					"8ebe76f0-9f92-11ea-8919-d395d3434d4b": "9eaa1650-9f92-11ea-8919-d395d3434d4b",
					"cdd08d60-9f92-11ea-8919-d395d3434d4b": "6bb697c0-ca7e-11ea-b7ca-497f43bcd90a",
					"a965aed0-a8d3-11e9-bd28-b354ce9f3528": "6ce8e0c0-ca7f-11ea-b7ca-497f43bcd90a",
					"da969110-f097-11ea-bb5d-f3bf67cc597f": "e73ec540-f097-11ea-bb5d-f3bf67cc597f",
					"1efb9660-1c09-11eb-bbdc-c5ae2af77fc6": "add46280-1c0a-11eb-bbdc-c5ae2af77fc6"
				},
				"_changes": [
					"2637fa60-99f9-11e9-943d-03015f6e23b5",
					"37a9c490-99f9-11e9-943d-03015f6e23b5",
					"3b188580-99f9-11e9-943d-03015f6e23b5",
					"3bc148a0-99f9-11e9-943d-03015f6e23b5",
					"a99dcbd0-9d0c-11e9-943d-03015f6e23b5",
					"c63fd030-9d0c-11e9-943d-03015f6e23b5",
					"e45784a0-9d0c-11e9-943d-03015f6e23b5",
					"e49aa820-9d0c-11e9-943d-03015f6e23b5",
					"3b87ec10-9d0d-11e9-943d-03015f6e23b5",
					"4ddd8691-9d0d-11e9-943d-03015f6e23b5",
					"83fc3cb0-a840-11e9-bd28-b354ce9f3528",
					"8a599210-a840-11e9-bd28-b354ce9f3528",
					"8ab65810-a840-11e9-bd28-b354ce9f3528",
					"8ae99d10-a840-11e9-bd28-b354ce9f3528",
					"8b4fd8f0-a840-11e9-bd28-b354ce9f3528",
					"8bb77460-a840-11e9-bd28-b354ce9f3528",
					"8c165d40-a840-11e9-bd28-b354ce9f3528",
					"8c495420-a840-11e9-bd28-b354ce9f3528",
					"8c780540-a840-11e9-bd28-b354ce9f3528",
					"8ca5a4f0-a840-11e9-bd28-b354ce9f3528",
					"8cd78a60-a840-11e9-bd28-b354ce9f3528",
					"8d42f660-a840-11e9-bd28-b354ce9f3528",
					"8ddf3660-a840-11e9-bd28-b354ce9f3528",
					"8e474700-a840-11e9-bd28-b354ce9f3528",
					"91094d30-a840-11e9-bd28-b354ce9f3528",
					"b823a3a0-a8d3-11e9-bd28-b354ce9f3528",
					"295b6ad0-001d-11ea-a693-714a24e863fc",
					"6827ecb0-9f92-11ea-8919-d395d3434d4b",
					"9eaa1650-9f92-11ea-8919-d395d3434d4b",
					"a4042c81-9f92-11ea-8919-d395d3434d4b",
					"a64b3652-9f92-11ea-8919-d395d3434d4b",
					"d06df492-9f92-11ea-8919-d395d3434d4b",
					"7c95f200-b5ae-11ea-83b1-cf73ad225062",
					"6bb697c0-ca7e-11ea-b7ca-497f43bcd90a",
					"6c5b1fb0-ca7f-11ea-b7ca-497f43bcd90a",
					"6ce8e0c0-ca7f-11ea-b7ca-497f43bcd90a",
					"81bf0ba1-ca7f-11ea-b7ca-497f43bcd90a",
					"62503b32-ccba-11ea-b62a-3b3a5e6c9540",
					"e73ec540-f097-11ea-bb5d-f3bf67cc597f",
					"add46280-1c0a-11eb-bbdc-c5ae2af77fc6",
					"ce396253-1c0a-11eb-bbdc-c5ae2af77fc6"
				],
				"_grants": [
					"37a9c490-99f9-11e9-943d-03015f6e23b5",
					"3a1cc060-99f9-11e9-943d-03015f6e23b5",
					"3b188580-99f9-11e9-943d-03015f6e23b5",
					"41a612a0-99f9-11e9-943d-03015f6e23b5",
					"f73ee4d0-9a0c-11e9-943d-03015f6e23b5",
					"dd6314d0-9d0b-11e9-943d-03015f6e23b5",
					"c0e4cfa0-9d0c-11e9-943d-03015f6e23b5",
					"c63fd030-9d0c-11e9-943d-03015f6e23b5",
					"c92cb6f0-9d0c-11e9-943d-03015f6e23b5",
					"cc2d25b0-9d0c-11e9-943d-03015f6e23b5",
					"d2279a90-9d0c-11e9-943d-03015f6e23b5",
					"e45784a0-9d0c-11e9-943d-03015f6e23b5",
					"8a599210-a840-11e9-bd28-b354ce9f3528",
					"8ae99d10-a840-11e9-bd28-b354ce9f3528",
					"8bb77460-a840-11e9-bd28-b354ce9f3528",
					"8c495420-a840-11e9-bd28-b354ce9f3528",
					"8ca5a4f0-a840-11e9-bd28-b354ce9f3528",
					"8d42f660-a840-11e9-bd28-b354ce9f3528",
					"8e474700-a840-11e9-bd28-b354ce9f3528",
					"7f5d2500-0017-11ea-9ecd-f984eb8b6e33",
					"295b6ad0-001d-11ea-a693-714a24e863fc",
					"3a6bdb20-001d-11ea-a693-714a24e863fc",
					"830ab820-0021-11ea-a693-714a24e863fc",
					"25ac5000-9f93-11ea-8919-d395d3434d4b",
					"4accb500-9f93-11ea-8919-d395d3434d4b",
					"9f3ef2c0-ac08-11ea-882e-ed9f313dc034",
					"7c95f200-b5ae-11ea-83b1-cf73ad225062",
					"6c5b1fb0-ca7f-11ea-b7ca-497f43bcd90a"
				]
			},
			"_user": "211283870736187394",
			"_amount": 1250,
			"_source": {
				"_type": 3,
				"_id": "328d9bb0-b41b-11eb-92b2-a32ed7e3969a"
			}
		},
		"4cef4c41-c22d-11eb-a61a-2b20bf2044ac": {
			"_id": "4cef4c41-c22d-11eb-a61a-2b20bf2044ac",
			"_type": 2,
			"_granter": {
				"_id": "260288776360820736",
				"_accounts": [],
				"_createdAt": 1561762972282,
				"_currentBalance": 100000014489,
				"_lifetimeBalance": 100000023009,
				"_bets": {
					"1a5d2850-99f9-11e9-943d-03015f6e23b5": "3bc148a0-99f9-11e9-943d-03015f6e23b5",
					"a60fea20-9d0c-11e9-943d-03015f6e23b5": "e49aa820-9d0c-11e9-943d-03015f6e23b5",
					"36e08410-9d0d-11e9-943d-03015f6e23b5": "3b87ec10-9d0d-11e9-943d-03015f6e23b5",
					"4638ed60-a840-11e9-bd28-b354ce9f3528": "91094d30-a840-11e9-bd28-b354ce9f3528",
					"5e10c3a0-9f92-11ea-8919-d395d3434d4b": "6827ecb0-9f92-11ea-8919-d395d3434d4b",
					"8ebe76f0-9f92-11ea-8919-d395d3434d4b": "9eaa1650-9f92-11ea-8919-d395d3434d4b",
					"cdd08d60-9f92-11ea-8919-d395d3434d4b": "6bb697c0-ca7e-11ea-b7ca-497f43bcd90a",
					"a965aed0-a8d3-11e9-bd28-b354ce9f3528": "6ce8e0c0-ca7f-11ea-b7ca-497f43bcd90a",
					"da969110-f097-11ea-bb5d-f3bf67cc597f": "e73ec540-f097-11ea-bb5d-f3bf67cc597f",
					"1efb9660-1c09-11eb-bbdc-c5ae2af77fc6": "add46280-1c0a-11eb-bbdc-c5ae2af77fc6"
				},
				"_changes": [
					"2637fa60-99f9-11e9-943d-03015f6e23b5",
					"37a9c490-99f9-11e9-943d-03015f6e23b5",
					"3b188580-99f9-11e9-943d-03015f6e23b5",
					"3bc148a0-99f9-11e9-943d-03015f6e23b5",
					"a99dcbd0-9d0c-11e9-943d-03015f6e23b5",
					"c63fd030-9d0c-11e9-943d-03015f6e23b5",
					"e45784a0-9d0c-11e9-943d-03015f6e23b5",
					"e49aa820-9d0c-11e9-943d-03015f6e23b5",
					"3b87ec10-9d0d-11e9-943d-03015f6e23b5",
					"4ddd8691-9d0d-11e9-943d-03015f6e23b5",
					"83fc3cb0-a840-11e9-bd28-b354ce9f3528",
					"8a599210-a840-11e9-bd28-b354ce9f3528",
					"8ab65810-a840-11e9-bd28-b354ce9f3528",
					"8ae99d10-a840-11e9-bd28-b354ce9f3528",
					"8b4fd8f0-a840-11e9-bd28-b354ce9f3528",
					"8bb77460-a840-11e9-bd28-b354ce9f3528",
					"8c165d40-a840-11e9-bd28-b354ce9f3528",
					"8c495420-a840-11e9-bd28-b354ce9f3528",
					"8c780540-a840-11e9-bd28-b354ce9f3528",
					"8ca5a4f0-a840-11e9-bd28-b354ce9f3528",
					"8cd78a60-a840-11e9-bd28-b354ce9f3528",
					"8d42f660-a840-11e9-bd28-b354ce9f3528",
					"8ddf3660-a840-11e9-bd28-b354ce9f3528",
					"8e474700-a840-11e9-bd28-b354ce9f3528",
					"91094d30-a840-11e9-bd28-b354ce9f3528",
					"b823a3a0-a8d3-11e9-bd28-b354ce9f3528",
					"295b6ad0-001d-11ea-a693-714a24e863fc",
					"6827ecb0-9f92-11ea-8919-d395d3434d4b",
					"9eaa1650-9f92-11ea-8919-d395d3434d4b",
					"a4042c81-9f92-11ea-8919-d395d3434d4b",
					"a64b3652-9f92-11ea-8919-d395d3434d4b",
					"d06df492-9f92-11ea-8919-d395d3434d4b",
					"7c95f200-b5ae-11ea-83b1-cf73ad225062",
					"6bb697c0-ca7e-11ea-b7ca-497f43bcd90a",
					"6c5b1fb0-ca7f-11ea-b7ca-497f43bcd90a",
					"6ce8e0c0-ca7f-11ea-b7ca-497f43bcd90a",
					"81bf0ba1-ca7f-11ea-b7ca-497f43bcd90a",
					"62503b32-ccba-11ea-b62a-3b3a5e6c9540",
					"e73ec540-f097-11ea-bb5d-f3bf67cc597f",
					"add46280-1c0a-11eb-bbdc-c5ae2af77fc6",
					"ce396253-1c0a-11eb-bbdc-c5ae2af77fc6"
				],
				"_grants": [
					"37a9c490-99f9-11e9-943d-03015f6e23b5",
					"3a1cc060-99f9-11e9-943d-03015f6e23b5",
					"3b188580-99f9-11e9-943d-03015f6e23b5",
					"41a612a0-99f9-11e9-943d-03015f6e23b5",
					"f73ee4d0-9a0c-11e9-943d-03015f6e23b5",
					"dd6314d0-9d0b-11e9-943d-03015f6e23b5",
					"c0e4cfa0-9d0c-11e9-943d-03015f6e23b5",
					"c63fd030-9d0c-11e9-943d-03015f6e23b5",
					"c92cb6f0-9d0c-11e9-943d-03015f6e23b5",
					"cc2d25b0-9d0c-11e9-943d-03015f6e23b5",
					"d2279a90-9d0c-11e9-943d-03015f6e23b5",
					"e45784a0-9d0c-11e9-943d-03015f6e23b5",
					"8a599210-a840-11e9-bd28-b354ce9f3528",
					"8ae99d10-a840-11e9-bd28-b354ce9f3528",
					"8bb77460-a840-11e9-bd28-b354ce9f3528",
					"8c495420-a840-11e9-bd28-b354ce9f3528",
					"8ca5a4f0-a840-11e9-bd28-b354ce9f3528",
					"8d42f660-a840-11e9-bd28-b354ce9f3528",
					"8e474700-a840-11e9-bd28-b354ce9f3528",
					"7f5d2500-0017-11ea-9ecd-f984eb8b6e33",
					"295b6ad0-001d-11ea-a693-714a24e863fc",
					"3a6bdb20-001d-11ea-a693-714a24e863fc",
					"830ab820-0021-11ea-a693-714a24e863fc",
					"25ac5000-9f93-11ea-8919-d395d3434d4b",
					"4accb500-9f93-11ea-8919-d395d3434d4b",
					"9f3ef2c0-ac08-11ea-882e-ed9f313dc034",
					"7c95f200-b5ae-11ea-83b1-cf73ad225062",
					"6c5b1fb0-ca7f-11ea-b7ca-497f43bcd90a"
				]
			},
			"_user": "260288776360820736",
			"_amount": 1250,
			"_source": {
				"_type": 3,
				"_id": "b0ad5bc0-b41b-11eb-92b2-a32ed7e3969a"
			}
		}
	},
	"challonge": {},
	"games": {
		"Mudamaid 6": {},
		"Monster Hunter World": {
			"138398309776621569": {},
			"260288776360820736": {}
		}
	},
	"prefix": "!",
	"moderation": {
		"70fb69f0-cc7b-11ea-b62a-3b3a5e6c9540": {
			"_id": "70fb69f0-cc7b-11ea-b62a-3b3a5e6c9540",
			"_userId": "177423709114466304",
			"_moderatorId": "260288776360820736",
			"_roles": [
				"319291359376703488",
				"326496822128541697",
				"326496847248228352",
				"358366430015651842",
				"369882748283781121",
				"386405611404918785",
				"430453030333317123",
				"442878467818782721",
				"449429764504158219",
				"469632830306123796",
				"498030140681617408",
				"502237725240590346",
				"506733632065503232",
				"525159363976101908",
				"544024681943007233",
				"611722424991612970",
				"634071561988603904",
				"639937925064294401",
				"645166722273247233",
				"680192503366156318"
			],
			"_startTime": "2020-07-23T00:28:33.679Z",
			"_lastEditedTime": 1595464173656,
			"_endTime": 1595464173656,
			"_active": false
		},
		"b890ea10-cc7b-11ea-b62a-3b3a5e6c9540": {
			"_id": "b890ea10-cc7b-11ea-b62a-3b3a5e6c9540",
			"_userId": "177423709114466304",
			"_moderatorId": "260288776360820736",
			"_roles": [
				"319291359376703488",
				"326496822128541697",
				"358366430015651842",
				"326496847248228352",
				"369882748283781121",
				"386405611404918785",
				"430453030333317123",
				"442878467818782721",
				"498030140681617408",
				"506733632065503232",
				"502237725240590346",
				"449429764504158219",
				"544024681943007233",
				"634071561988603904",
				"639937925064294401",
				"645166722273247233",
				"469632830306123796",
				"525159363976101908",
				"680192503366156318",
				"611722424991612970"
			],
			"_startTime": "2020-07-23T00:30:33.777Z",
			"_lastEditedTime": 1595464282741,
			"_endTime": 1595464282741,
			"_active": false
		},
		"d93b5750-cc7b-11ea-b62a-3b3a5e6c9540": {
			"_id": "d93b5750-cc7b-11ea-b62a-3b3a5e6c9540",
			"_userId": "177423709114466304",
			"_moderatorId": "260288776360820736",
			"_roles": [
				"319291359376703488",
				"326496822128541697",
				"358366430015651842",
				"326496847248228352",
				"369882748283781121",
				"386405611404918785",
				"430453030333317123",
				"442878467818782721",
				"498030140681617408",
				"506733632065503232",
				"502237725240590346",
				"449429764504158219",
				"544024681943007233",
				"634071561988603904",
				"639937925064294401",
				"645166722273247233",
				"469632830306123796",
				"525159363976101908",
				"680192503366156318",
				"611722424991612970"
			],
			"_startTime": "2020-07-23T00:31:28.581Z",
			"_lastEditedTime": 1595464318557,
			"_endTime": 1595464318557,
			"_active": false
		},
		"0138c490-cc7c-11ea-b62a-3b3a5e6c9540": {
			"_id": "0138c490-cc7c-11ea-b62a-3b3a5e6c9540",
			"_userId": "177423709114466304",
			"_moderatorId": "260288776360820736",
			"_roles": [
				"319291359376703488",
				"326496822128541697",
				"358366430015651842",
				"326496847248228352",
				"369882748283781121",
				"386405611404918785",
				"430453030333317123",
				"442878467818782721",
				"498030140681617408",
				"506733632065503232",
				"502237725240590346",
				"449429764504158219",
				"544024681943007233",
				"634071561988603904",
				"639937925064294401",
				"645166722273247233",
				"469632830306123796",
				"525159363976101908",
				"680192503366156318",
				"611722424991612970"
			],
			"_startTime": "2020-07-23T00:32:35.673Z",
			"_lastEditedTime": 1595464385649,
			"_endTime": 1595464385649,
			"_active": false
		},
		"3379c210-cc7c-11ea-b62a-3b3a5e6c9540": {
			"_id": "3379c210-cc7c-11ea-b62a-3b3a5e6c9540",
			"_userId": "260288776360820736",
			"_moderatorId": "260288776360820736",
			"_roles": [
				"319291359376703488",
				"319373030339903488",
				"326496765115236352",
				"326496822128541697",
				"326496847248228352",
				"358366430015651842",
				"369882748283781121",
				"386405611404918785",
				"430453030333317123",
				"442878467818782721",
				"449429764504158219",
				"469632830306123796",
				"498030140681617408",
				"506733632065503232",
				"525159363976101908",
				"544024681943007233",
				"607456710403293205",
				"607463652869537792",
				"611722424991612970",
				"634071561988603904",
				"639937925064294401",
				"645166722273247233"
			],
			"_startTime": "2020-07-23T00:33:59.985Z",
			"_lastEditedTime": 1595464469955,
			"_endTime": 1595464469955,
			"_active": false
		},
		"674c0df0-cc7c-11ea-b62a-3b3a5e6c9540": {
			"_id": "674c0df0-cc7c-11ea-b62a-3b3a5e6c9540",
			"_userId": "260288776360820736",
			"_moderatorId": "138398309776621569",
			"_roles": [
				"319291359376703488",
				"319373030339903488",
				"326496765115236352",
				"326496847248228352",
				"326496822128541697",
				"358366430015651842",
				"369882748283781121",
				"386405611404918785",
				"430453030333317123",
				"442878467818782721",
				"498030140681617408",
				"449429764504158219",
				"506733632065503232",
				"544024681943007233",
				"607463652869537792",
				"634071561988603904",
				"469632830306123796",
				"525159363976101908",
				"607456710403293205",
				"639937925064294401",
				"645166722273247233",
				"611722424991612970"
			],
			"_startTime": "2020-07-23T00:35:26.928Z",
			"_lastEditedTime": 1595464577359,
			"_endTime": 1595464577359,
			"_active": false
		},
		"761c0420-cc7c-11ea-b62a-3b3a5e6c9540": {
			"_id": "761c0420-cc7c-11ea-b62a-3b3a5e6c9540",
			"_userId": "177423709114466304",
			"_moderatorId": "177423709114466304",
			"_roles": [
				"319291359376703488",
				"326496822128541697",
				"358366430015651842",
				"326496847248228352",
				"369882748283781121",
				"386405611404918785",
				"430453030333317123",
				"442878467818782721",
				"498030140681617408",
				"506733632065503232",
				"502237725240590346",
				"449429764504158219",
				"544024681943007233",
				"634071561988603904",
				"639937925064294401",
				"645166722273247233",
				"469632830306123796",
				"525159363976101908",
				"680192503366156318",
				"611722424991612970"
			],
			"_startTime": "2020-07-23T00:35:51.778Z",
			"_lastEditedTime": 1595464611748,
			"_endTime": 1595464611748,
			"_active": false
		},
		"bdb622b0-cc7d-11ea-b62a-3b3a5e6c9540": {
			"_id": "bdb622b0-cc7d-11ea-b62a-3b3a5e6c9540",
			"_userId": "720246096235855882",
			"_moderatorId": "720246096235855882",
			"_roles": [
				"319291359376703488",
				"672360312963334155"
			],
			"_startTime": "2020-07-23T00:45:01.403Z",
			"_lastEditedTime": 1595465106399,
			"_endTime": 1595465106399,
			"_active": false
		},
		"cb616f00-cc7d-11ea-b62a-3b3a5e6c9540": {
			"_id": "cb616f00-cc7d-11ea-b62a-3b3a5e6c9540",
			"_userId": "720246096235855882",
			"_moderatorId": "720246096235855882",
			"_roles": [
				"319291359376703488",
				"672360312963334155"
			],
			"_startTime": "2020-07-23T00:45:24.336Z",
			"_lastEditedTime": 1595465129335,
			"_endTime": 1595465129335,
			"_active": false
		},
		"a1458ff0-ccbc-11ea-b4c8-25b105693d7b": {
			"_id": "a1458ff0-ccbc-11ea-b4c8-25b105693d7b",
			"_userId": "260288776360820736",
			"_moderatorId": "260288776360820736",
			"_roles": [
				"319291359376703488",
				"319373030339903488",
				"326496765115236352",
				"326496822128541697",
				"326496847248228352",
				"358366430015651842",
				"369882748283781121",
				"386405611404918785",
				"430453030333317123",
				"442878467818782721",
				"498030140681617408",
				"449429764504158219",
				"506733632065503232",
				"544024681943007233",
				"607463652869537792",
				"634071561988603904",
				"469632830306123796",
				"525159363976101908",
				"607456710403293205",
				"639937925064294401",
				"645166722273247233",
				"611722424991612970"
			],
			"_startTime": "2020-07-23T08:15:11.983Z",
			"_lastEditedTime": 1595492121951,
			"_endTime": 1595492121951,
			"_active": false
		},
		"ae808e40-ccbc-11ea-b4c8-25b105693d7b": {
			"_id": "ae808e40-ccbc-11ea-b4c8-25b105693d7b",
			"_userId": "260288776360820736",
			"_moderatorId": "260288776360820736",
			"_roles": [
				"319291359376703488",
				"319373030339903488",
				"326496765115236352",
				"326496847248228352",
				"326496822128541697",
				"358366430015651842",
				"369882748283781121",
				"386405611404918785",
				"430453030333317123",
				"442878467818782721",
				"498030140681617408",
				"449429764504158219",
				"506733632065503232",
				"544024681943007233",
				"607463652869537792",
				"634071561988603904",
				"469632830306123796",
				"525159363976101908",
				"607456710403293205",
				"639937925064294401",
				"645166722273247233",
				"611722424991612970"
			],
			"_startTime": "2020-07-23T08:15:34.180Z",
			"_lastEditedTime": 1595492144150,
			"_endTime": 1595492144150,
			"_active": false
		},
		"c589ec30-cd11-11ea-b4c8-25b105693d7b": {
			"_id": "c589ec30-cd11-11ea-b4c8-25b105693d7b",
			"_userId": "173026718423056384",
			"_moderatorId": "260288776360820736",
			"_roles": [
				"319291359376703488",
				"326496847248228352",
				"326496822128541697",
				"369882748283781121",
				"607463652869537792",
				"634071561988603904",
				"506733632065503232",
				"611722424991612970",
				"629762602863689738",
				"607456710403293205",
				"680192503366156318"
			],
			"_startTime": "2020-07-23T18:24:40.051Z",
			"_lastEditedTime": 1595528740032,
			"_endTime": 1595528740032,
			"_active": false
		},
		"f5716950-cd11-11ea-b4c8-25b105693d7b": {
			"_id": "f5716950-cd11-11ea-b4c8-25b105693d7b",
			"_userId": "260288776360820736",
			"_moderatorId": "173026718423056384",
			"_roles": [
				"319291359376703488",
				"319373030339903488",
				"326496765115236352",
				"326496822128541697",
				"326496847248228352",
				"358366430015651842",
				"369882748283781121",
				"386405611404918785",
				"430453030333317123",
				"442878467818782721",
				"498030140681617408",
				"449429764504158219",
				"506733632065503232",
				"544024681943007233",
				"607463652869537792",
				"634071561988603904",
				"469632830306123796",
				"525159363976101908",
				"607456710403293205",
				"639937925064294401",
				"645166722273247233",
				"611722424991612970"
			],
			"_startTime": "2020-07-23T18:26:00.421Z",
			"_lastEditedTime": 1595528820383,
			"_endTime": 1595528820383,
			"_active": false
		},
		"f9d9b000-cd12-11ea-b4c8-25b105693d7b": {
			"_id": "f9d9b000-cd12-11ea-b4c8-25b105693d7b",
			"_userId": "134062007547723777",
			"_moderatorId": "134062007547723777",
			"_roles": [
				"319291359376703488",
				"326496847248228352",
				"326496822128541697",
				"506733632065503232",
				"442878467818782721",
				"639937925064294401",
				"502237725240590346",
				"672360312963334155",
				"680192503366156318",
				"657680901328601118"
			],
			"_startTime": "2020-07-23T18:33:17.312Z",
			"_lastEditedTime": 1595529257279,
			"_endTime": 1595529257279,
			"_active": false
		},
		"0271da30-cd13-11ea-b4c8-25b105693d7b": {
			"_id": "0271da30-cd13-11ea-b4c8-25b105693d7b",
			"_userId": "110374796960759808",
			"_moderatorId": "173026718423056384",
			"_roles": [
				"319291359376703488",
				"326496847248228352",
				"369882748283781121",
				"469632830306123796",
				"544024681943007233",
				"607463652869537792",
				"611722424991612970",
				"629762189993181194",
				"680192503366156318"
			],
			"_startTime": "2020-07-23T18:33:31.731Z",
			"_lastEditedTime": 1595529271710,
			"_endTime": 1595529271710,
			"_active": false
		},
		"1917e310-cd13-11ea-b4c8-25b105693d7b": {
			"_id": "1917e310-cd13-11ea-b4c8-25b105693d7b",
			"_userId": "222169605253234689",
			"_moderatorId": "222169605253234689",
			"_roles": [
				"319291359376703488",
				"358366430015651842",
				"369882748283781121",
				"525159363976101908",
				"544024681943007233",
				"607456710403293205",
				"607463652869537792",
				"634071561988603904",
				"645166722273247233",
				"672360312963334155",
				"680192503366156318"
			],
			"_startTime": "2020-07-23T18:34:09.729Z",
			"_lastEditedTime": 1595529309710,
			"_endTime": 1595529309710,
			"_active": false
		},
		"0eec7940-cd14-11ea-b4c8-25b105693d7b": {
			"_id": "0eec7940-cd14-11ea-b4c8-25b105693d7b",
			"_userId": "173026718423056384",
			"_moderatorId": "260288776360820736",
			"_roles": [
				"319291359376703488",
				"326496847248228352",
				"369882748283781121",
				"607463652869537792",
				"326496822128541697",
				"634071561988603904",
				"506733632065503232",
				"611722424991612970",
				"629762602863689738",
				"607456710403293205",
				"680192503366156318"
			],
			"_startTime": "2020-07-23T18:41:02.164Z",
			"_lastEditedTime": 1595529789471,
			"_endTime": 1595529789471,
			"_active": false
		},
		"165412b0-cd14-11ea-b4c8-25b105693d7b": {
			"_id": "165412b0-cd14-11ea-b4c8-25b105693d7b",
			"_userId": "260288776360820736",
			"_moderatorId": "173026718423056384",
			"_roles": [
				"319291359376703488",
				"319373030339903488",
				"326496765115236352",
				"326496847248228352",
				"326496822128541697",
				"358366430015651842",
				"369882748283781121",
				"386405611404918785",
				"430453030333317123",
				"442878467818782721",
				"498030140681617408",
				"449429764504158219",
				"506733632065503232",
				"544024681943007233",
				"607463652869537792",
				"634071561988603904",
				"469632830306123796",
				"525159363976101908",
				"607456710403293205",
				"639937925064294401",
				"645166722273247233",
				"611722424991612970"
			],
			"_startTime": "2020-07-23T18:41:14.587Z",
			"_lastEditedTime": 1595529782650,
			"_endTime": 1595529782650,
			"_active": false
		},
		"3f717970-cd15-11ea-b4c8-25b105693d7b": {
			"_id": "3f717970-cd15-11ea-b4c8-25b105693d7b",
			"_userId": "138398309776621569",
			"_moderatorId": "260288776360820736",
			"_roles": [
				"319291359376703488",
				"319297882375061508",
				"326496765115236352",
				"326496822128541697",
				"358366430015651842",
				"369882748283781121",
				"386405611404918785",
				"407885899515297795",
				"430453030333317123",
				"442878467818782721",
				"446958987804672000",
				"449429764504158219",
				"469632830306123796",
				"498030140681617408",
				"502237725240590346",
				"506733632065503232",
				"525159363976101908",
				"544024681943007233",
				"607456710403293205",
				"607463652869537792",
				"624772284963356692",
				"634071561988603904",
				"639937925064294401"
			],
			"_startTime": "2020-07-23T18:49:33.063Z",
			"_lastEditedTime": 1595530233022,
			"_endTime": 1595530233022,
			"_active": false
		},
		"758773c0-cd15-11ea-b4c8-25b105693d7b": {
			"_id": "758773c0-cd15-11ea-b4c8-25b105693d7b",
			"_userId": "260288776360820736",
			"_moderatorId": "173026718423056384",
			"_roles": [
				"319291359376703488",
				"319373030339903488",
				"326496765115236352",
				"326496822128541697",
				"326496847248228352",
				"358366430015651842",
				"369882748283781121",
				"386405611404918785",
				"430453030333317123",
				"442878467818782721",
				"498030140681617408",
				"449429764504158219",
				"506733632065503232",
				"544024681943007233",
				"607463652869537792",
				"634071561988603904",
				"469632830306123796",
				"525159363976101908",
				"607456710403293205",
				"639937925064294401",
				"645166722273247233",
				"611722424991612970"
			],
			"_startTime": "2020-07-23T18:51:03.804Z",
			"_lastEditedTime": 1595530264763,
			"_endTime": 1595530264763,
			"_active": false
		},
		"89bb9240-cd15-11ea-a9ad-0544dd37b91f": {
			"_id": "89bb9240-cd15-11ea-a9ad-0544dd37b91f",
			"_userId": "138398309776621569",
			"_moderatorId": "134062007547723777",
			"_roles": [
				"319291359376703488",
				"326496765115236352",
				"358366430015651842",
				"326496822128541697",
				"319297882375061508",
				"369882748283781121",
				"386405611404918785",
				"407885899515297795",
				"430453030333317123",
				"442878467818782721",
				"446958987804672000",
				"449429764504158219",
				"498030140681617408",
				"502237725240590346",
				"506733632065503232",
				"544024681943007233",
				"469632830306123796",
				"525159363976101908",
				"607456710403293205",
				"624772284963356692",
				"607463652869537792",
				"639937925064294401",
				"634071561988603904"
			],
			"_startTime": "2020-07-23T18:51:37.700Z",
			"_lastEditedTime": 1595530302651,
			"_endTime": 1595530302651,
			"_active": false
		},
		"f3beda80-cd15-11ea-8039-356568d92250": {
			"_id": "f3beda80-cd15-11ea-8039-356568d92250",
			"_userId": "260288776360820736",
			"_moderatorId": "173026718423056384",
			"_roles": [
				"319291359376703488",
				"319373030339903488",
				"326496765115236352",
				"326496847248228352",
				"326496822128541697",
				"358366430015651842",
				"369882748283781121",
				"386405611404918785",
				"430453030333317123",
				"442878467818782721",
				"498030140681617408",
				"449429764504158219",
				"506733632065503232",
				"544024681943007233",
				"607463652869537792",
				"634071561988603904",
				"469632830306123796",
				"525159363976101908",
				"607456710403293205",
				"639937925064294401",
				"645166722273247233",
				"611722424991612970"
			],
			"_startTime": "2020-07-23T18:54:35.560Z",
			"_lastEditedTime": 1595530482620,
			"_endTime": 1595530482620,
			"_active": false
		},
		"1de171b0-cd16-11ea-8039-356568d92250": {
			"_id": "1de171b0-cd16-11ea-8039-356568d92250",
			"_userId": "173026718423056384",
			"_moderatorId": "260288776360820736",
			"_roles": [
				"319291359376703488",
				"326496847248228352",
				"607463652869537792",
				"326496822128541697",
				"369882748283781121",
				"634071561988603904",
				"506733632065503232",
				"611722424991612970",
				"629762602863689738",
				"607456710403293205",
				"680192503366156318"
			],
			"_startTime": "2020-07-23T18:55:46.251Z",
			"_lastEditedTime": 1595530556040,
			"_endTime": 1595530556040,
			"_active": false
		},
		"2f3134f0-cd16-11ea-8039-356568d92250": {
			"_id": "2f3134f0-cd16-11ea-8039-356568d92250",
			"_userId": "177423709114466304",
			"_moderatorId": "177423709114466304",
			"_roles": [
				"319291359376703488",
				"326496822128541697",
				"358366430015651842",
				"326496847248228352",
				"369882748283781121",
				"386405611404918785",
				"430453030333317123",
				"442878467818782721",
				"498030140681617408",
				"506733632065503232",
				"502237725240590346",
				"449429764504158219",
				"544024681943007233",
				"634071561988603904",
				"639937925064294401",
				"645166722273247233",
				"469632830306123796",
				"525159363976101908",
				"680192503366156318",
				"611722424991612970"
			],
			"_startTime": "2020-07-23T18:56:15.295Z",
			"_lastEditedTime": 1595530946314,
			"_endTime": 1595530946314,
			"_active": false
		},
		"466462a0-cd16-11ea-8039-356568d92250": {
			"_id": "466462a0-cd16-11ea-8039-356568d92250",
			"_userId": "191286686607474698",
			"_moderatorId": "191286686607474698",
			"_roles": [
				"319291359376703488",
				"326496822128541697",
				"502237725240590346",
				"504425280165904384",
				"504430094270332948",
				"536616794933428264",
				"607456710403293205",
				"657382118745178122"
			],
			"_startTime": "2020-07-23T18:56:54.218Z",
			"_lastEditedTime": 1595530941152,
			"_endTime": 1595530941152,
			"_active": false
		},
		"dba6fcb0-cd16-11ea-8039-356568d92250": {
			"_id": "dba6fcb0-cd16-11ea-8039-356568d92250",
			"_userId": "260288776360820736",
			"_moderatorId": "260288776360820736",
			"_roles": [
				"319291359376703488",
				"319373030339903488",
				"326496765115236352",
				"326496822128541697",
				"326496847248228352",
				"358366430015651842",
				"369882748283781121",
				"386405611404918785",
				"430453030333317123",
				"442878467818782721",
				"498030140681617408",
				"449429764504158219",
				"506733632065503232",
				"544024681943007233",
				"607463652869537792",
				"634071561988603904",
				"469632830306123796",
				"525159363976101908",
				"607456710403293205",
				"639937925064294401",
				"645166722273247233",
				"611722424991612970"
			],
			"_startTime": "2020-07-23T19:01:04.635Z",
			"_lastEditedTime": 1595530875329,
			"_endTime": 1595530875329,
			"_active": false
		},
		"efb73f80-cd16-11ea-8039-356568d92250": {
			"_id": "efb73f80-cd16-11ea-8039-356568d92250",
			"_userId": "138398309776621569",
			"_moderatorId": "138398309776621569",
			"_roles": [
				"319291359376703488",
				"326496765115236352",
				"358366430015651842",
				"326496822128541697",
				"319297882375061508",
				"369882748283781121",
				"386405611404918785",
				"407885899515297795",
				"430453030333317123",
				"442878467818782721",
				"446958987804672000",
				"449429764504158219",
				"498030140681617408",
				"502237725240590346",
				"506733632065503232",
				"544024681943007233",
				"469632830306123796",
				"525159363976101908",
				"607456710403293205",
				"624772284963356692",
				"607463652869537792",
				"639937925064294401",
				"634071561988603904"
			],
			"_startTime": "2020-07-23T19:01:38.296Z",
			"_lastEditedTime": 1595530918720,
			"_endTime": 1595530918720,
			"_active": false
		},
		"0fc5e1f0-cd17-11ea-8039-356568d92250": {
			"_id": "0fc5e1f0-cd17-11ea-8039-356568d92250",
			"_userId": "174037015858249730",
			"_moderatorId": "173026718423056384",
			"_roles": [
				"319291359376703488",
				"326496765115236352",
				"319305211283767297",
				"358366430015651842",
				"326496822128541697",
				"326496847248228352",
				"369882748283781121",
				"386405611404918785",
				"407885899515297795",
				"442878467818782721",
				"446958987804672000",
				"506733632065503232",
				"449429764504158219",
				"544024681943007233",
				"607463652869537792",
				"634071561988603904",
				"525159363976101908",
				"607456710403293205",
				"642491995130167327",
				"645166722273247233"
			],
			"_startTime": "2020-07-23T19:02:32.079Z",
			"_lastEditedTime": 1595531012046,
			"_endTime": 1595531012046,
			"_active": false
		},
		"12dd5b20-cd17-11ea-8039-356568d92250": {
			"_id": "12dd5b20-cd17-11ea-8039-356568d92250",
			"_userId": "108378183253913600",
			"_moderatorId": "108378183253913600",
			"_roles": [
				"319291359376703488",
				"326496822128541697",
				"430453030333317123",
				"469632830306123796",
				"504429105698308118",
				"506733632065503232",
				"522847404341592074",
				"607456710403293205",
				"607463652869537792",
				"611722424991612970"
			],
			"_startTime": "2020-07-23T19:02:37.266Z",
			"_lastEditedTime": 1595531017230,
			"_endTime": 1595531017230,
			"_active": false
		},
		"04ad31f0-cd18-11ea-8039-356568d92250": {
			"_id": "04ad31f0-cd18-11ea-8039-356568d92250",
			"_userId": "177423709114466304",
			"_moderatorId": "173026718423056384",
			"_roles": [
				"319291359376703488",
				"326496822128541697",
				"326496847248228352",
				"358366430015651842",
				"369882748283781121",
				"386405611404918785",
				"430453030333317123",
				"442878467818782721",
				"449429764504158219",
				"469632830306123796",
				"498030140681617408",
				"502237725240590346",
				"506733632065503232",
				"525159363976101908",
				"544024681943007233",
				"611722424991612970",
				"634071561988603904",
				"639937925064294401",
				"645166722273247233",
				"680192503366156318"
			],
			"_startTime": "2020-07-23T19:09:22.959Z",
			"_lastEditedTime": 1595531363916,
			"_endTime": 1595531363916,
			"_active": false
		},
		"08dd3520-cd1a-11ea-8039-356568d92250": {
			"_id": "08dd3520-cd1a-11ea-8039-356568d92250",
			"_userId": "177423709114466304",
			"_moderatorId": "173026718423056384",
			"_roles": [
				"319291359376703488",
				"326496822128541697",
				"326496847248228352",
				"358366430015651842",
				"369882748283781121",
				"386405611404918785",
				"430453030333317123",
				"442878467818782721",
				"449429764504158219",
				"469632830306123796",
				"498030140681617408",
				"502237725240590346",
				"506733632065503232",
				"525159363976101908",
				"544024681943007233",
				"611722424991612970",
				"634071561988603904",
				"639937925064294401",
				"645166722273247233",
				"680192503366156318"
			],
			"_startTime": "2020-07-23T19:23:48.978Z",
			"_lastEditedTime": 1595532249467,
			"_endTime": 1595532249467,
			"_active": false
		},
		"6dc70060-cd1f-11ea-8039-356568d92250": {
			"_id": "6dc70060-cd1f-11ea-8039-356568d92250",
			"_userId": "177423709114466304",
			"_moderatorId": "177423709114466304",
			"_roles": [
				"319291359376703488",
				"326496822128541697",
				"358366430015651842",
				"326496847248228352",
				"369882748283781121",
				"386405611404918785",
				"430453030333317123",
				"442878467818782721",
				"498030140681617408",
				"506733632065503232",
				"502237725240590346",
				"449429764504158219",
				"544024681943007233",
				"634071561988603904",
				"639937925064294401",
				"645166722273247233",
				"469632830306123796",
				"525159363976101908",
				"680192503366156318",
				"611722424991612970"
			],
			"_startTime": "2020-07-23T20:02:25.766Z",
			"_lastEditedTime": 1595541862079,
			"_endTime": 1595541862079,
			"_active": false
		},
		"d2348c30-cd23-11ea-8039-356568d92250": {
			"_id": "d2348c30-cd23-11ea-8039-356568d92250",
			"_userId": "260288776360820736",
			"_moderatorId": "173026718423056384",
			"_roles": [
				"319291359376703488",
				"319373030339903488",
				"326496765115236352",
				"326496847248228352",
				"326496822128541697",
				"358366430015651842",
				"369882748283781121",
				"386405611404918785",
				"430453030333317123",
				"442878467818782721",
				"498030140681617408",
				"449429764504158219",
				"506733632065503232",
				"544024681943007233",
				"607463652869537792",
				"634071561988603904",
				"469632830306123796",
				"525159363976101908",
				"607456710403293205",
				"639937925064294401",
				"645166722273247233",
				"611722424991612970"
			],
			"_startTime": "2020-07-23T20:33:52.243Z",
			"_lastEditedTime": 1595536433204,
			"_endTime": 1595536433204,
			"_active": false
		},
		"5428ef90-cd53-11ea-ad01-7374a96d551b": {
			"_id": "5428ef90-cd53-11ea-ad01-7374a96d551b",
			"_userId": "720246096235855882",
			"_moderatorId": "260288776360820736",
			"_roles": [
				"319291359376703488",
				"672360312963334155"
			],
			"_startTime": "2020-07-24T02:13:56.617Z",
			"_lastEditedTime": 1595557276310,
			"_endTime": 1595557276310,
			"_active": false
		},
		"b3424100-d11a-11ea-85a9-21ffa8d806bc": {
			"_id": "b3424100-d11a-11ea-85a9-21ffa8d806bc",
			"_userId": "260288776360820736",
			"_moderatorId": "260288776360820736",
			"_roles": [
				"319291359376703488",
				"319373030339903488",
				"326496765115236352",
				"326496822128541697",
				"326496847248228352",
				"358366430015651842",
				"369882748283781121",
				"386405611404918785",
				"430453030333317123",
				"442878467818782721",
				"498030140681617408",
				"449429764504158219",
				"506733632065503232",
				"544024681943007233",
				"607463652869537792",
				"634071561988603904",
				"469632830306123796",
				"525159363976101908",
				"607456710403293205",
				"639937925064294401",
				"645166722273247233",
				"611722424991612970"
			],
			"_startTime": "2020-07-28T21:38:39.504Z",
			"_lastEditedTime": 1595972379482,
			"_endTime": 1595972379482,
			"_active": false
		},
		"a74c4860-d173-11ea-bfa5-77c4b3ec419f": {
			"_id": "a74c4860-d173-11ea-bfa5-77c4b3ec419f",
			"_userId": "191286686607474698",
			"_moderatorId": "260288776360820736",
			"_roles": [
				"319291359376703488",
				"326496822128541697",
				"504425280165904384",
				"536616794933428264",
				"502237725240590346",
				"657382118745178122",
				"504430094270332948",
				"607456710403293205"
			],
			"_startTime": "2020-07-29T08:15:24.646Z",
			"_lastEditedTime": 1596010525631,
			"_endTime": 1596010525631,
			"_active": false
		},
		"b6cfd720-d173-11ea-bfa5-77c4b3ec419f": {
			"_id": "b6cfd720-d173-11ea-bfa5-77c4b3ec419f",
			"_userId": "260288776360820736",
			"_moderatorId": "191286686607474698",
			"_roles": [
				"319291359376703488",
				"319373030339903488",
				"326496765115236352",
				"326496847248228352",
				"326496822128541697",
				"358366430015651842",
				"369882748283781121",
				"386405611404918785",
				"430453030333317123",
				"442878467818782721",
				"498030140681617408",
				"449429764504158219",
				"506733632065503232",
				"544024681943007233",
				"607463652869537792",
				"634071561988603904",
				"469632830306123796",
				"525159363976101908",
				"607456710403293205",
				"639937925064294401",
				"645166722273247233",
				"611722424991612970"
			],
			"_startTime": "2020-07-29T08:15:50.674Z",
			"_lastEditedTime": 1596010551597,
			"_endTime": 1596010551597,
			"_active": false
		},
		"03b0ca30-d1f2-11ea-97da-0fe18e837696": {
			"_id": "03b0ca30-d1f2-11ea-97da-0fe18e837696",
			"_userId": "191286686607474698",
			"_moderatorId": "138398309776621569",
			"_roles": [
				"319291359376703488",
				"326496822128541697",
				"504425280165904384",
				"536616794933428264",
				"502237725240590346",
				"657382118745178122",
				"504430094270332948",
				"607456710403293205"
			],
			"_startTime": "2020-07-29T23:19:56.243Z",
			"_lastEditedTime": 1596064856227,
			"_endTime": 1596064856227,
			"_active": false
		},
		"9aad41e0-d1f5-11ea-9a75-252e1e462d19": {
			"_id": "9aad41e0-d1f5-11ea-9a75-252e1e462d19",
			"_userId": "138398309776621569",
			"_moderatorId": "260288776360820736",
			"_roles": [
				"319291359376703488",
				"326496765115236352",
				"358366430015651842",
				"326496822128541697",
				"319297882375061508",
				"369882748283781121",
				"386405611404918785",
				"407885899515297795",
				"430453030333317123",
				"442878467818782721",
				"446958987804672000",
				"449429764504158219",
				"498030140681617408",
				"502237725240590346",
				"506733632065503232",
				"544024681943007233",
				"469632830306123796",
				"525159363976101908",
				"607456710403293205",
				"624772284963356692",
				"607463652869537792",
				"639937925064294401",
				"634071561988603904"
			],
			"_startTime": "2020-07-29T23:45:38.046Z",
			"_lastEditedTime": 1596066398009,
			"_endTime": 1596066398009,
			"_active": false
		},
		"f4c190f0-38e3-11eb-bfaa-0502355b574f": {
			"_id": "f4c190f0-38e3-11eb-bfaa-0502355b574f",
			"_userId": "191286686607474698",
			"_moderatorId": "260288776360820736",
			"_roles": [
				"502237725240590346",
				"657382118745178122",
				"504425280165904384",
				"607456710403293205",
				"536616794933428264",
				"629762602863689738",
				"326496822128541697",
				"319291359376703488"
			],
			"_startTime": "2020-12-07T23:28:47.999Z",
			"_lastEditedTime": 1607383747227,
			"_endTime": 1607383747227,
			"_active": false
		},
		"1e889aa0-38e4-11eb-bfaa-0502355b574f": {
			"_id": "1e889aa0-38e4-11eb-bfaa-0502355b574f",
			"_userId": "138398309776621569",
			"_moderatorId": "108378183253913600",
			"_roles": [
				"319297882375061508",
				"525159363976101908",
				"442878467818782721",
				"624772284963356692",
				"502237725240590346",
				"449429764504158219",
				"369882748283781121",
				"740381879378772058",
				"639937925064294401",
				"607456710403293205",
				"358366430015651842",
				"680192503366156318",
				"430453030333317123",
				"446958987804672000",
				"634071561988603904",
				"386405611404918785",
				"407885899515297795",
				"498030140681617408",
				"506733632065503232",
				"469632830306123796",
				"544024681943007233",
				"326496822128541697",
				"326496765115236352",
				"319291359376703488"
			],
			"_startTime": "2020-12-07T23:29:58.090Z",
			"_lastEditedTime": 1607383857912,
			"_endTime": 1607383857912,
			"_active": false
		},
		"289c6850-38e4-11eb-bfaa-0502355b574f": {
			"_id": "289c6850-38e4-11eb-bfaa-0502355b574f",
			"_userId": "463799097586090014",
			"_moderatorId": "463799097586090014",
			"_roles": [
				"326496847248228352",
				"326496822128541697",
				"319291359376703488"
			],
			"_startTime": "2020-12-07T23:30:14.997Z",
			"_lastEditedTime": 1607383874878,
			"_endTime": 1607383874878,
			"_active": false
		},
		"59553f30-38e4-11eb-bfaa-0502355b574f": {
			"_id": "59553f30-38e4-11eb-bfaa-0502355b574f",
			"_userId": "463799097586090014",
			"_moderatorId": "463799097586090014",
			"_roles": [
				"326496847248228352",
				"326496822128541697",
				"319291359376703488"
			],
			"_startTime": "2020-12-07T23:31:36.740Z",
			"_lastEditedTime": 1607383956493,
			"_endTime": 1607383956493,
			"_active": false
		},
		"2ecc9890-38f7-11eb-bfaa-0502355b574f": {
			"_id": "2ecc9890-38f7-11eb-bfaa-0502355b574f",
			"_userId": "174037015858249730",
			"_moderatorId": "304354673647812608",
			"_roles": [
				"525159363976101908",
				"442878467818782721",
				"326496847248228352",
				"642491995130167327",
				"449429764504158219",
				"369882748283781121",
				"740381879378772058",
				"607456710403293205",
				"358366430015651842",
				"446958987804672000",
				"634071561988603904",
				"319305211283767297",
				"386405611404918785",
				"407885899515297795",
				"506733632065503232",
				"645166722273247233",
				"544024681943007233",
				"326496822128541697",
				"326496765115236352",
				"319291359376703488"
			],
			"_startTime": "2020-12-08T01:46:25.817Z",
			"_lastEditedTime": 1607392525668,
			"_endTime": 1607392525668,
			"_active": false
		},
		"1b648730-38f8-11eb-bfaa-0502355b574f": {
			"_id": "1b648730-38f8-11eb-bfaa-0502355b574f",
			"_userId": "304354673647812608",
			"_moderatorId": "108378183253913600",
			"_roles": [
				"504425452706725897",
				"326496847248228352",
				"502237725240590346",
				"369882748283781121",
				"639937925064294401",
				"607456710403293205",
				"680192503366156318",
				"430453030333317123",
				"634071561988603904",
				"498030140681617408",
				"506733632065503232",
				"645166722273247233",
				"469632830306123796",
				"611722424991612970",
				"544024681943007233",
				"326496822128541697",
				"657691439760670750",
				"319291359376703488"
			],
			"_startTime": "2020-12-08T01:53:02.755Z",
			"_lastEditedTime": 1607392922621,
			"_endTime": 1607392922621,
			"_active": false
		},
		"894c8a10-3900-11eb-bfaa-0502355b574f": {
			"_id": "894c8a10-3900-11eb-bfaa-0502355b574f",
			"_userId": "304354673647812608",
			"_moderatorId": "174037015858249730",
			"_roles": [
				"504425452706725897",
				"326496847248228352",
				"502237725240590346",
				"369882748283781121",
				"639937925064294401",
				"607456710403293205",
				"680192503366156318",
				"430453030333317123",
				"634071561988603904",
				"498030140681617408",
				"506733632065503232",
				"645166722273247233",
				"469632830306123796",
				"611722424991612970",
				"544024681943007233",
				"326496822128541697",
				"657691439760670750",
				"319291359376703488"
			],
			"_startTime": "2020-12-08T02:53:23.121Z",
			"_lastEditedTime": 1607396027152,
			"_endTime": 1607396027152,
			"_active": false
		},
		"d9641450-3900-11eb-bfaa-0502355b574f": {
			"_id": "d9641450-3900-11eb-bfaa-0502355b574f",
			"_userId": "304354673647812608",
			"_moderatorId": "108378183253913600",
			"_roles": [
				"504425452706725897",
				"326496847248228352",
				"502237725240590346",
				"369882748283781121",
				"639937925064294401",
				"607456710403293205",
				"680192503366156318",
				"430453030333317123",
				"634071561988603904",
				"498030140681617408",
				"506733632065503232",
				"645166722273247233",
				"469632830306123796",
				"611722424991612970",
				"544024681943007233",
				"326496822128541697",
				"657691439760670750",
				"319291359376703488"
			],
			"_startTime": "2020-12-08T02:55:37.493Z",
			"_lastEditedTime": 1607396317327,
			"_endTime": 1607396317327,
			"_active": false
		},
		"760c7b40-3b3f-11eb-81a5-b568b3d79ca7": {
			"_id": "760c7b40-3b3f-11eb-81a5-b568b3d79ca7",
			"_userId": "191286686607474698",
			"_moderatorId": "108378183253913600",
			"_roles": [
				"502237725240590346",
				"657382118745178122",
				"504425280165904384",
				"607456710403293205",
				"536616794933428264",
				"629762602863689738",
				"326496822128541697",
				"319291359376703488"
			],
			"_startTime": "2020-12-10T23:28:51.444Z",
			"_lastEditedTime": 1607642967473,
			"_endTime": 1607642967473,
			"_active": false
		},
		"43ae0860-3cb8-11eb-855a-a77ac3035e93": {
			"_id": "43ae0860-3cb8-11eb-855a-a77ac3035e93",
			"_userId": "304354673647812608",
			"_moderatorId": "173026718423056384",
			"_roles": [
				"504425452706725897",
				"326496847248228352",
				"502237725240590346",
				"369882748283781121",
				"639937925064294401",
				"607456710403293205",
				"680192503366156318",
				"430453030333317123",
				"634071561988603904",
				"498030140681617408",
				"506733632065503232",
				"645166722273247233",
				"469632830306123796",
				"611722424991612970",
				"544024681943007233",
				"326496822128541697",
				"657691439760670750",
				"319291359376703488"
			],
			"_startTime": 1607804767206,
			"_lastEditedTime": 1607805367068,
			"_endTime": 1607805367068,
			"_active": false
		},
		"4c7dbd50-3cb8-11eb-855a-a77ac3035e93": {
			"_id": "4c7dbd50-3cb8-11eb-855a-a77ac3035e93",
			"_userId": "260288776360820736",
			"_moderatorId": "173026718423056384",
			"_roles": [
				"525159363976101908",
				"442878467818782721",
				"326496847248228352",
				"449429764504158219",
				"369882748283781121",
				"740381879378772058",
				"639937925064294401",
				"607456710403293205",
				"358366430015651842",
				"430453030333317123",
				"634071561988603904",
				"386405611404918785",
				"498030140681617408",
				"506733632065503232",
				"645166722273247233",
				"469632830306123796",
				"611722424991612970",
				"544024681943007233",
				"319373030339903488",
				"326496822128541697",
				"326496765115236352",
				"319291359376703488"
			],
			"_startTime": 1607804781989,
			"_lastEditedTime": 1607804841841,
			"_endTime": 1607804841841,
			"_active": false
		},
		"eba37a70-3db0-11eb-9b08-2fc75493a133": {
			"_id": "eba37a70-3db0-11eb-9b08-2fc75493a133",
			"_userId": "138398309776621569",
			"_moderatorId": "304354673647812608",
			"_roles": [
				"319297882375061508",
				"525159363976101908",
				"442878467818782721",
				"624772284963356692",
				"502237725240590346",
				"449429764504158219",
				"369882748283781121",
				"740381879378772058",
				"639937925064294401",
				"607456710403293205",
				"358366430015651842",
				"680192503366156318",
				"430453030333317123",
				"446958987804672000",
				"634071561988603904",
				"386405611404918785",
				"407885899515297795",
				"498030140681617408",
				"506733632065503232",
				"469632830306123796",
				"544024681943007233",
				"326496822128541697",
				"326496765115236352",
				"319291359376703488"
			],
			"_startTime": 1607911564183,
			"_lastEditedTime": 1607912044011,
			"_endTime": 1607912044011,
			"_active": false
		},
		"5333d170-3db2-11eb-9b08-2fc75493a133": {
			"_id": "5333d170-3db2-11eb-9b08-2fc75493a133",
			"_userId": "138398309776621569",
			"_moderatorId": "138398309776621569",
			"_roles": [
				"319297882375061508",
				"525159363976101908",
				"442878467818782721",
				"624772284963356692",
				"502237725240590346",
				"449429764504158219",
				"369882748283781121",
				"740381879378772058",
				"639937925064294401",
				"607456710403293205",
				"358366430015651842",
				"680192503366156318",
				"430453030333317123",
				"446958987804672000",
				"634071561988603904",
				"386405611404918785",
				"407885899515297795",
				"498030140681617408",
				"506733632065503232",
				"469632830306123796",
				"544024681943007233",
				"326496822128541697",
				"326496765115236352",
				"319291359376703488"
			],
			"_startTime": 1607912167431,
			"_lastEditedTime": 1607912227367,
			"_endTime": 1607912227367,
			"_active": false
		},
		"88b5f1f0-40ac-11eb-8cce-6198f7206672": {
			"_id": "88b5f1f0-40ac-11eb-8cce-6198f7206672",
			"_userId": "147077165895254016",
			"_moderatorId": "108378183253913600",
			"_roles": [
				"525159363976101908",
				"442878467818782721",
				"624772284963356692",
				"504425452706725897",
				"326496847248228352",
				"449429764504158219",
				"369882748283781121",
				"740381879378772058",
				"639937925064294401",
				"607456710403293205",
				"358366430015651842",
				"430453030333317123",
				"634071561988603904",
				"625451891593183233",
				"498030140681617408",
				"506733632065503232",
				"645166722273247233",
				"469632830306123796",
				"611722424991612970",
				"544024681943007233",
				"326496822128541697",
				"319291359376703488"
			],
			"_startTime": 1608239533711,
			"_lastEditedTime": 1608239593514,
			"_endTime": 1608239593514,
			"_active": false
		},
		"c94be7e0-629b-11eb-8c6b-2f352fef9112": {
			"_id": "c94be7e0-629b-11eb-8c6b-2f352fef9112",
			"_userId": "138398309776621569",
			"_moderatorId": "138398309776621569",
			"_roles": [
				"319297882375061508",
				"525159363976101908",
				"442878467818782721",
				"624772284963356692",
				"502237725240590346",
				"449429764504158219",
				"369882748283781121",
				"740381879378772058",
				"639937925064294401",
				"607456710403293205",
				"358366430015651842",
				"794696568674451486",
				"680192503366156318",
				"430453030333317123",
				"446958987804672000",
				"634071561988603904",
				"386405611404918785",
				"407885899515297795",
				"498030140681617408",
				"506733632065503232",
				"797984877197656135",
				"469632830306123796",
				"544024681943007233",
				"326496822128541697",
				"326496765115236352",
				"319291359376703488"
			],
			"_startTime": 1611970680158,
			"_lastEditedTime": 1611970740129,
			"_endTime": 1611970740129,
			"_active": false
		},
		"e2e196a0-629b-11eb-8c6b-2f352fef9112": {
			"_id": "e2e196a0-629b-11eb-8c6b-2f352fef9112",
			"_userId": "211283870736187394",
			"_moderatorId": "174037015858249730",
			"_roles": [
				"319291359376703488",
				"326496847248228352",
				"672360312963334155",
				"358366430015651842",
				"794696568674451486",
				"523769606263930897",
				"680192503366156318",
				"634071561988603904",
				"326496822128541697"
			],
			"_startTime": 1611970723082,
			"_lastEditedTime": 1611971632811,
			"_endTime": 1611971632811,
			"_active": false
		},
		"ed0542d0-629b-11eb-8c6b-2f352fef9112": {
			"_id": "ed0542d0-629b-11eb-8c6b-2f352fef9112",
			"_userId": "177423709114466304",
			"_moderatorId": "177423709114466304",
			"_roles": [
				"525159363976101908",
				"442878467818782721",
				"326496847248228352",
				"449429764504158219",
				"369882748283781121",
				"639937925064294401",
				"358366430015651842",
				"794696568674451486",
				"680192503366156318",
				"430453030333317123",
				"634071561988603904",
				"386405611404918785",
				"498030140681617408",
				"506733632065503232",
				"645166722273247233",
				"797984877197656135",
				"611722424991612970",
				"544024681943007233",
				"326496822128541697",
				"319291359376703488"
			],
			"_startTime": 1611970740094,
			"_lastEditedTime": 1611970799900,
			"_endTime": 1611970799900,
			"_active": false
		},
		"fc874af0-629b-11eb-8c6b-2f352fef9112": {
			"_id": "fc874af0-629b-11eb-8c6b-2f352fef9112",
			"_userId": "191286686607474698",
			"_moderatorId": "108378183253913600",
			"_roles": [
				"502237725240590346",
				"657382118745178122",
				"504425280165904384",
				"607456710403293205",
				"536616794933428264",
				"629762602863689738",
				"326496822128541697",
				"319291359376703488"
			],
			"_startTime": 1611970766111,
			"_lastEditedTime": 1611970825965,
			"_endTime": 1611970825965,
			"_active": false
		},
		"f44c1860-629c-11eb-8c6b-2f352fef9112": {
			"_id": "f44c1860-629c-11eb-8c6b-2f352fef9112",
			"_userId": "108378183253913600",
			"_moderatorId": "191286686607474698",
			"_roles": [
				"607456710403293205",
				"430453030333317123",
				"504429105698308118",
				"522847404341592074",
				"506733632065503232",
				"797984877197656135",
				"469632830306123796",
				"611722424991612970",
				"326496822128541697",
				"319291359376703488"
			],
			"_startTime": 1611971181798,
			"_lastEditedTime": 1611971421675,
			"_endTime": 1611971421675,
			"_active": false
		},
		"4cbc6d90-9cab-11eb-a0b1-371d35c48e59": {
			"_id": "4cbc6d90-9cab-11eb-a0b1-371d35c48e59",
			"_userId": "177423709114466304",
			"_moderatorId": "108378183253913600",
			"_roles": [
				"525159363976101908",
				"442878467818782721",
				"326496847248228352",
				"449429764504158219",
				"369882748283781121",
				"639937925064294401",
				"358366430015651842",
				"794696568674451486",
				"680192503366156318",
				"430453030333317123",
				"634071561988603904",
				"386405611404918785",
				"498030140681617408",
				"829385601458372618",
				"506733632065503232",
				"645166722273247233",
				"797984877197656135",
				"611722424991612970",
				"544024681943007233",
				"326496822128541697",
				"319291359376703488"
			],
			"_startTime": 1618354510569,
			"_lastEditedTime": 1618354570207,
			"_endTime": 1618354570207,
			"_active": false
		},
		"94d21a30-9cab-11eb-a0b1-371d35c48e59": {
			"_id": "94d21a30-9cab-11eb-a0b1-371d35c48e59",
			"_userId": "108378183253913600",
			"_moderatorId": "108378183253913600",
			"_roles": [
				"607456710403293205",
				"430453030333317123",
				"504429105698308118",
				"522847404341592074",
				"506733632065503232",
				"797984877197656135",
				"469632830306123796",
				"611722424991612970",
				"326496822128541697",
				"319291359376703488"
			],
			"_startTime": 1618354631508,
			"_lastEditedTime": 1618354632324,
			"_endTime": 1618354632324,
			"_active": false
		},
		"0591c7c0-9cac-11eb-a0b1-371d35c48e59": {
			"_id": "0591c7c0-9cac-11eb-a0b1-371d35c48e59",
			"_userId": "108378183253913600",
			"_moderatorId": "108378183253913600",
			"_roles": [
				"607456710403293205",
				"430453030333317123",
				"504429105698308118",
				"522847404341592074",
				"506733632065503232",
				"797984877197656135",
				"469632830306123796",
				"611722424991612970",
				"326496822128541697",
				"319291359376703488"
			],
			"_startTime": 1618354820668,
			"_lastEditedTime": 1618354881474,
			"_endTime": 1618354881474,
			"_active": false
		},
		"d3ffc2c0-ba56-11eb-b884-3fc8901eadac": {
			"_id": "d3ffc2c0-ba56-11eb-b884-3fc8901eadac",
			"_userId": "260288776360820736",
			"_moderatorId": "174037015858249730",
			"_roles": [
				"525159363976101908",
				"442878467818782721",
				"326496847248228352",
				"796099689866067998",
				"642491995130167327",
				"449429764504158219",
				"369882748283781121",
				"740381879378772058",
				"639937925064294401",
				"607456710403293205",
				"358366430015651842",
				"794696568674451486",
				"826525604127572009",
				"430453030333317123",
				"634071561988603904",
				"386405611404918785",
				"498030140681617408",
				"506733632065503232",
				"645166722273247233",
				"797984877197656135",
				"469632830306123796",
				"611722424991612970",
				"544024681943007233",
				"319373030339903488",
				"326496822128541697",
				"326496765115236352",
				"319291359376703488"
			],
			"_startTime": 1621616765165,
			"_lastEditedTime": 1621616806776,
			"_endTime": 1621616806776,
			"_active": false
		},
		"02c77800-ba57-11eb-b884-3fc8901eadac": {
			"_id": "02c77800-ba57-11eb-b884-3fc8901eadac",
			"_userId": "177423709114466304",
			"_moderatorId": "260288776360820736",
			"_roles": [
				"326496847248228352",
				"369882748283781121",
				"639937925064294401",
				"794696568674451486",
				"386405611404918785",
				"504429105698308118",
				"829385601458372618",
				"797984877197656135",
				"319291359376703488"
			],
			"_startTime": 1621616843648,
			"_lastEditedTime": 1621616844613,
			"_endTime": 1621616844613,
			"_active": false
		},
		"15aa5e60-ba57-11eb-b884-3fc8901eadac": {
			"_id": "15aa5e60-ba57-11eb-b884-3fc8901eadac",
			"_userId": "138398309776621569",
			"_moderatorId": "260288776360820736",
			"_roles": [
				"319297882375061508",
				"525159363976101908",
				"442878467818782721",
				"624772284963356692",
				"502237725240590346",
				"449429764504158219",
				"369882748283781121",
				"740381879378772058",
				"639937925064294401",
				"607456710403293205",
				"358366430015651842",
				"794696568674451486",
				"680192503366156318",
				"430453030333317123",
				"446958987804672000",
				"634071561988603904",
				"407885899515297795",
				"498030140681617408",
				"506733632065503232",
				"797984877197656135",
				"469632830306123796",
				"544024681943007233",
				"326496822128541697",
				"326496765115236352",
				"319291359376703488"
			],
			"_startTime": 1621616875335,
			"_lastEditedTime": 1621616876255,
			"_endTime": 1621616876255,
			"_active": false
		},
		"39593200-ba57-11eb-b884-3fc8901eadac": {
			"_id": "39593200-ba57-11eb-b884-3fc8901eadac",
			"_userId": "260288776360820736",
			"_moderatorId": "260288776360820736",
			"_roles": [
				"525159363976101908",
				"442878467818782721",
				"326496847248228352",
				"796099689866067998",
				"642491995130167327",
				"449429764504158219",
				"369882748283781121",
				"740381879378772058",
				"639937925064294401",
				"607456710403293205",
				"358366430015651842",
				"794696568674451486",
				"826525604127572009",
				"430453030333317123",
				"634071561988603904",
				"386405611404918785",
				"498030140681617408",
				"506733632065503232",
				"645166722273247233",
				"797984877197656135",
				"469632830306123796",
				"611722424991612970",
				"544024681943007233",
				"319373030339903488",
				"326496822128541697",
				"326496765115236352",
				"319291359376703488"
			],
			"_startTime": 1621616935200,
			"_lastEditedTime": 1621616995120,
			"_endTime": 1621616995120,
			"_active": false
		},
		"ab6b0210-ba57-11eb-b884-3fc8901eadac": {
			"_id": "ab6b0210-ba57-11eb-b884-3fc8901eadac",
			"_userId": "260288776360820736",
			"_moderatorId": "260288776360820736",
			"_roles": [
				"525159363976101908",
				"442878467818782721",
				"326496847248228352",
				"796099689866067998",
				"642491995130167327",
				"449429764504158219",
				"369882748283781121",
				"740381879378772058",
				"639937925064294401",
				"607456710403293205",
				"358366430015651842",
				"794696568674451486",
				"826525604127572009",
				"430453030333317123",
				"634071561988603904",
				"386405611404918785",
				"498030140681617408",
				"506733632065503232",
				"645166722273247233",
				"797984877197656135",
				"469632830306123796",
				"611722424991612970",
				"544024681943007233",
				"319373030339903488",
				"326496822128541697",
				"326496765115236352",
				"319291359376703488"
			],
			"_startTime": 1621617126577,
			"_lastEditedTime": 1621617159359,
			"_endTime": 1621617159359,
			"_active": false
		},
		"3812d9e0-ba58-11eb-b884-3fc8901eadac": {
			"_id": "3812d9e0-ba58-11eb-b884-3fc8901eadac",
			"_userId": "260288776360820736",
			"_moderatorId": "260288776360820736",
			"_roles": [
				"525159363976101908",
				"442878467818782721",
				"326496847248228352",
				"796099689866067998",
				"642491995130167327",
				"449429764504158219",
				"369882748283781121",
				"740381879378772058",
				"639937925064294401",
				"607456710403293205",
				"358366430015651842",
				"794696568674451486",
				"826525604127572009",
				"430453030333317123",
				"634071561988603904",
				"386405611404918785",
				"498030140681617408",
				"506733632065503232",
				"645166722273247233",
				"797984877197656135",
				"469632830306123796",
				"611722424991612970",
				"544024681943007233",
				"326496822128541697",
				"326496765115236352",
				"319291359376703488"
			],
			"_startTime": 1621617362558,
			"_lastEditedTime": 1621617372301,
			"_endTime": 1621617372301,
			"_active": false
		},
		"4610da10-ba58-11eb-b884-3fc8901eadac": {
			"_id": "4610da10-ba58-11eb-b884-3fc8901eadac",
			"_userId": "287188227667001345",
			"_moderatorId": "260288776360820736",
			"_roles": [
				"525159363976101908",
				"319407070291951616",
				"326496847248228352",
				"449429764504158219",
				"369882748283781121",
				"794696568674451486",
				"430453030333317123",
				"446958987804672000",
				"634071561988603904",
				"407885899515297795",
				"498030140681617408",
				"469632830306123796",
				"326496822128541697",
				"326496765115236352",
				"319291359376703488"
			],
			"_startTime": 1621617386033,
			"_lastEditedTime": 1621617395854,
			"_endTime": 1621617395854,
			"_active": false
		},
		"e2c1b260-ba5a-11eb-a9f8-fd7c3a671177": {
			"_id": "e2c1b260-ba5a-11eb-a9f8-fd7c3a671177",
			"_userId": "260288776360820736",
			"_moderatorId": "260288776360820736",
			"_roles": [
				"525159363976101908",
				"442878467818782721",
				"326496847248228352",
				"796099689866067998",
				"642491995130167327",
				"449429764504158219",
				"369882748283781121",
				"740381879378772058",
				"639937925064294401",
				"607456710403293205",
				"358366430015651842",
				"794696568674451486",
				"826525604127572009",
				"430453030333317123",
				"634071561988603904",
				"386405611404918785",
				"498030140681617408",
				"506733632065503232",
				"645166722273247233",
				"797984877197656135",
				"469632830306123796",
				"611722424991612970",
				"544024681943007233",
				"319373030339903488",
				"326496822128541697",
				"326496765115236352",
				"319291359376703488"
			],
			"_startTime": 1621618507910,
			"_lastEditedTime": 1621618518199,
			"_endTime": 1621618518199,
			"_active": false
		},
		"fef27e60-ba5a-11eb-8aa0-f906549805a0": {
			"_id": "fef27e60-ba5a-11eb-8aa0-f906549805a0",
			"_userId": "260288776360820736",
			"_moderatorId": "260288776360820736",
			"_roles": [
				"525159363976101908",
				"442878467818782721",
				"326496847248228352",
				"796099689866067998",
				"642491995130167327",
				"449429764504158219",
				"369882748283781121",
				"740381879378772058",
				"639937925064294401",
				"607456710403293205",
				"358366430015651842",
				"794696568674451486",
				"826525604127572009",
				"430453030333317123",
				"634071561988603904",
				"386405611404918785",
				"498030140681617408",
				"506733632065503232",
				"645166722273247233",
				"797984877197656135",
				"469632830306123796",
				"611722424991612970",
				"544024681943007233",
				"319373030339903488",
				"326496822128541697",
				"326496765115236352",
				"319291359376703488"
			],
			"_startTime": 1621618555207,
			"_lastEditedTime": 1621618693370,
			"_endTime": "Dec 31 23:59:59 2099 UTC",
			"_active": true
		},
		"22fe2c70-e015-11eb-984c-0b473943e4be": {
			"_id": "22fe2c70-e015-11eb-984c-0b473943e4be",
			"_userId": "304354673647812608",
			"_moderatorId": "138398309776621569",
			"_roles": [
				"525159363976101908",
				"442878467818782721",
				"326496847248228352",
				"502237725240590346",
				"449429764504158219",
				"369882748283781121",
				"639937925064294401",
				"607456710403293205",
				"358366430015651842",
				"794696568674451486",
				"680192503366156318",
				"430453030333317123",
				"634071561988603904",
				"386405611404918785",
				"498030140681617408",
				"506733632065503232",
				"645166722273247233",
				"797984877197656135",
				"469632830306123796",
				"611722424991612970",
				"544024681943007233",
				"326496822128541697",
				"657691439760670750"
			],
			"_startTime": 1625766695096,
			"_lastEditedTime": 1625767295000,
			"_endTime": 1625767295000,
			"_active": false
		},
		"3359cee0-e019-11eb-984c-0b473943e4be": {
			"_id": "3359cee0-e019-11eb-984c-0b473943e4be",
			"_userId": "174037015858249730",
			"_moderatorId": "304354673647812608",
			"_roles": [
				"319305211283767297"
			],
			"_startTime": 1625768440526,
			"_lastEditedTime": 1625768500337,
			"_endTime": 1625768500337,
			"_active": false
		},
		"4b743d60-e01b-11eb-ab23-e9bafed08d57": {
			"_id": "4b743d60-e01b-11eb-ab23-e9bafed08d57",
			"_userId": "463799097586090014",
			"_moderatorId": "463799097586090014",
			"_roles": [
				"326496847248228352",
				"607456710403293205",
				"326496822128541697"
			],
			"_startTime": 1625769339958,
			"_lastEditedTime": 1625769399827,
			"_endTime": 1625769399827,
			"_active": false
		},
		"5995a410-e01b-11eb-ab23-e9bafed08d57": {
			"_id": "5995a410-e01b-11eb-ab23-e9bafed08d57",
			"_userId": "304354673647812608",
			"_moderatorId": "304354673647812608",
			"_roles": [
				"525159363976101908",
				"442878467818782721",
				"326496847248228352",
				"502237725240590346",
				"449429764504158219",
				"369882748283781121",
				"639937925064294401",
				"607456710403293205",
				"358366430015651842",
				"794696568674451486",
				"680192503366156318",
				"430453030333317123",
				"634071561988603904",
				"386405611404918785",
				"498030140681617408",
				"506733632065503232",
				"645166722273247233",
				"797984877197656135",
				"469632830306123796",
				"611722424991612970",
				"544024681943007233",
				"326496822128541697",
				"657691439760670750"
			],
			"_startTime": 1625769363665,
			"_lastEditedTime": 1625769423463,
			"_endTime": 1625769423463,
			"_active": false
		},
		"94613730-e01b-11eb-ab23-e9bafed08d57": {
			"_id": "94613730-e01b-11eb-ab23-e9bafed08d57",
			"_userId": "463799097586090014",
			"_moderatorId": "463799097586090014",
			"_roles": [
				"326496847248228352",
				"607456710403293205",
				"326496822128541697"
			],
			"_startTime": 1625769462307,
			"_lastEditedTime": 1625769582173,
			"_endTime": 1625769582173,
			"_active": false
		},
		"ca062030-e01b-11eb-ab23-e9bafed08d57": {
			"_id": "ca062030-e01b-11eb-ab23-e9bafed08d57",
			"_userId": "304354673647812608",
			"_moderatorId": "463799097586090014",
			"_roles": [
				"525159363976101908",
				"442878467818782721",
				"326496847248228352",
				"502237725240590346",
				"449429764504158219",
				"369882748283781121",
				"639937925064294401",
				"607456710403293205",
				"358366430015651842",
				"794696568674451486",
				"680192503366156318",
				"430453030333317123",
				"634071561988603904",
				"386405611404918785",
				"498030140681617408",
				"506733632065503232",
				"645166722273247233",
				"797984877197656135",
				"469632830306123796",
				"611722424991612970",
				"544024681943007233",
				"326496822128541697",
				"657691439760670750"
			],
			"_startTime": 1625769552307,
			"_lastEditedTime": 1625769851935,
			"_endTime": 1625769851935,
			"_active": false
		},
		"e55eb4a0-e01b-11eb-ab23-e9bafed08d57": {
			"_id": "e55eb4a0-e01b-11eb-ab23-e9bafed08d57",
			"_userId": "138398309776621569",
			"_moderatorId": "304354673647812608",
			"_roles": [
				"319297882375061508",
				"525159363976101908",
				"442878467818782721",
				"624772284963356692",
				"502237725240590346",
				"449429764504158219",
				"369882748283781121",
				"740381879378772058",
				"639937925064294401",
				"607456710403293205",
				"358366430015651842",
				"794696568674451486",
				"680192503366156318",
				"430453030333317123",
				"446958987804672000",
				"634071561988603904",
				"407885899515297795",
				"498030140681617408",
				"506733632065503232",
				"797984877197656135",
				"469632830306123796",
				"544024681943007233",
				"326496822128541697",
				"326496765115236352"
			],
			"_startTime": 1625769598186,
			"_lastEditedTime": 1625769657986,
			"_endTime": 1625769657986,
			"_active": false
		},
		"1af27800-e10b-11eb-ab23-e9bafed08d57": {
			"_id": "1af27800-e10b-11eb-ab23-e9bafed08d57",
			"_userId": "463799097586090014",
			"_moderatorId": "304354673647812608",
			"_roles": [
				"326496847248228352",
				"607456710403293205",
				"326496822128541697"
			],
			"_startTime": 1625872337793,
			"_lastEditedTime": 1625872397618,
			"_endTime": 1625872397618,
			"_active": false
		},
		"1f39bea0-e10b-11eb-ab23-e9bafed08d57": {
			"_id": "1f39bea0-e10b-11eb-ab23-e9bafed08d57",
			"_userId": "304354673647812608",
			"_moderatorId": "304354673647812608",
			"_roles": [
				"525159363976101908",
				"442878467818782721",
				"326496847248228352",
				"502237725240590346",
				"449429764504158219",
				"369882748283781121",
				"639937925064294401",
				"607456710403293205",
				"358366430015651842",
				"794696568674451486",
				"680192503366156318",
				"430453030333317123",
				"634071561988603904",
				"386405611404918785",
				"498030140681617408",
				"506733632065503232",
				"645166722273247233",
				"797984877197656135",
				"469632830306123796",
				"611722424991612970",
				"544024681943007233",
				"326496822128541697",
				"657691439760670750"
			],
			"_startTime": 1625872344970,
			"_lastEditedTime": 1625872404739,
			"_endTime": 1625872404739,
			"_active": false
		},
		"525308d0-e10d-11eb-ab23-e9bafed08d57": {
			"_id": "525308d0-e10d-11eb-ab23-e9bafed08d57",
			"_userId": "304354673647812608",
			"_moderatorId": "260288776360820736",
			"_roles": [
				"525159363976101908",
				"442878467818782721",
				"326496847248228352",
				"502237725240590346",
				"449429764504158219",
				"369882748283781121",
				"639937925064294401",
				"607456710403293205",
				"358366430015651842",
				"794696568674451486",
				"680192503366156318",
				"430453030333317123",
				"634071561988603904",
				"386405611404918785",
				"498030140681617408",
				"506733632065503232",
				"645166722273247233",
				"797984877197656135",
				"469632830306123796",
				"611722424991612970",
				"544024681943007233",
				"326496822128541697",
				"657691439760670750"
			],
			"_startTime": 1625873289693,
			"_lastEditedTime": 1625873311406,
			"_endTime": 1625873311406,
			"_active": false
		},
		"825d2958-a6d8-4d0d-9502-ec85c88e4119": {
			"_id": "825d2958-a6d8-4d0d-9502-ec85c88e4119",
			"_userId": "121027813028528128",
			"_moderatorId": "138398309776621569",
			"_roles": [
				"326496847248228352",
				"358366430015651842",
				"797984877197656135",
				"326496822128541697"
			],
			"_startTime": 1632430012821,
			"_lastEditedTime": 1632430072799,
			"_endTime": 1632430072799,
			"_active": false
		},
		"a21397ef-5ea0-4a5a-82b2-2a8fb3a436de": {
			"_id": "a21397ef-5ea0-4a5a-82b2-2a8fb3a436de",
			"_userId": "138398309776621569",
			"_moderatorId": "138398309776621569",
			"_roles": [
				"607456710403293205",
				"449429764504158219",
				"446958987804672000",
				"358366430015651842",
				"407885899515297795",
				"794696568674451486",
				"624772284963356692",
				"740381879378772058",
				"525159363976101908",
				"319297882375061508",
				"634071561988603904",
				"502237725240590346",
				"544024681943007233",
				"506733632065503232",
				"430453030333317123",
				"469632830306123796",
				"369882748283781121",
				"498030140681617408",
				"797984877197656135",
				"639937925064294401",
				"442878467818782721",
				"326496847248228352",
				"326496822128541697",
				"680192503366156318",
				"326496765115236352"
			],
			"_startTime": 1634750700751,
			"_lastEditedTime": 1634750760674,
			"_endTime": 1634750760674,
			"_active": false
		}
	},
	"custom": {
		"commands": {
			"eh": {
				"_name": "eh",
				"_owner": "260288776360820736",
				"_content": "https:\u002F\u002Fcdn.discordapp.com\u002Fattachments\u002F407886123206180864\u002F739412872878096394\u002FLloyd_fine.png",
				"_creationDate": 1596360166619,
				"_lastUsedDate": 1631063533860,
				"_useCount": 21
			},
			"randy": {
				"_name": "randy",
				"_owner": "138398309776621569",
				"_content": "https:\u002F\u002Fcdn.discordapp.com\u002Fattachments\u002F319291473784995840\u002F741140460231458846\u002FRandy_Googly.png",
				"_creationDate": 1596772080347,
				"_lastUsedDate": 1639521364105,
				"_useCount": 28
			},
			"flake": {
				"_name": "flake",
				"_owner": "138398309776621569",
				"_content": "https:\u002F\u002Fcdn.discordapp.com\u002Fattachments\u002F572937294504394762\u002F743907245208895649\u002Fsketch-1595292523050.png",
				"_creationDate": 1597431708549,
				"_lastUsedDate": 1636751709535,
				"_useCount": 9
			},
			"flakes": {
				"_name": "flakes",
				"_owner": "138398309776621569",
				"_content": "https:\u002F\u002Fcdn.discordapp.com\u002Fattachments\u002F572937294504394762\u002F743907283033129030\u002Fsketch-1595292523050.png",
				"_creationDate": 1597431717547,
				"_lastUsedDate": 1621371963033,
				"_useCount": 13
			},
			"astolfo": {
				"_name": "astolfo",
				"_owner": "138398309776621569",
				"_content": "https:\u002F\u002Fcdn.discordapp.com\u002Fattachments\u002F572937294504394762\u002F743908949778104421\u002FAstolfo.png",
				"_creationDate": 1597432114911,
				"_lastUsedDate": 1642905079257,
				"_useCount": 5
			},
			"horn": {
				"_name": "horn",
				"_owner": "138398309776621569",
				"_content": "https:\u002F\u002Fcdn.discordapp.com\u002Fattachments\u002F572937294504394762\u002F743908967448576000\u002FAstolfo.png",
				"_creationDate": 1597432119107,
				"_lastUsedDate": 1621970370755,
				"_useCount": 3
			},
			"toot": {
				"_name": "toot",
				"_owner": "138398309776621569",
				"_content": "https:\u002F\u002Fcdn.discordapp.com\u002Fattachments\u002F572937294504394762\u002F743908994661482636\u002FAstolfo.png",
				"_creationDate": 1597432125582,
				"_lastUsedDate": 1642323371757,
				"_useCount": 11
			},
			"sand": {
				"_name": "sand",
				"_owner": "138398309776621569",
				"_content": "",
				"_creationDate": 1598312181615,
				"_lastUsedDate": 1631063504718,
				"_useCount": 4
			},
			"titan": {
				"_name": "titan",
				"_owner": "138398309776621569",
				"_content": "https:\u002F\u002Fcdn.discordapp.com\u002Fattachments\u002F319291473784995840\u002F748727790051917937\u002Fmeme1.jpg",
				"_creationDate": 1598581015940,
				"_lastUsedDate": 1643698712197,
				"_useCount": 9
			},
			"chasm": {
				"_name": "chasm",
				"_owner": "287188227667001345",
				"_content": "https:\u002F\u002Fcdn.discordapp.com\u002Fattachments\u002F709976828114370624\u002F750026964076855316\u002Fchasm.png",
				"_creationDate": 1598890846826,
				"_lastUsedDate": 1649379946295,
				"_useCount": 19
			},
			"trip": {
				"_name": "trip",
				"_owner": "287188227667001345",
				"_content": "https:\u002F\u002Fi.imgflip.com\u002F4ea5jb.jpg",
				"_creationDate": 1599602243154,
				"_lastUsedDate": 1636872263210,
				"_useCount": 15
			},
			"blitz": {
				"_name": "blitz",
				"_owner": "287188227667001345",
				"_content": "https:\u002F\u002Fi.imgflip.com\u002F4eg3fj.jpg",
				"_creationDate": 1599719456482,
				"_lastUsedDate": 1621637977371,
				"_useCount": 3
			},
			"native": {
				"_name": "native",
				"_owner": "138398309776621569",
				"_content": "https:\u002F\u002Fcdn.discordapp.com\u002Fattachments\u002F319291359376703488\u002F776221067509235742\u002FScreen_Shot_2020-11-11_at_3.03.29_PM.png",
				"_creationDate": 1605135924091,
				"_lastUsedDate": 1632081717950,
				"_useCount": 27
			},
			"roy": {
				"_name": "roy",
				"_owner": "260288776360820736",
				"_content": "https:\u002F\u002Fcdn.discordapp.com\u002Fattachments\u002F324477116554936321\u002F779554551278993418\u002Ftumblr_lx04td2t0g1r83xeho1_500.webp",
				"_creationDate": 1605937895821,
				"_lastUsedDate": 1634601143659,
				"_useCount": 4
			},
			"kick": {
				"_name": "kick",
				"_owner": "174037015858249730",
				"_content": "https:\u002F\u002Fthumbs.gfycat.com\u002FHardGreatGoosefish-size_restricted.gif",
				"_creationDate": 1606198138056,
				"_lastUsedDate": 1621638034251,
				"_useCount": 6
			},
			"roydrage": {
				"_name": "roydrage",
				"_owner": "260288776360820736",
				"_content": "https:\u002F\u002Fcdn.discordapp.com\u002Fattachments\u002F752607656279146628\u002F782573213502406656\u002Fdhllso02j6j41.png",
				"_creationDate": 1606650393718,
				"_lastUsedDate": 1621371307955,
				"_useCount": 1
			},
			"nativestory": {
				"_name": "nativestory",
				"_owner": "260288776360820736",
				"_content": "https:\u002F\u002Fdiscordapp.com\u002Fchannels\u002F319291359376703488\u002F572937294504394762\u002F744098007858806834",
				"_creationDate": 1607390789652,
				"_lastUsedDate": 1621371566839,
				"_useCount": 3
			},
			"landofwizards": {
				"_name": "landofwizards",
				"_owner": "138398309776621569",
				"_content": "https:\u002F\u002Fdiscordapp.com\u002Fchannels\u002F319291359376703488\u002F572937294504394762\u002F744098007858806834",
				"_creationDate": 1607469170638,
				"_lastUsedDate": 1646678661562,
				"_useCount": 9
			},
			"blm": {
				"_name": "blm",
				"_owner": "138398309776621569",
				"_content": "https:\u002F\u002Fcdn.discordapp.com\u002Fattachments\u002F680192503869341758\u002F786054668199526400\u002FScreen_Shot_2020-09-06_at_5.32.24_PM.png",
				"_creationDate": 1607480437246,
				"_lastUsedDate": 1638531729336,
				"_useCount": 13
			},
			"gab": {
				"_name": "gab",
				"_owner": "138398309776621569",
				"_content": "https:\u002F\u002Fcdn.discordapp.com\u002Fattachments\u002F407886123206180864\u002F788925907779059732\u002Ffc5dbb814059c5616a30251689802258.png",
				"_creationDate": 1608164994093,
				"_lastUsedDate": 1641987599846,
				"_useCount": 9
			},
			"giantenemycrab": {
				"_name": "giantenemycrab",
				"_owner": "138398309776621569",
				"_content": "https:\u002F\u002Fwww.youtube.com\u002Fwatch?v=T3e6Wy19jbo",
				"_creationDate": 1608169444633,
				"_lastUsedDate": 1632369133086,
				"_useCount": 2
			},
			"nativeirl": {
				"_name": "nativeirl",
				"_owner": "138398309776621569",
				"_content": "https:\u002F\u002Fcdn.discordapp.com\u002Fattachments\u002F553132938750066698\u002F794302723133538334\u002FScreen_Shot_2020-11-23_at_3.36.05_PM.png",
				"_creationDate": 1609446926736,
				"_lastUsedDate": 1640440207790,
				"_useCount": 20
			},
			"b": {
				"_name": "b",
				"_owner": "138398309776621569",
				"_content": "https:\u002F\u002Fcdn.discordapp.com\u002Fattachments\u002F572937294504394762\u002F799049203828654080\u002FD0x4C0uVsAAE0IF.jpeg",
				"_creationDate": 1610578575949,
				"_lastUsedDate": 1636508773114,
				"_useCount": 8
			},
			"redwinter": {
				"_name": "redwinter",
				"_owner": "260288776360820736",
				"_content": "Search out other mythical creatures and end their existence. Make full use of fountains around the map! Beware powerful NPCs... One simple rule: Earn as many points as you can by killing. Surviving to the end grants you points too. You will enter an arena when the timer is up for a final showdown. Meant for at least 4 players or there'd be too many creeps to handle. Best number is 6 players, no more no less. Note: AI supported! |cffff0000 THIS GAME IS HIGHLY CHALLENGING! NOT FOR THE SLOW OR UNSKILLED!|r You have been warned...\nCome Join All The Fun At: lol this forum doesn't exist anymore\n\nOriginal Version by Dominic Huang\nNew Version by Klypto",
				"_creationDate": 1611995704516,
				"_lastUsedDate": 1621371837363,
				"_useCount": 3
			},
			"justice": {
				"_name": "justice",
				"_owner": "138398309776621569",
				"_content": "https:\u002F\u002Fcdn.discordapp.com\u002Fattachments\u002F572937294504394762\u002F806040782954954782\u002Fjustice.png",
				"_creationDate": 1612245498340,
				"_lastUsedDate": 1621371506081,
				"_useCount": 1
			},
			"mightyplans": {
				"_name": "mightyplans",
				"_owner": "287188227667001345",
				"_content": "https:\u002F\u002Fclips.twitch.tv\u002FKathishKnottyWaffleVoteNay",
				"_creationDate": 1612899390732,
				"_lastUsedDate": 1649760870825,
				"_useCount": 4
			},
			"reforged": {
				"_name": "reforged",
				"_owner": "260288776360820736",
				"_content": "https:\u002F\u002Fcdn.discordapp.com\u002Fattachments\u002F634071562399776776\u002F808906447437299713\u002Funknown.png",
				"_creationDate": 1612928725928,
				"_lastUsedDate": 1649671670534,
				"_useCount": 6
			},
			"hindered": {
				"_name": "hindered",
				"_owner": "260288776360820736",
				"_content": "https:\u002F\u002Fcdn.discordapp.com\u002Fattachments\u002F794696570205241374\u002F811784681368322048\u002Funknown.png",
				"_creationDate": 1613614950434,
				"_lastUsedDate": 1621371517171,
				"_useCount": 1
			},
			"machias!": {
				"_name": "machias!",
				"_owner": "138398309776621569",
				"_content": "https:\u002F\u002Fcdn.discordapp.com\u002Fattachments\u002F407886123206180864\u002F831458447123415071\u002Fd1b01a035ea6b271f7cae2c561cbc7d0.png",
				"_creationDate": 1618305541646,
				"_lastUsedDate": 1618305541646,
				"_useCount": 0
			},
			"rogue": {
				"_name": "rogue",
				"_owner": "138398309776621569",
				"_content": "https:\u002F\u002Fcdn.discordapp.com\u002Fattachments\u002F407886123206180864\u002F835253033864134657\u002Fclinkydink.png",
				"_creationDate": 1619210241679,
				"_lastUsedDate": 1640425302825,
				"_useCount": 10
			},
			"economy": {
				"_name": "economy",
				"_owner": "138398309776621569",
				"_content": "https:\u002F\u002Fcdn.discordapp.com\u002Fattachments\u002F319291473784995840\u002F842102993704452176\u002FEconomy.png",
				"_creationDate": 1620843399351,
				"_lastUsedDate": 1636508459371,
				"_useCount": 4
			},
			"totsugekii": {
				"_name": "totsugekii",
				"_owner": "138398309776621569",
				"_content": "🐬🐬⚓ 💨 💨",
				"_creationDate": 1621070471368,
				"_lastUsedDate": 1634155037403,
				"_useCount": 8
			},
			"1v1": {
				"_name": "1v1",
				"_owner": "177423709114466304",
				"_content": "https:\u002F\u002Fcdn.discordapp.com\u002Fattachments\u002F407886123206180864\u002F843058404046274560\u002FStamp244.png",
				"_creationDate": 1621071186863,
				"_lastUsedDate": 1625950494579,
				"_useCount": 6
			},
			"onefear": {
				"_name": "onefear",
				"_owner": "177423709114466304",
				"_content": "https:\u002F\u002Fcdn.discordapp.com\u002Fattachments\u002F319291473784995840\u002F844316514218672138\u002F12cdd165b07abd9e921b3b811da3446d.png",
				"_creationDate": 1621371143739,
				"_lastUsedDate": 1640154299026,
				"_useCount": 8
			},
			"lab": {
				"_name": "lab",
				"_owner": "138398309776621569",
				"_content": "https:\u002F\u002Fcdn.discordapp.com\u002Fattachments\u002F407886123206180864\u002F845073753523748874\u002F180.jpg",
				"_creationDate": 1621551683664,
				"_lastUsedDate": 1636508717370,
				"_useCount": 3
			},
			"outsmart": {
				"_name": "outsmart",
				"_owner": "174037015858249730",
				"_content": "https:\u002F\u002Fi.gyazo.com\u002F2eb614c9b8b83e38bebbd5898ed58a4e.png",
				"_creationDate": 1621636119139,
				"_lastUsedDate": 1632686912740,
				"_useCount": 6
			},
			"qed": {
				"_name": "qed",
				"_owner": "174037015858249730",
				"_content": "https:\u002F\u002Fi.gyazo.com\u002F319a466187f67a73ff88a7848703d993.png",
				"_creationDate": 1621738820493,
				"_lastUsedDate": 1626201186309,
				"_useCount": 3
			},
			"hazeirl": {
				"_name": "hazeirl",
				"_owner": "138398309776621569",
				"_content": "https:\u002F\u002Fcdn.discordapp.com\u002Fattachments\u002F407886123206180864\u002F846222019908993084\u002Findex.png",
				"_creationDate": 1621825451717,
				"_lastUsedDate": 1633590055602,
				"_useCount": 4
			},
			"trauma": {
				"_name": "trauma",
				"_owner": "260288776360820736",
				"_content": "https:\u002F\u002Fwww.youtube.com\u002Fwatch?v=yM0YhyGOLpQ",
				"_creationDate": 1622154996246,
				"_lastUsedDate": 1622154996246,
				"_useCount": 0
			},
			"bellek": {
				"_name": "bellek",
				"_owner": "177423709114466304",
				"_content": "https:\u002F\u002Fcdn.discordapp.com\u002Fattachments\u002F407886123206180864\u002F847627987662012416\u002Fbellek.png",
				"_creationDate": 1622160660549,
				"_lastUsedDate": 1636508762046,
				"_useCount": 1
			},
			"rager": {
				"_name": "rager",
				"_owner": "138398309776621569",
				"_content": "https:\u002F\u002Fgyazo.com\u002F3c7da259a1860782ad7a07d4b65ac2cd",
				"_creationDate": 1622164194793,
				"_lastUsedDate": 1636508212365,
				"_useCount": 1
			},
			"uninstall": {
				"_name": "uninstall",
				"_owner": "177423709114466304",
				"_content": "https:\u002F\u002Fcdn.discordapp.com\u002Fattachments\u002F252370797337772050\u002F814514140940206090\u002Ftwitter_20210225_025536.mp4",
				"_creationDate": 1623358920552,
				"_lastUsedDate": 1636508808987,
				"_useCount": 2
			},
			"totsugeki": {
				"_name": "totsugeki",
				"_owner": "174037015858249730",
				"_content": "https:\u002F\u002Fcdn.discordapp.com\u002Fattachments\u002F518373442215477250\u002F852939198615781376\u002FMayTotsugekiPov.mp4",
				"_creationDate": 1623427065476,
				"_lastUsedDate": 1634155033720,
				"_useCount": 6
			},
			"chipp": {
				"_name": "chipp",
				"_owner": "177423709114466304",
				"_content": "https:\u002F\u002Fcdn.discordapp.com\u002Fattachments\u002F438575714506375169\u002F854107374201077830\u002Fc83c61a76afcbdfd4eda3b610fd5f36c.png",
				"_creationDate": 1623705466747,
				"_lastUsedDate": 1644835943504,
				"_useCount": 8
			},
			"fuujin": {
				"_name": "fuujin",
				"_owner": "174037015858249730",
				"_content": "https:\u002F\u002Fi.gyazo.com\u002Fc4d99a57dfc2f88e7bdc0554971f9caf.jpg",
				"_creationDate": 1624161742288,
				"_lastUsedDate": 1626047763346,
				"_useCount": 6
			},
			"ah": {
				"_name": "ah",
				"_owner": "138398309776621569",
				"_content": "https:\u002F\u002Fcdn.discordapp.com\u002Fattachments\u002F438575714506375169\u002F856025070228078632\u002Ftenor.gif",
				"_creationDate": 1624162681134,
				"_lastUsedDate": 1628721917387,
				"_useCount": 4
			},
			"lyn": {
				"_name": "lyn",
				"_owner": "138398309776621569",
				"_content": "https:\u002F\u002Fcdn.discordapp.com\u002Fattachments\u002F753028573865967708\u002F861143773542219786\u002F1618288695175.gif",
				"_creationDate": 1625383075072,
				"_lastUsedDate": 1634150909366,
				"_useCount": 3
			},
			"miles": {
				"_name": "miles",
				"_owner": "177423709114466304",
				"_content": "https:\u002F\u002Fcdn.discordapp.com\u002Fattachments\u002F407886123206180864\u002F863321019335180318\u002Ftohno_2c.png",
				"_creationDate": 1625902170864,
				"_lastUsedDate": 1646557316188,
				"_useCount": 8
			},
			"superhumanability": {
				"_name": "superhumanability",
				"_owner": "287188227667001345",
				"_content": "https:\u002F\u002Fi.gyazo.com\u002Fd9588493cbbfa565b714e9952333561c.png",
				"_creationDate": 1625915572131,
				"_lastUsedDate": 1625915572131,
				"_useCount": 0
			},
			"tekken": {
				"_name": "tekken",
				"_owner": "177423709114466304",
				"_content": "https:\u002F\u002Fcdn.discordapp.com\u002Fattachments\u002F407886123206180864\u002F864703060709867530\u002Fhaze_loves_tekken.png",
				"_creationDate": 1626231675199,
				"_lastUsedDate": 1638628888607,
				"_useCount": 5
			},
			"5k": {
				"_name": "5k",
				"_owner": "177423709114466304",
				"_content": "https:\u002F\u002Fcdn.discordapp.com\u002Fattachments\u002F407886123206180864\u002F866213297187323914\u002Fesstelle_gets_antiaired.gif",
				"_creationDate": 1626600827812,
				"_lastUsedDate": 1640068459455,
				"_useCount": 2
			},
			"winlast": {
				"_name": "winlast",
				"_owner": "138398309776621569",
				"_content": "https:\u002F\u002Fcdn.discordapp.com\u002Fattachments\u002F518375513757319194\u002F872216192163659836\u002FQyh0Q1X_-_Imgur.gif",
				"_creationDate": 1628022945369,
				"_lastUsedDate": 1628571393043,
				"_useCount": 2
			},
			"complete": {
				"_name": "complete",
				"_owner": "177423709114466304",
				"_content": "https:\u002F\u002Fcdn.discordapp.com\u002Fattachments\u002F407886123206180864\u002F874286767904288788\u002Fcomplete.mp4",
				"_creationDate": 1628516626357,
				"_lastUsedDate": 1629223617704,
				"_useCount": 1
			},
			"oki": {
				"_name": "oki",
				"_owner": "177423709114466304",
				"_content": "it's an emote, Native",
				"_creationDate": 1629009800707,
				"_lastUsedDate": 1629009805761,
				"_useCount": 1
			},
			"noreirl": {
				"_name": "noreirl",
				"_owner": "177423709114466304",
				"_content": "https:\u002F\u002Fcdn.discordapp.com\u002Fattachments\u002F438575714506375169\u002F876881231030145114\u002F798b2cefae0fe39fc1c2b2783962817f.png",
				"_creationDate": 1629135177284,
				"_lastUsedDate": 1634048545614,
				"_useCount": 6
			},
			"dontask": {
				"_name": "dontask",
				"_owner": "138398309776621569",
				"_content": "https:\u002F\u002Fcdn.discordapp.com\u002Fattachments\u002F518375513757319194\u002F878848928316018718\u002Fd6d9187f2a35c27162c414d6f5e7a3a4.png",
				"_creationDate": 1629604312845,
				"_lastUsedDate": 1636508872426,
				"_useCount": 2
			},
			"gamers": {
				"_name": "gamers",
				"_owner": "260288776360820736",
				"_content": "https:\u002F\u002Fwww.youtube.com\u002Fwatch?v=s-09gNDsPzQ",
				"_creationDate": 1630342013934,
				"_lastUsedDate": 1640775794733,
				"_useCount": 3
			},
			"fundies": {
				"_name": "fundies",
				"_owner": "177423709114466304",
				"_content": "https:\u002F\u002Fcdn.discordapp.com\u002Fattachments\u002F407886123206180864\u002F883873451650199572\u002F13ac406b71ce82cbca116447c3a8a83a.png",
				"_creationDate": 1630802252555,
				"_lastUsedDate": 1631613291830,
				"_useCount": 2
			},
			"coolkids": {
				"_name": "coolkids",
				"_owner": "138398309776621569",
				"_content": "https:\u002F\u002Fcdn.discordapp.com\u002Fattachments\u002F407886123206180864\u002F884968911974584370\u002F471ed8823f8a786605682cbb811fe936.png",
				"_creationDate": 1631063430664,
				"_lastUsedDate": 1644634994223,
				"_useCount": 6
			},
			"dogsus": {
				"_name": "dogsus",
				"_owner": "177423709114466304",
				"_content": "https:\u002F\u002Fcdn.discordapp.com\u002Fattachments\u002F407886123206180864\u002F891065160683360306\u002FIMG-20210612-WA0001.jpg",
				"_creationDate": 1632516889617,
				"_lastUsedDate": 1636508151079,
				"_useCount": 1
			},
			"asher": {
				"_name": "asher",
				"_owner": "177423709114466304",
				"_content": "https:\u002F\u002Fcdn.discordapp.com\u002Fattachments\u002F407886123206180864\u002F891239579074560010\u002Funknown.png",
				"_creationDate": 1633244004913,
				"_lastUsedDate": 1647694802699,
				"_useCount": 5
			},
			"vanish": {
				"_name": "vanish",
				"_owner": "177423709114466304",
				"_content": "https:\u002F\u002Ftenor.com\u002Fview\u002Fpeace-out-gif-22295199",
				"_creationDate": 1633336015188,
				"_lastUsedDate": 1637484431527,
				"_useCount": 2
			},
			"ranger": {
				"_name": "ranger",
				"_owner": "138398309776621569",
				"_content": "https:\u002F\u002Fcdn.discordapp.com\u002Fattachments\u002F407886123206180864\u002F897945917737549834\u002F090127.png",
				"_creationDate": 1634157389939,
				"_lastUsedDate": 1646260264957,
				"_useCount": 6
			},
			"mine": {
				"_name": "mine",
				"_owner": "138398309776621569",
				"_content": "https:\u002F\u002Fcdn.discordapp.com\u002Fattachments\u002F518375513757319194\u002F904467135374446682\u002FScreen_Shot_2021-08-01_at_12.01.43_PM.png",
				"_creationDate": 1635712169420,
				"_lastUsedDate": 1636508476266,
				"_useCount": 1
			},
			"pathfinder": {
				"_name": "pathfinder",
				"_owner": "138398309776621569",
				"_content": "Naty: maybe (25%) out on 11\u002F12\nDog: \"Difficult\" thanksgiving weekend",
				"_creationDate": 1636102121544,
				"_lastUsedDate": 1636970977708,
				"_useCount": 1
			},
			"honor": {
				"_name": "honor",
				"_owner": "222169605253234689",
				"_content": "https:\u002F\u002Fgyazo.com\u002F3257c8101d6cec596a1fdafc4cddf310",
				"_creationDate": 1636508075283,
				"_lastUsedDate": 1636508075283,
				"_useCount": 0
			},
			"nativeirl2": {
				"_name": "nativeirl2",
				"_owner": "177423709114466304",
				"_content": "https:\u002F\u002Fcdn.discordapp.com\u002Fattachments\u002F407886123206180864\u002F908350571608686713\u002Funknown.png",
				"_creationDate": 1636638052725,
				"_lastUsedDate": 1636638052725,
				"_useCount": 0
			},
			"hater": {
				"_name": "hater",
				"_owner": "177423709114466304",
				"_content": "https:\u002F\u002Fcdn.discordapp.com\u002Fattachments\u002F518375513757319194\u002F914259288850055238\u002F20211127_235900.jpg",
				"_creationDate": 1638046800696,
				"_lastUsedDate": 1638046812509,
				"_useCount": 1
			},
			"when": {
				"_name": "when",
				"_owner": "138398309776621569",
				"_content": "MH Rise PC: 1\u002F12\nWarhammer 3: 2\u002F17\nElden Ring: 2\u002F25",
				"_creationDate": 1639020006683,
				"_lastUsedDate": 1642458024194,
				"_useCount": 3
			},
			"coolest": {
				"_name": "coolest",
				"_owner": "177423709114466304",
				"_content": "https:\u002F\u002Fwww.youtube.com\u002Fwatch?v=4AYFk91_HtQ",
				"_creationDate": 1639983210096,
				"_lastUsedDate": 1639983210096,
				"_useCount": 0
			},
			"jim": {
				"_name": "jim",
				"_owner": "260288776360820736",
				"_content": "https:\u002F\u002Fcdn.discordapp.com\u002Fattachments\u002F407886123206180864\u002F959167610421911702\u002Funknown.png",
				"_creationDate": 1648753778972,
				"_lastUsedDate": 1648753778972,
				"_useCount": 0
			},
			"justwin": {
				"_name": "justwin",
				"_owner": "138398309776621569",
				"_content": "https:\u002F\u002Fi.gyazo.com\u002F4f1587c1b263dd47670cae74f850bbe1.png",
				"_creationDate": 1650020347244,
				"_lastUsedDate": 1650020347244,
				"_useCount": 0
			}
		}
	},
	"notes": {
		"0f68ad80-53b0-11eb-92aa-17b6db59969d": {
			"_id": "0f68ad80-53b0-11eb-92aa-17b6db59969d",
			"_authorId": "260288776360820736",
			"_guild": "319291359376703488",
			"_key": "dog of hazelyn",
			"_full": "The best",
			"_createdAt": "Mon Jan 11 2021 01:55:20 GMT+0000 (Coordinated Universal Time)",
			"_modifiedAt": 1610330639770
		},
		"3d6b5640-547a-11eb-87bc-6dda504445bb": {
			"_id": "3d6b5640-547a-11eb-87bc-6dda504445bb",
			"_authorId": "260288776360820736",
			"_guild": "319291359376703488",
			"_key": "steamid",
			"_full": "17168132",
			"_createdAt": "Tue Jan 12 2021 02:02:35 GMT+0000 (Coordinated Universal Time)",
			"_modifiedAt": 1610416955808
		},
		"d4f7ae00-929b-11eb-9b50-31a9164616a6": {
			"_id": "d4f7ae00-929b-11eb-9b50-31a9164616a6",
			"_authorId": "260288776360820736",
			"_guild": "319291359376703488",
			"_key": "nativeip",
			"_full": "73.15.80.168:10800",
			"_createdAt": "Thu Apr 01 2021 03:39:15 GMT+0000 (Coordinated Universal Time)",
			"_modifiedAt": 1617248355547
		},
		"191aa1e0-9437-11eb-9b50-31a9164616a6": {
			"_id": "191aa1e0-9437-11eb-9b50-31a9164616a6",
			"_authorId": "260288776360820736",
			"_guild": "319291359376703488",
			"_key": "hazeip",
			"_full": "104.136.38.60:10802",
			"_createdAt": "Sat Apr 03 2021 04:43:13 GMT+0000 (Coordinated Universal Time)",
			"_modifiedAt": 1617424993017
		},
		"bac04f80-a92d-11eb-a03d-69aaa73a6eed": {
			"_id": "bac04f80-a92d-11eb-a03d-69aaa73a6eed",
			"_authorId": "138398309776621569",
			"_guild": "319291359376703488",
			"_key": "dog:",
			"_full": "50.47.104.126:10800",
			"_createdAt": "Thu Apr 29 2021 20:59:03 GMT+0000 (Coordinated Universal Time)",
			"_modifiedAt": 1619729943667
		}
	},
	"cmd-eh": true,
	"cmd-randy": true,
	"cmd-flake": true,
	"cmd-flakes": true,
	"cmd-astolfo": true,
	"cmd-horn": true,
	"cmd-toot": true,
	"cmd-sand": true,
	"cmd-titan": true,
	"cmd-chasm": true,
	"cmd-trip": true,
	"cmd-blitz": true,
	"cmd-kamille": true,
	"cmd-native": true,
	"cmd-roy": true,
	"cmd-kick": true,
	"cmd-nativereal": true,
	"cmd-roydrage": true,
	"cmd-nativestory": true,
	"cmd-land of wizards": true,
	"cmd-landofwizards": true,
	"cmd-blm": true,
	"cmd-gab": true,
	"cmd-giantenemycrab": true,
	"cmd-nativeirl": true,
	"cmd-b": true,
	"cmd-redwinter": true,
	"cmd-justice": true,
	"cmd-mightyplans": true,
	"cmd-reforged": true,
	"cmd-hindered": true,
	"cmd-deer": true,
	"cmd-len": true,
	"cmd-machias!": true,
	"cmd-rogue": true,
	"cmd-economy": true,
	"cmd-totsugeki": true,
	"cmd-totsugekii": true,
	"cmd-1v1": true,
	"cmd-good": true,
	"cmd-onefear": true,
	"cmd-lab": true,
	"cmd-labbed": true,
	"cmd-outsmart": true,
	"cmd-qed": true,
	"cmd-hazeirl": true,
	"cmd-goodshow": false,
	"cmd-garen": false,
	"cmd-baddogtest": true,
	"cmd-trauma": true,
	"cmd-bellek": true,
	"cmd-strive": true,
	"cmd-did": true,
	"cmd-rager": true,
	"cmd-uninstall": true,
	"cmd-chipp": true,
	"cmd-details": true,
	"cmd-fuujin": true,
	"cmd-ah": true,
	"cmd-lyn": true,
	"cmd-finder": true,
	"cmd-miles": true,
	"cmd-superhumanability": true,
	"cmd-tekken": true,
	"cmd-5k": true,
	"cmd-winlast": true,
	"cmd-when": true,
	"cmd-uninstalluninstall": true,
	"cmd-complete": true,
	"cmd-oki": true,
	"cmd-noreirl": true,
	"cmd-dontask": true,
	"cmd-gamers": true,
	"cmd-fundies": true,
	"cmd-coolkids": true,
	"cmd-dogsus": true,
	"cmd-asher": true,
	"cmd-vanish": true,
	"cmd-ranger": true,
	"cmd-mine": true,
	"cmd-pathfinder": true,
	"cmd-hazesurvival:": true,
	"cmd-honor": true,
	"cmd-nativeirl2": true,
	"cmd-hater": true,
	"cmd-coolest": true,
	"Advance Wars By Web": {
		"users": {
			"260288776360820736": "Klypto",
			"138398309776621569": "Native",
			"174037015858249730": "Hazelyn",
			"177423709114466304": "Tekkyun",
			"28718822	7667001345": "Huzbug"
		},
		"games": {
			"579956": {
				"id": "579956",
				"name": "",
				"currentUser": "Huzbug",
				"lastUpdated": 1650035402052,
				"isFinished": false
			}
		},
		"interval": 240,
		"outputChannelId": null,
		"outputChannelID": "407886123206180864"
	},
	"cmd-jim": true,
	"cmd-justwin": true
};

const global = {
	"reminder": {
		"5": {
			"id": 5,
			"creationTime": 1584653097196,
			"reminderTime": 1670914797023,
			"originalReminderTime": "2020-12-13T06:59:57.196Z",
			"isRepeat": true,
			"repeatInterval": 31536000000,
			"executionNumber": 2,
			"target": "260288776360820736",
			"author": "260288776360820736",
			"message": "Hazeday",
			"source": "690309864957935776",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "919846087244791819",
			"scheduleName": "260288776360820736_260288776360820736_reminder_5",
			"currentJob": null
		},
		"7": {
			"id": 7,
			"creationTime": 1584658687159,
			"reminderTime": "Sat Feb 12 2022 07:00:07 GMT+0000 (Coordinated Universal Time)",
			"originalReminderTime": "2021-02-12T07:00:07.159Z",
			"isRepeat": false,
			"repeatInterval": 31536000000,
			"executionNumber": 1,
			"target": "260288776360820736",
			"author": "260288776360820736",
			"message": "Natoday",
			"source": "690333310916100206",
			"isEnabled": false,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "809680219480522753",
			"scheduleName": "260288776360820736_260288776360820736_reminder_7",
			"currentJob": null
		},
		"1591981843105": {
			"id": 1591981843105,
			"creationTime": 1591981843105,
			"reminderTime": 1660460400005,
			"originalReminderTime": "2020-08-14T07:00:00.000Z",
			"isRepeat": true,
			"repeatInterval": 31536000000,
			"executionNumber": 2,
			"target": "260288776360820736",
			"author": "260288776360820736",
			"message": "Prestoday",
			"source": "721048853217935440",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "875997168283041812",
			"scheduleName": "260288776360820736_260288776360820736_reminder_1591981843105",
			"currentJob": null
		},
		"1592500392454": {
			"id": 1592500392454,
			"creationTime": 1592500392454,
			"reminderTime": "1970-01-19T10:28:44.400Z",
			"originalReminderTime": "1970-01-19T10:28:44.400Z",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 0,
			"target": "553132938750066698",
			"author": "260288776360820736",
			"message": "New Game+ Expo (NGXP): https:\u002F\u002Fwww.twitch.tv\u002Fnewgameplusexpo",
			"source": "723223806487035957",
			"isEnabled": false,
			"isFired": false,
			"discordGuildId": "319291359376703488",
			"discordChannelId": "553132938750066698",
			"discordMessageId": "723223807036358757",
			"scheduleName": "260288776360820736_553132938750066698_reminder_1592500392454",
			"currentJob": null
		},
		"1592500474898": {
			"id": 1592500474898,
			"creationTime": 1592500474898,
			"reminderTime": "2020-06-23T18:15:00.000Z",
			"originalReminderTime": "2020-06-23T18:15:00.000Z",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 3,
			"target": "478122196812693506",
			"author": "260288776360820736",
			"message": "New Game+ Expo: https:\u002F\u002Fwww.twitch.tv\u002Fnewgameplusexpo",
			"source": "723224152638619658",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "478122196812693504",
			"discordChannelId": "478122196812693506",
			"discordMessageId": "723224152810717257",
			"scheduleName": "260288776360820736_478122196812693506_reminder_1592500474898",
			"currentJob": null
		},
		"1592500500402": {
			"id": 1592500500402,
			"creationTime": 1592500500402,
			"reminderTime": "2020-06-23T15:00:00.000Z",
			"originalReminderTime": "2020-06-23T15:00:00.000Z",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "553132938750066698",
			"author": "260288776360820736",
			"message": "New Game+ Expo: https:\u002F\u002Fwww.twitch.tv\u002Fnewgameplusexpo",
			"source": "723224259606085632",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "319291359376703488",
			"discordChannelId": "553132938750066698",
			"discordMessageId": "723224260054876322",
			"scheduleName": "260288776360820736_553132938750066698_reminder_1592500500402",
			"currentJob": null
		},
		"1592540345955": {
			"id": 1592540345955,
			"creationTime": 1592540345955,
			"reminderTime": "2020-06-19T04:49:05.954Z",
			"originalReminderTime": "2020-06-19T04:49:05.954Z",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "138398309776621569",
			"author": "138398309776621569",
			"message": "unnap",
			"source": "723391383938793472",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "319291359376703488",
			"discordChannelId": "407886123206180864",
			"discordMessageId": "723391385000083496",
			"scheduleName": "138398309776621569_138398309776621569_reminder_1592540345955",
			"currentJob": null
		},
		"1592541315501": {
			"id": 1592541315501,
			"creationTime": 1592541315501,
			"reminderTime": "2020-06-19T04:49:05.000Z",
			"originalReminderTime": "2020-06-19T04:49:05.000Z",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "260288776360820736",
			"author": "260288776360820736",
			"message": "Native test",
			"source": "723395450375372841",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "723395451109244930",
			"scheduleName": "260288776360820736_260288776360820736_reminder_1592541315501",
			"currentJob": null
		},
		"1592784193034": {
			"id": 1592784193034,
			"creationTime": 1592784193034,
			"reminderTime": "1970-01-01T00:00:00.006Z",
			"originalReminderTime": "1970-01-01T00:00:00.006Z",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 0,
			"target": "400560944201072650",
			"author": "260288776360820736",
			"message": "Pizza time",
			"source": "724414151086309466",
			"isEnabled": false,
			"isFired": false,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "724414153321611264",
			"scheduleName": "260288776360820736_400560944201072650_reminder_1592784193034",
			"currentJob": null
		},
		"1592784223184": {
			"id": 1592784223184,
			"creationTime": 1592784223184,
			"reminderTime": "2020-06-22T01:28:43.183Z",
			"originalReminderTime": "2020-06-22T01:28:43.183Z",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 0,
			"target": "400560944201072650",
			"author": "260288776360820736",
			"message": "Pizza time",
			"source": "724414278962249779",
			"isEnabled": false,
			"isFired": false,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "724414279742390285",
			"scheduleName": "260288776360820736_400560944201072650_reminder_1592784223184",
			"currentJob": null
		},
		"1592784248560": {
			"id": 1592784248560,
			"creationTime": 1592784248560,
			"reminderTime": "2020-06-22T01:14:08.560Z",
			"originalReminderTime": "2020-06-22T01:14:08.560Z",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "400560944201072650",
			"author": "260288776360820736",
			"message": "Pizza time",
			"source": "724414385380130837",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "724414386323849236",
			"scheduleName": "260288776360820736_400560944201072650_reminder_1592784248560",
			"currentJob": null
		},
		"1592938384272": {
			"id": 1592938384272,
			"creationTime": 1592938384272,
			"reminderTime": "2020-06-23T18:54:24.271Z",
			"originalReminderTime": "2020-06-23T18:53:14.271Z",
			"isRepeat": false,
			"repeatInterval": 60000,
			"executionNumber": 2,
			"target": "478122196812693506",
			"author": "260288776360820736",
			"message": "Test",
			"source": "725060877606191216",
			"isEnabled": false,
			"isFired": true,
			"discordGuildId": "478122196812693504",
			"discordChannelId": "478122196812693506",
			"discordMessageId": "725061213494575228",
			"scheduleName": "260288776360820736_478122196812693506_reminder_1592938384272",
			"currentJob": null
		},
		"1592941088928": {
			"id": 1592941088928,
			"creationTime": 1592941088928,
			"reminderTime": "2020-06-23T19:38:23.928Z",
			"originalReminderTime": "2020-06-23T19:38:23.928Z",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "310031015932329985",
			"author": "260288776360820736",
			"message": "Here's an example",
			"source": "725072221424320524",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "427612196021731328",
			"discordMessageId": "725072285303570452",
			"scheduleName": "260288776360820736_310031015932329985_reminder_1592941088928",
			"currentJob": null
		},
		"1592941165672": {
			"id": 1592941165672,
			"creationTime": 1592941165672,
			"reminderTime": "2020-06-23T23:09:25.672Z",
			"originalReminderTime": "2020-06-23T21:39:25.672Z",
			"isRepeat": false,
			"repeatInterval": 900000,
			"executionNumber": 2,
			"target": "310031015932329985",
			"author": "310031015932329985",
			"message": "stop fucking afking",
			"source": "725072543408586754",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "427612196021731328",
			"discordMessageId": "725125392528310312",
			"scheduleName": "310031015932329985_310031015932329985_reminder_1592941165672",
			"currentJob": null
		},
		"1592981758340": {
			"id": 1592981758340,
			"creationTime": 1592981758341,
			"reminderTime": "2020-06-24T06:56:58.339Z",
			"originalReminderTime": "2020-06-24T06:56:58.339Z",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "174037015858249730",
			"author": "260288776360820736",
			"message": "\u003C#324477116554936321\u003E",
			"source": "725242801679499375",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "400560988874735616",
			"discordMessageId": "725243054763802849",
			"scheduleName": "260288776360820736_174037015858249730_reminder_1592981758340",
			"currentJob": null
		},
		"1593054114658": {
			"id": 1593054114658,
			"creationTime": 1593054114659,
			"reminderTime": 1594263714683,
			"originalReminderTime": "2020-06-26T03:01:54.658Z",
			"isRepeat": false,
			"repeatInterval": 86400000,
			"executionNumber": 13,
			"target": "260288776360820736",
			"author": "260288776360820736",
			"message": "You have homework to do",
			"source": "725546284919947297",
			"isEnabled": false,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "730257329228087407",
			"scheduleName": "260288776360820736_260288776360820736_reminder_1593054114658",
			"currentJob": null
		},
		"1593692416634": {
			"id": 1593692416634,
			"creationTime": 1593692416634,
			"reminderTime": "2020-07-08T20:20:16.633Z",
			"originalReminderTime": "2020-07-02T20:20:16.633Z",
			"isRepeat": false,
			"repeatInterval": 86400000,
			"executionNumber": 5,
			"target": "400560944201072650",
			"author": "260288776360820736",
			"message": "taxes",
			"source": "728223518633885806",
			"isEnabled": false,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "730518642449448960",
			"scheduleName": "260288776360820736_400560944201072650_reminder_1593692416634",
			"currentJob": null
		},
		"1594946290558": {
			"id": 1594946290558,
			"creationTime": 1594946290558,
			"reminderTime": "1970-01-01T00:00:00.017Z",
			"originalReminderTime": "1970-01-01T00:00:00.017Z",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 0,
			"target": "324477116554936321",
			"author": "260288776360820736",
			"message": "Dog owes a character",
			"source": "733482647040294933",
			"isEnabled": false,
			"isFired": false,
			"discordGuildId": "319291359376703488",
			"discordChannelId": "324477116554936321",
			"discordMessageId": "733482647493279855",
			"scheduleName": "260288776360820736_324477116554936321_reminder_1594946290558",
			"currentJob": null
		},
		"1594946307117": {
			"id": 1594946307117,
			"creationTime": 1594946307117,
			"reminderTime": "1970-01-19T11:02:49.200Z",
			"originalReminderTime": "1970-01-19T11:02:49.200Z",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 0,
			"target": "324477116554936321",
			"author": "260288776360820736",
			"message": "Dog owes a character",
			"source": "733482716506488902",
			"isEnabled": false,
			"isFired": false,
			"discordGuildId": "319291359376703488",
			"discordChannelId": "324477116554936321",
			"discordMessageId": "733482716800090167",
			"scheduleName": "260288776360820736_324477116554936321_reminder_1594946307117",
			"currentJob": null
		},
		"1594946327261": {
			"id": 1594946327261,
			"creationTime": 1594946327261,
			"reminderTime": "2020-07-17T04:59:47.260Z",
			"originalReminderTime": "2020-07-17T03:59:47.260Z",
			"isRepeat": false,
			"repeatInterval": 10800000,
			"executionNumber": 1,
			"target": "324477116554936321",
			"author": "260288776360820736",
			"message": "Dog owes a character",
			"source": "733482801005068361",
			"isEnabled": false,
			"isFired": true,
			"discordGuildId": "319291359376703488",
			"discordChannelId": "324477116554936321",
			"discordMessageId": "733533385015689276",
			"scheduleName": "260288776360820736_324477116554936321_reminder_1594946327261",
			"currentJob": null
		},
		"1594946353350": {
			"id": 1594946353350,
			"creationTime": 1594946353350,
			"reminderTime": "2020-07-17T00:40:13.350Z",
			"originalReminderTime": "2020-07-17T00:40:13.350Z",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 0,
			"target": "138398309776621569",
			"author": "138398309776621569",
			"message": "hi",
			"source": "733482910434459728",
			"isEnabled": false,
			"isFired": false,
			"discordGuildId": "319291359376703488",
			"discordChannelId": "324477116554936321",
			"discordMessageId": "733482911256412300",
			"scheduleName": "138398309776621569_138398309776621569_reminder_1594946353350",
			"currentJob": null
		},
		"1595250257520": {
			"id": 1595250257520,
			"creationTime": 1595250257520,
			"reminderTime": "2020-07-20T14:00:00.000Z",
			"originalReminderTime": "2020-07-20T14:00:00.000Z",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 0,
			"target": "478122196812693506",
			"author": "260288776360820736",
			"message": "Nintendo Direct https:\u002F\u002Fwww.twitch.tv\u002Fnintendo",
			"source": "734757576528363571",
			"isEnabled": false,
			"isFired": false,
			"discordGuildId": "478122196812693504",
			"discordChannelId": "478122196812693506",
			"discordMessageId": "734757577572876358",
			"scheduleName": "260288776360820736_478122196812693506_reminder_1595250257520",
			"currentJob": null
		},
		"1595250287850": {
			"id": 1595250287850,
			"creationTime": 1595250287850,
			"reminderTime": "2020-07-20T14:00:00.000Z",
			"originalReminderTime": "2020-07-20T14:00:00.000Z",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "553132938750066698",
			"author": "260288776360820736",
			"message": "Nintendo Direct https:\u002F\u002Fwww.twitch.tv\u002Fnintendo",
			"source": "734757703842529332",
			"isEnabled": false,
			"isFired": true,
			"discordGuildId": "319291359376703488",
			"discordChannelId": "553132938750066698",
			"discordMessageId": "734771596895715418",
			"scheduleName": "260288776360820736_553132938750066698_reminder_1595250287850",
			"currentJob": null
		},
		"1595458282873": {
			"id": 1595458282873,
			"creationTime": 1595458282873,
			"reminderTime": "2021-07-22T22:51:22.872Z",
			"originalReminderTime": "2021-07-22T22:51:22.872Z",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 0,
			"target": "260288776360820736",
			"author": "260288776360820736",
			"message": "Testing !getreminders",
			"source": "735630098346278993",
			"isEnabled": false,
			"isFired": false,
			"discordGuildId": "478122196812693504",
			"discordChannelId": "478122196812693506",
			"discordMessageId": "735630098799001662",
			"scheduleName": "260288776360820736_260288776360820736_reminder_1595458282873",
			"currentJob": null
		},
		"1595888465542": {
			"id": 1595888465542,
			"creationTime": 1595888465542,
			"reminderTime": "2020-07-27T22:30:05.542Z",
			"originalReminderTime": "2020-07-27T22:30:05.542Z",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "260288776360820736",
			"author": "260288776360820736",
			"message": "IK Meeting",
			"source": "737434415294054520",
			"isEnabled": false,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "737436680679587872",
			"scheduleName": "260288776360820736_260288776360820736_reminder_1595888465542",
			"currentJob": null
		},
		"1596167167293": {
			"id": 1596167167293,
			"creationTime": 1596167167293,
			"reminderTime": "2020-07-31T03:46:12.293Z",
			"originalReminderTime": "2020-07-31T03:46:12.293Z",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "480278511815491585",
			"author": "260288776360820736",
			"message": "OKAY",
			"source": "738603375221800970",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "478122196812693504",
			"discordChannelId": "480278511815491585",
			"discordMessageId": "738603375586836523",
			"scheduleName": "260288776360820736_480278511815491585_reminder_1596167167293",
			"currentJob": null
		},
		"1596167221582": {
			"id": 1596167221582,
			"creationTime": 1596167221582,
			"reminderTime": "2020-07-31T03:47:02.581Z",
			"originalReminderTime": "2020-07-31T03:47:02.581Z",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "480278511815491585",
			"author": "260288776360820736",
			"message": "waaaaah",
			"source": "738603602654003241",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "478122196812693504",
			"discordChannelId": "480278511815491585",
			"discordMessageId": "738603603589202040",
			"scheduleName": "260288776360820736_480278511815491585_reminder_1596167221582",
			"currentJob": null
		},
		"1596167424715": {
			"id": 1596167424715,
			"creationTime": 1596167424715,
			"reminderTime": "2020-07-31T03:50:25.714Z",
			"originalReminderTime": "2020-07-31T03:50:25.714Z",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "480278511815491585",
			"author": "260288776360820736",
			"message": "waaaah",
			"source": "738604454533922887",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "478122196812693504",
			"discordChannelId": "480278511815491585",
			"discordMessageId": "738604455976763472",
			"scheduleName": "260288776360820736_480278511815491585_reminder_1596167424715",
			"currentJob": null
		},
		"1596245040727": {
			"id": 1596245040727,
			"creationTime": 1596245040727,
			"reminderTime": "2020-08-01T03:24:00.727Z",
			"originalReminderTime": "2020-08-01T03:24:00.727Z",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "138398309776621569",
			"author": "138398309776621569",
			"message": "\u003C#553132938750066698\u003E a thing is occurring, hide from discord",
			"source": "738930000060874792",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "401293854000545792",
			"discordMessageId": "738960200379138048",
			"scheduleName": "138398309776621569_138398309776621569_reminder_1596245040727",
			"currentJob": null
		},
		"1596342916564": {
			"id": 1596342916564,
			"creationTime": 1596342916564,
			"reminderTime": "2020-08-02T16:35:16.563Z",
			"originalReminderTime": "2020-08-02T16:35:16.563Z",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "260288776360820736",
			"author": "260288776360820736",
			"message": "Sleep-deprived FFXIV",
			"source": "739340521092415558",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "739521716220592149",
			"scheduleName": "260288776360820736_260288776360820736_reminder_1596342916564",
			"currentJob": null
		},
		"1596343084692": {
			"id": 1596343084692,
			"creationTime": 1596343084692,
			"reminderTime": "2020-08-02T16:38:04.691Z",
			"originalReminderTime": "2020-08-02T16:38:04.691Z",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "138398309776621569",
			"author": "260288776360820736",
			"message": "You made a commitment.  Don't be a flake.",
			"source": "739341226251386920",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "401293854000545792",
			"discordMessageId": "739522421253734410",
			"scheduleName": "260288776360820736_138398309776621569_reminder_1596343084692",
			"currentJob": null
		},
		"1596707943457": {
			"id": 1596707943457,
			"creationTime": 1596707943457,
			"reminderTime": "2021-08-05T09:59:03.456Z",
			"originalReminderTime": "2021-08-05T09:59:03.456Z",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "260288776360820736",
			"author": "260288776360820736",
			"message": "Uregano's birthday",
			"source": "740871554858090528",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "872780738699866122",
			"scheduleName": "260288776360820736_260288776360820736_reminder_1596707943457",
			"currentJob": null
		},
		"1597147317473": {
			"id": 1597147317473,
			"creationTime": 1597147317473,
			"reminderTime": "2020-08-11T12:01:58.472Z",
			"originalReminderTime": "2020-08-11T12:01:58.472Z",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "260288776360820736",
			"author": "260288776360820736",
			"message": "test",
			"source": "742714422731997326",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "742714428507816016",
			"scheduleName": "260288776360820736_260288776360820736_reminder_1597147317473",
			"currentJob": null
		},
		"1597181400324": {
			"id": 1597181400324,
			"creationTime": 1597181400324,
			"reminderTime": "2020-08-11T21:30:01.323Z",
			"originalReminderTime": "2020-08-11T21:30:01.323Z",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "480241428564410371",
			"author": "260288776360820736",
			"message": "waaaaah",
			"mentions": "\u003C@&591185040369778695\u003E",
			"source": "742857376889176105",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "478122196812693504",
			"discordChannelId": "480241428564410371",
			"discordMessageId": "742857381662425088",
			"scheduleName": "260288776360820736_480241428564410371_reminder_1597181400324",
			"currentJob": null
		},
		"1597182553596": {
			"id": 1597182553596,
			"creationTime": 1597182553596,
			"reminderTime": "2020-08-12T03:00:00.000Z",
			"originalReminderTime": "2020-08-12T03:00:00.000Z",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 0,
			"target": "480241428564410371",
			"author": "260288776360820736",
			"message": "test",
			"mentions": "\u003C@&591185040369778695\u003E",
			"source": "742862214062669935",
			"isEnabled": false,
			"isFired": false,
			"discordGuildId": "478122196812693504",
			"discordChannelId": "480241428564410371",
			"discordMessageId": "742862214716850237",
			"scheduleName": "260288776360820736_480241428564410371_reminder_1597182553596",
			"currentJob": null
		},
		"1597184002671": {
			"id": 1597184002671,
			"creationTime": 1597184002671,
			"reminderTime": "2020-08-12T02:00:00.000Z",
			"originalReminderTime": "2020-08-12T02:00:00.000Z",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 0,
			"target": "480241428564410371",
			"author": "260288776360820736",
			"message": "test",
			"mentions": "\u003C@&591185040369778695\u003E",
			"source": "742868291688726558",
			"isEnabled": false,
			"isFired": false,
			"discordGuildId": "478122196812693504",
			"discordChannelId": "480241428564410371",
			"discordMessageId": "742868292594827354",
			"scheduleName": "260288776360820736_480241428564410371_reminder_1597184002671",
			"currentJob": null
		},
		"1597184054361": {
			"id": 1597184054361,
			"creationTime": 1597184054361,
			"reminderTime": "2020-08-12T02:00:00.000Z",
			"originalReminderTime": "2020-08-12T02:00:00.000Z",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "480241428564410371",
			"author": "260288776360820736",
			"message": "Raid Time",
			"mentions": "\u003C@&735576185404391515\u003E",
			"source": "742868508513271839",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "478122196812693504",
			"discordChannelId": "480241428564410371",
			"discordMessageId": "742925323863195750",
			"scheduleName": "260288776360820736_480241428564410371_reminder_1597184054361",
			"currentJob": null
		},
		"1597184065775": {
			"id": 1597184065775,
			"creationTime": 1597184065775,
			"reminderTime": "2020-08-12T02:00:00.000Z",
			"originalReminderTime": "2020-08-12T02:00:00.000Z",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "319291473784995840",
			"author": "260288776360820736",
			"message": "Raid Time",
			"mentions": "\u003C@&740381879378772058\u003E",
			"source": "742868556382863361",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "319291359376703488",
			"discordChannelId": "319291473784995840",
			"discordMessageId": "742925323875909733",
			"scheduleName": "260288776360820736_319291473784995840_reminder_1597184065775",
			"currentJob": null
		},
		"1597362161629": {
			"id": 1597362161629,
			"creationTime": 1597362161629,
			"reminderTime": "2020-08-14T01:30:00.000Z",
			"originalReminderTime": "2020-08-14T01:30:00.000Z",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 0,
			"target": "480241428564410371",
			"author": "260288776360820736",
			"message": "Raid Time (30 Minute Warning)",
			"mentions": "\u003C@&735576185404391515\u003E",
			"source": "743615544208523286",
			"isEnabled": false,
			"isFired": false,
			"discordGuildId": "478122196812693504",
			"discordChannelId": "480241428564410371",
			"discordMessageId": "743615545445711912",
			"scheduleName": "260288776360820736_480241428564410371_reminder_1597362161629",
			"currentJob": null
		},
		"1597362207427": {
			"id": 1597362207427,
			"creationTime": 1597362207427,
			"reminderTime": "2020-09-04T01:45:00.004Z",
			"originalReminderTime": "2020-08-14T01:45:00.000Z",
			"isRepeat": false,
			"repeatInterval": 603900000,
			"executionNumber": 3,
			"target": "319291473784995840",
			"author": "260288776360820736",
			"message": "Raid Time (15 Minute Warning)",
			"mentions": "\u003C@&740381879378772058\u003E",
			"source": "743615736622219316",
			"isEnabled": false,
			"isFired": true,
			"discordGuildId": "319291359376703488",
			"discordChannelId": "319291473784995840",
			"discordMessageId": "748719754457514019",
			"scheduleName": "260288776360820736_319291473784995840_reminder_1597362207427",
			"currentJob": null
		},
		"1597370957483": {
			"id": 1597370957483,
			"creationTime": 1597370957483,
			"reminderTime": "2020-08-14T04:09:17.483Z",
			"originalReminderTime": "2020-08-14T04:09:17.483Z",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "260288776360820736",
			"author": "260288776360820736",
			"message": "Presto Birthday",
			"mentions": null,
			"source": "743652437226815518",
			"isEnabled": false,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "743682637050151022",
			"scheduleName": "260288776360820736_260288776360820736_reminder_1597370957483",
			"currentJob": null
		},
		"1597444867648": {
			"id": 1597444867648,
			"creationTime": 1597444867648,
			"reminderTime": "2020-08-14T23:41:07.647Z",
			"originalReminderTime": "2020-08-14T23:41:07.647Z",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "260288776360820736",
			"author": "260288776360820736",
			"message": "You said a thing",
			"mentions": null,
			"source": "743962438763937852",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "743977539101523989",
			"scheduleName": "260288776360820736_260288776360820736_reminder_1597444867648",
			"currentJob": null
		},
		"1597584706588": {
			"id": 1597584706588,
			"creationTime": 1597584706588,
			"reminderTime": "2020-08-16T18:30:00.000Z",
			"originalReminderTime": "2020-08-16T18:30:00.000Z",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 0,
			"target": "480241428564410371",
			"author": "260288776360820736",
			"message": "Raid Time (30 Minute Warning)",
			"mentions": "\u003C@&735576185404391515\u003E",
			"source": "744548965353259080",
			"isEnabled": false,
			"isFired": false,
			"discordGuildId": "478122196812693504",
			"discordChannelId": "480241428564410371",
			"discordMessageId": "744548966644973599",
			"scheduleName": "260288776360820736_480241428564410371_reminder_1597584706588",
			"currentJob": null
		},
		"1597584796998": {
			"id": 1597584796998,
			"creationTime": 1597584796998,
			"reminderTime": "2020-09-20T18:30:00.031Z",
			"originalReminderTime": "2020-08-16T18:30:00.000Z",
			"isRepeat": false,
			"repeatInterval": 432000000,
			"executionNumber": 5,
			"target": "319291473784995840",
			"author": "260288776360820736",
			"message": "Raid Time (30 Minute Warning)",
			"mentions": "\u003C@&740381879378772058\u003E",
			"source": "744549345159807006",
			"isEnabled": false,
			"isFired": true,
			"discordGuildId": "319291359376703488",
			"discordChannelId": "319291473784995840",
			"discordMessageId": "754770877270458478",
			"scheduleName": "260288776360820736_319291473784995840_reminder_1597584796998",
			"currentJob": null
		},
		"1597585061005": {
			"id": 1597585061005,
			"creationTime": 1597585061005,
			"reminderTime": 1676444400021,
			"originalReminderTime": "2021-02-15T07:00:00.000Z",
			"isRepeat": true,
			"repeatInterval": 31536000000,
			"executionNumber": 2,
			"target": "260288776360820736",
			"author": "260288776360820736",
			"message": "Thugday",
			"mentions": null,
			"source": "744550452108197900",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "943038925583310848",
			"scheduleName": "260288776360820736_260288776360820736_reminder_1597585061005",
			"currentJob": null
		},
		"1597585124489": {
			"id": 1597585124489,
			"creationTime": 1597585124489,
			"reminderTime": 1681196400151,
			"originalReminderTime": "2021-04-11T07:00:00.000Z",
			"isRepeat": true,
			"repeatInterval": 31536000000,
			"executionNumber": 2,
			"target": "260288776360820736",
			"author": "260288776360820736",
			"message": "Bugday",
			"mentions": null,
			"source": "744550718756749393",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "962970256584871966",
			"scheduleName": "260288776360820736_260288776360820736_reminder_1597585124489",
			"currentJob": null
		},
		"1597758321445": {
			"id": 1597758321445,
			"creationTime": 1597758321445,
			"reminderTime": 1602034200030,
			"originalReminderTime": "2020-08-19T01:30:00.000Z",
			"isRepeat": false,
			"repeatInterval": 604800000,
			"executionNumber": 7,
			"target": "319291473784995840",
			"author": "260288776360820736",
			"message": "Raid Time (30 Minute Warning)",
			"mentions": "\u003C@&740381879378772058\u003E",
			"source": "745277159085572107",
			"isEnabled": false,
			"isFired": true,
			"discordGuildId": "319291359376703488",
			"discordChannelId": "319291473784995840",
			"discordMessageId": "760674779643510796",
			"scheduleName": "260288776360820736_319291473784995840_reminder_1597758321445",
			"currentJob": null
		},
		"1597772657493": {
			"id": 1597772657493,
			"creationTime": 1597772657493,
			"reminderTime": "2020-08-19T05:44:17.493Z",
			"originalReminderTime": "2020-08-19T05:44:17.493Z",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "138398309776621569",
			"author": "138398309776621569",
			"message": "dope machias with speed thing",
			"mentions": null,
			"source": "745337289101541477",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "401293854000545792",
			"discordMessageId": "745518490685014067",
			"scheduleName": "138398309776621569_138398309776621569_reminder_1597772657493",
			"currentJob": null
		},
		"1598579163226": {
			"id": 1598579163226,
			"creationTime": 1598579163226,
			"reminderTime": 1602207063287,
			"originalReminderTime": "2020-09-04T01:31:03.225Z",
			"isRepeat": false,
			"repeatInterval": 604800000,
			"executionNumber": 5,
			"target": "319291473784995840",
			"author": "260288776360820736",
			"message": "Raid Time (30 Minute Warning)",
			"mentions": "\u003C@&740381879378772058\u003E",
			"source": "748720019373817856",
			"isEnabled": false,
			"isFired": true,
			"discordGuildId": "319291359376703488",
			"discordChannelId": "319291473784995840",
			"discordMessageId": "761399820719095828",
			"scheduleName": "260288776360820736_319291473784995840_reminder_1598579163226",
			"currentJob": null
		},
		"1598723039060": {
			"id": 1598723039060,
			"creationTime": 1598723039060,
			"reminderTime": "2021-08-29T17:43:59.060Z",
			"originalReminderTime": "2021-08-29T17:43:59.060Z",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "260288776360820736",
			"author": "260288776360820736",
			"message": "Akaecius Day",
			"mentions": null,
			"source": "749323478246883418",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "881595050478403634",
			"scheduleName": "260288776360820736_260288776360820736_reminder_1598723039060",
			"currentJob": null
		},
		"1599281421131": {
			"id": 1599281421131,
			"creationTime": 1599281421131,
			"reminderTime": "2020-09-06T01:50:21.131Z",
			"originalReminderTime": "2020-09-05T10:50:21.131Z",
			"isRepeat": false,
			"repeatInterval": 10800000,
			"executionNumber": 3,
			"target": "260288776360820736",
			"author": "260288776360820736",
			"message": "Figure out times for raiding",
			"mentions": null,
			"source": "751665502400675900",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "751982592676462723",
			"scheduleName": "260288776360820736_260288776360820736_reminder_1599281421131",
			"currentJob": null
		},
		"1600090150370": {
			"id": 1600090150370,
			"creationTime": 1600090150370,
			"reminderTime": "2020-09-19T18:30:00.000Z",
			"originalReminderTime": "2020-09-19T18:30:00.000Z",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "260288776360820736",
			"author": "260288776360820736",
			"message": "Test",
			"mentions": null,
			"source": "755057558661759087",
			"isEnabled": false,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "756945205030289439",
			"scheduleName": "260288776360820736_260288776360820736_reminder_1600090150370",
			"currentJob": null
		},
		"1600090216549": {
			"id": 1600090216549,
			"creationTime": 1600090216549,
			"reminderTime": "2020-09-19T18:30:00.000Z",
			"originalReminderTime": "2020-09-19T18:30:00.000Z",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "319291473784995840",
			"author": "260288776360820736",
			"message": "Raid Time (30 Minute Warning)",
			"mentions": "\u003C@&740381879378772058\u003E",
			"source": "755057836077088850",
			"isEnabled": false,
			"isFired": true,
			"discordGuildId": "319291359376703488",
			"discordChannelId": "319291473784995840",
			"discordMessageId": "756945204472185033",
			"scheduleName": "260288776360820736_319291473784995840_reminder_1600090216549",
			"currentJob": null
		},
		"1600107065714": {
			"id": 1600107065714,
			"creationTime": 1600107065714,
			"reminderTime": "2020-09-15T22:51:05.714Z",
			"originalReminderTime": "2020-09-15T22:51:05.714Z",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "260288776360820736",
			"author": "260288776360820736",
			"message": "Cake",
			"mentions": null,
			"source": "755128506685456484",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "755561360603217951",
			"scheduleName": "260288776360820736_260288776360820736_reminder_1600107065714",
			"currentJob": null
		},
		"1600281078118": {
			"id": 1600281078118,
			"creationTime": 1600281078118,
			"reminderTime": "2020-09-16T20:01:18.117Z",
			"originalReminderTime": "2020-09-16T20:01:18.117Z",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "553132938750066698",
			"author": "260288776360820736",
			"message": "https:\u002F\u002Fwww.playstation.com\u002Fen-us\u002Fps5\u002F",
			"mentions": "@here",
			"source": "755858367708397588",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "319291359376703488",
			"discordChannelId": "553132938750066698",
			"discordMessageId": "755881017788858528",
			"scheduleName": "260288776360820736_553132938750066698_reminder_1600281078118",
			"currentJob": null
		},
		"1601147057845": {
			"id": 1601147057845,
			"creationTime": 1601147057845,
			"reminderTime": "2020-10-03T18:31:17.844Z",
			"originalReminderTime": "2020-10-03T18:31:17.844Z",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "319291473784995840",
			"author": "260288776360820736",
			"message": "Raid Time (30 Minute Warning)",
			"mentions": "\u003C@&740381879378772058\u003E",
			"source": "759490549941534750",
			"isEnabled": false,
			"isFired": true,
			"discordGuildId": "319291359376703488",
			"discordChannelId": "319291473784995840",
			"discordMessageId": "762018961101422612",
			"scheduleName": "260288776360820736_319291473784995840_reminder_1601147057845",
			"currentJob": null
		},
		"1601924344221": {
			"id": 1601924344221,
			"creationTime": 1601924344221,
			"reminderTime": "2020-10-24T01:00:00.000Z",
			"originalReminderTime": "2020-10-24T01:00:00.000Z",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "260288776360820736",
			"author": "260288776360820736",
			"message": "Scamming old ladies is behind you.  Scamming everybody...has just begun.",
			"mentions": null,
			"source": "762750725272895528",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "769364539376402444",
			"scheduleName": "260288776360820736_260288776360820736_reminder_1601924344221",
			"currentJob": null
		},
		"1601924390703": {
			"id": 1601924390703,
			"creationTime": 1601924390703,
			"reminderTime": "2020-10-24T01:00:00.000Z",
			"originalReminderTime": "2020-10-24T01:00:00.000Z",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "260288776360820736",
			"author": "260288776360820736",
			"message": "Scamming old ladies is behind you.  Scamming everybody...has just begun.  \n\nAlso checking to make sure that date format still works since it was broken before.",
			"mentions": null,
			"source": "762750920173158452",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "769364538897465404",
			"scheduleName": "260288776360820736_260288776360820736_reminder_1601924390703",
			"currentJob": null
		},
		"1602504351788": {
			"id": 1602504351788,
			"creationTime": 1602504351788,
			"reminderTime": "2020-10-13T01:05:51.787Z",
			"originalReminderTime": "2020-10-13T00:05:51.787Z",
			"isRepeat": false,
			"repeatInterval": 3600000,
			"executionNumber": 2,
			"target": "260288776360820736",
			"author": "260288776360820736",
			"message": "You have art tasks to do.",
			"mentions": null,
			"source": "765183453355835422",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "765379747306930208",
			"scheduleName": "260288776360820736_260288776360820736_reminder_1602504351788",
			"currentJob": null
		},
		"1603820786386": {
			"id": 1603820786386,
			"creationTime": 1603820786386,
			"reminderTime": "2020-10-28T03:46:26.385Z",
			"originalReminderTime": "2020-10-28T01:46:26.385Z",
			"isRepeat": false,
			"repeatInterval": 7200000,
			"executionNumber": 2,
			"target": "260288776360820736",
			"author": "260288776360820736",
			"message": "Fucking do proving grounds you idiot",
			"mentions": null,
			"source": "770704980214415440",
			"isEnabled": false,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "770855976696938546",
			"scheduleName": "260288776360820736_260288776360820736_reminder_1603820786386",
			"currentJob": null
		},
		"1604017741514": {
			"id": 1604017741514,
			"creationTime": 1604017741514,
			"reminderTime": "2020-10-31T08:00:00.000Z",
			"originalReminderTime": "2020-10-31T08:00:00.000Z",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "260288776360820736",
			"author": "260288776360820736",
			"message": "Bustin",
			"mentions": null,
			"source": "771531069395697686",
			"isEnabled": false,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "772006950724042802",
			"scheduleName": "260288776360820736_260288776360820736_reminder_1604017741514",
			"currentJob": null
		},
		"1604297417861": {
			"id": 1604297417861,
			"creationTime": 1604297417862,
			"reminderTime": 1655705418198,
			"originalReminderTime": "2020-11-09T06:10:17.861Z",
			"isRepeat": true,
			"repeatInterval": 604800000,
			"executionNumber": 82,
			"target": "260288776360820736",
			"author": "260288776360820736",
			"message": "Save the house",
			"mentions": null,
			"source": "772704117541568522",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "985788185810444338",
			"scheduleName": "260288776360820736_260288776360820736_reminder_1604297417861",
			"currentJob": null
		},
		"1604441314910": {
			"id": 1604441314910,
			"creationTime": 1604441314910,
			"reminderTime": 1668204514924,
			"originalReminderTime": "2020-11-11T22:08:34.909Z",
			"isRepeat": true,
			"repeatInterval": 31536000000,
			"executionNumber": 2,
			"target": "319291359376703488",
			"author": "260288776360820736",
			"message": "Chao's birthday",
			"mentions": "@here",
			"source": "773307665274896425",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "319291359376703488",
			"discordChannelId": "319291359376703488",
			"discordMessageId": "908478340036456459",
			"scheduleName": "260288776360820736_319291359376703488_reminder_1604441314910",
			"currentJob": null
		},
		"1604545173988": {
			"id": 1604545173988,
			"creationTime": 1604545173988,
			"reminderTime": "2020-11-12T02:59:33.987Z",
			"originalReminderTime": "2020-11-12T02:59:33.987Z",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "138398309776621569",
			"author": "260288776360820736",
			"message": "Readd your role, scrub.",
			"mentions": null,
			"source": "773743281804673037",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "401293854000545792",
			"discordMessageId": "776279998348394496",
			"scheduleName": "260288776360820736_138398309776621569_reminder_1604545173988",
			"currentJob": null
		},
		"1605659848453": {
			"id": 1605659848453,
			"creationTime": 1605659848453,
			"reminderTime": "2020-11-22T19:37:28.452Z",
			"originalReminderTime": "2020-11-22T19:37:28.452Z",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "400560944201072650",
			"author": "260288776360820736",
			"message": "Jonathan Au birthday",
			"mentions": "@here",
			"source": "778418565631705128",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "778418566361251890",
			"scheduleName": "260288776360820736_400560944201072650_reminder_1605659848453",
			"currentJob": null
		},
		"1606509056118": {
			"id": 1606509056118,
			"creationTime": 1606509056118,
			"reminderTime": "2020-11-28T01:30:56.117Z",
			"originalReminderTime": "2020-11-28T01:30:56.117Z",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "400560944201072650",
			"author": "260288776360820736",
			"message": "Black Friday",
			"mentions": "@here",
			"source": "781980400338599939",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "781980401165926422",
			"scheduleName": "260288776360820736_400560944201072650_reminder_1606509056118",
			"currentJob": null
		},
		"1606510901618": {
			"id": 1606510901618,
			"creationTime": 1606510901618,
			"reminderTime": "2021-11-27T21:01:41.618Z",
			"originalReminderTime": "2021-11-27T21:01:41.618Z",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "400560944201072650",
			"author": "260288776360820736",
			"message": "Randy Birthday",
			"mentions": "@here",
			"source": "781988141082738759",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "914259713045192784",
			"scheduleName": "260288776360820736_400560944201072650_reminder_1606510901618",
			"currentJob": null
		},
		"1606723516935": {
			"id": 1606723516935,
			"creationTime": 1606723516935,
			"reminderTime": "2020-12-01T02:05:16.935Z",
			"originalReminderTime": "2020-12-01T02:05:16.935Z",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "400560944201072650",
			"author": "260288776360820736",
			"message": "Acting with Native (GBFV keyboard)",
			"mentions": "@here",
			"source": "782879914457563137",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "783151706749796382",
			"scheduleName": "260288776360820736_400560944201072650_reminder_1606723516935",
			"currentJob": null
		},
		"1607973790774": {
			"id": 1607973790774,
			"creationTime": 1607973790774,
			"reminderTime": "2020-12-15T03:23:10.773Z ",
			"originalReminderTime": "2020-12-15T03:23:10.773Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "138398309776621569",
			"author": "138398309776621569",
			"message": "roll gbf",
			"mentions": null,
			"source": "788123942966526013",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "401293854000545792",
			"discordMessageId": "788244740570742824",
			"scheduleName": "138398309776621569_138398309776621569_reminder_1607973790774",
			"currentJob": null
		},
		"1608065800895": {
			"id": 1608065800895,
			"creationTime": 1608065800895,
			"reminderTime": "Mon Dec 21 2020 04:56:40 GMT+0000 (Coordinated Universal Time)",
			"originalReminderTime": "2020-12-16T04:56:40.894Z ",
			"isRepeat": false,
			"repeatInterval": 86400000,
			"executionNumber": 6,
			"target": "138398309776621569",
			"author": "138398309776621569",
			"message": "fb",
			"mentions": null,
			"source": "788509861603311646",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "401293854000545792",
			"discordMessageId": "790442594579906601",
			"scheduleName": "138398309776621569_138398309776621569_reminder_1608065800895",
			"currentJob": null
		},
		"1609724135533": {
			"id": 1609724135533,
			"creationTime": 1609724135533,
			"reminderTime": "2021-01-04T06:35:35.532Z ",
			"originalReminderTime": "2021-01-04T06:35:35.532Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "260288776360820736",
			"author": "260288776360820736",
			"message": "Use your ticket, idiot",
			"mentions": null,
			"source": "795465421045104640",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "795540919511416832",
			"scheduleName": "260288776360820736_260288776360820736_reminder_1609724135533",
			"currentJob": null
		},
		"1609728647850": {
			"id": 1609728647850,
			"creationTime": 1609728647850,
			"reminderTime": "2021-01-04T02:53:47.849Z ",
			"originalReminderTime": "2021-01-04T02:53:47.849Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "794696570205241374",
			"author": "260288776360820736",
			"message": "Dog said he would be back by now",
			"mentions": "@here",
			"source": "795484347234385961",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "319291359376703488",
			"discordChannelId": "794696570205241374",
			"discordMessageId": "795485102657372171",
			"scheduleName": "260288776360820736_794696570205241374_reminder_1609728647850",
			"currentJob": null
		},
		"1609928594576": {
			"id": 1609928594576,
			"creationTime": 1609928594576,
			"reminderTime": "2021-01-11T06:23:14.576Z ",
			"originalReminderTime": "2021-01-11T06:23:14.576Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "400560944201072650",
			"author": "260288776360820736",
			"message": "Roth IRA",
			"mentions": "@here",
			"source": "796322984565538816",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "798074526737891338",
			"scheduleName": "260288776360820736_400560944201072650_reminder_1609928594576",
			"currentJob": null
		},
		"1610263592534": {
			"id": 1610263592534,
			"creationTime": 1610263592534,
			"reminderTime": "2021-01-19T07:26:32.532Z ",
			"originalReminderTime": "2021-01-19T07:26:32.532Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "400560944201072650",
			"author": "260288776360820736",
			"message": "https:\u002F\u002Fsteamcommunity.com\u002Fdiscussions\u002Fforum\u002F11\u002F371918937259040941\u002F",
			"mentions": "@here",
			"source": "797728066407104532",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "800989559286399017",
			"scheduleName": "260288776360820736_400560944201072650_reminder_1610263592534",
			"currentJob": null
		},
		"1610420232607": {
			"id": 1610420232607,
			"creationTime": 1610420232607,
			"reminderTime": "2021-01-12T04:57:12.606Z ",
			"originalReminderTime": "2021-01-12T04:57:12.606Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "138398309776621569",
			"author": "260288776360820736",
			"message": "https:\u002F\u002Flumiacraft.xyz\u002F",
			"mentions": null,
			"source": "798385063704264705",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "401293854000545792",
			"discordMessageId": "798415264256622632",
			"scheduleName": "260288776360820736_138398309776621569_reminder_1610420232607",
			"currentJob": null
		},
		"1611387122717": {
			"id": 1611387122717,
			"creationTime": 1611387122717,
			"reminderTime": "2021-01-23T07:32:12.716Z ",
			"originalReminderTime": "2021-01-23T07:32:12.716Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "138398309776621569",
			"author": "260288776360820736",
			"message": "Wash your dish",
			"mentions": null,
			"source": "802440494999142420",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "401293854000545792",
			"discordMessageId": "802440538149486643",
			"scheduleName": "260288776360820736_138398309776621569_reminder_1611387122717",
			"currentJob": null
		},
		"1611973685371": {
			"id": 1611973685371,
			"creationTime": 1611973685371,
			"reminderTime": "2021-02-01T20:28:05.370Z ",
			"originalReminderTime": "2021-02-01T20:28:05.370Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "400560944201072650",
			"author": "260288776360820736",
			"message": "Call vanguard to figure out recharacterization of IRA",
			"mentions": "@here",
			"source": "804900717130940446",
			"isEnabled": false,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "805897287259127869",
			"scheduleName": "260288776360820736_400560944201072650_reminder_1611973685371",
			"currentJob": null
		},
		"1612557832502": {
			"id": 1612557832502,
			"creationTime": 1612557832503,
			"reminderTime": "2021-02-06T01:29:52.502Z ",
			"originalReminderTime": "2021-02-06T01:29:52.502Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "319291473784995840",
			"author": "260288776360820736",
			"message": "Announcement Stream https:\u002F\u002Fwww.twitch.tv\u002Ffinalfantasyxiv",
			"mentions": "@here",
			"source": "807350807749197844",
			"isEnabled": false,
			"isFired": true,
			"discordGuildId": "319291359376703488",
			"discordChannelId": "319291473784995840",
			"discordMessageId": "807422782812061716",
			"scheduleName": "260288776360820736_319291473784995840_reminder_1612557832502",
			"currentJob": null
		},
		"1613010060560": {
			"id": 1613010060560,
			"creationTime": 1613010060560,
			"reminderTime": "2021-02-19T21:59:00.559Z ",
			"originalReminderTime": "2021-02-19T21:59:00.559Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "553132938750066698",
			"author": "260288776360820736",
			"message": "Blizzard's Con\nhttps:\u002F\u002Fblizzcon.com\u002Fen-us\u002F",
			"mentions": "@here",
			"source": "809247589794447360",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "319291359376703488",
			"discordChannelId": "553132938750066698",
			"discordMessageId": "812443146973347850",
			"scheduleName": "260288776360820736_553132938750066698_reminder_1613010060560",
			"currentJob": null
		},
		"1613130332363": {
			"id": 1613130332363,
			"creationTime": 1613130332363,
			"reminderTime": "2022-02-10T07:00:07.000Z ",
			"originalReminderTime": "2022-02-10T07:00:07.000Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 0,
			"target": "400560944201072650",
			"author": "260288776360820736",
			"message": "Natoday 1 hour warning",
			"mentions": "@here",
			"source": "809752046290993172",
			"isEnabled": false,
			"isFired": false,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "809752046600454176",
			"scheduleName": "260288776360820736_400560944201072650_reminder_1613130332363",
			"currentJob": null
		},
		"1613151263936": {
			"id": 1613151263936,
			"creationTime": 1613151263936,
			"reminderTime": "Wed Feb 08 2023 07:00:00 GMT+0000 (Coordinated Universal Time)",
			"originalReminderTime": "2022-02-08T07:00:00.000Z ",
			"isRepeat": false,
			"repeatInterval": 31536000000,
			"executionNumber": 1,
			"target": "400560944201072650",
			"author": "260288776360820736",
			"message": "Natoday 1 hour warning",
			"mentions": "@here",
			"source": "809839839330435073",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "940502216735866951",
			"scheduleName": "260288776360820736_400560944201072650_reminder_1613151263936",
			"currentJob": null
		},
		"1613167342724": {
			"id": 1613167342724,
			"creationTime": 1613167342724,
			"reminderTime": "2021-02-13T00:02:22.724Z ",
			"originalReminderTime": "2021-02-13T00:02:22.724Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "400560944201072650",
			"author": "260288776360820736",
			"message": "Spear Aesthetics",
			"mentions": "@here",
			"source": "809907278920679465",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "809937478743228436",
			"scheduleName": "260288776360820736_400560944201072650_reminder_1613167342724",
			"currentJob": null
		},
		"1615417179380": {
			"id": 1615417179380,
			"creationTime": 1615417179380,
			"reminderTime": "2021-03-20T22:59:39.379Z ",
			"originalReminderTime": "2021-03-20T22:59:39.379Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "138398309776621569",
			"author": "138398309776621569",
			"message": "poorboy's poorday",
			"mentions": null,
			"source": "819343777386201130",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "401293854000545792",
			"discordMessageId": "822967657950085131",
			"scheduleName": "138398309776621569_138398309776621569_reminder_1615417179380",
			"currentJob": null
		},
		"1619049602163": {
			"id": 1619049602163,
			"creationTime": 1619049602163,
			"reminderTime": 1682377200092,
			"originalReminderTime": "2021-04-24T23:00:00.000Z ",
			"isRepeat": true,
			"repeatInterval": 31536000000,
			"executionNumber": 2,
			"target": "400560944201072650",
			"author": "260288776360820736",
			"message": "Dad's Birthday",
			"mentions": "@here",
			"source": "834579263109726221",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "967922890492219452",
			"scheduleName": "260288776360820736_400560944201072650_reminder_1619049602163",
			"currentJob": null
		},
		"1619403386484": {
			"id": 1619403386484,
			"creationTime": 1619403386484,
			"reminderTime": "2021-04-26T02:16:36.483Z ",
			"originalReminderTime": "2021-04-26T02:16:36.483Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "407886123206180864",
			"author": "260288776360820736",
			"message": "Native sucks",
			"mentions": "@here",
			"source": "836063142199033866",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "319291359376703488",
			"discordChannelId": "407886123206180864",
			"discordMessageId": "836063184925884447",
			"scheduleName": "260288776360820736_407886123206180864_reminder_1619403386484",
			"currentJob": null
		},
		"1619728424459": {
			"id": 1619728424459,
			"creationTime": 1619728424460,
			"reminderTime": "2021-04-29T20:58:44.459Z ",
			"originalReminderTime": "2021-04-29T20:58:44.459Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "553132938750066698",
			"author": "260288776360820736",
			"message": "https:\u002F\u002Fwww.youtube.com\u002Fwatch?v=F8hWEhS7iw0",
			"mentions": "@here",
			"source": "837426450264227840",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "319291359376703488",
			"discordChannelId": "553132938750066698",
			"discordMessageId": "837432742617546864",
			"scheduleName": "260288776360820736_553132938750066698_reminder_1619728424459",
			"currentJob": null
		},
		"1620666219264": {
			"id": 1620666219264,
			"creationTime": 1620666219264,
			"reminderTime": "2021-05-11T03:03:39.263Z ",
			"originalReminderTime": "2021-05-11T03:03:39.263Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "260288776360820736",
			"author": "260288776360820736",
			"message": "videfur things",
			"mentions": null,
			"source": "841359846736396358",
			"isEnabled": false,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "841510842758594621",
			"scheduleName": "260288776360820736_260288776360820736_reminder_1620666219264",
			"currentJob": null
		},
		"1620928377582": {
			"id": 1620928377582,
			"creationTime": 1620928377582,
			"reminderTime": "2021-05-15T01:00:00.000Z ",
			"originalReminderTime": "2021-05-15T01:00:00.000Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "319291473784995840",
			"author": "260288776360820736",
			"message": "Fan festival thing, https:\u002F\u002Fwww.youtube.com\u002Fc\u002Fffxiv\u002Ffeatured",
			"mentions": "@here",
			"source": "842459418402357308",
			"isEnabled": false,
			"isFired": true,
			"discordGuildId": "319291359376703488",
			"discordChannelId": "319291473784995840",
			"discordMessageId": "842929275509407764",
			"scheduleName": "260288776360820736_319291473784995840_reminder_1620928377582",
			"currentJob": null
		},
		"1621648909011": {
			"id": 1621648909011,
			"creationTime": 1621648909011,
			"reminderTime": "2021-05-23T00:56:49.010Z ",
			"originalReminderTime": "2021-05-23T00:56:49.010Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 0,
			"target": "400560944201072650",
			"author": "260288776360820736",
			"message": "Tae's Wedding",
			"mentions": "@here",
			"source": "845481546026975273",
			"isEnabled": false,
			"isFired": false,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "845481547225235476",
			"scheduleName": "260288776360820736_400560944201072650_reminder_1621648909011",
			"currentJob": null
		},
		"1621725537186": {
			"id": 1621725537186,
			"creationTime": 1621725537186,
			"reminderTime": "2021-05-23T00:25:00.000Z ",
			"originalReminderTime": "2021-05-23T00:25:00.000Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "400560944201072650",
			"author": "260288776360820736",
			"message": "Tae's Wedding",
			"mentions": "@here",
			"source": "845802948022108201",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "845819570308907028",
			"scheduleName": "260288776360820736_400560944201072650_reminder_1621725537186",
			"currentJob": null
		},
		"1622053779634": {
			"id": 1622053779634,
			"creationTime": 1622053779634,
			"reminderTime": "2022-03-21T07:00:00.000Z ",
			"originalReminderTime": "2022-03-21T07:00:00.000Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "260288776360820736",
			"author": "260288776360820736",
			"message": "Tekday 1 hour warning",
			"mentions": null,
			"source": "847179696865149018",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "955360111369527389",
			"scheduleName": "260288776360820736_260288776360820736_reminder_1622053779634",
			"currentJob": null
		},
		"1622053890531": {
			"id": 1622053890531,
			"creationTime": 1622053890531,
			"reminderTime": "2022-03-21T00:00:00.000Z ",
			"originalReminderTime": "2022-03-21T00:00:00.000Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "304354673647812608",
			"author": "304354673647812608",
			"message": "The Exact time Tekken man was born",
			"mentions": null,
			"source": "847180162046361600",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "640027795606470661",
			"discordMessageId": "955254417412718632",
			"scheduleName": "304354673647812608_304354673647812608_reminder_1622053890531",
			"currentJob": null
		},
		"1622060862974": {
			"id": 1622060862974,
			"creationTime": 1622060862974,
			"reminderTime": "2021-06-11T19:59:00.000Z ",
			"originalReminderTime": "2021-06-11T19:59:00.000Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "553132938750066698",
			"author": "260288776360820736",
			"message": "IGN Expo (oh boy): https:\u002F\u002Fwww.twitch.tv\u002Fign",
			"mentions": "@here",
			"source": "847209406264770572",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "319291359376703488",
			"discordChannelId": "553132938750066698",
			"discordMessageId": "853000386679275631",
			"scheduleName": "260288776360820736_553132938750066698_reminder_1622060862974",
			"currentJob": null
		},
		"1622060928617": {
			"id": 1622060928617,
			"creationTime": 1622060928617,
			"reminderTime": "2021-06-12T19:00:00.000Z ",
			"originalReminderTime": "2021-06-12T19:00:00.000Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "553132938750066698",
			"author": "260288776360820736",
			"message": "Ubisoft Forward (oh boy): https:\u002F\u002Fwww.twitch.tv\u002Fubisoft",
			"mentions": "@here",
			"source": "847209681884545036",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "319291359376703488",
			"discordChannelId": "553132938750066698",
			"discordMessageId": "853347926541729792",
			"scheduleName": "260288776360820736_553132938750066698_reminder_1622060928617",
			"currentJob": null
		},
		"1622122196979": {
			"id": 1622122196979,
			"creationTime": 1622122196979,
			"reminderTime": "2021-05-31T06:10:00.000Z ",
			"originalReminderTime": "2021-05-31T06:10:00.000Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "400560944201072650",
			"author": "260288776360820736",
			"message": "Fashion Report",
			"mentions": "@here",
			"source": "847466659987849236",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "847466660595367997",
			"scheduleName": "260288776360820736_400560944201072650_reminder_1622122196979",
			"currentJob": null
		},
		"1622828362000": {
			"id": 1622828362000,
			"creationTime": 1622828362000,
			"reminderTime": "2021-06-15T15:59:00.000Z ",
			"originalReminderTime": "2021-06-15T15:59:00.000Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "553132938750066698",
			"author": "260288776360820736",
			"message": "Nintendo Direct E3: ninten.do\u002F6014VAKqn",
			"mentions": "@here",
			"source": "850428530180489228",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "319291359376703488",
			"discordChannelId": "553132938750066698",
			"discordMessageId": "854389541066506300",
			"scheduleName": "260288776360820736_553132938750066698_reminder_1622828362000",
			"currentJob": null
		},
		"1622828534379": {
			"id": 1622828534379,
			"creationTime": 1622828534379,
			"reminderTime": "2021-06-12T18:59:00.000Z ",
			"originalReminderTime": "2021-06-12T18:59:00.000Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "553132938750066698",
			"author": "260288776360820736",
			"message": "Ubisoft Press Conference: https:\u002F\u002Fwww.ubisoft.com\u002Fen-us\u002Fforward",
			"mentions": "@here",
			"source": "850429253354258475",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "319291359376703488",
			"discordChannelId": "553132938750066698",
			"discordMessageId": "853347675055194112",
			"scheduleName": "260288776360820736_553132938750066698_reminder_1622828534379",
			"currentJob": null
		},
		"1622828605579": {
			"id": 1622828605579,
			"creationTime": 1622828605579,
			"reminderTime": "2021-06-13T16:59:00.000Z ",
			"originalReminderTime": "2021-06-13T16:59:00.000Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "553132938750066698",
			"author": "260288776360820736",
			"message": "Microsoft & Bethesda Press Conference: https:\u002F\u002Fwww.twitch.tv\u002FXbox",
			"mentions": "@here",
			"source": "850429552462528512",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "319291359376703488",
			"discordChannelId": "553132938750066698",
			"discordMessageId": "853679864044847114",
			"scheduleName": "260288776360820736_553132938750066698_reminder_1622828605579",
			"currentJob": null
		},
		"1622828666803": {
			"id": 1622828666803,
			"creationTime": 1622828666803,
			"reminderTime": "2021-06-13T19:14:00.000Z ",
			"originalReminderTime": "2021-06-13T19:14:00.000Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "553132938750066698",
			"author": "260288776360820736",
			"message": "Square Enix Press Conference: https:\u002F\u002Fwww.twitch.tv\u002Fsquareenix",
			"mentions": "@here",
			"source": "850429809267048448",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "319291359376703488",
			"discordChannelId": "553132938750066698",
			"discordMessageId": "853713837601456128",
			"scheduleName": "260288776360820736_553132938750066698_reminder_1622828666803",
			"currentJob": null
		},
		"1622828778235": {
			"id": 1622828778235,
			"creationTime": 1622828778235,
			"reminderTime": "2021-06-14T14:59:00.000Z ",
			"originalReminderTime": "2021-06-14T14:59:00.000Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "553132938750066698",
			"author": "260288776360820736",
			"message": "Capcom Press Conference: https:\u002F\u002Fwww.twitch.tv\u002Fe3",
			"mentions": "@here",
			"source": "850430276609245194",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "319291359376703488",
			"discordChannelId": "553132938750066698",
			"discordMessageId": "854012052635648011",
			"scheduleName": "260288776360820736_553132938750066698_reminder_1622828778235",
			"currentJob": null
		},
		"1623116758214": {
			"id": 1623116758214,
			"creationTime": 1623116758214,
			"reminderTime": "2021-06-10T17:59:00.000Z ",
			"originalReminderTime": "2021-06-10T17:59:00.000Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "553132938750066698",
			"author": "260288776360820736",
			"message": "Capcom Press Conference: https:\u002F\u002Fwww.summergamefest.com\u002F",
			"mentions": "@here",
			"source": "851638152035696670",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "319291359376703488",
			"discordChannelId": "553132938750066698",
			"discordMessageId": "852607799536123925",
			"scheduleName": "260288776360820736_553132938750066698_reminder_1623116758214",
			"currentJob": null
		},
		"1625776908029": {
			"id": 1625776908029,
			"creationTime": 1625776908029,
			"reminderTime": "2021-07-08T20:59:00.000Z ",
			"originalReminderTime": "2021-07-08T20:59:00.000Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "553132938750066698",
			"author": "260288776360820736",
			"message": "http:\u002F\u002Ftwitch.tv\u002Fplaystation",
			"mentions": "@here",
			"source": "862795629167378463",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "319291359376703488",
			"discordChannelId": "553132938750066698",
			"discordMessageId": "862799958294134795",
			"scheduleName": "260288776360820736_553132938750066698_reminder_1625776908029",
			"currentJob": null
		},
		"1627703560443": {
			"id": 1627703560443,
			"creationTime": 1627703560443,
			"reminderTime": 1628449200034,
			"originalReminderTime": "2021-07-31T19:00:00.000Z ",
			"isRepeat": false,
			"repeatInterval": 86400000,
			"executionNumber": 8,
			"target": "400560944201072650",
			"author": "260288776360820736",
			"message": "Water Plants",
			"mentions": "@here",
			"source": "870876594699386890",
			"isEnabled": false,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "873641647412486245",
			"scheduleName": "260288776360820736_400560944201072650_reminder_1627703560443",
			"currentJob": null
		},
		"1629449754606": {
			"id": 1629449754606,
			"creationTime": 1629449754606,
			"reminderTime": "2021-08-21T00:55:54.605Z ",
			"originalReminderTime": "2021-08-21T00:55:54.605Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "287188227667001345",
			"author": "260288776360820736",
			"message": "Finish the thing.",
			"mentions": null,
			"source": "878200664126283806",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "427741158328762377",
			"discordMessageId": "878442257638899733",
			"scheduleName": "260288776360820736_287188227667001345_reminder_1629449754606",
			"currentJob": null
		},
		"1630598373587": {
			"id": 1630598373587,
			"creationTime": 1630598373587,
			"reminderTime": "2021-09-09T20:59:00.000Z ",
			"originalReminderTime": "2021-09-09T20:59:00.000Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 0,
			"target": "553132938750066698",
			"author": "260288776360820736",
			"message": "Playstation Showcase (https:\u002F\u002Fwww.twitch.tv\u002Fplaystation)",
			"mentions": "@here",
			"source": "883018321216299068",
			"isEnabled": false,
			"isFired": false,
			"discordGuildId": "319291359376703488",
			"discordChannelId": "553132938750066698",
			"discordMessageId": "883018322197753856",
			"scheduleName": "260288776360820736_553132938750066698_reminder_1630598373587",
			"currentJob": null
		},
		"1630598477544": {
			"id": 1630598477544,
			"creationTime": 1630598477544,
			"reminderTime": "2021-09-09T20:59:00.000Z ",
			"originalReminderTime": "2021-09-09T20:59:00.000Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "553132938750066698",
			"author": "260288776360820736",
			"message": "Playstation Showcase (https:\u002F\u002Fwww.twitch.tv\u002Fplaystation)",
			"mentions": "@here",
			"source": "883018757000282182",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "319291359376703488",
			"discordChannelId": "553132938750066698",
			"discordMessageId": "885630393942958172",
			"scheduleName": "260288776360820736_553132938750066698_reminder_1630598477544",
			"currentJob": null
		},
		"1630717186879": {
			"id": 1630717186879,
			"creationTime": 1630717186879,
			"reminderTime": "2021-09-07T22:00:00.000Z ",
			"originalReminderTime": "2021-09-07T22:00:00.000Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 0,
			"target": "400560944201072650",
			"author": "260288776360820736",
			"message": "Massage",
			"mentions": "@here",
			"source": "883516660080840736",
			"isEnabled": false,
			"isFired": false,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "883516661548859402",
			"scheduleName": "260288776360820736_400560944201072650_reminder_1630717186879",
			"currentJob": null
		},
		"1630846373157": {
			"id": 1630846373157,
			"creationTime": 1630846373157,
			"reminderTime": "2021-09-06T00:52:53.154Z ",
			"originalReminderTime": "2021-09-06T00:52:53.154Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "400560944201072650",
			"author": "260288776360820736",
			"message": "https:\u002F\u002Fwww.amazon.com\u002FIron-Age-Portable-Technology-Invention\u002Fdp\u002FB07FNQTH4Y\u002Fref=sxin_19_pa_sp_phone_search_thematic_sspa?adgrpid=55620945066&cv_ct_cx=pull+up+bar%27&dchild=1&gclid=Cj0KCQjw1dGJBhD4ARIsANb6OdmxWeYHNF-kTGz8GTWHAAY9DSC8Wc9Wi5R8P_EnwE39vTR3ahWNIXEaAtapEALw_wcB&hvadid=274685512032&hvdev=m&hvlocphy=9033288&hvnetw=g&hvqmt=e&hvrand=14715245629924416859&hvtargid=kwd-376049839339&hydadcr=17345_9859339&keywords=pull+up+bar%27&pd_rd_i=B07FNQTH4Y&pd_rd_r=ec32cb35-b229-4180-8ef5-42dc6b8da1a4&pd_rd_w=sehv4&pd_rd_wg=T2mmF&pf_rd_p=3258799c-7411-4c36-a72c-646dbb1bc760&pf_rd_r=4T3NP5PS0AFD4107DGWE&qid=1630846084&sr=1-5-a8004193-6951-43f6-852a-aff7dbba9115-spons&psc=1&spLa=ZW5jcnlwdGVkUXVhbGlmaWVyPUExOUJPSU5EUlI3NTlKJmVuY3J5cHRlZElkPUEwODYwMjgwM1YwQ0hOU0VRS09RMSZlbmNyeXB0ZWRBZElkPUEwMjkzMDE5UkEzOFg5RjJZMkNOJndpZGdldE5hbWU9c3BfcGhvbmVfc2VhcmNoX3RoZW1hdGljJmFjdGlvbj1jbGlja1JlZGlyZWN0JmRvTm90TG9nQ2xpY2s9dHJ1ZQ==",
			"mentions": "@here",
			"source": "884058507048017980",
			"isEnabled": false,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "884058507672977439",
			"scheduleName": "260288776360820736_400560944201072650_reminder_1630846373157",
			"currentJob": null
		},
		"1630892060012": {
			"id": 1630892060012,
			"creationTime": 1630892060012,
			"reminderTime": "2021-09-28T23:55:00.000Z ",
			"originalReminderTime": "2021-09-28T23:55:00.000Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "400560944201072650",
			"author": "260288776360820736",
			"message": "Massage",
			"mentions": "@here",
			"source": "884250131409559602",
			"isEnabled": false,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "892560055289905162",
			"scheduleName": "260288776360820736_400560944201072650_reminder_1630892060012",
			"currentJob": null
		},
		"1630892086918": {
			"id": 1630892086918,
			"creationTime": 1630892086918,
			"reminderTime": "2021-09-06T04:34:46.918Z ",
			"originalReminderTime": "2021-09-06T04:34:46.918Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "400560944201072650",
			"author": "260288776360820736",
			"message": "https:\u002F\u002Fwww.amazon.com\u002FIron-Age-Portable-Technology-Invention\u002Fdp\u002FB07FNQTH4Y\u002Fref=sxin_19_pa_sp_phone_search_thematic_sspa?adgrpid=55620945066&cv_ct_cx=pull+up+bar%27&dchild=1&gclid=Cj0KCQjw1dGJBhD4ARIsANb6OdmxWeYHNF-kTGz8GTWHAAY9DSC8Wc9Wi5R8P_EnwE39vTR3ahWNIXEaAtapEALw_wcB&hvadid=274685512032&hvdev=m&hvlocphy=9033288&hvnetw=g&hvqmt=e&hvrand=14715245629924416859&hvtargid=kwd-376049839339&hydadcr=17345_9859339&keywords=pull+up+bar%27&pd_rd_i=B07FNQTH4Y&pd_rd_r=ec32cb35-b229-4180-8ef5-42dc6b8da1a4&pd_rd_w=sehv4&pd_rd_wg=T2mmF&pf_rd_p=3258799c-7411-4c36-a72c-646dbb1bc760&pf_rd_r=4T3NP5PS0AFD4107DGWE&qid=1630846084&sr=1-5-a8004193-6951-43f6-852a-aff7dbba9115-spons&psc=1&spLa=ZW5jcnlwdGVkUXVhbGlmaWVyPUExOUJPSU5EUlI3NTlKJmVuY3J5cHRlZElkPUEwODYwMjgwM1YwQ0hOU0VRS09RMSZlbmNyeXB0ZWRBZElkPUEwMjkzMDE5UkEzOFg5RjJZMkNOJndpZGdldE5hbWU9c3BfcGhvbmVfc2VhcmNoX3RoZW1hdGljJmFjdGlvbj1jbGlja1JlZGlyZWN0JmRvTm90TG9nQ2xpY2s9dHJ1ZQ==",
			"mentions": "@here",
			"source": "884250244286668841",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "884295543734538310",
			"scheduleName": "260288776360820736_400560944201072650_reminder_1630892086918",
			"currentJob": null
		},
		"1630994032982": {
			"id": 1630994032982,
			"creationTime": 1630994032982,
			"reminderTime": "2021-09-07T19:00:00.000Z ",
			"originalReminderTime": "2021-09-07T19:00:00.000Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "400560944201072650",
			"author": "260288776360820736",
			"message": "Walk Dogs",
			"mentions": "@here",
			"source": "884677837116833792",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "884875671388708915",
			"scheduleName": "260288776360820736_400560944201072650_reminder_1630994032982",
			"currentJob": null
		},
		"1632779559775": {
			"id": 1632779559775,
			"creationTime": 1632779559775,
			"reminderTime": "2021-09-28T21:00:00.000Z ",
			"originalReminderTime": "2021-09-28T21:00:00.000Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "891106269262385183",
			"author": "260288776360820736",
			"message": "Free shit: https:\u002F\u002Fgaming.amazon.com\nI'm a huge shill.",
			"mentions": "@here",
			"source": "892166878917709865",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "319291359376703488",
			"discordChannelId": "891106269262385183",
			"discordMessageId": "892516015152431145",
			"scheduleName": "260288776360820736_891106269262385183_reminder_1632779559775",
			"currentJob": null
		},
		"1635646803315": {
			"id": 1635646803315,
			"creationTime": 1635646803315,
			"reminderTime": "2021-10-31T05:20:03.314Z ",
			"originalReminderTime": "2021-10-31T05:20:03.314Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "260288776360820736",
			"author": "260288776360820736",
			"message": "Phone for Haze",
			"mentions": null,
			"source": "904192970209787975",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "904238270270042123",
			"scheduleName": "260288776360820736_260288776360820736_reminder_1635646803315",
			"currentJob": null
		},
		"1639186882784": {
			"id": 1639186882784,
			"creationTime": 1639186882784,
			"reminderTime": "Wed Dec 15 2021 01:41:22 GMT+0000 (Coordinated Universal Time)",
			"originalReminderTime": "2021-12-12T01:41:22.783Z ",
			"isRepeat": false,
			"repeatInterval": 86400000,
			"executionNumber": 4,
			"target": "794696570205241374",
			"author": "260288776360820736",
			"message": "Free Things: https:\u002F\u002Fplayeternalreturn.com\u002Fposts\u002Fnews\u002F192?hl=en-US",
			"mentions": "@here",
			"source": "919041139779199016",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "319291359376703488",
			"discordChannelId": "794696570205241374",
			"discordMessageId": "920490688574021663",
			"scheduleName": "260288776360820736_794696570205241374_reminder_1639186882784",
			"currentJob": null
		},
		"1639449563172": {
			"id": 1639449563172,
			"creationTime": 1639449563173,
			"reminderTime": "2022-11-20T12:00:00.000Z ",
			"originalReminderTime": "2022-11-20T12:00:00.000Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 0,
			"target": "400560944201072650",
			"author": "260288776360820736",
			"message": "Don't fucking try to con Haze again.  It backfired last time.",
			"mentions": "@here",
			"source": "920142901168730192",
			"isEnabled": false,
			"isFired": false,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "920142902020169808",
			"scheduleName": "260288776360820736_400560944201072650_reminder_1639449563172",
			"currentJob": null
		},
		"1639449622206": {
			"id": 1639449622206,
			"creationTime": 1639449622206,
			"reminderTime": "2022-11-20T12:00:00.000Z ",
			"originalReminderTime": "2022-11-20T12:00:00.000Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 0,
			"target": "400560944201072650",
			"author": "260288776360820736",
			"message": "Don't fucking try to con Haze again.  It backfired last time.  Also, bedsheets? Really?  That's kinda weird in retrospect.",
			"mentions": "@here",
			"source": "920143148968214571",
			"isEnabled": true,
			"isFired": false,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "920143149559595048",
			"scheduleName": "260288776360820736_400560944201072650_reminder_1639449622206",
			"currentJob": null
		},
		"1640724778772": {
			"id": 1640724778772,
			"creationTime": 1640724778772,
			"reminderTime": "2021-12-30T20:52:58.771Z ",
			"originalReminderTime": "2021-12-30T20:52:58.771Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "138398309776621569",
			"author": "260288776360820736",
			"message": "Spark if you want",
			"mentions": null,
			"source": "925491541970133084",
			"isEnabled": false,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "401293854000545792",
			"discordMessageId": "926216319760740464",
			"scheduleName": "260288776360820736_138398309776621569_reminder_1640724778772",
			"currentJob": null
		},
		"1640898378332": {
			"id": 1640898378332,
			"creationTime": 1640898378332,
			"reminderTime": "2021-12-31T03:06:18.331Z ",
			"originalReminderTime": "2021-12-31T03:06:18.331Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "138398309776621569",
			"author": "138398309776621569",
			"message": "use rest of rolls on new banner",
			"mentions": null,
			"source": "926219672234385449",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "401293854000545792",
			"discordMessageId": "926310270517792828",
			"scheduleName": "138398309776621569_138398309776621569_reminder_1640898378332",
			"currentJob": null
		},
		"1640976179784": {
			"id": 1640976179784,
			"creationTime": 1640976179784,
			"reminderTime": "2022-12-01T12:00:00.000Z ",
			"originalReminderTime": "2022-12-01T12:00:00.000Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 0,
			"target": "400560944201072650",
			"author": "260288776360820736",
			"message": "Super Bright Flashlight for Dad",
			"mentions": "@here",
			"source": "926545926548496414",
			"isEnabled": true,
			"isFired": false,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "926545996438179930",
			"scheduleName": "260288776360820736_400560944201072650_reminder_1640976179784",
			"currentJob": null
		},
		"1641077713563": {
			"id": 1641077713563,
			"creationTime": 1641077713563,
			"reminderTime": "2022-01-27T22:55:13.562Z ",
			"originalReminderTime": "2022-01-27T22:55:13.562Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "400560944201072650",
			"author": "260288776360820736",
			"message": "Meet up with Trent",
			"mentions": "@here",
			"source": "926971858878857287",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "936393953098465351",
			"scheduleName": "260288776360820736_400560944201072650_reminder_1641077713563",
			"currentJob": null
		},
		"1645677557157": {
			"id": 1645677557157,
			"creationTime": 1645677557157,
			"reminderTime": "2022-02-24T23:00:00.000Z ",
			"originalReminderTime": "2022-02-24T23:00:00.000Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "478122196812693506",
			"author": "260288776360820736",
			"message": "Elden Ring released",
			"mentions": "@here",
			"source": "946264999997898823",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "478122196812693504",
			"discordChannelId": "478122196812693506",
			"discordMessageId": "946542006258266162",
			"scheduleName": "260288776360820736_478122196812693506_reminder_1645677557157",
			"currentJob": null
		},
		"1645677601470": {
			"id": 1645677601470,
			"creationTime": 1645677601470,
			"reminderTime": "2022-02-24T23:00:00.000Z ",
			"originalReminderTime": "2022-02-24T23:00:00.000Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "945839074718146570",
			"author": "260288776360820736",
			"message": "Available.",
			"mentions": "@here",
			"source": "946265187005136937",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "319291359376703488",
			"discordChannelId": "945839074718146570",
			"discordMessageId": "946542006648336385",
			"scheduleName": "260288776360820736_945839074718146570_reminder_1645677601470",
			"currentJob": null
		},
		"1645887609463": {
			"id": 1645887609463,
			"creationTime": 1645887609464,
			"reminderTime": "2022-02-26T20:00:00.000Z ",
			"originalReminderTime": "2022-02-26T20:00:00.000Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "400560944201072650",
			"author": "260288776360820736",
			"message": "Valentine's",
			"mentions": "@here",
			"source": "947146023418073178",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "947221486249332766",
			"scheduleName": "260288776360820736_400560944201072650_reminder_1645887609463",
			"currentJob": null
		},
		"1645919955422": {
			"id": 1645919955422,
			"creationTime": 1645919955422,
			"reminderTime": "Tue Mar 21 2023 08:00:00 GMT+0000 (Coordinated Universal Time)",
			"originalReminderTime": "2022-03-21T08:00:00.000Z ",
			"isRepeat": true,
			"repeatInterval": 31536000000,
			"executionNumber": 1,
			"target": "400560944201072650",
			"author": "260288776360820736",
			"message": "Tek Day",
			"mentions": "@here",
			"source": "947281693335752724",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "955375211065245728",
			"scheduleName": "260288776360820736_400560944201072650_reminder_1645919955422",
			"currentJob": null
		},
		"1646856296689": {
			"id": 1646856296689,
			"creationTime": 1646856296689,
			"reminderTime": "2022-03-10T10:00:00.000Z ",
			"originalReminderTime": "2022-03-10T10:00:00.000Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "400560944201072650",
			"author": "260288776360820736",
			"message": "Banner change",
			"mentions": "@here",
			"source": "951208992368119899",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "951419142798450708",
			"scheduleName": "260288776360820736_400560944201072650_reminder_1646856296689",
			"currentJob": null
		},
		"1647090248101": {
			"id": 1647090248101,
			"creationTime": 1647090248101,
			"reminderTime": "2022-03-31T07:00:00.000Z ",
			"originalReminderTime": "2022-03-31T07:00:00.000Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "400560944201072650",
			"author": "260288776360820736",
			"message": "Use GBF Ticket",
			"mentions": "@here",
			"source": "952190256118116422",
			"isEnabled": false,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "958983990390439947",
			"scheduleName": "260288776360820736_400560944201072650_reminder_1647090248101",
			"currentJob": null
		},
		"1647665586394": {
			"id": 1647665586394,
			"creationTime": 1647665586394,
			"reminderTime": "2022-03-19T09:53:06.393Z ",
			"originalReminderTime": "2022-03-19T09:53:06.393Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "400560944201072650",
			"author": "260288776360820736",
			"message": "Mt. Vlov",
			"mentions": "@here",
			"source": "954603398953586698",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "954678898929582080",
			"scheduleName": "260288776360820736_400560944201072650_reminder_1647665586394",
			"currentJob": null
		},
		"1648203084376": {
			"id": 1648203084376,
			"creationTime": 1648203084376,
			"reminderTime": "2022-11-25T12:00:00.000Z ",
			"originalReminderTime": "2022-11-25T12:00:00.000Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 0,
			"target": "400560944201072650",
			"author": "260288776360820736",
			"message": "https:\u002F\u002Fwww.google.com\u002Fsearch?q=Figma+FALSLANDER+RONIN+&sxsrf=APq-WBs8XoqOPaun_uqWEMdqNSvjFK_Y2g%3A1648202405723&source=hp&ei=pZI9Yo2yJtufkPIPkNKZgAU&iflsig=AHkkrS4AAAAAYj2gtSM6QMq-w46akGWeuF3RZPxGU6Mk&ved=0ahUKEwjNmJ-3gOH2AhXbD0QIHRBpBlAQ4dUDCAg&uact=5&oq=Figma+FALSLANDER+RONIN+&gs_lcp=Cgdnd3Mtd2l6EAMyBggAEBYQHlAAWABgwQFoAHAAeACAAVKIAVKSAQExmAEAoAECoAEB&sclient=gws-wiz",
			"mentions": "@here",
			"source": "956857829547982878",
			"isEnabled": true,
			"isFired": false,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "956857831192150017",
			"scheduleName": "260288776360820736_400560944201072650_reminder_1648203084376",
			"currentJob": null
		},
		"1650295762878": {
			"id": 1650295762878,
			"creationTime": 1650295762878,
			"reminderTime": "2022-04-19T03:29:22.877Z ",
			"originalReminderTime": "2022-04-19T03:29:22.877Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "400560944201072650",
			"author": "260288776360820736",
			"message": "Tek time",
			"mentions": "@here",
			"source": "965635158969573446",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "965816354823348285",
			"scheduleName": "260288776360820736_400560944201072650_reminder_1650295762878",
			"currentJob": null
		},
		"1650858733047": {
			"id": 1650858733047,
			"creationTime": 1650858733047,
			"reminderTime": "2022-04-25T12:00:00.000Z ",
			"originalReminderTime": "2022-04-25T12:00:00.000Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 0,
			"target": "319291473784995840",
			"author": "260288776360820736",
			"message": "Do the alliance before the maint starts.",
			"mentions": "@here",
			"source": "967996427332644904",
			"isEnabled": false,
			"isFired": false,
			"discordGuildId": "319291359376703488",
			"discordChannelId": "319291473784995840",
			"discordMessageId": "967996428972621874",
			"scheduleName": "260288776360820736_319291473784995840_reminder_1650858733047",
			"currentJob": null
		},
		"1650858781162": {
			"id": 1650858781162,
			"creationTime": 1650858781162,
			"reminderTime": "2022-04-26T00:00:00.000Z ",
			"originalReminderTime": "2022-04-26T00:00:00.000Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "319291473784995840",
			"author": "260288776360820736",
			"message": "Do the alliance before the maint starts.",
			"mentions": "@here",
			"source": "967996629997211668",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "319291359376703488",
			"discordChannelId": "319291473784995840",
			"discordMessageId": "968300378087100446",
			"scheduleName": "260288776360820736_319291473784995840_reminder_1650858781162",
			"currentJob": null
		},
		"1652321851791": {
			"id": 1652321851791,
			"creationTime": 1652321851792,
			"reminderTime": "2022-12-15T12:00:00.000Z ",
			"originalReminderTime": "2022-12-15T12:00:00.000Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 0,
			"target": "400560944201072650",
			"author": "260288776360820736",
			"message": "Christmas Gift Idea: https:\u002F\u002Festablishedtitles.com\u002Fproducts\u002Fcopy-of-couple-title-pack?variant=34124310183995",
			"mentions": "@here",
			"source": "974133191550046248",
			"isEnabled": false,
			"isFired": false,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "974133193886298122",
			"scheduleName": "260288776360820736_400560944201072650_reminder_1652321851791",
			"currentJob": null
		},
		"1652321941748": {
			"id": 1652321941748,
			"creationTime": 1652321941748,
			"reminderTime": "2022-12-08T12:00:00.000Z ",
			"originalReminderTime": "2022-12-08T12:00:00.000Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 0,
			"target": "400560944201072650",
			"author": "260288776360820736",
			"message": "Christmas Gift Idea: https:\u002F\u002Festablishedtitles.com\u002Fproducts\u002Fcopy-of-couple-title-pack?variant=34124310183995",
			"mentions": "@here",
			"source": "974133569851117638",
			"isEnabled": true,
			"isFired": false,
			"discordGuildId": "@me",
			"discordChannelId": "400560944201072650",
			"discordMessageId": "974133571168108615",
			"scheduleName": "260288776360820736_400560944201072650_reminder_1652321941748",
			"currentJob": null
		},
		"1655276943768": {
			"id": 1655276943768,
			"creationTime": 1655276943768,
			"reminderTime": "2022-06-17T07:09:03.767Z ",
			"originalReminderTime": "2022-06-17T07:09:03.767Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "138398309776621569",
			"author": "138398309776621569",
			"message": "spend your green np",
			"mentions": null,
			"source": "986527746652000296",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "401293854000545792",
			"discordMessageId": "987252523536637975",
			"scheduleName": "138398309776621569_138398309776621569_reminder_1655276943768",
			"currentJob": null
		},
		"1655395821356": {
			"id": 1655395821356,
			"creationTime": 1655395821356,
			"reminderTime": "2022-06-17T02:10:21.355Z ",
			"originalReminderTime": "2022-06-17T02:10:21.355Z ",
			"isRepeat": false,
			"repeatInterval": null,
			"executionNumber": 1,
			"target": "138398309776621569",
			"author": "138398309776621569",
			"message": "get free skin",
			"mentions": null,
			"source": "987026355197722675",
			"isEnabled": true,
			"isFired": true,
			"discordGuildId": "@me",
			"discordChannelId": "401293854000545792",
			"discordMessageId": "987177352624750624",
			"scheduleName": "138398309776621569_138398309776621569_reminder_1655395821356",
			"currentJob": null
		}
	},
	"notes": {}
};

(async () => {
	const client = new PrismaClient();
	await client.$connect();

	var battleUsers: (Omit<BattleUser, 'id'> & {
		battleTraps: (Omit<Omit<BattleTrap, 'id'>, 'battleUserId'> & {
			records: Omit<Omit<BattleTrapRecord, 'id'>, 'trapId'>[];
		})[];
	})[] = [];
	for (const [_, user] of Object.entries(afkt.battle.users)) {
		if (!user._id) continue;

		var battleUser = transform(user, UserTemplate) as UserTemplate;

		const traps = Object.entries(afkt.battle.traps)
			.filter((value) => value[1]._owner === battleUser.userId);

		for (const [_, trap] of traps) {
			var battleTrap = transform(trap, TrapTemplate) as TrapTemplate;

			battleTrap.records.push({
				guildId: GUILD_ID,
				type: BattleTrapRecordType.Create,
				payload: {
					config: "0.0",
					createdAt: trap._createdAt,
					guildId: GUILD_ID,
					damage: {
						baseDamage: 0,
						durationDamage: 0,
						numCharactersDamage: 0,
						wordDamage: 0,
					},
					experience: {
						base: 0,
						bonus: 0,
					},
					invocation: {
						channelId: '',
						messageId: trap._messageId,
						interactionid: '',
						type: 'Message',
					},
					owner: trap._owner
				},
			});

			battleTrap.state = BattleTrapState.Removed;

			if (trap._firedAt) {
				battleTrap.records.push({
					guildId: GUILD_ID,
					type: BattleTrapRecordType.Trigger,
					payload: {
						config: "0.0",
						createdAt: trap._createdAt,
						guildId: GUILD_ID,
						damage: {
							baseDamage: 0,
							durationDamage: 0,
							numCharactersDamage: 0,
							wordDamage: 0,
						},
						experience: {
							base: 0,
							bonus: 0,
						},
						invocation: {
							channelId: '',
							messageId: trap._messageId,
							interactionid: '',
							type: 'Message',
						},
						duration: trap._firedAt - trap._createdAt,
						firedAt: trap._firedAt,
						trigger: {
							channelId: '',
							messageId: '',
							type: "Message",
						},
						victim: {
							userId: trap._victim,
							battleUserId: '',
							energy: 0,
							experience: 0,
							health: 0,
						},
						owner: trap._owner
					},
				});

				battleTrap.state = BattleTrapState.Fired;
			} else if ((user._traps as string[]).includes(trap._id)) {
				battleTrap.state = BattleTrapState.Armed;
			}

			battleUser.battleTraps.push({
				...battleTrap,
			});
		}

		battleUsers.push({
			...battleUser,
			guildId: GUILD_ID,
			info: {
				createdAt: new Date(battleUser.info.createdAt),
				lastEditedAt: new Date(battleUser.info.createdAt),
			},
			battleTraps: battleUser.battleTraps.map((trap) => ({
				...trap,
				createdAt: new Date(trap.createdAt),
				state: trap.state as BattleTrapState
			})),
		});
	}


	var customCommands: (Omit<CustomCommand, 'id'>)[] = [];
	for (const [_, command] of Object.entries(afkt.custom.commands)) {
		var customCommandOutput = transform(command, CustomCommandTemplate) as CustomCommandTemplate;

		customCommands.push({
			...customCommandOutput,
			guildId: GUILD_ID,
			aliases: [],
			createdAt: new Date(customCommandOutput.createdAt),
			lastUsedAt: new Date(customCommandOutput.lastUsedAt),
		});
	}


	var reminders: (Omit<Reminder, 'id'> & {
		schedules: Omit<Omit<ReminderSchedule, 'id'>, 'reminderId'>[];
		events: Omit<Omit<ReminderEvent, 'id'>, 'reminderId'>[];
	})[] = [];
	for (const [_, reminder] of Object.entries(global.reminder)) {
		var reminderOutput = transform(reminder, ReminderTemplate) as ReminderTemplate;
		var scheduleOutput = transform(reminder, ReminderScheduleTemplate) as ReminderScheduleTemplate;
		var eventOutput = transform(reminder, ReminderEventTemplate) as ReminderEventTemplate;

		function outputTimeValidInput(input: string | number | Date) {
			if(typeof input === 'string') return input.trim();
			if(typeof input === 'number') return input;
			return input;
		}

		reminderOutput.schedules.push({
			...scheduleOutput,
			createdAt: new Date(outputTimeValidInput(reminder.creationTime)),
			lastEditedAt: new Date(outputTimeValidInput(reminder.creationTime)),
			reminderTime: new Date(outputTimeValidInput(reminder.reminderTime ?? reminder.originalReminderTime)),
		});

		reminderOutput.events.push({
			...eventOutput,
			createdAt: new Date(outputTimeValidInput(reminder.creationTime)),
		})

		reminders.push({
			...reminderOutput,
			createdAt: new Date(outputTimeValidInput(reminder.creationTime)),
			target: {
				...reminderOutput.target,
				guildId: reminder.discordGuildId ?? null,
				type: ReminderTargetType.User,
			},
			schedules: reminderOutput.schedules.map((schedule) => ({
				...schedule,
				repeat: {
					...schedule.repeat,
					interval: (schedule.repeat.interval) ? BigInt(schedule.repeat.interval) : null,
				}
			})),
			jobId: "", 
			events: reminderOutput.events.map((event) => ({
				...event,
				eventType: (event.eventType ?? 'Create') as ReminderEventType,
			}))
		})
	};

	await client.$transaction([
		...battleUsers.map((battleUser) => client.battleUser.create({
			data: {
				...battleUser,
				battleTraps: {
					create: battleUser.battleTraps.map((trap) => ({
						...trap,
						records: {
							create: trap.records.map((record) => ({
								...record,
								payload: record.payload as Prisma.InputJsonValue
							}))
						}
					}))
				}
			},
		})),
		client.customCommand.createMany({
			data: customCommands,
		}),
		...reminders.map((reminder) => client.reminder.create({
			data: {
				...reminder,
				schedules: {
					create: reminder.schedules,
				},
				events: {
					create: reminder.events.map((event) => ({
						...event,
						payload: event.payload as Prisma.InputJsonValue,
					})),
				}
			}
		})),
	]);

	console.log(`Done`);
})();