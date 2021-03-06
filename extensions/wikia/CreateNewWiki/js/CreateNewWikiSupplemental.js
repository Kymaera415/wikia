// ThemeDesigner.js overwrites
ThemeDesigner.init = function() {
	$('#ThemeTab li label').remove();
};
ThemeDesigner.set = function(setting, newValue) {
	ThemeDesigner.settings = themes[newValue];
	var sassUrl = $.getSassCommonURL('/skins/oasis/css/oasis.scss', ThemeDesigner.settings);
	$.getCSS(sassUrl, function(link) {
		$(ThemeDesigner.link).remove();
		ThemeDesigner.link = link;
	});
};
ThemeDesigner.save = function() {

};