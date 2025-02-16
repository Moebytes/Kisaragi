import {Message, EmbedBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Trello} from "trello-for-wolves"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class TrelloCommand extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Searches for trello boards and users.",
            help:
            `
            \`trello query\` - Searches for users with the query
            \`trello url\` - Fetches the board from the url
            `,
            examples:
            `
            \`=>trello name\`
            \`=>trello https://trello.com/b/boardID\`
            `,
            aliases: [],
            random: "string",
            cooldown: 10,
            defer: true,
            subcommandEnabled: true
        })
        const queryOption = new SlashCommandOption()
            .setType("string")
            .setName("query")
            .setDescription("Can be a query or url.")

        this.subcommand = new SlashCommandSubcommand()
            .setName("trello")
            .setDescription(this.options.description)
            .addOption(queryOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const perms = new Permission(discord, message)

        const trello = new Trello({key: process.env.TRELLO_API_KEY!, token: process.env.TRELLO_TOKEN!})
        const query = Functions.combineArgs(args, 1)

        if (query.match(/b\/[a-z0-9A-Z]{8}/)) {
            const boardID = query.match(/[a-z0-9A-Z]{8}/)![0]
            const result = await trello.boards(boardID).getBoard().then((r) => r.json())
            const members = await trello.boards(boardID).members().getMembers().then((r) => r.json())
            const avatar = await trello.members(members[0].id).getMember().then((r) => r.json())
            const lists = await trello.boards(boardID).lists().getLists().then((r) => r.json())
            const boardName = result.name
            const boardDesc = result.desc ? result.desc :"None"
            const boardUrl = result.shortUrl
            const boardImage = result.prefs.backgroundImage ?? ""
            const listIDs = lists.map((l) => l.id)
            const listNames = lists.map((l) => l.name)
            let cardDetails = ""
            let index = 0
            while (cardDetails.length < 1700) {
                if (!listIDs[index]) break
                const cards = await trello.lists(listIDs[index]).cards().getCards().then((r) => r.json())
                const cardList = cards.map((c) => c.name)
                cardDetails += `${discord.getEmoji("star")}**${listNames[index]}**\n${cardList.join("\n")}\n`
                index++
            }
            const memberList = members.map((m) => m.fullName)
            const trelloEmbed = embeds.createEmbed()
            .setAuthor({name: "trello", iconURL: "https://kisaragi.moe/assets/embed/trello.png", url: "https://www.spotify.com/"})
            .setTitle(`**Trello Board** ${discord.getEmoji("aquaWut")}`)
            .setImage(boardImage)
            .setThumbnail(avatar.avatarUrl ? `${avatar.avatarUrl}/original.png`: "")
            .setURL(boardUrl)
            .setDescription(
                `${discord.getEmoji("star")}_Board:_ **${boardName}**\n` +
                `${discord.getEmoji("star")}_Members:_ **${memberList.join(", ")}**\n` +
                `${discord.getEmoji("star")}_Description:_ ${boardDesc?.trim() ?? "None"}\n` +
                `${Functions.checkChar(cardDetails, 1700, " ")}`
            )
            return this.reply(trelloEmbed)
        }

        if (!query) {
            return this.noQuery(embeds.createEmbed()
            .setAuthor({name: "trello", iconURL: "https://kisaragi.moe/assets/embed/trello.png", url: "https://www.spotify.com/"})
            .setTitle(`**Trello User** ${discord.getEmoji("aquaWut")}`))
        }

        const trelloArray: EmbedBuilder[] = []
        const result = await trello.search().searchMembers({query, limit: 20}).then((r) => r.json()) as any
        for (let i = 0; i < result.length; i++) {
            const userID = result[i].id
            const avatar = result[i].avatarUrl ? `${result[i].avatarUrl}/original.png`: ""
            const name = result[i].fullName
            const bio = result[i].bio ? result[i].bio : "None"
            const userName = result[i].username ?? ""
            const boardIDs = result[i].idBoards
            let boards = "None"
            let boardLinks = "None"
            if (boardIDs[0]) {
                const result = await trello.members(userID).boards().getBoards().then((r) => r.json())
                boards = result.map((b)=> b.name).join(", ")
                boardLinks = result.map((b) => b.shortUrl).join("\n")
            }
            const trelloEmbed = embeds.createEmbed()
            .setAuthor({name: "trello", iconURL: "https://kisaragi.moe/assets/embed/trello.png", url: "https://www.spotify.com/"})
            .setTitle(`**Trello User** ${discord.getEmoji("aquaWut")}`)
            .setThumbnail(avatar)
            .setURL(`https://trello.com/${userName}`)
            .setDescription(
                `${discord.getEmoji("star")}_User:_ **${name}**\n` +
                `${discord.getEmoji("star")}_Bio:_ ${bio}\n` +
                `${discord.getEmoji("star")}_Boards:_ **${boards}**\n` +
                `${discord.getEmoji("star")}_Board Links:_ ${boardLinks}`
            )
            trelloArray.push(trelloEmbed)
        }

        if (trelloArray.length === 1) {
            return this.reply(trelloArray[0])
        } else {
            return embeds.createReactionEmbed(trelloArray)
        }
    }
}
