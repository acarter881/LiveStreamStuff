const fs = require("fs");
const path = require("path");
const http = require("http");
const axios = require("axios");

// URL for search endpoint
const searchUrl = "http://example.com:8080/SEARCH.ASP";
// HTTP method of the search endpoint
const searchMethod = "post";
// query parameter name for search endpoint (e.g., 'q' for https://www.google.com/search/?q=searchterm)
const searchParamName = "SearchString";

const inputFileName = "list.txt";

const searchTerms = fs
  .readFileSync(path.join(__dirname, inputFileName))
  .toString()
  .trim()
  .split("\n")
  .map(term => term.trim());

sendSearchRequest(searchTerms)
  .then(() => {
    console.log(`Total Searchterms: ${searchTerms.length}`);
    console.log("No files found for the following number:");
    filesNotFound.forEach(term => console.log(term));
  })
  .catch(console.error);

const filesNotFound = [];

async function sendSearchRequest(searchTerms) {
  for (searchTerm of searchTerms) {
    await handleSearchRequest(searchTerm);
  }
}

function handleSearchRequest(searchTerm) {
  if (!searchTerm) {
    return;
  }

  return new Promise(async (resolve, reject) => {
    try {
      console.log(`Searching: ${searchTerm}`);
      const result = await axios.request(searchUrl, {
        method: searchMethod,
        data: `${searchParamName}=${searchTerm}&Action=Go`
      });

      parseSearchResults(result.data, searchTerm);
      return resolve();
    } catch (err) {
      return reject(err);
    }
  });
}

function parseSearchResults(result, searchTerm) {
  const codeRegex = new RegExp(
    `<a[^>]*?javascript:NAF\\('(.*?${searchTerm}.*?(?:invoice|credit memo)\\.pdf)'.*?\\)[^>]*?>`,
    "gi"
  );
  let lastLink = "";
  let found = false;

  while ((match = codeRegex.exec(result))) {
    const link = match[1];
    if (link != lastLink) {
      downloadFile(match[1]);
      found = true;
      lastLink = link;
    }
  }

  if (!found) {
    filesNotFound.push(searchTerm);
  }
}

async function downloadFile(url) {
  console.log(`Downloading file: ${path.basename(url)}`);
  const filename = path.basename(url).replace(":", "_");
  const file = fs.createWriteStream(path.join(__dirname, "download", filename));

  const response = await axios.request({
    url,
    method: "GET",
    responseType: "stream"
  });

  response.data.pipe(file);

  return new Promise((resolve, reject) => {
    file.on("finish", resolve);
    file.on("error", reject);
  });
}
