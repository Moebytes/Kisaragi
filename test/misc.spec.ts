 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {discord} from "./mock"
import "mocha"

describe("misc", async () => {
    it("calc", async () => {
        let name = "calc"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "sin(1)"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("chain", async () => {
        let name = "chain"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "calc 1+1 & base64 hi"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("define", async () => {
        let name = "define"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "hi"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("download", async () => {
        let name = "download"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("holiday", async () => {
        let name = "holiday"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("nasa", async () => {
        let name = "nasa"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("pokemon", async () => {
        let name = "pokemon"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "pikachu"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("random", async () => {
        let name = "random"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("screenshot", async () => {
        let name = "screenshot"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "https://www.youtube.com/"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("snowflake", async () => {
        let name = "snowflake"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "579720679612612608"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("thesaurus", async () => {
        let name = "thesaurus"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "hi"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("time", async () => {
        let name = "time"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "new york"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("weather", async () => {
        let name = "weather"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "new york"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })
})