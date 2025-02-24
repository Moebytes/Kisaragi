import {Message, AttachmentBuilder, ContextMenuCommandInteraction, ModalBuilder,
TextInputBuilder, TextInputStyle, ActionRowBuilder, ModalActionRowComponentBuilder,
ModalSubmitInteraction} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption, ContextMenuCommand} from "../../structures/SlashCommandOption"
import sharp from "sharp"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Kisaragi} from "../../structures/Kisaragi"

export default class Scale extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
          description: "Scales an image by a certain factor.",
          help:
          `
          _Note: To resize by pixels instead, see \`resize\`._
          \`scale factor\` - Scales the last posted image
          \`scale factor url\` - Scales the linked image
          `,
          examples:
          `
          \`=>scale 1.5\`
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

        const factorOption = new SlashCommandOption()
            .setType("number")
            .setName("factor")
            .setDescription("Scale factor.")
            .setRequired(true)

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(factorOption)
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
        let factor = args[1] ? Number(args[1]) : 1
        let url: string | undefined
        if (args[2]) {
            url = args[2]
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
        if (message instanceof ContextMenuCommandInteraction) {
            const interaction = message as ContextMenuCommandInteraction
            const modal = new ModalBuilder()
                .setCustomId("scale-modal")
                .setTitle("Scale")

            const factorInput = new TextInputBuilder()
                .setCustomId("factor-input")
                .setLabel("Factor:")
                .setStyle(TextInputStyle.Short)

            const actionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(factorInput)
            modal.addComponents(actionRow)
            await interaction.showModal(modal)
            const filter = (interaction: ModalSubmitInteraction) => interaction.customId === "scale-modal"
            const modalSubmit = await interaction.awaitModalSubmit({filter, time: 600000})

            const factorField = modalSubmit.fields.getTextInputValue("factor-input").trim()
            factor = factorField ? Number(factorField) : 1
            this.message = modalSubmit as any
        }
        if (!url) return this.reply(`Could not find an image ${discord.getEmoji("kannaCurious")}`)
        const arrayBuffer = await fetch(url).then((r) => r.arrayBuffer())
        const metadata = await sharp(arrayBuffer, {limitInputPixels: false}).png().metadata()
        const width = Math.floor(metadata.width! * factor)
        const height = Math.floor(metadata.height! * factor)
        const buffer = await sharp(arrayBuffer, {limitInputPixels: false})
        .resize({width, height, fit: "fill"}).toBuffer()
        const attachment = new AttachmentBuilder(buffer)
        return this.reply(`Scaled the image by a factor of **${factor}x**!`, attachment)
    }
}
