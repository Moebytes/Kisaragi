/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Functions} from "./Functions"
import {Kisaragi} from "./Kisaragi"

export class Letters {
    constructor(private readonly discord: Kisaragi) {}

    // Parse Letters
    public letters = (text: string) => {
        const fullText: string[] = []
        for (let i = 0; i < text.length; i++) {
            fullText.push(this.getLetter(text[i])!)
        }
        const fullString = fullText.join("")
        return Functions.checkChar(fullString, 1999, "<")
    }

    // Parse Emoji Letters
    public getLetter = (letter: string) => {
        if (letter === " ") return "     "
        if (letter === letter.toUpperCase()) {
            const emoji = this.discord.getEmoji(`${letter}U`)
            return emoji ? `<:${emoji.identifier}>` : letter
        }
        if (letter === letter.toLowerCase()) {
            const emoji = this.discord.getEmoji(`${letter}l`)
            return emoji ? `<:${emoji.identifier}>` : letter
        }
        if (typeof Number(letter) === "number") {
            const emoji = this.discord.getEmoji(`${letter}n`)
            return emoji ? `<:${emoji.identifier}>` : letter
        }
    }
}
