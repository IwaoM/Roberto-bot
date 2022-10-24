const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { openWeatherToken } = require("../config.json");
const { capitalizeFirstLetter } = require("../helpers/misc.helper.js");

const windTypes = [
  { speed: 32.7, description: "Hurricane force" },
  { speed: 28.5, description: "Storm force" },
  { speed: 24.5, description: "Whole gale" },
  { speed: 20.8, description: "Strong gale" },
  { speed: 17.2, description: "Gale" },
  { speed: 13.9, description: "Near gale" },
  { speed: 10.8, description: "Strong breeze" },
  { speed: 8, description: "Fresh breeze" },
  { speed: 5.5, description: "Moderate breeze" },
  { speed: 3.3, description: "Gentle breeze" },
  { speed: 1.5, description: "Light breeze" },
  { speed: 0.5, description: "Light air" },
  { speed: 0, description: "Calm" },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("weather")
    .setDescription("Fetches the weather for the given location")
    .addStringOption(option =>
      option.setName("location")
        .setDescription("Name of the location to get the weather of")
        .setRequired(true)
    ),

  async execute (interaction) {
    await interaction.deferReply();

    const locationOption = interaction.options.getString("location");
    const locationResp = await fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${locationOption}&appid=${openWeatherToken}&limit=5`);
    const location = await locationResp.json();

    if (!location.length) {

      await interaction.editReply(`No results have been found for "${locationOption}".`);
      return;

    } else {

      const weatherResp = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${location[0].lat}&lon=${location[0].lon}&appid=${openWeatherToken}&units=metric`);
      const weather = await weatherResp.json();

      const currentWindType = windTypes.find(type => type.speed < weather.wind.speed);
      const weatherEmbed = new EmbedBuilder()
        .setColor(0xe96d4a)
        .setTitle(`${location[0].name}, ${location[0].state}, ${location[0].country}`)
        .setAuthor({ name: "OpenWeather", iconURL: "https://pbs.twimg.com/profile_images/1173919481082580992/f95OeyEW_400x400.jpg" })
        .setDescription(`**${Math.round(weather.main.temp)}°C -** ${capitalizeFirstLetter(weather.weather[0].description)}
Feels like ${Math.round(weather.main.feels_like)}°C`)
        .setThumbnail(`http://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`)
        .addFields(
          { name: "Humidity", value: `${weather.main.humidity}%`, inline: true },
          { name: "Pressure", value: `${weather.main.pressure}hPa`, inline: true },
          { name: "Wind", value: `${weather.wind.speed}m/s - ${currentWindType.description}` }
        )
        .setTimestamp(new Date());

      interaction.editReply({ embeds: [weatherEmbed] });

    }
  },

  usage: `• \`/weather <location>\`: Fetches the current weather for *location*.`
};
