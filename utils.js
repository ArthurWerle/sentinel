function handlePrice(text) {
  const match = text.match(/\d[\d.,]*/);
  if (match) {
      return parseFloat(match[0].replace(/\./g, '').replace(',', '.'));
  }
  return null;
}

export function extractIdFromUrl(url) {
  let id = null;

  if (url.includes('auxiliadorapredial.com.br')) {
      // Extract ID after the last '/' and before '#'
      id = url.split('/').pop().split('#')[0];
  } else if (url.includes('zapimoveis.com.br')) {
      // Extract ID after 'id-' and before '/'
      const match = url.match(/id-(\d+)/);
      if (match) id = match[1];
  } else if (url.includes('vivareal.com.br')) {
      // Extract ID after 'id-' and before '/'
      const match = url.match(/id-(\d+)/);
      if (match) id = match[1];
  } else if (url.includes('quintoandar.com.br')) {
      // Extract ID after the last '/'
      id = url.split('/').pop();
  }

  return id;
}


export async function findPrice(page) {
  let price = await page.evaluate(() => {
    const priceElement = document.querySelector('.valores-imovel-caracteristicas span');
    return priceElement ? handlePrice(priceElement.textContent) : null;
  });

  if (!price) {
    price = await page.evaluate(() => {
      const priceElement = document.querySelector('[data-testid=price-info-value]');
      const condoPriceElement = document.querySelector('#condo-fee-price')

      const price = priceElement ? handlePrice(priceElement.textContent) : null
      const condo = condoPriceElement ? handlePrice(condoPriceElement.textContent) : null

      if (!price && !condo) return null

      return price + condo
    });
  }

  if (!price) {
    price = await page.evaluate(() => {
      const totalPriceElement = Array.from(document.querySelectorAll('p')).find(el => 
        el.textContent.includes('Total')
      );
    
      let text = totalPriceElement ? totalPriceElement.textContent.trim() : null;
      
      return text ? handlePrice(text) : null
    });
  }

  return price;
}