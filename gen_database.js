const puppeteer = require('puppeteer');
var fs = require("fs");
let { ratings_array } = require('./ratings_array.js');
const { get } = require('http');
var new_ratings_array = [];
var list_to_google = [];
let google_cookie = true;

//let test = [{"a": "test"}];
//console.log(test.find(a => a.a == "tost") || {"contributor": {"name": "test"}});
//return


createBackup();
removeExpiredFilms();
createNewBrowser();

async function createNewBrowser() {

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setUserAgent('Chrome/113.0.5672.127');

    await getiPlayerFilms(page);
    await searchNewBBCFilms(page);

    list_to_google = [];
    await getITVXFilms(page);
    await searchNewITVFilms(page);

    list_to_google = [];
    await getAll4Films(page);
    await searchNewAll4Films(page);

    browser.close();
    saveRatings();  //need to wait for all searching to complete before saving. await can't be used at top level?

}

function getPropertyFromString(data, start_term, end_term) {

    let start = data.indexOf(start_term) + start_term.length;
    if (start == start_term.length - 1) return null;
    let end = data.indexOf(end_term, start);
    return data.substring(start, end);

}

async function searchGoogle(page, url) {

    await page.goto(url);
    
    if (google_cookie) {
        await page.click('[class="basebutton button searchButton"]');
        await timeout(1000);
        google_cookie = false;
    }

    let source = await page.content();
    let end = source.indexOf('class="oqSTJd"');     //search for rating class

    if (end > -1) {

        let start = source.lastIndexOf("https://www.imdb.com/title/", end) + "https://www.imdb.com/title/".length;
        end = source.indexOf("/", start);
        return "https://www.imdb.com/title/" + source.substring(start, end);
        
    } else {

        let start = source.indexOf("https://www.imdb.com/title/")  + "https://www.imdb.com/title/".length;
        end = source.indexOf("/", start);
        return "https://www.imdb.com/title/" + source.substring(start, end);

    }

}

async function visitIMDb(page, url, film) {

    await page.goto(url);
    source = await page.content();
    film.year = getObjectFromString(source, '"releaseYear":' ).year;
    film.rating =  getObjectFromString(source, '"aggregateRating":').ratingValue;
    
    new_ratings_array.push(film);

    if (film.platform == "BBC") {
        let imdb_title = getPropertyFromString(source, '"name":"', '"');
        console.log([film.title, film.director, imdb_title]);
    }

}


async function searchNewAll4Films(page) {

    try {

        for (let i = 0; i < list_to_google.length; i++) {

            let film = list_to_google[i];
            console.log(film.title);

            //search Channel 4
            await page.goto(film.link); 
            let source = await page.content();
            film.availability = Math.round(Date.parse(getPropertyFromString(source, 'endDate":"', '"')) / 1000);
            film.year = Number(getPropertyFromString(source, '"description":"(', ')'));
            film.duration = Number(getPropertyFromString(source,'"durationLabel":"', ' '));

            if (film.duration < 45) {
                new_ratings_array.push(film);
                await timeout(60000);
                continue;
            }

            console.log(film);

            //visit google and IMDb
            url = 'https://www.google.co.uk/search?q=' + encodeRFC3986URIComponent(film.title + " film " + film.year + " imdb /10");
            let imdb_link = await searchGoogle(page, url);
            await visitIMDb(page, imdb_link, film);

            await timeout(60000);
    
        };

    } catch {

        console.log("Error getting data! Hope this saves...");

    }

}


async function searchNewITVFilms(page) {

    try {

        for (let i = 0; i < list_to_google.length; i++) {

            let film = list_to_google[i];
            console.log(film.title);
    
            //search ITV
            await page.goto(film.link); 
            let source = await page.content();
            let film_info = getObjectFromString(source, '"application/json">');
            film.availability = Math.round(Date.parse(getPropertyFromObject(film_info, "availableUntil")) / 1000);
            film.year = getPropertyFromObject(film_info, "productionYear");

            //visit google and IMDb
            url = 'https://www.google.co.uk/search?q=' + encodeRFC3986URIComponent(film.title + " film " + film.year + " imdb /10");
            let imdb_link = await searchGoogle(page, url);
            await visitIMDb(page, imdb_link, film);

            await timeout(60000);
    
        };

    } catch {

        console.log("Error getting data! Hope this saves...");

    }

}

async function searchNewBBCFilms(page) {

    try {

        for (let i = 0; i < list_to_google.length; i++) {

            let film = list_to_google[i];
            console.log(film.title);
    
            //visit iplayer for year/director...
            let url = "https://www.bbc.co.uk/programmes/" + film.id;
            await page.goto(url);
            let source = await page.content();
            let credits = getObjectFromString(source, '"contributor":' );

            if (credits) {
                let director_credit = credits.find((a) => a.roleName == "Director") || {"contributor": {"name": ""}};
                film.director = director_credit.contributor.name;
            } else {
                film.director = "";
            }

            let end_date = Date.parse(getPropertyFromString(source, 'endDate":"', '"')) / 1000 || Math.floor(Date.now() / 1000) + 31536000;
            if (end_date) {
                film.availability = end_date;
            } else {

                url = "https://www.bbc.co.uk/iplayer/episode/" + film.id;
                await page.goto(url);
                source = await page.content();
                film.availability = getPropertyFromString(source, '"endTime":', ",");

            }

            //visit google
            url = 'https://www.google.co.uk/search?q=' + encodeRFC3986URIComponent(film.title + " film " + film.director + " imdb /10");
            let imdb_link = await searchGoogle(page, url);
            await visitIMDb(page, imdb_link, film);

            await timeout(60000);
    
        };

    } catch {

        console.log("Error getting data! Hope this saves...");

    }

}

async function getiPlayerFilms(page) {

    let bbc_url = "https://www.bbc.co.uk/iplayer/categories/films/a-z?page="
    let page_number = 1;

    while (true) {

        console.log("Searching iPlayer, page " + page_number.toString() + "..." );
        await page.goto(bbc_url + page_number.toString());
        let source = await page.content();

        let film_array = getObjectFromString(source, '"elements":').filter((a) => a.programme_type == 'one-off');
        console.log(film_array.length.toString() + " films found...");
        film_array.forEach((film) => processBBCFilmObject(film));

        let page_info = getObjectFromString(source, '"pagination":');
        let last_page_number = getPropertyFromObject(page_info, "totalPages");
        if (page_number < last_page_number) {
            page_number++;
            await timeout(10000);
        } else {
            break;
        }

    }

}

async function getITVXFilms(page) {

    console.log("Searching ITVX..." );
    await page.goto("https://www.itv.com/watch/collections/films/6D2ZDICRbTr3UnRebcr0D8");
    let source = await page.content();

    let film_array = getObjectFromString(source, '"shows":').filter((a) => a.contentType == 'film');
    film_array = film_array.filter((a) => a.tagNames === null);
    film_array.forEach((film) => processITVFilmObject(film));

}


async function getAll4Films(page) {

	await page.goto('https://www.channel4.com/categories/film', { waitUntil: 'networkidle0' });

    //accept cookies
    await page.click('[class="all4-cc-primary-button all4-cc-typography-body false row-margin-sm-0 row-margin-md-0 row-margin-lg-0 col-xs-1-12 col-sm-7-6 col-md-7-6 col-lg-7-6"]');

    //expand show more
    await page.click('[class="all4-secondary-button all4-typography-body"]');
    await timeout(1000);
    while (true) {
        if (await page.$('[class="all4-secondary-button all4-typography-body"]')) {
            await page.click('[class="all4-secondary-button all4-typography-body"]');
            await timeout(1000);
        } else {
            break;
        }
    }

    //generate a list of links...
    let list_of_links = await page.evaluate(() => {
        let data = [];
        let elements = document.getElementsByTagName("a");
        for (var element of elements) {
            if (element.className == "all4-slice-item") {
                data.push(element.href);
            }
        }
        return data
    });

    //generate list of titles
    let list_of_titles = await page.evaluate(() => {
        let data = [];
        let elements = document.getElementsByClassName("all4-slice-item__title size-compact");
        for (var element of elements) {
            data.push(element.textContent);
        }
        return data
    });

    console.log(list_of_links.length);
    
    for (let i = 0; i < list_of_titles.length; i++) {
        
        let new_film = {};
        new_film.title = removeBrackets(list_of_titles[i]);

        //skip if film is an Iris Prize 2022 collection
        if (new_film.title.includes("Iris Prize 2022")) {
            console.log("skipping...");
            continue;                
        }

        let found_film = new_ratings_array.find((film) => film.title == new_film.title && film.platform == "Channel 4");
        if (!found_film) {
            new_film.platform = "Channel 4";
            new_film.link = new_film.title.includes("?") ? list_of_links[i] : list_of_links[i].split("?")[0];
            list_to_google.push(new_film);
        }

    }

}


function processBBCFilmObject(film) {

    let new_film = {};
    new_film.title = removeBrackets(getPropertyFromObject(film, "title"));
    new_film.duration = Number(getPropertyFromObject(film, "duration").text.slice(0, -5));
    if (new_film.duration < 45) return;

    let found_film = new_ratings_array.find((film) => (film.title == new_film.title && film.platform == "BBC"));
    if (!found_film) {
        new_film.id = getPropertyFromObject(film, "id");
        new_film.platform = "BBC";
        list_to_google.push(new_film);
    }

}

function processITVFilmObject(film) {

    let new_film = {};
    new_film.title = removeBrackets(getPropertyFromObject(film, "title"));
    let runtimeText = getPropertyFromObject(film, "contentInfo");
    new_film.duration = runtimeText.split(" ").reduce((a, b) => a + ((b.substring(b.length - 1) == "h") ? 60 : 1) * Number(b.slice(0, -1)), 0);
    if (new_film.duration < 45) return;

    let found_film = new_ratings_array.find((film) => (film.title == new_film.title && film.platform == "ITV"));
    if (!found_film) {
        new_film.link = "https://www.itv.com/watch/" + getPropertyFromObject(film, "titleSlug") + "/" + getPropertyFromObject(film, "encodedProgrammeId").letterA;
        new_film.platform = "ITV";
        list_to_google.push(new_film);
    }

}

function saveRatings() {

    console.log("Saving data...");
    let output_string = 'let ratings_array = '
    output_string += JSON.stringify(new_ratings_array) + ";\n\nmodule.exports = { ratings_array };"
    fs.writeFileSync('ratings_array.js', output_string);
    console.log("Data saved!");
    genDatabase();

}

function genDatabase() {

    new_ratings_array = new_ratings_array.filter(a => a.duration > 44);
    new_ratings_array.sort((a,b) => (a.title > b.title) ? 1 : ((b.title > a.title) ? -1 : 0));
    new_ratings_array.sort((a,b) =>  b.rating - a.rating);

    let new_datebase = new_ratings_array.map(a => new_db_object(a));
    let output_string = 'let database = '
    output_string += JSON.stringify(new_datebase) + ";"
    fs.writeFileSync('database.js', output_string);
    console.log("Data saved!");    

}

function new_db_object(film) {

    let output = {};
    output.a = convertTitle(film.title);
    output.b = (10 - film.rating).toFixed(1);
    output.c = film.availability;
    output.d = getLink(film);
    output.e = getPlatform(film.platform);
    output.f = film.year;
    return output;

}

function getPlatform(platform) {

    if (platform == "BBC") return "bbc";
    if (platform == "ITV") return "itv";
    if (platform == "Channel 4") return "c4";

}

function getLink(film) {

    if (film.id) {
        return "https://www.bbc.co.uk/iplayer/episode/" + film.id;
    } else {
        return film.link;
    }


}

function getRuntime(duration) {

    let hours = Math.floor(duration / 60);
    let mins = duration % 60;
    return hours.toString() + "h " + mins.toString() + "m";

}

function getAvailability(availability) {

    var new_date = new Date(availability * 1000);
    var date_string = "";
    date_string += ("0" + new_date.getHours()).slice(-2) + ":";
    date_string += ("0" + new_date.getMinutes()).slice(-2) + " @ ";
    date_string += ("0" + new_date.getDate()).slice(-2) + "/";
    date_string += ("0" + (new_date.getMonth() + 1)).slice(-2) + "/";
    date_string += (new_date.getFullYear()).toString().slice(-2)
    return date_string;

}

function convertTitle(title) {

    let arr = Array.from(title);
    arr.forEach((a, b, c) => {
        if (parseInt(a.charCodeAt(0)) > 127) {
            c[b] = '&#' + a.charCodeAt(0);
        }
    });
    return arr.join("");

}


function removeBrackets(title) {

    return (title.slice(-1) == ")") ? title.substring(0, title.indexOf("(") - 1) : title;

}

function createBackup() {

    console.log("Making backup...");
    let output_string =  'let ratings_array = ' + JSON.stringify(ratings_array) + ";\n\nmodule.exports = { ratings_array };"
    fs.writeFileSync('backup.js', output_string);

}

function removeExpiredFilms() {

    var time_now = Date.now();
    ratings_array.forEach(a => {if (a.availability * 1000 > time_now) new_ratings_array.push(a)});

}

function getObjectFromString(data, start_string) {

    if (data.indexOf(start_string) == -1) return null;
    let start = data.indexOf(start_string) + start_string.length;
    let end = start;
    let score1 = 0;
    let score2 = 0;

    while (true) {
        if (data[end] == "[") score1++;
        if (data[end] == "]") score1--;
        if (data[end] == "{") score2++;
        if (data[end] == "}") score2--;
        end++;
        if (score1 == 0 && score2 == 0) break;
    }

    return JSON.parse(data.substring(start, end));

}

function getPropertyFromObject(object, property) {

    for (a in object) {

        if (a == property) return object[a];

        if (typeof object[a] == 'object') {
            var result = getPropertyFromObject(object[a], property);
            if (result) return result;
        }

    }

    return null;

}

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function encodeRFC3986URIComponent(str) {
    return encodeURIComponent(str)
        .replace(
        /[!'()*]/g,
        (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
    );
}