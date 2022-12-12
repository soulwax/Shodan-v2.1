const { SlashCommandBuilder } = require(`discord.js`)

module.exports = {
  data: new SlashCommandBuilder()
    .setName('searchip')
    .addStringOption(option =>
      option.setName('ip')
        .setDescription('Get information about specific ip-address'))
    .setDescription('Get information about specific ip-address')
}
