let sort_down = 1;

function init() {

    window.addEventListener('click', function(e){
	
        if (!document.getElementById('dropdown-content').contains(e.target)){
            removeContentChildren();
        }
    });

    let container = document.getElementById('rows-container');

    for (let i = 0; i < database.length; i++) {

        let new_row = document.createElement("div");
        new_row.className = "film-row";

        let col1 = document.createElement("div");
        col1.className = "col1";
        col1.style = "grid-row: 1; padding-top: 2px;"
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
        if (database[i].d <= 3) score.className = "score7 ";       
        if (database[i].d <= 2.5) score.className = "score7p5 ";       
        if (database[i].d <= 2) score.className = "score8 ";
        score.className += "score-box";
        
        score.innerHTML = "<p>" + (10 - database[i].d).toString() + "</p>";
        new_row.appendChild(score);

        container.appendChild(new_row);
        database[i].element = new_row;

    }

    printRows(database);

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

    container.style.boxShadow = "rgba(0, 0, 0, 0.24) 0px 3px 8px;"

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
    printRows(database);

}

function backToTop() {

    document.getElementById("top-container").scrollTop = 0;

}

function filterByName() {

    let value = document.getElementById("search-box").value;
    console.log(value);

    let container = document.getElementById('rows-container');
    container.innerHTML = "";

    let new_database = database.filter(a => a.a.toLowerCase().includes(value.toLowerCase()));
    new_database.forEach(a => container.appendChild(a.element));

    printRows(new_database);

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

    printRows(database);
    
}

function printRows(array) {

    let height_acc = 0;

    for (let i = 0; i < array.length; i++) {
        array[i].element.style.top = (height_acc).toString() + "px";
        if (i % 2 == 1) {
            array[i].element.style.backgroundColor = 'var(--blue4)';
        } else {
            array[i].element.style.backgroundColor = 'var(--blue3)';  
        }
        height_acc += array[i].element.offsetHeight;
    }
}
