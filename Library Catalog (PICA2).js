{
	"translatorID": "5236e1d6-fcf2-4ed5-9165-cc5f345ce33e",
	"label": "Library Catalog (PICA2)",
	"creator": "Sean Takats, Michael Berkowitz, Sylvain Machefert, Sebastian Karcher, Aurimas Vinckevicius",
	"target": "^https?://[^/]+/DB=[\\dA-Z]",
	"minVersion": "3.0",
	"maxVersion": "",
	"priority": 100,
	"inRepository": true,
	"translatorType": 4,
	"browserSupport": "gcs",
	"lastUpdated": "2013-03-13 23:34:07"
}

/*
	***** BEGIN LICENSE BLOCK *****
	
	Copyright © 2013 Sebastian Karcher 
	This file is part of Zotero.
	
	Zotero is free software: you can redistribute it and/or modify
	it under the terms of the GNU Affero General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.
	
	Zotero is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU Affero General Public License for more details.
	
	You should have received a copy of the GNU Affero General Public License
	along with Zotero.  If not, see <http://www.gnu.org/licenses/>.
	
	***** END LICENSE BLOCK *****
*/

/*
Alternate PICA version, which provides metadata. Bibtex seemed to make sense, but RIS might be doable as an alternative.
*/
function detectWeb(doc, url) {
	var multxpath = "//table[@summary='Tab bar']/tbody/tr/td[@class='tab1']";
	if (!ZU.xpathText(doc, "//table[@summary='Tab bar']/tbody/tr/td[@class='tab1']")){
		//this for some permalinks:
		multxpath = "//table[@summary='Tab bar']/tbody/tr/td[@class='tab0']/a[contains(@href, 'PRS=')]";
	}
	if (elt = doc.evaluate(multxpath, doc, null, XPathResult.ANY_TYPE, null).iterateNext()) {
		var content = elt.textContent;
		if ((content == "Liste des résultats") || (content == "shortlist") || (content == 'Kurzliste') || content == 'titellijst') {
			return "multiple";
		} else if ((content == "Notice détaillée") || (content == "title data") || (content == "Besitznachweis(e)")|| (content == "Vollanzeige")|| (content == 'Titeldaten') || content == "Bestandsinfo"|| (content == 'full title') || (content == 'Titelanzeige' || (content == 'titelgegevens'))) {
			var xpathimage = "//table[@summary='presentation switch']/tbody/tr/td/img"; 
			if (elt = doc.evaluate(xpathimage, doc, null, XPathResult.ANY_TYPE, null).iterateNext()) {
				var type = elt.getAttribute('src');
				Z.debug(type);
				if (type.indexOf('article.') > 0) {
					return "journalArticle";
				} else if (type.indexOf('audiovisual.') > 0) {
					return "film";
				} else if (type.indexOf('book.') > 0) {
					return "book";
				} else if (type.indexOf('handwriting.') > 0) {
					return "manuscript";
				} else if (type.indexOf('sons.') > 0 || type.indexOf('sound.') > 0 || type.indexOf('score') > 0) {
					return "audioRecording";
				} else if (type.indexOf('thesis.') > 0) {
					return "thesis";
				} else if (type.indexOf('map.') > 0) {
					return "map";
				}
			}
			return "book";
		}
	}
}

function scrape(doc, url) {
	//get permalink
	var permalink = ZU.xpathText(doc, '//a[(contains(@href, "PPN?PPN=") or contains(@href, "PPNSET?PPN=")) and img[contains(@src, "zitierlink")]]/@href');
	if (permalink && permalink.indexOf("http://")==-1) permalink = "http://" + doc.location.host + permalink;
	
	//construct bibtex url
	if (url.indexOf("/PRS=")!=-1) var bibtexurl = url.replace(/PRS=[^\/]+/, "PRS=bibtex") + "&SHOWHOLDINGONLY=N";
	else var bibtexurl = url.replace(/(DB=[^\/]+\/)/, "$1PRS=bibtex/") + "&SHOWHOLDINGONLY=N";
	
	//get catalog Name
	var libraryCatalog = ZU.xpathText(doc, '//head/title');
	
	Z.debug(bibtexurl)
	
	ZU.processDocuments(bibtexurl, function(doc){
		var bibtex = ZU.xpathText(doc, '//table[@summary="content layout"]');
		//we can have garbage after the bibtex, but note before.
		bibtex=ZU.trimInternal(bibtex).replace(/^.*?@/, "@")
		//Z.debug(bibtex);
		//this is provisional. should be fixed in bibtex
		bibtex = bibtex.replace(/location\s*=\s*\{/, "bestand = {")
		var bestand = bibtex.match(/bestand\s*=\s*\{([^\}]+)\}/);
		var size = bibtex.match(/size\s*=\s*\{([^\}]+)\}/);
		var translator = Zotero.loadTranslator("import");
		translator.setTranslator("9cb70025-a888-4a29-a210-93ec52da40d4");
		translator.setString(bibtex);
		translator.setHandler("itemDone", function(obj, item) {
			item.url="";
			if (bestand) item.notes.push("Bestand: " + bestand[1]);
			if (size) item.numPages = size[1];
			if (item.numPages) item.numPages = item.numPages.replace(/[sp]\.?\s*$/i, "");
			item.title = item.title.replace(/\s+\:/, ":")
			if (item.extra){
				item.notes.push(item.extra);
				item.extra="";
			}
			if (libraryCatalog) item.libraryCatalog = libraryCatalog.replace(/\s*\-\s*results\/titledata/, "");
			for (i in item.creators){
				if (item.creators[i].firstName){
					item.creators[i].firstName = item.creators[i].firstName.replace(/\s*\[.+\]\s*$/, "");
				}
			}
			if (permalink) item.attachments = [{url:permalink, title: "Link to Library Catalog", mimeType: "text/html", snapshot: false}];
			item.complete();
		});	
		translator.translate();
		
	})
}

function doWeb(doc, url) {
	var type = detectWeb(doc, url);
	if (type == "multiple") {
		var newUrl = doc.evaluate('//base/@href', doc, null, XPathResult.ANY_TYPE, null).iterateNext().nodeValue;
		var xpath = "//td[@class='hit']/a";
		var elmts = doc.evaluate(xpath, doc, null, XPathResult.ANY_TYPE, null);
		var elmt = elmts.iterateNext();
		var availableItems = new Array();
	
		while (elmt = elmts.iterateNext()){
		availableItems[elmt.href] = elmt.textContent
		};
		Zotero.selectItems(availableItems, function (items) {
			if (!items) {
				return true;
			}
			var uris = new Array();
			for (var i in items) {
				uris.push(i);
			}
			ZU.processDocuments(uris, scrape)
		});
	} else if (type != "") {
		scrape(doc, url);
	}
}/** BEGIN TEST CASES **/
var testCases = [
	{
		"type": "web",
		"url": "http://swb.bsz-bw.de/DB=2.1/PPNSET?PPN=012099554&INDEXSET=1",
		"items": [
			{
				"itemType": "book",
				"creators": [
					{
						"firstName": "Emir",
						"lastName": "Rodríguez Monegal",
						"creatorType": "author"
					},
					{
						"firstName": "Jorge Luis",
						"lastName": "Borges",
						"creatorType": "author"
					}
				],
				"notes": [
					"Bestand: Universitätsbibliothek Tübingen <21> [Signatur: 27 A 4742];Universitätsbibliothek Freiburg <25> [Signatur: TM 86/5922];Universitätsbibliothek Konstanz <352> [Signatur: spa 959:b732:q/r62];Universität Heidelberg, Romanisches Seminar <16/143> [Signatur: bestellt];Badische Landesbibliothek <31> [Signatur: 86 A 11242];",
					"Enth. Werke von und über Borges"
				],
				"tags": [
					"",
					"Borges",
					"Jorge Luis"
				],
				"seeAlso": [],
				"attachments": [
					{
						"title": "Link to Library Catalog",
						"mimeType": "text/html",
						"snapshot": false
					}
				],
				"title": "Borges por el mismo",
				"series": "Laia literatura",
				"place": "Barcelona",
				"publisher": "Ed. laia",
				"date": "1984",
				"ISBN": "84-7222-967-X",
				"numPages": "255",
				"libraryCatalog": "SWB Online-Katalog"
			}
		]
	},
	{
		"type": "web",
		"url": "http://cbsopac.rz.uni-frankfurt.de/DB=2.1/PPNSET?PPN=318490412",
		"items": [
			{
				"itemType": "book",
				"creators": [
					{
						"firstName": "Georg",
						"lastName": "Borges",
						"creatorType": "author"
					},
					{
						"firstName": "Jörg",
						"lastName": "Schwenk",
						"creatorType": "editor"
					}
				],
				"notes": [
					"Description based upon print version of recordOnline-Ausg.:"
				],
				"tags": [
					"",
					"Law / Computers / Commercial law / Mass media"
				],
				"seeAlso": [],
				"attachments": [
					{
						"title": "Link to Library Catalog",
						"mimeType": "text/html",
						"snapshot": false
					}
				],
				"title": "Daten- und Identitätsschutz in Cloud Computing, E-Government und E-Commerce",
				"abstractNote": "F r neue und k nftige Gesch ftsfelder von E-Commerce und E-Government stellen der Datenschutz und der Identit tsschutz wichtige Herausforderungen dar. Renommierte Autoren aus Wissenschaft und Praxis widmen sich in dem Band aktuellen Problemen des Daten- und Identit tsschutzes aus rechtlicher und technischer Perspektive. Sie analysieren aktuelle Problemf lle aus der Praxis und bieten Handlungsempfehlungen an. Das Werk richtet sich an Juristen und technisch Verantwortliche in Beh rden und Unternehmen sowie an Rechtsanw lte und Wissenschaftler.",
				"place": "Berlin, Heidelberg",
				"publisher": "Imprint: Springer",
				"date": "2012",
				"ISBN": "978-3-642-30101-8",
				"numPages": "188",
				"libraryCatalog": "HeBIS-Verbundkatalog"
			}
		]
	},
	{
		"type": "web",
		"url": "http://swb2.bsz-bw.de/DB=2.340/PPNSET?PPN=371777577&INDEXSET=1",
		"items": [
			{
				"itemType": "book",
				"creators": [
					{
						"firstName": "Georg",
						"lastName": "Borges",
						"creatorType": "editor"
					}
				],
				"notes": [
					"Bestand: Universität des Saarlandes, Deutsch-Europäisches Juridicum <291/102> [Signatur: bestellt];",
					"Erscheint: Mai 2013"
				],
				"tags": [],
				"seeAlso": [],
				"attachments": [
					{
						"title": "Link to Library Catalog",
						"mimeType": "text/html",
						"snapshot": false
					}
				],
				"title": "Cloud computing",
				"place": "München",
				"publisher": "Beck",
				"date": "2013",
				"ISBN": "978-3-406-64590-7",
				"numPages": "700",
				"libraryCatalog": "Saarländischen Virtuellen Katalog"
			}
		]
	},
	{
		"type": "web",
		"url": "https://pica1l.ulb.tu-darmstadt.de/DB=FHBWI/PPN?PPN=221765255",
		"items": [
			{
				"itemType": "book",
				"creators": [
					{
						"firstName": "Bernie",
						"lastName": "Borges",
						"creatorType": "author"
					}
				],
				"notes": [
					"Bestand: u? [Signatur: 20 HKM 212 263];u? [Signatur: 20 HKM 212 263];"
				],
				"tags": [
					"",
					"Marketing / World Wide Web 2.0"
				],
				"seeAlso": [],
				"attachments": [
					{
						"title": "Link to Library Catalog",
						"mimeType": "text/html",
						"snapshot": false
					}
				],
				"title": "Marketing 2.0: bridging the gap between seller and buyer through social media marketing",
				"place": "Tucson, Ariz.",
				"publisher": "Wheatmark",
				"date": "2009",
				"ISBN": "978-1-60494-288-0",
				"numPages": "XII, 299",
				"libraryCatalog": "Katalog - Hochschule RheinMain",
				"shortTitle": "Marketing 2.0"
			}
		]
	}
]
/** END TEST CASES **/