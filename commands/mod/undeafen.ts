import {GuildMember, Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Embeds} from "./../../structures/Embeds"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class Undeafen extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Server undeafens a user.",
            help:
            `
            \`undeafen @user1 @user2 reason?\` - Server undeafens the user(s) with an optional reason
            \`undeafen id1 id2 reason?\` - Server undeafens by user id instead of mention
            `,
            examples:
            `
            \`=>undeafen @user\`
            `,
            guildOnly: true,
            cachedGuildOnly: true,
            aliases: ["undeaf", "vcundeaf"],
            cooldown: 3,
            subcommandEnabled: true
        })
        const reasonOption = new SlashCommandOption()
            .setType("string")
            .setName("reason")
            .setDescription("The undeafen reason.")

        const userOption = new SlashCommandOption()
            .setType("user")
            .setName("user")
            .setDescription("The user to undeafen.")
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
        const undeafenEmbed = embeds.createEmbed()
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
            undeafenEmbed
            .setAuthor({name: "undeafen", iconURL: "https://kisaragi.moe/assets/embed/undeafen.png"})
            .setTitle(`**You Were Undeafened** ${discord.getEmoji("mexShrug")}`)
            .setDescription(`${discord.getEmoji("star")}_You were undeafened from ${message.guild!.name} for reason:_ **${reason}**`)
            try {
                await member.voice.setDeaf(false, reason)
                const data = {type: "undeafen", user: member.id, executor: message.author.id, date: Date.now(), guild: message.guild?.id, reason, context: message.url}
                discord.emit("caseUpdate", data)
            } catch {
                return this.reply(`I need the **undeafen Members** permission, or this user is not in a voice channel ${discord.getEmoji("kannaFacepalm")}`)
            }
            const dm = await member.createDM().catch(() => null)
            if (dm) await discord.channelSend(dm, undeafenEmbed).catch(() => null)
        }
        if (!members[0]) return this.reply(`Invalid users ${discord.getEmoji("kannaFacepalm")}`)
        undeafenEmbed
        .setAuthor({name: "undeafen", iconURL: "https://kisaragi.moe/assets/embed/undeafen.png"})
        .setTitle(`**Member Undeafened** ${discord.getEmoji("mexShrug")}`)
        .setDescription(`${discord.getEmoji("star")}_Successfully undeafened ${members.join(", ")} for reason:_ **${reason}**`)
        return this.reply(undeafenEmbed)
    }
}
