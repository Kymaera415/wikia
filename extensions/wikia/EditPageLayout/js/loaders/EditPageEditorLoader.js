(function(window,$){

	/**
	 * Wikia Editor loader for Edit pages
	 */
	var EditPageEditorLoader = $.createClass(Object,{

		element: false,

		constructor: function() {
			this.element = $('#EditPage');
		},

		getToolbarsConfig: function() {
			var WE = window.WikiaEditor;

			var data = {
				main: !!window.wgEditPageIsWidePage,
				rte: typeof window.RTE != 'undefined',
				wide: false,
				readOnly: window.wgEditPageIsReadOnly
			};
			data.wide = data.rte && data.main;

			WE.fire('wikiaeditorspacesbeforelayout',this.element,data);

			var layout = {
				tabs: [],
				toolbar: [],
				rail: []
			};

			// mode switcher
			if (data.rte) layout.tabs.push('ModeSwitch');
			// source toolbar
			layout.toolbar.push('ToolbarMediawiki');
			// format toolbars
			if (data.rte) {
				layout.toolbar.push('Format');
				layout.toolbar.push('FormatExpanded');
			}

			// standard modules
			if (data.wide) {
				layout.toolbar.push('ToolbarWidescreen');
			} else if(data.readOnly) {
				layout.rail.push('RailLicense');
			} else {
				layout.rail.push('RailInsert','RailCategories','RailTemplates','RailLicense');
			}

			WE.fire('wikiaeditorspaceslayout',this.element,layout,data);

			// Wraps all modules in right rail for the plugin "railminimumheight"
			if (layout.rail.length > 0) {
				layout.rail = [{cls:'rail-auto-height',items:layout.rail}];
			}

			return layout;
		},

		isFormatExpanded: function() {
			var ns = window.wgNamespaceNumber;
			return (ns % 2 == 1 /* talk pages */) || (ns == 110/* NS_FORUM */);
		},

		getData: function() {
			var rte = typeof window.RTE != 'undefined', mode = 'source';
			if (rte) {
				mode = window.RTEInitMode || 'wysiwyg';
			}

			var plugins = [ 'wikiacore', rte ? 'ckeditorsuite' : 'mweditorsuite' ];
			var config = {
				// the main DOM element where the editor should be rendered
				element: this.element,
				// toolbars definition
				toolbars: this.getToolbarsConfig(),
				// toolbar types overrides
				toolbarTypes: {
					rail: 'railcontainer'
				},
				// spaces overrides
				spaces: {
					tabs: $('#EditPageTabs')
				},
				// shall format toolbar be expanded by default?
				formatExpanded: this.isFormatExpanded(),
				// default UI elements which should to be registered in the editor
				uiElements: window.wgEditorExtraButtons || {},
				// list of popular templates used by Templates module
				popularTemplates: window.wgEditPagePopularTemplates || [],
				// editor auto resize mode
				autoResizeMode: (window.wgEditPageIsConflict || window.wgEditPageFormType == 'diff') ? 'editpage' : 'editarea',
				// disable Categories module?
				categoriesDisabled: (typeof window.initCatSelectForEdit != 'function'),
				// initial state of wide screen mode in source mode
				wideInSourceInitial: window.wgEditPageWideSourceMode,
				// is wide screen mode in source mode disabled?
				wideInSourceDisabled: window.wgEditPageHasEditPermissionError,
				// is the current page wide in view? (adds 300px in preview popup)
				isWidePage: !!window.wgEditPageIsWidePage,
				// extra page width (e.g. in oasis hd) (adds extra width in preview popup)
				extraPageWidth: (window.sassParams && window.sassParams.hd) ? 200 : 0,
				// initial editor mode
				mode: mode
			};

			return { plugins: plugins, config: config };
		},

		init: function() {
			var data = this.getData();
			var e = window.editorInstance = window.WikiaEditor.create(data.plugins,data.config);
			this.element.data('wikiaeditor',e);
		}
	});


	$(function(){
		if (!window.WikiaAutostartDisabled) {
			var editor = new EditPageEditorLoader();
			editor.init();
		}
	});

})(this,jQuery);