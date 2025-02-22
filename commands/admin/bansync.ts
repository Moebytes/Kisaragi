import {Guild, GuildMember, Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Detector} from "./../../structures/Detector"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {SQLQuery} from "./../../structures/SQLQuery"

export default class BanSync extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Syncs the ban list of this server with another guild.",
            help:
            `
            _Note: The bot will only add bans unless you specify perfect._
            \`bansync guild name/id\` - Adds the bans from the server to this one
            \`bansync guild name/id perfect\` - Also removes bans that are not shared, for perfect sync.
            `,
            examples:
            `
            \`=>bansync my other server\`
            \`=>bansync another server perfect\`
            `,
            guildOnly: true,
            cachedGuildOnly: true,
            aliases: ["syncbans"],
            cooldown: 10,
            subcommandEnabled: true
        })
        const perfectOption = new SlashCommandOption()
            .setType("string")
            .setName("perfect")
            .setDescription("Type perfect to sync bans perfectly.")

        const guildOption = new SlashCommandOption()
            .setType("string")
            .setName("guild")
            .setDescription("Name/id of the other server.")
            .setRequired(true)
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(guildOption)
            .addOption(perfectOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const perms = new Permission(discord, message)
        if (!await perms.checkAdmin()) return
        const embeds = new Embeds(discord, message)
        const sql = new SQLQuery(message)
        let input = Functions.combineArgs(args, 1)
        if (!input) return this.reply(`You must specify a server ${discord.getEmoji("kannaFacepalm")}`)
        let perfect = false
        if (input.match(/perfect/)) {
            perfect = true
            input = input.replace(/perfect/, "")
        }

        let guild: Guild | undefined
        if (input.match(/\d{15,}/)) {
            guild = discord.guilds.cache.get(input.match(/\d{15,}/)?.[0] ?? "")
        } else {
            guild = discord.guilds.cache.find((g) => g.name.toLowerCase() === input.toLowerCase())
        }
        if (!guild) return this.reply(`Guild not found ${discord.getEmoji("kannaFacepalm")}`)

        try {
            const banList = await guild.bans.fetch().then((e) => e.map((b) => b.user.id))
            const currList = await message.guild!.bans.fetch().then((e) => e.map((b) => b.user.id))
            await Promise.all(banList.map(async (b) => {
                if (!currList.includes(b)) {
                    await message.guild?.members.ban(b)
                    await Functions.timeout(100)
                }
            }))
            if (perfect) {
                await Promise.all(currList.map(async (c) => {
                    if (!banList.includes(c)) {
                        await message.guild?.members.unban(c)
                        await Functions.timeout(100)
                    }
                }))
            }
            return this.reply(`Synced this guild's ban list with **${guild.name}**! ${discord.getEmoji("aquaUp")}`)
        } catch {
            return this.reply(`I need the **Manage Server** and the **Ban Members** permission in both servers. ${discord.getEmoji("kannaFacepalm")}`)
        }
    }
}
