<?php

$wgHooks["MakeGlobalVariablesScript"][] = "wfPartnerWidgetJSVars";

function wfPartnerWidgetJSVars($vars) {
	$vars['partnerKeywords'] = getPartnerWidgetKeywords();

	return true;
}

function getPartnerWidgetKeywords() {
	global $wgTitle, $wgDBname, $wgOut;
	
	$keywords = null;

	switch ($wgDBname) {
		case 'hotwheels':
			$HOTWHEELS = 'Hot Wheels';
			$CATEGORY_PREFIX_HOTWHEELSBY = 'Hot Wheels by';
			$CATEGORY_PREFIX_HOTWHEELSBY = 'Hot Wheels by';

			$keywords = $wgTitle->getText();
			$hotwheelsbyPos = stripos($keywords, $CATEGORY_PREFIX_HOTWHEELSBY);
			if ($hotwheelsbyPos !== FALSE) {
				$keywords = substr($keywords, $hotwheelsbyPos+strlen($CATEGORY_PREFIX_HOTWHEELSBY));
			}

			if (stripos($keywords, $HOTWHEELS) === FALSE) {
				$keywords = $HOTWHEELS . ' ' . $keywords;
			}

			break;
		//case 'vintagepatterns':
			//if ($wgTitle->getNamespace() == NS_CATEGORY) {
				//$keywords = $wgTitle->getText();
			//}
			//elseif (in_array('Vintage Sewing Patterns', $wgOut->getCategories())) {
				//$keywords = $wgTitle->getText();
				// strip trailing "A", "B", etc.
				//if (preg_match('/ [A-Za-z]$/', $keywords)) {
					//$keywords = substr($keywords, 0, strlen($keywords)-2);
				//}
			//}
			//break;
		default:
	}

	return $keywords;
}
