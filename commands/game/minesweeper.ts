/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message, EmbedBuilder, MessageReaction, TextChannel, User} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import minesweeper from "discord.js-minesweeper"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {Permission} from "../../structures/Permission"

export default class Minesweeper extends Command {
    private done = false
    private original = null as any
    private revealed = false
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: `Starts a new game of minesweeper.`,
            help:
            `
            \`minesweeper rows? columns?\` - Starts a new game, defaults to 5x5.
            \`minesweeper spoiler rows? columns?\` - Spoiler tag version. No win/lose feedback.
            `,
            examples:
            `
            \`=>minesweeper\`
            \`=>minesweeper spoiler\`
            `,
            aliases: ["mine"],
            random: "none",
            cooldown: 5,
            subcommandEnabled: true
        })
        const column2Option = new SlashCommandOption()
            .setType("string")
            .setName("columns2")
            .setDescription("Set columns in the subcommand")

        const columnOption = new SlashCommandOption()
            .setType("string")
            .setName("columns")
            .setDescription("Can be columns or rows in subcommand")

        const rowOption = new SlashCommandOption()
            .setType("string")
            .setName("rows")
            .setDescription("Can be rows or spoiler for spoiler subcommand")
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(rowOption)
            .addOption(columnOption)
            .addOption(column2Option)
    }

    public checkWinLose = (board: string[][], user: User, row: number, column: number, mineCount: number) => {
        if (this.done) return
        const current = this.replaceEmoji(board[row][column]).toLowerCase()
        if (current.includes("bomb")) {
            this.done = true
            return `<@${user.id}>, Sorry but you lost this game! ${this.discord.getEmoji("cirNo")}`
        }
        let lost = false
        let counter = 0
        for (let i = 0; i < board.length; i++) {
            for (let j = 0; j < board[0].length; j++) {
                const current = this.replaceEmoji(board[i][j]).toLowerCase()
                if (!current.includes("block") || !current.includes("flag")) {
                    counter++
                } else if (current.includes("bomb")) {
                    lost = true
                }
            }
        }
        if (((board.length * board[0].length - mineCount) === counter) && !lost) {
            this.done = true
            return `<@${user.id}>, Congratulations, you won this game of minesweeper! ${this.discord.getEmoji("tohruThumbsUp")}`
        }
    }

    public createMineEmbed = (board: string[][]) => {
        const discord = this.discord
        const embeds = new Embeds(this.discord, this.message)
        const mineEmbed = embeds.createEmbed()
        mineEmbed
        .setAuthor({name: "minesweeper", iconURL: "https://kisaragi.moe/assets/embed/minesweeper.png"})
        .setTitle(`**Minesweeper** ${discord.getEmoji("kannaXD")}`)
        .setDescription(this.replaceEmoji(this.stringifyBoard(board)))
        return mineEmbed
    }

    public replaceEmoji = (game: string) => {
        const discord = this.discord
        const numMap = {
            ":zero:": discord.getEmoji("0n"),
            ":one:": discord.getEmoji("1n"),
            ":two:": discord.getEmoji("2n"),
            ":three:": discord.getEmoji("3n"),
            ":four:": discord.getEmoji("4n"),
            ":five:": discord.getEmoji("5n"),
            ":six:": discord.getEmoji("6n"),
            ":seven:": discord.getEmoji("7n"),
            ":eight:": discord.getEmoji("8n"),
            ":nine:": discord.getEmoji("9n"),
            ":boom:": discord.getEmoji("mineBomb")
        }
        for (let i = 0; i < Object.keys(numMap).length; i++) {
            const regex = new RegExp(Object.keys(numMap)[i], "g")
            game = game.replace(regex, String(Object.values(numMap)[i]))
        }
        return game
    }

    public stringifyBoard = (board: string[][]) => {
        let description = ""
        for (let i = 0; i < board.length; i++) {
            for (let j = 0; j < board[0].length; j++) {
                description += board[i][j]
            }
            description += "\n"
        }
        return description
    }

    public revealBoard = (board: string[][], game: string[][]) => {
        const temp = Functions.cloneArray(board)
        for (let i = 0; i < temp.length; i++) {
            for (let j = 0; j < temp[0].length; j++) {
                temp[i][j] = this.replaceEmoji(game[i][j].replace(/\|/g, ""))
            }
        }
        return temp
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        if (!(message.channel as TextChannel).permissionsFor(message.guild?.members.me!)?.has("ManageMessages")) {
            return this.reply(`The bot needs the permission **Manage Messages** in order to use this command. ${this.discord.getEmoji("kannaFacepalm")}`)
        }

        if (args[1] === "spoiler") {
            let rows = 5
            let columns = 5
            const mineCount = Math.floor((rows*columns)/3.5)
            if (args[2]) {
                rows = Number(args[2])
                if (args[3]) columns = Number(args[3])
            }
            if (Number.isNaN(rows) || Number.isNaN(columns)) {
                return this.invalidQuery(embeds.createEmbed()
                .setAuthor({name: "minesweeper", iconURL: "https://kisaragi.moe/assets/embed/minesweeper.png"})
                .setTitle(`**Minesweeper** ${discord.getEmoji("kannaXD")}`), "The row or column count is invalid.")
            }
            const mine = new minesweeper({
                rows,
                columns,
                mines: mineCount,
                returnType: "emoji"
              })
            const game = mine.start() as string
            const mineEmbed = embeds.createEmbed()
            mineEmbed
            .setAuthor({name: "minesweeper", iconURL: "https://kisaragi.moe/assets/embed/minesweeper.png"})
            .setTitle(`**Minesweeper** ${discord.getEmoji("kannaXD")}`)
            .setDescription(this.replaceEmoji(this.replaceEmoji(game)))
            return this.reply(mineEmbed)
        }

        let rows = 5
        let columns = 5
        const mineCount = Math.floor((rows*columns)/3.5)
        if (args[1]) {
            rows = Number(args[1])
            if (args[2]) columns = Number(args[2])
        }
        if (Number.isNaN(rows) || Number.isNaN(columns)) {
            return this.invalidQuery(embeds.createEmbed()
            .setAuthor({name: "minesweeper", iconURL: "https://kisaragi.moe/assets/embed/minesweeper.png"})
            .setTitle(`**Minesweeper** ${discord.getEmoji("kannaXD")}`), "The row or column count is invalid.")
        }
        const mine = new minesweeper({
            rows,
            columns,
            mines: mineCount,
            returnType: "matrix"
        })
        const game = mine.start() as string[][]
        const board: string[][] = Functions.create2DArray(rows, columns)
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < columns; j++) {
                board[i][j] = `${discord.getEmoji("mineBlock")}`
            }
        }

        const mineEmbed = this.createMineEmbed(board)
        const msg = await this.reply(mineEmbed)
        const reactions = ["arrayReact", "mineFlagReact", "mineReveal"]
        for (let i = 0; i < reactions.length; i++) await msg.react(discord.getEmoji(reactions[i]))

        const arrayCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("arrayReact").id && user.bot === false
        const flagCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("mineFlagReact").id && user.bot === false
        const revealCheck = (reaction: MessageReaction, user: User) => reaction.emoji.id === this.discord.getEmoji("mineReveal").id && user.bot === false
        const array = msg.createReactionCollector({filter: arrayCheck})
        const flag = msg.createReactionCollector({filter: flagCheck})
        const reveal = msg.createReactionCollector({filter: revealCheck})

        array.on("collect", async (reaction: MessageReaction, user: User) => {
            await reaction.users.remove(user).catch(() => null)
            let row = 1
            let column = 1
            const self = this
            async function getRowsColumns(response: Message) {
                row = Number(response.content.match(/\d+/g) ? response.content.match(/\d+/g)?.[0] : NaN)
                column = Number(response.content.match(/\d+/g) ? response.content.match(/\d+/g)?.[1] : NaN)
                if (Number.isNaN(row) || Number.isNaN(column) || row-1 > rows || column-1 > columns) {
                    const rep = await response.reply("The row or column is invalid.")
                    await Functions.timeout(2000)
                    await Functions.deferDelete(rep, 0)
                } else {
                    row = row - 1
                    column = column -1
                    board[row][column] = game[row][column].replace(/\|/g, "")
                    self.original = Functions.cloneArray(board)
                    const mineEmbed = self.createMineEmbed(board)
                    discord.edit(msg, mineEmbed)
                }
                await Functions.deferDelete(response, 0)
            }
            const numReply = await discord.send(msg, `<@${user.id}>, Enter the row number followed by the column number.`)
            await embeds.createPrompt(getRowsColumns)
            await Functions.deferDelete(numReply, 0)
            const win = this.checkWinLose(board, user, row, column, mineCount)
            if (win) discord.send(msg, win)
        })

        flag.on("collect", async (reaction: MessageReaction, user: User) => {
            await reaction.users.remove(user).catch(() => null)
            const self = this
            async function getRowsColumns(response: Message) {
                let row = Number(response.content.match(/\d+/g) ? response.content.match(/\d+/g)?.[0] : NaN)
                let column = Number(response.content.match(/\d+/g) ? response.content.match(/\d+/g)?.[1] : NaN)
                if (Number.isNaN(row) || Number.isNaN(column) || row-1 > rows || column-1 > columns) {
                    const rep = await response.reply("The row or column is invalid.")
                    await Functions.timeout(2000)
                    await Functions.deferDelete(rep, 0)
                } else {
                    row = row - 1
                    column = column - 1
                    board[row][column] = `${discord.getEmoji("mineFlag")}`
                    self.original = Functions.cloneArray(board)
                    const mineEmbed = self.createMineEmbed(board)
                    discord.edit(msg, mineEmbed)
                }
                await Functions.deferDelete(response, 0)
            }
            const numReply = await discord.send(msg, `<@${user.id}>, Enter the row number followed by the column number.`)
            await embeds.createPrompt(getRowsColumns)
            await Functions.deferDelete(numReply, 0)
        })

        reveal.on("collect", async (reaction: MessageReaction, user: User) => {
            await reaction.users.remove(user).catch(() => null)
            if (!this.done) {
                await discord.send(msg, `<@${user.id}>, You revealed the game before it was done so you lost by default! ${discord.getEmoji("tohruSmug")}`)
                this.done = true
            }
            if (this.original === null) this.original = Functions.cloneArray(board)
            let mineEmbed: EmbedBuilder
            const newBoard = this.revealBoard(board, game)
            if (this.revealed) {
                mineEmbed = this.createMineEmbed(this.original)
                this.revealed = false
            } else {
                mineEmbed = this.createMineEmbed(newBoard)
                this.revealed = true
            }
            await discord.edit(msg, mineEmbed)
        })
    }

}
