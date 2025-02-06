import axios from "axios"
import {Message, EmbedBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Functions} from "../../structures/Functions"
import {Kisaragi} from "../../structures/Kisaragi"
import {Permission} from "../../structures/Permission"

export default class Musescore extends Command {
    private readonly headers = {"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36"}
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Searches for midi files and sheet music on musescore.",
            help:
            `
            \`musescore query\` - Search for scores
            `,
            examples:
            `
            \`=>musescore anime\`
            `,
            aliases: [],
            random: "none",
            cooldown: 10,
            defer: true,
            unlist: true,
            subcommandEnabled: false
        })
        const queryOption = new SlashCommandOption()
            .setType("string")
            .setName("query")
            .setDescription("The query to search.")

        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(queryOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const perms = new Permission(discord, message)
        const text = Functions.combineArgs(args, 1)
        const html = await axios.get(`https://musescore.com/sheetmusic?text=${text}`, {headers: this.headers}).then((r) => r.data)
        const json = JSON.parse(Functions.decodeEntities(html.match(/(?<=<div class="js-store" data-content=")(.*?)(?=")/gm)?.[0]))
        const scores = json.store.page.data.scores
        if (!scores[0]) {
            return this.invalidQuery(embeds.createEmbed()
            .setAuthor({name: "musescore", iconURL: "https://kisaragi.moe/assets/embed/musescore.png", url: "https://musescore.com/"})
            .setTitle(`**Musescore Search** ${discord.getEmoji("raphi")}`))
        }
        const museArray: EmbedBuilder[] = []
        for (let i = 0; i < scores.length; i++) {
            const score = scores[i]
            const url = score.share.publicUrl
            const user = `[**${score.user.name}**](${score.user.url})`
            const avatar = score.user.image
            const image = score.thumbnails.original
            const secret = image.match(/(?<=gen\/)(.*?)(?=\/score)/)?.[0]
            const midi = `[**Midi**](http://musescore.com/static/musescore/scoredata/gen/${secret}/score.mid)\n`
            const pdf = `[**PDF**](http://musescore.com/static/musescore/scoredata/gen/${secret}/score.pdf)\n`
            const mxml = `[**Music XML**](http://musescore.com/static/musescore/scoredata/gen/${secret}/score.mxml)\n`
            const mscz = `[**Musescore File**](http://musescore.com/static/musescore/scoredata/gen/${secret}/score.mscz)\n`
            const mp3 = `[**MP3**](http://musescore.com/static/musescore/scoredata/gen/${secret}/score.mp3)\n`
            const museEmbed = embeds.createEmbed()
            museEmbed
            .setAuthor({name: "musescore", iconURL: "https://kisaragi.moe/assets/embed/musescore.png", url: "https://musescore.com/"})
            .setTitle(`**Musescore Search** ${discord.getEmoji("raphi")}`)
            .setURL(url)
            .setThumbnail(avatar)
            .setImage(image)
            .setDescription(
                `${discord.getEmoji("star")}_Title:_ **${score.title}**\n` +
                `${discord.getEmoji("star")}_Composer:_ ${user}\n` +
                `${discord.getEmoji("star")}_Pages:_ **${score.pages_count}**\n` +
                `${discord.getEmoji("star")}_Creation Date:_ **${Functions.formatDate(new Date(1000*score.date_created))}**\n` +
                `${discord.getEmoji("star")}_Views:_ **${score.hits}**\n` +
                `${discord.getEmoji("star")}_Comments:_ **${score.comments_count}**\n` +
                `${discord.getEmoji("star")}_Description:_ ${score.truncated_description.replace(/(\[url)(.*?)(url])/g, "")}\n` +
                midi + pdf + mp3 + mxml + mscz
            )
            museArray.push(museEmbed)
        }
        if (museArray.length === 1) {
            return this.reply(museArray[0])
        } else {
            return embeds.createReactionEmbed(museArray)
        }
    }
}
