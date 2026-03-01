/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import Flickr from "flickr-sdk"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Functions} from "../../structures/Functions"
import {Kisaragi} from "../../structures/Kisaragi"

export default class FlickrCommand extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Searches for images on flickr.",
            help:
            `
            \`flickr query?\` - Searches for images.
            \`flickr user query\` - Searches for the profile of a user.
            `,
            examples:
            `
            \`=>flickr anime\`
            `,
            aliases: [],
            random: "none",
            cooldown: 10,
            defer: true,
            subcommandEnabled: true
        })
        const query2Option = new SlashCommandOption()
            .setType("string")
            .setName("query2")
            .setDescription("Query in the user subcommand.")

        const queryOption = new SlashCommandOption()
            .setType("string")
            .setName("query")
            .setDescription("Can be a query/user.")

        this.subcommand = new SlashCommandSubcommand()
            .setName("flickr")
            .setDescription(this.options.description)
            .addOption(queryOption)
            .addOption(query2Option)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const flickr = new Flickr(process.env.FLICKR_API_KEY!)

        if (args[1] === "user") {
            const username = Functions.combineArgs(args, 2)?.trim()
            if (!username) {
                return this.noQuery(embeds.createEmbed()
                .setAuthor({name: "flickr", iconURL: "https://kisaragi.moe/assets/embed/flickr.png", url: "https://www.flickr.com/"})
                .setTitle(`**Flickr Search** ${discord.getEmoji("raphiSmile")}`))
            }
            const id = await flickr.people.findByUsername({username}).then((r: any) => JSON.parse(r.text))
            const info = await flickr.people.getInfo({user_id: id.user.nsid}).then((r: any) => JSON.parse(r.text))
            const profile = await flickr.profile.getProfile({user_id: id.user.nsid}).then((r: any) => JSON.parse(r.text)).then((p) => p.profile)
            const avatar = `https://farm${info.person.iconfarm}.staticflickr.com/${info.person.iconserver}/buddyicons/${info.person.nsid}_r.jpg`
            const flickrEmbed = embeds.createEmbed()
            flickrEmbed
            .setAuthor({name: "flickr", iconURL: "https://kisaragi.moe/assets/embed/flickr.png", url: "https://www.flickr.com/"})
            .setTitle(`**Flickr Search** ${discord.getEmoji("raphiSmile")}`)
            .setURL(info.person.profileurl._content)
            .setThumbnail(avatar)
            .setDescription(
                `${discord.getEmoji("star")}_Username:_ **${id.user.username._content}**\n` +
                `${discord.getEmoji("star")}_Joined:_ **${Functions.formatDate(new Date(1000*Number(profile.join_date)))}**\n` +
                `${discord.getEmoji("star")}_Occupation:_ ${profile.occupation ? profile.occupation : "None"}\n` +
                `${discord.getEmoji("star")}_Description:_ ${profile.profile_description ? profile.profile_description : "None"}\n`
            )
            return this.reply(flickrEmbed)
        }
        let text = Functions.combineArgs(args, 1)?.trim()
        if (!text) text = "anime"
        const json = await flickr.photos.search({text, per_page: 30, sort: "relevance"}).then((r: any) => JSON.parse(r.text))
        const photos = json.photos.photo
        let flickrArray: any[] = []
        for (let i = 0; i < photos.length; i++) {
            const photo = photos[i]
            const info = await flickr.photos.getInfo({photo_id: photo.id}).then((r: any) => JSON.parse(r.text)).then((i: any) => i.photo)
            const comments = await flickr.photos.comments.getList({photo_id: photo.id}).then((r: any) => JSON.parse(r.text))
            const avatar = `https://farm${info.owner.iconfarm}.staticflickr.com/${info.owner.iconserver}/buddyicons/${info.owner.nsid}_r.jpg`
            let commentDesc = `${discord.getEmoji("star")}_Comments:_ None`
            if (comments.comments?.comment) {
                const comment = comments.comments.comment
                commentDesc = `${discord.getEmoji("star")}_Comments:_\n`
                for (let i = 0; i < comment.length; i++) {
                    commentDesc += `**${comment[i].authorname}** - ${Functions.cleanHTML(comment[i]._content)}\n`
                }
            }
            const desc = info.description._content ? Functions.cleanHTML(info.description._content?.replace(/\n{2,}/g, "\n")) : "None"
            const image = `https://live.staticflickr.com/${photo.server}/${photo.id}_${photo.secret}_c.jpg`
            const url = `https://www.flickr.com/photos/${info.owner.nsid}/${photo.id}/`
            const flickrEmbed = embeds.createEmbed()
            flickrEmbed
            .setAuthor({name: "flickr", iconURL: "https://kisaragi.moe/assets/embed/flickr.png", url: "https://www.flickr.com/"})
            .setTitle(`**Flickr Search** ${discord.getEmoji("raphiSmile")}`)
            .setURL(url)
            .setDescription(
                `${discord.getEmoji("star")}_Title:_ **${photo.title}**\n` +
                `${discord.getEmoji("star")}_Poster:_ **${info.owner.username}**\n` +
                `${discord.getEmoji("star")}_Posted:_ **${Functions.formatDate(new Date(1000*Number(info.dateuploaded)))}**\n` +
                `${discord.getEmoji("star")}_Views:_ **${info.views}**\n` +
                `${discord.getEmoji("star")}_Description:_ ${Functions.checkChar(desc, 1000, " ")}\n` +
                Functions.checkChar(commentDesc, 300, " ")
                )
            .setImage(image)
            .setThumbnail(avatar)
            const obj = {} as any
            obj.views = info.views
            obj.embed = flickrEmbed
            flickrArray.push(obj)
        }
        flickrArray = Functions.sortObjectArray(flickrArray, "views", "desc")
        flickrArray = flickrArray.map((f) => f.embed)
        if (flickrArray.length === 1) {
            return this.reply(flickrArray[0])
        } else {
            return embeds.createReactionEmbed(flickrArray, true, true)
        }
    }
}
