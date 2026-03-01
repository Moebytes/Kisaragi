/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import { 
    ApplicationCommandOptionType, 
    SlashCommandStringOption, 
    SlashCommandBooleanOption, 
    SlashCommandAttachmentOption,
    SlashCommandChannelOption, 
    SlashCommandIntegerOption, 
    SlashCommandMentionableOption, 
    SlashCommandNumberOption, 
    SlashCommandRoleOption,
    SlashCommandUserOption,
	SlashCommandSubcommandBuilder,
	InteractionContextType,
	ApplicationIntegrationType,
	SlashCommandBuilder,
	ContextMenuCommandBuilder,
	ApplicationCommandType,
	ContextMenuCommandType
} from "discord.js"

type SlashCommandOptionType =
	| SlashCommandAttachmentOption
	| SlashCommandBooleanOption
	| SlashCommandChannelOption
	| SlashCommandIntegerOption
	| SlashCommandMentionableOption
	| SlashCommandNumberOption
	| SlashCommandRoleOption
	| SlashCommandStringOption
	| SlashCommandUserOption

type SlashCommandOptionTypeConstructor =
	| typeof SlashCommandAttachmentOption
	| typeof SlashCommandBooleanOption
	| typeof SlashCommandChannelOption
	| typeof SlashCommandIntegerOption
	| typeof SlashCommandMentionableOption
	| typeof SlashCommandNumberOption
	| typeof SlashCommandRoleOption
	| typeof SlashCommandStringOption
	| typeof SlashCommandUserOption

const optionMap = new Map<string, SlashCommandOptionTypeConstructor>([
	["SlashCommandAttachmentOption", SlashCommandAttachmentOption],
	["SlashCommandBooleanOption", SlashCommandBooleanOption],
	["SlashCommandChannelOption", SlashCommandChannelOption],
	["SlashCommandIntegerOption", SlashCommandIntegerOption],
	["SlashCommandMentionableOption", SlashCommandMentionableOption],
	["SlashCommandNumberOption", SlashCommandNumberOption],
	["SlashCommandRoleOption", SlashCommandRoleOption],
	["SlashCommandStringOption", SlashCommandStringOption],
	["SlashCommandUserOption", SlashCommandUserOption],
])

export class SlashCommand extends SlashCommandBuilder {
	public constructor() {
		super()
		this.setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
		this.setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
	}

	public addOption(input: SlashCommandOptionType | ((builder: SlashCommandOptionType) => SlashCommandOptionType)): this {
		if (typeof input === "function") {
			for (const OptionConstructor of optionMap.values()) {
				try {
					const instance = new OptionConstructor()
					const result = input(instance)
					const OptionBuilder = optionMap.get(result.constructor.name)
					// @ts-ignore
					if (OptionBuilder) return this._sharedAddOptionMethod(input, OptionBuilder)
				} catch {
					// Ignore errors from passing incorrect arguments to input
				}
			}

			throw new Error(`Unsupported option type returned from function input to addOption()`)
		}

		const OptionBuilder = optionMap.get(input?.constructor.name)
		// @ts-ignore
		if (OptionBuilder) return this._sharedAddOptionMethod(input, OptionBuilder)

		throw new Error(`Unsupported option type passed to addOption(): ${input?.constructor.name}`)
	}
}



export class SlashCommandSubcommand extends SlashCommandSubcommandBuilder {
	public constructor() {
		super()
	}

	public addOption(input: SlashCommandOptionType | ((builder: SlashCommandOptionType) => SlashCommandOptionType)): this {
		if (typeof input === "function") {
			for (const OptionConstructor of optionMap.values()) {
				try {
					const instance = new OptionConstructor()
					const result = input(instance)
					const OptionBuilder = optionMap.get(result.constructor.name)
					// @ts-ignore
					if (OptionBuilder) return this._sharedAddOptionMethod(input, OptionBuilder)
				} catch {
					// Ignore errors from passing incorrect arguments to input
				}
			}

			throw new Error(`Unsupported option type returned from function input to addOption()`)
		}

		const OptionBuilder = optionMap.get(input?.constructor.name)
		// @ts-ignore
		if (OptionBuilder) return this._sharedAddOptionMethod(input, OptionBuilder)

		throw new Error(`Unsupported option type passed to addOption(): ${input?.constructor.name}`)
	}
}

export type ApplicationCommandOptionStringType =
	| "attachment"
	| "boolean"
	| "channel"
	| "integer"
	| "mentionable"
	| "number"
	| "role"
	| "string"
	| "user"

export type ApplicationCommandOptionEnumTypeMap<OptionType extends ApplicationCommandOptionType> =
	OptionType extends ApplicationCommandOptionType.Attachment ? SlashCommandAttachmentOption : 
	OptionType extends ApplicationCommandOptionType.Boolean ? SlashCommandBooleanOption : 
	OptionType extends ApplicationCommandOptionType.Channel ? SlashCommandChannelOption : 
	OptionType extends ApplicationCommandOptionType.Integer ? SlashCommandIntegerOption : 
	OptionType extends ApplicationCommandOptionType.Mentionable ? SlashCommandMentionableOption : 
	OptionType extends ApplicationCommandOptionType.Number ? SlashCommandNumberOption : 
	OptionType extends ApplicationCommandOptionType.Role ? SlashCommandRoleOption : 
	OptionType extends ApplicationCommandOptionType.String ? SlashCommandStringOption : 
	OptionType extends ApplicationCommandOptionType.User ? SlashCommandUserOption : never

export type ApplicationCommandOptionStringTypeMap<OptionType extends ApplicationCommandOptionStringType> =
	OptionType extends "attachment" ? SlashCommandAttachmentOption : 
	OptionType extends "boolean" ? SlashCommandBooleanOption : 
	OptionType extends "channel" ? SlashCommandChannelOption : 
	OptionType extends "integer" ? SlashCommandIntegerOption : 
	OptionType extends "mentionable" ? SlashCommandMentionableOption : 
	OptionType extends "number" ? SlashCommandNumberOption : 
	OptionType extends "role" ? SlashCommandRoleOption : 
	OptionType extends "string" ? SlashCommandStringOption : 
	OptionType extends "user" ? SlashCommandUserOption : never

export type ApplicationCommandOptionTypeMap<OptionType extends ApplicationCommandOptionStringType | ApplicationCommandOptionType> = 
	OptionType extends ApplicationCommandOptionType ? ApplicationCommandOptionEnumTypeMap<OptionType> : 
	OptionType extends ApplicationCommandOptionStringType ? ApplicationCommandOptionStringTypeMap<OptionType> : 
	never

export class SlashCommandOption {
	constructor() {}

	public setType = <OptionType extends ApplicationCommandOptionStringType | ApplicationCommandOptionType>(type: OptionType) => {
		switch (type) {
			case ApplicationCommandOptionType.Attachment:
				return new SlashCommandAttachmentOption() as ApplicationCommandOptionTypeMap<OptionType>
			case ApplicationCommandOptionType.Boolean:
				return new SlashCommandBooleanOption() as ApplicationCommandOptionTypeMap<OptionType>
			case ApplicationCommandOptionType.Channel:
				return new SlashCommandChannelOption() as ApplicationCommandOptionTypeMap<OptionType>
			case ApplicationCommandOptionType.Integer:
				return new SlashCommandIntegerOption() as ApplicationCommandOptionTypeMap<OptionType>
			case ApplicationCommandOptionType.Mentionable:
				return new SlashCommandMentionableOption() as ApplicationCommandOptionTypeMap<OptionType>
			case ApplicationCommandOptionType.Number:
				return new SlashCommandNumberOption() as ApplicationCommandOptionTypeMap<OptionType>
			case ApplicationCommandOptionType.Role:
				return new SlashCommandRoleOption() as ApplicationCommandOptionTypeMap<OptionType>
			case ApplicationCommandOptionType.String:
				return new SlashCommandStringOption() as ApplicationCommandOptionTypeMap<OptionType>
			case ApplicationCommandOptionType.User:
				return new SlashCommandUserOption() as ApplicationCommandOptionTypeMap<OptionType>
			case "attachment":
				return new SlashCommandAttachmentOption() as ApplicationCommandOptionTypeMap<OptionType>
			case "boolean":
				return new SlashCommandBooleanOption() as ApplicationCommandOptionTypeMap<OptionType>
			case "channel":
				return new SlashCommandChannelOption() as ApplicationCommandOptionTypeMap<OptionType>
			case "integer":
				return new SlashCommandIntegerOption() as ApplicationCommandOptionTypeMap<OptionType>
			case "mentionable":
				return new SlashCommandMentionableOption() as ApplicationCommandOptionTypeMap<OptionType>
			case "number":
				return new SlashCommandNumberOption() as ApplicationCommandOptionTypeMap<OptionType>
			case "role":
				return new SlashCommandRoleOption() as ApplicationCommandOptionTypeMap<OptionType>
			case "string":
				return new SlashCommandStringOption() as ApplicationCommandOptionTypeMap<OptionType>
			case "user":
				return new SlashCommandUserOption() as ApplicationCommandOptionTypeMap<OptionType>
			default:
				throw new Error(`Unsupported option type: ${type}`)
		}
	}
}

export class ContextMenuCommand extends ContextMenuCommandBuilder {
	public constructor() {
		super()
		this.setContexts(InteractionContextType.Guild, InteractionContextType.BotDM, InteractionContextType.PrivateChannel)
		this.setIntegrationTypes(ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall)
	}

	public override setType = (type: "user" | "message" | ApplicationCommandType) => {
		switch (type) {
			case ApplicationCommandType.Message:
				return super.setType(ApplicationCommandType.Message)
			case ApplicationCommandType.User:
				return super.setType(ApplicationCommandType.User) 
			case "message":
				return super.setType(ApplicationCommandType.Message)
			case "user":
				return super.setType(ApplicationCommandType.User)
			default:
				throw new Error(`Unsupported type: ${type}`)
		}
	}
}