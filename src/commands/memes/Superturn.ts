import { ApplyOptions } from '@sapphire/decorators';
import { RandomMediaCommand } from '../../lib/structures/command/RandomMediaCommand';

const SHORT_DESCRIPTION = 'You\'ve been waiting a really long time...'

@ApplyOptions<RandomMediaCommand.Options>({
    name: 'superturn',
    aliases: ['super-turn', 'waiting'],
    description: SHORT_DESCRIPTION,
    folder: 'superturn',
    typeDescriptions: {
        "bernkastel": "Bernkastel (Umineko)",
        "chair": "Spinning Chair",
        "chargeman": "Chargeman Ken",
        "ds3": "Dark Souls Rolling",
        "huz": "Huzbug",
        "izaya": "Izaya Orihara (Durarara!!)",
        "kotomine": "Kotomine Kirei (Fate/Zero)",
        "maika": "Tsuchimikado Maika (To Aru Majutsu no Index)",
        "maki": "Maki Natsuo (Love Lab)",
        "robocop": "RoboCop (Animated Series)",
        "shirou": "Emiya Shirou (Fate/Stay Night)",
        "speedracer": "Speed Racer (Speed Racer)",
        "spinzaku": "Suzaku Kururugi (Code Geass)",
        "touhou": "Various Youkai (Touhou)",
        "truck": "Never-ending Truck Crash",
        "spinningbirdkick": "Kasumi Shigure (Valkyrie Drive: Mermaid)",
        "wheeloffortune": "The wheel of fate keeps turning."
    }
})
export class SuperturnCommand extends RandomMediaCommand {
}