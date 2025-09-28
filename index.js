#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { RadioBrowserApi } from "radio-browser-api";
import open from "open";
import { spawn, exec } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

const program = new Command();
// for some odd reason the "all" api is just broken so i'd rather fixate on de2 cuz it looks more smooth for now? i'll see later for sm else
const api = new RadioBrowserApi("openyourradio", "https://de2.api.radio-browser.info");
api.setBaseUrl("https://de2.api.radio-browser.info");

const temp_file = path.join(os.tmpdir(), "openYourRadio-lastResults.json");
const history_file = path.join(os.tmpdir(), "openYourRadio-history.json");
const fav_file = path.join(os.tmpdir(), "openYourRadio-favorites.json");

function getPlayerCommand() {
    const platform = os.platform();
    if (platform === "win32") {
        const vlcPaths = [
            "C:\\Program Files\\VideoLAN\\VLC\\vlc.exe",
            "C:\\Program Files (x86)\\VideoLAN\\VLC\\vlc.exe"
        ];
        const mpvPaths = [
            "C:\\Program Files\\mpv\\mpv.exe",
            "C:\\Program Files (x86)\\mpv\\mpv.exe"
        ];
        const wmpPath = "C:\\Program Files (x86)\\Windows Media Player\\wmplayer.exe";

        for (const p of vlcPaths) if (fs.existsSync(p)) return { path: p, name: "VLC"};
        for (const p of mpvPaths) if (fs.existsSync(p)) return { path: p, name: "mpv"};
        if (fs.existsSync(wmpPath)) return { path: wmpPath, name: "Windows Media Player" };
    } else if (platform === "darwin") {
        const vlcPath = "/Applications/VLC.app/Contents/MacOS/VLC";
        const mpvPath = "/Applications/mpv.app/Contents/MacOS/mpv";
        const quickTimePath = "/Applications/QuickTime Player.app/Contents/MacOS/QuickTime Player";

        if (fs.existsSync(vlcPath)) return { path: vlcPath, name: "VLC" };
        if (fs.existsSync(mpvPath)) return {  path: mpvPath, name: "mpv" };
        if (fs.existsSync(quickTimePath)) return { path: quickTimePath, name: "QuickTime Player" };
    } else if (platform === "linux") {
        const mpvPath = "/usr/bin/mpv";
        const vlcPath = "/usr/bin/vlc";
        if (fs.existsSync(mpvPath)) return { path: mpvPath, name: "mpv" };
        if (fs.existsSync(vlcPath)) return { path: vlcPath, name: "VLC" };
    }
    return null;
}

function launchPlayer(url, preferredPlayer) {
  const platform = os.platform();
  const players = {
    win32: {
      vlc: [
        "C:\\Program Files\\VideoLAN\\VLC\\vlc.exe",
        "C:\\Program Files (x86)\\VideoLAN\\VLC\\vlc.exe"
      ],
      wmp: ["C:\\Program Files (x86)\\Windows Media Player\\wmplayer.exe"]
    },
    darwin: {
      vlc: ["/Applications/VLC.app/Contents/MacOS/VLC"],
      mpv: ["/Applications/mpv.app/Contents/MacOS/mpv"],
      quicktime: ["/Applications/QuickTime Player.app/Contents/MacOS/QuickTime Player"]
    },
    linux: {
      vlc: ["/usr/bin/vlc"],
      mpv: ["/usr/bin/mpv"]
    }
  };
  const avalaible = players[platform] || {};
  let chosen = null;
  if (preferredPlayer && avalaible[preferredPlayer]) {
    for (const p of avalaible[preferredPlayer]) {
      if (fs.existsSync(p)) {
        chosen = { path: p, name: preferredPlayer };
        break;
      }
    }
    if (!chosen) {
      console.log(chalk.red(`requested player "${preferredPlayer} not found on this system."`));
      return;
    }
  }
  if (!chosen) {
    const all = Object.entries(avalaible);
    for (const [name, paths] of all) {
      for (const p of paths) {
        if (fs.existsSync(p)) {
          chosen = { path: p, name };
          break;
        }
      }
      if (chosen) break;
    }
  }

  if (chosen) {
    console.log(chalk.green(`opening with: ${chosen.name}`));
    spawn(chosen.path, [url], { stdio: "ignore", detached: true });
  } else {
    console.log(chalk.yellow("no supported players were found, opening in the fallback system default..."));
    open(url);
  }
}

function addHistory(station) {
    let history = [];
    if (fs.existsSync(history_file)) {
        try {
            history = JSON.parse(fs.readFileSync(history_file, "utf-8"));
        } catch {}
    }
    history.unshift({
        name: station.name,
        country: station.country || station.countryCode || "unknown",
        url: station.urlResolved || station.url,
        playedAt: new Date().toISOString()
    });
    history = history.slice(0, 100);
    fs.writeFileSync(history_file, JSON.stringify(history, null, 2), "utf-8");
}

function loadFavorites() {
  if (!fs.existsSync(fav_file)) return [];
  try {
    return JSON.parse(fs.readFileSync(fav_file, "utf-8"));
  } catch {
    return [];
  }
}

function saveFavorites(favs) {
  fs.writeFileSync(fav_file, JSON.stringify(favs, null, 2), "utf-8");
}

program
    .name("radio")
    .description("grab your favorite player, radio, and let's tune in!")
    .version("1.0.0");

program
    .command("search <query>")
    .description("search for a specific radio from it's name")
    .action(async (query) =>  {
        const maxRetries = 3;
        const retryDelay = 2000;

        let attempt = 0;
        let results = null;

        while (attempt < maxRetries) {
            try {
                results = await api.searchStations({
                    name: query,
                    limit: 5,
                    hidebroken: true
                });
                if (!results || results.length === 0) {
                    console.log(chalk.red("no stations were found for the query"), query);
                } else {
                    results.forEach((station, i) => {
                        console.log(chalk.green(`#${i + 1}`));
                        console.log(chalk.yellow("name:"), station.name);
                        console.log(chalk.yellow("country:"), station.country);
                        console.log(chalk.yellow("URL:"), station.urlResolved || "N/A");
                        if (station.tags) console.log(chalk.yellow("tags:"), station.tags.join(", "));
                        console.log();
                    });
                    program.lastResults = results;
                    fs.writeFileSync(temp_file, JSON.stringify(results), "utf-8");
                    lastResults = results;
                }
                break;
            } catch (err) {
                attempt++;
                if (err?.status === 502 && attempt < maxRetries) {
                    console.log(chalk.yellow(`502 bad gateway error: most likely a rate limit!`))
                    console.log(chalk.yellow(`automatically retrying in 2 seconds. (attempt ${attempt}/${maxRetries})`));
                    await new Promise(r => setTimeout(r, retryDelay));
                } else {
                    console.log(chalk.red("an error occured with radio browser:"), err.message || err);
                    break;
                }
            }
        }
    });

program
    .command("list <type>")
    .description("list the top genres or top countries from the API")
    .action(async (type) => {
        try {
            type = type.toLowerCase();
            if (type === "genre" || type === "genres") {
                const genres = await api.getTags();
                if (!genres || genres.length === 0) {
                    console.log(chalk.red("that's really rare and must be an issue. no genres found?"));
                    return;
                }
                console.log(chalk.green("top genres:"));
                genres.forEach((tag, i) => {
                    console.log(chalk.yellow(`#${i + 1}`), tag.name, `(${tag.stationcount} stations)`);
                });
            } else if (type === "country" || type === "countries") {
                const countries = await api.getCountries();
                if (!countries || countries.length === 0) {
                    console.log(chalk.red("no countries found, rare issue..."));
                    return;
                }
                console.log(chalk.green("countries with stations:"));
                countries.forEach((c, i) => {
                    console.log(chalk.yellow(`#${i + 1}`), c.name, `(${c.stationcount} stations)`);
                });
            } else {
                console.log(chalk.red(`unknown type for ${type}. you must use "genres", or "countries".`));
            }
        } catch (err) {
            console.log(chalk.red("error fetching lists:"), err.message || err);
        }
    });

let lastResults = [];

program
  .command("play <station>")
  .description("play a station either by name, 'random' for random, or by search result (1-5)")
  .option("-g, --genre <tag>", "play a random radio with a specific genre")
  .option("-c, --country <country>", "play a random radio from a specific country")
  .option("-p, --player <player>", "force a specific player (vlc, mpv, wmp, quicktime)")
  .action(async (station, options) => {
    if ((!lastResults || lastResults.length === 0) && fs.existsSync(temp_file)) {
      lastResults = JSON.parse(fs.readFileSync(temp_file, "utf-8"));
    }

    let selected;
if (station.toLowerCase() === "random") {
  try {
    const query = {
      order: "random",
      limit: 10,
      hidebroken: true,
    };

    if (options.genre) {
      query.tag = options.genre.toLowerCase();
    }

    if (options.country) {
      const c = options.country.trim();
      if (/^[A-Za-z]{2}$/.test(c)) {
        query.countryCode = c.toUpperCase();
      } else {
        query.country = c;
      }
    }

    const stations = await api.searchStations(query);
    if (!stations || stations.length === 0) {
      console.log(chalk.red("no stations were found with your filters. try changing/removing them!"));
      return;
    }

    selected = stations[Math.floor(Math.random() * stations.length)];

    console.log();
    if (options.genre) console.log(chalk.yellow(`genre: ${options.genre}`));
    if (options.country) console.log(chalk.yellow(`country: ${options.country}`));

  } catch (err) {
    console.log(chalk.red("error fetching random station:"), err.message || err);
    return;
  }


    } else if (station.toLowerCase() === "random") {
      if (!lastResults || lastResults.length === 0) {
        console.log(chalk.red("no previous search results are avalaible. please search for radios at least once first."));
        return;
      }
      selected = lastResults[Math.floor(Math.random() * lastResults.length)];

    } else if (!isNaN(station)) {
      const index = parseInt(station, 10) - 1;
      selected = lastResults[index];
      if (!selected) {
        console.log(chalk.red("invalid number. choose between 1 and"), lastResults.length);
        return;
      }

    } else {
      selected = lastResults.find(r => r.name.toLowerCase() === station.toLowerCase());
      if (!selected) {
        console.log(chalk.red("no stations from your last search had this name, please search once if you didn't."));
        return;
      }
    }

    if (!selected) {
      console.log(chalk.red("no station selected"));
      return;
    }

    console.log(chalk.green(`\nplaying: ${selected.name} (${selected.country || selected.countryCode || 'unknown'})`));
    console.log("URL:", chalk.cyan(selected.urlResolved || selected.url || "no URL avalaible"));
    console.log(chalk.yellow("to stop playback, especially on Linux, end this command and run 'radio stop'. this will kill the player's instance."))

    addHistory(selected);
    launchPlayer(selected.urlResolved || selected.url, options.player?.toLowerCase());
  });

program
  .command("stop")
  .description("kill and close the current player. useful if on Linux, considering mpv is headless")
  .action(() => {
    const killCommands = {
      win32: [
        'taskkill /F /IM vlc.exe',
        'taskkill /F /IM wmplayer.exe',
        'taskkill /F /IM mpv.exe'
      ],
      darwin: [
        'killall VLC',
        'killall mpv',
        'killall "QuickTime Player"'
      ],
      linux: [
        'pkill vlc',
        'pkill mpv'
      ]
    };
    const platform = process.platform;
    const commands = killCommands[platform] || [];
    let stopped = false;
    const tryNext = (i) => {
      if (i >= commands.length) {
        if (!stopped) {
          console.log(chalk.red("no player processes were found..."));
        }
        return;
      }
      exec (commands[i], (err) => {
        if (!err && !stopped) {
          stopped = true;
          console.log(chalk.green("player closed successfully!"));
        }
        tryNext(i + 1);
      });
    };
    tryNext(0);
  });

program
  .command("history [n]")
  .description("show a list of recently played radios. n = number of radios to show")
  .action((n = 5) => {
    if (!fs.existsSync(history_file)) {
        console.log(chalk.yellow("the history is currently empty."));
        return;
    }
    let history = [];
    try {
        history = JSON.parse(fs.readFileSync(history_file, "utf-8"));
    } catch {
        console.log(chalk.red("error reading the history file..."));
        return;
    }
    n = parseInt(n, 10);
    if (isNaN(n) || n <= 0) n = 5

    console.log(chalk.green(`last ${n} played radios:`));
    history.slice(0, n).forEach((entry, i) => {
        console.log(chalk.yellow(`#${i + 1}`), entry.name, `(${entry.country})`);
        console.log("URL:", chalk.cyan(entry.url));
        console.log("played at:", chalk.cyan(entry.playedAt));
        console.log();
    });
  });

const fav = program.command("fav").description("manage favorite stations");

fav
  .command("add <query/ID>")
  .description("add a station to favorites by name or last search # (1-5)")
  .action(async (input) => {
    let station;
    if (!isNaN(input)) {
      const idx = parseInt(input, 10) - 1;
      if ((!lastResults || lastResults.length === 0) && fs.existsSync(temp_file)) {
        try {
          lastResults = JSON.parse(fs.readFileSync(temp_file, "utf-8"));
        } catch {
          lastResults = [];
        }
      }

      if (lastResults && lastResults[idx]) {
        station = lastResults[idx];
      } else {
        console.log(chalk.red("invalid number, or you didn't previously search something"));
        return;
      }
    }

    else {
      try {
        const results = await api.searchStations({ name: input, limit: 10, hideBroken: true });
        if (!results || results.length === 0) {
          console.log(chalk.red("no stations matching your query..."));
          return;
        }
        station = results[0];
      } catch (err) {
        console.log(chalk.red("error searching for stations:"), err.message || err);
        return;
      }
    }
    const favs = loadFavorites();
    if (favs.find(f => f.name === station.name)) {
      console.log(chalk.yellow("that station is already in your favorites!"));
      return;
    }
    favs.push(station);
    saveFavorites(favs);
    console.log(chalk.green(`added "${station.name}" (${station.country}) to your favorites!`));
  });

fav
  .command("delete <name/ID>")
  .description("remove a radio from your favorites by exact name or ID in the list")
  .action((input) => {
    let favs = loadFavorites();
    let index = -1;
    if (!isNaN(input)) {
      const idx = parseInt(input, 10) - 1;
      if (idx >= 0 && idx < favs.length) {
        index = idx;
      }
    } else {
      index = favs.findIndex(f => f.name.toLowerCase() === input.toLowerCase());
    }
    if (index === -1) {
      console.log(chalk.red("station not found in favorites list"));
      return;
    }
    const removed = favs.splice(index, 1)[0];
    saveFavorites(favs);
    console.log(chalk.green(`removed "${removed.name}" from favorites list!`));
  });

fav
  .command("list")
  .description("list your favorite stations")
  .action(() => {
    const favs = loadFavorites();
    if (favs.length === 0) {
      console.log(chalk.yellow("no favorites yet..."));
      return;
    }
    favs.forEach((f, i) => {
      console.log(chalk.green(`#${i + 1}`), f.name, `(${f.country || f.countryCode || 'unknown'})`);
      console.log("URL:", chalk.cyan(f.urlResolved || f.url));
      console.log();
    });
  });

fav
  .command("play <name/ID/random>")
  .description("play a station from your favorites, either by name or number in fav list")
  .option("-p, --player <player>", "force a specific player (vlc, mpv, wmp, quicktime)")
  .action((input, options) => {
    const favs = loadFavorites();
    if (favs.length === 0) {
      console.log(chalk.yellow("there are no favs in your list!"));
      return;
    }

    let station;
    if (input.toLowerCase() === "random") {
      station = favs[Math.floor(Math.random() * favs.length)];
    }
    else if (!isNaN(input)) {
      const idx = parseInt(input, 10) - 1;
      if (favs[idx]) {
        station = favs[idx];
      } else {
        console.log(chalk.red("that ID number dosen't exist in the favorites list"));
        return;
      }
    }
    else {
      station = favs.find(f => f.name.toLowerCase() === input.toLowerCase());
      if (!station) {
        console.log(chalk.red("no stations found with that name in the favorites list"));
        return;
      }
    }

    console.log(chalk.green(`playing favorite station: ${station.name} (${station.country || station.countryCode || 'unknown'})`));
    launchPlayer(station.urlResolved || station.url, options.player?.toLowerCase());
  });

fav
  .command("export")
  .description("open your favorites file in the system editor/viewer")
  .action(() => {
    if (!fs.existsSync(fav_file)) {
      console.log(chalk.yellow("there isn't a favorites file! add some favorites to start."));
      return;
    }
    const platform = os.platform();
    let editor, args;

    if (platform === "win32") {
      editor = "notepad";
      args = [fav_file];
    } else if (platform === "darwin") {
      editor = "open";
      args = ["-a", "TextEdit", fav_file];
    } else {
      editor = "nano";
      args = [fav_file];
    }
    const child = spawn(editor, args, { stdio: "inherit" });

    child.on("error", (err) => {
      console.log(chalk.red("couldn't open the favorites file:"), err.message);
    });

    child.on("exit", (code) => {
      if (code === 0) {
        console.log(chalk.green("looks like the file editor closed successfully!"));
      } else {
        console.log(chalk.yellow(`it seems like the editor crashed of some sort, with code ${code}`));
      }
    });
  });

program.parse(process.argv);