const fs = require("fs");
const path = require("path");
const http = require("http");
const axios = require("axios");

// URL for search endpoint
const searchUrl = "http://words2.wordss.com:8080/SEARCH.ASP";
// HTTP method of the search endpoint
const searchMethod = "post";
// query parameter name for search endpoint (e.g., 'q' for https://www.google.com/search/?q=searchterm)
const searchParamName = "SearchString";
// list of search terms we want to send to the search endpoint
const searchTerms = ["12554898", "23654895", "32564985"];

sendSearchRequest(searchTerms).catch(console.error);

async function sendSearchRequest(searchTerms) {
  for (searchTerm of searchTerms) {
    await handleSearchRequest(searchTerm);
  }
}

function handleSearchRequest(searchTerm) {
  return new Promise(async (resolve, reject) => {
    try {
      console.log(`Searching: ${searchTerm}`);
      const result = await axios.request(searchUrl, {
        method: searchMethod,
        data: {
          [searchParamName]: searchTerm,
          Action: 1
        }
      });

      parseSearchResults(result.data);
      return resolve();
    } catch (err) {
      return reject(err);
    }
  });
}

const codeRegex = /<a[^>]*?javascript:NAF\('(.*?invoice\.pdf)'.*?\)[^>]*?>/gi;
function parseSearchResults(result) {
  console.log("RESULT:", result);
  let match = codeRegex.exec(result);

  while (match !== null) {
    downloadFile(match[1]);
    codeRegex.exec(result);
  }
}

function downloadFile(url) {
  console.log(`Downloading file: ${path.basename(url)}`);
  const filename = path.basename(url).replace(":", "_");
  const file = fs.createWriteStream(path.join(__dirname, "download", filename));
  http.get(url, response => response.pipe(file));
}
