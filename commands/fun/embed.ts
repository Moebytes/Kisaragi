import {Collection, Message, AttachmentBuilder, EmbedBuilder, 
MessageReaction, TextChannel, User, HexColorString} from "discord.js"
import {SlashCommandSubcommand} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Functions} from "./../../structures/Functions"
import {Embeds} from "./../../structures/Embeds"
import {Kisaragi} from "./../../structures/Kisaragi"

const procBlock = new Collection()

export default class Embed extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Creates a custom embed and sends it.",
            help:
            `
            \`embed\` - Open the embed creator
            `,
            examples:
            `
            \`=>embed\`
            `,
            aliases: ["embeds", "customembed", "richembed", "messageembed"],
            random: "none",
            cooldown: 3,
            subcommandEnabled: true
        })
        this.subcommand = new SlashCommandSubcommand()
        .setName(this.constructor.name.toLowerCase())
        .setDescription(this.options.description)
    }

    public getProcBlock = () => {
        let id = ""
        if (this.message.guild) {
            id = this.message.guild.id
        } else {
            id = this.message.author.id
        }
        if (procBlock.has(id)) {
            return true
        } else {
            return false
        }
    }

    public setProcBlock = (remove?: boolean) => {
        let id = ""
        if (this.message.guild) {
            id = this.message.guild.id
        } else {
            id = this.message.author.id
        }
        if (remove) {
            procBlock.delete(id)
        } else {
            procBlock.set(id, true)
        }
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        let attachments = [] as AttachmentBuilder[]
        if (message.guild && !(message.channel as TextChannel).permissionsFor(message.guild?.members.me!)?.has("ManageMessages")) {
            return this.reply(`The bot needs the permission **Manage Messages** in order to use this command. ${this.discord.getEmoji("kannaFacepalm")}`)
        }

        this.setProcBlock(true)
        const infoEmbed = embeds.createEmbed()
        let embed = new EmbedBuilder()
        embed.setColor(infoEmbed.data.color!)

        infoEmbed
        .setAuthor({name: "embed creator", iconURL: "https://kisaragi.moe/assets/embed/embed.png"})
        .setTitle(`**Custom Embed** ${discord.getEmoji("raphiSmile")}`)
        .setDescription(
            `_Edit this embed by clicking on the reactions._\n` +
            `${discord.getEmoji("info")} - Displays this menu\n` +
            `${discord.getEmoji("title")} - Sets the title of the embed\n` +
            `${discord.getEmoji("description")} - Sets the description (main text) of the embed\n` +
            `${discord.getEmoji("image")} - Set the image of the embed\n` +
            `${discord.getEmoji("thumbnail")} - Sets the thumbnail of the embed\n` +
            `${discord.getEmoji("author")} - Sets the author text\n` +
            `${discord.getEmoji("authorImage")} - Sets the author image\n` +
            `${discord.getEmoji("footer")} - Sets the footer text\n` +
            `${discord.getEmoji("footerImage")} - Sets the footer image\n` +
            `${discord.getEmoji("color")} - Sets the color of the embed\n` +
            `${discord.getEmoji("timestamp")} - Sets the timestamp\n` +
            `${discord.getEmoji("url")} - Sets the url of the embed\n` +
            `${discord.getEmoji("json")} - Creates an embed from JSON data\n` +
            `${discord.getEmoji("done")} - Sends the embed\n` +
            `${discord.getEmoji("xcancel")} - Quits the embed creator\n`
        )

        const reactions = ["info", "title", "description", "image", "thumbnail", "author", "authorImage", "footer", "footerImage", "color", "timestamp", "url", "json", "done", "xcancel"]

        const msg = await this.reply(infoEmbed)
        for (let i = 0; i < reactions.length; i++) await msg.react(discord.getEmoji(reactions[i]))

        const infoCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("info").id && user.bot === false
        const titleCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("title").id && user.bot === false
        const descriptionCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("description").id && user.bot === false
        const imageCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("image").id && user.bot === false
        const thumbnailCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("thumbnail").id && user.bot === false
        const authorCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("author").id && user.bot === false
        const authorImageCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("authorImage").id && user.bot === false
        const footerCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("footer").id && user.bot === false
        const footerImageCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("footerImage").id && user.bot === false
        const colorCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("color").id && user.bot === false
        const timestampCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("timestamp").id && user.bot === false
        const urlCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("url").id && user.bot === false
        const jsonCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("json").id && user.bot === false
        const doneCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("done").id && user.bot === false
        const cancelCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("xcancel").id && user.bot === false
        const info = msg.createReactionCollector({filter: infoCheck})
        const title = msg.createReactionCollector({filter: titleCheck})
        const description = msg.createReactionCollector({filter: descriptionCheck})
        const image = msg.createReactionCollector({filter: imageCheck})
        const thumbnail = msg.createReactionCollector({filter: thumbnailCheck})
        const author = msg.createReactionCollector({filter: authorCheck})
        const authorImage = msg.createReactionCollector({filter: authorImageCheck})
        const footer = msg.createReactionCollector({filter: footerCheck})
        const footerImage = msg.createReactionCollector({filter: footerImageCheck})
        const color = msg.createReactionCollector({filter: colorCheck})
        const timestamp = msg.createReactionCollector({filter: timestampCheck})
        const json = msg.createReactionCollector({filter: jsonCheck})
        const url = msg.createReactionCollector({filter: urlCheck})
        const done = msg.createReactionCollector({filter: doneCheck})
        const cancel = msg.createReactionCollector({filter: cancelCheck})
        let onInfo = true

        const updateAttachments = (attachment: AttachmentBuilder | null, type: string, remove?: boolean) => {
            const index = attachments.findIndex((i) => i.name === `${type}.png`)
            if (index !== -1) {
                if (remove) {
                    attachments[index] = null as unknown as AttachmentBuilder
                    attachments = attachments.filter(Boolean)
                } else {
                    if (attachment) attachments[index] = attachment
                }
            } else {
                if (!remove && attachment) attachments = [attachment]
            }
        }

        info.on("collect", async (reaction, user) => {
            await reaction.users.remove(user).catch(() => null)
            if (onInfo) {
                this.edit(msg, embed, attachments)
                onInfo = false
            } else {
                this.edit(msg, infoEmbed)
                onInfo = true
            }
        })

        let content = ""
        const getContent = async (response: Message) => {
            content = response.content
            if (response.attachments.size) content = response.attachments.first()!.url
            await Functions.deferDelete(response, 0)
        }

        title.on("collect", async (reaction, user) => {
            await reaction.users.remove(user).catch(() => null)
            if (this.getProcBlock()) {
                const proc = await this.send(`<@${user.id}>, Please finish editing the current field before editing another one.`)
                Functions.deferDelete(proc, 3000)
            }
            this.setProcBlock()
            const rep = await this.send(`<@${user.id}>, Enter the title of this embed or \`remove\` to remove it.`)
            await embeds.createPrompt(getContent, true)
            Functions.deferDelete(rep, 0)
            if (content.length > 256) {
                const rep2 = await this.send(`<@${user.id}>, The title cannot exceed 256 characters.`)
                Functions.deferDelete(rep2, 3000)
                this.setProcBlock(true)
                return
            }
            if (content?.trim() === "remove") {
                embed.setTitle(null)
            } else {
                embed.setTitle(content)
            }
            this.edit(msg, embed, attachments)
            onInfo = false
            this.setProcBlock(true)
        })

        description.on("collect", async (reaction, user) => {
            await reaction.users.remove(user).catch(() => null)
            if (this.getProcBlock()) {
                const proc = await this.send(`<@${user.id}>, Please finish editing the current field before editing another one.`)
                Functions.deferDelete(proc, 3000)
                return
            }
            this.setProcBlock()
            const rep = await this.send(`<@${user.id}>, Enter the description of this embed or \`remove\` to remove it.`)
            await embeds.createPrompt(getContent, true)
            Functions.deferDelete(rep, 0)
            if (content.length > 2048) {
                const rep2 = await this.send(`<@${user.id}>, The description cannot exceed 2048 characters.`)
                Functions.deferDelete(rep2, 3000)
                this.setProcBlock(true)
                return
            }
            if (content?.trim() === "remove") {
                embed.setDescription(null)
            } else {
                embed.setDescription(content)
            }
            this.edit(msg, embed, attachments)
            onInfo = false
            this.setProcBlock(true)
        })

        image.on("collect", async (reaction, user) => {
            await reaction.users.remove(user).catch(() => null)
            if (this.getProcBlock()) {
                const proc = await this.send(`<@${user.id}>, Please finish editing the current field before editing another one.`)
                Functions.deferDelete(proc, 3000)
                return
            }
            this.setProcBlock()
            const rep = await this.send(`<@${user.id}>, Post an image for this embed (png, jpg, gif). Type \`me\` for your profile pic, and \`guild\` for the guild icon, or \`remove\` to remove it.`)
            await embeds.createPrompt(getContent, true)
            Functions.deferDelete(rep, 0)
            if (content === "me") content = user.displayAvatarURL({extension: "png"})
            if (content === "guild") content = this.message.guild?.iconURL({extension: "png"}) ?? ""
            if (content?.trim() === "remove") {
                embed.setImage(null)
                updateAttachments(null, "image", true)
            } else {
                if (!/.(png|jpg|gif)/gi.test(content)) {
                    const rep2 = await this.send(`<@${user.id}>, This image is invalid.`)
                    Functions.deferDelete(rep2, 3000)
                    this.setProcBlock(true)
                    return
                }
                const buffer = await fetch(content).then((r) => r.arrayBuffer())
                const attachment = new AttachmentBuilder(Buffer.from(buffer), {name: "image.png"})
                updateAttachments(attachment, "image")
                embed.setImage(`attachment://image.png`)
            }
            this.edit(msg, embed, attachments)
            onInfo = false
            this.setProcBlock(true)
        })

        thumbnail.on("collect", async (reaction, user) => {
            await reaction.users.remove(user).catch(() => null)
            if (this.getProcBlock()) {
                const proc = await this.send(`<@${user.id}>, Please finish editing the current field before editing another one.`)
                Functions.deferDelete(proc, 3000)
                return
            }
            this.setProcBlock()
            const rep = await this.send(`<@${user.id}>, Post a thumbnail for this embed (png, jpg, gif). Type \`me\` for your profile pic, and \`guild\` for the guild icon, or \`remove\` to remove it.`)
            await embeds.createPrompt(getContent, true)
            Functions.deferDelete(rep, 0)
            if (content === "me") content = user.displayAvatarURL({extension: "png"})
            if (content === "guild") content = this.message.guild?.iconURL({extension: "png"}) ?? ""
            if (content?.trim() === "remove") {
                embed.setThumbnail(null)
                updateAttachments(null, "thumbnail", true)
            } else {
                if (!/.(png|jpg|gif)/gi.test(content)) {
                    const rep2 = await this.send(`<@${user.id}>, This thumbnail is invalid.`)
                    Functions.deferDelete(rep2, 3000)
                    this.setProcBlock(true)
                    return
                }
                const buffer = await fetch(content).then((r) => r.arrayBuffer())
                const attachment = new AttachmentBuilder(Buffer.from(buffer), {name: "thumbnail.png"})
                updateAttachments(attachment, "thumbnail")
                embed.setThumbnail(`attachment://thumbnail.png`)
            }
            this.edit(msg, embed, attachments)
            onInfo = false
            this.setProcBlock(true)
        })

        author.on("collect", async (reaction, user) => {
            await reaction.users.remove(user).catch(() => null)
            if (this.getProcBlock()) {
                const proc = await this.send(`<@${user.id}>, Please finish editing the current field before editing another one.`)
                Functions.deferDelete(proc, 3000)
                return
            }
            this.setProcBlock()
            const rep = await this.send(`<@${user.id}>, Enter the author of this embed or \`remove\` to remove it.`)
            await embeds.createPrompt(getContent, true)
            Functions.deferDelete(rep, 0)
            if (content.length > 256) {
                const rep2 = await this.send(`<@${user.id}>, The author text cannot exceed 256 characters.`)
                Functions.deferDelete(rep2, 3000)
                this.setProcBlock(true)
                return
            }
            if (content?.trim() === "remove") {
                embed.setAuthor(null)
            } else {
                embed.setAuthor({name: content})
            }
            this.edit(msg, embed, attachments)
            onInfo = false
            this.setProcBlock(true)
        })

        authorImage.on("collect", async (reaction, user) => {
            await reaction.users.remove(user).catch(() => null)
            if (this.getProcBlock()) {
                const proc = await this.send(`<@${user.id}>, Please finish editing the current field before editing another one.`)
                Functions.deferDelete(proc, 3000)
                return
            }
            this.setProcBlock()
            const rep = await this.send(`<@${user.id}>, Post an author image for this embed (png, jpg, gif). Type \`me\` for your profile pic, and \`guild\` for the guild icon, or \`remove\` to remove it.`)
            await embeds.createPrompt(getContent, true)
            Functions.deferDelete(rep, 0)
            if (content === "me") content = user.displayAvatarURL({extension: "png"})
            if (content === "guild") content = this.message.guild?.iconURL({extension: "png"}) ?? ""
            if (content?.trim() === "remove") {
                embed.setAuthor(null)
            } else {
                if (!/.(png|jpg|gif)/gi.test(content)) {
                    const rep2 = await this.send(`<@${user.id}>, This image is invalid.`)
                    Functions.deferDelete(rep2, 3000)
                    this.setProcBlock(true)
                    return
                }
                embed.setAuthor({name: embed.data.author?.name || null as any, iconURL: content})
            }
            this.edit(msg, embed, attachments)
            onInfo = false
            this.setProcBlock(true)
        })

        footer.on("collect", async (reaction, user) => {
            await reaction.users.remove(user).catch(() => null)
            if (this.getProcBlock()) {
                const proc = await this.send(`<@${user.id}>, Please finish editing the current field before editing another one.`)
                Functions.deferDelete(proc, 3000)
                return
            }
            this.setProcBlock()
            const rep = await this.send(`<@${user.id}>, Enter the footer of this embed or \`remove\` to remove it.`)
            await embeds.createPrompt(getContent, true)
            Functions.deferDelete(rep, 0)
            if (content.length > 2048) {
                const rep2 = await this.send(`<@${user.id}>, The footer cannot exceed 2048 characters.`)
                Functions.deferDelete(rep2, 3000)
                this.setProcBlock(true)
                return
            }
            if (content?.trim() === "remove") {
                embed.setFooter(null)
            } else {
                embed.setFooter({text: content})
            }
            this.edit(msg, embed, attachments)
            onInfo = false
            this.setProcBlock(true)
        })

        footerImage.on("collect", async (reaction, user) => {
            await reaction.users.remove(user).catch(() => null)
            if (this.getProcBlock()) {
                const proc = await this.send(`<@${user.id}>, Please finish editing the current field before editing another one.`)
                Functions.deferDelete(proc, 3000)
                return
            }
            this.setProcBlock()
            const rep = await this.send(`<@${user.id}>, Post a footer image for this embed (png, jpg, gif). Type \`me\` for your profile pic, and \`guild\` for the guild icon, or \`remove\` to remove it.`)
            await embeds.createPrompt(getContent, true)
            Functions.deferDelete(rep, 0)
            if (content === "me") content = user.displayAvatarURL({extension: "png"})
            if (content === "guild") content = this.message.guild?.iconURL({extension: "png"}) ?? ""
            if (content?.trim() === "remove") {
                embed.setFooter(null)
            } else {
                if (!/.(png|jpg|gif)/gi.test(content)) {
                    const rep2 = await this.send(`<@${user.id}>, This image is invalid.`)
                    Functions.deferDelete(rep2, 3000)
                    this.setProcBlock(true)
                    return
                }
                embed.setFooter({text: embed.data.footer!.text, iconURL: content})
            }
            this.edit(msg, embed, attachments)
            onInfo = false
            this.setProcBlock(true)
        })

        color.on("collect", async (reaction, user) => {
            await reaction.users.remove(user).catch(() => null)
            if (this.getProcBlock()) {
                const proc = await this.send(`<@${user.id}>, Please finish editing the current field before editing another one.`)
                Functions.deferDelete(proc, 3000)
                return
            }
            this.setProcBlock()
            const rep = await this.send(`<@${user.id}>, Set the color of this embed (hex color) or \`remove\` to remove it.`)
            await embeds.createPrompt(getContent, true)
            Functions.deferDelete(rep, 0)
            if (content?.trim() === "remove") {
                embed.setColor(null)
            } else {
                try {
                    embed.setColor(content as HexColorString)
                } catch {}
            }
            this.edit(msg, embed, attachments)
            onInfo = false
            this.setProcBlock(true)
        })

        timestamp.on("collect", async (reaction, user) => {
            await reaction.users.remove(user).catch(() => null)
            if (this.getProcBlock()) {
                const proc = await this.send(`<@${user.id}>, Please finish editing the current field before editing another one.`)
                Functions.deferDelete(proc, 3000)
                return
            }
            this.setProcBlock()
            const rep = await this.send(`<@${user.id}>, Set the timestamp of this embed (type \`now\` for the time now) or \`remove\` to remove it.`)
            await embeds.createPrompt(getContent, true)
            Functions.deferDelete(rep, 0)
            const date = content === "now" ? Date.now() : new Date(content)
            if (content?.trim() === "remove") {
                embed.setTimestamp(null)
            } else {
                embed.setTimestamp(date)
            }
            this.edit(msg, embed, attachments)
            onInfo = false
            this.setProcBlock(true)
        })

        url.on("collect", async (reaction, user) => {
            await reaction.users.remove(user).catch(() => null)
            if (this.getProcBlock()) {
                const proc = await this.send(`<@${user.id}>, Please finish editing the current field before editing another one.`)
                Functions.deferDelete(proc, 3000)
                return
            }
            this.setProcBlock()
            const rep = await this.send(`<@${user.id}>, Enter the url of this embed or \`remove\` to remove it.`)
            await embeds.createPrompt(getContent, true)
            Functions.deferDelete(rep, 0)
            if (content?.trim() === "remove") {
                embed.setURL(null)
            } else {
                if (!/http/gi.test(content)) {
                    const rep2 = await this.send(`<@${user.id}>, This is not a valid url.`)
                    Functions.deferDelete(rep2, 3000)
                    this.setProcBlock(true)
                    return
                }
                embed.setURL(content)
            }
            this.edit(msg, embed, attachments)
            onInfo = false
            this.setProcBlock(true)
        })

        json.on("collect", async (reaction, user) => {
            await reaction.users.remove(user).catch(() => null)
            if (this.getProcBlock()) {
                const proc = await this.send(`<@${user.id}>, Please finish editing the current field before editing another one.`)
                Functions.deferDelete(proc, 3000)
                return
            }
            this.setProcBlock()
            const rep = await this.send(`<@${user.id}>, Enter the json data for this embed or \`cancel\` to cancel. The current embed will be replaced.`)
            await embeds.createPrompt(getContent, true)
            if (content?.trim() === "cancel") {
                // ignore
            } else {
                try {
                    embed = new EmbedBuilder(JSON.parse(content))
                } catch {
                    const rep2 = await this.send(`<@${user.id}>, This json data is invalid.`)
                    Functions.deferDelete(rep2, 3000)
                    this.setProcBlock(true)
                    return
                }
            }
            Functions.deferDelete(rep, 0)
            this.edit(msg, embed, attachments)
            onInfo = false
            this.setProcBlock(true)
        })

        done.on("collect", async (reaction, user) => {
            await reaction.users.remove(user).catch(() => null)
            await Functions.deferDelete(msg, 0)
            await this.send(embed, attachments)
        })

        cancel.on("collect", async (reaction, user) => {
            await reaction.users.remove(user).catch(() => null)
            await Functions.deferDelete(msg, 0)
            await this.send(`<@${user.id}>, Quit the embed creator! ${discord.getEmoji("aquaCry")}`)
        })
    }
}
