// File: src/commands/divine.js
const { SlashCommandBuilder } = require('discord.js')
const { EmbedBuilder } = require('discord.js')
const crypto = require('crypto')
const path = require('path')
const fs = require('fs')

// Load the card data
let cardData;
try {
  const cardDataPath = path.join(__dirname, '../../static/card-data.json')
  console.log('Loading card data from:', cardDataPath)
  const rawData = fs.readFileSync(cardDataPath, 'utf8')
  cardData = JSON.parse(rawData)
  console.log(`Successfully loaded ${cardData.cards.length} cards`)
} catch (error) {
  console.error('Error loading card data:', error)
  throw new Error('Failed to initialize divine command: Card data could not be loaded')
}

function getImageFilename(card) {
  try {
    if (card.type === 'major') {
      const num = card.value_int.toString().padStart(2, '0')
      const name = card.name.toLowerCase().replace(/\s+/g, '')
      const filename = `m_${num}_${name}.jpg`
      console.log('Generated major arcana filename:', filename)
      return filename
    } else {
      const suitMap = {
        cups: 'c',
        wands: 'w',
        swords: 's',
        pentacles: 'p'
      }
      
      const suit = suitMap[card.suit]
      if (!suit) {
        console.error('Invalid suit:', card.suit)
        throw new Error('Invalid card suit')
      }

      let value = card.value
      let filename;
      
      if (['page', 'knight', 'queen', 'king'].includes(value)) {
        filename = `${suit}_${value}.jpg`
      } else if (value === 'ace') {
        filename = `${suit}_ace.jpg`
      } else {
        filename = `${suit}_${card.value_int}.jpg`
      }
      
      console.log('Generated minor arcana filename:', filename)
      return filename
    }
  } catch (error) {
    console.error('Error generating image filename:', error)
    console.error('Card data:', JSON.stringify(card, null, 2))
    throw new Error('Failed to generate image filename')
  }
}

function drawCard() {
  try {
    const randomIndex = crypto.randomInt(0, cardData.cards.length)
    const card = cardData.cards[randomIndex]
    const isReversed = crypto.randomInt(0, 2) === 1
    console.log('Drew card:', card.name, isReversed ? '(reversed)' : '(upright)')
    return { card, isReversed }
  } catch (error) {
    console.error('Error drawing card:', error)
    throw new Error('Failed to draw card')
  }
}

function createDivineEmbed(card, isReversed) {
  try {
    const imageFilename = getImageFilename(card)
    const imagePath = path.join(__dirname, '../../static/images', imageFilename)
    console.log('Looking for image at:', imagePath)
    
    const embed = new EmbedBuilder()
      .setTitle(`🔮 ${card.name}${isReversed ? ' (Reversed)' : ''}`)
      .setColor('#9B59B6')
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

    if (fs.existsSync(imagePath)) {
      console.log('Image found, attaching to embed')
      embed.setImage(`attachment://${imageFilename}`)
    } else {
      console.warn('Image not found:', imagePath)
    }

    return { embed, imageFilename, imagePath }
  } catch (error) {
    console.error('Error creating embed:', error)
    throw new Error('Failed to create divine embed')
  }
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
    try {
      console.log('Divine command triggered by user:', interaction.user.tag)
      
      const question = interaction.options.getString('question')
      if (question) {
        console.log('Question asked:', question)
      }

      const { card, isReversed } = drawCard()
      console.log('Processing card:', card.name)

      const { embed, imageFilename, imagePath } = createDivineEmbed(card, isReversed)
      
      if (question) {
        embed.addFields({ 
          name: 'Your Question', 
          value: question,
          inline: false
        })
      }

      if (fs.existsSync(imagePath)) {
        console.log('Sending response with image')
        await interaction.reply({ 
          embeds: [embed], 
          files: [{
            attachment: imagePath,
            name: imageFilename
          }]
        })
      } else {
        console.log('Sending response without image')
        await interaction.reply({ embeds: [embed] })
      }
      
      console.log('Divine command completed successfully')
    } catch (error) {
      console.error('Error executing divine command:', error)
      console.error('Stack trace:', error.stack)
      
      // Create an error embed
      const errorEmbed = new EmbedBuilder()
        .setTitle('🔮 Error Drawing Card')
        .setColor('#FF0000')
        .setDescription('There was an error processing your tarot reading. Please try again later.')
        .addFields({
          name: 'Error Details',
          value: 'The spirits are unclear at this moment. Please notify the server administrator.'
        })

      // Try to respond with error message
      try {
        if (!interaction.replied) {
          await interaction.reply({ embeds: [errorEmbed], ephemeral: true })
        } else {
          await interaction.followUp({ embeds: [errorEmbed], ephemeral: true })
        }
      } catch (replyError) {
        console.error('Error sending error message:', replyError)
      }
    }
  }
}