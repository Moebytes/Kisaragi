 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import axios from "axios"
import {Message, EmbedBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Functions} from "../../structures/Functions"
import {Kisaragi} from "../../structures/Kisaragi"

export default class Instagram extends Command {
    private readonly headers = {"user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36"}
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Searches for posts and users on instagram.",
            help:
            `
            \`instagram query\` - Searches for tagged posts
            \`instagram user name\` - Searches for a user
            `,
            examples:
            `
            \`=>instagram anime\`
            \`=>instagram user name\`
            `,
            aliases: ["insta"],
            random: "none",
            cooldown: 10,
            defer: true,
            unlist: true,
            subcommandEnabled: false
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
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(queryOption)
            .addOption(query2Option)
    }

    public getUsername = async (id: string) => {
        const headers = {
            "authority": "commentpicker.com",
            "method": "GET",
            "path": `/actions/instagram-username-action.php?userid=${id}&token=6d7d1bb1474aacdfa69da0b39daefe8e78a0cb3aa283f501b627e932279305fb`,
            "scheme": "https",
            "accept": "*/*",
            "accept-language": "en-US,en;q=0.9",
            "cookie": "ezoadgid_186623=-1; ezoref_186623=; ezoab_186623=mod65; ezCMPCCS=true; PHPSESSID=3s67lmlj5gmgis0bos9ia3dq5b; ezepvv=0; lp_186623=https://commentpicker.com/; ezovid_186623=2124215431; ezovuuid_186623=44614aed-e28a-4e1b-5db2-f2ad604de7c3; ezds=ffid%3D1%2Cw%3D1536%2Ch%3D864; ezohw=w%3D722%2Ch%3D722; _ga=GA1.2.146244480.1588807356; _gid=GA1.2.1869096421.1588807356; __utma=131166109.146244480.1588807356.1588807356.1588807356.1; __utmc=131166109; __utmz=131166109.1588807356.1.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none); __utmt_e=1; __utmt_f=1; ezosuigeneris=c487f241405e1fbd809e4fff20c7326e; fontsLoaded=true; _fbp=fb.1.1588807358271.1083904862; ezouspvh=557; __gads=ID=4dad6b2a7543a6eb:T=1588807358:S=ALNI_MZI8nIoZONzMqqR6-mp9Da9Jy8_aA; cookieconsent_status=dismiss; active_template::186623=pub_site.1588807381; ezopvc_186623=3; ezovuuidtime_186623=1588807382; ezouspvv=456; ezouspva=5; ezux_lpl_186623=1588807404392|070a324c-8def-4d2d-423e-ae85638e8e46|false; ezux_ifep_186623=true; __qca=P0-1133709876-1588807409974; __utmb=131166109.12.8.1588807445103; ezux_et_186623=55; ezux_tos_186623=77",
            "referer": "https://commentpicker.com/instagram-username.php",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36"
        }
        const url = `https://commentpicker.com/actions/instagram-username-action.php?userid=${id}&token=6d7d1bb1474aacdfa69da0b39daefe8e78a0cb3aa283f501b627e932279305fb`
        const data = await axios.get(url, {headers}).then((r) => r.data)
        return {username: data.username, pfp: data.profile_pic_url}
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)

        if (args[1] === "user") {
            const name = args[2]
            if (!name) {
                return this.noQuery(embeds.createEmbed()
                .setAuthor({name: "instagram", iconURL: "https://kisaragi.moe/assets/embed/instagram.png", url: "https://www.instagram.com/"})
                .setTitle(`**Instagram Search** ${discord.getEmoji("gabBob")}`))
            }
            let html = ""
            try {
                html = await axios.get(`https://www.instagram.com/${name}`, {headers: this.headers}).then((r) => r.data)
            } catch {
                return this.invalidQuery(embeds.createEmbed()
                .setAuthor({name: "instagram", iconURL: "https://kisaragi.moe/assets/embed/instagram.png", url: "https://www.instagram.com/"})
                .setTitle(`**Instagram Search** ${discord.getEmoji("gabBob")}`))
            }
            const json = JSON.parse(html.match(/({"config":)((.|\n)*?)(?=;<\/script>)/g)?.[0]!)
            const user = json.entry_data.ProfilePage[0].graphql.user
            const followers = user.edge_followed_by.count
            const following = user.edge_follow.count
            const posts = user.edge_owner_to_timeline_media.edges
            const instagramArray: EmbedBuilder[] = []
            for (let i = 0; i < posts.length; i++) {
                const post = posts[i].node
                const url = `https://www.instagram.com/p/${post.shortcode}/`
                const caption = Functions.checkChar(post.edge_media_to_caption.edges[0].node.text.replace(/-\n/g, ""), 500, "")
                const comments = post.edge_media_to_comment.count
                const likes = post.edge_liked_by.count
                const image = post.display_url
                const instagramEmbed = embeds.createEmbed()
                instagramEmbed
                .setAuthor({name: "instagram", iconURL: "https://kisaragi.moe/assets/embed/instagram.png", url: "https://www.instagram.com/"})
                .setTitle(`**Instagram Search** ${discord.getEmoji("gabBob")}`)
                .setThumbnail(user.profile_pic_url_hd)
                .setImage(image)
                .setURL(url)
                .setDescription(
                    `${discord.getEmoji("star")}_Username:_ [**${user.username}**](https://www.instagram.com/${user.username})\n` +
                    `${discord.getEmoji("star")}_Followers:_ **${followers}**\n` +
                    `${discord.getEmoji("star")}_Following:_ **${following}**\n` +
                    `${discord.getEmoji("star")}_Link:_ **${user.external_url}**\n` +
                    `${discord.getEmoji("star")}_Bio:_ ${user.biography}\n` +
                    `${discord.getEmoji("star")}_Likes:_ **${likes}**\n` +
                    `${discord.getEmoji("star")}_Comments:_ **${comments}**\n` +
                    `${discord.getEmoji("star")}_Caption:_ ${caption}`
                )
                instagramArray.push(instagramEmbed)
            }
            if (instagramArray.length === 1) {
                return this.reply(instagramArray[0])
            } else {
                return embeds.createReactionEmbed(instagramArray, true, true)
            }
        }

        const text = Functions.combineArgs(args, 1).trim().replace(/ +/g, "")
        let html = ""
        try {
            html = await axios.get(`https://www.instagram.com/explore/tags/${text}/`, {headers: this.headers}).then((r) => r.data)
        } catch {
            return this.invalidQuery(embeds.createEmbed()
            .setAuthor({name: "instagram", iconURL: "https://kisaragi.moe/assets/embed/instagram.png", url: "https://www.instagram.com/"})
            .setTitle(`**Instagram Search** ${discord.getEmoji("gabBob")}`))
        }
        const json = JSON.parse(html.match(/({"config":)((.|\n)*?)(?=;<\/script>)/g)?.[0]!)
        const posts = json.entry_data.TagPage[0].graphql.hashtag.edge_hashtag_to_media.edges
        const max = posts.length > 20 ? 20 : posts.length
        const instagramArray: EmbedBuilder[] = []
        for (let i = 0; i < max; i++) {
            const post = posts[i].node
            const url = `https://www.instagram.com/p/${post.shortcode}/`
            const caption = Functions.checkChar(post.edge_media_to_caption.edges[0].node.text.replace(/-\n/g, ""), 1000, "")
            const comments = post.edge_media_to_comment.count
            const likes = post.edge_liked_by.count
            const {username, pfp} = await this.getUsername(post.owner.id)
            const image = post.display_url
            const instagramEmbed = embeds.createEmbed()
            instagramEmbed
            .setAuthor({name: "instagram", iconURL: "https://kisaragi.moe/assets/embed/instagram.png", url: "https://www.instagram.com/"})
            .setTitle(`**Instagram Search** ${discord.getEmoji("gabBob")}`)
            .setURL(url)
            .setThumbnail(pfp)
            .setImage(image)
            .setDescription(
                `${discord.getEmoji("star")}_Username:_ [**${username}**](https://www.instagram.com/${username})\n` +
                `${discord.getEmoji("star")}_Likes:_ **${likes}**\n` +
                `${discord.getEmoji("star")}_Comments:_ **${comments}**\n` +
                `${discord.getEmoji("star")}_Caption:_ ${caption}`
            )
            instagramArray.push(instagramEmbed)
        }
        if (instagramArray.length === 1) {
            return this.reply(instagramArray[0])
        } else {
            return embeds.createReactionEmbed(instagramArray, true, true)
        }
    }
}
