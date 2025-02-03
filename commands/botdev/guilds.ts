import {Guild, Message, EmbedBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Functions} from "../../structures/Functions"
import {Kisaragi} from "../../structures/Kisaragi"
import {Permission} from "../../structures/Permission"

export default class Guilds extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Posts all the guilds the bot is in.",
            help:
            `
            \`guilds\` - Posts all of the bot guilds
            `,
            examples:
            `
            \`=>guilds\`
            `,
            aliases: [],
            random: "none",
            cooldown: 3,
            botdev: true,
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
        const perms = new Permission(discord, message)
        if (!perms.checkBotDev()) return
        const guilds = discord.guilds
        const guildArray = guilds.cache.map((g: Guild) => g.name)
        const idArray = guilds.cache.map((g: Guild) => g.id)
        const createdArray = guilds.cache.map((g: Guild) => g.createdAt)
        const step = 7.0
        const increment = Math.ceil(guilds.cache.size / step)
        const userEmbedArray: EmbedBuilder[] = []
        for (let i = 0; i < increment; i++) {
            const userEmbed = embeds.createEmbed()
            let description = ""
            for (let j = 0; j < step; j++) {
                const value = (i*step)+j
                if (!guildArray[value]) break
                description += `${discord.getEmoji("star")}_Guild:_ **${guildArray[value]}**\n` +
                `${discord.getEmoji("star")}_Guild ID:_ \`${idArray[value]}\`\n` +
                `${discord.getEmoji("star")}_Creation Date:_ ${Functions.formatDate(createdArray[value])}\n`
            }
            userEmbed
            .setAuthor({name: "guilds", iconURL: "https://kisaragi.moe/assets/embed/info.png"})
            .setTitle(`**${discord.user!.username}'s Guilds** ${discord.getEmoji("vigneDead")}`)
            .setThumbnail(message.guild!.iconURL({extension: "png"}) as string)
            .setDescription(`${discord.getEmoji("star")}_Guild Count:_ **${guildArray.length}**\n` + description)
            userEmbedArray.push(userEmbed)
        }
        return embeds.createReactionEmbed(userEmbedArray)
    }
}
