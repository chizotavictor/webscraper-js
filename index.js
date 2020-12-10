const express = require('express');
const redisClient = require('redis');
const app = express();
const $ = require('cheerio');
const r = require('request');
const rp = require('request-promise');
const knex = require('./db/knex');
const redisConnection = "";
const port = 3000;

const serverUrl = "http://localhost/housing/api/relay-scrapped-results";

async function processFsboDetails(result, path) {
  let larr = [];
  for (var r of result) {
    const self = r;
    return r;
    // return r(path);
      // .then( (html) => {
      //     let xl = $.load(html);
      //     let price = xl('.address-copy .price').text();
      //     console.log(larr);
      //     larr.push(larr, { price: price })
      // });
  }
}

app.get("/", (req, res) => {
    res.status(200).json({ text: "Initializing Scraper...", version: "v1"});
});

app.get('/check', (req, res) => {
    knex.raw("select * from users").then(function(records) {
        res.json(records);
    });
})

app.get("/fsbo", (req, res) => {
    const fsbo = "https://fsbo.com";
    const fsboUrl = "https://fsbo.com/listings/search/results/";
    rp(fsboUrl)
        .then( (html) => {
            this['result'] = [];
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
 
                let obj = {
                    resource_root: fsbo,
                    resource_link: r.attr('href'),
                    resource_link_caption: r.text(),
                    resource_image: fsbo +  rImg.attr('src'),
                    resource_price: pt,
                    price_currency_symobol: '$',
                    price_currency: 'US Dollar',
                    selling_caption: description.text(),
                };

                rp(r.attr('href'))
                    .then( (sHtml) => {
                        let xl = $.load(sHtml);
                        let name = xl('.description h1').text()
                        let address = xl('.address-copy .address').text()
                        let price = xl('.address-copy .price').text()
                        let c_name = xl('#sellerModal div div .modal-body .row').html()
                        let description = xl('.property-description').html()
                        obj['price'] = price
                        obj['description'] = description
                        obj['details'] = { price: price, contact: c_name }

                        this.result.push(obj);
                        const today = new Date();
                        // console.log(description)
                        knex('properties').insert({
                            origin: 'fsbo.com',
                            resource_link: obj.resource_link,
                            name: name,
                            address: address,
                            description: description,
                            contact_html: c_name,
                            images: obj.resource_image,
                            price: obj.price,
                            created_at: today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate()
                        }).then( function (result) {
                            console.log(result)
                         })
                    });        
            });
            // res.status(200).json({action: result});

            /*
            // let pRes = processFsboDetails(result, r.attr('href'));
            // console.log(pRes);
            this.result.forEach((item, i) => {
              item.details['path'] = item.resource_link;
            //   var self = item;
              this['item'] = {} // item
              let self = this;
              rp(item.resource_link)
                .then( (sHtml) => {
                    let xl = $.load(sHtml);
                    let price = xl('.address-copy .price').text()
                    self['priceX'] = price
                    console.log(self)
                });
                console.log(self);
                this.result['x'] = this.item;
                this['item'] = {};
            });
            */


            res.status(200).json({action: "Scrapping done!", rows: this.result.length});
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({action: "Scrapping Error", error: err});
        })
});

app.get("/green-housere", (req, res) => {
    const site = "https://www.glasshousere.com/";
    const siteUrl = "https://www.glasshousere.com/glasshouse-real-estate-listings/all";
    rp(siteUrl)
        .then( (html) => {
            let result = [];
            $('.grid__item', html).each((i, el) => {
                const r = $(el);

                if (r.find('.image-wrapper a img').attr('src'))
                    result.push({
                        resource_root: site,
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

app.get("/modern-homes", (req, res) => {
    const site = "https://www.dcmodernhomes.com/";
    const siteUrl = "https://www.dcmodernhomes.com/luxury-homes-for-sale-in-the-washington-metropolitana-area.php";
    rp(siteUrl)
        .then( (html) => {
            let result = [];
            $('.article--listing', html).each((i, el) => { //div
                const r = $(el);
                let rDims = [];
                result.push({
                    resource_root: site,
                    resource_image: r.find('div a img').attr('src'),
                    resource_link: r.find('div a').attr('href'),
                    resource_link_caption: r.find('div h3 a').text().trim(),
                    resource_price: r.find('div div').text(),
                    // resource_dimension: rDims,
                    price_currency_symobol: '$',
                    price_currency: 'US Dollar',
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
    console.log(`The application is running on: ${port}`);
});
