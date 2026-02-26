const login = require("./index.js");
const fs = require("fs");

const appState = JSON.parse(fs.readFileSync("appstate.json", "utf8"));

login.login(appState, (err, api) => {
    if (err) return console.error(err);

    api.setOptions({ listenEvents: true });

    const listenEmitter = api.listen((err, event) => {
        if (err) return console.error(err);

        // console.log("Captured Event:", JSON.stringify(event, null, 2));

        switch (event.type) {
            case "message":
                if (event.body === ".uid") {
                    api.sendMessage(`Your UID: ${event.senderID}`, event.threadID);
                } else if (event.body === ".reverse") {
                    api.sendMessage(api.reverseTranslate("Hello World"), event.threadID);
                } else if (event.body && event.body.startsWith(".uid ")) {
                    if (event.mentions && Object.keys(event.mentions).length > 0) {
                        let response = "Mentioned UIDs:\n";
                        for (let id in event.mentions) {
                            response += `${event.mentions[id]}: ${id}\n`;
                        }
                        api.sendMessage(response, event.threadID);
                    } else {
                        api.sendMessage("Please mention someone to get their UID.", event.threadID);
                    }
                }
                break;
        }
    });
});
