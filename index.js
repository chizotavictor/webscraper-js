const express = require('express');
const redisClient = require('redis');
const app = express();
const $ = require('cheerio');
const rp = require('request-promise');
const redisConnection = "";
const port = 3000;

const serverUrl = "http://localhost/housing/api/relay-scrapped-results";

app.get("/", (req, res) => {
    res.status(200).json({ text: "Initializing Scraper...", version: "v1"});
});

app.get("/fsbo", (req, res) => {
    const fsbo = "https://fsbo.com";
    const fsboUrl = "https://fsbo.com/listings/search/results/";
    rp(fsboUrl)
        .then( (html) => {
            let result = [];
            $('.listing-item', html).each((i, el) => {
                const r = $(el)
                    .find('h4 a');
                const rImg = $(el)
                    .find('a img');
                const price = $(el)
                    .find('div h4');
                const description = $(el)
                    .find('div p');

                const priceTag = price.text();
                let pt = "";
                if(priceTag) {
                    let tag = priceTag.split('$');
                    if(tag.length > 0) pt = tag[1];
                }
                result.push({
                    resource_root: fsbo,
                    resource_link: r.attr('href'),
                    resource_link_caption: r.text(),
                    resource_image: rImg.attr('src'),
                    resource_price: pt,
                    price_currency_symobol: '$',
                    price_currency: 'US Dollar',
                    selling_caption: description.text()
                }); 
            });
            res.status(200).json({action: "Scrapping done!", data: result, rows: result.length});
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({action: "Scrapping Error", error: err});
        })
});

app.get("/green-housere", (req, res) => {
    const fsbo = "https://www.glasshousere.com/";
    const fsboUrl = "https://www.glasshousere.com/glasshouse-real-estate-listings/all";
    rp(fsboUrl)
        .then( (html) => {
            let result = [];
            $('.grid__item', html).each((i, el) => {
                const r = $(el);
                
                if (r.find('.image-wrapper a img').attr('src'))
                    result.push({
                        resource_image: r.find('.image-wrapper a img').attr('src'),
                        resource_link: r.find('div div a').attr('href'),
                        resource_link_caption: r.find('div div a h2').text().trim()
                    })
            });
            res.status(200).json({action: "Scrapping done!", data: result, rows: result.length});
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({action: "Scrapping Error", error: err});
        })
});

app.listen(port, () => {
    console.log(`The application uis running on: ${port}`);
});