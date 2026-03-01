 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {discord} from "./mock"
import "mocha"

describe("music 2", async () => {
    it("allpass", async () => {
        let name = "allpass"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("bandpass", async () => {
        let name = "bandpass"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("bandreject", async () => {
        let name = "bandreject"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("bitcrush", async () => {
        let name = "bitcrush"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("chorus", async () => {
        let name = "chorus"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("compress", async () => {
        let name = "compress"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("delay", async () => {
        let name = "delay"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("distortion", async () => {
        let name = "distortion"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("effects", async () => {
        let name = "effects"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("equalizer", async () => {
        let name = "equalizer"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("flanger", async () => {
        let name = "flanger"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("highpass", async () => {
        let name = "highpass"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("highshelf", async () => {
        let name = "highshelf"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("lowpass", async () => {
        let name = "lowpass"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("lowshelf", async () => {
        let name = "lowshelf"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("peak", async () => {
        let name = "peak"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("phaser", async () => {
        let name = "phaser"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("reverb", async () => {
        let name = "reverb"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("tremolo", async () => {
        let name = "tremolo"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("upsample", async () => {
        let name = "upsample"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })
})