const { SlashCommandBuilder } = require(`discord.js`)

module.exports = {
  data: new SlashCommandBuilder()
    .setName('random')
    .setDescription('Gives a random number between x and y')
    .addMentionableOption((option) =>
      option.setName('x').setDescription('lower range').setRequired(true)
    )
    .addMentionableOption((option) =>
      option.setName('y').setDescription('upper range').setRequired(true)
    )
}
