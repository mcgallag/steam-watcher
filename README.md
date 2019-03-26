# Steam Watcher
*Created by Michael Gallagher (mcgallag@gmail.com)*

## Purpose

![Example of Steam's unfriendly screenshot directory](https://mcgallag.github.io/steam_directory.png)

*(Steam's very non-user-friendly directory for screenshot storage)*

Steam does not save its screenshots into a common directory, rather it has a common directory with a subdirectory for each individual game, with several layers of obfuscation that introduce a lot of frustration for end users who might just want fast and simple access to their screenshots as they are created in-game.

This software seeks to alleviate that frustration. It does a simple recursive search into a supplied directory and copies any files matching the *.jpg* extension into a user-supplied directory. Rather than having to search through multiple subdirectories that are not labeled in human-readable language, they will be harvested into a common directory.

The file names in the common directory are still not quite human readable; they are named by timestamp, so the file with the highest number will be the most recent screenshot, so it is easy to find the picture you just took and I consider that a marked improvement!

## Setup
A few constants need to be set in the `watcher.js` file.

* `watch_dir` must be set to the root directory in which Steam stores the user's screenshots. If you need help locating it, open Steam and select "Screenshots" from the "View" menu, then click "Show on Disk" in the window that opens. You are looking for a folder that is called **"remote"** For example, my Steam client is installed to "F:/Steam" and the watch directory is:

```javascript
const watch_dir = "F:/Steam/userdate/{userid}/760/remote";
```

* `output_dir` must be set to the directory into which you want your screenshots to be copied. An example would be:

```javascript
const output_dir = "C:/temp/screenshots";
```

* `timer_interval` [optional] can be set to customize the time (in seconds!) between harvest scans if desired. The default is 10 seconds.

```javascript
const timer_interval = 10;
```

## Summary

The `watcher.js` script can be run with the NodeJS runtime (http://nodejs.org) and will loop indefinitely until the user kills the process. I designed it to be run in a Linux system as an init.d service but was tested in Windows and works fine in both environments. A Windows user might want to find an alternative that allows it to run without a visible console, but that is left as an exercise for the user.

Please feel free to reach out if you have any questions or suggestions, but I cannot guarantee any support.