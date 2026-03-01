/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {WebhookClient} from "discord.js"
import {HelixStream} from "@twurple/api"
import {Kisaragi} from "./../structures/Kisaragi"
import {SQLQuery} from "./../structures/SQLQuery"

export default class TwitchOnline {
    constructor(private readonly discord: Kisaragi) {}

    public run = async (stream: HelixStream) => {
        const discord = this.discord
        const config = await SQLQuery.fetchColumn("twitch", "config", "channel", stream.userDisplayName)
        for (let i = 0; i < config.length; i++) {
            const current = JSON.parse(config[i])
            if (!current.id || !current.token) continue
            if (!current.state || current.state === "Off") continue
            const webhook = new WebhookClient({id: current.id, token: current.token}, {
                allowedMentions: {parse: ["users", "roles"]},
                rest: {offset: 0}
            })
            if (!current.mention) current.mention = ""
            const message = `${current.mention}[**${stream.userDisplayName}**](https://www.twitch.tv/${stream.userDisplayName}) is streaming on twitch! https://www.twitch.tv/${stream.userDisplayName}`
            await webhook.send({content: message, avatarURL: discord.user?.displayAvatarURL({extension: "png"}), username: discord.user!.username})
            webhook.destroy()
        }
    }
}
