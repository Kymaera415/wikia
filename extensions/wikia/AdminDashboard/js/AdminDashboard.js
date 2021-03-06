var AdminDashboard = {
	controls: {},
	section: {},
	externalComponents: {},
	init: function() {
		// precache
		AdminDashboard.cc = $('#AdminDashboard');

		if(AdminDashboard.cc.length == 0) {
			return;
		}

		AdminDashboard.allControls = AdminDashboard.cc.find('.control');
		AdminDashboard.tabs = $('#AdminDashboardTabs');
		AdminDashboard.allTabs = AdminDashboard.tabs.find('.tab');
		AdminDashboard.generalTab = AdminDashboard.tabs.find('[data-section=general]');
		AdminDashboard.section.general = $('#AdminDashboardGeneral');
		AdminDashboard.section.advanced = $('#AdminDashboardAdvanced');
		AdminDashboard.section.contentarea = $('#AdminDashboardContentArea');
		AdminDashboard.wikiaArticle = $('#WikiaArticle');

		// events
		AdminDashboard.allControls.hover(function() {
			var el = $(this);
			AdminDashboard.tooltip = el.closest('.control-section').find('header .dashboard-tooltip');
			AdminDashboard.tooltip.text(el.data('tooltip'));
		}, function() {
			AdminDashboard.tooltip.text('');
		}).click(AdminDashboard.handleControlClick);

		AdminDashboard.allTabs.click(function(e) {
			e.preventDefault();
			var el = $(this);
			AdminDashboard.ui.resetAll();
			AdminDashboard.ui.selectTab(el);
			AdminDashboard.ui.showSection(el.data('section'));
		});
	},
	handleControlClick: function(e) {
		var modal = $(this).data('modal');
		if (modal) {
			e.preventDefault();
			AdminDashboard.modalLoad['load'+modal]();
		}
	},
	ui: {
		resetAll: function() {
			AdminDashboard.ui.deselectAllTabs();
			AdminDashboard.ui.hideAllSections();
			AdminDashboard.section.contentarea.html( $.msg( 'admindashboard-loading' ) );
			AdminDashboard.wikiaArticle.removeClass('AdminDashboardChromedArticle expanded');
			$('.AdminDashboardDrawer, .AdminDashboardNavigation, .AdminDashboardArticleHeader').remove();
			if(typeof FounderProgressList != 'undefined') {
				FounderProgressList.hideListModal();
			}
		},
		hideAllSections: function() {
			for(var s in AdminDashboard.section) {
				$(AdminDashboard.section[s]).hide();
			}
		},
		showSection: function(section) {
			AdminDashboard.section[section].show();
		},
		deselectAllTabs: function() {
			AdminDashboard.allTabs.removeClass('active');
		},
		selectTab: function(tab) {
			$(tab).addClass('active');
		}
	},
	modalLoad: {
		loadAddPage: function() {
			CreatePage.openDialog();
		},
		loadAddPhoto: function() {
			UploadPhotos.showDialog();
		}
	}
};

$(function() {
	AdminDashboard.init();
});
