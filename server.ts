 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import "dotenv/config"
import bodyParser from "body-parser"
import express from "express"
import path from "path"
import ytNotification from "youtube-notification"
import config from "./config.json"
import {YoutubeOnline} from "./routes/YoutubeOnline"
import {Logger} from "./structures/Logger"
import {SQLQuery} from "./structures/SQLQuery"

let yt: any
if (!yt) {
    yt = new ytNotification({
        hubCallback: `${config.kisaragiAPI}/yt`,
        middleware: true
    })
}
export default class Server {
    public checkState = async (state: string) => {
        const states = await SQLQuery.redisGet("state")
        if (states.includes(state)) {
            return true
        } else {
            return false
        }
    }

    public run = () => {
        const app = express()
        const port = process.env.PORT || 4000

        app.use(bodyParser.json())
        app.use(bodyParser.urlencoded({extended: true}))
        app.use("/yt", yt.listener())
        YoutubeOnline.youtubeRoutes(app)

        app.get("/reddit", async (req, res) => {
            res.setHeader("Content-Type", "text/html;charset=utf-8")
            if (req.query.code) {
                try {
                    if (!await this.checkState(req.query.state as string)) return res.status(400).sendFile(path.join(__dirname, "../assets/html/expired.html"))
                    await SQLQuery.redditOuath(req.query.code as string)
                    res.status(200).sendFile(path.join(__dirname, "../assets/html/authorized.html"))
                } catch {
                    res.status(400).sendFile(path.join(__dirname, "../assets/html/rejected.html"))
                }

            } else {
                res.status(200).sendFile(path.join(__dirname, "../assets/html/index.html"))
            }
        })

        app.get("/twitter", async (req, res) => {
            res.setHeader("Content-Type", "text/html;charset=utf-8")
            if (req.query.oauth_token) {
                try {
                    await SQLQuery.twitterOauth(req.query.oauth_token as string, req.query.oauth_verifier as string)
                    res.status(200).sendFile(path.join(__dirname, "../assets/html/authorized.html"))
                } catch {
                    res.status(400).sendFile(path.join(__dirname, "../assets/html/rejected.html"))
                }
            } else {
                res.status(200).sendFile(path.join(__dirname, "../assets/html/index.html"))
            }
        })

        app.get("/discord", async (req, res) => {
            res.setHeader("Content-Type", "text/html;charset=utf-8")
            if (req.query.code) {
                if (!await this.checkState(req.query.state as string)) return res.status(400).sendFile(path.join(__dirname, "../assets/html/expired.html"))
                await SQLQuery.initOauth2(req.query.code as string)
                res.status(200).sendFile(path.join(__dirname, "../assets/html/authorized.html"))
            } else {
                res.status(200).sendFile(path.join(__dirname, "../assets/html/index.html"))
            }
        })

        app.get("/commands", async (req, res) => {
            res.status(200)
            if (req.query.category) {
                const commands = await SQLQuery.allCommands(req.query.category as string)
                res.json(commands)
            } else {
                const commands = await SQLQuery.allCommands()
                res.json(commands)
            }
        })

        app.get("/", (req, res) => {
            res.setHeader("Content-Type", "text/html;charset=utf-8")
            res.status(200).sendFile(path.join(__dirname, "../assets/html/index.html"))
        })

        app.get("*", (req, res) => {
            res.setHeader("Content-Type", "text/html;charset=utf-8")
            res.status(404).sendFile(path.join(__dirname, "../assets/html/404.html"))
        })

        app.listen(port)
        Logger.log(`Started the web server!`)
    }
}

export {yt}

/*When runnning server only build*/
const server = new Server()
server.run()
