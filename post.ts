 /* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * Kisaragi - A kawaii discord bot ❤                         *
 * Copyright © 2026 Moebytes <moebytes.com>                  *
 * Licensed under CC BY-NC 4.0. See license.txt for details. *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * */

import fs from "fs"
import path from "path"

fs.copyFileSync(path.join(__dirname, "../structures/CreateDB.sql"), path.join(__dirname, "./structures/CreateDB.sql"))
fs.mkdirSync(path.join(__dirname, "./assets/images"), {recursive: true})
fs.copyFileSync(path.join(__dirname, "../assets/images/heart.png"), path.join(__dirname, "./assets/images/heart.png"))