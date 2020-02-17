const fs = require('fs');
const path = require('path');
const http = require('http');
const axios = require('axios');
const { JSDOM } = require('jsdom');

// file extension we wanna download
const regex = /invoice\.pdf$/;
// URL for search endpoint
const searchUrl = 'http://words2.wordss.com:8080/SEARCH.ASP';
// HTTP method of the search endpoint
const searchMethod = 'post';
// query paramater name for search endpoint (e.g. 'q' for https://www.google.com/search/?q=searchterm)
const searchParamName = 'SearchString';
// list of search terms we want to send to the search endpoint
const searchTerms = [
    '12554898',
    '23654895',
    '32564985',
];

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
                params: {
                    [searchParamName]: searchTerm
                }
            });

            parseSearchResults(result.data);
            return resolve();
        } catch(err) {
            return reject(err);
        };
    });
}

function parseSearchResults(result) {
    const dom = new JSDOM(result, { url: searchUrl });
    const links = dom.window.document.querySelectorAll('a');

    console.log(`Got search results with ${links.length} links`);
    for (let i = 0; i < links.length; i++) {
        if (links[i].href.match(regex)) {
            downloadFile(links[i].href);
        }
    }
}

function downloadFile(url) {
    console.log(`Downloading file: ${path.basename(url)}`);
    const filename = path.basename(url).replace(':', '_');
    const file = fs.createWriteStream(path.resolve('C:\\Users\\YOUR_ACCOUNT\\Desktop', filename));
    http.get(url, (response => response.pipe(file)));
}