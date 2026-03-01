 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message, SlashCommandSubcommandBuilder} from "discord.js"
import {SlashCommandSubcommand} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class NumberCommand extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Guess the number!",
            help:
            `
            \`number\` - Start the number game.
            `,
            examples:
            `
            \`=>number\`
            `,
            aliases: ["number"],
            cooldown: 10,
            subcommandEnabled: true
        })
        this.subcommand = new SlashCommandSubcommand()
            .setName("number")
            .setDescription(this.options.description)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message

        const num = Math.floor(Math.random() * 1000000)

        await this.reply(`I picked a number! Try to guess what it is ${discord.getEmoji("raphiOMG")}`)
        const filter = (m: Message) => m.author.id === message.author.id && m.channel.id === message.channel.id

        const gameLoop = async () => {
            try {
                if (!message.channel.isSendable()) return
                const collected = await message.channel.awaitMessages({filter, max: 1, time: 60000}).then((c) => c.first()?.content.trim().toLowerCase())
                if (!collected) return this.reply(`Quit, no message was sent ${discord.getEmoji("kannaFacepalm")}`)
                if (collected === "quit") {
                    return this.send(`You lost the game! The correct number was **${num}** ${discord.getEmoji("smugFace")}`)
                } else if (!Number(collected)) {
                    await this.send(`This is not a number! Try again. Type **quit** to give up.`)
                    return gameLoop()
                } else if (Number(collected) === num) {
                    return this.send(`Congrats, you won the game! **${num}** was the correct number. ${discord.getEmoji("vigneWink")}`)
                } else if (Number(collected) < num) {
                    await this.send(`That number is too small! Type **quit** to give up.`)
                    return gameLoop()
                } else if (Number(collected) > num) {
                    await this.send(`That number is too big! Type **quit** to give up.`)
                    return gameLoop()
                }
            } catch {
                return this.send(`Sorry, the time has run out. Quit the game.`)
            }
        }
        gameLoop()
    }
}
