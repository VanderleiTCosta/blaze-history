// backend/scraper.js (VERSÃO COM URL DO BROWSERLESS CORRIGIDA)
const axios = require('axios');
const cheerio = require('cheerio');

const urlToScrape = 'https://www.tipminer.com/br/historico/blaze/double';
const BROWSERLESS_API_KEY = process.env.BROWSERLESS_API_KEY;

async function scrapeBlazeHistory() {
  if (!BROWSERLESS_API_KEY) {
    console.error('❌ Chave da API do Browserless não encontrada! Verifique as variáveis de ambiente no Render.');
    return null;
  }

  try {
    console.log('🤖 Chamando a API do Browserless para fazer o scraping...');

    // --- LINHA CORRIGIDA ---
    // Trocamos a URL antiga 'chrome.browserless.io' pela nova 'production-sfo.browserless.io'
    const apiUrl = `https://production-sfo.browserless.io/content?token=${BROWSERLESS_API_KEY}`;
    // --- FIM DA CORREÇÃO ---

    const response = await axios.post(apiUrl, {
      url: urlToScrape,
      waitFor: '.round-history button.cell'
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 60000
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