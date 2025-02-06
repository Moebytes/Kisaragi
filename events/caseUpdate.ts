import {EmbedBuilder, TextChannel} from "discord.js"
import {Embeds} from "./../structures/Embeds"
import {Kisaragi} from "./../structures/Kisaragi"
import {SQLQuery} from "./../structures/SQLQuery"

export default class CaseUpdate {
    constructor(private readonly discord: Kisaragi) {}

    public insert = async (sql: SQLQuery, embed: EmbedBuilder, instance: any, cases: any) => {
        const discord = this.discord
        const user = await discord.users.fetch(instance.user)
        const executor = await discord.users.fetch(instance.executor)
        const modLogID =  await sql.fetchColumn("guilds", "mod log")
        const modLog = discord.channels.cache.get(modLogID ?? "") as TextChannel
        const caseNumber = cases.length + 1
        let channelName = null as unknown as string
        let context = ""
        if (instance.context) {
            const {channelID} = discord.parseMessageURL(instance.context)
            channelName = "#" + (discord.channels.cache.get(channelID) as TextChannel)?.name ?? ""
            context = `[**Context**](${instance.context})`
        }
        embed
        .setThumbnail(user.displayAvatarURL({extension: "png"}))
        .setDescription(
            `${discord.getEmoji("star")}_User:_ **${user.tag}** \`(${user.id})\`\n` +
            `${discord.getEmoji("star")}_Moderator:_ **${executor.tag}** \`(${executor.id})\`\n` +
            `${discord.getEmoji("star")}_Reason:_ ${instance.reason}\n` +
            context
        )
        .setFooter({text: channelName, iconURL: executor.displayAvatarURL({extension: "png"})})
        .setTimestamp(Date.now())
        const msg = await this.discord.channelSend(modLog, embed).then((m) => m.id).catch(() => null)
        const data = {...instance, case: caseNumber, message: msg}
        cases.push(data)
        await sql.updateColumn("guilds", "cases", cases)
        return
    }

    public run = async (instance: any) => {
        const discord = this.discord
        const guild = discord.guilds.cache.find((g) => g.id === instance.guild)
        if (!guild) return
        const message = await discord.fetchFirstMessage(guild)
        if (!message) return
        const sql = new SQLQuery(message)
        const embeds = new Embeds(discord, message)
        let cases = await sql.fetchColumn("guilds", "cases")
        if (!cases) cases = []
        cases = cases.map((c: any) => JSON.parse(c))
        const caseNumber = cases.length + 1
        if (instance.type === "ban" || instance.type === "unban" || instance.type === "kick" || instance.type === "softban" || instance.type === "tempban") {
            const duplicate = cases.find((c: any) => c.user === instance.user && c.reason === instance.reason && instance.executor === discord.user!.id)
            if (duplicate) return
        }
        switch (instance.type) {
            case "warn":
                const warnEmbed = embeds.createEmbed()
                warnEmbed
                .setAuthor({name: "warn", iconURL: "https://www.emoji.co.uk/files/phantom-open-emojis/symbols-phantom/13025-warning-sign.png"})
                .setTitle(`**Warn | Case #${caseNumber}** ${discord.getEmoji("raphi")}`)
                .setColor("#ffab3d")
                await this.insert(sql, warnEmbed, instance, cases)
                break
            case "ban":
                const banEmbed = embeds.createEmbed()
                banEmbed
                .setAuthor({name: "ban", iconURL: "https://discordemoji.com/assets/emoji/bancat.png"})
                .setTitle(`**Ban | Case #${caseNumber}** ${discord.getEmoji("kannaFU")}`)
                .setColor("#ff2457")
                await this.insert(sql, banEmbed, instance, cases)
                break
            case "unban":
                const unbanEmbed = embeds.createEmbed()
                unbanEmbed
                .setAuthor({name: "unban", iconURL: "https://discordemoji.com/assets/emoji/bancat.png"})
                .setTitle(`**Unban | Case #${caseNumber}** ${discord.getEmoji("ceaseBullying")}`)
                .setColor("#3daeff")
                await this.insert(sql, unbanEmbed, instance, cases)
                break
            case "kick":
                const kickEmbed = embeds.createEmbed()
                kickEmbed
                .setAuthor({name: "kick", iconURL: "https://discordemoji.com/assets/emoji/4331_UmaruWave.png"})
                .setTitle(`**Kick | Case #${caseNumber}** ${discord.getEmoji("kannaFU")}`)
                .setColor("#ff3dfc")
                await this.insert(sql, kickEmbed, instance, cases)
                break
            case "mute":
                const muteEmbed = embeds.createEmbed()
                muteEmbed
                .setAuthor({name: "mute", iconURL: "https://images.emojiterra.com/mozilla/512px/1f507.png"})
                .setTitle(`**Mute | Case #${caseNumber}** ${discord.getEmoji("sagiriBleh")}`)
                .setColor("#ff3df5")
                await this.insert(sql, muteEmbed, instance, cases)
                break
            case "unmute":
                const unmuteEmbed = embeds.createEmbed()
                unmuteEmbed
                .setAuthor({name: "unmute", iconURL: "https://images.emojiterra.com/mozilla/512px/1f507.png"})
                .setTitle(`**Unmute | Case #${caseNumber}** ${discord.getEmoji("mexShrug")}`)
                .setColor("#3de2ff")
                await this.insert(sql, unmuteEmbed, instance, cases)
                break
            case "restrict":
                const restrictEmbed = embeds.createEmbed()
                restrictEmbed
                .setAuthor({name: "restrict", iconURL: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/mozilla/36/no-entry-sign_1f6ab.png"})
                .setTitle(`**Restrict | Case #${caseNumber}** ${discord.getEmoji("no")}`)
                .setColor("#ff873d")
                await this.insert(sql, restrictEmbed, instance, cases)
                break
            case "unrestrict":
                const unrestrictEmbed = embeds.createEmbed()
                unrestrictEmbed
                .setAuthor({name: "unrestrict", iconURL: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/mozilla/36/no-entry-sign_1f6ab.png"})
                .setTitle(`**Unrestrict | Case #${caseNumber}** ${discord.getEmoji("yes")}`)
                .setColor("#5e3dff")
                await this.insert(sql, unrestrictEmbed, instance, cases)
                break
            case "deafen":
                const deafenEmbed = embeds.createEmbed()
                deafenEmbed
                .setAuthor({name: "deafen", iconURL: "https://cdn4.iconfinder.com/data/icons/music-audio-4/24/mute_sound_speaker_headphone_headset_music-512.png"})
                .setTitle(`**Deafen | Case #${caseNumber}** ${discord.getEmoji("sataniaDead")}`)
                .setColor("#be3dff")
                await this.insert(sql, deafenEmbed, instance, cases)
                break
            case "undeafen":
                const undeafenEmbed = embeds.createEmbed()
                undeafenEmbed
                .setAuthor({name: "undeafen", iconURL: "https://d29fhpw069ctt2.cloudfront.net/icon/image/39276/preview.png"})
                .setTitle(`**Undeafen | Case #${caseNumber}** ${discord.getEmoji("mexShrug")}`)
                .setColor("#3dabff")
                await this.insert(sql, undeafenEmbed, instance, cases)
                break
            case "vcmute":
                const vcmuteEmbed = embeds.createEmbed()
                vcmuteEmbed
                .setAuthor({name: "voice mute", iconURL: "https://www.kindpng.com/picc/m/499-4998592_mute-microphone-comments-mute-mic-icon-png-transparent.png"})
                .setTitle(`**Voice Mute | Case #${caseNumber}** ${discord.getEmoji("vigneDead")}`)
                .setColor("#ff3db8")
                await this.insert(sql, vcmuteEmbed, instance, cases)
                break
            case "vcunmute":
                const vcunmuteEmbed = embeds.createEmbed()
                vcunmuteEmbed
                .setAuthor({name: "voice unmute", iconURL: "https://images.assetsdelivery.com/compings_v2/vectorgalaxy/vectorgalaxy1808/vectorgalaxy180807510.jpg"})
                .setTitle(`**Voice Unmute | Case #${caseNumber}** ${discord.getEmoji("aquaUp")}`)
                .setColor("#3ddfff")
                await this.insert(sql, vcunmuteEmbed, instance, cases)
                break
            case "vckick":
                const vckickEmbed = embeds.createEmbed()
                vckickEmbed
                .setAuthor({name: "voice kick", iconURL: "https://cdn1.iconfinder.com/data/icons/interface-filled-blue/32/Microphone_recorder_sound_voice-512.png"})
                .setTitle(`**Voice Kick | Case #${caseNumber}** ${discord.getEmoji("tohruSmug")}`)
                .setColor("#47ff3d")
                await this.insert(sql, vckickEmbed, instance, cases)
                break
            case "tempban":
                const tempbanEmbed = embeds.createEmbed()
                tempbanEmbed
                .setAuthor({name: "tempban", iconURL: "https://cdn.discordapp.com/emojis/579870079735562261.png"})
                .setTitle(`**Temp Ban | Case #${caseNumber}** ${discord.getEmoji("kannaFU")}`)
                .setColor("#ff3d64")
                await this.insert(sql, tempbanEmbed, instance, cases)
                break
            case "tempmute":
                const tempmuteEmbed = embeds.createEmbed()
                tempmuteEmbed
                .setAuthor({name: "tempmute", iconURL: "https://images.emojiterra.com/mozilla/512px/1f507.png"})
                .setTitle(`**Temp Mute | Case #${caseNumber}** ${discord.getEmoji("sagiriBleh")}`)
                .setColor("#a13dff")
                await this.insert(sql, tempmuteEmbed, instance, cases)
                break
            case "softban":
                const softbanEmbed = embeds.createEmbed()
                softbanEmbed
                .setAuthor({name: "softban", iconURL: "https://cdn.discordapp.com/emojis/593867503055274006.png"})
                .setTitle(`**Soft Ban | Case #${caseNumber}** ${discord.getEmoji("sagiriBleh")}`)
                .setColor("#ff24ba")
                await this.insert(sql, softbanEmbed, instance, cases)
                break
            default:
        }

    }

}
