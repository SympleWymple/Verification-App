const express = require('express')
const app = express()
const port = 3001
const config = require('./Utilities/config.json')
const discord = require('discord.js')
const schema = require('./Utilities/schema.js');
const Mongoose = require('mongoose');


app.use(express.static('public'))

app.use('/css', express.static(__dirname + 'public/css'))
app.use('/js', express.static(__dirname + 'public/js'))
app.use('/images', express.static(__dirname + 'public/images'))



app.set('views', './views')
app.set('view engine', 'ejs')

try {
    Mongoose.connect(config.MongooseURI);
} catch (err) {
    console.log(err);
}

app.get('', (req, res) => {
    console.log(req.query)
})

app.get("/:id", (req, res) => {
    res.render('index', {link: req.id, discordUsername: req.query.discordUsername, discordAvatar: req.query.discordPfp})
  
})

app.get('/redirect', async(req, res) => {
    // make code into string
    const code = req.query.code
    const state = req.query.state
    try {
        const data = await schema.find({ statecode: state }).exec();

        if (data.length === 0) {
            res.send('An error occurred');
            res.status(404);
            res.end();
        } else {
            const user = await client.users.fetch(data[0].discordID);

            if (!user) {
                res.send('An error occurred');
                res.status(404);
                res.end();
            } else {
                res.status(200);
                res.send('You may close this tab now');
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

                        // change nickname to roblox username
                        const guild = client.guilds.cache.get(config.guildID)
                        const username = userInfo.preferred_username
                        const member = await guild.members.fetch(user.id)

                        if (member.id === guild.ownerId) {} else {
                            member.setNickname(username)
                        }

                        const embed = new discord.MessageEmbed()
                            .setColor('GREEN')
                            .setDescription(`Successfully verified ${user.tag}!`)
                            .setTimestamp()
                            .setFooter({ text: 'Success!' });

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




app.listen(port, () => console.log(`app listening on port ${port}!`))