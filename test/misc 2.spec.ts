 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {discord} from "./mock"
import "mocha"

describe("misc 2", async () => {
    it("base64", async () => {
        let name = "base64"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "hi"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("bcrypt", async () => {
        let name = "bcrypt"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "hi"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("binary", async () => {
        let name = "binary"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "hi"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("email", async () => {
        let name = "email"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "hello"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("hastebin", async () => {
        let name = "hastebin"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "hi"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("hexadecimal", async () => {
        let name = "hexadecimal"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "hi"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("json", async () => {
        let name = "json"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("md5", async () => {
        let name = "md5"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "hi"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("pastebin", async () => {
        let name = "pastebin"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "[title]", "hi"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("ping", async () => {
        let name = "ping"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("pwned", async () => {
        let name = "pwned"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("shorten", async () => {
        let name = "shorten"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "https://www.youtube.com/"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })
})