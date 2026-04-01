const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

const url = process.argv[2];
const userFormats = process.argv[3];

if (!url) {
  console.error("Usage: node index.js <url> [formats]");
  console.error("  formats: comma-separated list of audio extensions (e.g. mp3,flac,wav)");
  process.exit(1);
}

const audioDir = path.join(__dirname, "audio");

const fetchData = async () => {
  const result = await axios.get(url);
  return cheerio.load(result.data);
};

const download = async (fileUrl, filename) => {
  const filepath = path.join(audioDir, filename);
  const writer = fs.createWriteStream(filepath);

  const response = await axios.get(fileUrl, { responseType: "stream" });
  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
};

const start = async () => {
  fs.mkdirSync(audioDir, { recursive: true });

  const $ = await fetchData();

  const allFormats = ["mp3", "wav", "flac", "ogg", "aac", "m4a", "wma", "opus"];
  const formats = userFormats ? userFormats.split(",").map((f) => f.trim()) : allFormats;
  const selector = formats.map((ext) => `a[href$=".${ext}"]`).join(", ");

  const links = [];
  $(selector).each((index, value) => {
    const dlLink = `${url}/${$(value).attr("href")}`;
    const filename = decodeURIComponent(dlLink.replace(/^.*[\\\/]/, ""));
    links.push({ dlLink, filename });
  });

  for (const { dlLink, filename } of links) {
    try {
      await download(dlLink, filename);
      console.log(`Downloaded: ${filename}`);
    } catch (err) {
      console.error(`Failed to download ${filename}: ${err.message}`);
    }
  }
};

start();
