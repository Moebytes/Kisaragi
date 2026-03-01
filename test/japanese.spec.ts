 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {discord} from "./mock"
import "mocha"

describe("weeb", async function() {
    it("furigana", async () => {
        let name = "furigana"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "好き"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

    it("hiragana", async () => {
        let name = "hiragana"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "好き"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

    it("jisho", async () => {
        let name = "jisho"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "好き"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

    it("katakana", async () => {
        let name = "katakana"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "好き"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

    it("romaji", async () => {
        let name = "romaji"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "好き"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

    it("translate", async () => {
        let name = "translate"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "好き"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })
})