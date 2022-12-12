// All solutions below work with discord.js@13.7.0

//#region ENVIRONMENT VARIABLES
require(`dotenv`).config()
const SHODAN_TOKEN = process.env.SHODAN_TOKEN
const CLIENT_ID = process.env.CLIENT_ID
const TRACKING_CHANNEL_NAME = process.env.TRACKING_CHANNEL_NAME
//#endregion

//#region REQUIRES
const fs = require('node:fs')
const path = require('node:path')
const { SlashCommandBuilder, Routes } = require('discord.js')
const { REST } = require('@discordjs/rest')
const {
  Client,
  EmbedBuilder,
  GatewayIntentBits,
} = require(`discord.js`);
const InvitesTracker = require('@androz2091/discord-invites-tracker');
const responseTemplates = require('./embeds'); // discord embed messages
const setServer = require('./server-setup/setup-server'); // client, tracker, rest setup
const { joinVoiceChannel, VoiceConnectionStatus, createAudioPlayer, createAudioResource } = require('@discordjs/voice');
const axios = require('axios');

//#endregion

//#region COMMANDS
const commands = []
const commandFiles = fs
  .readdirSync(path.join(__dirname, `commands`))
  .filter((file) => file.endsWith(`.js`))

for (const file of commandFiles) {
  const command = require(`./commands/${file}`)
  console.log(command)
  commands.push(command.data.toJSON())
}

//#endregion COMMANDS

(async () => {
  try {
    console.log(`Started refreshing application (/) commands.`)
    setServer.rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands })
      .then(console.log(`Successfully reloaded application (/) commands. 
        Registered ${commands.length} commands.`))

  } catch (error) {
    console.error(error)
  }
})()

setServer.client.on(`interactionCreate`, async (interaction) => {
  if (!interaction.isCommand()) return
  console.log(interaction.commandName)
  if (interaction.commandName === `searchip`) {
    let ipAddress = interaction.options.getString(`ip`)

    options = {
      method: 'GET',
      url: 'https://api.shodan.io/shodan/host/54.38.153.162?key=ThjsmwiKkfCDLh0nnvybWV6MwW7gHz0V',
      headers: {
        "Accept-Encoding": "gzip,deflate,compress"
      }
    };

    await axios.request(options).then(async (response) => {
      let data = {
        city: response.data.city
      }
      console.log(response.status);
      console.log(response.data);
      const embed = responseTemplates.searchIpResp(JSON.stringify(data))
      await interaction.reply({ embeds: [embed] })
    }).catch(function (error) {
      console.error(error);
    });



  }
  if (interaction.commandName === `ping`) {
    // get command from interaction, then execute it's own async function
    // const command = await commands.find((cmd) => cmd.name === interaction.commandName)
    // await command.execute(interaction)
        const ping = Date.now() - interaction.createdTimestamp.valueOf()
        const embed = responseTemplates.pong(ping)
        await interaction.reply({ embeds: [embed] })
  }
  if (interaction.commandName === `echo`) {
    const embed = responseTemplates.echoResponse(String(interaction.options.getString(`message`)))
    await interaction.reply({ embeds: [embed] })
  }

  if (interaction.commandName === `members`) {
    const guild = interaction.guild
    const members = await guild.members.fetch()
    const memberList = members.map((member) => member.user.tag).join(`\n`)
    const embed = responseTemplates.membersList(guild.name, memberList)
    await interaction.reply({ embeds: [embed] })
  }

  if (interaction.commandName === `avatar`) {
    // Get user from interaction or the first argument
    const user = interaction.options.getMentionable(`user`)

    const userName = user.user.tag
    const userAvatar = user.displayAvatarURL()

    if (!user || !userName || !userAvatar) {
      //send error embed message
      const embed = responseTemplates.errMentionUser()
      await interaction.reply({ embeds: [embed] })
    } else {
      const embed = responseTemplates.showAvatar(userName, userAvatar)
      await interaction.reply({ embeds: [embed] })
    }
  }

  if (interaction.commandName === `banned`) {
    const guild = interaction.guild
    const bans = await guild.bans.fetch()
    const list = bans.map((ban) => ban.user.tag).join(`\n`)
    const embed = responseTemplates.bannedList(guild.name, list)  // create banned list embed
    await interaction.reply({ embeds: [embed] })
  }

  if (interaction.commandName === `help`) {
    const embed = responseTemplates.allCommands(client.user.tag, client.user.displayAvatarURL())
    for (const command of commands) {
      embed.addField(command.name, command.description)
    }
    await interaction.reply({ embeds: [embed] })
  }
})

// Nuke command
setServer.client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return
  if (interaction.commandName === 'nuke') {
    const amount = interaction.options.getInteger('amount')
    const target = interaction.options.getUser('target')
    const channel = interaction.options.getChannel('channel')
    const reason = interaction.options.getString('reason')
    const embed = new EmbedBuilder()
      .setTitle(`Nuke`)
      .setDescription(
        `Nuked ${amount} messages from ${target} in ${channel} for ${reason}`
      )
      .setColor(`#00ff00`)
    await interaction.reply({ embeds: [embed] })
  }
})


setServer.client.on(VoiceConnectionStatus.Ready, () => {
  console.log('The connection has entered the Ready state - ready to play audio!');
});



// Join voice chat when called the /join command
setServer.client.on(`interactionCreate`, async (interaction) => {
  if (interaction.commandName === `join`) {
    // Get the voice channel the user is currently in
    const voiceChannel = interaction.member.voice.channel
    const embed = responseTemplates.AskToJoinVoiceChannel(voiceChannel.name)
    await interaction.reply({ embeds: [embed] })

    if (!voiceChannel) {
      const embed = responseTemplates.errNoVoiceChannel()
      await interaction.reply({ embeds: [embed] })
    } else {
      // Join voiceChannel
      if (voiceChannel.joinable) {
        // Enter voice channel
        const connection = joinVoiceChannel({
          channelId: interaction.id,
          guildId: interaction.guild.id,
          adapterCreator: interaction.guild.voiceAdapterCreator
        });
        console.log(connection)

        const player = createAudioPlayer();
        const subscription = connection.subscribe(player);

        const resource = createAudioResource('test.mp3');
        player.play(resource);
        /*await voiceChannel
          .join()
          .then(async (connection) => {
            console.log('connection')
            console.log(connection)
            const embed = responseTemplates.successJoinVoiceChannel(voiceChannel.name)
            await interaction.reply({ embeds: [embed] })
          })
          .catch(async (error) => {
            console.log('error')
            console.log(error)
            const embed = responseTemplates.errorJoinVoiceChannel(voiceChannel.name)
            await interaction.reply({ embeds: [embed] })
          })*/
      }
    }
  }
})

//#region TRACKER

// users joining on the discord server
setServer.tracker.on('guildMemberAdd', (member, type, invite) => {
  console.log('guildMemberAdd')
  const adminGeneral = member.guild.channels.cache.find(
    (ch) => ch.name === `${TRACKING_CHANNEL_NAME}`
  )

  // Get accurate age of account in days
  const accountAge = Math.floor(
    (Date.now() - member.user.createdAt) / (1000 * 60 * 60 * 24)
  )

  let accountAgeString = ''
  // if accountAge has three digits, convert to months
  if (accountAge > 99) {
    const accountAgeMonths = Math.floor(accountAge / 30)
    const accountAgeDays = Math.floor(accountAge % 30)
    accountAgeString = `${accountAgeMonths} months, ${accountAgeDays} days ago`
  } else {
    accountAgeString = `${accountAge} days ago`
  }

  if (type === 'normal') {
    adminGeneral.send(
      `${member} was invited by: ${invite.inviter.username}! Account created: ${accountAgeString}`
    )
  } else if (type === 'vanity') {
    adminGeneral.send(
      `${member} joined using a custom invite. Account age: ${accountAgeString}`
    )
  } else if (type === 'permissions') {
    adminGeneral.send(
      `I can't figure out how ${member} joined because I don't have the "Manage Server" permission. Account created: ${accountAgeString}.`
    )
  } else if (type === 'unknown') {
    adminGeneral.send(
      `I can't figure out how ${member} joined the server... Account created: ${accountAgeString}`
    )
  }
})
//#endregion

setServer.client.on(`ready`, () => {
  console.log(`Logged in as ${setServer.client.user.tag}!`)
})

setServer.client.login(SHODAN_TOKEN)
