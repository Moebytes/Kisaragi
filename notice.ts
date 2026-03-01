import fs from "fs"

let commands = fs.readdirSync("./commands", {recursive: true}).map((f) => `commands/${f}`)
let events = fs.readdirSync("./events", {recursive: true}).map((f) => `events/${f}`)
let routes = fs.readdirSync("./routes", {recursive: true}).map((f) => `routes/${f}`)
let structures = fs.readdirSync("./structures", {recursive: true}).map((f) => `structures/${f}`)

let singles = ["generate.ts", "index.ts", "post.ts", "register.ts", "server.ts", "shard.ts"]

let files = [...commands, ...events, ...routes, ...structures, ...singles]
    .filter((file) => (file as string).endsWith(".ts"))

for (const file of files) {
    let oldNotice = ` /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */`

    let newNotice = `/* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */`

    const contents = fs.readFileSync(file).toString()
    let newContents = contents.replace(oldNotice, newNotice)
    fs.writeFileSync(file, newContents)
}