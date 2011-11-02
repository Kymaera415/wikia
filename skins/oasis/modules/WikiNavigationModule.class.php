<?php

class WikiNavigationModule extends Module {

	var $showMenu;
	var $wgBlankImgUrl;

	private $service;

	const WIKIA_GLOBAL_VARIABLE = 'wgOasisGlobalNavigation';
	const WIKIA_LOCAL_MESSAGE = 'Wikia-navigation-local';
	const WIKI_LOCAL_MESSAGE = 'Wiki-navigation';

	const CACHE_TTL = 10800; // 3 hours

	public function executeIndex($data) {
		global $wgCityId, $wgUser, $wgIsPrivateWiki;

		//fb#1090
		$isInternalWiki = empty($wgCityId);
		$this->showMenu = !(($isInternalWiki || $wgIsPrivateWiki) && $wgUser->isAnon());

		$this->service = new NavigationService();

		// handle requests from preview mode
		$request = $this->getRequest();
		$this->previewMessage = $request->getVal('msgName', false);
		$this->previewWikitext = $request->getVal('wikitext');

		// render global wikia navigation ("On the Wiki" menu)
		$this->wikiaMenuNodes =
			$this->parseMenu(
				self::WIKIA_GLOBAL_VARIABLE,
				array(
					1,
					$this->wg->maxLevelTwoNavElements,
					$this->wg->maxLevelThreeNavElements
				),
				true
			);

		$nodesCount = 0;
		foreach( $this->wikiaMenuNodes as $node ){
			if ( isset( $node['depth'] ) && ( $node['depth'] == 2 ) ){
				$nodesCount++;
			}
		}

		// render local wikia navigation (additional items for "On the Wiki" menu)
		if ( $nodesCount > 0 && $nodesCount < $this->wg->maxLevelThreeNavElements ){
			$this->wikiaMenuLocalNodes =
				$this->parseMenu(
					self::WIKIA_LOCAL_MESSAGE,
					array(
						$this->wg->maxLevelTwoNavElements - $nodesCount,
						$this->wg->maxLevelThreeNavElements,
						0
					),
					true
				);
		} else {
			$this->wikiaMenuLocalNodes = array();
		}

		// render local navigation (more tabs)
		$this->wikiMenuNodes =
			$this->parseMenu(
				self::WIKI_LOCAL_MESSAGE,
				array(
					$this->wg->maxLevelOneNavElements,
					$this->wg->maxLevelTwoNavElements,
					$this->wg->maxLevelThreeNavElements
				)
			);
	}

	/**
	 * Parse given menu
	 *
	 * Use either MediaWiki message / WikiFactory variable or wikitext from preview mode
	 *
	 * @param string $menuName name of the message / variable to be used
	 * @param array $maxChildrenAtLevel maximum nesting information
	 * @param bool $filterInactiveSpecialPages filter inactive special pages?
	 * @return array menu nodes
	 */
	private function parseMenu($menuName, Array $maxChildrenAtLevel, $filterInactiveSpecialPages = false) {
		global $wgMemc;
		wfProfileIn(__METHOD__);

		$inPreviewMode = ($this->previewMessage === $menuName);

		if ($inPreviewMode) {
			// get menu content from the wikitext (preview mode)
			$nodes = $this->service->parseText(
				$this->previewWikitext,
				$maxChildrenAtLevel,
				true /* $forContent */,
				$filterInactiveSpecialPages
			);
		}
		else {
			switch($menuName) {
				case self::WIKIA_GLOBAL_VARIABLE:
					// get menu content from Wiki Factory variable
					$nodes = $this->service->parseVariable(
						$menuName,
						$maxChildrenAtLevel,
						self::CACHE_TTL,
						true /* $forContent */,
						$filterInactiveSpecialPages
					);
					break;

				case self::WIKIA_LOCAL_MESSAGE:
				case self::WIKI_LOCAL_MESSAGE:
				default:
					// get menu content from the message
					$nodes = $this->service->parseMessage(
						$menuName,
						$maxChildrenAtLevel,
						self::CACHE_TTL,
						true /* $forContent */,
						$filterInactiveSpecialPages
					);
			}
		}

		wfProfileOut(__METHOD__);
		return $nodes;
	}

	/**
	 * Render the preview of wiki navigation menu
	 *
	 * @param Title $title Title of the page preview is generated for
	 * @param string $html preview content to modify
	 * @param string $html current wikitext from the editor
	 * @return bool return true
	 */
	public static function onEditPageLayoutModifyPreview(Title $title, $html, $wikitext) {
		global $wgOasisNavV2;

		if (self::isWikiNavMessage($title) && !empty($wgOasisNavV2)) {
			// render a preview
			$html = wfRenderModule('WikiNavigation', 'Index', array(
				'msgName' => $title->getText(),
				'wikitext' => $wikitext,
			));

			// open links in new tab
			$html = str_replace('<a ', '<a target="_blank" ', $html);

			// wrap it inside header wrapper and run JS to make the preview interactive
			$html = <<<HEADER
				<header id="WikiHeader" class="WikiHeaderRestyle WikiHeaderPreview">
					<nav>
					$html
					</nav>
				</header>
HEADER;
		}

		return true;
	}

	/**
	 * Add global JS variable indicating that we're editing wiki nav message
	 *
	 * @param Array $vars list of global JS variables
	 * @return bool return true
	 */
	public static function onEditPageMakeGlobalVariablesScript(Array $vars) {
		global $wgTitle;

		if (self::isWikiNavMessage($wgTitle)) {
			$vars['wgIsWikiNavMessage'] = true;
		}

		return true;
	}

	/**
	 * Clear the navigation service cache every time a message in edited
	 *
	 * @param string $title name of the page changed.
	 * @param string $text new contents of the page
	 * @return bool return true
	 */
	public static function onMessageCacheReplace($title, $text) {
		global $wgMemc;

		if (self::isWikiNavMessage(Title::newFromText($title, NS_MEDIAWIKI))) {
			$service = new NavigationService();

			$memcKey = $service->getMemcKey($title);
			$wgMemc->delete($memcKey);

			wfDebug(__METHOD__ . ": '{$memcKey}' cache cleared\n");
		}

		return true;
	}

	/**
	 * Clear local wikinav cache when local version of global menu
	 * is modified using WikiFactory
	 *
	 * @param string $cv_name WF variable name
	 * @param int $city_id wiki ID
	 * @param mixed $value new variable value
	 * @return bool return true
	 */
	public static function onWikiFactoryChanged($cv_name , $city_id, $value) {
		global $wgMemc;

		if ($cv_name == self::WIKIA_GLOBAL_VARIABLE) {
			$service = new NavigationService();
			$memcKey = $service->getMemcKey(self::WIKIA_GLOBAL_VARIABLE, $city_id);

			wfDebug(__METHOD__ . ": purging the cache for wiki #{$city_id}\n");

			$wgMemc->delete($memcKey);
		}

		return true;
	}

	/**
	 * Check if given title refers to one of three wiki nav messages
	 */
	private static function isWikiNavMessage(Title $title) {
		return ($title->getNamespace() == NS_MEDIAWIKI) && in_array($title->getText(), array(self::WIKIA_LOCAL_MESSAGE, self::WIKI_LOCAL_MESSAGE));
	}
}
