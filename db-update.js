const Promise = require("bluebird");
const fs = Promise.promisifyAll(require('fs'));
const sqlite3 = Promise.promisifyAll(require('sqlite3').verbose());
const dbName = "roms.db"; //SQLite db file (in db folder)
const db = new sqlite3.Database('db/' + dbName);

let version = "1.0";
let bluePrint = JSON.parse( fs.readFileSync("data/blueprint.json") );
let bPKeys = Object.keys(bluePrint);
let bluePrintTotal = bPKeys.length;

let importName = "";
let normalFunction = false; //change this back to true

process.argv.shift(); //removes the node base path
process.argv.shift(); //removes this filename

const args = {
    "v": 0,
    "h": 0,
    "import": 1,
    "remove": 1,
    "show": 1,
}

const cliHelp = [];
cliHelp.push("");
cliHelp.push("db-update [no args]   = updates db with data in blueprint.json  ");
cliHelp.push("");
cliHelp.push("---Arg Options--------------------------------------------------");
cliHelp.push("-v                    = show version                            ");
cliHelp.push("-import {romname}     = get db row and imports to blueprint.json");
cliHelp.push("-remove {romname}     = removes a rom entry from blueprint.json ");
cliHelp.push("-show {romname}       = shows rom entry from blueprint.json     ");
cliHelp.push("----------------------------------------------------------------");
cliHelp.push("");

let argPackage = [];
let argErrors = [];
let a = 0;
let lastFlag = "";
while(a < process.argv.length){
    if(process.argv[a].indexOf('-') == 0){
        let flag = process.argv[a].substr(1);
        lastFlag = flag;
        try {
            if(typeof args[flag] !== "undefined"){
                argPackage[flag] = [];
                if(args[flag] === 0) argPackage[flag].push("");
                else{
                    for(var n = 0; n <= args[flag]; n++){
                        if(process.argv[a + n].indexOf('-') !== 0){
                            argPackage[flag].push(process.argv[a + n]);
                        }  
                    }
                    if((argPackage[flag].length) < args[flag]){
                        argErrors.push("Arg Error: '" + flag + "' expects " + args[flag] + " argument(s)");
                    }
                    a += n - 1;
                }
            }
            else throw flag;
        } catch (e) { argErrors.push("Arg Error: '" + e + "' is not a valid flag"); }
    }
    else argErrors.push("Unknown " + process.argv[a] + " argument for " + lastFlag + " (" + args[lastFlag] + " argument expected)");
    a++;
}

//lets check for errors, report and terminate
if(argErrors.length > 0){
    console.log("Error (see below): Program aborted");
    for(let e = 0; e < argErrors.length; e++) console.log(argErrors[e]);
    process.exit();
}
else if(a == 0) updateFromBluePrint(); //default behavour
else{
    //begin our functions from our flagged arguments
    if(argPackage.v) console.log("DB-Update Version: " + version);
    if(argPackage.h) cliHelp.forEach((helpline) => { console.log(helpline); });
    if(argPackage.import) romToJSON(argPackage.import[0]);
    if(argPackage.remove) removeJSON(argPackage.remove[0]);
    if(argPackage.show) showJSON(argPackage.show[0]);
}

function removeJSON(entryName){
    if(bPKeys.indexOf(entryName) !== -1){
        delete bluePrint[ entryName ];
        return Promise.delay(1000)
        .then((row) => { 
            if(fs.existsSyncAsync('data/blueprint.json')){
                return Promise.delay(1000)
                .then(() => { 
                    return fs.renameAsync('data/blueprint.json', 'data/blueprint.bkup')
                })
                .catch((e) => { log(e) })
                .then(() => {
                    console.log("Created: blueprint.bkup");
                    return
                });
            }
        })
        .then(() => {
            return Promise.delay(1000)
            .then(() => { 
                return fs.writeFileAsync('data/blueprint.json', JSON.stringify( bluePrint, null, "\t" ))
            })
            .catch((e) => { log(e) })
            .then(() => { console.log("Updated: blueprint.json"); });            
        });
    }
    else{
        console.log("Error: The entry '" + entryName + "' does not exist in the blueprint.json file");
        return
    }
}

function showJSON(entryName){
    if(bPKeys.indexOf(entryName) !== -1){
        console.log( bluePrint[entryName] );
    }
    else{
        console.log("Error: The entry '" + entryName + "' does not exist in the blueprint.json file");
        return
    }    
}

function romToJSON(entryName){
    if(bPKeys.indexOf(entryName) === -1){
        return db.getAsync("SELECT * FROM `p1i` WHERE `name` = '" + entryName +"'")
        .catch((e) => { log(e) })
        .then((row) => { 
            if(fs.existsSyncAsync('data/blueprint.json')){
                return Promise.delay(1000)
                .then(() => { 
                    return fs.renameAsync('data/blueprint.json', 'data/blueprint.bkup')
                })
                .catch((e) => { log(e) })
                .then(() => {
                    console.log("Created: blueprint.bkup");
                    newJSONObj = formatJSON(row);
                    Object.assign( bluePrint, newJSONObj );
                    return
                });
            }
        })
        .then(() => {
            return Promise.delay(1000)
            .then(() => { 
                return fs.writeFileAsync('data/blueprint.json', JSON.stringify( bluePrint, null, "\t" ))
            })
            .catch((e) => { log(e) })
            .then(() => { console.log("Updated: blueprint.json"); });            
        });
    }
    else{
        console.log("Error: The entry '" + entryName + "' is already in the blueprint.json file");
        return
    }
}



const updateRom = (upArray) => new Promise((resolve, reject) => {
    db.run( "UPDATE `p1i` SET" +  
        "`element_1` = $element_1," +
        "`element_2` = $element_2," +
        "`element_3` = $element_3," +
        "`element_4` = $element_4," +
        "`element_5` = $element_5," +
        "`element_6` = $element_6," +
        "`element_7` = $element_7," +
        "`element_8` = $element_8," +
        "`element_9` = $element_9," +
        "`version` = $version " +
        "WHERE `name` = $name", {
            $name:      upArray.name,
            $element_1: upArray.element_1,
            $element_2: upArray.element_2,
            $element_3: upArray.element_3,
            $element_4: upArray.element_4,
            $element_5: upArray.element_5,
            $element_6: upArray.element_6,
            $element_7: upArray.element_7,
            $element_8: upArray.element_8,
            $element_9: upArray.element_9,
            $version: upArray.version
        }, function(err) {
            if(err) return reject(err);
            return resolve();
    });
});

function updateFromBluePrint(){
    bPKeys.forEach(function(bPKey, index){
        return Promise
        .delay(100)
        .then(() => { 
            return updateRom({
            "name": bPKey,
            "element_1":  buildElement(bluePrint[ bPKey ].element_1),
            "element_2":  buildElement(bluePrint[ bPKey ].element_2),
            "element_3":  buildElement(bluePrint[ bPKey ].element_3),
            "element_4":  buildElement(bluePrint[ bPKey ].element_4),
            "element_5":  buildElement(bluePrint[ bPKey ].element_5),
            "element_6":  buildElement(bluePrint[ bPKey ].element_6),
            "element_7":  buildElement(bluePrint[ bPKey ].element_7),
            "element_8":  buildElement(bluePrint[ bPKey ].element_8),
            "element_9":  buildElement(bluePrint[ bPKey ].element_9),
            "version": bluePrint[ bPKey ].version
            });
        })
        .then(() => {
            return console.log("Updated DB Entry for: " + bPKey); 
        });
    });
}

function buildElement(elementObj){
    let cellCSV = ""
    if(typeof elementObj.device !== "undefined"){
        cellCSV += elementObj.device + ",";
        cellCSV += elementObj.design + ",";
        cellCSV += elementObj.relX + ",";
        cellCSV += elementObj.relY + ",";
        cellCSV += elementObj.colour + ",";
        if(elementObj.label !== null && elementObj.label !== ""){
            cellCSV += elementObj.label;
        }
    }
    return cellCSV;
}

function formatJSON(row){
    let newBPEntry = {};
    newBPEntry[ row['name'] ] = {
        "version": row['version'],
        "element_1": "",
        "element_2": "",
        "element_3": "",
        "element_4": "",
        "element_5": "",
        "element_6": "",
        "element_7": "",
        "element_8": "",
        "element_9": ""
    }
    for(let e = 1; e < 9; e++){
        let elementArray = row["element_" + e].split(',');
        if(elementArray.length == 6){
            newBPEntry[ row['name'] ]["element_" + e] = {
                'device': elementArray[0],
                'design': elementArray[1],
                'relX': parseInt(elementArray[2]),
                'relY': parseInt(elementArray[3]),
                'colour': elementArray[4],
                'label': elementArray[5]
            }
        }
    }
    return newBPEntry;
}



function log(e){
    console.log("Error Log: " + e);
}

function updateConsole(text){
    //process.stdout.clearLine();  // clear current text
    process.stdout.cursorTo(0);  // move cursor to beginning of line
    process.stdout.write(text);  // write text
}