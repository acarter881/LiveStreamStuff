const fs = require("fs");
const path = require("path");
const axios = require("axios");

// URL for search endpoint
const searchUrl = "http://example.com:8080/SEARCH.ASP";
// HTTP method of the search endpoint
const searchMethod = "get";

const inputFileName = "list.txt";

const searchTerms = fs
    .readFileSync(path.join(__dirname, inputFileName))
    .toString()
    .trim()
    .split('\n')
    .map(term => term.trim());

sendSearchRequest(searchTerms)
    .then(() => {
        console.log(`Total Searchterms: ${searchTerms.length}`);
        console.log('No files found for the following number:');
        filesNotFound.forEach(term => console.log(term));
    })
    .catch(console.error);

const filesNotFound = [];

const wait = async (timeout) => new Promise((resolve) => setTimeout(resolve, timeout));

async function sendSearchRequest(searchTerms) {
    for (searchTerm of searchTerms) {
        await handleSearchRequest(searchTerm);
        await wait(400);
    }
}

function handleSearchRequest(searchTerm, page = 1) {
    if (!searchTerm) {
        return;
    }

    return new Promise(async (resolve, reject) => {
        try {
            console.log(`Searching: ${searchTerm}`);
            const result = await axios.request(searchUrl, {
                method: searchMethod,
                data: `qu=${searchTerm}&Advanced=&sc=%2F&pg=${page}&RankBase=1000`
            });

            parseSearchResults(result.data, searchTerm, page);
            return resolve();
        } catch (err) {
            return reject(err);
        }
    });
}

function parseSearchResults(result, searchTerm, page) {
    const codeRegex = new RegExp(`<a[^>]*?javascript:NAF\\('(.*?${searchTerm}.*?(?:invoice|credit memo)\\.pdf)'.*?\\)[^>]*?>`, 'gi');
    const nextRegex = /"Next 10 documents"/im;
    let lastLink = '';
    let found = false;

    console.log(`Searching on page: ${page}`);

    while (match = codeRegex.exec(result)) {
        const link = match[1];
        if (link != lastLink) {
            downloadFile(match[1]);
            found = true;
            lastLink = link;
        }
    }

    if (nextRegex.test(result)) {
        return handleSearchRequest(searchTerm, page + 1);
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
        method: 'GET',
        responseType: 'stream',
    });

    response.data.pipe(file);

    return new Promise((resolve, reject) => {
        file.on('finish', resolve);
        file.on('error', reject);
    });
}
