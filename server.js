const express = require('express');
const proxy = require('express-http-proxy');
const cheerio = require('cheerio');

function extractListingDetails(html) {
  const $ = cheerio.load(html);
  const listings = [];

  $('article.property-cell').each((index, element) => {
    const address = $(element).find('h2.address').text().trim();
    const imageUrl = $(element).find('img.card-photo').attr('src');
    const priceElement = $(element).find('span.price');
    const propType = $(priceElement).find('.property-type').text().trim();
    priceElement.find('.property-type').remove();
    const price = priceElement.text().trim();
    const ldJsonScripts = $(element).find('script[type="application/ld+json"]').first();
    const features = [];
    let description = "";

    $(element).find('ul.features li.feature').each((index, element) => {
      const value = $(element).find('span.value').text().trim();
      features.push(value);
    });

    if (ldJsonScripts.length > 0) {
      let jsonText = ldJsonScripts.html();
      jsonText = jsonText.replace('//<![CDATA[', '').replace('//]]>', '');
      try {
        const json = JSON.parse(jsonText);
        const isEmpty = Object.keys(json).length === 0;

        if (!isEmpty && json['@type'] !== "RentAction") {
          description = json.description;
        }
      } catch (error) {
        console.error('Error parsing JSON:', error);
      }
    }

    listings.push({
      address: address,
      imageUrl: imageUrl,
      price: price,
      features: features,
      propType: propType,
      description: description
    });
  });

  return listings;
}

const app = express();
app.use(express.static('public'));
app.use(proxy('https://www.rent.com.au', {
  proxyReqOptDecorator: function (proxyReqOpts, srcReq) {
    if (srcReq.url.indexOf('/properties') !== -1) {
      proxyReqOpts.headers["Accept"] = "text/html";
    }
    proxyReqOpts.headers["Cookie"] = "";
    proxyReqOpts.headers["Access-Control-Allow-Origin"] = "*";
    proxyReqOpts.headers["Access-Control-Allow-Methods"] = "*";
    proxyReqOpts.headers["Access-Control-Allow-Headers"] = "*";
    proxyReqOpts.headers["Access-Control-Allow-Credentials"] = "true";
    return proxyReqOpts;
  },
  userResDecorator: function(proxyRes, proxyResData, req, res) {
    res.set("Access-Control-Allow-Origin","*");
    res.set("Access-Control-Allow-Methods","*");
    res.set("Access-Control-Allow-Headers","*");
    res.set("Access-Control-Allow-Credentials","true");
    res.set("x-amz-apigw-id","");
    res.set("x-amzn-remapped-connection","");
    res.set("x-amz-apigw-id","");
    res.set("x-amzn-remapped-date","");
    res.set("x-amzn-remapped-server","");
    res.set("x-amzn-requestid","");
    res.set("x-amz-apigw-id","");
    res.set("x-content-type-options","");
    res.set("x-frame-options","");
    res.set("x-amz-apigw-id","");
    res.set("x-permitted-cross-domain-policies","*");
    res.set("x-amz-apigw-id","");
    res.set("x-powered-by","");
    res.set("x-render-origin-server","");
    res.set("x-request-id","");
    res.set("x-xss-protection","");
    res.set("referrer-policy","");
    res.set("link","");
    res.set("etag","");

    if (req.url.indexOf('/properties') !== -1) {
       res.set("content-type", "application/json; charset=utf-8");
       res.set("accept", "application/json");
       return JSON.stringify(extractListingDetails(proxyResData));
    }
    else{
       return proxyResData;
    }
  }
}));

const server = app.listen(443);