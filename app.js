// All solutions below work with discord.js@13.7.0
const fs = require('node:fs')
const path = require('node:path')
//#region ENVIRONMENT VARIABLES
require(`dotenv`).config()
const SHODAN_TOKEN = process.env.SHODAN_TOKEN
const CLIENT_ID = process.env.CLIENT_ID
const TRACKING_CHANNEL_NAME = process.env.TRACKING_CHANNEL_NAME
//#endregion

//#region REQUIRES
const { SlashCommandBuilder, Routes } = require('discord.js')
const { REST } = require('@discordjs/rest')
const {
  Client,
  EmbedBuilder,
  GatewayIntentBits,
} = require(`discord.js`)
const InvitesTracker = require('@androz2091/discord-invites-tracker')
//#endregion

IntentBits = {
  GUILDS: 1 << 0,
  GUILD_MEMBERS: 1 << 1,
  GUILD_BANS: 1 << 2,
  GUILD_EMOJIS_AND_STICKERS: 1 << 3,
  GUILD_INTEGRATIONS: 1 << 4,
  GUILD_WEBHOOKS: 1 << 5,
  GUILD_INVITES: 1 << 6,
  GUILD_VOICE_STATES: 1 << 7,
  GUILD_PRESENCES: 1 << 8,
  GUILD_MESSAGES: 1 << 9,
  GUILD_MESSAGE_REACTIONS: 1 << 10,
  GUILD_MESSAGE_TYPING: 1 << 11,
  DIRECT_MESSAGES: 1 << 12,
  DIRECT_MESSAGE_REACTIONS: 1 << 13,
  DIRECT_MESSAGE_TYPING: 1 << 14,
  MESSAGE_CONTENT: 1 << 15,
  GUILD_SCHEDULED_EVENTS: 1 << 16,
  AUTO_MODERATION_CONFIGURATION: 1 << 20,
  AUTO_MODERATION_EXECUTION: 1 << 21
}

// Iterate over the intents and or them together
const intents = Object.values(IntentBits).reduce((a, b) => a | b, 0)

//#region REST + CLIENT API + INTENTS

const rest = new REST({ version: '10' }).setToken(SHODAN_TOKEN)

const client = new Client({
  intents: intents
})
//#endregion

//#region COMMANDS
const commands = []
const commandFiles = fs
  .readdirSync(path.join(__dirname, `commands`))
  .filter((file) => file.endsWith(`.js`))

for (const file of commandFiles) {
  const command = require(`./commands/${file}`)
  commands.push(command.data.toJSON())
}
//#endregion COMMANDS

(async () => {
  try {
    console.log(`Started refreshing application (/) commands.`)
    rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands })
      .then(console.log(`Successfully reloaded application (/) commands. 
        Registered ${commands.length} commands.`))

  } catch (error) {
    console.error(error)
  }
})()


client.on(`interactionCreate`, async (interaction) => {
  if (!interaction.isCommand()) return
  if (interaction.commandName === `ping`) {
    // get command from interaction, then execute it's own async function
    // const command = await commands.find((cmd) => cmd.name === interaction.commandName)
    // await command.execute(interaction)
        const ping = Date.now() - interaction.createdTimestamp.valueOf()
        const embed = new EmbedBuilder()
          .setTitle(`Pong Motherfucker!`)
          .setDescription(`${ping}ms`)
          .setColor(`#00ffab`)
        await interaction.reply({ embeds: [embed] })
  }
  if (interaction.commandName === `echo`) {
    const embed = new EmbedBuilder()
      .setTitle(`Echo`)
      .setDescription(interaction.options.getString(`message`))
      .setColor(`#00ff00`)
    await interaction.reply({ embeds: [embed] })
  }

  if (interaction.commandName === `members`) {
    const guild = interaction.guild
    const members = await guild.members.fetch()
    const memberList = members.map((member) => member.user.tag).join(`\n`)
    const embed = new EmbedBuilder()
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
      const embed = new EmbedBuilder()
        .setTitle(`Error`)
        .setDescription(`Please mention a user.`)
        .setColor(`#ff0000`)
      await interaction.reply({ embeds: [embed] })
    } else {
      const embed = new EmbedBuilder()
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
    const embed = new EmbedBuilder()
      .setTitle(`${guild.name}'s Bans`)
      .setDescription(list)
      .setColor(`#0099ff`)
    await interaction.reply({ embeds: [embed] })
  }

  // TODO: remove this example command
  if (interaction.commandName === `example`) {
    const exampleEmbed = new EmbedBuilder()
      .setColor(`#0099ff`)
      .setTitle(`Some title`)
      .setURL(`https://discord.js.org/`)
      .setAuthor({
        name: `Some name`,
        iconURL: `https://i.imgur.com/AfFp7pu.png`,
        url: `https://discord.js.org`
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
        iconURL: `https://i.imgur.com/AfFp7pu.png`
      })
    if (exampleEmbed === `undefined`) return
    await interaction.reply({ embeds: [exampleEmbed] })
  }

  if (interaction.commandName === `help`) {
    const embed = new EmbedBuilder()
      .setTitle(`Help`)
      .setDescription(`List of all commands:`)
      .setColor(`#15999f`)
      .setAuthor({
        name: `${client.user.tag}`,
        iconURL: `${client.user.displayAvatarURL()}`,
        url: `${client.user.displayAvatarURL()}`
      })
    for (const command of commands) {
      embed.addField(command.name, command.description)
    }
    await interaction.reply({ embeds: [embed] })
  }
})

// Nuke command
client.on('interactionCreate', async (interaction) => {
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

// Join voice chat when called the /join command
client.on(`interactionCreate`, async (interaction) => {
  if (interaction.commandName === `join`) {
    // Get the voice channel the user is currently in
    const voiceChannel = interaction.member.voice.channel
    const embed = new EmbedBuilder()
      .setTitle(`You want me to join a voice channel?`)
      .setDescription(`Let me join ${voiceChannel.name}!`)
      .setColor(`#0099ff`)
    await interaction.reply({ embeds: [embed] })

    if (!voiceChannel) {
      const embed = new EmbedBuilder()
        .setTitle(`Error`)
        .setDescription(`I couldn't find a voice channel.`)
        .setColor(`#ff0000`)
      await interaction.reply({ embeds: [embed] })
    } else {
      // Join voiceChannel
      if (voiceChannel.joinable) {
        // Enter voice channel
        await voiceChannel
          .join()
          .then(async (connection) => {
            const embed = new EmbedBuilder()
              .setTitle(`Success`)
              .setDescription(`I joined ${voiceChannel.name}!`)
              .setColor(`#0099ff`)
            await interaction.reply({ embeds: [embed] })
          })
          .catch(async (error) => {
            const embed = new EmbedBuilder()
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
  fetchAuditLogs: true
})

tracker.on('guildMemberAdd', (member, type, invite) => {
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

client.on(`ready`, () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

client.login(SHODAN_TOKEN)
