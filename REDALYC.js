{
	"translatorID": "d1ac3b4f-1aa7-4a76-a97e-cf3580a41c37",
	"label": "REDALYC",
	"creator": "Sebastian Karcher",
	"target": "^https?://(www.)?redalyc\\.(uaemex\\.mx|org)",
	"minVersion": "3.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcsibv",
	"lastUpdated": "2013-03-21 22:56:56"
}

/*
	Translator
   Copyright (C) 2013 Sebastian Karcher

   This program is free software: you can redistribute it and/or modify
   it under the terms of the GNU Affero General Public License as published by
   the Free Software Foundation, either version 3 of the License, or
   (at your option) any later version.

   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU Affero General Public License for more details.

   You should have received a copy of the GNU Affero General Public License
   along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

function detectWeb(doc,url) {
	var xpath='//meta[@name="citation_journal_title"]';
		
	if (ZU.xpath(doc, xpath).length > 0) {
		return "journalArticle";
	}
	if (url.indexOf("/home.oa")!=-1) {
		var searchxpath = "//a[contains(@href, 'articulo.oa?id=') and span[@class='titulo-resultado']]|//span[@class='resultado-articulo']/a[contains(@href, 'articulo.oa?id=')]"
		if (ZU.xpath(doc, searchxpath).length>0) {
			return "multiple";
		}
	}
	if (url.indexOf("/toc.oa?")!=-1) {
		var tocxpath = "//a[contains(@href, 'articulo.oa?id=') and span[@class='articulo-fasciculo']]";
		if (ZU.xpath(doc, tocxpath).length>0) {
			return "multiple";
		}	
	}
	return false;
}


function doWeb(doc,url)
{
	if (detectWeb(doc, url) == "multiple") {
		var hits = {};
		var urls = [];
		var results = ZU.xpath(doc,"//a[contains(@href, 'articulo.oa?id=') and span[@class='titulo-resultado']]|\
									//span[@class='resultado-articulo']/a[contains(@href, 'articulo.oa?id=')]");
		if (results.length<1){
			results = ZU.xpath(doc, "//a[contains(@href, 'articulo.oa?id=') and span[@class='articulo-fasciculo']]");
		}
		for (var i in results) {
			hits[results[i].href] = results[i].textContent.replace(/\[pdf\]\s* Redalyc\.?/, "");
		}
		Z.selectItems(hits, function(items) {
			if (items == null) return true;
			for (var j in items) {
				urls.push(j);
			}
			ZU.processDocuments(urls, doWeb);
		});
	} else {
		var translator = Zotero.loadTranslator('web');
		//use Embedded Metadata
		translator.setTranslator("951c027d-74ac-47d4-a107-9c3069ab7b48");
		translator.setDocument(doc);
		translator.setHandler('itemDone', function(obj, item) {
			if (item.title == item.title.toUpperCase()){
				item.title = ZU.capitalizeTitle(item.title.toLowerCase(), true)
			}
			item.complete();
		});
		translator.translate();
		};
}
/** BEGIN TEST CASES **/
var testCases = [
	{
		"type": "web",
		"url": "http://redalyc.uaemex.mx/buscador/search.jsp?query=argentina&fromresult=120",
		"items": "multiple"
	},
	{
		"type": "web",
		"url": "http://redalyc.uaemex.mx/redalyc/src/inicio/ArtPdfRed.jsp?iCve=63612750004",
		"items": [
			{
				"itemType": "journalArticle",
				"creators": [
					{
						"firstName": "Andrés J.",
						"lastName": "Kaczorkiewicz",
						"creatorType": "author"
					}
				],
				"notes": [],
				"tags": [],
				"seeAlso": [],
				"attachments": [
					{
						"title": "Full Text PDF",
						"mimeType": "application/pdf"
					},
					{
						"title": "Snapshot"
					}
				],
				"title": "Taxonomía Veterinaria en Argentina",
				"date": "2006",
				"publicationTitle": "REDVET. Revista Electrónica de Veterinaria",
				"issue": "8",
				"publisher": "Veterinaria Organización",
				"pages": "1-3",
				"url": "http://redalyc.uaemex.mx/redalyc/src/inicio/ArtPdfRed.jsp?iCve=63612750004",
				"accessDate": "CURRENT_TIMESTAMP",
				"libraryCatalog": "redalyc.uaemex.mx"
			}
		]
	},
	{
		"type": "web",
		"url": "http://www.redalyc.org/articulo.oa?id=32921102001",
		"items": [
			{
				"itemType": "journalArticle",
				"creators": [
					{
						"firstName": "Jairo Pimentel",
						"lastName": "Jr",
						"creatorType": "author"
					},
					{
						"firstName": "Maria do Socorro Sousa",
						"lastName": "Braga",
						"creatorType": "author"
					}
				],
				"notes": [],
				"tags": [
					"Partidos políticos",
					"comportamento eleitoral",
					"eleições presidenciais",
					"simpatia partidária",
					"ESEB2010",
					"Political parties",
					"electoral behavior",
					"presidential elections",
					"party sympathy",
					"CSES-ESEB2010"
				],
				"seeAlso": [],
				"attachments": [
					{
						"title": "Full Text PDF",
						"mimeType": "application/pdf"
					},
					{
						"title": "Snapshot"
					}
				],
				"itemID": "http://www.redalyc.org/articulo.oa?id=32921102001",
				"title": "Os partidos políticos brasileiros realmente não importam?",
				"publicationTitle": "Opinião Pública",
				"abstractNote": "Há décadas a constatação corrente no Brasil é de que os partidos pouco importam para explicar o comportamento dos eleitores brasileiros. Entretanto, esse cenário de baixa identificação partidária contrasta com a observação de que, ao menos para as eleições presidenciais a competição eleitoral tem se...",
				"date": "2011",
				"volume": "17",
				"issue": "2",
				"publisher": "Universidade Estadual de Campinas",
				"language": "pt",
				"pages": "271-303",
				"ISSN": "0104-6276, 1807-0191",
				"url": "http://www.redalyc.org/resumen.oa?id=32921102001",
				"accessDate": "CURRENT_TIMESTAMP",
				"libraryCatalog": "www.redalyc.org"
			}
		]
	},
	{
		"type": "web",
		"url": "http://redalyc.uaemex.mx/redalyc/src/inicio/IndArtRev.jsp?iCveNumRev=18017&iCveEntRev=1993",
		"items": "multiple"
	}
]
/** END TEST CASES **/