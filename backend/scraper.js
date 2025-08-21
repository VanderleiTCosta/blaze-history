// backend/scraper.js (VERSÃO COM BROWSERLESS - MUITO MAIS LEVE)
const axios = require('axios');
const cheerio = require('cheerio');

const urlToScrape = 'https://www.tipminer.com/br/historico/blaze/double';
// Pega a chave da API das variáveis de ambiente do Render
const BROWSERLESS_API_KEY = process.env.BROWSERLESS_API_KEY;

async function scrapeBlazeHistory() {
  if (!BROWSERLESS_API_KEY) {
    console.error('❌ Chave da API do Browserless não encontrada! Verifique as variáveis de ambiente no Render.');
    return null;
  }

  try {
    console.log('🤖 Chamando a API do Browserless para fazer o scraping...');
    const apiUrl = `https://chrome.browserless.io/content?token=${BROWSERLESS_API_KEY}`;

    // Faz a requisição para a API do Browserless, pedindo o conteúdo da página
    const response = await axios.post(apiUrl, {
      url: urlToScrape,
      waitFor: '.round-history button.cell', // Pede para esperar este elemento aparecer
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 60000 // Timeout de 60 segundos
    });

    const html = response.data;
    console.log('✅ HTML recebido do Browserless. Extraindo dados...');
    const $ = cheerio.load(html);
    const results = [];
    const resultElements = $('.round-history button.cell');

    resultElements.each((index, element) => {
        const button = $(element);
        const numberText = button.find('.cell__result').text().trim();
        const number = parseInt(numberText, 10);
        const time = button.find('.cell__date').text().trim();
        const fullDate = button.parent().find('.cell__tooltip').text().trim();
        let color = '';
        if (button.hasClass('cell--type-lucky')) color = 'white';
        else if (button.hasClass('cell--type-double')) color = 'red';
        else if (button.hasClass('cell--type-default')) color = 'black';
        if (!isNaN(number)) {
            results.push({ id: index + 1, seed: `tipminer-result-${index}`, number, color, time, fullDate });
        }
    });

    console.log(`✅ Scraping concluído! ${results.length} resultados extraídos.`);
    return results;

  } catch (error) {
    console.error('❌ Erro durante o scraping com Browserless:', error.response ? error.response.data : error.message);
    return null;
  }
}

module.exports = { scrapeBlazeHistory };