var exports = exports || {};

define.call(exports, {

	mainPage: "<div id='wrapper'>\
			<div id='logoWrapper'>\
				<div id='photopop_logo'>\
					<img src='{{#image}}PHOTOPOP_LOGO{{/image}}'/><br/>\
				</div>\
			</div>\
			<div id='buttonWrapper'>\
				<div id='button_scores'>\
					<img src='{{#image}}buttonSrc_scores{{/image}}'/>\
				</div>\
				<div id='button_tutorial'>\
					<a href='{{#url}}tutorialButtonUrl{{/url}}'><img src='{{#image}}buttonSrc_tutorial{{/image}}'/></a>\
				</div>\
				<div id='button_volume'>\
					<img class='on' src='{{#image}}buttonSrc_volumeOn{{/image}}'/>\
					<img class='off' src='{{#image}}buttonSrc_volumeOff{{/image}}'/>\
				</div>\
			</div>\
		</div>",
	
	selectorScreen: "<div id='sliderWrapper'>\
			<div class='sliderContent' data-scroll='x'>\
				<ul>{{#games}}\
					<li class='gameIcon' data-gameurl='{{gameUrl}}'>\
						<img src ='{{#image}}gameicon_{{name}}{{/image}}'><br/>\
						<div class='gameName'>\
							{{gameName}}\
						</div>\
					</li>\
				{{/games}}</ul> \
			</div>\
		</div>",
	
	gameScreen: "<div id='gameWrapper'><img src='{{path}}'/></div>"
});
