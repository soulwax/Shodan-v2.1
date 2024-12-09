// File: src/commands/divine.js

const { SlashCommandBuilder } = require(`discord.js`)

module.exports = {
  data: new SlashCommandBuilder()
    .setName('divine')
    .setDescription('Divine a message.')
    .addStringOption((option) =>
      option
        .setName('question')
        .setDescription('Your divination request.')
        .setRequired(false)
    ),
}
