<?php

$wgExtensionMessagesFiles['LatestQuestions'] = dirname(__FILE__) . '/LatestQuestions.i18n.php';
$wgExtensionFunctions[] = 'efLatestQuestionsInit';

if( empty( $wgAnswersServer ) ) {
	$wgAnswersServer = 'http://frag.wikia.com';
}
if( empty( $wgAnswersScript ) ) {
	$wgAnswersScript = '/index.php';
}

function efLatestQuestionsInit() {
	global $wgUser, $wgHooks;
	if( $wgUser->isAnon() ) {
		$wgHooks['AjaxAddScript'][] = 'wfLatestQuestionsAjaxAddScript';
		$wgHooks['MakeGlobalVariablesScript'][] = 'wfLatestQuestionsJSVariables';
	}
}

function wfLatestQuestionsAjaxAddScript( &$out ) {
	global $wgStyleVersion, $wgJsMimeType, $wgExtensionsPath;
	$out->addScript( "<script type=\"{$wgJsMimeType}\" src=\"{$wgExtensionsPath}/wikia/LatestQuestions/LatestQuestions.js?{$wgStyleVersion}\"></script>\n" );
	$out->addStyle( AssetsManager::getInstance()->getSassCommonURL('extensions/wikia/LatestQuestions/LatestQuestions.scss'));
	return true;
}

function wfLatestQuestionsJSVariables( &$vars ) {
	global $wgAnswersServer, $wgAnswersScript;
	wfLoadExtensionMessages('LatestQuestions');
	$vars['wgAnswersServer'] = $wgAnswersServer;
	$vars['wgAnswersScript'] = $wgAnswersScript;
	$vars['wgLatestQuestionsHeader'] = wfMsg('latest-questions-header');
	$vars['wgOasisMoreMsg'] = wfMsg('oasis-more');
	return true;
}
