// All solutions below work with discord.js@13.7.0

//#region ENVIRONMENT VARIABLES
require(`dotenv`).config();
const SHODAN_TOKEN = process.env.SHODAN_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;
//#endregion

//#region REQUIRES
const { MessageEmbed } = require(`discord.js`);
const { SlashCommandBuilder } = require(`@discordjs/builders`);
const { REST } = require(`@discordjs/rest`);
const { Routes } = require(`discord-api-types/v9`);
const { Client } = require(`discord.js`);
//#endregion

//#region REST + CLIENT API + INTENTS
const rest = new REST({ version: `9` }).setToken(SHODAN_TOKEN);
const client = new Client({
  intents: [
    ,
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
});
//#endregion

//#region COMMANDS
const commands = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription('Replies with "pong" if the bot is online.'),
  new SlashCommandBuilder()
    .setName("members")
    .setDescription("Lists members of a given server."),
  new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("Embed avatar of a user (prototype).")
    .addMentionableOption((option) =>
      option
        .setName("user")
        .setDescription("The user whose avatar you want to get.")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("example")
    .setDescription("Replies with an example embed."),
  new SlashCommandBuilder()
    .setName("echo")
    .setDescription("Echos a message.")
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("The message you want to echo.")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Lists all commands."),
];
//#endregion

//#region REFRESH
(async () => {
  try {
    console.log(`Started refreshing application (/) commands.`);

    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: commands,
    });

    console.log(`Successfully reloaded application (/) commands.`);
  } catch (error) {
    console.error(error);
  }
})();
//#endregion

client.on(`ready`, () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on(`interactionCreate`, async (interaction) => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === `ping`) {
    // Measure response time ping
    const ping = Date.now() - interaction.createdTimestamp.valueOf();
    const embed = new MessageEmbed()
      .setTitle(`Pong!`)
      .setDescription(`${ping}ms`)
      .setColor(`#00ff00`);
    await interaction.reply({ embeds: [embed] });
  }

  if (interaction.commandName === `echo`) {
    const embed = new MessageEmbed()
      .setTitle(`Echo`)
      .setDescription(interaction.options.getString(`message`))
      .setColor(`#00ff00`);
    await interaction.reply({ embeds: [embed] });
  }

  if (interaction.commandName === `members`) {
    const guild = interaction.guild;
    const members = await guild.members.fetch();
    const memberList = members.map((member) => member.user.tag).join(`\n`);
    const embed = new MessageEmbed()
      .setTitle(`${guild.name}'s Members`)
      .setDescription(memberList)
      .setColor(`#0099ff`);
    await interaction.reply({ embeds: [embed] });
  }

  if (interaction.commandName === `avatar`) {
    // Get user from interaction or the first argument
    const user = interaction.options.getMentionable(`user`);

    const userName = user.user.tag;
    const userAvatar = user.displayAvatarURL();

    if (!user || !userName || !userAvatar) {
      //send error embed message
      const embed = new MessageEmbed()
        .setTitle(`Error`)
        .setDescription(`Please mention a user.`)
        .setColor(`#ff0000`);
      await interaction.reply({ embeds: [embed] });
    } else {
      const embed = new MessageEmbed()
        .setTitle(`${userName}'s Avatar`)
        .setDescription(`[Link to avatar](${userAvatar})`)
        .setImage(userAvatar)
        .setColor(`#0099ff`);
      await interaction.reply({ embeds: [embed] });
    }
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
      });
    if (exampleEmbed === `undefined`) return;
    await interaction.reply({ embeds: [exampleEmbed] });
  }

  if(interaction.commandName === `help`) {
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
      embed.addField(command.name, command.description);
    }
    await interaction.reply({ embeds: [embed] });
  }
});

client.login(SHODAN_TOKEN);
