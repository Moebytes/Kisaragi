import {GuildMember, Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Embeds} from "./../../structures/Embeds"
import {Kisaragi} from "./../../structures/Kisaragi"
import {SQLQuery} from "./../../structures/SQLQuery"

export default class Unrestrict extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Unrestricts users.",
            help:
            `
            \`unrestrict @user1 @user2 reason?\` - Unrestricts the user(s) with an optional reason
            \`unrestrict id1 id2 reason?\` - Unrestricts by user id instead of mention
            `,
            examples:
            `
            \`=>unrestrict @user shush\`
            `,
            guildOnly: true,
            aliases: [],
            cooldown: 3,
            subcommandEnabled: true
        })
        const reasonOption = new SlashCommandOption()
            .setType("string")
            .setName("reason")
            .setDescription("The unrestrict reason.")

        const userOption = new SlashCommandOption()
            .setType("user")
            .setName("user")
            .setDescription("The user to unrestrict.")
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
        const sql = new SQLQuery(message)
        const perms = new Permission(discord, message)
        if (!await perms.checkMod()) return
        const restrictEmbed = embeds.createEmbed()
        const restrict = await sql.fetchColumn("guilds", "restricted role")
        if (!restrict) return this.reply("You need to set a restricted role first!")
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
            const member = message.guild!.members.cache.find((m: GuildMember) => m.id === userArray[i]) as GuildMember
            if (!member) continue
            await member.roles.remove(restrict)
            const data = {type: "unrestrict", user: member.id, executor: message.author.id, date: Date.now(), guild: message.guild?.id, reason, context: message.url}
            discord.emit("caseUpdate", data)
            members.push(`<@${member.id}>`)
            restrictEmbed
            .setAuthor({name: "unrestrict", iconURL: "https://kisaragi.moe/assets/embed/unrestrict.png"})
            .setTitle(`**You Were Unrestricted** ${discord.getEmoji("yes")}`)
            .setDescription(`${discord.getEmoji("star")}_You were unrestricted in ${message.guild!.name} for reason:_ **${reason}**`)
            const dm = await member.createDM().catch(() => null)
            if (dm) await discord.channelSend(dm, restrictEmbed).catch(() => null)
        }
        if (!members[0]) return this.reply(`Invalid users ${discord.getEmoji("kannaFacepalm")}`)
        restrictEmbed
        .setAuthor({name: "restrict", iconURL: "https://kisaragi.moe/assets/embed/unrestrict.png"})
        .setTitle(`**Member Unrestricted** ${discord.getEmoji("yes")}`)
        .setDescription(`${discord.getEmoji("star")}_Successfully unrestricted ${members.join(", ")} for reason:_ **${reason}**`)
        return this.reply(restrictEmbed)
    }
}
