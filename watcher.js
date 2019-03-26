/** Node File System API */
const fs = require("fs");
/** Node Timers API */
const Timers = require("timers");

// F:\Steam\userdata\{USER-ID}\760\remote
/** Steam directory for user screenshot data */
const watch_dir = "/mnt/share";
/** directory in which to save harvested screenshots */
const output_dir = "/home/pi/media/steam";
/** interval between harvests in seconds */
const timer_interval = 10;

// a couple regexes for file testing and manipulation

/** File extensions to copy */
const file_regex = new RegExp('.*\.jpg$');
/** Used to extract extension from original filename */
const file_extension_regex = new RegExp('\.[a-zA-Z0-9]+$');

/** global marker of last time we scanned for files */
var last_scan_time = 0;

// a bit of a hack as I'm running the harvester on a Raspberry Pi and Steam on a Windows Desktop
// this is to account for minor differences in time on the two different PCs
// won't disrupt program activity if running locally on one machine
/** tracks the creation date of the latest created file we have copied */
var latest_time_scanned;

/** holds the Timeout for scan intervals. 
  * Not currently used but storing for reference in case of failure */
var ticker;

/**
 * Initialize globals and start scanning
 * @returns Nothing
 */
function setup() {
  try {
    /** holds the configuration data loaded from disk */
    let config_data = fs.readFileSync("config.json", { encoding: "utf8" });
    last_scan_time = JSON.parse(config_data).last_scan_time;
  } catch (err) {
    // if config.json does not exist, then start from scratch and harvest everything pre-existing
    last_scan_time = 0;
  }
  // initial scan time at start
  latest_time_scanned = last_scan_time;

  // start scanning!
  scan();
}

/**
 * Main program loop. Initiates harvest scan and updates globals before setting
 * a Timer for the next scan.
 * @returns Timeout object created by setTimeout for next scan
 */
function scan() {
  // harvest any new images
  let num = scanDirectory(watch_dir, output_dir);

  // if we harvested any images, output to console
  if (num > 0) {
    console.log(`${num} files copied. Sleeping for ${timer_interval} seconds.`);
  }
  // update config file on disk with last scan time
  writeConfig();
  // set callback for next timeout
  ticker = Timers.setTimeout(scan, timer_interval * 1000);
  return ticker;
}

/**
 * Recursively scans `scan_dir` for files that match global `file_regex`. Copies
 * any new files created since previous scan into `out_dir`. Will not copy
 * any files located in "thumbnails" directories.
 * 
 * @param {string} scan_dir Directory from which to harvest files
 * @param {string} out_dir Directory into which to save files
 * @returns Number of files copied.
 */
function scanDirectory(scan_dir, out_dir) {
  /** Tracks number of files copied in this scan */
  let files_copied = 0;

  /** Array of files located in `scan_dir` */
  let files_in_dir = fs.readdirSync(scan_dir, { withFileTypes: true });

  // iterate through files in scan_dir
  for (const file of files_in_dir) {
    // if the file is a directory, then recursively scan it
    if (file.isDirectory()) {
      // skip thumbnails
      if (file.name != "thumbnails") {
        files_copied += scanDirectory(`${scan_dir}/${file.name}`, out_dir);
      }
    }
    // if a file and matches our regex (.jpg by default) then copy it to out_dir
    else if (file.isFile() && file_regex.test(file.name)) {
      /** Absolute path to source file. */
      let src_filename = `${scan_dir}/${file.name}`;
      /** Information of source file reported by file system */
      let fileStats = fs.statSync(src_filename);

      // only proceed if the file was created since our last scan
      if (fileStats.birthtimeMs > last_scan_time) {
        // a bit of a hack.. I'm running the harvester on a RaspberryPi file server
        // and steam on a windows desktop. Because the two machines times are not synchronized
        // I account for it by keeping track of the "latest" file that we scan
        // to prevent duplicate copies until the slower PC's time catches up with the faster
        if (fileStats.birthtimeMs > latest_time_scanned) {
          latest_time_scanned = fileStats.birthtimeMs;
        }

        // generate a filename based on system time + original file extension
        /** File extension of source file. */
        let file_extension = file_extension_regex.exec(file.name)[0];
        /** Output filename, generated based on system clock and original file extension. */
        let output_filename = new Date().getTime() + file_extension;

        // copy the file
        fs.copyFileSync(src_filename, `${out_dir}/${output_filename}`);
        files_copied++;
      }
    }
  }
  // update the last scan time global
  if (latest_time_scanned != last_scan_time) {
    last_scan_time = latest_time_scanned;
  }
  return files_copied;
}

/**
 * Writes configuration data to persist into next program execution.
 * Outputs to `config.json`.
 */
function writeConfig() {
  /** output `config.json` file */
  let fd = fs.openSync("config.json", "w");
  /** Config object to be serialized into JSON */
  let config_obj = {
    last_scan_time: last_scan_time
  };
  /** JSON-serialized configuration data */
  let data = JSON.stringify(config_obj, null, 2);
  fs.writeSync(fd, data);
  fs.closeSync(fd);
}

setup();
