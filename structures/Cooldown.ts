 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Collection, Message} from "discord.js"
import {Embeds} from "./Embeds"
import {Kisaragi} from "./Kisaragi"

export class Cooldown {
    private readonly embeds: Embeds
    constructor(private readonly discord: Kisaragi, private readonly message: Message) {
        this.embeds = new Embeds(this.discord, this.message)
    }

    /** Cooldown for guilds and dms. */
    public cmdCooldown = (cmd: string, cooldown: number, overwriteCooldowns?: Collection<string, Collection<string, number>>) => {
        let cooldowns = overwriteCooldowns ? overwriteCooldowns : this.discord.cooldowns
        if (!cooldowns.has(cmd)) {
            cooldowns.set(cmd, new Collection())
        }
        const id = this.message.guild ? this.message.guild.id : this.message.author.id
        if (!cooldowns.has(id)) {
            cooldowns.set(id, new Collection())
        }
        const now = Date.now()
        const timestamps = cooldowns.get(cmd)
        const globalTimestamps = cooldowns.get(id)
        if (!timestamps || !globalTimestamps) return
        const cooldownAmount = (Number(cooldown) || 3) * 1000
        if (timestamps.has(id)) {
            const expirationTime = timestamps.get(id)! + cooldownAmount
            if (now < expirationTime) {
                const cooldownEmbed = this.embeds.createEmbed()
                const timeLeft = (expirationTime - now) / 1000
                cooldownEmbed
                .setTitle(`**Command Rate Limit!** ${this.discord.getEmoji("kannaHungry")}`)
                .setDescription(`${this.discord.getEmoji("star")}You hit the rate limit for **${cmd}**! Wait **${timeLeft.toFixed(2)}** seconds before trying again.`)
                return cooldownEmbed
            }
        }
        if (globalTimestamps.has(id)) {
            const expirationTime = globalTimestamps.get(id)! + 3000
            if (now < expirationTime) {
                const cooldownEmbed = this.embeds.createEmbed()
                const timeLeft = (expirationTime - now) / 1000
                cooldownEmbed
                .setTitle(`**Global Rate Limit!** ${this.discord.getEmoji("kannaHungry")}`)
                .setDescription(`${this.discord.getEmoji("star")}You hit the global rate limit! Wait **${timeLeft.toFixed(2)}** seconds before trying again.`)
                return cooldownEmbed
            }
        }
        timestamps.set(id, now)
        globalTimestamps.set(id, now)
        setTimeout(() => {timestamps.delete(id)}, cooldownAmount)
        setTimeout(() => {globalTimestamps.delete(id)}, 3000)
        return null
    }
}
