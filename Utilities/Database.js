let Data = require("../Data.json");
// const fs = require("fs");

function GetDiscordIdFromVerify(guild, discordId) {
    if (Data.verified[guild]) {
        if (Data.verified[guild][discordId]) {
            return Data.verified[guild][discordId];
        } else {
            return false;
        }
    } else {
        return false;
    }
}

// GetDiscordIdFromVerify("verified", 32344343);

module.exports = { GetDiscordIdFromVerify };