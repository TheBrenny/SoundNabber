// TODO: Add a finish event to the requests!

const snDebugging = true;

var request = require("request");
var fs = require("fs");
var colors = require("colors");
var readlineSync = require("readline-sync");
var cron = require("node-cron");

var saveLocation;
var username;
var playlist;
var cronJob;
var trackCount = 0;
var takenTracks = []; // list of IDs
var tracksToTake = []; // list of URLs

var ext = {
  ids: {
    clientId: "a3e059563d7fd3372b49b37f00a00bcf",
    clientId2: "b45b1aa10f1ac2941910a7f0d10f8e28"
  }
};

var log = function(d) {
  if(snDebugging) console.log(d);
}

Object.prototype.equals = function(x) {
  var p;
  for(p in this) if(typeof(x[p])=='undefined') return false;

  for(p in this) {
    if(this[p]) {
      switch(typeof(this[p])) {
        case 'object':
          if(!this[p].equals(x[p])) return false;
          break;
        case 'function':
          if(p != 'equals' && this[p].toString() != x[p].toString()) return false;
          break;
        default:
          if(this[p] != x[p]) return false;
          break;
      }
    } else {
      if(x[p]) return false;
    }
  }
  for(p in x) if(typeof(this[p])=='undefined') return false;
  return true;
}
Object.prototype.cloneData = function() {
  return JSON.parse(JSON.stringify(this));
}

var saveTrackIds = function(decrease) {
  if(decrease) trackCount--;
  if(trackCount > 0) {
    log(("[i] Not saving track IDs yet. " + trackCount + " more to go...").cyan);
    return;
  }
  trackCount = 0;
  fs.writeFile("sn_tracks.json", JSON.stringify(takenTracks), function(e) {
    var wE = e ? " with errors" : "";
    if(e) console.error(("[x] " + e).red);
    log(("[+] Nabbed tracks list saved" + wE + ".").green);
  });
};

var loadConfiguration = function() {
  log("[i] Loading configuration...".cyan);
  var cfg = JSON.parse(fs.readFileSync("sn_config.json"));
  var cfgClone = cfg.cloneData();
  username = cfg.username || readlineSync.question("[!] Username perma: ".yellow);
  cfg.username = username;
  playlist = cfg.playlist || readlineSync.question("[!] Playlist perma: ".yellow);
  cfg.playlist = playlist;
  saveLocation = cfg.saveLocation || readlineSync.question("[!] Save Location: ".yellow);
  cfg.saveLocation = saveLocation;
  cronJob = cfg.cronJob || readlineSync.question("[!] Cron Job (default: \"0 0 0,12 * * *\"): ".yellow) || "0 0 0,12 * * *";
  cfg.cronJob = cronJob;
  log("[+] Configuration loaded.".green);
  log("[i] Loading nabbed tracks list...".cyan);
  takenTracks = JSON.parse(fs.readFileSync("sn_tracks.json"));
  log("[+] Nabbed tracks list loaded.".green);
  return !cfg.equals(cfgClone);
};

var saveConfiguration = function() {
  log("[i] Saving configuration...".cyan);
  var cfg = {
    "username": username,
    "playlist": playlist,
    "saveLocation": saveLocation,
    "cronJob": cronJob
  };
  fs.writeFile("sn_config.json", JSON.stringify(cfg), function(e) {
    var wE = e ? " with errors" : "";
    if(e) console.error(("[x] " + e).red);
    log(("[+] Configuration saved" + wE + ".").green);
  });
};

var generateApiUrl = function(trackUrl) {
  return "https://api.soundcloud.com/resolve.json?url=" + escape(trackUrl) + "&client_id=" + ext.ids.clientId;
};

var generatePlaylistUrl = function() {
  return "https://soundcloud.com/" + username + "/sets/" + playlist;
};

var tryGetTrack = function(url) {
  log(("[i] Trying to nab a track: " + url).cyan);
  var title;
  var perm = url.split("/").pop()
  var token;
  var apiLink = generateApiUrl(url);
  "s-" == perm.substr(0, 2) && (token = perm, apiLink = apiLink + "&secret_token=" + secretToken);
  request(apiLink,function(e, r, b) {
    if(e) console.error(("[x] " + e).red);
    else {
      var data = JSON.parse(b);
      title = data.title;
      if(data.id) {
        var id = data.id.toString();
        log(("[+] Track found: \"" + title + "\" [" + id + "]").green);
        request("https://api.soundcloud.com/i1/tracks/" + id + "/streams?client_id=" + ext.ids.clientId, function(ee, rr, bb) {
          if(ee) console.error(("[x] " + ee).red);
          else {
            var sound = JSON.parse(bb);
            if(sound.http_mp3_128_url) {
              log(("[+] Track url found. \"" + title + "\" [" + id + "] seems legitimate...").cyan);
              downloadTrack(id, title, sound.http_mp3_128_url);
            }
          }
        });
      }
    }
  });
};

var downloadTrack = function(id, title, url) {
  log(("[i] Downloading track: " + title + ", [" + id + "]").cyan);
  var file = fs.createWriteStream(saveLocation + title + ".mp3");
  request(url).on("complete", function() {
    log(("[+] Track \"" + title + "\" [" + id + "] downloaded!").green);
    takenTracks.push(id);
    saveTrackIds(true);
  }).pipe(file);
};

var pollPlaylist = function() {
  log("[i] Polling playlist...".cyan);
  var tracks;
  request(generateApiUrl(generatePlaylistUrl()), function(e,r,b) {
    if(e) console.error(("[x] " + e).red);
    else {
      log("[i] Playlist found. Detecting new tracks...".cyan);
      var tracks = JSON.parse(b).tracks;
      tracksToTake = [];
      var i = 0;
      for(i = 0; i < tracks.length; i++) {
        if(takenTracks.indexOf(tracks[i].id.toString()) == -1) tracksToTake.push(tracks[i].permalink_url);
      }
      trackCount = tracksToTake.length;
      log(("[+] Playlist polled. New tracks found: " + trackCount).green);
      for(i = 0; i < tracksToTake.length; i++) tryGetTrack(tracksToTake[i]) && tracksToTake.splice(i--, 1);
    }
  });
}

loadConfiguration() && saveConfiguration();
log(("[i] Scheduling cron job for " + cronJob + ".").cyan);
cron.schedule(cronJob, function() {
  log((new Date().toString().substring(4,24) + " - Running.").cyan);
  pollPlaylist();
});
log(("[!] Alright " + username + "! Jump to SoundCloud from anywhere and add tracks to " + playlist + ".").yellow);
setTimeout(function() {
  log("[i] Initial poll!".cyan);
  pollPlaylist();
}, 3000);
