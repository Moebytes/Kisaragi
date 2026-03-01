 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message, AttachmentBuilder} from "discord.js"
import fs from "fs"
import path from "path"
import svgCaptcha from "svg-captcha"
import {Embeds} from "./Embeds"
import {Kisaragi} from "./Kisaragi"

export class Captcha {
    private readonly embeds: Embeds
    constructor(private readonly discord: Kisaragi, private readonly message: Message) {
        this.embeds = new Embeds(this.discord, this.message)
    }

    public createCaptcha = async (type: string, color: string, difficulty: string) => {

        const svg2img = require("svg2img")

        let tSize: number
        let mMax: number
        switch (difficulty) {
            case "easy":
                tSize = 4
                mMax = 10
                break
            case "medium":
                tSize = 6
                mMax = 100
                break
            case "hard":
                tSize = 8
                mMax = 1000
                break
            case "extreme":
                tSize = 12
                mMax = 1000
                break
            default:
                tSize = 4
                mMax = 10
        }

        const captcha = (type === "text") ?
        svgCaptcha.create({
                size: tSize,
                ignoreChars: "0oli",
                noise: 1,
                color: true,
                background: color
            }) :
            svgCaptcha.createMathExpr({
                mathMin: 1,
                mathMax: mMax,
                mathOperator: "+-",
                color: true,
                background: color
            })

        await svg2img(captcha.data, function(error: Error, buffer: Buffer) {
            fs.writeFileSync(path.join(__dirname, "../assets/misc/images/captcha.png"), buffer)
        })

        const attachment = new AttachmentBuilder(path.join(__dirname, "../assets/misc/images/captcha.png"), {name: "captcha.png"})

        const captchaEmbed = this.embeds.createEmbed()
        captchaEmbed
        .setTitle(`Captcha ${this.discord.getEmoji("kannaAngry")}`)
        .setImage(`attachment://captcha.png`)
        .setDescription(
            `${this.discord.getEmoji("star")}_Solve the captcha below. Type **cancel** to quit, or **skip** to get another captcha._`
        )
        return {
            captcha: captchaEmbed,
            text: captcha.text,
            files: [attachment]
        }
    }
}
