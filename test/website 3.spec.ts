 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {discord} from "./mock"
import "mocha"

describe("website 3", async () => {
    it("bots", async () => {
        let name = "bots"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("flickr", async () => {
        let name = "flickr"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "anime"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("gravatar", async () => {
        let name = "gravatar"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("instagram", async () => {
        let name = "instagram"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "anime"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("musescore", async () => {
        let name = "musescore"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "anime"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("stackexchange", async () => {
        let name = "stackexchange"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "anime", "slice of life"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("steam", async () => {
        let name = "steam"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "anime"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("tumblr", async () => {
        let name = "tumblr"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "anime"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("yelp", async () => {
        let name = "yelp"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "mcdonalds"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })
})