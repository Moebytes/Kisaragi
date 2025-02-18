import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import fs from "fs"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {SQLQuery} from "./../../structures/SQLQuery"

export default class Privacy extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
          description: "Privacy policy of the bot.",
          help:
          `
          \`privacy\` - Privacy policy
          `,
          examples:
          `
          \`=>privacy\`
          `,
          aliases: ["privacypolicy"],
          random: "none",
          cooldown: 5,
          subcommandEnabled: true
        })
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)

        const privacyPolicy = embeds.createEmbed()
        privacyPolicy
        .setAuthor({name: "privacy policy", iconURL: "https://kisaragi.moe/assets/embed/privacy.png"})
        .setURL("https://kisaragi.moe/privacy")
        .setTitle(`**Privacy Policy** ${discord.getEmoji("kannaPat")}`)
        .setDescription(Functions.multiTrim(`
            By adding Kisaragi to a server you are automatically in agreement with this privacy policy. You should remove the bot from your server if you don't.
            **Public Information**
            ${discord.getEmoji("star")}_Messages:_ Several commands read your message content/attachments, and deleted messages may be logged if message logging is enabled. The bot uses this information for command functionality and does not store any messages.
            ${discord.getEmoji("star")}_Guilds:_ Kisaragi can access general information about your guild, including channels, members, roles, and emojis. She uses this information as required for command functionality.
            **Private Information (Oauth2 Only)**
            ${discord.getEmoji("star")}_Email Address:_ Your discord email address is used to send you email from the \`email\` command. This is to verify that the address belongs to you.
            ${discord.getEmoji("star")}_Connections:_ Access to your connections is used to verify that a social media account belongs to you (such as twitter).
            ${discord.getEmoji("star")}_Account Access:_ If you authenticate with a social media account, it gives the bot public read and write access over your account. The bot only does actions on your behalf.
            **Delete Information**
            ${discord.getEmoji("star")}_Data Deletion:_ All oauth commands have an option to revoke your token. To revoke your twitter token you need to manually click on "revoke access" in your application settings. To delete all guild data, just remove the bot from your server.
            ${discord.getEmoji("star")}_Account Deletion:_ If you delete your discord account all user-specific settings and oauth2 data on your account is deleted.
        `))
        return this.reply(privacyPolicy)
    }
}
