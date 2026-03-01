/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import axios from "axios"
import {Message} from "discord.js"
import {SlashCommandSubcommand, SlashCommandOption} from "../../structures/SlashCommandOption"
import {Command} from "../../structures/Command"
import {Embeds} from "./../../structures/Embeds"
import {Functions} from "./../../structures/Functions"
import {Kisaragi} from "./../../structures/Kisaragi"

export default class Weather extends Command {
    constructor(discord: Kisaragi, message: Message) {
        super(discord, message, {
            description: "Posts the current weather in a city or zip code.",
            help:
            `
            \`weather city/zip code\` - Gets the weather
            `,
            examples:
            `
            \`=>weather new york\`
            `,
            aliases: ["forecast", "climate"],
            cooldown: 5,
            subcommandEnabled: true
        })
        const cityOption = new SlashCommandOption()
            .setType("string")
            .setName("city")
            .setDescription("Can be a city or zip code.")
            .setRequired(true)
            
        this.subcommand = new SlashCommandSubcommand()
            .setName(this.constructor.name.toLowerCase())
            .setDescription(this.options.description)
            .addOption(cityOption)
    }

    public run = async (args: string[]) => {
        const discord = this.discord
        const message = this.message
        const embeds = new Embeds(discord, message)

        const city = Functions.combineArgs(args, 1)?.trim()
        if (!city) return message.reply(`What city do you want to search for ${discord.getEmoji("kannaCurious")}`)

        const w = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${process.env.WEATHER_API_KEY}`).then((r) => r.data)

        if (!w || w.cod === "404") {
            return this.invalidQuery(embeds.createEmbed()
            .setAuthor({name: "weather",  iconURL: "https://kisaragi.moe/assets/embed/weather.png"})
            .setTitle(`**Weather** ${discord.getEmoji("aquaWut")}`))
        }

        const weatherEmbed = embeds.createEmbed()
        weatherEmbed
        .setAuthor({name: "weather",  iconURL: "https://kisaragi.moe/assets/embed/weather.png"})
        .setTitle(`**Weather** ${discord.getEmoji("aquaWut")}`)
        .setURL(`https://openweathermap.org/city/${w.id}`)
        .setThumbnail(`https://openweathermap.org/img/w/${w.weather?.[0].icon}.png`)
        .setDescription(
            `🌎_City:_ **${w.name}, ${w.sys.country}**\n` +
            `🌩️_Weather:_ **${w.weather?.[0]?.main ?? "Not found"}**\n` +
            `📏_Latitude/Longitude:_ \`${w.coord.lat}°, ${w.coord.lon}°\`\n` +
            `🌡️_Temperature:_ \`${w.main.temp}°F\`\n` +
            `🍧_Feels Like:_ \`${w.main.feels_like}°F\`\n` +
            `☀️_Minimum/Maximum:_ \`${w.main.temp_min}°F, ${w.main.temp_max}°F\`\n` +
            `☁️_Pressure:_ \`${w.main.pressure}hPa\`\n` +
            `❄️_Humidity:_ \`${w.main.humidity}%\`\n` +
            `💨_Wind Speed/Direction:_ \`${w.wind.speed}m/s, ${w.wind.deg}°\`\n`
        )
        return this.reply(weatherEmbed)
    }
}
