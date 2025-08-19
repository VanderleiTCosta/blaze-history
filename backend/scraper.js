// backend/scraper.js (VERSÃO COM SELETOR CORRIGIDO)
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

const url = 'https://www.tipminer.com/br/historico/blaze/double';

async function scrapeBlazeHistory() {
  let browser = null;
  try {
    console.log('🤖 Iniciando navegador com Puppeteer...');
    
    browser = await puppeteer.launch({ 
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    
    console.log(`Navegando para ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // NOVO SELETOR MAIS ESPECÍFICO E ROBUSTO
    const selector = '.round-history button.cell';
    console.log(`Aguardando pelo seletor: "${selector}"...`);
    await page.waitForSelector(selector, { timeout: 15000 });
    
    const html = await page.content();
    console.log('✅ Conteúdo dinâmico carregado. Extraindo dados...');

    const $ = cheerio.load(html);
    const results = [];
    
    // USANDO O NOVO SELETOR
    const resultElements = $(selector);

    if (resultElements.length === 0) {
      console.warn('⚠️ Mesmo com Puppeteer, nenhum resultado foi encontrado. O seletor pode precisar de ajuste.');
      return [];
    }
    
    console.log(`🎉 Encontrados ${resultElements.length} resultados para processar.`);

    resultElements.each((index, element) => {
      const button = $(element);
      
      const numberText = button.find('.cell__result').text().trim();
      const number = parseInt(numberText, 10);
      
      const time = button.find('.cell__date').text().trim();
      
      // O tooltip agora está dentro de um div irmão do botão
      const fullDate = button.parent().find('.cell__tooltip').text().trim();

      let color = '';
      if (button.hasClass('cell--type-lucky')) color = 'white';
      else if (button.hasClass('cell--type-double')) color = 'red';
      else if (button.hasClass('cell--type-default')) color = 'black';

      if (!isNaN(number)) {
          results.push({
            id: index + 1,
            seed: `tipminer-result-${index}`,
            number,
            color,
            time,
            fullDate
          });
      }
    });

    console.log(`✅ Scraping concluído! ${results.length} resultados extraídos.`);
    return results;

  } catch (error) {
    console.error('❌ Erro durante o scraping com Puppeteer:', error.message);
    return null;
  } finally {
    if (browser) {
      await browser.close();
      console.log('Navegador fechado.');
    }
  }
}

module.exports = { scrapeBlazeHistory };