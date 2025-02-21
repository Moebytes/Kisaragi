import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption, ContextMenuCommand} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class User extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Gets information on a user or on yourself.",
            help:
            `
            \`user @user?\` - Gets info on a user
            `,
            examples:
            `
            \`=>user\`
            `,
            guildOnly: true,
            aliases: ["member", "whois"],
            random: "none",
            cooldown: 5,
            subcommandEnabled: true,
            contextEnabled: true
        })
        const userOption = new SlashCommandOption()
            .setType("user")
            .setName("user")
            .setDescription("User, or yourself if not specified.")
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(userOption)

        this.context = new ContextMenuCommand()
            .setName(this.constructor.name)
            .setType("user")
            .toJSON()
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        let member = message.member
        if (args[1]) {
            let userID = args[1].match(/\d+/)?.[0] || ""
            member = await message.guild?.members.fetch(userID)!
        }

        const userEmbed = embeds.createEmbed()
        userEmbed
        .setAuthor({name: "user", iconURL: "https://kisaragi.moe/assets/embed/info.png"})
        .setTitle(`**User Info** ${discord.getEmoji("cirNo")}`)
        .setThumbnail(member?.displayAvatarURL({extension: "png"}) ?? "")
        .setDescription(
            `${discord.getEmoji("star")}_User:_ **${member?.user.tag}**\n` +
            `${discord.getEmoji("star")}_User ID:_ ${member?.id}\n` +
            `${discord.getEmoji("star")}_Joined Guild At:_ **${Functions.formatDate(member?.joinedAt!)}**\n` +
            `${discord.getEmoji("star")}_Created Account At:_ **${Functions.formatDate(member?.user.createdAt!)}**\n` +
            `${discord.getEmoji("star")}_Roles:_ ${Functions.checkChar(member?.roles.cache.map((r) => `<@&${r.id}>`).join(" ")!, 1000, " ")}`
        )
        return this.reply(userEmbed)
    }
}
