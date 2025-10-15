import {Message, EmbedBuilder, Role, AttachmentBuilder} from "discord.js"
import {SlashCommand} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Captcha} from "./../../structures/Captcha"
import {Embeds} from "./../../structures/Embeds"
import {Kisaragi} from "./../../structures/Kisaragi"
import {SQLQuery} from "./../../structures/SQLQuery"

export default class Verify extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Posts a captcha that must be solved to be verified.",
            help:
            `
            _Note:_ Edit captcha and verify role settings using the **captcha** command.
            \`verify\` - Posts a captcha that must be solved.
            `,
            examples:
            `
            \`=>verify\`
            `,
            guildOnly: true,
            cachedGuildOnly: true,
            botPermission: "ManageRoles",
            aliases: [],
            cooldown: 10,
            slashEnabled: true
        })
        this.slash = new SlashCommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .toJSON()
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const captchaClass = new Captcha(discord, message)
        const sql = new SQLQuery(message)
        const vToggle = await sql.fetchColumn("guilds", "verify toggle")
        if (vToggle === "off") return this.reply(`Looks like verification is disabled. Enable it in the **captcha** command.`)
        const vRole = await sql.fetchColumn("guilds", "verify role")
        const cType = await sql.fetchColumn("guilds", "captcha type")
        const color = await sql.fetchColumn("guilds", "captcha color")
        const difficulty = await sql.fetchColumn("guilds", "difficulty")

        const role = message.guild!.roles.cache.find((r: Role) => r.id === vRole)
        if (!role) {
            const vErrorEmbed = embeds.createEmbed()
            vErrorEmbed.setDescription("Could not find the verify role!")
            return this.reply(vErrorEmbed)
        }
        const type = cType

        const {captcha, text, files} = await captchaClass.createCaptcha(String(type), String(color), String(difficulty))

        const filter = (response: Message) => {
            return (response.author.id === message.author.id)
        }

        let fail = false

        const sendCaptcha = async (cap: EmbedBuilder, txt: string, files: AttachmentBuilder[]) => {
            await this.reply(cap, files)
            if (!message.channel.isSendable()) return
            message.channel.awaitMessages({filter, max: 1, time: 30000, errors: ["time"]})
                .then(async (collected) => {
                    const msg = collected.first() as Message
                    const responseEmbed = embeds.createEmbed()
                    responseEmbed
                    .setTitle(`Captcha ${discord.getEmoji("kannaAngry")}`)
                    if (msg.content.trim() === "cancel") {
                        responseEmbed
                        .setDescription("Quit the captcha.")
                        return discord.send(msg, responseEmbed)
                    } else if (msg.content.trim() === "skip") {
                        this.reply("Skipped this captcha!")
                        const result = await captchaClass.createCaptcha(String(type), String(color), String(difficulty))
                        return sendCaptcha(result.captcha, result.text, result.files)
                    } else if (msg.content.trim() === txt) {
                        responseEmbed
                        .setDescription(`${discord.getEmoji("pinkCheck")} **${msg.member!.displayName}** was verified!`)
                        await discord.send(msg, responseEmbed)
                        try {
                            if (msg.member!.roles.cache.has(role!.id)) await msg.member!.roles.remove(role!)
                            await msg.member!.roles.add!(role!, "Successfully solved the captcha")
                        } catch {
                            fail = true
                            return this.send("Verification failed. Either I don't have the **Manage Roles** permission, or the verify role is above my highest role in the role hierarchy.")
                        }
                    } else {
                        msg.reply("Wrong answer! Please try again.")
                        const result = await captchaClass.createCaptcha(String(type), String(color), String(difficulty))
                        return sendCaptcha(result.captcha, result.text, result.files)
                    }
                })
                .catch((e) => {
                    console.log(e)
                    if (fail) return
                    this.send("Quit the captcha because the time has run out.")
                })

        }
        sendCaptcha(captcha, text, files)
    }
}