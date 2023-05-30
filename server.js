const express = require('express');
const proxy = require('express-http-proxy');
const cheerio = require('cheerio');

function extractDataFromHTML(html) {
  const $ = cheerio.load(html);
  const articles = $('article');

  const extractedData = [];

  articles.each((index, element) => {
    const article = $(element);
    const imageUrl = article.find('img.card-photo').attr('src');

    const ldJsonScripts = article.find('script[type="application/ld+json"]');
    const jsonObjects = [];

    ldJsonScripts.each((index, element) => {
      const script = $(element);
      const json = JSON.parse(script.html());
      jsonObjects.push(json);
    });

    extractedData.push({ imageUrl, jsonObjects });
  });

  return extractedData;
}

const app = express();
app.use(express.static('public'));
app.use(proxy('https://www.rent.com.au', {
  proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
    if (srcReq.url.indexOf('/properties') !== -1) {
    }
    proxyReqOpts.headers["Access-Control-Allow-Origin"] = "*";
    proxyReqOpts.headers["Access-Control-Allow-Methods"] = "*";
    proxyReqOpts.headers["Access-Control-Allow-Headers"] = "*";
    proxyReqOpts.headers["Access-Control-Allow-Credentials"] = "true";
    return proxyReqOpts;
  },
  userResDecorator: function(proxyRes, proxyResData, req, res) {
    if (req.url.indexOf('/properties') !== -1) {
       console.log(extractedData(proxyResData));
    }
       return proxyResData;
  }
}));

const server = app.listen(443);