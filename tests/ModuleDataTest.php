<?php
// initialize skin only once

global $wgTitle, $wgUser, $wgForceSkin;

$wgForceSkin = 'oasis';
$wgTitle = Title::newMainPage();
$wgUser = User::newFromName('WikiaBot');

wfSuppressWarnings();
ob_start();

$skin = $wgUser->getSkin();
$skin->outputPage(new OutputPage());

wfClearOutputBuffers();
wfRestoreWarnings();

class ModuleDataTest extends PHPUnit_Framework_TestCase {

	function testLatestActivityModule() {
		global $wgSitename;

		$moduleData = Module::get('LatestActivity')->getData();

		$this->assertEquals(
			3,
			count($moduleData)
		);
	}

	function testSearchModule() {
		global $wgSitename;

		$moduleData = Module::get('Search')->getData();

		$this->assertEquals(
			wfMsg('Tooltip-search', $wgSitename),
			$moduleData['placeholder']
		);
	}

	function testRailModule() {
		global $wgTitle;
		$wgTitle = Title::newMainPage();

		$moduleData = Module::get('Rail')->getData();

		$this->assertType("array",
			$moduleData
		);

	}

	function testRailSubmoduleExists() {
		global $wgTitle;
		$wgTitle = Title::newFromText('FooBar');

		$moduleData = Module::get('Body')->getData();

		// search module lives at index 1500
		$this->assertType("array",
			$moduleData['railModuleList'][1500]
		);

	}

	function testAdModule() {
		global $wgTitle;
		$this->markTestSkipped();
		$wgTitle = Title::newMainPage();

		$moduleData = Module::get('Ad', 'Index', array ('slot' => 'TOP_BOXAD'))->getData();

		// boxad is 300 wide
		$this->assertEquals(
			'300',
			$moduleData['imgWidth']
		);
	}

	function testNotificationsModule() {
		// add notification
		NotificationsModule::addNotification('Notification about something very important', array('data' => 'bar'));

		$moduleData = Module::get('Notifications')->getData();

		$this->markTestSkipped();

		// have to skip this test, WikiaBot has real notifications?!
		/*
		$this->assertEquals(
			array(
				array(
					'message' => 'Notification about something very important',
					'data' => array('data' => 'bar'),
					'type' => 1,
				)
			),
			$moduleData['notifications']
		);
		*/
		// add confirmation
		NotificationsModule::addConfirmation('Confirmation of something done');

		$moduleData = Module::get('Notifications', 'Confirmation')->getData();

		$this->assertEquals(
			'Confirmation of something done',
			$moduleData['confirmation']
		);
	}

	function testRandomWikiModule() {
		global $wgEnableRandomWikiOasisButton;

		// let's enable the module
		$wgEnableRandomWikiOasisButton = true;

		$moduleData = Module::get('RandomWiki')->getData();

		$this->assertType('string', $moduleData['url']);

		// now let's disable the module
		$wgEnableRandomWikiOasisButton = false;

		$moduleData = Module::get('RandomWiki')->getData();

		$this->assertEquals(
			null,
			$moduleData['url']);
	}

	function testOasisModule() {

		// add custom CSS class to <body>
		OasisModule::addBodyClass('testCssClass');

		// turn of PHP warnings / don't emit skin's HTML
		wfSuppressWarnings();
		ob_start();

		// render the skin
		$moduleData = Module::get('Oasis')->getData();

		wfClearOutputBuffers();
		wfRestoreWarnings();

		// assertions
		$this->assertRegExp('/ testCssClass/', $moduleData['bodyClasses']);
		$this->assertRegExp('/^<link href=/', $moduleData['printableCss']);
		$this->assertType('string', $moduleData['body']);
		$this->assertType('string', $moduleData['headscripts']);
		$this->assertType('string', $moduleData['csslinks']);
		$this->assertType('string', $moduleData['headlinks']);
		$this->assertType('string', $moduleData['globalVariablesScript']);
	}


	function testCommentsLikesModule() {
		global $wgTitle;
		$wgTitle = Title::newMainPage();

		$moduleData = Module::get('CommentsLikes', 'Index', array ('comments' => 123))->getData();

		$this->assertRegExp('/^123$/', $moduleData['comments']);
		$this->assertRegExp('/'.preg_quote($wgTitle->getDBkey()).'/', $moduleData['commentsLink']);
		$this->assertRegExp('/^$/', $moduleData['commentsTooltip']);
		$this->assertEquals(null, $moduleData['likes']);
	}

	function testAchievementsModule() {
		global $wgTitle;
		$wgTitle = Title::newFromText('User:WikiaBot');

		$moduleData = Module::get('Achievements')->getData();

		$this->assertEquals ($moduleData['ownerName'], 'WikiaBot');
		$this->assertEquals ($moduleData['viewer_is_owner'], true);
		$this->assertEquals ($moduleData['max_challenges'], count($moduleData['challengesBadges']));
		$this->assertType ('array', $moduleData['challengesBadges'][0]);
		$this->assertType ('object', $moduleData['challengesBadges'][0]['badge']);
		
		if (count($moduleData['ownerBadges']) > 0) {
			// TODO: WikiaBot has no badges, but we could add some
		}
	}

}
