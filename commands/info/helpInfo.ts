import {Message, AttachmentBuilder, ChatInputCommandInteraction} from "discord.js"
import fs from "fs"
import path from "path"
import {Command} from "../../structures/Command"
import {Kisaragi} from "../../structures/Kisaragi"
import {CommandFunctions} from "./../../structures/CommandFunctions"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import axios from "axios"

export default class HelpInfo extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Detailed help info.",
            aliases: [],
            cooldown: 3,
            unlist: true
        })
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const cmdFunctions = new CommandFunctions(discord, message)
        const embeds = new Embeds(discord, message)
        const command = discord.commands.get(args[1])
        if (!command) return cmdFunctions.noCommand(args[1])
        const category = command.category
        const name = command.name
        const aliases = command.options.aliases.join("") ? `**${command.options.aliases.join(", ")}**` : "_None_"
        const gifImages = ["giphy", "tenor"]
        let ext = "png"
        if (gifImages.includes(name)) ext = "gif"
        let image = `https://kisaragi.moe/assets/help/${category}/${name}.${ext}`
        if (name === "distortion") image = `https://kisaragi.moe/assets/help/${category}/dis+ortion.png`
        const starEmoji = "star" //command.options.premium ? "premiumstar" : "star"
        const helpInfoEmbed = embeds.createEmbed()
        .setTitle(`**Command Help** ${discord.getEmoji("gabYes")}`)
        .setAuthor({name: "help", iconURL: "https://kisaragi.moe/assets/embed/help.png"})
        .setImage(image)
        .setThumbnail(message.author!.displayAvatarURL({extension: "png"}))
        .setDescription(Functions.multiTrim(`
            ${discord.getEmoji(starEmoji)}_Name:_ **${name}**
            ${discord.getEmoji(starEmoji)}_Category:_ **${category}**
            ${discord.getEmoji(starEmoji)}_Description:_ ${command.options.description}
            ${discord.getEmoji(starEmoji)}_Aliases:_ ${aliases}
            ${discord.getEmoji(starEmoji)}_Cooldown:_ **${command.options.cooldown}**
            ${discord.getEmoji(starEmoji)}_Help:_ \n${Functions.multiTrim(command.options.help)}
            ${discord.getEmoji(starEmoji)}_Examples:_ \n${Functions.multiTrim(command.options.examples)}
        `))
        await this.reply(helpInfoEmbed)
    }
}
