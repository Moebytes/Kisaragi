 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message, SlashCommandSubcommandBuilder} from "discord.js"
import {SlashCommandSubcommand} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class Slots extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Rolls the slot machine.",
            help:
            `
            \`slots\` - Rolls the slot machine.
            `,
            examples:
            `
            \`=>slots\`
            `,
            aliases: [],
            random: "none",
            cooldown: 3,
            subcommandEnabled: true
        })
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const emojiList = ["tohruSmug", "vigneXD", "kaosWTF", "gabYes", "raphiSmile", "poiHug", "kannaAngry"]
        const randList: any[] = []
        for (let i = 0; i < 5; i++) {
            randList.push(emojiList[Math.floor(Math.random() * emojiList.length)])
        }
        const slotArray: any[] = []
        for (let i = 0; i < 9; i++) {
            slotArray.push(randList[Math.floor(Math.random() * 5)])
        }

        const row = Math.ceil(Math.random() * 3)
        let [a, b, c] = [0, 0, 0]
        switch (row) {
            case 1:
                  a = 0
                  b = 1
                  c = 2
                  break
            case 2:
                  a = 3
                  b = 4
                  c = 5
                  break
            case 3:
                  a = 6
                  b = 7
                  c =  8
            default:
        }
        let matches = 1
        if (slotArray[a] === slotArray[b]) {
            matches = 2
            if (slotArray[a] === slotArray[c]) {
                matches = 3
            }
        } else if (slotArray[a] === slotArray[c]) {
            matches = 2
            if (slotArray[a] === slotArray[b]) {
                matches = 3
            }
        } else if (slotArray[b] === slotArray[c]) {
            matches = 2
            if (slotArray[a] === slotArray[b]) {
                matches = 3
            }
        }

        let matchText = ""
        switch (matches) {
            case 1:
                matchText = `**Matches: 1** ${discord.getEmoji("mexShrug")}`
                break
            case 2:
                matchText = `**Matches: 2** ${discord.getEmoji("aquaUp")}`
                break
            case 3:
                matchText = `**Matches: 3** ${discord.getEmoji("gabYes")}\n **Perfect Score!** 🎉`
            default:
        }

        const left = discord.getEmoji("left")
        await this.reply(`**Slot Machine** ${discord.getEmoji("kannaXD")}\n`)
        await this.send(
            `${discord.getEmoji(slotArray[0])} ${discord.getEmoji(slotArray[1])} ${discord.getEmoji(slotArray[2])} ${row === 1 ? left : ""}\n` +
            `${discord.getEmoji(slotArray[3])} ${discord.getEmoji(slotArray[4])} ${discord.getEmoji(slotArray[5])} ${row === 2 ? left : ""}\n` +
            `${discord.getEmoji(slotArray[6])} ${discord.getEmoji(slotArray[7])} ${discord.getEmoji(slotArray[8])} ${row === 3 ? left : ""}\n`
        )
        return this.send(matchText)
    }
}
