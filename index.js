const userDownloadsFolder = require("downloads-folder");
const axios = require("axios");
const cheerio = require("cheerio");
const http = require("http");
const fs = require("fs");
const path = require("path");

const url = "";

const fetchData = async () => {
  const result = await axios.get(url);
  return cheerio.load(result.data);
};

const download = function (
  url,
  filename,
  cb = () => console.log("downloading")
) {
  var file = fs.createWriteStream(path.join(__dirname, "audio", filename));

  http
    .get(url, function (response) {
      response.pipe(file);

      file.on("finish", function () {
        file.close(cb); // close() is async, call cb after close completes.
      });
    })
    .on("error", function (err) {
      // Handle errors
      fs.unlink(file); // Delete the file async. (But we don't check the result)
      if (cb) cb(err.message);
    });
};

const start = async () => {
  const $ = await fetchData();

  //create links object [...{filename: filepath}]
  $('a[href*="mp3"]').each((index, value) => {
    const dlLink = `${url}/${$(value).attr("href")}`;
    const filename = dlLink.replace(/^.*[\\\/]/, "").replace(/%20/, "-");
    //const fileName = formatFilename(value);
    download(dlLink, filename, () => console.log(`Downloaded: ${filename}`));
  });
};

start();
