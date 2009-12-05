<?php
/**
 * @ingroup Wikia
 * @file WikiStickies.class.php
 * @package WikiStickies
 * @see https://contractor.wikia-inc.com/wiki/WikiStickies
 */
class WikiStickies {

	const STICKY_FEED_LIMIT = 1; // one for the sticky note, to display in yellow
	const INITIAL_FEED_LIMIT = 10; // 10 to get initially for this nice viewer fellow
	const SPECIAL_FEED_LIMIT = 21; // 21 to rule them all, and in light display them

	/**
	 * Loads base WikiSticky CSS and JavaScript resources.
	 */
	static function addWikiStickyResources () {
		global $wgOut, $wgExtensionsPath, $wgStyleVersion, $wgJsMimeType;
		$wgOut->addExtensionStyle("{$wgExtensionsPath}/wikia/WikiStickies/css/WikiStickies.css?{$wgStyleVersion}");
		$wgOut->addScript("<script type=\"{$wgJsMimeType}\" src=\"{$wgExtensionsPath}/wikia/WikiStickies/js/WikiStickies.js?{$wgStyleVersion}\"></script>\n");
	}

	/**
	 * tool generation wrapper (basically template call)
	 */
	static function generateTools() {
		global $wgOut, $wgUser;

		// same as for Monaco bar, I guess
		if( !$wgUser->isAllowed( 'editinterface' ) ) {
			return false;
		}

		$tpl = new EasyTemplate( dirname( __FILE__ )."/templates/" );
		$tpl->set_vars( array() );

		$text = $tpl->execute( 'tools' );
		$wgOut->addHTML( $text );
	}

	/**
	 * Prints feed items in batch.
	 *
	 * @param array $feed_data The list of page names that will become the items in the feed.
	 * @param array $attrs An array of attribute-value pairs. (Optional.)
	 * @return The complete list HTML to print.
	 */
	function renderFeedList ( &$feed_data, $attrs = NULL ) {
		global $wgUser;

		$sk = $wgUser->getSkin();
		$out = '';
		$uptolimit = 0;

		$out .= Xml::openElement( 'ul', $attrs );

		foreach( $feed_data as $title ) {
			if( $uptolimit < self::INITIAL_FEED_LIMIT ) {
				if ( $uptolimit > 4 ) { // start a new column at 6th item
					if ( $uptolimit === 5 ) {
						$out .= Xml::openElement ( 'li', array ( 'class' => 'secondcolumn reset' ) );
					} else {
						$out .= Xml::openElement ( 'li', array ( 'class' => 'secondcolumn' ) );
					}
				} else {
					$out .= Xml::openElement( 'li' );
				}
				$out .= $sk->makeKnownLinkObj( $title, $title->getText() ).
				Xml::closeElement( 'li' );
				array_shift( $feed_data );
				$uptolimit++;
			}
		}

		$out .= Xml::closeElement( 'ul' );

		return $out;
	}

	/**
	 * Constructs the majority of HTML output to render.
	 *
	 * @param string $type Moniker for the feed. This becomes the HTML ID attribute value.
	 * @param array $feed_data The list of page names that will become items in the feed.
	 * @param string $header The natural-language feed headline.
	 * @param string $sticker The natural-language sticky question text.
	 *
	 * @TODO: Need a non-redundant way of informing this function what feed is being used.
	 *		We should probably find some way of collapsing the $type, $header,
	 *		and $sticker variables.
	 */
	static function formatFeed( $type, &$feed_data, $header, $sticker ) {
		global $wgOut, $wgUser;

		$sk = $wgUser->getSkin() ;
		$body = '';

		if( empty( $feed_data ) ) {
			return false;
		}

		if( isset( $feed_data['continue'] ) ) {
			array_pop( $feed_data );
		}

		$sticky = self::renderWikiSticky(
				array_shift( $feed_data ),
				$sticker,
				array(
					'id' => $type . '-browser',
					'class' => 'wikisticky_browser' )
				);

		$numitems = count($feed_data);

		// First batch. These are visible by default.
		if( $numitems ) {
			$body .= self::renderFeedList( $feed_data );
		}
		// Second batch of items. These are hidden by default.
		if( $numitems > 10 ) {
			$body .= self::renderFeedList( $feed_data, array( 'class' => 'submerged' ) );
		}

		$html = Xml::openElement( 'div', array( 'id' => $type, 'class' => 'wikistickiesfeed' ) ).
			'<img alt="" class="sprite" src="/skins/monobook/blank.gif" />'.
			Xml::openElement( 'h2' ).
						$header.
			Xml::closeElement( 'h2' ).
			$sticky.$body;

		// See more link
		// TODO: This href attribute should actually point to the source of the feed
		//	   in case JS is off. It should not remain an empty fragment.
		if ($numitems > 10) { // don't show link if less than 10 items in list
			$html .= Xml::openElement( 'a', array( 'href' => '#', 'class' => 'MoreLink' ) ).
				wfMsg( 'wikistickies-more' ).
				Xml::closeElement( 'a' );
		}

		$html .= Xml::closeElement( 'div' );

		$wgOut->addHTML( $html );
	}

	// feed packaging
	static function getFeed( $feed, $data ) {
		wfProfileIn( __METHOD__ );
		$result = array();
		$oFauxRequest = new FauxRequest( $data );

		$oApi = new ApiMain($oFauxRequest);
		$oApi->execute();
		$aResult =& $oApi->GetResult()->getData();

		// get the pages
		if( !isset($aResult['warnings']) ) {
			if( count($aResult['query'][$feed]) > 0) {
				foreach( $aResult['query'][$feed] as $newfound ) {
					if( isset( $newfound['namespace'] ) ) {
						$result[] = Title::makeTitle( $newfound['namespace'], $newfound['title']);
					} else {
						$result[] = Title::newFromText( $newfound['title']);
					}
				}
			}
		}

		wfProfileOut( __METHOD__ );
		return $result;
	}

	// fetch the feed for SpecialNewpages
	static function getNewpagesFeed( $limit ) {
		global $wgContentNamespaces;
		$data =	array(
				'action'		=> 'query',
				'list'			=> 'recentchanges',
				'rcprop'		=> 'title',
				'rcnamespace'		=> implode('|',$wgContentNamespaces),
				'rctype'		=> 'new',
				'rcshow'		=> '!redirect',
				'rclimit'		=> intval($limit),
				 );

		return self::getFeed( 'recentchanges', $data );
	}

	// fetch the feed for SpecialWantedpages
	static function getWantedpagesFeed( $limit ) {
		$data = array(
				'action'	=> 'query',
				'list'		=> 'wantedpages',
				'wnlimit'	=> intval($limit),
				 );

			return self::getFeed( 'wantedpages', $data );
	}

	// fetch the feed for pages without images
	static function getWantedimagesFeed( $limit ) {
		$data = array(
				'action'	=> 'query',
				'list'		=> 'wantedimages',
				'wilimit'	=> intval($limit),
				 );

			return self::getFeed( 'wantedimages', $data );
	}

	/**
	 * Outputs the appropriate HTML for a WikiSticky.
	 *
	 * @param $title A Title object the WikiSticky should display.
	 * @param $prefix string The natural-language prefix to the type of sticky.
	 * @param $attrs array An array of attribute-value pairs. (Optional.)
	 *
	 * @return string The appropriate HTML to output.
	 */
	static function renderWikiSticky ( $title, $prefix, $attrs = NULL ) {
		global $wgExtensionsPath, $wgUser, $wgTitle, $wgCanonicalNamespaceNames;
		// Where are we?
		$canname = SpecialPage::resolveAlias( $wgTitle->getDBkey() );

		// Set default attributes.
		if( !is_array( $attrs ) ) {
			$attrs = array(
				'id' => 'wikisticky_browser',
				'class' => 'wikisticky_browser'
			);
		}

		$sp_title = Title::makeTitle( NS_SPECIAL, 'WikiStickies' );
		$sk = $wgUser->getSkin();

		$html = Xml::openElement( 'div', $attrs ).
			Xml::openElement( 'div', array( 'class' => 'wikisticky_content' ) );
		// TODO: These checks for page location might be better abstracted later.
		if( 'MyHome' == $canname ) {
			$html .= Xml::openElement( 'h2' ).
				wfMsg( 'wikistickies' ).
			Xml::closeElement( 'h2' );
		}
		$html .= Xml::openElement( 'p' ).
			self::renderWikiStickyContent( $title, $prefix ).
			Xml::closeElement( 'p' );
		if( 'MyHome' == $canname ) {
			// TODO: This should link to the source of the feed fetched, not a '#' fragment.
			$html .=
			Xml::openElement( 'a', array( 'href' => '#', 'class' => 'wikisticky_next' ) ).
				wfMsg( 'wikistickies-next' ).
			Xml::closeElement( 'a' ).
			"<img src=\"{$wgExtensionsPath}/wikia/WikiStickies/images/curl.png\" class=\"wikisticky_curl\" />";
		}
		$html .= Xml::closeElement( 'div' ). // END .wikisticky_content
			Xml::closeElement( 'div' ); // END #$attrs

		if( 'MyHome' == $canname ) {
			// this is the link for Special:WikiStickies
			$html .= $sk->makeKnownLinkObj( $sp_title, wfMsg( 'wikistickies-see-more' ),
					'', '', '', 'class="wikisticky_special_link"' );
		}

		return $html;
	}

	static function renderWikiStickyContent( $title, $prefix ) {
		global $wgUser;

		$sk = $wgUser->getSkin();

		$html = xml::openelement( 'span' ).
			htmlspecialchars( $prefix ).
			xml::closeelement( 'span' ).
			// todo: handle an array with more than one item?
			' ' . $sk->link( $title, htmlspecialchars( $title->getText(), ENT_QUOTES ), array(), array(), array( 'known') ) . '?';
		return $html;
	}

}
