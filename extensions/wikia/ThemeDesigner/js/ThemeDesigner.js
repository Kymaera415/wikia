var ThemeDesigner = {
	slideByDefaultWidth: 760,
	slideByItems: 5,
	isSliding: false,

	track: function(url) {
		$.tracker.byStr('themedesigner/' + url);
	},

	init: function() {
		// theme settings
		ThemeDesigner.settings = window.themeSettings;

		// settings history
		ThemeDesigner.history = window.themeHistory;

		// themes
		ThemeDesigner.themes = window.themes;

		$().log(ThemeDesigner, 'ThemeDesigner');

		// iframe resizing
		$(window).resize(ThemeDesigner.resizeIframe).resize();

		// handle navigation clicks - switching between tabs
		$("#Navigation a").click(ThemeDesigner.navigationClick);

		// handle "Save" button clicks
		$('#Toolbar').find(".save").click(ThemeDesigner.saveClick);

		// handle "Cancel" button clicks
		$('#Toolbar').find(".cancel").click(ThemeDesigner.cancelClick);

		// init tabs
		ThemeDesigner.themeTabInit();
		ThemeDesigner.customizeTabInit();
		ThemeDesigner.wordmarkTabInit();

		// click appropriate tab based on the settings
		if(ThemeDesigner.settings["theme"] == "custom") {
			$('#Navigation [rel="CustomizeTab"]').click();
		} else {
			$('#Navigation [rel="ThemeTab"]').click();
		}

		// init Tool Bar
		ThemeDesigner.toolBarInit();

		ThemeDesigner.applySettings(false, false);
		
		// init tooltips
		$('.form-questionmark').wikiaTooltip(function(el){
			return el.data('tooltip');
		}, { hoverStay: true, maxWidth: '200', side: 'right', align: 'middle' })

		// track page view
		ThemeDesigner.track('open');
	},

	themeTabInit: function() {

		var slideBy = ThemeDesigner.slideByDefaultWidth;
		var slideMax = -Math.floor($("#ThemeTab .slider ul li").length / ThemeDesigner.slideByItems) * ThemeDesigner.slideByDefaultWidth;

		// click handler for next and previous arrows in theme slider
		$("#ThemeTab .previous, #ThemeTab .next").click(function(event) {
			event.preventDefault();
			if (!ThemeDesigner.isSliding) {
				var list = $("#ThemeTab .slider ul");
				var arrow = $(this);
				var slideTo = null;

				// prevent disabled clicks
				if(arrow.hasClass("disabled")) {
					return;
				}

				ThemeDesigner.isSliding = true;
				// slide
				if (arrow.hasClass("previous")) {
					slideTo = parseInt(list.css("margin-left")) + slideBy;
				} else {
					slideTo = parseInt(list.css("margin-left")) - slideBy;
				}
				list.animate({marginLeft: slideTo}, "slow", function() {
					ThemeDesigner.isSliding = false;
				});

				// calculate which buttons should be enabled
				if (slideTo == slideMax) {
					$("#ThemeTab .next").addClass("disabled");
					$("#ThemeTab .previous").removeClass("disabled");
				} else if (slideTo == 0) {
					$("#ThemeTab .next").removeClass("disabled");
					$("#ThemeTab .previous").addClass("disabled");
				} else {
					$("#ThemeTab .next, #ThemeTab .previous").removeClass("disabled");
				}

				ThemeDesigner.track('theme/arrow');
			}
		});

		// click handler for themes thumbnails
		$("#ThemeTab").find(".slider").find("li").click(function() {
			// highlight selected theme
			$(this).parent().find(".selected").removeClass("selected");
			$(this).addClass("selected");

			ThemeDesigner.set("theme", $(this).attr("data-theme"));

			ThemeDesigner.track('theme/click');
		});

		// select current theme
		$("#ThemeTab").find('[data-theme=' + ThemeDesigner.settings["theme"] + ']').addClass("selected");
	},

	customizeTabInit: function() {
		$("#CustomizeTab").find("li").find("img[id*='color']").click(function(event) {
			ThemeDesigner.showPicker(event, "color");
		});
		$("#swatch-image-background").click(function(event) {
			ThemeDesigner.showPicker(event, "image");
		});
		$("#tile-background").change(function() {
			if ($(this).attr("checked")) {
				ThemeDesigner.set("background-tiled", "true");
			} else {
				ThemeDesigner.set("background-tiled", "false");
			}
			ThemeDesigner.track('customize/background-image/tile');
		});
		$("#fix-background").change(function() {
			ThemeDesigner.set("background-fixed", $(this).attr("checked") ? "true" : "false");
		});

		var currentVal = ThemeDesigner.settings["page-opacity"];
		var base = 70;
		$("#OpacitySlider").slider({
			value: 100 - (((currentVal - base) / base) * 100),
			stop: function(e, ui) {
				var val = ui.value;
				var wikiaNormalized = 100 - Math.round((val/100) * (100 - base));
				ThemeDesigner.set("page-opacity", wikiaNormalized);
			}
		});
	},

	wordmarkTabInit: function() {
		// handle font family and font size menu change
		$("#wordmark-font").change(function() {
			ThemeDesigner.set("wordmark-font", $(this).val());

			ThemeDesigner.track('wordmark/font');
		});
		$("#wordmark-size").change(function() {
			ThemeDesigner.set("wordmark-font-size", $(this).val());

			ThemeDesigner.track('wordmark/size');
		});

		// handle wordmark editing
		$("#wordmark-edit").find("button").click(function(event) {
			event.preventDefault();
			ThemeDesigner.set("wordmark-text", $("#wordmark-edit").find('input[type="text"]').val());

			ThemeDesigner.track('wordmark/save');
		});

		//graphic wordmark clicking
		$("#WordmarkTab").find(".graphic").find(".preview").find(".wordmark").click(function() {
			ThemeDesigner.set("wordmark-type", "graphic");

			ThemeDesigner.track('wordmark/choose');
		});

		//grapic wordmark button
		$("#WordmarkTab").find(".graphic").find(".preview").find("a").click(function(event) {
			event.preventDefault();
			ThemeDesigner.set("wordmark-type", "text");

			ThemeDesigner.track('wordmark/nowordmark');
		});
	},

	wordmarkShield: function() {
		if (ThemeDesigner.settings["wordmark-type"] == "graphic") {
			$("#wordmark-shield")
			.css({
				height: $("#wordmark-shield").parent().outerHeight(true),
				width: $("#wordmark-shield").parent().outerWidth(true)
			})
			.show();
		} else {
			$("#wordmark-shield").hide();
		}
	},

	toolBarInit: function() {
		// TODO: optimize jQuery selectors
		$("#Toolbar .history").click(function() {
			$(this).find("ul").css("display", "block");
			ThemeDesigner.track('previous/click');
		});
		$("#Toolbar .history ul").mouseleave(function() { $(this).css("display", "none"); });
		$("#Toolbar .history ul li").click(ThemeDesigner.revertToPreviousTheme);
	},

	showPicker: function(event, type) {
		$().log("running showPicker");
		ThemeDesigner.hidePicker();
		event.stopPropagation();
		var swatch = $(event.currentTarget);
		var swatchName = event.currentTarget.className;

		ThemeDesigner.track('customize/' + swatchName + '/click');

		// check the type (color or image)
		if(type == "color") {

			//add swatches from array
			var swatchNodes = "";
			for (var i=0; i<ThemeDesigner.swatches[swatchName].length; i++) {
				swatchNodes += '<li style="background-color: #' + ThemeDesigner.swatches[swatchName][i] + ';"></li>';
			}
			$("#ThemeDesignerPicker").children(".color").find(".swatches").append(swatchNodes);

			//add user color if different than swatches
			var swatches = $("#ThemeDesignerPicker").children(".color").find(".swatches");
			var duplicate = false;
			swatches.find("li").each(function() {
				if(swatch.css("background-color") == $(this).css("background-color")) {
					duplicate = true;
					return false;
				}
			});

			if(!duplicate) {
				swatches.append('<li class="user" style="background-color: ' + swatch.css("background-color") + '"></li>');
			}

			// handle swatch clicking
			swatches.find("li").click(function() {
				ThemeDesigner.hidePicker();
				ThemeDesigner.set(swatch.attr("class"), ThemeDesigner.rgb2hex($(this).css("background-color")));
				ThemeDesigner.set("theme", "custom");

				ThemeDesigner.track('customize/' + swatchName + '/color');
			});

			//handle custom colors
			$("#ColorNameForm").submit(function(event) {
				event.preventDefault();

				var color = $.trim($("#color-name").val().toLowerCase());

				// was anything submitted?
				if (color == "" || color == $("#color-name").attr("placeholder")) {
					return;
				}

				// RT:70673 trim string
				//color = $.trim(color);

				// add hash if needed
				var expression = /^[0-9a-f]{3,6}/i;
				if (expression.test(color)) {
					color = "#" + color;
				}

				// test color
				$('<div id="ColorTester"></div>').appendTo(document.body);
				try {
					$("#ColorTester").css("background-color", color);
				} catch(error) {

				}
				if ($("#ColorTester").css("background-color") == "transparent" || $("#ColorTester").css("background-color") == "rgba(0, 0, 0, 0)") {
					return;
				}
				$("#ColorTester").remove();

				ThemeDesigner.hidePicker();
				ThemeDesigner.set(swatch.attr("class"), ThemeDesigner.rgb2hex(color));
				ThemeDesigner.set("theme", "custom");

				ThemeDesigner.track('customize/' + swatchName + '/ok');
			});

		} else if (type == "image") {

			var swatches = $("#ThemeDesignerPicker").children(".image").find(".swatches");
			// add admin background
			if (ThemeDesigner.settings["user-background-image"]) {
				$('<li class="user"><img src="' + ThemeDesigner.settings["user-background-image-thumb"] + '" data-image="' + ThemeDesigner.settings["user-background-image"] + '"></li>').insertBefore(swatches.find(".no-image"));
			}

			// click handling
			$("#ThemeDesignerPicker").children(".image").find(".swatches").find("li").click(function() {

				//set correct alignment
				if ($(this).attr("class") == "user") {
					ThemeDesigner.set("background-align", ThemeDesigner.settings["user-background-align"]);
				} else {
					ThemeDesigner.set("background-align", "center");
				}

				//set correct image
				if ($(this).attr("class") == "no-image") {
					ThemeDesigner.set("background-image", "");
				} else {
					ThemeDesigner.set("background-image", $(this).children("img").attr("data-image"));
				}

				ThemeDesigner.hidePicker();

				ThemeDesigner.track('customize/' + swatchName + '/choose');
			})
		}

		// show picker
		$("#ThemeDesignerPicker")
			.css({
				top: swatch.offset().top + 10,
				left: swatch.offset().left + 10
			})
			.removeClass("color image")
			.addClass(type);

		// clicking away will close picker
		$("body").bind("click.picker", ThemeDesigner.hidePicker);
		$("#ThemeDesignerPicker").click(function(event) {
			event.stopPropagation();
		});
	},

	hidePicker: function() {
		$("body").unbind(".picker");
		$("#ColorNameForm").unbind();
		$("#ThemeDesignerPicker")
			.removeClass("color image")
			.find(".user").remove();
		$("#color-name").val("").blur();
		$("#ThemeDesignerPicker").find(".color").find(".swatches").find("li").remove();
		$("#ThemeDesignerPicker").find(".image").find(".swatches").find("li").unbind("click");
	},

	/**
	 * @author: Inez Korczynski
	 */
	set: function(setting, newValue) {
		$().log("Setting: '" + setting + "' to: '" + newValue + "'");

		ThemeDesigner.settings[setting] = newValue;

		if(setting == "wordmark-image-name" || setting == "background-image-name") {
			return;
		}

		if (setting == "background-tiled") {
			if (newValue == "true") {
				//all tiled images are centered
				ThemeDesigner.set("background-align", "center");
			} else if (ThemeDesigner.settings["background-align"] == "center" && ThemeDesigner.settings["background-image"].indexOf("images/themes") < 0 && ThemeDesigner.settings["user-background-align"] == "left" && ThemeDesigner.settings["background-fixed"] == "false") {
				//align is currently center, background image is user-specified, and user background image should be aligned left
				//only reset if background is not fixed
				ThemeDesigner.set("background-align", "left");
			}
		}

		if (setting == "background-fixed") {
			if (newValue == "true") {
				//all fixed images are centered
				ThemeDesigner.set("background-align", "center");
			} else if (ThemeDesigner.settings["background-align"] == "center" && ThemeDesigner.settings["background-image"].indexOf("images/themes") < 0 && ThemeDesigner.settings["user-background-align"] == "left" && ThemeDesigner.settings["background-tiled"] == "false") {
				//align is currently center, background image is user-specified, and user background image should be aligned left
				//only reset if background is not tiled
				ThemeDesigner.set("background-align", "left");
			}
		}

		var reloadCSS = false;
		var updateSkinPreview = false;

		if(setting == "theme" && newValue != "custom") {
			$.extend(ThemeDesigner.settings, ThemeDesigner.themes[newValue]);
			reloadCSS = true;
		}

		if(setting == "color-body" || setting == "color-page" || setting == "color-buttons" || setting == "color-links" || setting == "background-image" || setting == "background-tiled" || setting == "color-header" || setting == "wordmark-font" || setting == "background-fixed") {
			reloadCSS = true;
		}

		if(setting == "wordmark-font-size" || setting == "wordmark-text" || setting == "wordmark-type" || setting == "background-align" || setting == "page-opacity") {
			updateSkinPreview = true;
		}

		ThemeDesigner.applySettings(reloadCSS, updateSkinPreview);
	},

	/**
	 * Async callback for uploading wordmark image
	 *
	 * @author: Inez Korczynski
	 */
	wordmarkUploadCallback : {
		onComplete: function(response) {

			var response = JSON.parse(response);

			if(response.errors && response.errors.length > 0) {

				alert(response.errors.join("\n"));

			} else {

				ThemeDesigner.set("wordmark-image-name", response.wordmarkImageName);
				ThemeDesigner.set("wordmark-image-url", response.wordmarkImageUrl);
				ThemeDesigner.set("wordmark-type", "graphic");
			}

			ThemeDesigner.track('wordmark/upload');
		}
	},

	/**
	 * Wordmark image upload button handler which cancel async request when image is not selected
	 *
	 * @author: Inez Korczynski
	 */
	wordmarkUpload: function(e) {

		if($('#WordMarkUploadFile').val() == '') {
			return false;
		}

	},
	
	/**
	 * Favicon upload callback
	 */
	faviconUploadCallback : {
		onComplete: function(response) {
			var response = JSON.parse(response);
			$().log(response);
			
			ThemeDesigner.settings['favicon-image-url'] = response.faviconImageUrl;
			ThemeDesigner.settings['favicon-image-name'] = response.faviconImageName;
		
			// update preview
		}
	},
	
	faviconUpload: function(e) {
		// do validation
	},

	/**
	 * Async callback for uploading background image
	 *
	 * @author: Inez Korczynski
	 */
	backgroundImageUploadCallback : {
		onComplete: function(response) {

			var response = JSON.parse(response);
			$().log(response);
			if(response.errors && response.errors.length > 0) {

				alert(response.errors.join("\n"));

			} else {
				$("#backgroundImageUploadFile").val("");
				ThemeDesigner.hidePicker();

				ThemeDesigner.set("user-background-image", response.backgroundImageUrl);
				ThemeDesigner.set("user-background-image-thumb", response.backgroundImageThumb);
				ThemeDesigner.set("user-background-align", response.backgroundImageAlign);

				ThemeDesigner.set("theme", "custom");
				ThemeDesigner.set("background-align", response.backgroundImageAlign);
				ThemeDesigner.set("background-image-name", response.backgroundImageName);
				ThemeDesigner.set("background-image", response.backgroundImageUrl);
			}

			ThemeDesigner.track('customize/background-image/upload');
		}
	},

	/**
	 * Background image upload button handler which cancel async request when image is not selected
	 *
	 * @author: Inez Korczynski
	 */
	backgroundImageUpload: function(e) {

		if($("#BackgroundImageForm").find("input[type='file']").val() == "") {
			return false;
		}

	},


	revertToPreviousTheme: function(event) {
		event.preventDefault();
		event.stopPropagation(); // don't fire "previous/click" tracking event
		ThemeDesigner.settings = ThemeDesigner.history[$(this).index()]['settings'];
		ThemeDesigner.applySettings(true, true);

		ThemeDesigner.track('previous/choose');
	},

	cancelClick: function(event) {
		ThemeDesigner.track('cancel');

		event.preventDefault();
		document.location = returnTo;
	},

	saveClick: function(event) {
		ThemeDesigner.track('save');

		event.preventDefault();
		$(event.target).attr('disabled', true);
		ThemeDesigner.save();
	},

	save: function() {
		$().log(ThemeDesigner.settings, 'ThemeDesigner');

		// send current settings to backend
		$.post(wgServer + wgScript + '?action=ajax&rs=moduleProxy&moduleName=ThemeDesigner&actionName=SaveSettings&outputType=data',
			{'settings': ThemeDesigner.settings},
			function(data) {
				// BugId:1349
				ThemeDesigner.purgeReturnToPage(function() {
					if (returnTo) {
						document.location = returnTo; // redirect to article from which ThemeDesigner was triggered
					}
				});
			},
			'json');
	},

	navigationClick: function(event) {
		event.preventDefault();

		var clickedLink = $(this);
		var command = clickedLink.attr("rel");

		//select the correct tab
		clickedLink.parent().addClass("selected").siblings().removeClass("selected");
		//show the correct panel
		$("#" + command).show().siblings("section").hide();

		//hide wordmark text side if necessary
		if (command == "WordmarkTab") {
			ThemeDesigner.wordmarkShield();
		}

		// tracking
		var tabName = command.replace(/Tab$/, '').toLowerCase();
		ThemeDesigner.track(tabName + '/tab');
	},

	resizeIframe: function() {
		$("#PreviewFrame").css("height", $(window).height() - $("#Designer").height());
	},

	history: false,

	settings: false,

	themes: false,

	applySettings: function(reloadCSS, updateSkinPreview) {

		$().log('applySettings');

		/*** Theme Tab ***/
		if(ThemeDesigner.settings["theme"] == "custom") {
			$("#ThemeTab").find(".slider").find(".selected").removeClass("selected");
		}

		/*** Customize Tab ***/
		// color swatches
		$("#swatch-color-background").css("background-color", ThemeDesigner.settings["color-body"]);
		$("#swatch-color-buttons").css("background-color", ThemeDesigner.settings["color-buttons"]);
		$("#swatch-color-links").css("background-color", ThemeDesigner.settings["color-links"]);
		$("#swatch-color-page").css("background-color", ThemeDesigner.settings["color-page"]);
		$("#swatch-color-header").css("background-color", ThemeDesigner.settings["color-header"]);

		if (ThemeDesigner.settings["background-image"] == "") {
			//no background image
			// TODO: FIXME: Use wgBlankImgUrl and test that it still works
			$("#swatch-image-background").attr("src", "/skins/common/blank.gif");
		} else if (ThemeDesigner.settings["background-image"].indexOf("images/themes") > 0) {
			//wikia background image
			var file = ThemeDesigner.settings["background-image"].substring(ThemeDesigner.settings["background-image"].lastIndexOf("/") + 1);
			var theme = file.substr(0, file.length - 4);
			$("#swatch-image-background").attr("src", "/extensions/wikia/ThemeDesigner/images/" + theme + "_swatch.jpg");
		} else {
			//admin background image
			$("#swatch-image-background").attr("src", ThemeDesigner.settings["user-background-image-thumb"]);
		}

		if (ThemeDesigner.settings["background-tiled"] == "true") {
			$("#tile-background").attr("checked", true);
		} else {
			$("#tile-background").attr("checked", false);
		}

		$("#fix-background").attr("checked", ThemeDesigner.settings["background-fixed"] == "true");

		/*** Wordmark Tab ***/
		// style wordmark preview
		$("#wordmark").removeClass().addClass(ThemeDesigner.settings["wordmark-font"]).addClass(ThemeDesigner.settings["wordmark-font-size"]).html(ThemeDesigner.settings["wordmark-text"]);

		// populate wordmark editor
		$("#wordmark-edit").find('input[type="text"]').val(ThemeDesigner.settings["wordmark-text"]);

		// select current font
		$("#wordmark-font").find('[value="' + ThemeDesigner.settings["wordmark-font"] + '"]').attr("selected", "selected");

		// select current size
		$("#wordmark-size").find('[value="' + ThemeDesigner.settings["wordmark-font-size"] + '"]').attr("selected", "selected");

		// wordmark image
		$("#WordmarkTab").find(".graphic").find(".wordmark").attr("src", ThemeDesigner.settings["wordmark-image-url"]);

		if (ThemeDesigner.settings["wordmark-type"] == "graphic") {
			$("#WordmarkTab").find(".graphic")
				.find(".wordmark").addClass("selected").end()
				.find("a").css("display", "inline-block");
			ThemeDesigner.wordmarkShield();
		} else {
			$("#WordmarkTab").find(".graphic")
				.find(".wordmark").removeClass("selected").end()
				.find("a").hide();
			ThemeDesigner.wordmarkShield();
		}

		if(reloadCSS) {

			$().log('applySettings, reloadCSS');

			var sassUrl = $.getSassCommonURL('/skins/oasis/css/oasis.scss', ThemeDesigner.settings);
			document.getElementById('PreviewFrame').contentWindow.ThemeDesignerPreview.loadSASS(sassUrl);
		}

		if(updateSkinPreview) {

			$().log('applySettings, updateSkinPreview');

			if (ThemeDesigner.settings["wordmark-type"] == "text") {
				$("#PreviewFrame").contents().find("#WikiHeader").find(".wordmark")
					.removeClass()
					.addClass("wordmark")
					.addClass(ThemeDesigner.settings["wordmark-font-size"])
					.find("a")
						.text(ThemeDesigner.settings["wordmark-text"])
			} else if (ThemeDesigner.settings["wordmark-type"] == "graphic") {
				$("#PreviewFrame").contents().find("#WikiHeader").find(".wordmark")
					.addClass("graphic")
					.find("a")
						.html('')
						.append('<img src="' + ThemeDesigner.settings["wordmark-image-url"] + '">');
			}

			$("#PreviewFrame").contents().find('#WikiaPageBackground').css("opacity", ThemeDesigner.settings["page-opacity"]/100);
			ThemeDesigner.settings["page-opacity"] < 100 ? $("#PreviewFrame").contents().find("#WikiHeader .shadow-mask").hide() : $("#PreviewFrame").contents().find("#WikiHeader .shadow-mask").show();
		}
	},

	/**
	 * Purges the page from which user has triggered Theme Designer
	 */
	purgeReturnToPage: function(callback) {
		if (!window.returnTo) {
			return;
		}

		$.post(returnTo, {
			action:'purge'
		}, function() {
			$().log('URL "' + returnTo + '" has been purged', 'ThemeDesigner');

			if (typeof callback == 'function') {
				callback();
			}
		});
	},

	/**
	 * Converts from rgb(255, 255, 255) to #fff
	 *
	 * Copied here from WikiaPhotoGallery.js
	 */
	rgb2hex: function(rgb) {
		function hex(x) {
			return ("0" + parseInt(x).toString(16)).slice(-2);
		}

		components = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);

		if(components) {
			return "#" + hex(components[1]) + hex(components[2]) + hex(components[3]);
		}
		//not an rgb color, probably an hex value has been passed, return it
		else {
			return rgb;
		}
	},

	swatches: {
		"color-body": Array(
			"f9ebc3",
			"ede5dd",
			"f7e1d3",
			"dfdbc3",
			"fbe300",
			"ffbf99",
			"ffbf99",
			"fdc355",
			"cdbd89",
			"d5a593",
			"a37719",
			"836d35",
			"776b41",
			"f14700",
			"dd3509",
			"a34111",
			"7b3b09",
			"4f4341",
			"454545",
			"611d03",
			"891100",
			"71130f",
			"ebfffb",
			"ebf1f5",
			"f5ebf5",
			"e7f3d1",
			"bde9fd",
			"dfbddd",
			"c3d167",
			"a5b5c5",
			"6599ff",
			"6b93b1",
			"978f33",
			"53835d",
			"7f6f9f",
			"d335f7",
			"337700",
			"006baf",
			"2b53b5",
			"2d2b17",
			"003715",
			"012d59",
			"6f017b",
			"790145",
			"ffffff",
			"f1f1f1",
			"ebebeb",
			"000000"
		),
		"color-buttons": Array(
			"fec356",
			"6699ff",
			"6c93b1",
			"a47719",
			"846d35",
			"786c42",
			"f14800",
			"337800",
			"006cb0",
			"dd360a",
			"a34112",
			"474646",
			"7b3b0a",
			"4f4341",
			"0038d8",
			"2d2c18",
			"611e03",
			"003816",
			"891100",
			"012e59",
			"721410",
			"6f027c",
			"7a0146"
		),
		"color-links": Array(
			"fce300",
			"fec356",
			"c4d167",
			"6699ff",
			"6c93b1",
			"a47719",
			"54845e",
			"337800",
			"006cb0",
			"0148c2",
			"6f027c",
			"ffffff"
		),
		"color-page": Array(
			"ebf2f5",
			"e7f4d2",
			"f5ebf5",
			"f9ecc3",
			"eee5de",
			"f7e1d4",
			"d4e6f7",
			"dfdbc3",
			"dfbddd",
			"cebe8a",
			"a5b5c6",
			"474646",
			"2d2c18",
			"611e03",
			"012e59",
			"ffffff",
			"f2f2f2",
			"ebebeb",
			"000000"
		),
		"color-header": Array(
			"D09632",
			"DD4702",
			"2B53B5",
			"3A5766",
			"285F00",
			"4A4612",
			"8F3000",
			"A301B4",
			"6D0D00",
			"002266",
			"580062",
			"808080"
		)
	}

};

$(function() {
	ThemeDesigner.init();
});