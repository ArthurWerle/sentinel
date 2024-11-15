function handlePrice(content) {
  return parseFloat(content.replace('R$', '').replace('.', '').replace(',', '.'))
}

export async function findPrice(page) {
  let price = await page.evaluate(() => {
    const priceElement = document.querySelector('.finalPrice');
    return priceElement ? handlePrice(priceElement.textContent) : null;
  });

  if (!price) {
    price = await page.evaluate(() => {
      const priceElement = document.querySelector('.desconto-a-vista');
      return priceElement ? handlePrice(priceElement.textContent) : null;
    });
  }

  if (!price) {
    price = await page.evaluate(() => {
      const priceElement = document.querySelector('.preco-promocional');
      return priceElement ? handlePrice(priceElement.textContent) : null;
    });
  }

  if (!price) {
    price = await page.evaluate(() => {
      const priceElement = document.querySelector('.preco-venda');
      return priceElement ? handlePrice(priceElement.textContent) : null;
    });
  }

  if (!price) {
    price = await page.evaluate(() => {
      const priceMetaTag = document.querySelector('meta[property="product:price:amount"]');
      return priceMetaTag ? handlePrice(priceMetaTag) : null;
    });
  }

  if (!price) {
    price = await page.evaluate(() => {
      const scriptTag = document.querySelector('script[type="application/ld+json"]');
      if (scriptTag) {
        const jsonData = JSON.parse(scriptTag.textContent);
        return jsonData ? handlePrice(jsonData.price) : null;
      }
      return null;
    });
  }

  return price;
}