import {Emoji, Message, EmbedBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class Emojis extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Posts all emojis.",
            help:
            `
            \`emojis\` - Posts all of the emojis.
            \`emojis info\` - Posts all emojis with info.
            `,
            examples:
            `
            \`=>emojis\`
            \`=>emojis info\`
            `,
            guildOnly: true,
            aliases: [],
            random: "none",
            cooldown: 3,
            subcommandEnabled: true
        })
        const infoOption = new SlashCommandOption()
            .setType("string")
            .setName("info")
            .setDescription("Set to info to post with info.")

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(infoOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)

        if (args[1]?.toLowerCase() === "info") {
            const emojis = message.guild!.emojis
            const emojiArray = emojis.cache.map((e: Emoji) => discord.emojis.cache.find((emoji: Emoji) => e.id === emoji.id))
            const nameArray = emojis.cache.map((e: Emoji) => e.name)
            const idArray = emojis.cache.map((e: Emoji) => e.id)
            const createdArray = emojis.cache.map((e: Emoji) => e.createdAt ?? new Date())
            const step = 5.0
            const increment = Math.ceil(emojis.cache.size / step)
            const userEmbedArray: EmbedBuilder[] = []
            for (let i = 0; i < increment; i++) {
                const userEmbed = embeds.createEmbed()
                let description = ""
                for (let j = 0; j < step; j++) {
                    const value = (i*step)+j
                    if (!emojiArray[value]) break
                    description += `${discord.getEmoji("star")}_Emoji:_ **${emojiArray[value]}**\n` +
                    `${discord.getEmoji("star")}_Emoji Name:_ ${nameArray[value]}\n` +
                    `${discord.getEmoji("star")}_Emoji ID:_ \`${idArray[value]}\`\n` +
                    `${discord.getEmoji("star")}_Creation Date:_ ${Functions.formatDate(createdArray[value])}\n`
                }
                userEmbed
                .setAuthor({name: "emojis", iconURL: "https://kisaragi.moe/assets/embed/info.png"})
                .setTitle(`**${message.guild?.name}'s Emojis** ${discord.getEmoji("vigneDead")}`)
                .setThumbnail(message.guild?.iconURL({extension: "png"}) as string)
                .setDescription(`${discord.getEmoji("star")}_Emoji Count:_ **${emojiArray.length}**\n` + description)
                userEmbedArray.push(userEmbed)
            }
            return embeds.createReactionEmbed(userEmbedArray)
        }

        const emojis = message.guild?.emojis.cache.map((e)=> {
            if (e.animated) {
                return `<${e.identifier}>`
            } else {
                return `<:${e.identifier}>`
            }
        })!.join("")

        const split = Functions.splitMessage(emojis!, {maxLength: 2000, char: "<"})
        for (let i = 0; i < split.length; i++) {
            if (split.length > 1) split[i] = `<${split[i]}`
            i === 0 ? this.reply(split[i]) : this.send(split[i])
        }
    }
}
