import axios from "axios"
import {Message, AttachmentBuilder, ContextMenuCommandInteraction, ModalBuilder,
TextInputBuilder, TextInputStyle, ActionRowBuilder, ModalActionRowComponentBuilder,
ModalSubmitInteraction} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption, ContextMenuCommand} from "../../structures/SlashCommandOption"
import * as fs from "fs"
import * as path from "path"
import waifu2x from "waifu2x"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Kisaragi} from "../../structures/Kisaragi"

export default class Waifu2x extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Upscales an image with waifu2x.",
            help:
            `
            \`waifu2x\` - Upscales the first image found above
            \`waifu2x url\` - Upscales the image from the url
            \`waifu2x cugan url?\` - Changes the upscaler to real-cugan
            \`waifu2x esrgan url?\` - Changes the upscaler to real-esrgan
            \`waifu2x anime4k url?\` - Changes the upscaler to anime4k
            `,
            examples:
            `
            \`=>waifu2x\`
            `,
            aliases: ["2x"],
            cooldown: 60,
            premium: true,
            voteLocked: true,
            defer: true,
            subcommandEnabled: true,
            contextEnabled: false
        })
        const urlOption = new SlashCommandOption()
            .setType("string")
            .setName("url")
            .setDescription("Url, or use the last posted image.")
            
        const upscalerOption = new SlashCommandOption()
            .setType("string")
            .setName("upscaler")
            .setDescription("Can be waifu2x/cugan/esrgan/anime4k or a url.")

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(upscalerOption)
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

        let upscaler = "waifu2x"
        let scale = 2
        let lastAttachment = ""
        let input = args[1]
        if (message instanceof ContextMenuCommandInteraction) {
            const interaction = message as ContextMenuCommandInteraction
            const modal = new ModalBuilder()
                .setCustomId("waifu2x-modal")
                .setTitle("Waifu2x")

            const upscalerInput = new TextInputBuilder()
                .setCustomId("upscaler-input")
                .setLabel("Upscaler:")
                .setStyle(TextInputStyle.Short)

            const actionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(upscalerInput)
            modal.addComponents(actionRow)
            await interaction.showModal(modal)
            const filter = (interaction: ModalSubmitInteraction) => interaction.customId === "waifu2x-modal"
            const modalSubmit = await interaction.awaitModalSubmit({filter, time: 600000})

            input = modalSubmit.fields.getTextInputValue("upscaler-input").trim()
            this.message = modalSubmit as any
        }
        if (input) {
            switch (input) {
                case "waifu2x":
                    break
                case "cugan":
                    upscaler = "real-cugan"
                    scale = 4
                    lastAttachment = args[2] ? args[2] : ""
                    break
                case "esrgan":
                    upscaler = "real-esrgan"
                    scale = 4
                    lastAttachment = args[2] ? args[2] : ""
                    break
                case "anime4k":
                    upscaler = "anime4k"
                    scale = 4
                    lastAttachment = args[2] ? args[2] : ""
                    break
                default:
                    lastAttachment = ""
            }
        }

        if (!lastAttachment) {
            let messageID = args[1].match(/\d{10,}/)?.[0] || ""
            if (messageID) {
                const msg = await message.channel.messages.fetch(messageID)
                lastAttachment = msg.attachments.first()?.url as string
            } else {
                lastAttachment = await discord.fetchLastAttachment(message) as string
            }
            if (!lastAttachment) return this.reply("You must post an image first!")
        }

        const folder =  path.join(__dirname, `../../assets/misc/images/waifu2x`)
        if (!fs.existsSync(folder)) fs.mkdirSync(folder, {recursive: true})
        const response = await axios.get(lastAttachment, {responseType: "arraybuffer"}).then((r) => r.data)
        
        let sourceID = `image`
        let i = 0
        while (fs.existsSync(path.join(folder, `${sourceID}.jpg`))) {
            sourceID = `image${i}`
            i++
        }
        const sourcePath = path.join(folder, sourceID)
        fs.writeFileSync(sourcePath, Buffer.from(response, "binary"))

        let destPath = path.join(folder, `${sourceID}2x.jpg`)
        try {
            await waifu2x.upscaleImage(sourcePath, destPath, {upscaler, scale})
        } catch (err) {
            console.log(err)
        }
        const attachment = new AttachmentBuilder(fs.readFileSync(destPath), {name: "upscaled.png"})
        try {
            fs.unlinkSync(sourcePath)
            fs.unlinkSync(destPath)
        } catch {
            // ignore
        }
        const waifuEmbed = embeds.createEmbed()
        waifuEmbed
        .setAuthor({name: "waifu2x", iconURL: "https://kisaragi.moe/assets/embed/waifu2x.png"})
        .setTitle(`**Waifu 2x Upscaling** ${discord.getEmoji("gabYes")}`)
        .setImage("attachment://upscaled.png")
        return this.reply(waifuEmbed, attachment)
    }
}
