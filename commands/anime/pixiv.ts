import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {Permission} from "./../../structures/Permission"
import {PixivApi} from "./../../structures/PixivApi"

export default class Pixiv extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Searches for or downloads anime images on pixiv.",
            help:
            `
            _Note: Put the folder mapping in brackets in the format [folderName:tagName, folderName2:tagName2, etc.]._
            \`pixiv\` - Gets a pixiv image with some defaults.
            \`pixiv link/id\` - Gets the pixiv or ugoira image from the link.
            \`pixiv tag\` - Gets a pixiv image with the tag (translated to japanese).
            \`pixiv en tag\` - Gets a pixiv image with the tag (not translated).
            \`pixiv popular\` - Gets a pixiv image from the daily rankings.
            \`pixiv download/dl query [folderMap]?\` - Downloads images on pixiv and uploads the zip file. Folder map will organize certain tags into sub folders.
            `,
            examples:
            `
            \`=>pixiv\`
            \`=>pixiv azur lane\`
            \`=>pixiv download black tights\`
            \`=>pixiv download gabriel dropout [gabriel:gabriel, satania:satania, raphiel:raphiel, vignette:vignette]\`
            `,
            aliases: ["p"],
            random: "none",
            cooldown: 60,
            defer: true,
            subcommandEnabled: true
        })
        const tag3Option = new SlashCommandOption()
            .setType("string")
            .setName("tags3")
            .setDescription("Can be tags or optional folder map for the download subcommand.")

        const tag2Option = new SlashCommandOption()
            .setType("string")
            .setName("tags2")
            .setDescription("Can be tags or en/popular for subcommands.")

        const tagOption = new SlashCommandOption()
            .setType("string")
            .setName("tags")
            .setDescription("Can be a link, tags to search, or en/popular/download/r18 for subcommands.")

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(tagOption)
            .addOption(tag2Option)
            .addOption(tag3Option)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const pixivApi = new PixivApi(discord, message)
        const perms = new Permission(discord, message)
        if (!message.channel.isSendable()) return
        if (!perms.checkNSFW()) return

        const loading = message.channel.lastMessage
        if (message instanceof Message) Functions.deferDelete(loading, 0)

        const tags = Functions.combineArgs(args, 1)

        if (tags.match(/\d\d\d+/g)) {
            return pixivApi.getPixivImageID(String(tags.match(/\d+/g)))
        }

        if (args[1]?.toLowerCase() === "r18") {
            if (!perms.checkNSFW()) return
            if (!perms.checkBotDev()) return
            if (args[2] === "en") {
                const r18Tags = Functions.combineArgs(args, 3)
                return pixivApi.getPixivImage(r18Tags, true, true)
            } else if (args[2] === "popular") {
                return pixivApi.getPopularPixivR18Image()
            } else if (args[2] === "download" || args[2] === "dl") {
                const r18Input = Functions.combineArgs(args, 3)
                const {tags, folderMap} = this.getFolderMap(r18Input)
                return pixivApi.downloadPixivImages(tags, true, folderMap)
            } else {
                const r18Tags = Functions.combineArgs(args, 2)
                return pixivApi.getPixivImage(r18Tags, true)
            }
        }

        if (args[1] === "en") {
            const enTags = Functions.combineArgs(args, 2)
            return pixivApi.getPixivImage(enTags, false, true)
        } else if (args[1] === "download" || args[1] === "dl") {
            const input = Functions.combineArgs(args, 2)
            const {tags, folderMap} = this.getFolderMap(input)
            return pixivApi.downloadPixivImages(tags, false, folderMap)
        } else if (args[1] === "popular") {
            return pixivApi.getPopularPixivImage()
        }

        return pixivApi.getPixivImage(tags)
    }

    public getFolderMap = (tags: string) => {
        let folderMap = undefined as any
        if (tags.includes("[") && tags.includes("]")) {
            const folderArgs = tags.match(/(?<=\[)(.*?)(?=\])/)?.[0]?.split(",")
            tags = tags.replace(/(\[)(.*?)(\])/, "")
            folderMap = []
            const length = folderArgs?.length ?? 0
            for (let i = 0; i < length; i++) {
                const obj = {} as any
                const fArgs = folderArgs![i].split(":")
                obj.folder = fArgs[0]
                obj.tag = fArgs[1]
                folderMap.push(obj)
            }
            return {tags, folderMap}
        } else {
            return {tags, folderMap}
        }
    }
}
