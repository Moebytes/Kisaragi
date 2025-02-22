import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {getVoiceConnection} from "@discordjs/voice"
import {Command} from "../../structures/Command"
import {Audio} from "./../../structures/Audio"
import {Embeds} from "./../../structures/Embeds"
import {Kisaragi} from "./../../structures/Kisaragi"
import {Permission} from "../../structures/Permission"

export default class Stop extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Stops a music stream and leaves the voice channel.",
            help:
            `
            \`stops\` - Stops playback
            `,
            examples:
            `
            \`=>stop\`
            `,
            aliases: ["disconnect"],
            guildOnly: true,
            cachedGuildOnly: true,
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
        const audio = new Audio(discord, message)
        const perms = new Permission(discord, message)
        if (!message.guild) return
        if (!audio.checkMusicPermissions()) return

        const connection = getVoiceConnection(message.guild.id)

        if (!connection) return this.reply(`I am not in a voice channel ${discord.getEmoji("kannaFacepalm")}`)
        const memberVoice = message.member?.voice?.channel
        if (connection.joinConfig.channelId === memberVoice?.id) {
            audio.deleteQueue()
            connection?.disconnect()
            connection?.destroy()
            return this.reply(`Left the voice channel and stopped playback.`)
        } else {
            return this.reply(`You are not in same voice channel as me..? ${discord.getEmoji("confusedAnime")}`)
        }
    }
}
