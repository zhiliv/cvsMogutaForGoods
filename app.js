//библиотека для работы с асинхронными операциями
const async = require('async');
//библиотека для работы с промисами
const q = require('q');
//модуль для работы с файловой системой
const fs = require('fs');
//подключение библиотеки для работы со временем
const moment = require('moment');

const clc = require('cli-color');
const js2xmlparser = require('js2xmlparser');
const _ = require('underscore');
var innertext = require('innertext');

/**
 * Поулчение содержисого файла
 */
const getDataFile = async() => {
    let defer = q.defer();
    fs.readFile('input.json', 'utf8', function(error, data) {
        defer.resolve(JSON.parse(data));
    });
    return defer.promise;
};

const getCategory = async() => {
    let defer = q.defer();
    fs.readFile('category.json', 'utf8', function(error, data) {
        defer.resolve(JSON.parse(data));
    });
    return defer.promise;
};

let structureXML = {
    shop: {
        name: 'Экодом',
        company: 'ООО Экодом',
        url: 'https://bio-smak.shop/',
        categories: { category: [] },
        currencies: {
            currency: {
                '@': {
                    id: 'RUR',
                    rate: '1'
                }
            }
        },
        offers: { offers: [] }
    }
};

let structureXML1 = {
    shop: {
        name: 'Экодом',
        company: 'ООО Винокома',
        url: 'https://bio-smak.shop/',
        categories: { category: [] },
        currencies: {
            currency: {
                '@': {
                    id: 'RUR',
                    rate: '1'
                }
            }
        },
        offers: { offers: [] }
    }
};



const getObjKategory = async() => {
    let defer = q.defer();
    let list;
    await getCategory().then(res => {
        list = res;
    });
    let arr = [];
    await async.eachOfSeries(list, async(row, ind) => {
        if (row['id родительской категории'] == 0) {
            let obj = {
                '@': { id: row['ID категории'] },
                '#': row['Название категории'].replace(/\"/g, '')
                    .replace(/\??/g, '')
                    .replace(/\//g, '')
                    .replace(/\s{2,}/g, ' ')
            };
            arr.push(obj);
        }
    });

    let arr2 = [];
    await async.eachOfSeries(list, async(row_list, ind_list) => {
        await async.eachOfSeries(arr, async(row_arr, ind_arr) => {
          console.log(row_list['id родительской категории'] )
            if (row_arr['@']['id'] == row_list['id родительской категории']) {
                let obj = {
                    '@': { id: row_list['ID категории'], parentId: row_list['id родительской категории'] },
                    '#': row_list['Название категории'].replace(/\"/g, '')
                        .replace(/\??/g, '')
                        .replace(/\//g, '')
                        .replace(/\s{2,}/g, ' ')
                };
                delete list[ind_list];
                arr.push(obj);
                arr2.push(obj);
            }
        });
    });
    structureXML.shop.categories.category = arr;
    structureXML1.shop.categories.category = arr;
    defer.resolve(arr);
    return defer.promise;
};

getDataFile().then(async csv => {
    let cat;
    await getObjKategory();
    let arr = [];
    let arr1 = [];
    let len = 0;
    let allcategories = [];
    await getCategory().then(res => {
        allcategories = res;
    });
    await async.eachOfSeries(csv, async(row, ind) => {
        let cat
        if(row['Связанные артикулы'] != null){
        await async.eachOfSeries(allcategories, async(row_allcategories, ind_allcategories) => {
            if (row['URL категории'].indexOf(row_allcategories['URL категории']) != -1) {
                cat = row_allcategories['ID категории']
            }
        })
        let obj = {
            '@': { id: row['ID товара'], available: 'true' },
            url: `https://bio-smak.shop/${row['URL категории']}/${row['URL товара']}`,
            name: innertext(row['Товар'])
                .replace(/\"/g, '')
                .replace(/\??/g, '')
                .replace(/\//g, '')
                .replace(/\s{2,}/g, ' '),
            description: `\n${innertext(row['Описание'])
        .replace(/\"/g, '')
        .replace(/\??/g, '')
        .replace(/\//g, '')
        .replace(/\s{2,}/g, ' ')}`,
            price: row['Цена'],
            categoryId: cat,
            picture: row['Ссылка на изображение'],
            barcode: row['Связанные артикулы'],
        };

console.log('obj', obj.name)
        if (
            obj.name.indexOf('Transvital') != -1 ||
            obj.name.indexOf('transvital') != -1 ||
            obj.name.indexOf('Biorepair') != -1 ||
            obj.name.indexOf('biorepair') != -1 ||
            obj.name.indexOf('BlanX') != -1 ||
            obj.name.indexOf('blanX') != -1 ||
            obj.name.indexOf('blanx') != -1 ||
            obj.name.indexOf('Дезодорант Bionsen') != -1 ||
            obj.name.indexOf('Cпрей Bionsen') != -1 ||
            obj.description.indexOf('Transvital') != -1 ||
            obj.description.indexOf('transvital') != -1 ||
            obj.description.indexOf('Biorepair') != -1 ||
            obj.description.indexOf('biorepair') != -1 ||
            obj.description.indexOf('BlanX') != -1 ||
            obj.description.indexOf('blanX') != -1 ||
            obj.description.indexOf('blanx') != -1
        ) {
            arr.push(obj);
        } else {
            arr1.push(obj);
        }
      }
        if (ind == csv.length - 1) {
            structureXML.shop.offers.offer = arr;
            structureXML1.shop.offers.offer = arr1;

            //console.log('res', obj);
            let resultXML = js2xmlparser.parse(`yml_catalog`, structureXML);
            let resultXML1 = js2xmlparser.parse(`yml_catalog`, structureXML1);

            fs.writeFileSync('ecodom.xml', resultXML.toString());
            fs.writeFileSync('vinokoma.xml', resultXML1.toString());
            //fs.writeFileSync('dez.xml', resultXML.toString());
        }
    });
});