import {Message, EmbedBuilder} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class Pokemon extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Gets information on a pokemon.",
            help:
            `
            \`pokemon query\` - Posts info on a pokemon
            `,
            examples:
            `
            \`=>pokemon eevee\`
            `,
            aliases: ["pokedex"],
            random: "none",
            cooldown: 10,
            unlist: true,
            subcommandEnabled: false
        })
        const queryOption = new SlashCommandOption()
            .setType("string")
            .setName("query")
            .setDescription("The pokemon to search.")
            .setRequired(true)
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(queryOption)
    }

    public getInfo = (result: any, image: string) => {
        const discord = this.discord
        const embeds = new Embeds(discord, this.message)
        const stats = result.stats.map((s: any) => `${discord.getEmoji("star")}_${Functions.toProperCase(s.stat.name.replace(/-/g, " "))}:_ \`${s.base_stat}\``)
        const pokemonEmbed = embeds.createEmbed()
        pokemonEmbed
        .setAuthor({name: "pokemon", iconURL: "https://kisaragi.moe/assets/embed/pokemon.png", url: "https://pokeapi.co/"})
        .setTitle(`**Pokemon Search** ${discord.getEmoji("vigneXD")}`)
        .setImage(result.sprites[image])
        .setDescription(
            `${discord.getEmoji("star")}_Name:_ **${Functions.toProperCase(result.name)}**\n` +
            `${discord.getEmoji("star")}_Type:_ **${result.types?.map((t: any) => Functions.toProperCase(t.type.name))?.join(", ")}**\n` +
            `${discord.getEmoji("star")}_ID:_ \`${result.id}\`\n` +
            `${discord.getEmoji("star")}_Height:_ **${(result.height / 10.0).toFixed(1)}m**\n` +
            `${discord.getEmoji("star")}_Weight:_ **${(result.weight / 10.0).toFixed(1)}kg**\n` +
            `${discord.getEmoji("star")}_Base Experience:_ **${result.base_experience}**\n` +
            `${discord.getEmoji("star")}_Held Items:_ **${result.held_items?.[0] ? result.held_items.map((i: any) => i.item.name.replace(/-/, " ")).join(", ") : "None"}**\n` +
            stats.join("\n")
        )
        return pokemonEmbed
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)
        const Pokedex = await import("pokedex-promise-v2").then((r) => r.default)
        const pokemon = new Pokedex()

        const query = Functions.combineArgs(args, 1).trim()

        if (!query) {
            return this.noQuery(embeds.createEmbed()
            .setAuthor({name: "pokemon", iconURL: "https://kisaragi.moe/assets/embed/pokemon.png", url: "https://pokeapi.co/"})
            .setTitle(`**Pokemon Search** ${discord.getEmoji("vigneXD")}`))
        }

        const result = await pokemon.getPokemonByName(query).then((r) => r?.[0])

        if (!result?.hasOwnProperty("name")) {
            return this.invalidQuery(embeds.createEmbed()
            .setAuthor({name: "pokemon", iconURL: "https://kisaragi.moe/assets/embed/pokemon.png", url: "https://pokeapi.co/"})
            .setTitle(`**Pokemon Search** ${discord.getEmoji("vigneXD")}`))
        }

        const pokemonArray: EmbedBuilder[] = []
        pokemonArray.push(this.getInfo(result, "front_default"))
        pokemonArray.push(this.getInfo(result, "front_shiny"))
        pokemonArray.push(this.getInfo(result, "back_default"))
        pokemonArray.push(this.getInfo(result, "back_shiny"))
        return embeds.createReactionEmbed(pokemonArray, true, true)
    }
}
