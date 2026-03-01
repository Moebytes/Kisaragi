 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {discord} from "./mock"
import "mocha"

let imageLink = "https://i.imgur.com/kHxuSve.jpeg"

describe("website", async () => {
    it("4chan", async () => {
        let name = "4chan"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("anilist", async () => {
        let name = "anilist"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("bandcamp", async () => {
        let name = "bandcamp"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "kawaii future bass"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("deviantart", async () => {
        let name = "deviantart"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("giphy", async () => {
        let name = "giphy"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("google", async () => {
        let name = "google"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "anime"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("images", async () => {
        let name = "images"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "anime"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("mal", async () => {
        let name = "mal"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("pinterest", async () => {
        let name = "pinterest"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "anime"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("reverseimage", async () => {
        let name = "reverseimage"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, imageLink])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("saucenao", async () => {
        let name = "saucenao"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, imageLink])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("soundcloud", async () => {
        let name = "soundcloud"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "anime"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("spotify", async () => {
        let name = "spotify"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "anime"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("trello", async () => {
        let name = "trello"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "anime"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("twitch", async () => {
        let name = "twitch"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "anime"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("wikipedia", async () => {
        let name = "wikipedia"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })
})