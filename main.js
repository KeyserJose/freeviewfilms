let sort_down = 1;
let current_page;
let current_db;

function init() {

    console.log(database.length);

    purgeExpiredFilms();
    addRemoveChildrenBehaviour();
    fillFooter(database, 0);

}

function createElements(db, page_value) {

    let container = document.getElementById("rows-container");
    container.innerHTML = "";
    let start_idx = 100 * page_value;
    let end_idx = Math.min(100 * (page_value + 1), db.length);

    for (let i = start_idx; i < end_idx; i++) {

        let new_row = document.createElement("div");
        new_row.className = "film-row";

        let col1 = document.createElement("div");
        col1.className = "col1";
        col1.style = "grid-row: 1; padding-top: 2px; padding-left: 2px;"
        col1.innerHTML = "<img src='" + db[i].h + ".png'></img>"
        new_row.appendChild(col1);

        let name = document.createElement("div");
        name.className = "col2";
        name.style = "grid-row: 1;"
        name.innerHTML = "<a href=" + db[i].g + " target='_blank'><b>" + db[i].a + " (" + db[i].i + ")</b></a>";
        new_row.appendChild(name);

        let clock = document.createElement("div");
        clock.className = "col1";
        clock.style = "grid-row: 2;"
        clock.innerHTML = "<p>&#9201</p>";
        new_row.appendChild(clock);

        let timeleft = document.createElement("div");
        timeleft.className = "col2";
        timeleft.style = "grid-row: 2;"
        timeleft.innerHTML = "<p>" + db[i].f + "</p>";
        new_row.appendChild(timeleft);

        let score = document.createElement("div");
        if (db[i].d <= 3) score.style = "color: var(--gold3);";       
        if (db[i].d <= 2.5) score.style = "color: var(--gold2);";       
        if (db[i].d <= 2) score.style = "color: var(--gold1);";
        score.className = "score-box";
        
        score.innerHTML = "<p>" + (10 - db[i].d).toString() + "</p>";
        new_row.appendChild(score);
        container.appendChild(new_row);

    }

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

function buildRows() {

    for (let i = 0; i < database.length; i++) {

        let new_row = document.createElement("div");
        new_row.className = "film-row";

        let col1 = document.createElement("div");
        col1.className = "col1";
        col1.style = "grid-row: 1; padding-top: 2px; padding-left: 2px;"
        col1.innerHTML = "<img src='" + database[i].h + ".png'></img>"
        new_row.appendChild(col1);

        let name = document.createElement("div");
        name.className = "col2";
        name.style = "grid-row: 1;"
        name.innerHTML = "<a href=" + database[i].g + " target='_blank'><b>" + database[i].a + " (" + database[i].i + ")</b></a>";
        new_row.appendChild(name);

        let clock = document.createElement("div");
        clock.className = "col1";
        clock.style = "grid-row: 2;"
        clock.innerHTML = "<p>&#9201</p>";
        new_row.appendChild(clock);

        let timeleft = document.createElement("div");
        timeleft.className = "col2";
        timeleft.style = "grid-row: 2;"
        timeleft.innerHTML = "<p>" + database[i].f + "</p>";
        new_row.appendChild(timeleft);

        let score = document.createElement("div");
        if (database[i].d <= 3) score.style = "color: var(--gold3);";       
        if (database[i].d <= 2.5) score.style = "color: var(--gold2);";       
        if (database[i].d <= 2) score.style = "color: var(--gold1);";
        score.className = "score-box";
        
        score.innerHTML = "<p>" + (10 - database[i].d).toString() + "</p>";
        new_row.appendChild(score);
        database[i].element = new_row;

    }

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
    console.log(value);
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

    fillFooter(database, 0);
    
}

function printRows(value) {

    let max_value = Math.min((value + 1) * 100, database.length)
    let container = document.getElementById("rows-container");
    container.innerHTML = "";


    for (let i = value * 100 ; i < max_value ; i++) {
    
        database[i].element.style.backgroundColor = (i % 2 == 1) ? 'var(--blue3)' :  'var(--blue4)';
        container.appendChild(database[i].element);
    
    }

}
