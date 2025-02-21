import {Message, AttachmentBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "../../structures/Embeds"
import {Functions} from "../../structures/Functions"
import {Kisaragi} from "../../structures/Kisaragi"
import {Permission} from "./../../structures/Permission"
import {students} from "blue-archive"
import path from "path"
import fs from "fs"

export default class BlueArchive extends Command {
    private readonly defaults =  [
        "Shiroko", "Alona", "Hina", "Hoshino", "Hifumi", "Koharu", "Serika", "Chise",
        "Hikari", "Nozomi", "Yuuka", "Serina", "Shizuko", "Miyu", "Mari", "Iroha", "Momoi",
        "Midori", "Plana", "Hanako", "Azusa", "Shun", "Fuuka", "Nagisa", "Seia", "Yuzu",
        "Toki", "Mika", "Aris", "Miyako"
    ]
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Searches for a blue archive character.",
            help:
            `
            \`bluearchive\` - Gets some picked characters.
            \`bluearchive character\` - Gets information on the character.
            `,
            examples:
            `
            \`=>bluearchive shiroko\`
            \`=>bluearchive hoshino\`
            `,
            aliases: ["ba"],
            random: "none",
            cooldown: 10,
            subcommandEnabled: true
        })
        const characterOption = new SlashCommandOption()
            .setType("string")
            .setName("character")
            .setDescription("Character to search for.")
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(characterOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const perms = new Permission(discord, message)
        if (discord.checkMuted(message)) if (!perms.checkNSFW()) return
        let query = Functions.combineArgs(args, 1).trim().replace(/ +/g, "-")
        if (!query) {
            query = this.defaults[Math.floor(Math.random()*this.defaults.length)].trim()
        }
        const studentCN = students.queryByName(query)?.[0]
        if (!studentCN) {
            return this.invalidQuery(embeds.createEmbed()
            .setAuthor({name: "bluearchive", iconURL: "https://kisaragi.moe/assets/embed/bluearchive.png"})
            .setTitle(`**Blue Archive Search** ${discord.getEmoji("midoriHug")}`))
        }
        const student = students.getById(studentCN.Id, "en")

        const iconPath = path.join(__dirname, `../../../node_modules/blue-archive/assets/icons/${student.PathName}.png`)
        const imagePath = path.join(__dirname, `../../../node_modules/blue-archive/assets/portraits/${student.DevName}.webp`)

        let attachments = [] as AttachmentBuilder[]
        if (fs.existsSync(iconPath)) {
            const iconAttachment = new AttachmentBuilder(fs.readFileSync(iconPath), {name: "thumbnail.png"})
            attachments.push(iconAttachment)
        }
        if (fs.existsSync(imagePath)) {
            const imageAttachment = new AttachmentBuilder(fs.readFileSync(imagePath), {name: "image.png"})
            attachments.push(imageAttachment)
        }
        
        const blueArchiveEmbed = embeds.createEmbed()
        blueArchiveEmbed
        .setAuthor({name: "bluearchive", iconURL: "https://kisaragi.moe/assets/embed/bluearchive.png"})
        .setTitle(`**Blue Archive Search** ${discord.getEmoji("midoriHug")}`)
        .setURL(`https://bluearchive.fandom.com/wiki/${student.FamilyName}_${student.Name}`)
        .setThumbnail("attachment://thumbnail.png")
        .setImage("attachment://image.png")
        .setDescription(
            `${discord.getEmoji("star")}_Character:_ **${student.FamilyName} ${student.Name}**\n` +
            `${discord.getEmoji("star")}_School:_ **${student.School}**\n` +
            `${discord.getEmoji("star")}_Club:_ **${student.Club}**\n` +
            `${discord.getEmoji("star")}_Star Grade:_ **${student.StarGrade}${discord.getEmoji("starYellow")}**\n` +
            `${discord.getEmoji("star")}_Age:_ **${student.CharacterAge}**\n` +
            `${discord.getEmoji("star")}_Height:_ **${student.CharHeightImperial}**\n` +
            `${discord.getEmoji("star")}_Birthday:_ **${student.Birthday}**\n` +
            `${discord.getEmoji("star")}_Hobby:_ ${student.Hobby}\n` +
            `${discord.getEmoji("star")}_Description:_ ${student.ProfileIntroduction}\n`
        )
        return this.reply(blueArchiveEmbed, attachments)
    }
}