// All solutions below work with discord.js@13.7.0

//#region ENVIRONMENT VARIABLES
require(`dotenv`).config()
const SHODAN_TOKEN = process.env.SHODAN_TOKEN
const CLIENT_ID = process.env.CLIENT_ID
const TRACKING_CHANNEL_NAME = process.env.TRACKING_CHANNEL_NAME
//#endregion

//#region REQUIRES
const { MessageEmbed } = require(`discord.js`)
const { SlashCommandBuilder } = require(`@discordjs/builders`)
const { REST } = require(`@discordjs/rest`)
const { Routes } = require(`discord-api-types/v9`)
const { Client } = require(`discord.js`)
const InvitesTracker = require('@androz2091/discord-invites-tracker')
//#endregion

//#region REST + CLIENT API + INTENTS
const rest = new REST({ version: `9` }).setToken(SHODAN_TOKEN)
const client = new Client({
  intents: [
    `GUILDS`,
    `GUILD_MESSAGES`,
    `GUILD_PRESENCES`,
    `GUILD_MEMBERS`,
    `GUILD_INTEGRATIONS`,
    `GUILD_WEBHOOKS`,
    `GUILD_BANS`,
    `GUILD_INVITES`,
    `GUILD_VOICE_STATES`,
    `GUILD_MESSAGE_REACTIONS`,
    `GUILD_MESSAGE_TYPING`,
    `DIRECT_MESSAGES`,
    `DIRECT_MESSAGE_REACTIONS`,
    `DIRECT_MESSAGE_TYPING`,
    `GUILD_SCHEDULED_EVENTS`,
  ],
})
//#endregion

//#region COMMANDS
const commands = [
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with "pong" if the bot is online.'),
  new SlashCommandBuilder()
    .setName('members')
    .setDescription('Lists members of a given server.'),
  new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Embed avatar of a user (prototype).')
    .addMentionableOption((option) =>
      option
        .setName('user')
        .setDescription('The user whose avatar you want to get.')
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('example')
    .setDescription('Replies with an example embed.'),
  new SlashCommandBuilder()
    .setName('echo')
    .setDescription('Echos a message.')
    .addStringOption((option) =>
      option
        .setName('message')
        .setDescription('The message you want to echo.')
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('join')
    .setDescription('Joins a voice channel.'),
  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Lists all commands.'),
  new SlashCommandBuilder()
    .setName('banned')
    .setDescription('Lists banned users.'),
];
//#endregion

//#region REFRESH
(async () => {
  try {
    console.log(`Started refreshing application (/) commands.`)

    await rest.put(Routes.applicationCommands(CLIENT_ID), {
      body: commands,
    })

    console.log(`Successfully reloaded application (/) commands.`)
  } catch (error) {
    console.error(error)
  }
})()
//#endregion

client.on(`ready`, () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

client.on(`interactionCreate`, async (interaction) => {
  if (!interaction.isCommand()) return

  if (interaction.commandName === `ping`) {
    // Measure response time ping
    const ping = Date.now() - interaction.createdTimestamp.valueOf()
    const embed = new MessageEmbed()
      .setTitle(`Pong!`)
      .setDescription(`${ping}ms`)
      .setColor(`#00ff00`)
    await interaction.reply({ embeds: [embed] })
  }

  if (interaction.commandName === `echo`) {
    const embed = new MessageEmbed()
      .setTitle(`Echo`)
      .setDescription(interaction.options.getString(`message`))
      .setColor(`#00ff00`)
    await interaction.reply({ embeds: [embed] })
  }

  if (interaction.commandName === `members`) {
    const guild = interaction.guild
    const members = await guild.members.fetch()
    const memberList = members.map((member) => member.user.tag).join(`\n`)
    const embed = new MessageEmbed()
      .setTitle(`${guild.name}'s Members`)
      .setDescription(memberList)
      .setColor(`#0099ff`)
    await interaction.reply({ embeds: [embed] })
  }

  if (interaction.commandName === `avatar`) {
    // Get user from interaction or the first argument
    const user = interaction.options.getMentionable(`user`)

    const userName = user.user.tag
    const userAvatar = user.displayAvatarURL()

    if (!user || !userName || !userAvatar) {
      //send error embed message
      const embed = new MessageEmbed()
        .setTitle(`Error`)
        .setDescription(`Please mention a user.`)
        .setColor(`#ff0000`)
      await interaction.reply({ embeds: [embed] })
    } else {
      const embed = new MessageEmbed()
        .setTitle(`${userName}'s Avatar`)
        .setDescription(`[Link to avatar](${userAvatar})`)
        .setImage(userAvatar)
        .setColor(`#0099ff`)
      await interaction.reply({ embeds: [embed] })
    }
  }

  if (interaction.commandName === `banned`) {
    const guild = interaction.guild
    const bans = await guild.bans.fetch()
    const list = bans.map((ban) => ban.user.tag).join(`\n`)
    const embed = new MessageEmbed()
      .setTitle(`${guild.name}'s Bans`)
      .setDescription(list)
      .setColor(`#0099ff`)
    await interaction.reply({ embeds: [embed] })
  }

  // TODO: remove this example command
  if (interaction.commandName === `example`) {
    const exampleEmbed = new MessageEmbed()
      .setColor(`#0099ff`)
      .setTitle(`Some title`)
      .setURL(`https://discord.js.org/`)
      .setAuthor({
        name: `Some name`,
        iconURL: `https://i.imgur.com/AfFp7pu.png`,
        url: `https://discord.js.org`,
      })
      .setDescription(`Some description here`)
      .setThumbnail(`https://i.imgur.com/AfFp7pu.png`)
      .addFields(
        { name: `Regular field title`, value: `Some value here` },
        { name: `\u200B`, value: `\u200B` },
        { name: `Inline field title`, value: `Some value here`, inline: true },
        { name: `Inline field title`, value: `Some value here`, inline: true }
      )
      .addField(`Inline field title`, `Some value here`, true)
      .setImage(`https://i.imgur.com/AfFp7pu.png`)
      .setTimestamp()
      .setFooter({
        text: `Some footer text here`,
        iconURL: `https://i.imgur.com/AfFp7pu.png`,
      })
    if (exampleEmbed === `undefined`) return
    await interaction.reply({ embeds: [exampleEmbed] })
  }

  if (interaction.commandName === `help`) {
    const embed = new MessageEmbed()
      .setTitle(`Help`)
      .setDescription(`List of all commands:`)
      .setColor(`#15999f`)
      .setAuthor({
        name: `${client.user.tag}`,
        iconURL: `${client.user.displayAvatarURL()}`,
        url: `${client.user.displayAvatarURL()}`,
      })
    for (const command of commands) {
      embed.addField(command.name, command.description)
    }
    await interaction.reply({ embeds: [embed] })
  }
})

// Join voice chat when called the /join command
client.on(`interactionCreate`, async (interaction) => {
  if (interaction.commandName === `join`) {
    // Get the voice channel the user is currently in
    const voiceChannel = interaction.member.voice.channel
    const embed = new MessageEmbed()
      .setTitle(`You want me to join a voice channel?`)
      .setDescription(`Let me join ${voiceChannel.name}!`)
      .setColor(`#0099ff`)
    await interaction.reply({ embeds: [embed] })

    if (!voiceChannel) {
      const embed = new MessageEmbed()
        .setTitle(`Error`)
        .setDescription(`I couldn't find a voice channel.`)
        .setColor(`#ff0000`)
      await interaction.reply({ embeds: [embed] })
    } else {
      // Join voiceChannel
      if (voiceChannel.joinable) {
        // Enter voice channel
        await voiceChannel.join().then(async (connection) => {
          const embed = new MessageEmbed()
            .setTitle(`Success`)
            .setDescription(`I joined ${voiceChannel.name}!`)
            .setColor(`#0099ff`)
          await interaction.reply({ embeds: [embed] })
        }).catch(async (error) => {
          const embed = new MessageEmbed()
            .setTitle(`Error`)
            .setDescription(`I couldn't join ${voiceChannel.name}.`)
            .setColor(`#ff0000`)
          await interaction.reply({ embeds: [embed] })
        })
      }
    }
  }
})

//#region TRACKER
const tracker = InvitesTracker.init(client, {
  fetchGuilds: true,
  fetchVanity: true,
  fetchAuditLogs: true,
})

tracker.on('guildMemberAdd', (member, type, invite) => {
  const adminGeneral = member.guild.channels.cache.find(
    (ch) => ch.name === `${TRACKING_CHANNEL_NAME}`
  )

  // Get accurate age of account in days
  const accountAge = Math.floor(
    (Date.now() - member.user.createdAt) / (1000 * 60 * 60 * 24)
  )
  
  let accountAgeString = '';
  // if accountAge has three digits, convert to months
  if (accountAge > 99) {
    const accountAgeMonths = Math.floor(accountAge / 30)
    const accountAgeDays = Math.floor(accountAge % 30)
    accountAgeString = `${accountAgeMonths} months, ${accountAgeDays} days ago`
  } else {
    accountAgeString = `${accountAge} days ago`
  }


  if (type === 'normal') {
    adminGeneral.send(`${member} was invited by: ${invite.inviter.username}! Account created: ${accountAgeString}`)
  } else if (type === 'vanity') {
    adminGeneral.send(`${member} joined using a custom invite. Account age: ${accountAgeString}`)
  } else if (type === 'permissions') {
    adminGeneral.send(
      `I can't figure out how ${member} joined because I don't have the "Manage Server" permission. Account created: ${accountAgeString}.`
    )
  } else if (type === 'unknown') {
    adminGeneral.send(`I can't figure out how ${member} joined the server... Account created: ${accountAgeString}`)
  }
})
//#endregion

client.login(SHODAN_TOKEN)
