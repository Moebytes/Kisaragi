 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {discord} from "./mock"
import "mocha"

let gifLink = "https://i.imgur.com/WOYlL17.gif"
let videoLink = "https://i.imgur.com/v9t8Rmh.mp4"

describe("video", async () => {
    it("gifspeed", async () => {
        let name = "gifspeed"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "10", gifLink])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("reversevideo", async () => {
        let name = "reversevideo"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, videoLink])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("video2gif", async () => {
        let name = "video2gif"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "0", "3", videoLink])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("video2mp3", async () => {
        let name = "video2mp3"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, videoLink])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })

	it("videospeed", async () => {
        let name = "videospeed"
        discord.resetReplyStatus()
        const command = discord.commands.get(name)!
        if (command.options.defer) command.deferReply()
        await command.run([name, "2", videoLink])
        if (!discord.assertReplyStatus()) throw(new Error("failed reply status"))
    })
})