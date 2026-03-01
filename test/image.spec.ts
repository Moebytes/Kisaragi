 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {discord} from "./mock"
import "mocha"

let imageLink = "https://i.imgur.com/kHxuSve.jpeg"

describe("image", async function() {
    it("blur", async () => {
        let name = "blur"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "30", imageLink])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

    it("brightness", async () => {
        let name = "brightness"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "50", imageLink])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

    it("contrast", async () => {
        let name = "contrast"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "50", imageLink])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

    it("crop", async () => {
        let name = "crop"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "100", "200", "200", "200", imageLink])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

    it("flip", async () => {
        let name = "flip"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "x", imageLink])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

    it("greyscale", async () => {
        let name = "greyscale"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, imageLink])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

    it("hue", async () => {
        let name = "hue"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "50", imageLink])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

    it("invert", async () => {
        let name = "invert"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, imageLink])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

    it("opacity", async () => {
        let name = "opacity"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "70", imageLink])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

    it.skip("photoshop", async () => {
        let name = "photoshop"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

    it("pixelate", async () => {
        let name = "pixelate"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "7", imageLink])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

    it("posterize", async () => {
        let name = "posterize"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "10", imageLink])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

    it("resize", async () => {
        let name = "resize"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "500", "700", imageLink])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

    it("saturation", async () => {
        let name = "saturation"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "50", imageLink])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

    it("scale", async () => {
        let name = "scale"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "1.5", imageLink])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

    it("sepia", async () => {
        let name = "sepia"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, imageLink])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

    it("sharpen", async () => {
        let name = "sharpen"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "5", "5", imageLink])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

    it("tint", async () => {
        let name = "tint"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "#ff5ce1", "60", imageLink])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

    it("lightness", async () => {
        let name = "lightness"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "50", imageLink])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

    it.skip("waifu2x", async () => {
        let name = "waifu2x"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "cugan", imageLink])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })
})