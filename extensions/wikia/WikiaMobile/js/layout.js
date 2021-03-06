/* global wgStyleVersion*/
/**
 * @define layout
 * @requires section, media, cache
 *
 * Layout handling of WikiaMobile
 * ie. Sections, Images, Galleries etc.
 */
define('layout', ['sections', 'media', require.optional('cache')], function(sections, media, cache) {
	'use strict';

	//init sections
	sections.init();

	var d = document,
		pageContent = d.getElementById('mw-content-text') || d.getElementById('wkMainCnt'),
		images = d.getElementsByClassName('media'),
		selector = 'table:not(.toc):not(.infobox)',
		tables = d.querySelectorAll(selector),
		processedSections = [],
		tablesKey = 'wideTables' + wgStyleVersion,
		ttl = 604800, //7days
		assets,
		width,
		process = function(res){
			!assets && cache && cache.set(tablesKey, res, ttl);

			if(res) {
				var scripts = res.scripts,
					l = scripts.length,
					i = 0;

				Wikia.processStyle(res.styles);

				for(; i < l; i++ ){
					Wikia.processScript(scripts[i]);
				}
			}

			require(['tables'], function(t){
				t.process(Wikia.not('.artSec table, table table', tables));

				sections.addEventListener('open', function(){
					var index = ~~this.getAttribute('data-index');

					if(!processedSections[index]){
						t.process(Wikia.not('table table', this.querySelectorAll(selector)));
						processedSections[index] = true;
					}
				});
			});
		};

	//tables
	if(tables && tables.length > 0){
		assets = cache && cache.get(tablesKey);

		if(Features.gameguides || assets){
			process(assets);
		}else{
			Wikia.getMultiTypePackage({
				scripts: 'wikiamobile_tables_js' + (Features.overflow ? '' : ',wikiamobile_scroll_js'),
				styles: '/extensions/wikia/WikiaMobile/css/tables.scss',
				ttl: ttl,
				callback: process
			});
		}
	}

	//init media
	media.init(images);

	//page width
	window.addEventListener('viewportsize', function(){
		width = pageContent.offsetWidth;
	});

	return {
		getPageWidth: function(){
			return width ? width : (width = pageContent.offsetWidth);
		}
	};
});