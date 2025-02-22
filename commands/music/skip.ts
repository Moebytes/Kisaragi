import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Audio} from "./../../structures/Audio"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {Permission} from "../../structures/Permission"

export default class Skip extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Skips a song, or skips to a song.",
            help:
            `
            \`skip\` - Skips to the next song.
            \`skip num/name\` - Skips to the song at the position, or with the given title.
            `,
            examples:
            `
            \`=>skip 3\`
            \`=>skip rainfall\`
            `,
            aliases: [],
            guildOnly: true,
            cachedGuildOnly: true,
            cooldown: 5,
            subcommandEnabled: true
        })
        const numOption = new SlashCommandOption()
            .setType("string")
            .setName("num")
            .setDescription("Skips to a position or to a matched title.")

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(numOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const audio = new Audio(discord, message)
        const perms = new Permission(discord, message)
        if (!audio.checkMusicPermissions()) return
        if (!audio.checkMusicPlaying()) return
        const input = Functions.combineArgs(args, 1)

        let amount = 1
        if (Number(input)) {
            amount = Number(input)
        } else if (input) {
            const queue = audio.getQueue()
            const index =  queue.findIndex((q) => q.title.toLowerCase().includes(input.toLowerCase()))
            if (index === -1) return this.reply(`Could not find a song with that name ${discord.getEmoji("kannaCurious")}`)
            amount = index + 1
        }
        let fxText = audio.hasEffects() ? `**If you added effects, be patient because they need to be re-applied.**` : ""
        const text = amount === 1 ? `Skipped this song! ${fxText}` : (Number(input) ? `Skipped to the song at position **${amount}**! ${fxText}` : `Skipped to **${input}**! ${fxText}`)
        await this.reply(text)
        await audio.skip(amount)
    }
}
