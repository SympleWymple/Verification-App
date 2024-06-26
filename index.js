const { Client, IntentsBitField, Collection, Partials } = require('discord.js')
const client = new Client({
	partials: [Partials.Channel, Partials.User, Partials.GuildMember, Partials.Message],
	intents: [IntentsBitField.Flags.Guilds,
		IntentsBitField.Flags.GuildMessages,
		IntentsBitField.Flags.MessageContent,
		IntentsBitField.Flags.GuildMembers],
})

const express = require('express')
const app = express()
const port = 3001
const axios = require('axios')
const config = require('./Utilities/config.json')
const discord = require('discord.js')
const schema = require('./Utilities/schema.js');
const mongoose = require('mongoose');
const { render } = require('ejs')


const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };


app.use(express.static('public'))

app.use('/css', express.static(__dirname + 'public/css'))
app.use('/js', express.static(__dirname + 'public/js'))
app.use('/images', express.static(__dirname + 'public/images'))



app.set('views', './views')
app.set('view engine', 'ejs')

try {
    // Create a Mongoose client with a MongoClientOptions object to set the Stable API version
    mongoose.connect(config.MongooseURI, clientOptions);
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
} catch (err) {
    console.log(err);
}

app.get('', (req, res) => {
    // display home page
    try {
        res.render('home')
    } catch {
        // display error page
        res.render('error')
    }
})

app.get("/verify-:id", (req, res) => {
    try {
        res.render('verify', { link: req.params.id, discordUsername: req.query.discordUsername, discordAvatar: req.query.discordPfp} )
    } catch {
        // display error opage
        res.render('error')
    }
})

app.get('/tos', (req, res) => {
    // display tos page
    res.render('tos')
})
app.get('/privacy', (req, res) => {
    // display tos page
    res.render('privacy')
})

app.get('/redirect', async (req, res) => {
    // make code into string
    const code = req.query.code
    const state = req.query.state
    
    try {
        const data = await schema.find({ statecode: state }).exec();
        console.log(data)
        if (data.length === 0) {
           res.render('error')
            res.status(404);
            res.end();
        } else {
            const user = await client.users.fetch(data[0].discordID);
            console.log(user)
            if (!user) {
                res.render('error')
                res.status(404);
                res.end();
            } else {
                res.status(200);
                const params = new URLSearchParams();
                params.append("client_id", config.robloxclientID);
                params.append("client_secret", config.robloxtoken);
                params.append("grant_type", "authorization_code");
                params.append("code", code);

                const response = await axios.post(`https://apis.roblox.com/oauth/v1/token`, params, {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                });

                if (response.status === 200) {
                    const access_token = response.data.access_token;

                    const userInfoResponse = await fetch(`https://apis.roblox.com/oauth/v1/userinfo`, {
                        headers: {
                            Authorization: `Bearer ${access_token}`
                        }
                    });

                    if (userInfoResponse.status === 200) {
                        const userInfo = await userInfoResponse.json();

                        data[0].verified = true;
                        data[0].robloxID = userInfo.sub;
                        data[0].robloxUsername = userInfo.preferred_username;
                        data[0].statecode = null;
                        await data[0].save();

                        res.render("success", {username: userInfo.preferred_username})

                        // // change nickname to roblox username
                        // const guild = client.guilds.cache.get(config.guildID)
                        // const username = userInfo.preferred_username
                        // const member = await guild.members.fetch(user.id)

                        // if (member.id === guild.ownerId) { } else {
                        //     member.setNickname(username)
                        // }

                        // const embed = new discord.MessageEmbed()
                        //     .setColor('GREEN')
                        //     .setDescription(`Successfully verified ${user.tag}!`)
                        //     .setTimestamp()
                        //     .setFooter({ text: 'Success!' });

                        //client.channels.cache.get(config.verificationChannel).send({ embeds: [embed] });
                    } else {
                        const embed = new discord.MessageEmbed()
                            .setColor('RED')
                            .setDescription('An error occurred while verifying your account!')
                            .setTimestamp()
                            .setFooter({ text: 'Error!' });

                        //client.channels.cache.get(config.verificationChannel).send({ embeds: [embed] });
                    }
                } else {
                    const embed = new discord.MessageEmbed()
                        .setColor('RED')
                        .setDescription('An error occurred while verifying your account!')
                        .setTimestamp()
                        .setFooter({ text: 'Error!' });

                    //client.channels.cache.get(config.verificationChannel).send({ embeds: [embed] });
                }
            }
        }
    } catch (err) {
        console.log(err);
        res.send('An error occurred');
        res.status(500);
        res.end();
    }
})


client.login("MTIyODc4MjU4MTA4NDg0ODIzOA.GKu2nA.Sz27WhErqOe5raCb0LTfAtIV6lePut6Yvy6hV8")

app.listen(process.env.PORT || port, () => console.log(`app listening on port ${process.env.PORT || port}!`))