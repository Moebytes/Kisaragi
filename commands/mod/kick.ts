import {GuildMember, Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Embeds} from "./../../structures/Embeds"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class Kick extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Kicks the specified users.",
            help:
            `
            \`kick @user1 @user2 reason?\` - Kicks the user(s) with an optional reason
            \`kick id1 id2 reason?\` - Kicks by user id instead of mention
            `,
            examples:
            `
            \`=>kick @user annoying\`
            `,
            guildOnly: true,
            cachedGuildOnly: true,
            botPermission: "KickMembers",
            aliases: [],
            cooldown: 3,
            subcommandEnabled: true
        })
        const reasonOption = new SlashCommandOption()
            .setType("string")
            .setName("reason")
            .setDescription("The kick reason.")

        const userOption = new SlashCommandOption()
            .setType("user")
            .setName("user")
            .setDescription("The user to kick.")
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
        const kickEmbed = embeds.createEmbed()
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
            const member = message.guild!.members.cache.find((m: GuildMember) => m.id === userArray[i])
            if (member) {
                members.push(`<@${member.id}>`)
            } else {
                continue
            }
            kickEmbed
            .setAuthor({name: "kick", iconURL: "https://kisaragi.moe/assets/embed/kick.png"})
            .setTitle(`**You Were Kicked** ${discord.getEmoji("kannaLeave")}`)
            .setDescription(`${discord.getEmoji("star")}_You were kicked from ${message.guild!.name} for reason:_ **${reason}**`)
            try {
                await member.kick(reason)
                const data = {type: "kick", user: member.id, executor: message.author.id, date: Date.now(), guild: message.guild?.id, reason, context: message.url}
                discord.emit("caseUpdate", data)
            } catch {
                return this.reply(`I need the **Kick Members** permission ${discord.getEmoji("kannaFacepalm")}`)
            }
            const dm = await member.createDM().catch(() => null)
            if (dm) await discord.channelSend(dm, kickEmbed).catch(() => null)
        }
        if (!members[0]) return this.reply(`Invalid users ${discord.getEmoji("kannaFacepalm")}`)
        kickEmbed
        .setAuthor({name: "kick", iconURL: "https://kisaragi.moe/assets/embed/kick.png"})
        .setTitle(`**Member Kicked** ${discord.getEmoji("kannaLeave")}`)
        .setDescription(`${discord.getEmoji("star")}_Successfully kicked ${members.join(", ")} for reason:_ **${reason}**`)
        return this.reply(kickEmbed)
    }
}
