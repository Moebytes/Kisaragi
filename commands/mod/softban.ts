import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Embeds} from "./../../structures/Embeds"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class Softban extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Bans and immediately unbans the specified users.",
            help:
            `
            \`softban @user1 @user2 reason?\` - softbans the user(s) with an optional reason
            \`softban id1 id2 reason?\` - softbans by user id instead of mention
            `,
            examples:
            `
            \`=>softban @user spammer\`
            `,
            guildOnly: true,
            aliases: [],
            cooldown: 3,
            subcommandEnabled: true
        })
        const reasonOption = new SlashCommandOption()
            .setType("string")
            .setName("reason")
            .setDescription("The softban reason.")

        const userOption = new SlashCommandOption()
            .setType("user")
            .setName("user")
            .setDescription("The user to softban.")
            .setRequired(true)
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(userOption)
            .addOption(reasonOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const perms = new Permission(discord, message)
        if (!await perms.checkMod()) return
        const softBanEmbed = embeds.createEmbed()
        const reasonArray: string[] = []
        const userArray: string[] = []

        for (let i = 1; i < args.length; i++) {
            if (args[i].match(/\d+/g)) {
                userArray.push(args[i].match(/\d+/g)![0])
            } else {
                reasonArray.push(args[i])
            }
        }

        const reason = reasonArray.join("") ? reasonArray.join(" ") : "None provided!"

        const members: string[] = []
        for (let i = 0; i < userArray.length; i++) {
            const user = await discord.users.fetch(userArray[i])
            if (user) {
                members.push(`<@${user.id}>`)
            } else {
                continue
            }
            softBanEmbed
            .setAuthor({name: "softban", iconURL: "https://kisaragi.moe/assets/embed/softban.png"})
            .setTitle(`**You Were Soft Banned** ${discord.getEmoji("sagiriBleh")}`)
            .setDescription(`${discord.getEmoji("star")}_You were soft banned from ${message.guild!.name} for reason:_ **${reason}**`)
            const id = user.id
            try {
                await message.guild?.members.ban(user, {reason, deleteMessageSeconds: 7 * 24 * 60 * 60})
                await message.guild?.members.unban(id, reason)
                const data = {type: "softban", user: id, executor: message.author.id, date: Date.now(), guild: message.guild?.id, reason, context: message.url}
                discord.emit("caseUpdate", data)
            } catch {
                return this.reply(`I need the **Ban Members** permission ${discord.getEmoji("kannaFacepalm")}`)
            }
            const dm = await user.createDM().catch(() => null)
            if (dm) await discord.channelSend(dm, softBanEmbed).catch(() => null)
        }
        if (!members[0]) return this.reply(`Invalid users ${discord.getEmoji("kannaFacepalm")}`)
        softBanEmbed
        .setAuthor({name: "softban", iconURL: "https://kisaragi.moe/assets/embed/softban.png"})
        .setTitle(`**Member Soft Banned** ${discord.getEmoji("sagiriBleh")}`)
        .setDescription(`${discord.getEmoji("star")}_Successfully soft banned ${members.join(", ")} for reason:_ **${reason}**`)
        return this.reply(softBanEmbed)
    }
}
