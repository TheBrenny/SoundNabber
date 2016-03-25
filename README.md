# SoundNabber
Grab sounds from the awesome SoundCloud without any extra work than adding it to
a playlist!

## Installation
To get started using this package, download this repository and `npm install`
the dependencies:
1. `git clone https://github.com/thebrenny/soundnabber.git`
2. `cd SoundNabber`
3. `npm install`

For best results, install this package on a server, or a system that will be on
constantly, such as a Raspberry Pi. That way, you can take absolute advantage of
the Cron feature!

## Usage
4. `node soundnab.js`

This starts up the application, and if it is for the first time, you will be
greeted by a couple of questions. When entering data to SoundNabber, you must
remember that all links and titles must be the SoundCloud permalink. For
example: `https://soundcloud.com/**platinumdragon**/sets/**want-these**`, the
potions surrounded by asterisks are permalinks. The first would be your
`Username perma`, whereas the second would be your `Playlist perma`.

The location is a full or relative path, as defined by [RequestJS](https://npmjs.com/packages/request),
that ***MUST*** end with a directory separator. Failing to do so could cause
serious harm to your system.

The Cron Job is a cron-style string of how often you want SoundNabber to poll
your playlist. The default is every day at midnight and midday. If you want to
change it, make sure you use the correct cron-syntax, as defined by [Cron](https://npmjs.com/packages/node-cron).

## Why create SoundNabber?
SoundNabber was created for the sole reason of *"nabbing"* tracks from the
popular song sharing social network *"SoundCloud"*. Of course, there are plenty
of chrome extensions that allow for you to download the tracks, but I found it
very tedious to download the tracks and then place them in the correct folder.
That is why I have created SoundNabber! To allow you to save the tracks you want
in a playlist, and then have a node program constantly poll that playlist for
any new tracks to download!

## Contributers
| Username | Name | Email |
|-|-|
| [TheBrenny](http://www.github.com/TheBrenny) | Jarod Brennfleck | [thebrenny@brennytizer.com.au](mailto:thebrenny@brennytizer.com.au) |

## License
This project uses the GNU GPL v3 License.
