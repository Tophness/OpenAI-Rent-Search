const express = require('express');
const proxy = require('express-http-proxy');
const cheerio = require('cheerio');

function extractListingDetails(html) {
  const $ = cheerio.load(html);
  const listings = [];

  $('article.property-cell').each((index, element) => {
    const address = $(element).find('h2.address').text().trim();
    const imageUrl = $(element).find('img.card-photo').attr('src');
    const price = $(element).find('span.price').text().trim();
    const features = [];

    $(element).find('ul.features li.feature').each((index, element) => {
      const value = $(element).find('span.value').text().trim();
      features.push({
        value: value
      });
    });

    listings.push({
      address: address,
      imageUrl: imageUrl,
      price: price,
      features: features
    });
  });

  return listings;
}

const app = express();
app.use(express.static('public'));
app.use(proxy('https://www.rent.com.au', {
  proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
    if (srcReq.url.indexOf('/properties') !== -1) {
    }
    proxyReqOpts.headers["Cookie"] = "";
    proxyReqOpts.headers["Access-Control-Allow-Origin"] = "*";
    proxyReqOpts.headers["Access-Control-Allow-Methods"] = "*";
    proxyReqOpts.headers["Access-Control-Allow-Headers"] = "*";
    proxyReqOpts.headers["Access-Control-Allow-Credentials"] = "true";
    return proxyReqOpts;
  },
  userResDecorator: function(proxyRes, proxyResData, req, res) {
    if (req.url.indexOf('/properties') !== -1) {
       console.log(extractListingDetails(proxyResData));
    }
    return proxyResData;
  }
}));

const server = app.listen(443);