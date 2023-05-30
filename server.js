const express = require('express');
const proxy = require('express-http-proxy');
const cheerio = require('cheerio');

function extractDataFromHTML(html) {
  const $ = cheerio.load(html);
  const articles = $('article');

  const jsonObjects = [];

  articles.each((index, element) => {
    const article = $(element);
    const imageUrl = article.find('img.card-photo').attr('src');
    const ldJsonScripts = article.find('script[type="application/ld+json"]');
    const uniqueUrls = new Set();

    ldJsonScripts.each((index, element) => {
      const script = $(element);
      let jsonText = script.html();
      jsonText = jsonText.replace('//<![CDATA[', '').replace('//]]>', '');

      try {
        const json = JSON.parse(jsonText);
        json.imageUrl = imageUrl;

        const isDuplicate = jsonObjects.some((obj) => JSON.stringify(obj) === JSON.stringify(json));
        const isEmpty = Object.keys(json).length === 0;
        const residenceUrl = json.url;

        if (!isDuplicate && !isEmpty && !uniqueUrls.has(residenceUrl)) {
          uniqueUrls.add(residenceUrl);
          jsonObjects.push(json);
        }
      } catch (error) {
        console.error('Error parsing JSON:', error);
      }
    });
  });

  return jsonObjects;
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
       console.log(JSON.stringify(extractDataFromHTML(proxyResData)));
    }
       return proxyResData;
  }
}));

const server = app.listen(443);