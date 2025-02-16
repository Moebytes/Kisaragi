import axios from "axios"
import Booru from "booru"
import {Message, EmbedBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {Permission} from "./../../structures/Permission"

export default class Danbooru extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Searches for anime pictures on danbooru.",
            help:
            `
            _Note: Underscores are not required._
            \`danbooru\` - Get a random image.
            \`danbooru link/id\` - Gets the image from the link.
            \`danbooru tag\` - Gets an image with the tag.
            \`danbooru r18\` - Get a random r18 image.
            \`danbooru r18 tag\` - Get an r18 image with the tag.
            \`=>danbooru r18 gabriel dropout\`
            `,
            examples:
`
            \`=>danbooru\`
            \`=>danbooru tenma gabriel white\`
            `,
            aliases: ["d", "dan"],
            random: "none",
            cooldown: 20,
            defer: true,
            subcommandEnabled: true
        })
        const tagOption = new SlashCommandOption()
            .setType("string")
            .setName("tag")
            .setDescription("tags or link to search")
        
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(tagOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const perms = new Permission(discord, message)
        const headers = {"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36"}
        const danbooru = Booru("danbooru", process.env.DANBOORU_API_KEY as any)
        const danbooruEmbed = embeds.createEmbed()
        .setAuthor({name: "danbooru", iconURL: "https://kisaragi.moe/assets/embed/danbooru.png"})
        .setTitle(`**Danbooru Search** ${discord.getEmoji("gabUghh")}`)

        let tags: string[] = []
        if (!args[1]) {
            tags = ["pantyhose", "rating:general or rating:sensitive"]
        } else if (args[1].toLowerCase() === "r18") {
            if (!perms.checkNSFW()) return
            tags = Functions.combineArgs(args, 2).split(",")
            if (!tags.join("")) tags = ["pantyhose"]
            tags.push("-rating:general")
        } else {
            tags = Functions.combineArgs(args, 1).split(",")
            tags.push("rating:general or rating:sensitive")
        }

        const tagArray: string[] = []
        for (let i = 0; i < tags.length; i++) {
            tagArray.push(tags[i].trim().replace(/ /g, "_"))
        }

        let images: any[] = []
        if (tags.join("").match(/\d\d+/g)) {
            try {
                images = [await axios.get(`https://danbooru.donmai.us/posts/${tags.join("").match(/\d\d+/g)}.json`, {headers}).then((r) => r.data)]
            } catch {
                return this.invalidQuery(danbooruEmbed, "The url is invalid.")
            }
        } else {
            const rawImages = await danbooru.search(tagArray, {limit: 50, random: true})
            if (!rawImages[0]) {
                return this.invalidQuery(danbooruEmbed, "Underscores are not required, " +
                "if you want to search multiple terms separate them with a comma. Tags usually start with a last name, try looking up your tag " +
                "on the [**Danbooru Website**](https://danbooru.donmai.us/)")
            }
            // @ts-ignore
            images = rawImages.map((i) => i.data)
        }
        const danbooruArray: EmbedBuilder[] = []
        for (let i = 0; i < images.length; i++) {
            const img = images[i]
            if (img.rating !== "g" && img.rating !== "s") {
                if (!perms.checkNSFW(true)) continue
            }
            const danbooruEmbed = embeds.createEmbed()
            .setAuthor({name: "danbooru", iconURL: "https://kisaragi.moe/assets/embed/danbooru.png"})
            .setTitle(`**Danbooru Search** ${discord.getEmoji("gabUghh")}`)
            .setURL(`https://danbooru.donmai.us/posts/${img.id}`)
            .setDescription(
                `${discord.getEmoji("star")}_Character:_ **${img.tag_string_character ? Functions.toProperCase(img.tag_string_character.replace(/ /g, "\n").replace(/_/g, " ")) : "Original"}**\n` +
                `${discord.getEmoji("star")}_Artist:_ **${Functions.toProperCase(img.tag_string_artist.replace(/_/g, " "))}**\n` +
                `${discord.getEmoji("star")}_Anime:_ **${Functions.toProperCase(img.tag_string_copyright.replace(/_/g, " "))}**\n` +
                `${discord.getEmoji("star")}_Source:_ ${img.source}\n` +
                `${discord.getEmoji("star")}_Creation Date:_ **${Functions.formatDate(img.created_at)}**\n` +
                `${discord.getEmoji("star")}_Tags:_ ${Functions.checkChar(img.tag_string_general, 2048, " ")}\n`
            )
            .setImage(img.file_url)
            danbooruArray.push(danbooruEmbed)
        }
        if (!danbooruArray[0]) {
            return this.invalidQuery(danbooruEmbed)
        }
        if (danbooruArray.length === 1) {
            return this.reply(danbooruArray[0])
        } else {
            return embeds.createReactionEmbed(danbooruArray, true, true)
        }
    }
}
