const { EmbedBuilder } = require(`discord.js`)

function errNoVoiceChannel() {
  return new EmbedBuilder()
    .setTitle(`Error`)
    .setDescription(`I couldn't find a voice channel.`)
    .setColor(`#ff0000`)
}

function AskToJoinVoiceChannel(voiceChannelName) {
  return new EmbedBuilder()
    .setTitle(`You want me to join a voice channel?`)
    .setDescription(`Let me join ${voiceChannelName}!`)
    .setColor(`#0099ff`)
}

function pong(ping) {
  return new EmbedBuilder()
    .setTitle(`Pong!`)
    .setDescription(`${ping}ms`)
    .setColor(`#00ffab`)
}

function errMentionUser(ping) {
  return new EmbedBuilder()
    .setTitle(`Error`)
    .setDescription(`Please mention a user.`)
    .setColor(`#ff0000`)
}

function showAvatar(userName, userAvatar) {
  return new EmbedBuilder()
    .setTitle(`${userName}'s Avatar`)
    .setDescription(`[Link to avatar](${userAvatar})`)
    .setImage(userAvatar)
    .setColor(`#0099ff`)
}

function echoResponse(description) {
  return new EmbedBuilder()
    .setTitle(`Echo`)
    .setDescription(description)
    .setColor(`#00ff00`)
}

function membersList(guildName, members) {
  return new EmbedBuilder()
    .setTitle(`${guildName}'s Members`)
    .setDescription(members)
    .setColor(`#0099ff`)
}

function bannedList(guildName, members) {
  return new EmbedBuilder()
    .setTitle(`${guildName}'s Bans`)
    .setDescription(members)
    .setColor(`#0099ff`)
}

function noBans(guildName) {
  return new EmbedBuilder()
    .setTitle(`${guildName}'s Bans`)
    .setDescription(`No bans found.`)
    .setColor(`#de1042`)
}

function allCommands(tag, avaURL) {
  return new EmbedBuilder()
    .setTitle(`Help`)
    .setDescription(`List of all commands:`)
    .setColor(`#15999f`)
    .setAuthor({
      name: `${tag}`,
      iconURL: `${avaURL}`,
      url: `${avaURL}`
    })
}

function successJoinVoiceChannel(voiceChannelName) {
  return new EmbedBuilder()
    .setTitle(`Success`)
    .setDescription(`I joined ${voiceChannelName}!`)
    .setColor(`#0099ff`)
}

function errorJoinVoiceChannel(voiceChannelName) {
  return new EmbedBuilder()
    .setTitle(`Error`)
    .setDescription(`I couldn't join ${voiceChannelName}.`)
    .setColor(`#ff0000`)
}

function searchIpResp(data) {
  return new EmbedBuilder()
    .setTitle(`Shodan API`)
    .setDescription(`Shodan API Response for IP: \`${data.ip}\``)
    .setColor(`#01de10`)
    .addFields({
      name: 'City',
      value: `\`${data.city}\``
    })
}

function shodanAPIError(data) {
  return new EmbedBuilder()
    .setTitle(`Shodan API`)
    .setDescription(`Shodan API Response for IP: \`${data.ip}\``)
    .setColor(`#de1042`)
    .addFields({
      name: 'Shodan API Error',
      value: `\`${data.error}\``
    })
    .addFields({
      name: 'In so and so many words...',
      value: `The Shodan Service now requires a paid membership to use lol.`
    })
}

module.exports = {
  errNoVoiceChannel,
  AskToJoinVoiceChannel,
  pong,
  errMentionUser,
  showAvatar,
  echoResponse,
  membersList,
  bannedList,
  noBans,
  allCommands,
  successJoinVoiceChannel,
  errorJoinVoiceChannel,
  searchIpResp,
  shodanAPIError
}
