import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import nodemailer from "nodemailer"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {SQLQuery} from "./../../structures/SQLQuery"

export default class Email extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Sends you an email with text content/attachment. **Requires oauth2**",
            help:
            `
            _Note: If no link is provided, the attachment on the last message is sent (if any)._
            \`email content? link?\` - Sends you an email with the content and link
            `,
            examples:
            `
            \`=>email (pic of cute anime girl)\`
            `,
            aliases: ["gmail", "mail"],
            cooldown: 3,
            unlist: true,
            subcommandEnabled: true
        })
        const linkOption = new SlashCommandOption()
            .setType("string")
            .setName("link")
            .setDescription("The link of the email attachment.")

        const contentOption = new SlashCommandOption()
            .setType("string")
            .setName("content")
            .setDescription("The content of the email.")
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(contentOption)
            .addOption(linkOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const sql = new SQLQuery(message)
        let id = message.author.id
        const email = await sql.fetchColumn("oauth2", "email", "user id", id)
        if (!email) return this.reply(`You need to give me additional oauth2 permissions. See the **oauth2** command.`)

        const content = Functions.combineArgs(args, 1).trim().replace(/(<@)(.*?)(>)/g, "").replace(/(http)(.*?)(?= |$)/g, "")
        let links = Functions.combineArgs(args, 1).trim().match(/(http)(.*?)(?= |$)/)
        if (!links) links = await discord.fetchLastAttachment(message, false, /./, 5, true) as any
        let attach = undefined as any
        if (links) {
            attach = []
            for (let i = 0; i < links.length; i++) {
                attach.push({path: links[i]})
            }
        }
        if (!content && !attach) return this.reply(`Do you want to send an empty email ${discord.getEmoji("kannaFacepalm")}`)

        const transport = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.GOOGLE_EMAIL,
                pass: process.env.GOOGLE_PASSWORD
            }
        })

        await transport.sendMail({
            from: {name: "Kisaragi", address: process.env.GOOGLE_EMAIL!},
            to: email,
            subject: `Email from ${message.author.tag}`,
            text: content,
            attachments: attach
        })

        const emailEmbed = embeds.createEmbed()
        emailEmbed
        .setAuthor({name: "gmail", iconURL: "https://kisaragi.moe/assets/embed/email.png"})
        .setTitle(`**Email Delivery** ${discord.getEmoji("smugFace")}`)
        .setDescription(
            `${discord.getEmoji("star")}The email was delivered! Check your inbox and spam folder.`
        )
        return this.reply(emailEmbed)
    }
}
