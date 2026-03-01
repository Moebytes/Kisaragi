 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message, EmbedBuilder, AttachmentBuilder} from "discord.js"
import {Embeds} from "./Embeds"
import {Kisaragi} from "./Kisaragi"
import {Functions} from "./Functions"
import {Permission} from "./Permission"
import {SQLQuery} from "./SQLQuery"

export class Block {
    constructor(private readonly discord: Kisaragi, private readonly message: Message) {}

    public blockWord = async () => {
        const message = this.message
        const sql = new SQLQuery(message)
        if (message.author!.bot) return
        let words = await sql.fetchColumn("guilds", "blocked words")
        if (words === null || !words?.[0]) return
        words = words as unknown as string[]
        const asterisk = await sql.fetchColumn("guilds", "asterisk").then((a: string[]) => String(a) === "on" ? true : false)
        words.forEach((w: string) => w.replace(/0/gi, "o").replace(/1/gi, "l").replace(/!/gi, "l"))
        const match = await sql.fetchColumn("guilds", "block match")
        if (String(match) === "exact") {
            if (words.some((w: string) => w.includes(message.content) || (asterisk ? message.content.match(/\*/g) : false))) {
                if (!message.guild?.members.me?.permissions.has("ManageMessages")) return this.discord.send(this.message, "I need the **Manage Messages** permission in order to delete the message with the blocked word.")
                const reply = await this.discord.reply(this.message, "Your post was removed because it contained a blocked word.")
                await message.delete()
                Functions.deferDelete(reply, 10000)
            }
        } else {
            for (let i = 0; i < words.length; i++) {
                if (message.content.includes(words[i]) || (asterisk ? message.content.match(/\*/g) : false)) {
                    if (!message.guild?.members.me?.permissions.has("ManageMessages")) return this.discord.send(this.message, "I need the **Manage Messages** permission in order to delete the message with the blocked word.")
                    const reply = await this.discord.reply(this.message, "Your post was removed because it contained a blocked word.")
                    await message.delete()
                    Functions.deferDelete(reply, 10000)
                }
            }
        }
    }

    public blockInvite = async () => {
        const message = this.message
        const sql = new SQLQuery(message)
        const toggle = await sql.fetchColumn("guilds", "invite")
        if (!toggle || toggle === "off") return
        const regex = /(?<=(discord.gg|discord(app)?.com\/invite)\/)[a-z0-9]+/gi
        const match = message.content.match(regex)
        if (match?.[0]) {
            const promo = await sql.fetchColumn("guilds", "self promo")
            if (promo) {
                const channel = this.message.guild?.channels.cache.get(promo)
                if (this.message.channel.id === channel?.id) return
            }
            let del = true
            try {
                const invites = await message.guild?.invites.fetch()
                if (invites?.has(match[0].trim())) del = false
            } catch {
                // Do nothing
            }
            if (del) {
                const reply = await this.discord.reply(this.message, "Your post was removed because it contained an invite to another server.")
                await message.delete()
                Functions.deferDelete(reply, 10000)
            }
        }
    }

    public containsInvite = () => {
        return /(?<=(discord.gg|discord(app)?.com\/invite)\/)[a-z0-9]+/gi.test(this.message.content)
    }

    public everyone = async () => {
        const msg = this.message
        const embeds = new Embeds(this.discord, msg)
        const sql = new SQLQuery(msg)
        const perms = new Permission(this.discord, msg)
        if (msg.content.includes("@everyone") || msg.content.includes("@here")) {
          if (msg.member?.permissions.has("MentionEveryone") || await perms.checkMod(true)) return
          const toggle = await sql.fetchColumn("guilds", "everyone ban toggle")
          if (toggle === "on") {
            try {
              await msg.member?.ban({reason: "Mentioning everyone", deleteMessageSeconds: 7 * 24 * 60 * 60})
              const banEmbed = embeds.createEmbed()
              .setAuthor({name: "ban", iconURL: "https://discordemoji.com/assets/emoji/bancat.png"})
              .setTitle(`**Member Banned** ${this.discord.getEmoji("kannaFU")}`)
              .setDescription(`${this.discord.getEmoji("star")}_Successfully banned <@${msg.author.id}> for reason:_ **Mentioning everyone without having the permission to do so.**`)
              this.discord.send(msg, banEmbed)
              const dmEmbed = embeds.createEmbed()
              dmEmbed
              .setAuthor({name: "ban", iconURL: "https://discordemoji.com/assets/emoji/bancat.png"})
              .setTitle(`**You Were Banned** ${this.discord.getEmoji("kannaFU")}`)
              .setDescription(`${this.discord.getEmoji("star")}_You were banned from ${msg.guild!.name} for reason:_ **Mentioning everyone without having the permission to do so.**`)
              const dm = await msg.author.createDM()
              await this.discord.dmSend(msg.author, dmEmbed).catch(() => null)
            } catch {
              // Do nothing
            }
          }
        }
    }

    public gallery = async () => {
        const message = this.message
        const sql = new SQLQuery(message)
        if (message.attachments.size) return
        const gallery = await sql.fetchColumn("guilds", "gallery")
        if (!gallery) return
        if (gallery.includes(message.channel.id)) {
            try {
                const reply = await this.discord.reply(message, `This is a gallery channel, you can only post images here!`)
                await message.delete()
                Functions.deferDelete(reply, 3000)
            } catch {
                return this.discord.send(this.message, `I need the **Manage Messages** permission to delete text messages in gallery channels ${this.discord.getEmoji("kannaFacepalm")}`)
            }
        }
    }
}
