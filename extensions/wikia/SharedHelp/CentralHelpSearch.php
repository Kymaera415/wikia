<?php
/**
 * CentralHelpSearch extension
 *
 * Allows inclusion of a form to search Community Central Help
 *
 * @file
 * @ingroup Extensions
 * @author Grunny
 * @date 2011-08-27
 * @copyright Copyright © 2011 Grunny, Wikia Inc.
 * @license http://www.gnu.org/copyleft/gpl.html GNU General Public License 2.0 or later
 * @version 0.1
 */

if ( !defined( 'MEDIAWIKI' ) ) {
	echo( "This is an extension to the MediaWiki package and cannot be run standalone.\n" );
	die( -1 );
}

// Extension credits that will show up on Special:Version
$wgExtensionCredits['parserhook'][] = array(
	'path'           => __FILE__,
	'name'           => 'CentralHelpSearch',
	'author'         => "[http://www.wikia.com/wiki/User:Grunny Grunny]",
	'version'        => '0.1',
	'descriptionmsg' => 'centralhelpsearch-desc',
);

$dir = dirname( __FILE__ ) . '/';

$wgExtensionMessagesFiles['CentralHelpSearch'] = $dir . 'CentralHelpSearch.i18n.php';

$wgHooks['ParserFirstCallInit'][] = 'efCentralHelpSearchSetup';


function efCentralHelpSearchSetup( &$parser ) {
	$parser->setHook( 'centralhelpsearch', 'efCreateSearchForm' );

	return true;
}

function efCreateSearchForm() {

	$htmlOut = Xml::openElement( 'form',
		array(
			'name' => 'bodyCentralSearch',
			'id' => 'bodyCentralSearch',
			'class' => 'bodyCentralSearch',
			'action' => htmlspecialchars( 'http://community.wikia.com/wiki/Special:Search' )
		)
	);
	$htmlOut .= Xml::openElement( 'div',
		array(
			'class' => 'bodyCentralSearchWrap',
			'style' => 'margin: 20px auto; color: #999; width: 500px;'
		)
	);
	$htmlOut .= Xml::element( 'input',
		array(
			'type' => 'text',
			'name' => 'search',
			'size' => 50,
			'placeholder' => wfMsg( 'centralhelpsearch-placeholder' ),
			'style' => 'border:1px solid #999; padding: 10px; width: 500px; font-size: 20px;',
			'id' => 'bodyCentralSearchInput'
		)
	);
	$htmlOut .= Xml::element( 'input',
		array(
			'type' => 'hidden',
			'name' => 'ns12',
			'value' => 1,
			'checked' => 'checked',
			'id' => 'mw-inputbox-ns12'
		)
	);

	$htmlOut .= Html::hidden( 'fulltext', 'Search' );

	$htmlOut .= Xml::closeElement( 'div' );
	$htmlOut .= Xml::closeElement( 'form' );

	return $htmlOut;
}
