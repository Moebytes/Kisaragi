import {Message, AttachmentBuilder, ContextMenuCommandInteraction, ModalBuilder,
TextInputBuilder, TextInputStyle, ActionRowBuilder, ModalActionRowComponentBuilder,
ModalSubmitInteraction} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption, ContextMenuCommand} from "../../structures/SlashCommandOption"
import sharp from "sharp"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Functions} from "../../structures/Functions"
import {Kisaragi} from "../../structures/Kisaragi"

export default class Lightness extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
          description: "Lightens or darkens an image.",
          help:
          `
          _Note: The range is -100 to 100._
          \`lightness amount\` - Changes the value of the last posted image
          \`lightness amount url\` - Changes the value of the linked image
          `,
          examples:
          `
          \`=>lightness 50\`
          \`=>lightness -25\`
          `,
          aliases: ["lighten", "darken", "darkness"],
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
            .setType("integer")
            .setName("factor")
            .setDescription("Lightness factor.")
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
        let url: string | undefined
        let value = Number(args[1])
        if (args[2]) {
            url = args[2]
        } else {
            let messageID = args[1].match(/\d{10,}/)?.[0] || ""
            if (messageID) {
                const msg = await message.channel.messages.fetch(messageID)
                url = msg.attachments.first()?.url || msg.embeds[0]?.image?.url
            } else {
                url = await discord.fetchLastAttachment(message)
            }
        }
        if (message instanceof ContextMenuCommandInteraction) {
            const interaction = message as ContextMenuCommandInteraction
            const modal = new ModalBuilder()
                .setCustomId("lightness-modal")
                .setTitle("Lightness")

            const factorInput = new TextInputBuilder()
                .setCustomId("factor-input")
                .setLabel("Amount:")
                .setStyle(TextInputStyle.Short)

            const actionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(factorInput)
            modal.addComponents(actionRow)
            await interaction.showModal(modal)
            const filter = (interaction: ModalSubmitInteraction) => interaction.customId === "lightness-modal"
            const modalSubmit = await interaction.awaitModalSubmit({filter, time: 600000})

            const factorField = modalSubmit.fields.getTextInputValue("factor-input").trim()
            value = factorField ? Number(factorField) : 0
            this.message = modalSubmit as any
        }
        if (!url) return this.reply(`Could not find an image ${discord.getEmoji("kannaCurious")}`)
        const arrayBuffer = await fetch(url).then((r) => r.arrayBuffer())
        const buffer = await sharp(arrayBuffer, {limitInputPixels: false})
        .modulate({lightness: value})
        .toBuffer()
        const attachment = new AttachmentBuilder(buffer)
        return this.reply(`Shifted the lightness by a factor of **${value}**!`, attachment)
    }
}
