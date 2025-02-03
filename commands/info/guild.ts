import {Message, TextChannel, REST} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class Guild extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Gets information on this server.",
            help:
            `
            \`guild\` - Posts guild info
            `,
            examples:
            `
            \`=>guild\`
            `,
            guildOnly: true,
            aliases: ["server"],
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
        if (!(message.channel as TextChannel).permissionsFor(message.guild?.members.me!)?.has(["ManageGuild", "BanMembers"])) {
            return this.reply(`The bot needs the permission **Manage Server** and **Ban Members** in order to use this command. This is for counting the amount of invites and bans. ${this.discord.getEmoji("kannaFacepalm")}`)
        }
        const guildImg = message.guild?.bannerURL() ? message.guild.bannerURL({extension: "png"}) : (message.guild?.splashURL() ? message.guild.splashURL({extension: "png"}) : "")
        const inviteURL = await discord.getInvite(message.guild)

        const guildEmbed = embeds.createEmbed()
        guildEmbed

        .setAuthor({name: "guild", iconURL: "https://kisaragi.moe/assets/embed/info.png"})
        .setTitle(`**Guild Info** ${discord.getEmoji("aquaWut")}`)
        .setThumbnail(message.guild?.iconURL({extension: "png"}) || null)
        .setImage(guildImg || null)
        .setDescription(
            `${discord.getEmoji("star")}_Guild:_ **${message.guild?.name}**\n` +
            `${discord.getEmoji("star")}_Guild ID:_ \`${message.guild?.id}\`\n` +
            `${discord.getEmoji("owner")}_Owner:_ **${await message.guild?.fetchOwner().then((o) => o.user.username)}**\n` +
            `${discord.getEmoji("star")}_Shard:_ **${message.guild?.shard.id}**\n` +
            `${discord.getEmoji("star")}_Creation Date:_ **${Functions.formatDate(message.guild?.createdAt!)}**\n` +
            `${discord.getEmoji("star")}_Boosters:_ **${message.guild?.premiumSubscriptionCount}**\n` +
            `${discord.getEmoji("star")}_Bans:_ **${await message.guild?.bans.fetch().then((b)=>b.size)}**\n` +
            `${discord.getEmoji("star")}_Invites:_ **${await message.guild?.invites.fetch().then((i) => i.size)}**\n` +
            `${discord.getEmoji("star")}_Member Count:_ **${message.guild?.memberCount}**\n` +
            `${discord.getEmoji("star")}_Channel Count:_ **${message.guild?.channels.cache.size}**\n` +
            `${discord.getEmoji("star")}_Role Count:_ **${message.guild?.roles.cache.size}**\n` +
            `${discord.getEmoji("star")}_Emoji Count:_ **${message.guild?.emojis.cache.size}**\n` +
            `${discord.getEmoji("star")}_Members:_ ${Functions.checkChar(message.guild?.members.cache.map((m) => `\`${m.user.tag}\``).join(" ")!, 200, " ")}\n` +
            `${discord.getEmoji("star")}_Channels:_ ${Functions.checkChar(message.guild?.channels.cache.map((c) => `<#${c.id}>`).join(" ")!, 200, " ")}\n` +
            `${discord.getEmoji("star")}_Roles:_ ${Functions.checkChar(message.guild?.roles.cache.map((r) => `<@&${r.id}>`).join(" ")!, 200, " ")}\n` +
            `${discord.getEmoji("star")}_Emojis:_ ${Functions.checkChar(message.guild?.emojis.cache.map((e) => {
                if (e.animated) return `<${e.identifier}>`
                return `<:${e.identifier}>`
            }).join(" ")!, 200, " ")}\n` +
            `${discord.getEmoji("star")}_Invite Link:_ ${inviteURL}\n`
        )
        return this.reply(guildEmbed)
    }
}
