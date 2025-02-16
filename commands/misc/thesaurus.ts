import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Permission} from "../../structures/Permission"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"
import {CollegiateThesaurus} from "mw-dict"

export default class Thesaurus extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Gets synonyms for a word from merriam webster.",
            help:
            `
            \`thesaurus word\` - Gets synonyms and antonyms for the word
            `,
            examples:
            `
            \`=>thesaurus said\`
            `,
            aliases: ["synonym"],
            random: "string",
            cooldown: 10,
            subcommandEnabled: true
        })
        const wordOption = new SlashCommandOption()
            .setType("string")
            .setName("word")
            .setDescription("The word to search in the thesaurus.")
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(wordOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const perms = new Permission(discord, message)
        const thesaurus = new CollegiateThesaurus(process.env.THESAURUS_API_KEY)
        let word = Functions.combineArgs(args, 1)
        if (!word) {
            return this.noQuery(embeds.createEmbed()
            .setAuthor({name: "merriam webster", iconURL: "https://kisaragi.moe/assets/embed/thesaurus.png"})
            .setTitle(`**Word Lookup** ${discord.getEmoji("raphi")}`))
        }

        if (word.match(/merriam-webster.com/)) {
            word = word.replace("https://www.merriam-webster.com/thesaurus/", "").replace(/%20/g, " ")
        }
        const thesaurusEmbed = embeds.createEmbed()
        let result
        try {
            result = await thesaurus.lookup(word.trim())
        } catch (error: any) {
            thesaurusEmbed
            .setAuthor({name: "merriam webster", iconURL: "https://kisaragi.moe/assets/embed/thesaurus.png"})
            .setTitle(`**Thesaurus** ${discord.getEmoji("raphi")}`)
            .setDescription(`No synonyms were found. Here are some word suggestions: \n${error.suggestions.join(", ")}`)
            return this.reply(thesaurusEmbed)
        }

        const meaningArray: string[] = []
        const exampleArray: string[] = []
        const synonymArray: string[] = []
        const antonymArray: string[] = []
        for (const i in result[0].definition) {
            meaningArray.push(result[0].definition[i].meanings[0])
            if (result[0].definition[i].illustrations) {
                exampleArray.push(result[0].definition[i].illustrations[0])
            } else {
                exampleArray.push("")
            }
            synonymArray.push(result[0].definition[i].synonyms.join(", "))
            if (result[0].definition[i].antonyms) {
                exampleArray.push(result[0].definition[i].antonyms.join(", "))
            } else {
                antonymArray.push("")
            }
        }

        let synonyms = ""
        for (let i = 0; i < meaningArray.length; i++) {
            synonyms += `${discord.getEmoji("star")}_Meaning:_ ${meaningArray[i]}\n`
            if (exampleArray[i]) {
                synonyms += `${discord.getEmoji("star")}_Example:_ ${exampleArray[i]}\n`
            }
            synonyms += `${discord.getEmoji("star")}_Synonyms:_ ${synonymArray[i]}\n`
            if (antonymArray[i]) {
                synonyms += `${discord.getEmoji("star")}_Antonyms:_ ${antonymArray[i]}\n`
            }
        }

        thesaurusEmbed
        .setAuthor({name: "merriam webster", iconURL: "https://kisaragi.moe/assets/embed/thesaurus.png"})
        .setTitle(`**Thesaurus** ${discord.getEmoji("raphi")}`)
        .setURL(`https://www.merriam-webster.com/thesaurus/${result[0].word.replace(/ /g, "_")}`)
        .setThumbnail(message.author!.displayAvatarURL({extension: "png"}))
        .setDescription(
            `${discord.getEmoji("star")}_Word:_ **${result[0].word}**\n` +
            `${discord.getEmoji("star")}_Function:_ **${result[0].functional_label}**\n` +
            `${discord.getEmoji("star")}_Popularity:_ **${result[0].popularity}**\n` +
            `${Functions.checkChar(synonyms, 2000, ",")}\n`
        )
        this.reply(thesaurusEmbed)
    }
}
