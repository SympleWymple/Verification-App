const fetch = require('node-fetch');
var rbx = require('noblox.js');
const fs = require('fs')

async function GetGroupRank(RobloxId, GroupId) {
    let response = await fetch(`https://assetgame.roblox.com/Game/LuaWebService/HandleSocialRequest.ashx?method=GetGroupRank&playerid=${RobloxId}&groupid=${GroupId}`).then();
    if (response.status != 200) { return false; }
    let data = await response.text();
    let RankString = data.substring(data.indexOf('>')).substring(1);
    return RankString.substring(0, RankString.indexOf('<'));
}

async function GetRobloxId(Username) {
    let response = await rbx.getIdFromUsername([Username]);
    console.log(response)
    return response
}

async function CheckForCode(userId, Code) {
    let response = await rbx.getBlurb({ userId: userId })
    if (response.indexOf(Code) != -1) {
        return true;
    }
    return false;
}

async function GetRobloxName(userId) {
    let response = await fetch(`https://api.roblox.com/users/${userId}`).then();
    if (response.status != 200) { return false; }
    let data = await response.json();
    return data.Username;
}

async function GetGroupRole(RobloxId, GroupId) {
    let response = await fetch(`https://assetgame.roblox.com/Game/LuaWebService/HandleSocialRequest.ashx?method=GetGroupRole&playerid=${RobloxId}&groupid=${GroupId}`).then();
    if (response.status != 200) { return false; }
    let data = await response.text();
    return data;
}

async function GetGroup(RobloxId, field) {
    let response = await fetch(`https://api.roblox.com/groups/${RobloxId}`)
    if (response.status != 200) { return false; }
    let data = await response.text();
    if (field) {
        return data[field]
    }
    return data;
}

module.exports = { GetGroupRank, GetRobloxId, CheckForCode, GetRobloxName, GetGroup, GetGroupRole }