$(function() {
	WikiaSearchApp.init();
});

WikiaSearchApp = {
	searchForm: false,
	searchField: false,

	ads: false,

	track: function(url) {
		$.tracker.byStr('module/search/' + url);
	},

	init : function() {
		WikiaSearchApp.searchForm = $('#WikiaSearch');
		WikiaSearchApp.searchFormBottom = $('#search');
		WikiaSearchApp.searchField = WikiaSearchApp.searchForm.children('input[placeholder]');

		// RT #141437 - hide HOME_TOP_RIGHT_BOXAD when showing search suggestions
		WikiaSearchApp.ads = $("[id$='TOP_RIGHT_BOXAD']");

		WikiaSearchApp.searchField.bind({
			'suggestShow': WikiaSearchApp.hideAds,
			'suggestHide': WikiaSearchApp.showAds
		});

		// load autosuggest code on first focus
		WikiaSearchApp.searchField.one('focus', WikiaSearchApp.initSuggest);

		// track form submittion
		WikiaSearchApp.searchForm.submit(function(ev) {
			WikiaSearchApp.track('submit');
		});
		WikiaSearchApp.searchFormBottom.submit(function(ev) {
			WikiaSearchApp.track('submit');
		});
	},

	hideAds: function() {
		WikiaSearchApp.ads.each(function() {
			$(this).children().css('margin-left', '-9999px');
		});
	},

	showAds: function() {
		WikiaSearchApp.ads.each(function() {
			$(this).children().css('margin-left', 'auto');
		});
	},

	// download necessary dependencies (AutoComplete plugin) and initialize search suggest feature for #search_field
	initSuggest: function() {
		$.loadJQueryAutocomplete(function() {
			WikiaSearchApp.searchField.autocomplete({
				serviceUrl: wgServer + wgScript + '?action=ajax&rs=getLinkSuggest&format=json',
				onSelect: function(v, d) {
					WikiaSearchApp.track('suggest');
					window.location.href = wgArticlePath.replace(/\$1/, encodeURIComponent(v.replace(/ /g, '_')));
				},
				appendTo: '#WikiaSearch',
				deferRequestBy: 250,
				maxHeight: 1000,
				selectedClass: 'selected',
				width: '270px',
				skipBadQueries: true // BugId:4625 - always send the request even if previous one returned no suggestions
			});
		});
	}
};