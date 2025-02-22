import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Audio} from "./../../structures/Audio"
import {CommandFunctions} from "./../../structures/CommandFunctions"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {Permission} from "../../structures/Permission"

export default class Reverse extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Reverses an audio file (this one is awesome).",
            help:
            `
            \`reverse\` - Reverses the song that is playing.
            \`reverse link/query\` - An alias for \`play reverse\`
            \`reverse download/dl\` - Applies the effect on an mp3 attachment and uploads it.
            `,
            examples:
            `
            \`=>reverse\`
            `,
            aliases: [],
            guildOnly: true,
            cachedGuildOnly: true,
            cooldown: 15,
            premium: true,
            subcommandEnabled: true
        })
        const linkOption = new SlashCommandOption()
            .setType("string")
            .setName("query")
            .setDescription("Optional query to search for or dl to apply to an attachment.")

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(linkOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const audio = new Audio(discord, message)
        const cmd = new CommandFunctions(discord, message)
        const perms = new Permission(discord, message)
        const queue = audio.getQueue()
        let setDownload = false
        if (args[1] === "download" || args[1] === "dl") {
            setDownload = true
            args.shift()
        }
        if (Functions.combineArgs(args, 1).trim()) {
            args.shift()
            return cmd.runCommand(message, ["play", "reverse", ...args])
        }
        if (!audio.checkMusicPermissions()) return
        if (!audio.checkMusicPlaying()) return
        const rep = await this.reply("_Reversing the file, please wait..._")
        let file = ""
        if (setDownload) {
            const regex = new RegExp(/.(mp3|wav|flac|ogg|aiff)/)
            const attachment = await discord.fetchLastAttachment(message, false, regex)
            if (!attachment) return this.reply(`Only **mp3**, **wav**, **flac**, **ogg**, and **aiff** files are supported.`)
            file = attachment
        } else {
            const queue = audio.getQueue()
            file = queue?.[0].file
        }
        await audio.reverse(file, setDownload)
        if (rep) rep.delete()
        if (!setDownload) {
            const embed = await audio.updateNowPlaying()
            discord.edit(queue[0].message!, embed)
            const rep = await this.reply("Reversed the file!")
            await Functions.timeout(3000)
        Functions.deferDelete(rep, 0)
        if (message instanceof Message) Functions.deferDelete(message, 0)
        }
    }
}
