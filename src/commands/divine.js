// File: src/commands/divine.js
const { SlashCommandBuilder } = require('discord.js')
const { EmbedBuilder } = require('discord.js')
const crypto = require('crypto')
const path = require('path')
const fs = require('fs')

// Load the card data
const cardDataPath = path.join(__dirname, '../../static/card-data.json')
const cardData = JSON.parse(fs.readFileSync(cardDataPath, 'utf8'))

function getImageFilename(card) {
  if (card.type === 'major') {
    // Handle major arcana cards
    // Convert card number to two digits and lowercase name
    const num = card.value_int.toString().padStart(2, '0')
    const name = card.name.toLowerCase().replace(/\s+/g, '')
    return `m_${num}_${name}.jpg`
  } else {
    // Handle minor arcana cards
    const suitMap = {
      cups: 'c',
      wands: 'w',
      swords: 's',
      pentacles: 'p'
    }
    
    const suit = suitMap[card.suit]
    let value = card.value
    
    // Handle court cards and number cards
    if (['page', 'knight', 'queen', 'king'].includes(value)) {
      return `${suit}_${value}.jpg`
    } else if (value === 'ace') {
      return `${suit}_ace.jpg`
    } else {
      // For number cards, just use the number
      return `${suit}_${card.value_int}.jpg`
    }
  }
}

function drawCard() {
  const randomIndex = crypto.randomInt(0, cardData.cards.length)
  const card = cardData.cards[randomIndex]
  const isReversed = crypto.randomInt(0, 2) === 1 // 50% chance of reversal
  return { card, isReversed }
}

function createDivineEmbed(card, isReversed) {
  const imageFilename = getImageFilename(card)
  const imagePath = path.join(__dirname, '../../static/images', imageFilename)
  
  const embed = new EmbedBuilder()
    .setTitle(`🔮 ${card.name}${isReversed ? ' (Reversed)' : ''}`)
    .setColor('#9B59B6') // Purple color for mystical feeling
    .addFields(
      { 
        name: 'Arcana & Value', 
        value: `${card.type.charAt(0).toUpperCase() + card.type.slice(1)} Arcana • ${card.value}`, 
        inline: true 
      },
      { 
        name: 'Meaning', 
        value: isReversed ? card.meaning_rev : card.meaning_up 
      },
      { 
        name: 'Description & Symbolism', 
        value: card.desc.length > 1024 ? card.desc.substring(0, 1021) + '...' : card.desc 
      }
    )
    .setFooter({ 
      text: 'The cards offer guidance, but you chart your own path. Trust your intuition.' 
    })

  // Check if the image file exists and attach it
  if (fs.existsSync(imagePath)) {
    embed.setImage(`attachment://${imageFilename}`)
  }

  return { embed, imageFilename, imagePath }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('divine')
    .setDescription('Draw a single tarot card for divination and guidance.')
    .addStringOption(option =>
      option
        .setName('question')
        .setDescription('The question or situation you seek guidance for (optional)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const question = interaction.options.getString('question')
    const { card, isReversed } = drawCard()
    const { embed, imageFilename, imagePath } = createDivineEmbed(card, isReversed)
    
    // If there's a question, add it to the embed
    if (question) {
      embed.addFields({ 
        name: 'Your Question', 
        value: question,
        inline: false
      })
    }

    // Send the response with the image attachment if it exists
    if (fs.existsSync(imagePath)) {
      await interaction.reply({ 
        embeds: [embed], 
        files: [{
          attachment: imagePath,
          name: imageFilename
        }]
      })
    } else {
      await interaction.reply({ embeds: [embed] })
    }
  }
}