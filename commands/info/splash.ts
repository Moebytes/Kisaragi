import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Kisaragi} from "../../structures/Kisaragi"

export default class Splash extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Posts the guild's splash screen.",
            help:
            `
            \`splash\` - Posts the guild splash screen
            `,
            examples:
            `
            \`=>splash\`
            `,
            guildOnly: true,
            aliases: [],
            random: "none",
            cooldown: 5,
            subcommandEnabled: true
        })
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const splashEmbed = embeds.createEmbed()

        if (!message.guild) {
            try {
                const preview = await discord.fetchGuildPreview(message.guildId!)
                let splash = preview.discoverySplashURL({extension: "png", size: 512})
                return this.reply(splashEmbed
                    .setDescription(`**${preview.name}'s Splash Screen**`)
                    .setURL(splash)
                    .setImage(splash))
            } catch {
                return this.reply(`I have to be added to this guild or it must be discoverable.`)
            }
        }

        const splash = message.guild?.splashURL({extension: "png", size: 1024})
        if (!splash) return this.reply(`This guild doesn't have a splash screen ${discord.getEmoji("kannaFacepalm")}`)

        await this.reply(splashEmbed
        .setDescription(`**${message.guild!.name}'s Splash Screen**`)
        .setURL(splash)
        .setImage(splash))
    }
}
