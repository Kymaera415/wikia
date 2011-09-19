(function(window,$){

	var WE = window.WikiaEditor = window.WikiaEditor || (new Observable);

	WE.plugins.pagecontrols = $.createClass(WE.plugin,{

		hiddenFields: false,
		callbackFields: false,
		titleNode: false,

		textarea: false,
		minorEditCheck: false,

		beforeInit: function() {
			this.editor.controls = this;
		},

		// init page controls widget
		init: function() {
			var pageControls = $('#EditPageRail .module_page_controls'),
				menu = pageControls.find('nav');

			this.textarea = pageControls.find('textarea');
			// set up the caption of summary field
			this.textarea.placeholder();

			// pressing enter in edit summary should initiate publish button
			this.textarea.bind('keypress', this.proxy(this.onSummaryKeypress));

			this.minorEditCheck = pageControls.find('#wpMinoredit');
			// pressing enter on minor edit checkbox should not save the edition
			this.minorEditCheck.bind('keypress', this.proxy(this.onMinorEditKeypress));

			// attach events
			$('#wpPreview').bind('click', this.proxy(this.onPreview));
			// Wikia change (bugid:5667) - begin
			if ($.browser.msie) {
				$(window).bind('keydown', function(e) {
					if (e.altKey && String.fromCharCode(e.keyCode) == $('#wpPreview').attr('accesskey').toUpperCase()) {
						$('#wpPreview').click();
					}
				});
			}
			// Wikia change (bugid:5667) - end

			$('#wpDiff').bind('click', this.proxy(this.onDiff));
			//enable publish button after init editor

			this.editor.on('state', this.proxy(this.onStateChange));

			// remove placeholder text when user submits the form without providing the summary
			$('#editform').bind('submit', this.proxy(this.onSave));

			// hidden form fields / page title in the header
			this.hiddenFields = $('#EditPageHiddenFields');
			this.callbackFields = $('#EditPageCallbackFields');
			this.titleNode = $('#EditPageHeader > h1');

			// show "Edit title" button and attach handler for it (when we have custom fields attached to this edit form)
			if ($('#EditPageHiddenFields input[type="text"]').exists()) {
				$('#EditPageTitle').
					// show it only when hovering over #EditPageHeader
					addClass('enabled').
					bind('click', this.proxy(function(ev) {
						this.editor.track('title', 'edit');
						this.renderHiddenFieldsDialog();
					}));

				// update the tooltip if there are two or more fields (BugId:6726)
				var noFields = $('#EditPageHiddenFields').find('input[type!="hidden"]').length;
				if (noFields >= 2) {
					$('#EditPageTitle').attr('title', $.msg('editpagelayout-edit-info'));
				}
			}

			// check whether there are required fields with no value - show dialog
			if (this.checkForEmptyFields(this.hiddenFields)) {
				this.renderHiddenFieldsDialog();

				// keep focus inside the dialog
				if (typeof RTE == 'object') {
					RTE.config.startupFocus = false;
				}
			} else if ($('#EditPageHiddenFields [name=wpTitle]').exists()) { // page name is editable
				this.updateEditedTitle();
			}

			// track clicks on page title and help link
			this.titleNode.children('a').bind('click', this.proxy(function(ev) {
				this.editor.track('title', 'pagename');
			}));

			$('#HelpLink').bind('click', this.proxy(function(ev) {
				this.editor.track('title', 'help');
			}));

			// show form rendered by edit form callback (e.g. captcha)
			if (this.callbackFields.exists()) {
				this.renderCallbackFieldsDialog();

				// keep focus inside the dialog
				if (typeof RTE == 'object') {
					RTE.config.startupFocus = false;
				}
			}
		},

		// handle "Preview" button
		onPreview: function(ev) {
			this.renderPreview({});
			this.editor.track(this.editor.getTrackerInitialMode(), 'pageControls', 'preview', this.editor.getTrackerMode());

			ev.preventDefault();
		},

		// handle "Show changes" button
		onDiff: function(ev) {
			this.renderChanges({});
			this.editor.track(this.editor.getTrackerInitialMode(), 'pageControls', 'diff', this.editor.getTrackerMode());

			ev.preventDefault();
		},

		//enable publish button after init editor only for mediawiki editor
		onStateChange: function(editor, state) {
			var states = editor.states;
			if (states.IDLE == state) {
				$('#wpSave').removeAttr('disabled');
			}
			else if ( (states.LOADING_SOURCE == state) || (states.LOADING_VISUAL == state) ) {
				$('#wpSave').attr('disabled', true);
			}
		},

		// handle "Save" button
		onSave: function() {
			if (this.textarea.val() == this.textarea.attr('placeholder')) {
				this.textarea.val('');
			}

			this.editor.setState(this.editor.states.SAVING);

			this.editor.track('visualMode', 'pageControls', 'save', this.editor.getTrackerMode(), 'button');

			// block "Publish" button
			$('#wpSave').attr('disabled', true);
		},

		// handle keypressing in "Edit summary" field
		onSummaryKeypress: function(ev) {
			if (ev.keyCode == 13 /* enter */) {
				this.editor.track('visualMode', 'pageControls', 'save', this.editor.getTrackerMode(), 'enter');

				// submit the form
				var form = this.textarea.closest('form');
				form.submit();
			}
		},

		// handle keypressing on "Minor edit" checkbox
		onMinorEditKeypress: function(ev) {
			if (ev.keyCode == 13 /* enter */) {
				ev.preventDefault();
				return;
			}
		},

		// send AJAX request
		ajax: function(method, params, callback) {
			var editor = typeof RTE == 'object'? RTE.instance : false,
				mode = editor ? editor.mode : 'mw';

			params = $.extend(params, {
				page: wgEditPageClass ? wgEditPageClass:"",
				method: method,
				mode: editor.mode
			});

			var url = window.wgEditPageHandler.replace('$1', encodeURIComponent(window.wgEditedTitle));

			jQuery.post(url, params, function(data) {
				if (typeof callback == 'function') {
					callback(data);
				}
			}, 'json');
		},

		// get value of wpTitle field and update wgEditedTitle JS variable and page header title
		updateEditedTitle: function() {
			var title = $('[name=wpTitle]');

			if(title.exists()) {
				window.wgEditedTitle = title.val();
			}

			var prefix = '';

			if(wgEditedTitleNS !== '') {
				prefix = wgEditedTitleNS + ':';
			}

			if(wgEditedTitlePrefix !== '') {
				prefix += wgEditedTitlePrefix;
			}

			window.wgEditedTitle = prefix + window.wgEditedTitle;

			// BugId:2823
			$(window).trigger('editTitleUpdated', [window.wgEditedTitle]);

			if (window.wgEditedTitle.substring(0, 30) == window.wgEditedTitle) {
				var shortText = $.htmlentities(window.wgEditedTitle);
			} else {
				var shortText = $.htmlentities(window.wgEditedTitle.substring(0, 30)) + '&hellip;';
			}

			this.titleNode.children('a').
				attr('href', wgArticlePath.replace('$1', window.wgEditedTitle)).
				attr('title', $.htmlentities(window.wgEditedTitle)).
				html(shortText);
				$('#EditPageHeader .hiddenTitle').show();
		},

		// return true if any of the required fields has no value
		checkForEmptyFields: function(fields) {
			var emptyRequiredFields = fields.find('label > *[data-required="1"]'),
				emptyCounter = 0;

			emptyRequiredFields.each(function() {
				if ($(this).val() == '') {
					emptyCounter++;
				}
			});

			return emptyCounter > 0;
		},

		// show dialog for providing required data (e.g. page title)
		renderHiddenFieldsDialog: function() {
			var self = this,
				dialogTitle = document.title;

			$.showCustomModal(dialogTitle, '<div class="fields"></div>', {
				id: 'HiddenFieldsDialog',
				width: 400,
				buttons: [
					{
						id: 'ok',
						defaultButton: true,
						message: $.msg('ok'),
						handler: function() {
							var dialog = $('#HiddenFieldsDialog');

							// required data is provided - proceed by closing the dialog
							if (!self.checkForEmptyFields(dialog)) {
								self.hiddenFields.append(dialog.find('label'));
								self.updateEditedTitle();

								dialog.closeModal();

								if (typeof RTE == 'object') {
									RTE.instance.focus();
								}
							}
						}
					}
				],

				// before showing the dialog move hidden fields from edit form to the dialog
				callback: function() {
					self.hiddenFields.children('label').appendTo($('#HiddenFieldsDialog .fields'));

					// set focus on the first field
					$('#HiddenFieldsDialog label').children().focus();
				},
				// don't show close button, user has to click "Ok" and fields have to be validated
				showCloseButton: false,
				onClose: function() {
					return false;
				}
			});
		},

		// render dialog for callback form (eg. captcha)
		renderCallbackFieldsDialog: function() {
			var self = this,
				dialogTitle = document.title;

			// update modal's title when showing a captcha
			if ($('#wpCaptchaWord').exists()) {
				dialogTitle = $.msg('editpagelayout-captcha-title');
			}

			$.showCustomModal(dialogTitle, '<div class="fields"></div>', {
				id: 'HiddenFieldsDialog',
				width: 400,
				buttons: [
					{
						id: 'ok',
						defaultButton: true,
						message: $.msg('savearticle'),
						handler: function() {
							var dialog = $('#HiddenFieldsDialog');

							// move fields back to edit form
							self.callbackFields.append(dialog.find('.fields'));

							// publish the page
							$('#wpSave').click();

							dialog.closeModal();
						}
					}
				],

				// before showing the dialog move hidden fields from edit form to the dialog
				callback: function() {
					self.callbackFields.children().appendTo($('#HiddenFieldsDialog .fields'));

					// set focus on the first field
					$('#HiddenFieldsDialog input[type!="hidden"]').focus();
				}
			});
		},

		// show dialog for preview / show changes and scale it to fit viewport's height
		renderDialog: function(title, options, callback) {
			options = $.extend({
				callback: function() {
					var contentNode = $('#EditPageDialog .WikiaArticle');

					// block all clicks
					var previewHeight = $(window).height() - 250;
					previewHeight = previewHeight < 320 ? 320 : previewHeight;
					contentNode.
						bind('click', function(ev) {
							ev.preventDefault();
						}).
						css({
							height: previewHeight,
							overflow: 'auto'
						});

					if (typeof callback == 'function') {
						callback(contentNode);
					}
				},
				id: 'EditPageDialog',
				width: 680
			}, options);

			// use loading indicator before real content will be fetched
			var content = '<div class="WikiaArticle"><img src="' + stylepath + '/common/images/ajax.gif" class="loading"></div>';

			$.showCustomModal(title, content, options);
		},

		// render "Preview" modal
		renderPreview: function(extraData) {
			var self = this,
				width = 660 + 32 /* modal padding */,
				config = this.editor.config;

			if (config.isWidePage) {
				// 980 px of content width on main pages / pages without right rail
				width += 320;
			}
			if (config.extraPageWidth) {
				// wide wikis
				width += config.extraPageWidth;
			}

			this.renderDialog($.msg('preview'), {
				buttons: [
					{
						id: 'close',
						message: $.msg('back'),
						handler: function() {
							$('#EditPageDialog').closeModal();
						}
					},
					{
						id: 'publish',
						defaultButton: true,
						message: $.msg('savearticle'),
						handler: function() {
							// click "Publish" button
							$('#wpSave').click();
						}
					}
				],
				width: width,
				className: 'preview'
			}, function(contentNode) {
				self.getContent(function(content) {
					var summary = $('#wpSummary').val();

					// add section name when adding new section (BugId:7658)
					if (window.wgEditPageSection == 'new') {
						content = '== ' + summary + ' ==\n\n' + content;
					}
					else {
						extraData.summary = summary;
					}

					extraData.content = content;

					self.ajax('preview',
						extraData,
						function(data) {
							// wrap article's HTML inside .WikiaArticle
							var pageTitle = '<h1 class="pagetitle">' + window.wgEditedTitle + '</h1>',
								isSectionEdit = !!parseInt(window.wgEditPageSection) || (window.wgEditPageSection == 'new'),
								html = (!isSectionEdit ? pageTitle : '') + data.html;
							
							// innerShiv is IE < 9 fix (BugId: 11294)
							contentNode.html(innerShiv(html));

							// move "edit" link to the right side of heading names
							contentNode.find('.editsection').each(function() {
								$(this).appendTo($(this).next());
							});

							// add summary
							if (typeof data.summary != 'undefined') {
								$('<div>', {id: "EditPagePreviewEditSummary"}).
									width(width - 150).
									appendTo(contentNode.parent()).
									html(data.summary);
							}
						});
				});
			});
		},

		// render "show diff" modal
		renderChanges: function(extraData) {
			var self = this;
			this.renderDialog($.msg('editpagelayout-pageControls-changes'), {}, function(contentNode) {
				self.getContent(function(content) {
					extraData.content = content;
					extraData.section = parseInt($.getUrlVar('section') || 0);
					self.ajax('diff',
						extraData,
						function(data) {
							var html = '<h1 class="pagetitle">' + window.wgEditedTitle + '</h1>' + data.html;
							contentNode.html(html);
					});
				});
			});

			// load diff.css
			var self = this;
			if (!this.diffCssLoaded) {
				$.getCSS(stylepath + '/common/diff.css', function() {
					self.diffCssLoaded = true;
				});
			}
		},

		// get editor's content (either wikitext or HTML)
		// and call provided callback with wikitext as its parameter
		getContent: function(callback) {
			var editor = typeof RTE == 'object'? RTE.instance : false,
				mode = editor ? editor.mode : 'mw';

			callback = callback || function() {};

			switch(mode) {
				case 'mw':
					callback($('#wpTextbox1').val());
					return;
				case 'source':
				case 'wysiwyg':
					callback(editor.getData());
					return;
			}
		}

	});

})(this,jQuery);
