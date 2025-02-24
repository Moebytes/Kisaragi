import {Message, AttachmentBuilder, ContextMenuCommandInteraction, ModalBuilder,
TextInputBuilder, TextInputStyle, ActionRowBuilder, ModalActionRowComponentBuilder,
ModalSubmitInteraction} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption, ContextMenuCommand} from "../../structures/SlashCommandOption"
import sharp from "sharp"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class Invert extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
          description: "Inverts the colors of an image.",
          help:
          `
          \`invert url?\` - Inverts the colors
          `,
          examples:
          `
          \`=>invert\`
          `,
          aliases: [],
          cooldown: 10,
          defer: true,
          subcommandEnabled: true,
          contextEnabled: false
        })
        const urlOption = new SlashCommandOption()
            .setType("string")
            .setName("url")
            .setDescription("Url, or use the last posted image.")

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(urlOption)

        this.context = new ContextMenuCommand()
            .setName(this.constructor.name)
            .setType("message")
            .toJSON()
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        let url: string | undefined
        if (args[1]) {
            url = args[1]
        } else {
            let messageID = args[1].match(/\d{10,}/)?.[0] || ""
            if (messageID) {
                const channel = await discord.channels.fetch(message.channelId)
                if (channel?.isSendable()) {
                    const msg = await channel.messages.fetch(messageID)
                    url = msg.attachments.first()?.url || msg.embeds[0]?.image?.url
                }
            } else {
                url = await discord.fetchLastAttachment(message)
            }
        }
        if (!url) return this.reply(`Could not find an image ${discord.getEmoji("kannaCurious")}`)
        const arrayBuffer = await fetch(url).then((r) => r.arrayBuffer())
        let buffer = await sharp(arrayBuffer, {limitInputPixels: false})
        .negate({alpha: false}).toBuffer()
        const attachment = new AttachmentBuilder(buffer)
        return this.reply(`Inverted the colors!`, attachment)
    }
}
