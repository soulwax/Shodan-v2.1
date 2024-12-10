// File: src/app.js

// All solutions below work with discord.js@13.7.0

//#region ENVIRONMENT VARIABLES
require(`dotenv`).config()
const TOKEN = process.env.TOKEN
const CLIENT_ID = process.env.CLIENT_ID
const TRACKING_CHANNEL_ID = process.env.TRACKING_CHANNEL_ID
//#endregion
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js')
//#region REQUIRES
const fs = require('node:fs')
const path = require('node:path')
const { Routes } = require('discord.js')
const { EmbedBuilder } = require(`discord.js`)
const responseTemplates = require('./embeds') // discord embed messages
const setServer = require('./server-setup/setup-server') // client, tracker, rest setup
const crypto = require('crypto')
const { createCanvas, loadImage } = require('canvas');
const client = setServer.client
const {
  joinVoiceChannel,
  VoiceConnectionStatus,
  createAudioPlayer,
  createAudioResource
} = require('@discordjs/voice')

const OpenAI = require('openai')
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})
let globalGreetingsEmbed
//#endregion
const LANGUAGE_CHANNEL_ID = process.env.LANGUAGE_CHANNEL_ID
//#region COMMANDS
const commands = []
const commandFiles = fs
  .readdirSync(path.join(__dirname, `commands`))
  .filter((file) => file.endsWith(`.js`))

for (const file of commandFiles) {
  const command = require(`./commands/${file}`)
  commands.push(command.data.toJSON())
}

function splitLongText(text, maxLength = 1024) {
  if (text.length <= maxLength) return [text]

  const parts = []
  let remainingText = text

  while (remainingText.length > maxLength) {
    let splitIndex = remainingText.lastIndexOf('.', maxLength)
    if (splitIndex === -1)
      splitIndex = remainingText.lastIndexOf(' ', maxLength)
    if (splitIndex === -1) splitIndex = maxLength

    parts.push(remainingText.substring(0, splitIndex + 1))
    remainingText = remainingText.substring(splitIndex + 1).trim()
  }

  if (remainingText.length > 0) parts.push(remainingText)
  return parts
}
//#endregion COMMANDS

;(async () => {
  try {
    console.log(`Started refreshing application (/) commands.`)
    setServer.rest
      .put(Routes.applicationCommands(CLIENT_ID), { body: commands })
      .then(
        console.log(`Successfully reloaded application (/) commands. 
        Registered ${commands.length} commands.`)
      )
  } catch (error) {
    console.error(error)
  }
})()

// \message\ event
client.on('messageCreate', (message) => {
  // This function is executed each time your bot sees a message
  // in a server OR DM!
  console.log(JSON.stringify(message))
})

client.on(`interactionCreate`, async (interaction) => {
  if (!interaction.isCommand()) return
  console.log(interaction.commandName)
  if (interaction.commandName === `ping`) {
    // get command from interaction, then execute it's own async function
    // const command = await commands.find((cmd) => cmd.name === interaction.commandName)
    // await command.execute(interaction)
    const ping = Date.now() - interaction.createdTimestamp.valueOf()
    const embed = responseTemplates.pong(ping)
    await interaction.reply({ embeds: [embed] })
  }
  if (interaction.commandName === `echo`) {
    const embed = responseTemplates.echoResponse(
      String(interaction.options.getString(`message`))
    )
    await interaction.reply({ embeds: [embed] })
  }

  if (interaction.commandName === `members`) {
    const guild = interaction.guild
    const members = await guild.members.fetch()
    const memberList = members.map((member) => member.user.tag).join(`\n`)
    const embed = responseTemplates.membersList(guild.name, memberList)
    await interaction.reply({ embeds: [embed] })
  }

  if (interaction.commandName === `purge`) {
    // Get caller's permissions, he should have the \admin\ role
    let isAdmin = false
    let integer
    try {
      const permissions = interaction.member.permissions.bitfield
      isAdmin = interaction.member.permissions.has(`ADMINISTRATOR`)
      integer = interaction.options.getInteger('integer')

      if (!isAdmin || !integer) {
        //send error embed message
        const embed = responseTemplates.errAdmin()
        await interaction.reply({ embeds: [embed] })
        return
      }
    } catch (error) {
      console.error(error)
      isAdmin = false
      const embed = responseTemplates.errAdmin()
      await interaction.reply({ embeds: [embed], ephemeral: true })
      return
    }

    let messages = await interaction.channel.messages.fetch({ limit: integer })

    // Delete messages
    await interaction.channel.bulkDelete(messages, true)

    const embed = responseTemplates.purge(integer)
    await interaction.reply({ embeds: [embed], ephemeral: true })
  }

  if (interaction.commandName === `avatar`) {
    // Get user from interaction or the first argument
    const user = interaction.options.getMentionable(`user`)

    const userName = user.user.tag
    const userAvatar = user.displayAvatarURL({ size: 2048 })

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
    if (list.length < 1) {
      const embed = responseTemplates.noBans(guild.name)
      await interaction.reply({ embeds: [embed] })
    } else {
      const embed = responseTemplates.bannedList(guild.name, list) // create banned list embed
      await interaction.reply({ embeds: [embed] })
    }
  }

  if (interaction.commandName === 'divine') {
    try {
      // Defer reply since we'll be making API calls
      await interaction.deferReply()
      console.log('[DEBUG] Divine command triggered')

      // First declare and initialize cardDataPath
      const cardDataPath = path.join(__dirname, '../static/card-data.json')
      console.log('[DEBUG] Loading card data from:', cardDataPath)

      // Then use it to load the card data
      const cardData = JSON.parse(fs.readFileSync(cardDataPath, 'utf8'))

      // Get user's question if provided
      const question = interaction.options.getString('question')
      console.log('[DEBUG] Question:', question)

      // Draw a random card
      const randomIndex = crypto.randomInt(0, cardData.cards.length)
      const card = cardData.cards[randomIndex]
      const isReversed = crypto.randomInt(0, 2) === 1
      console.log(
        '[DEBUG] Drew card:',
        card.name,
        isReversed ? '(reversed)' : '(upright)'
      )

      // Get AI interpretation
      const prompt = `As a sassy, slightly mischievous tarot reader with a wicked sense of humor, give a unique and memorable interpretation for:

      Card: ${card.name} ${isReversed ? '(Reversed - and honey, that\'s tea!)' : '(Upright and serving looks!)'}
      ${question ? `Question: ${question} (oh, you really went there...)` : 'No question? Living dangerously, I see!'}
      
      Card Description: ${card.desc}
      Traditional Meaning: ${isReversed ? card.meaning_rev : card.meaning_up}
      
      Your reading should:
      1. Be deliciously specific (none of that "you will meet a stranger" nonsense)
      2. Include at least one pop culture reference, metaphor, or witty comparison
      3. Give practical advice with a humorous twist
      4. Keep that mystical vibe but make it fashion ✨
      5. Be irreverent but insightful (think cosmic wisdom meets reality TV)
      
      Channel your inner sassy mystic and make this reading MEMORABLE! But keep it under 800 characters - we\'re serving bite-sized wisdom here.
      
      Remember: Generic readings are for amateurs. Give us the tea! 🔮`

      console.log('[DEBUG] Requesting AI interpretation')
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-1106-preview',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 500
      })

      const aiInterpretation = completion.choices[0].message.content.trim()
      console.log('[DEBUG] Received AI interpretation')

      // Create embed
      const embed = new EmbedBuilder()
        .setTitle(`🔮 ${card.name}${isReversed ? ' (Reversed)' : ''}`)
        .setColor('#9B59B6')

      // Handle image attachment
      const suit =
        card.type === 'major'
          ? 'm'
          : card.suit === 'cups'
          ? 'c'
          : card.suit === 'wands'
          ? 'w'
          : card.suit === 'swords'
          ? 's'
          : 'p'

      let imageFilename
      if (card.type === 'major') {
        const num = card.value_int.toString().padStart(2, '0')
        const name = card.name
          .toLowerCase()
          .replace(/^the\s+/i, '') // Remove \The\ from the start
          .replace(/\s+/g, '') // Remove all spaces
        imageFilename = `${suit}_${num}_${name}.jpg`
      } else {
        if (['page', 'knight', 'queen', 'king'].includes(card.value)) {
          imageFilename = `${suit}_${card.value}.jpg`
        } else if (card.value === 'ace') {
          imageFilename = `${suit}_ace.jpg`
        } else {
          imageFilename = `${suit}_${card.value_int}.jpg`
        }
      }

      const imagePath = path.join(
        __dirname,
        '../static/rider-waite',
        imageFilename
      )
      console.log('[DEBUG] Looking for image at:', imagePath)

      // Split and add fields
      if (question) {
        embed.addFields({
          name: 'Your Question',
          value: question,
          inline: false
        })
      }

      // Add traditional meaning
      const meaning = isReversed ? card.meaning_rev : card.meaning_up
      const meaningParts = splitLongText(meaning)
      meaningParts.forEach((part, index) => {
        embed.addFields({
          name:
            index === 0
              ? 'Traditional Meaning'
              : 'Traditional Meaning (continued)',
          value: part,
          inline: false
        })
      })

      // Add AI interpretation
      const aiParts = splitLongText(aiInterpretation)
      aiParts.forEach((part, index) => {
        embed.addFields({
          name:
            index === 0
              ? 'Personalized Reading'
              : 'Personalized Reading (continued)',
          value: part,
          inline: false
        })
      })

      embed.setFooter({
        text: 'The cards offer guidance, but you chart your own path. Trust your intuition.'
      })

      // Check if image exists and send response
      if (fs.existsSync(imagePath)) {
        // Load and possibly rotate the image
        const img = await loadImage(imagePath);
        const canvas = createCanvas(img.width, img.height);
        const ctx = canvas.getContext('2d');
        
        if (isReversed) {
          // Translate and rotate for reversed cards
          ctx.translate(canvas.width/2, canvas.height/2);
          ctx.rotate(Math.PI); // 180 degrees
          ctx.translate(-canvas.width/2, -canvas.height/2);
        }
        
        // Draw the image
        ctx.drawImage(img, 0, 0);
        
        // Convert canvas to buffer
        const buffer = canvas.toBuffer('image/jpeg');
      
        console.log('[DEBUG] Image found, attaching to embed')
        await interaction.editReply({
          embeds: [embed],
          files: [{
            attachment: buffer,
            name: imageFilename
          }]
        });
      } else {
        console.log('[DEBUG] Image not found, sending embed without image')
        await interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      console.error('[DEBUG] Error in divine command:', error)
      const errorEmbed = new EmbedBuilder()
        .setTitle('🔮 Error')
        .setDescription(
          'The spirits are unclear at this moment. Please try again later.'
        )
        .setColor('#FF0000')
        .addFields({
          name: 'Error Details',
          value: 'There was an issue connecting with the mystical forces.'
        })

      try {
        if (!interaction.deferred) {
          await interaction.reply({ embeds: [errorEmbed], ephemeral: true })
        } else {
          await interaction.editReply({ embeds: [errorEmbed] })
        }
      } catch (replyError) {
        console.error('[DEBUG] Error sending error message:', replyError)
      }
    }
  }

  if (interaction.commandName === `dice`) {
    const n = interaction.options.getInteger(`n`)
    const min = interaction.options.getInteger(`min`)
    const max = interaction.options.getInteger(`max`)
    // array of random numbers
    const randoms = []
    for (let i = 0; i < n; i++) {
      randoms.push(responseTemplates.getRandomSecure(min, max))
    }

    const message = randoms.join(`, `)
    await interaction.reply({ content: `${message}` })
  }

  if (interaction.commandName === 'roll') {
    const diceNotation = interaction.options
      .getString('dice_notation')
      .toLowerCase() // Convert to lowercase for case-insensitive matching

    try {
      const match = diceNotation.match(/(\d+)[dw](\d+)/) // Match either 'd' or 'w'

      if (!match) {
        throw new Error(
          'Invalid dice notation. Use NdX or NwX format (e.g., 2d6 or 3w8).'
        )
      }

      const numDice = parseInt(match[1], 10)
      const numSides = parseInt(match[2], 10)

      if (numDice < 1 || numSides < 2) {
        throw new Error(
          'Invalid number of dice or sides. Must have at least 1 die and 2 sides.'
        )
      }

      const rolls = []
      for (let i = 0; i < numDice; i++) {
        rolls.push(responseTemplates.rollDieSecure(numSides))
      }

      const message = `You rolled ${diceNotation}: ${rolls.join(
        ', '
      )} (Total: ${rolls.reduce((a, b) => a + b)})`
      await interaction.reply({ content: message })
    } catch (error) {
      await interaction.reply({ content: error.message })
    }
  }

  if (interaction.commandName === `help`) {
    const embed = responseTemplates.allCommands(
      client.user.tag,
      client.user.displayAvatarURL({ size: 2048 })
    )
    for (const command of commands) {
      embed.addFields({
        name: `${command.name}`,
        value: `${command.description}`
      })
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

client.on(VoiceConnectionStatus.Ready, () => {
  console.log(
    'The connection has entered the Ready state - ready to play audio!'
  )
})

// Join voice chat when called the /join command
client.on(`interactionCreate`, async (interaction) => {
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
        })
        console.log(connection)

        const player = createAudioPlayer()
        const subscription = connection.subscribe(player)

        const resource = createAudioResource('test.mp3')
        player.play(resource)
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

client.on('guildMemberAdd', async (member) => {
  globalGreetingsEmbed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('Welcome to the server! Willkommen auf unserem Server!')
    .setDescription(
      'Please select your language: - Bitte wähle deine Sprache aus:'
    )

  // Create a new MessageActionRow and add the buttons to it
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('english')
      .setLabel('English')
      .setStyle(ButtonStyle.Primary), // Blue button
    new ButtonBuilder()
      .setCustomId('german')
      .setLabel('German')
      .setStyle(ButtonStyle.Danger) // Red button
  )
  // Reply in channel id LANGUAGE_CHANNEL_ID
  await member.guild.channels.cache.get(LANGUAGE_CHANNEL_ID).send({
    embeds: [globalGreetingsEmbed],
    components: [row],
    ephemeral: true
  })
})

// Listen for the 'interactionCreate' event
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return
  const localEmbed = new EmbedBuilder().setColor('#0099ff')

  // Handle the 'english' button
  if (interaction.customId === 'english') {
    // Get the role you want to assign
    const role = interaction.guild.roles.cache.find(
      (role) => role.name === 'EN'
    )
    try {
      cleanupGreeterEmbed(globalGreetingsEmbed, interaction)
      await interaction.member.roles.add(role)
      const name = interaction.member.user.username
      localEmbed.setTitle('Welcome to the server!')
      localEmbed.setDescription(
        `@${name}, you have been verified as an English speaker and assigned the appropriate role.`
      )
      await interaction.reply({ embeds: [localEmbed], ephemeral: true })
    } catch (error) {
      console.log(error)
    } finally {
    }
  }

  // Handle the 'other' button
  if (interaction.customId === 'german') {
    // Handle non-English speakers
    const role = interaction.guild.roles.cache.find(
      (role) => role.name === 'DE'
    )
    // Add the role to the member and send a confirmation message
    try {
      cleanupGreeterEmbed(globalGreetingsEmbed, interaction)
      await interaction.member.roles.add(role)
      const name = interaction.member.user.username
      localEmbed.setTitle('Willkommen auf unserem Server!')
      localEmbed.setDescription(
        `@${name}, du wurdest als Deutschsprachiger verifiziert und der entsprechenden Rolle zugewiesen.`
      )
      await interaction.reply({ embeds: [localEmbed], ephemeral: true })
    } catch (error) {
      console.log(error)
    }
  }
})

const cleanupGreeterEmbed = async (embed, interaction) => {
  await interaction.message.edit({
    components: []
  })
}

// Leave voice chat when called the /leave command
client.on(`interactionCreate`, async (interaction) => {
  if (interaction.commandName === `leave`) {
    // Get the voice channel the user is currently in
    const voiceChannel = interaction.member.voice.channel
    const embed = responseTemplates.AskToLeaveVoiceChannel(voiceChannel.name)
    await interaction.reply({ embeds: [embed] })

    if (!voiceChannel) {
      const embed = responseTemplates.errNoVoiceChannel()
      await interaction.reply({ embeds: [embed] })
    } else {
      // Leave voiceChannel
      if (voiceChannel.joinable) {
        await voiceChannel
          .leave()
          .then(async (connection) => {
            const embed = responseTemplates.successLeaveVoiceChannel(
              voiceChannel.name
            )
            await interaction.reply({ embeds: [embed] })
          })
          .catch(async (error) => {
            const embed = responseTemplates.errorLeaveVoiceChannel(
              voiceChannel.name
            )
            await interaction.reply({ embeds: [embed] })
          })
      }
    }
  }
})

//#region TRACKER

// users joining on the discord server
setServer.tracker.on('guildMemberAdd', (member, type, invite) => {
  console.log('guildMemberAdd')
  // find channel by TRACKING_CHANNEL_ID
  const adminGeneral = member.guild.channels.cache.get(TRACKING_CHANNEL_ID)

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
      `I can't figure out how ${member} joined because I don't have the \Manage Server\ permission. Account created: ${accountAgeString}.`
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

client.login(TOKEN)
