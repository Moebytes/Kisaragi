import {Message, AttachmentBuilder, EmbedBuilder} from "discord.js"
import Pixiv, {PixivFolderMap, PixivIllust} from "pixiv.ts"
import {CommandFunctions} from "./CommandFunctions"
import {Embeds} from "./Embeds"
import {Functions} from "./Functions"
import {Images} from "./Images"
import {Kisaragi} from "./Kisaragi"
import {Permission} from "./Permission"
import {SQLQuery} from "./SQLQuery"
import path from "path"
import fs from "fs"

export class PixivApi {
    private readonly images: Images
    private readonly embeds: Embeds
    private readonly cmd: CommandFunctions
    private readonly perms: Permission
    private pixiv: Pixiv | null = null
    constructor(private readonly discord: Kisaragi, private readonly message: Message) {
        this.images = new Images(this.discord, this.message)
        this.embeds = new Embeds(this.discord, this.message)
        this.cmd = new CommandFunctions(this.discord, this.message)
        this.perms = new Permission(this.discord, this.message)
    }

    // Create Pixiv Embed
    public createPixivEmbed = async (image: PixivIllust, noUpload?: boolean) => {
        const discord = this.discord
        if (!this.pixiv) this.pixiv = await Pixiv.refreshLogin(process.env.PIXIV_REFRESH_TOKEN!)
        if (image.x_restrict !== 0) {
            if (!this.perms.checkNSFW(true)) return
            if (discord.checkMuted(this.message)) return
        }
        const pixivEmbed = this.embeds.createEmbed()
        if (!image?.id) return
        const comments = await this.pixiv.illust.comments({illust_id: image.id})
        const commentArray: string[] = []
        for (let i = 0; i <= 5; i++) {
                if (!comments.comments[i]) break
                commentArray.push(comments.comments[i].comment)
        }
        // const viewLink = await this.pixiv.util.viewLink(String(image.id))
        const url = await this.pixiv.util.downloadIllust(image, path.join(__dirname, `../assets/misc/images/pixiv/illusts`))
        if (!url) return
        const authorUrl = await this.pixiv.util.downloadProfilePicture(image, path.join(__dirname, `../assets/misc/images/pixiv/profiles`))
        // const viewLinkAppend = viewLink ? `_Image not showing? Click_ [**here**](${viewLink}).` : ""
        let files = [] as AttachmentBuilder[]
        if (noUpload) {
            pixivEmbed
            const imageAttachment = new AttachmentBuilder(url, {name: "image.png"})
            const authorAttachment = new AttachmentBuilder(authorUrl, {name: "author.png"})
            files = [authorAttachment, imageAttachment]
            pixivEmbed
            .setThumbnail(`attachment://author.png`)
            .setImage(`attachment://image.png`)
        } else {
            const illustImage = await this.images.upload(url, true) as string
            const authorImage = await this.images.upload(authorUrl, true)
            pixivEmbed
            .setImage(encodeURI(illustImage))
            .setThumbnail(encodeURI(authorImage))
        }
        const cleanText = image.caption.replace(/<\/?[^>]+(>|$)/g, "")
        pixivEmbed
        .setAuthor({name: "pixiv", iconURL: "https://kisaragi.moe/assets/embed/pixiv.png", url: "https://www.pixiv.net/en/"})
        .setTitle(`**Pixiv Image** ${this.discord.getEmoji("chinoSmug")}`)
        .setURL(`https://www.pixiv.net/member_illust.php?mode=medium&illust_id=${image?.id}`)
        .setDescription(
        `${discord.getEmoji("star")}_Title:_ **${image.title}**\n` +
        `${discord.getEmoji("star")}_Artist:_ **${image.user.name}**\n` +
        `${discord.getEmoji("star")}_Creation Date:_ **${Functions.formatDate(new Date(image.create_date))}**\n` +
        `${discord.getEmoji("star")}_Views:_ **${image.total_view}**\n` +
        `${discord.getEmoji("star")}_Bookmarks:_ **${image.total_bookmarks}**\n` +
        `${discord.getEmoji("star")}_Description:_ ${cleanText ? cleanText : "None"}\n` +
        `${discord.getEmoji("star")}_Comments:_ ${commentArray.join() ? commentArray.join() : "None"}\n`
        )
        return {embed: pixivEmbed, files}
    }

    // Pixiv Error Embed
    public pixivErrorEmbed = () => {
        const pixivEmbed = this.embeds.createEmbed()
        pixivEmbed
        .setAuthor({name: "pixiv", iconURL: "https://kisaragi.moe/assets/embed/pixiv.png", url: "https://www.pixiv.net/en/"})
        .setTitle(`**Pixiv Image** ${this.discord.getEmoji("chinoSmug")}`)
        .setDescription("No results were found. You can turn off the bookmark filter by adding **all**. Also, try searching for the japanese tag on the " +
        "[**Pixiv Website**](https://www.pixiv.net/), as some tags can't be translated to english.")
        return this.discord.reply(this.message, pixivEmbed)
    }

    // Pixiv Image
    public getPixivImage = async <T extends boolean = false>(tag?: string, r18?: boolean, en?: boolean, ugoira?: boolean, noEmbed?: T) => {
        const msg1 = await this.discord.send(this.message, `**Searching Pixiv...** ${this.discord.getEmoji("kisaragiCircle")}`)
        if (!this.pixiv) this.pixiv = await Pixiv.refreshLogin(process.env.PIXIV_REFRESH_TOKEN!)
        let setFast = false
        if (tag && /fast/.test(tag)) {
            tag = tag.replace("fast", "").trim()
            setFast = true
        }
        let json: PixivIllust[]
        if (!r18 || this.discord.checkMuted(this.message)) r18 = false
        if (r18) {
            if (ugoira) {
                if (en) {
                    json = await this.pixiv.search.illusts({word: `うごイラ ${tag}`, en: true, r18, type: "ugoira"})
                } else {
                    json = await this.pixiv.search.illusts({word: `うごイラ ${tag}`, r18, type: "ugoira"})
                }
            } else {
                if (en) {
                    json = await this.pixiv.search.illusts({word: tag, en: true, r18})
                } else {
                    json = await this.pixiv.search.illusts({word: tag, r18})
                }
            }
        } else {
            if (ugoira) {
                if (en) {
                    json = await this.pixiv.search.illusts({word: `うごイラ ${tag}`, en: true, r18: false, type: "ugoira"})
                } else {
                    json = await this.pixiv.search.illusts({word: `うごイラ ${tag}`, r18: false, type: "ugoira"})
                }
            } else {
                if (en) {
                    json = await this.pixiv.search.illusts({word: tag, en: true, r18: false})
                } else {
                    json = await this.pixiv.search.illusts({word: tag, r18: false})
                }
            }
        }
        if (msg1) Functions.deferDelete(msg1, 0)
        const illusts = Functions.shuffleArray(json).filter((i) => i.illust_ai_type !== 2)
        if (!illusts[0]) return this.pixivErrorEmbed() as Promise<T extends true ? PixivIllust : Message>
        if (noEmbed) {
            const index = Math.floor(Math.random() * (illusts.length - illusts.length/2) + illusts.length/2)
            const image = illusts[index]
            if (!image) return this.pixivErrorEmbed() as Promise<T extends true ? PixivIllust : Message>
            return image as unknown as Promise<T extends true ? PixivIllust : Message>
        }
        const msg2 = await this.discord.send(this.message, `**Uploading pictures...** ${this.discord.getEmoji("kisaragiCircle")}`)
        const pixivArray: EmbedBuilder[] = []
        const attachments: AttachmentBuilder[] = []
        const max = illusts.length > 5 ? 5 : illusts.length
        for (let i = 0; i < max; i++) {
            let pixivEmbed: {embed: EmbedBuilder, files: AttachmentBuilder[]} | undefined
            if (setFast) {
                pixivEmbed = await this.createPixivEmbed(illusts[i], true)
                if (!pixivEmbed) break
                pixivArray.push(pixivEmbed.embed)
                if (pixivEmbed.files.length > 0) attachments.push(...pixivEmbed.files)
                break
            }
            if (msg2) msg2.edit(`**Uploading pictures... (${i+1})** ${this.discord.getEmoji("kisaragiCircle")}\n_Want a faster command? Add the tag_ \`fast\` _somewhere._`)
            try {
                pixivEmbed = await this.createPixivEmbed(illusts[i])
                if (!pixivEmbed) continue
                pixivArray.push(pixivEmbed.embed)
                if (pixivEmbed.files.length > 0) attachments.push(...pixivEmbed.files)
            } catch {
                pixivEmbed = await this.createPixivEmbed(illusts[i], true)
                if (!pixivEmbed) break
                pixivArray.push(pixivEmbed.embed)
                if (pixivEmbed.files.length > 0) attachments.push(...pixivEmbed.files)
                break
            }
        }

        Functions.deferDelete(msg2, 0)
        if (!pixivArray[0]) return this.pixivErrorEmbed() as Promise<T extends true ? PixivIllust : Message>
        if (pixivArray.length === 1) {
            return this.discord.reply(this.message, pixivArray[0]) as Promise<T extends true ? PixivIllust : Message>
        } else {
            return this.embeds.createReactionEmbed(pixivArray, true, true) as Promise<T extends true ? PixivIllust : Message>
        }
    }

    // Pixiv Image ID
    public getPixivImageID = async (tags: string) => {
        if (!this.pixiv) this.pixiv = await Pixiv.refreshLogin(process.env.PIXIV_REFRESH_TOKEN!)
        let image: PixivIllust
        try {
            image = await this.pixiv.illust.get(tags)
        } catch {
            return this.pixivErrorEmbed()
        }
        if (image.type === "ugoira") {
            await this.cmd.runCommand(this.message, ["ugoira", tags])
            return
        }
        const pixivEmbed = await this.createPixivEmbed(image)
        if (!pixivEmbed) return this.pixivErrorEmbed()
        return this.discord.send(this.message, pixivEmbed.embed)
    }

    // Pixiv Popular Image
    public getPopularPixivImage = async () => {
        const msg1 = await this.discord.send(this.message, `**Searching Pixiv...** ${this.discord.getEmoji("kisaragiCircle")}`)
        const mode = "day_male"
        if (!this.pixiv) this.pixiv = await Pixiv.refreshLogin(process.env.PIXIV_REFRESH_TOKEN!)
        const json = await this.pixiv.illust.ranking({mode})
        const illusts = this.pixiv.util.sort(json)
        if (msg1) Functions.deferDelete(msg1, 0)
        if (!illusts[0]) return this.pixivErrorEmbed()
        const msg2 = await this.discord.send(this.message, `**Uploading pictures...** ${this.discord.getEmoji("kisaragiCircle")}`)
        const pixivArray: EmbedBuilder[] = []
        let attachments: AttachmentBuilder[] = []
        const max = illusts.length > 5 ? 5 : illusts.length
        for (let i = 0; i < max; i++) {
            if (msg2) msg2.edit(`**Uploading pictures... (${i+1})** ${this.discord.getEmoji("kisaragiCircle")}\n_Want a faster command? Add the tag_ \`fast\` _somewhere._`)
            let pixivEmbed: {embed: EmbedBuilder, files: AttachmentBuilder[]} | undefined
            try {
                pixivEmbed = await this.createPixivEmbed(illusts[i])
                if (!pixivEmbed) continue
                pixivArray.push(pixivEmbed.embed)
                if (pixivEmbed.files.length > 0) attachments.push(...pixivEmbed.files)
            } catch {
                pixivEmbed = await this.createPixivEmbed(illusts[i], true)
                if (!pixivEmbed) break
                pixivArray.push(pixivEmbed.embed)
                if (pixivEmbed.files.length > 0) attachments.push(...pixivEmbed.files)
                break
            }
        }
        if (msg2) Functions.deferDelete(msg2, 0)
        if (!pixivArray[0]) return this.pixivErrorEmbed()
        if (pixivArray.length === 1) {
            this.discord.send(this.message, pixivArray[0])
        } else {
            this.embeds.createReactionEmbed(pixivArray, true, true)
        }
        return
    }

    // Pixiv Popular R18 Image
    public getPopularPixivR18Image = async () => {
        const msg1 = await this.discord.send(this.message, `**Searching Pixiv...** ${this.discord.getEmoji("kisaragiCircle")}`)
        const mode = "day_male_r18"
        if (!this.pixiv) this.pixiv = await Pixiv.refreshLogin(process.env.PIXIV_REFRESH_TOKEN!)
        const json = await this.pixiv.illust.ranking({mode})
        const illusts = this.pixiv.util.sort(json)
        if (msg1) Functions.deferDelete(msg1, 0)
        if (!illusts[0]) return this.pixivErrorEmbed()
        const msg2 = await this.discord.send(this.message, `**Uploading pictures...** ${this.discord.getEmoji("kisaragiCircle")}`)
        const pixivArray: EmbedBuilder[] = []
        let attachments: AttachmentBuilder[] = []
        const max = illusts.length > 5 ? 5 : illusts.length
        for (let i = 0; i < max; i++) {
            if (msg2) msg2.edit(`**Uploading pictures... (${i+1})** ${this.discord.getEmoji("kisaragiCircle")}\n_Want a faster command? Add the tag_ \`fast\` _somewhere._`)
            let pixivEmbed: {embed: EmbedBuilder, files: AttachmentBuilder[]} | undefined
            try {
                pixivEmbed = await this.createPixivEmbed(illusts[i])
                if (!pixivEmbed) continue
                pixivArray.push(pixivEmbed.embed)
                if (pixivEmbed.files.length > 0) attachments.push(...pixivEmbed.files)
            } catch {
                pixivEmbed = await this.createPixivEmbed(illusts[i], true)
                if (!pixivEmbed) break
                pixivArray.push(pixivEmbed.embed)
                if (pixivEmbed.files.length > 0) attachments.push(...pixivEmbed.files)
                break
            }
        }
        if (msg2) Functions.deferDelete(msg2, 0)
        if (!pixivArray[0]) return this.pixivErrorEmbed()
        if (pixivArray.length === 1) {
            this.discord.send(this.message, pixivArray[0])
        } else {
            this.embeds.createReactionEmbed(pixivArray, true, true)
        }
        return
    }

    // Download pixiv images
    public downloadPixivImages = async (tag: string, r18?: boolean, folderMap?: PixivFolderMap[]) => {
        const embeds = new Embeds(this.discord, this.message)
        if (!this.pixiv) this.pixiv = await Pixiv.refreshLogin(process.env.PIXIV_REFRESH_TOKEN!)
        const msg1 = await this.discord.send(this.message, `**Downloading the pictures, please wait...** ${this.discord.getEmoji("kisaragiCircle")}`)
        tag = tag.trim()
        const rand = Math.floor(Math.random()*10000)
        const src = path.join(__dirname, `../assets/misc/images/pixiv/zip/${rand}/`)
        if (this.discord.checkMuted(this.message)) r18 = false
        let files: string[] = []
        try {
            files = await this.pixiv.util.downloadIllusts(tag, src, undefined, folderMap, r18) as any
        } catch {
            return this.pixivErrorEmbed()
        }
        if (msg1) Functions.deferDelete(msg1, 0)
        if (!files?.[0]) return this.pixivErrorEmbed()
        const msg2 = await this.discord.send(this.message, `**Creating a zip file...** ${this.discord.getEmoji("kisaragiCircle")}`)
        const name = tag.trim() ? tag.replace(/ +/g, "-") : "pixiv_dl_default"
        const dir = path.join(__dirname, `../assets/misc/images/pixiv/zip/${rand}/`)
        const dest = path.join(__dirname, `../assets/misc/images/pixiv/zip/${name}.zip`)
        await Functions.zipDir(dir, dest)
        const attachment = new AttachmentBuilder(dest, {name: `${name}.zip`})
        const imgBuffer = fs.readFileSync(files[0])
        const imgAttachment = new AttachmentBuilder(imgBuffer, {name: `${name}.png`})
        const downloadEmbed = embeds.createEmbed()
        .setImage(`attachment://${name}.png`)
        .setAuthor({name: "pixiv", iconURL: "https://kisaragi.moe/assets/embed/pixiv.png", url: "https://www.pixiv.net/en/"})
        .setTitle(`**Pixiv Download** ${this.discord.getEmoji("chinoSmug")}`)
        .setDescription(`${this.discord.getEmoji("star")}Downloaded **${files.length}** images for the tag **${tag ? tag : "default"}**!`)
        if (msg2) Functions.deferDelete(msg2, 0)
        await this.discord.send(this.message, downloadEmbed, [attachment, imgAttachment])
        Functions.removeDirectory(src)
    }

    public animeEndpoint = async (endpoint: string, limit?: number, update?: boolean) => {
        let emoji = ""
        switch (endpoint) {
            case "aqua":
                emoji = "aquaUp"
                break
            case "kanna":
                emoji = "kannaFreeze"
                break
            case "raphi":
                emoji = "raphi"
                break
            case "gabriel":
                emoji = "gabStare"
                break
            case "kisaragi":
                emoji = "kisaragiBawls"
                break
            case "tohru":
                emoji = "tohruThink"
                break
            case "stockings":
                emoji = "gabrielLick"
                break
            default:
                emoji = "chinoSmug"
        }
        const discord = this.discord
        const sql = new SQLQuery(this.message)
        const func = new Functions(this.message)
        const pictures = await this.images.fetch(endpoint, limit)
        const pixivArray: EmbedBuilder[] = []
        for (let i = 0; i < pictures.length; i++) {
            const id = decodeURI(path.basename(pictures[i])).split("_")[0].replace(/.(jpg|png)/gi, "")
            const exists = await sql.fetchColumn("pixiv", "id", "id", id)
            if (exists && !update) {
                const embed = await sql.fetchColumn("pixiv", "embed", "id", id)
                const pixivEmbed = new EmbedBuilder(JSON.parse(embed))
                pixivEmbed
                .setTitle(`**${Functions.toProperCase(endpoint)}** ${this.discord.getEmoji(emoji)}`)
                .setFooter({text: `Responded in ${func.responseTime()}`, iconURL: this.discord.displayAvatar(this.message)})
                pixivArray.push(pixivEmbed)
            } else {
                if (Number(id)) {
                    if (!this.pixiv) this.pixiv = await Pixiv.refreshLogin(process.env.PIXIV_REFRESH_TOKEN!)
                    await Functions.timeout(500)
                    let illust: PixivIllust
                    try {
                        illust = await this.pixiv.illust.get(id)
                    } catch {
                        continue
                    }
                    const comments = await this.pixiv.illust.comments({illust_id: illust?.id}).catch(() => null)
                    await Functions.timeout(500)
                    const commentArray: string[] = []
                    for (let i = 0; i <= 5; i++) {
                            if (!comments?.comments[i]) break
                            commentArray.push(comments.comments[i].comment)
                    }
                    const cleanText = illust.caption.replace(/<\/?[^>]+(>|$)/g, "")
                    const pixivEmbed = this.embeds.createEmbed()
                    pixivEmbed
                    .setAuthor({name: "pixiv", iconURL: "https://kisaragi.moe/assets/embed/pixiv.png", url: "https://www.pixiv.net/en/"})
                    .setTitle(`**${Functions.toProperCase(endpoint)}** ${this.discord.getEmoji(emoji)}`)
                    .setURL(`https://www.pixiv.net/member_illust.php?mode=medium&illust_id=${illust?.id}`)
                    .setImage(pictures[i])
                    .setDescription(
                    `${discord.getEmoji("star")}_Title:_ **${illust.title}**\n` +
                    `${discord.getEmoji("star")}_Artist:_ **${illust.user.name}**\n` +
                    `${discord.getEmoji("star")}_Creation Date:_ **${Functions.formatDate(new Date(illust.create_date))}**\n` +
                    `${discord.getEmoji("star")}_Views:_ **${illust.total_view}**\n` +
                    `${discord.getEmoji("star")}_Bookmarks:_ **${illust.total_bookmarks}**\n` +
                    `${discord.getEmoji("star")}_Description:_ ${cleanText ? cleanText : "None"}\n` +
                    `${discord.getEmoji("star")}_Comments:_ ${commentArray.join() ? commentArray.join() : "None"}\n`
                    )
                    pixivArray.push(pixivEmbed)
                    try {
                        await SQLQuery.insertInto("pixiv", "id", id)
                        await sql.updateColumn("pixiv", "embed", pixivEmbed, "id", id)
                    } catch {
                        await sql.updateColumn("pixiv", "embed", pixivEmbed, "id", id)
                    }
                } else {
                    const title = id.replace(/(\()(.*?)(\))/, "")?.trim() ?? "Unknown"
                    const author = id.match(/(?<=\()(.*?)(?=\))/)?.[0] ?? "Unknown"
                    const pixivEmbed = this.embeds.createEmbed()
                    pixivEmbed
                    .setAuthor({name: "pixiv", iconURL: "https://kisaragi.moe/assets/embed/pixiv.png", url: "https://www.pixiv.net/en/"})
                    .setTitle(`**Pixiv Image** ${this.discord.getEmoji(emoji)}`)
                    .setImage(pictures[i])
                    .setDescription(
                        `${discord.getEmoji("star")}_Title:_ **${title}**\n` +
                        `${discord.getEmoji("star")}_Author:_ **${author}**\n`
                    )
                    pixivArray.push(pixivEmbed)
                    try {
                        await SQLQuery.insertInto("pixiv", "id", id)
                        await sql.updateColumn("pixiv", "embed", pixivEmbed, "id", id)
                    } catch {
                        await sql.updateColumn("pixiv", "embed", pixivEmbed, "id", id)
                    }
                }
            }
        }
        return pixivArray
    }
}
