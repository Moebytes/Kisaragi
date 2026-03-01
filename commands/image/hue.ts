/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message, AttachmentBuilder, MessageContextMenuCommandInteraction, ModalBuilder,
TextInputBuilder, TextInputStyle, ActionRowBuilder, ModalActionRowComponentBuilder,
ModalSubmitInteraction} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption, ContextMenuCommand} from "../../structures/SlashCommandOption"
import sharp from "sharp"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class Hue extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
          description: "Shifts the hue of an image.",
          help:
          `
          _Note: Hue is in degrees._
          \`hue shift\` - Shifts the hue of the last posted image
          \`hue shift url\` - Shifts the hue of the linked image
          `,
          examples:
          `
          \`=>hue 180\`
          `,
          aliases: ["spin"],
          cooldown: 10,
          defer: true,
          subcommandEnabled: true,
          contextEnabled: false
        })
        const urlOption = new SlashCommandOption()
            .setType("string")
            .setName("url")
            .setDescription("Url, or use the last posted image.")

        const shiftOption = new SlashCommandOption()
            .setType("integer")
            .setName("shift")
            .setDescription("Amount of hue shift.")
            .setRequired(true)

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(shiftOption)
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
        let shift = Number(args[1]) ? Number(args[1]) : 0
        if (args[2]) {
            url = args[2]
        } else {
            let messageID = args[1].match(/\d{10,}/)?.[0] || ""
            if (messageID) {
                const msg = message.channel?.messages.cache.get(messageID)
                if (msg) url = msg.attachments.first()?.url || msg.embeds[0]?.image?.url
            } else {
                url = await discord.fetchLastAttachment(message)
            }
        }
        if (message instanceof MessageContextMenuCommandInteraction) {
            const interaction = message as MessageContextMenuCommandInteraction
            url = interaction.targetMessage.attachments.first()?.url || interaction.targetMessage.embeds[0]?.image?.url
            const modal = new ModalBuilder()
                .setCustomId("hue-modal")
                .setTitle("Hue")

            const shiftInput = new TextInputBuilder()
                .setCustomId("shift-input")
                .setLabel("Shift:")
                .setStyle(TextInputStyle.Short)

            const actionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(shiftInput)
            modal.addComponents(actionRow)
            await interaction.showModal(modal)
            const filter = (interaction: ModalSubmitInteraction) => interaction.customId === "hue-modal"
            const modalSubmit = await interaction.awaitModalSubmit({filter, time: 600000})

            const shiftField = modalSubmit.fields.getTextInputValue("shift-input").trim()
            shift = shiftField ? Number(shiftField) : 0
            this.message = modalSubmit as any
        }
        if (!url) return this.reply(`Could not find an image ${discord.getEmoji("kannaCurious")}`)
        const arrayBuffer = await fetch(url).then((r) => r.arrayBuffer())
        let buffer = await sharp(arrayBuffer, {limitInputPixels: false})
        .modulate({hue: shift}).toBuffer()
        const attachment = new AttachmentBuilder(buffer)
        return this.reply(`Shifted the hue **${shift}** degrees!`, attachment)
    }
}
