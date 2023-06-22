let sort_down = 1;
let current_page;
let current_db;
let display_date = true;

function init() {

    let header = document.getElementById("back-to-top");

    document.addEventListener("scroll", (event) => {

        lastKnownScrollPosition = window.scrollY;
        if (lastKnownScrollPosition > 100) {

            header.style.visibility = "visible";
            header.style.top = lastKnownScrollPosition.toString() + "px";

        } else {

            header.style.visibility = "hidden";

        }

    });


    purgeExpiredFilms();
    addRemoveChildrenBehaviour();
    fillFooter(database, 0);

}

function createElements(db, page_value) {

    let container = document.getElementById("rows-container");
    container.innerHTML = "";
    let start_idx = 100 * page_value;
    let end_idx = Math.min(100 * (page_value + 1), db.length);
    let time_now = Math.floor( Date.now() / 1000 );

    for (let i = start_idx; i < end_idx; i++) {

        database[i].tr = getTimeRemaining(database[i].e, time_now);

        let new_row = document.createElement("div");
        new_row.className = "film-row";

        new_row.appendChild(getNewElement("col1", "grid-row: 1; padding-top: 2px; padding-left: 2px;", "<img src='" + db[i].h + ".png'></img>"));
        new_row.appendChild(getNewElement("col2", "grid-row: 1;", "<a href=" + db[i].g + " target='_blank'><b>" + db[i].a + " (" + db[i].i + ")</b></a>"));
        new_row.appendChild(getNewElement("col1", "grid-row: 2;",  "<p>&#9201</p>"));
        new_row.appendChild(getNewElement("col2", "grid-row: 2;",  "<p>" + (display_date ? db[i].f : db[i].tr) + "</p>"));

        let score = document.createElement("div");
        if (db[i].d <= 3) score.style = "color: var(--gold3);";       
        if (db[i].d <= 2.5) score.style = "color: var(--gold2);";       
        if (db[i].d <= 2) score.style = "color: var(--gold1);";
        score.className = "score-box";
        score.innerHTML = "<p>" + (10 - db[i].d).toString() + "</p>";
        new_row.appendChild(score);
        container.appendChild(new_row);

    }

    document.getElementById("time-btn").onclick = function() {changeTime(db, page_value)};

}

function getTimeRemaining(epoch_value, time_now) {

    let time_remaining = epoch_value - time_now;
    let d = Math.floor(time_remaining / 86400);
    if (d > 365) return "Over 1 year";
    if (d > 6) return d.toString() + " days";
    let h = Math.floor( (time_remaining % 86400) / 3600);
    if (h == 0 && d == 0) return "Less than 1 hour"
    if (d < 1) return h.toString() + " hour" + (h != 1 ? "s" : "");
    return d.toString() + " day" + (d != 1 ? "s " : " ") + h.toString() + " hour" + (h != 1 ? "s" : "");

}

function changeTime(db, page_value) {

    let container = document.getElementById("rows-container");
    let start_idx = 100 * page_value;
    let child_number = container.childElementCount;

    if (display_date) {
        for (i = 0; i < child_number; i++) {
            container.children[i].children[3].innerHTML = db[start_idx + i].tr;    
        }
        display_date = false;
    } else {
        for (i = 0; i < child_number; i++) {
            container.children[i].children[3].innerHTML = db[start_idx + i].f;    
        }
        display_date = true;
    }



}

function getNewElement(class_value, style_value, innerHTML_value) {

    let new_element = document.createElement("div");
    new_element.className = class_value;
    new_element.style = style_value;
    new_element.innerHTML = innerHTML_value;
    return new_element

}

function fillFooter(db, page_value) {

    let max_value = Math.ceil(db.length / 100);
    let container = document.getElementById("numbers-container");
    container.innerHTML = "";
    container.style.width = (max_value * 38).toString() + "px";

    for (let i = 0; i < max_value; i++) {

        let new_number = document.createElement("div");
        new_number.className = "foot-number";
        new_number.innerText = (i + 1).toString();

        container.appendChild(new_number);
        if (i == page_value) {
            container.children[i].style.backgroundColor = "var(--blue4)";
        } else {
            container.children[i].onclick = function() {fillFooter(db, i)};
        }
    
    }

    createElements(db, page_value);
    
}

function purgeExpiredFilms() {

    let time_now = Math.floor(Date.now() / 1000);
    database = database.filter(a => a.e > time_now);

}

function addRemoveChildrenBehaviour() {

    window.addEventListener('click', function(e){

        if (!document.getElementById('dropdown-content').contains(e.target)) removeContentChildren();

    });

}

function removeContentChildren() {

    let container = document.getElementById('dropdown-content');
    while (container.childElementCount > 1) {
        container.removeChild(container.lastChild);
    }

    let value = document.getElementById("btn-value").innerHTML.split("<")[0];
    document.getElementById("dropdown-content").children[0].onclick = function() { showDropdown(value) };

}

function showDropdown(value) {

    let container = document.getElementById("dropdown-content");
    container.children[0].onclick = function() { dropdownSelect(value) };

    function createNewElement(value2) {
        let ele = document.createElement("div");
        ele.className = "dropdown-btn";
        ele.onclick = function() { dropdownSelect(value2) };
        ele.innerText = value2;
        container.appendChild(ele);
    }

    createNewElement("Availability");
    createNewElement("IMDb Rating");
    createNewElement("Title");
    createNewElement("Year");

}

function dropdownSelect(value) {
    
    document.getElementById("btn-value").innerHTML = value + '<span style="float: right;">&#9660</span>';
    removeContentChildren();

    let az_button = document.getElementById("az-btn");
    az_button.onclick = function() { flipOrder(value) };

    sortFilms(value);

}

function flipOrder() {

    document.getElementById("a-label").innerText = (sort_down == 1 ? "A" : "Z");
    document.getElementById("z-label").innerText = (sort_down == 1 ? "Z" : "A");
    
    sort_down *= -1;
    database.reverse();
    filterByName();

}

function backToTop() {

    window.scrollTo(0, 0);

}

function filterByName() {

    let value = document.getElementById("search-box").value;
    let new_database = database.filter(a => a.a.toLowerCase().includes(value.toLowerCase()));
    fillFooter(new_database, 0);

}

function sortFilms(value) {

    let variable;
    if (value == "Title") variable = 'a';
    if (value == "IMDb Rating") variable = 'd';
    if (value == "Availability") variable = 'e';
    if (value == "Year") variable = 'i';

    if (value == "Title") {
        database.sort((a,b) => (a[variable] > b[variable]) ? 1 * sort_down: ((b[variable] > a[variable]) ? -1 * sort_down: 0));
    } else {
        database.sort((a,b) => (a[variable] - b[variable]) * sort_down);
    }

    filterByName();
    
}