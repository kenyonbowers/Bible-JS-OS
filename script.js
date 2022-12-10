const fs = require("fs");
const bcrypt = require('bcryptjs');
const { fetch } = "node-fetch";

var user;

var cmds = [
    {
        short_name: "su",
        long_name: "Switch User",
        description: "Allows you to switch the current user to another.",
        params: "${USER}",
        execute: async function(user, user_name){
            login(user_name);
        }
    },
    {
        short_name: "au",
        long_name: "Add User",
        description: "Allows you to add a user.",
        params: "${NEW USER} ${NEW PASSWORD}",
        execute: async function(user, new_user_name, new_user_password){
            bcrypt.hash(new_user_password, 10)
                .then(async(hashed_password) => {
                    data = {
                        name: new_user_name,
                        password: hashed_password
                    }
                    await fs.writeFile(`./users/${new_user_name}.json`, JSON.stringify(data), (err) => {});
                });
            open_terminal();
        }
    },
    {
        short_name: "vv",
        long_name: "View Verse",
        description: "Allows you to view a verse.",
        params: "${VERSE}",
        execute: async function(user, verse1, verse2, verse3){
            var request = require("request");
            var url = `https://bible-api.com/${verse1}%20${verse2}?translation=kjv`;
            if(verse3 != (undefined && null && "" && " ")){
                var url = `https://bible-api.com/${verse1}%20${verse2}:${verse3}?translation=kjv`;
            }

            let verse_json;

            request({ url: url, json: true }, function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    verse_json = body;
                    console.log(`${verse_json.reference} - ${verse_json.verses[0].text.trim()}`);
                    open_terminal();
                }
                else{
                    console.log("Failed to get verse.");
                    open_terminal();
                }
            });
        }
    },
    {
        short_name: "help",
        long_name: "Help",
        description: "Gives details on a command.",
        params: "${CMD}",
        execute: async function(user, cmd_name){
            let cmd_data;
            cmds.forEach((cmd) => {
                if(cmd.short_name == cmd_name) cmd_data = cmd;
            });
            console.log(`\nHere is info on the ${cmd_data.long_name} command.\nShort Name: ${cmd_data.short_name}\nDescription: ${cmd_data.description}\n`)
            open_terminal();
        }
    }
]

const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout,
});

//cmds[1].execute("", "root", "RootPassword");
login();

function open_terminal(){
    let question = "Use";
    cmds.forEach((cmd, index) => {
        if(index != cmds.length - 1){
            question += ` "${cmd.short_name} ${cmd.params}",`
        }
        else{
            question += ` or "${cmd.short_name} ${cmd.params}".`
        }
    })
    question += "\n";
    readline.question(question, data => {
        cmd_valid = false;
        data = data.split(" ");
        let params = [];
        data.forEach((sect, index) => {
            if(index != 0){
                params.push(sect);
            }
        })
        cmds.forEach((cmd, index) => {
            if(data[0] == cmd.short_name){
                cmd_valid = true;
                cmd.execute(user, ...params);
            }
            else if(index == cmds.length-1 && cmd_valid == false){
                throw new Error(`No commands found with short_name of ${data[0]}.`);
            }
        })
        cmd_valid = false;
    });
}

async function login(user_name){
    if(user_name){
        try{
            var user_data = require(`./users/${user_name.split(" ")[0]}.json`);
            readline.question(`Enter the password for ${user_name}.\n`, password_data => {
                bcrypt.compare(password_data, user_data.password)
                    .then(do_match => {
                        if(do_match){
                            user = data;
                            open_terminal();
                        }
                        else{
                            console.log("Invaild Password.\n")
                            login(user_name);
                        }
                    })
            })
        } catch(err){
            console.log(err);
        }
    }
    else{
        readline.question("Which user do you want to use?\n", async(data) => {
            try{
                var user_data = require(`./users/${data.split(" ")[0]}.json`);
                readline.question(`Enter the password for ${data}.\n`, password_data => {
                    bcrypt.compare(password_data, user_data.password)
                        .then(do_match => {
                            if(do_match){
                                user = data;
                                open_terminal();
                            }
                            else{
                                console.log("Invaild Password.\n")
                                login();
                            }
                        })
                })
            } catch(err){
                console.log(err);
            }
        });
    }
}