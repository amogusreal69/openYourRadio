<p align=center><br>
<a href="https://github.com/Lolo280374/openYourRadio"><img src="https://hackatime-badge.hackclub.com/U09CBF0DS4F/openYourRadio"></a>
<a href="http://makeapullrequest.com"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg"></a>
<a href="#npm-linux-macos-windows"><img src="https://img.shields.io/badge/os-linux-brightgreen"></a>
<a href="#npm-linux-macos-windows"><img src="https://img.shields.io/badge/os-mac-brightgreen"></a>
<a href="#npm-linux-macos-windows"><img src="https://img.shields.io/badge/os-windows-brightgreen"></a>
<br></p>

<h3 align="center">
grab your favorite player, radios, and let's get tuned in! free, and forever! this tool gathers data from <a href="https://www.radio-browser.info/">Radio Browser API.</a>
</h3>

<h1 align="center">
	showcase (Windows/Linux)
</h1>

to view the project showcases, please click on one of the two video avalaible (Windows/Linux), to view the video itself. 

<a href="https://github.com/user-attachments/assets/90a97593-eda3-4d0c-94f3-56c01d697075">
  <img src="https://github.com/user-attachments/assets/db90ecda-2951-4801-b71f-da80196e9fd1" 
       alt="Project showcase on Windows" 
       width="1909" 
       height="1074">
</a>

<a href="https://github.com/user-attachments/assets/f23639af-1c61-401b-97bc-a264d509589d">
  <img src="https://github.com/user-attachments/assets/9172e76a-55e6-4d1c-b0e1-c188f16e6cfc" 
       alt="Project showcase on Linux" 
       width="1909" 
       height="1074">
</a>

## table of contents

- [compatible players](#compatible-players)
- [commands](#commands)
- [installation](#installation)
  - [with npm: Linux, macOS, Windows](#npm-linux-macos-windows)
  - [install from source](#install-from-source)
- [uninstall](#uninstall)
- [reporting issues](#reporting-issues)
- [privacy information](#privacy-disclaimer)
- [license](#license)

## compatible players

as of now, the following desktop players are supported:
<br>- **mpv** (Windows, macOS, Linux) - short: mpv
<br>- **VLC media player** (Windows, macOS, Linux) - short: vlc
<br>- **Windows Media Player (Legacy)** (Windows) - short: wmp
<br>- **QuickTime Player** (macOS) - short: quicktime
<br>=> *web browsers are also supported as a fallback method if no players are found/avalaible...*

## commands

here's a list of commands, organized by category:

**playback**
- **radio search <query>** : search for a specific radio on the API. returns the 5 most accurate results.
- **radio play <query/ID/random> [--genre, --country, --player]** : play a specific radio, either by query, ID being the # when you're searching, or random being a random radio from the API. you may also specify --genre "e.g: j-pop", and/or --country "e.g: France" to better filter randomized results. you may also force a certain player using --player "x", see [compatible players.](#compatible-players)
- **radio stop** : stops the current playback, and closes the player. (useful if you use mpv, for example, since it's headless).

**favorites**
- **radio fav add <query/ID>** : adds a station to your favorites list. query here equals a search (e.g: BBC RADIO 1), ID equals the # on the search list (e.g #4).
- **radio fav delete <name/ID>** : deletes a station from your favorites list. name here equals the name of the radio (e.g: BBC RADIO 1), ID equals to the # on your favorites list.
- **radio fav list** : lists all your favorited stations.
- **radio fav play <name/ID/random> [--player vlc]** : play stations from your favorites. you can either input the name of the favorite, the ID on the fav list, or random to get a random pick from your favorites list. you can also specify --player "x" to force a certain player, see [compatible players.](#compatible-players)
- **radio fav export** : opens the favorites file's JSON in your system default editor (Notepad, TextEdit, or nano).

**quality of life**
- **radio history [n]** : display your playback history, [n] equals to the amount of favorites to show in the list.
- **radio list <genres/countries>** : displays the lists of genres and countries supported by the RadioBrowser API.
- **radio help** : show the help screen with the list of commands.

## installation

### npm: Linux, macOS, Windows
you can install this program by simply getting it from npm:
```sh
npm install -g openYourRadio
radio -V
```

### install from source
to install from source, you must start by making sure you have git, nodeJS, and npm installed.
then, start by cloning the repository:

```sh
git clone https://github.com/Lolo280374/openYourRadio.git
cd openYourRadio
```

you may then install the dependencies, and link the package to your system:

```sh
npm install
npm link
```

once complete, you can run the following to make sure installation suceeded, and you can start editing 'index.js' to make modifs!

```sh
radio -V
1.0.0
```

## uninstall
to uninstall, you can simply run the following:
```sh
npm uninstall openYourRadio
```

## reporting issues

this is a community project, and your help is very much appreciated! if you notice anything wrong during your usage of this software, please report it to the [GitHub issues page](https://github.com/Lolo280374/openYourRadio/issues/)!

## privacy disclaimer

this tool dosen't collect analytics of any sort, nor makes outside connections to the Internet, apart from the Radio Browser API which is used to gather radio information, and stream URLs to redirect your player of choice. to visit their privacy statement, please visit [their FAQ.](https://www.radio-browser.info/faq)

## license

this project is licensed under the MIT License, which you may check [here](https://github.com/Lolo280374/openYourRadio/blob/master/LICENSE/).
<br>if you have any questions about this project, please reach me [at lolodotzip@hackclub.app](mailto:lolodotzip@hackclub.app).
