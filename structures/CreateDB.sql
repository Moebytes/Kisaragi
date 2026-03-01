-- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
-- Kisaragi - A kawaii discord bot ❤                         -
-- Copyright © 2026 Moebytes <moebytes.com>                  -
-- Licensed under CC BY-NC 4.0. See license.txt for details. -
-- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

CREATE TABLE IF NOT EXISTS "blacklist" (
    "guild id" bigint PRIMARY KEY,
    "user id" text
);

CREATE TABLE IF NOT EXISTS "collectors" (
    "message" bigint PRIMARY KEY,
    "embeds" text[],
    "collapse" text,
    "page" int,
    "help" boolean,
    "download" boolean,
    "timestamp" timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "commands" (
    "command" text PRIMARY KEY,
    "aliases" text[],
    "path" text,
    "cooldown" int,
    "help" text,
    "examples" text,
    "guild only" boolean,
    "random" text,
    "permission" text,
    "bot permission" text,
    "usage" int
);

CREATE TABLE IF NOT EXISTS "misc" (
    "user id" bigint PRIMARY KEY,
    "username" text,
    "osu name" text,
    "global bans" text,
    "bookmarks" text,
    "playlists" text,
    "birthday" text,
    "usage" text,
    "last voted" timestampz
);

CREATE TABLE IF NOT EXISTS "oauth2" (
    "user id" bigint PRIMARY KEY,
    "user tag" text,
    "access token" text,
    "refresh token" text,
    "email" text,
    "connections" text[],
    "guilds" text[],
    "twitter token" text,
    "twitter secret" text,
    "screen name" text,
    "twitter id" text,
    "reddit token" text,
    "reddit refresh" text,
    "reddit name" text
);

CREATE TABLE IF NOT EXISTS "pixiv" (
    "id" bigint PRIMARY KEY,
    "embed" text
);

CREATE TABLE IF NOT EXISTS "twitch" (
    "channel" text PRIMARY KEY,
    "config" text[]
);

CREATE TABLE IF NOT EXISTS "yt" (
    "channel id" text PRIMARY KEY,
    "config" text[]
);

CREATE TABLE IF NOT EXISTS "guilds" (
    "guild id" bigint PRIMARY KEY,
    "name" text,
    "members" int,
    "owner" text,
    "owner id" bigint,
    "usage" text,
    "prefix" text,
    "mod log" text,
    "message log" text,
    "user log" text,
    "member log" text,
    "pinboard" text,
    "nsfw pinboard" text,
    "yt channels" text[],
    "twitch channels" text[],
    "global chat" text,
    "linked" text[],
    "gallery" text[],
    "starboard" text,
    "star threshold" int,
    "star emoji" text,
    "mute role" text,
    "restricted role" text,
    "warn one" text,
    "warn two" text,
    "mod role" text,
    "admin role" text,
    "self roles" text[],
    "reaction roles" text[],
    "emoji roles" text[],
    "warn log" text[],
    "warn penalty" text,
    "warn threshold" int,
    "cases" text[],
    "blocked words" text[],
    "disabled categories" text[],
    "pfp ban toggle" text,
    "ascii name toggle" text,
    "default channel" text,
    "block match" text,
    "block toggle" text,
    "link ban" text,
    "asterisk" text,
    "invite" text,
    "self promo" text,
    "everyone ban toggle" text,
    "verify toggle" text,
    "verify role" text,
    "captcha type" text,
    "captcha color" text,
    "difficulty" text,
    "links" text,
    "anime" text,
    "pfp" text,
    "weeb" text,
    "normie" text,
    "ignored" text[],
    "response" text,
    "welcome channel" text,
    "welcome message" text,
    "welcome toggle" text,
    "welcome bg text" text,
    "welcome bg color" text,
    "welcome bg images" text[],
    "welcome bg toggle" text,
    "leave channel" text,
    "leave message" text,
    "leave toggle" text,
    "leave bg text" text,
    "leave bg color" text,
    "leave bg images" text[],
    "leave bg toggle" text,
    "permissions" text,
    "embed colors" text[],
    "point range" text[],
    "point threshold" int,
    "level message" text,
    "point timeout" int,
    "point toggle" text,
    "scores" text[],
    "level roles" text[],
    "level channels" text[],
    "auto commands" text[],
    "auto channels" text[],
    "auto frequencies" int[],
    "auto timeouts" int[],
    "auto toggles" text[],
    "birthdays" text[],
    "birthday channel" text,
    "birthday message" text,
    "birthday toggle" text,
    "guild log" text,
    "sources" text[]
);