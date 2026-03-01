 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {discord} from "./mock"
import "mocha"

describe("mod", async () => {
    it("ban", async () => {
        let name = "ban"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "@user", "spammer"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("cases", async () => {
        let name = "cases"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("deafen", async () => {
        let name = "deafen"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "@user", "spammer"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("delete", async () => {
        let name = "delete"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "5"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("kick", async () => {
        let name = "kick"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "@user", "spammer"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("mute", async () => {
        let name = "mute"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "@user", "spammer"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("nsfw", async () => {
        let name = "nsfw"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("reason", async () => {
        let name = "reason"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "5", "hi"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("restrict", async () => {
        let name = "restrict"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "@user", "spammer"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("role", async () => {
        let name = "role"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "add", "@user", "@kawaii"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("softban", async () => {
        let name = "softban"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "@user", "spammer"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("tempban", async () => {
        let name = "tempban"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "@user", "6d", "spammer"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("tempmute", async () => {
        let name = "tempmute"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "@user", "6d", "spammer"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("topic", async () => {
        let name = "topic"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "hi"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("unban", async () => {
        let name = "unban"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "@user"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("undeafen", async () => {
        let name = "undeafen"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "@user"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("unmute", async () => {
        let name = "unmute"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "@user"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("unrestrict", async () => {
        let name = "unrestrict"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "@user"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("vckick", async () => {
        let name = "vckick"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "@user", "spammer"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("vcmute", async () => {
        let name = "vcmute"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "@user", "spammer"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("vcunmute", async () => {
        let name = "vcunmute"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "@user"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("warn", async () => {
        let name = "warn"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "@user", "spammer"])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("warns", async () => {
        let name = "warns"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })
})