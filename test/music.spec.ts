 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {discord} from "./mock"
import "mocha"

describe("music", async () => {
    it("abloop", async () => {
        let name = "abloop"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "1:30", "2:30"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("clear", async () => {
        let name = "clear"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("deletequeue", async () => {
        let name = "deletequeue"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("fastforward", async () => {
        let name = "fastforward"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "3s"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("loop", async () => {
        let name = "loop"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("nowplaying", async () => {
        let name = "nowplaying"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("pause", async () => {
        let name = "pause"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("pitch", async () => {
        let name = "pitch"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "12"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("play", async () => {
        let name = "play"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("queue", async () => {
        let name = "queue"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("resume", async () => {
        let name = "resume"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("reverse", async () => {
        let name = "reverse"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("rewind", async () => {
        let name = "rewind"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "3s"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("scrub", async () => {
        let name = "scrub"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "0"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("shuffle", async () => {
        let name = "shuffle"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("skip", async () => {
        let name = "skip"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "3"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("speed", async () => {
        let name = "speed"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "2"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("stop", async () => {
        let name = "stop"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("volume", async () => {
        let name = "volume"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "2"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })
})