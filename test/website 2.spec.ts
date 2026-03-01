 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {discord} from "./mock"
import "mocha"

describe("website 2", async () => {
    it("appstore", async () => {
        let name = "appstore"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "anime"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("crunchyroll", async () => {
        let name = "crunchyroll"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "konosuba"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("github", async () => {
        let name = "github"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "anime"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("googleplay", async () => {
        let name = "googleplay"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "anime"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("imdb", async () => {
        let name = "imdb"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "konosuba"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("imgur", async () => {
        let name = "imgur"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "anime"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("itunes", async () => {
        let name = "itunes"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "anime"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("mdn", async () => {
        let name = "mdn"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "array"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("npm", async () => {
        let name = "npm"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "pixiv.ts"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("patreon", async () => {
        let name = "patreon"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "anime"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("tenor", async () => {
        let name = "tenor"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("urban", async () => {
        let name = "urban"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("wattpad", async () => {
        let name = "wattpad"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "anime"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("xkcd", async () => {
        let name = "xkcd"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("youtube", async () => {
        let name = "youtube"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "anime"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })
})