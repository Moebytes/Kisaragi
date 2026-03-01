 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {WebhookClient} from "discord.js"
import {Request, Response, NextFunction} from "express"
import {yt} from "../server"
import {Kisaragi} from "../structures/Kisaragi"
import {SQLQuery} from "../structures/SQLQuery"

export class YoutubeOnline {
    public static youtubeRoutes = (app: any) => {
        app.post("/youtube", async (req: Request, res: Response, next: NextFunction) => {
            if (!req.body.channel) return res.status(400)
            const first = [{channel: req.body.channel || null, name: req.body.name || null, text: req.body.text || null, guild: req.body.guild || null, mention: req.body.mention || "", state: req.body.state || "Off", id: req.body.id || null, token: req.body.token || null}]
            const exists = await SQLQuery.fetchColumn("yt", "channel id", "channel id", req.body.channel)
            if (!exists) {
                await SQLQuery.insertInto("yt", "channel id", req.body.channel)
                await SQLQuery.updateColumn("yt", "config", first, "channel id", req.body.channel)
            } else {
                let config = await SQLQuery.fetchColumn("yt", "config", "channel id", req.body.channel)
                let found = false
                if (!config?.[0]) config = []
                for (let i = 0; i < config.length; i++) {
                    if (!config[i]) break
                    const current = JSON.parse(config[i])
                    if (current.text === req.body.text) {
                        found = true
                        if (req.body.channel) current.channel = req.body.channel
                        if (req.body.name) current.name = req.body.name
                        if (req.body.mention || req.body.mention === "") current.mention = req.body.mention
                        if (req.body.state) current.state = req.body.state
                        if (req.body.id) current.id = req.body.id
                        if (req.body.token) current.token = req.body.token
                        if (req.body.guild) current.guild = req.body.guild
                        config[i] = JSON.stringify(current)
                        await SQLQuery.updateColumn("yt", "config", config, "channel id", req.body.channel)
                    }
                }
                if (!found) {
                    config.push(JSON.stringify({channel: req.body.channel || null, name: req.body.name || null, text: req.body.text || null, guild: req.body.guild || null, mention: req.body.mention || "", state: req.body.state || "Off", id: req.body.id || null, token: req.body.token || null}))
                    await SQLQuery.updateColumn("yt", "config", config, "channel id", req.body.channel)
                }
            }
            yt.subscribe(req.body.channel)
            res.status(200).end()
            if (!exists || req.body.refresh) {
                new Promise<void>((resolve) => {
                    const reSub = async () => {
                        const config = await SQLQuery.fetchColumn("yt", "config", "channel id", req.body.channel)
                        if (!config) {
                            resolve()
                        }
                        yt.subscribe(req.body.channel)
                        setTimeout(reSub, 432000)
                    }
                    setTimeout(reSub, 432000)
                })
            }
        })

        app.delete("/youtube", async (req: Request, res: Response, next: NextFunction) => {
            if (!req.body.channels || !req.body.guild) return res.status(400)
            for (let i = 0; i < req.body.channels.length; i++) {
                const channel = req.body.channels[i]
                let config = await SQLQuery.fetchColumn("yt", "config", "channel id", channel)
                if (!config?.[0]) continue
                for (let i = 0; i < config.length; i++) {
                    const current = JSON.parse(config[i])
                    if (current.guild === req.body.guild) {
                        config[i] = ""
                        config = config.filter(Boolean)
                        if (!config?.[0]) {
                            yt.unsubscribe(channel)
                            await SQLQuery.updateColumn("yt", "config", null, "channel id", channel)
                        } else {
                            await SQLQuery.updateColumn("yt", "config", config, "channel id", channel)
                        }
                    }
                }
            }
            res.status(200).end()
        })

        yt.on("notified", async (data: any) => {
            const config = await SQLQuery.fetchColumn("yt", "config", "channel id", data.channel.id)
            if (!config?.[0]) return
            for (let i = 0; i < config.length; i++) {
                const current = JSON.parse(config[i])
                if (!current.id || !current.token) continue
                if (!current.state || current.state === "Off") continue
                const webhook = new WebhookClient({id: current.id, token: current.token}, {
                    allowedMentions: {parse: ["users", "roles"]}, 
                    rest: {offset: 0}
                })
                if (!current.mention) current.mention = ""
                const message = `${current.mention}[**${data.channel.name}**](${data.channel.link}) uploaded a new video, [**${data.video.title}**](${data.video.link})! ${data.video.link}`
                await webhook.send({content: message, avatarURL: Kisaragi.pfp, username: Kisaragi.username})
                webhook.destroy()
            }
        })
    }
}
