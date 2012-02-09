<?php

/**
 * Main Category Gallery class
 */
class CategoryExhibitionSection {

	protected $thumbWidth = 130;
	protected $thumbHeight = 115;
	protected $thumbMedia = 130;		// width for media section
	protected $displayOption = false;	// current state of display option
	protected $sortOption = false;		// current state of sort option

	protected $allowedSortOptions = array( 'alphabetical', 'recentedits' ); // once contained "mostivisited", removed b/c no data
	protected $allowedDisplayOptions = array( 'exhibition', 'page' );

	protected $verifyChecker = '';

	public $urlParameter = 'section';	// contains section url variable that stores pagination
	public $paginatorPosition = 1;		// default pagination
	public $sUrl = '';
	public $categoryTitle = false;		// title object of category
	public $templateName = 'section';	// name of the section template
	public $isFromAjax = false;		// true if request comes from ajax

	public function __construct( $oCategoryTitle ){

		global $wgRequest, $wgUser;

		$this->categoryTitle = $oCategoryTitle;

		if ( $wgUser->isAnon() ){
			$this->setDisplayTypeFromParam();
			$this->setSortTypeFromParam();
		}
	}

	/**
	 * fetchSectionItems - returns gets array of items from category from specyfic namespace.
	 * @param $sCategoryDBKey int category namespace
	 * @param $mNamespace mixed: int namespace or array of int for category query
	 * @return array
	 */

	protected function fetchSectionItems( $mNamespace = NS_MAIN, $negative = false ) {

		global $wgDevelEnvironment;
		$sCategoryDBKey = $this->categoryTitle->getDBkey();

		// Check if page is a redirect
		if( $this->categoryTitle->isRedirect() ){
			$oTmpArticle = new Article( $this->categoryTitle );
			if ( !is_null( $oTmpArticle ) ) {
				$rdTitle = $oTmpArticle->getRedirectTarget();
				if ( !is_null( $rdTitle ) && ( $rdTitle->getNamespace() == NS_CATEGORY ) ) {
					$sCategoryDBKey = $rdTitle->getDBkey();
				}
			}
		}
		if (!is_array($mNamespace)){
			$mNamespace = (int)$mNamespace;
		} else {
			$mNamespace = implode(',', $mNamespace);
		}
		switch ( $this->getSortType() ){
			case 'alphabetical': return CategoryDataService::getAlphabetical( $sCategoryDBKey, $mNamespace, $negative );
			case 'recentedits': return CategoryDataService::getRecentlyEdited( $sCategoryDBKey, $mNamespace, $negative );
		}
		return array();
	}

	/**
	 * Sort type setters and getters
	 */

	public function getSortTypes(){

		return $this->allowedSortOptions;
	}

	public function getSortType(){

		global $wgUser, $wgCookiePrefix;

		if ( in_array( $this->sortOption, $this->allowedSortOptions ) ) {
			return $this->sortOption;
		}
		if ( $wgUser->isAnon() ){
			$this->setSortTypeFromParam();
			$return = $this->sortOption;
		} else {
			$return = $wgUser->getOption( 'CategoryExhibitionSortType', $this->allowedSortOptions[0] );
		}

		if ( !empty( $return ) && in_array( $return, $this->allowedSortOptions ) ){
			return $return;
		} else {
			return $this->allowedSortOptions[0];
		}
	}

	public function setSortType( $sortType ){

		global $wgUser;

		if ( in_array( $sortType, $this->allowedSortOptions ) ) {
			if ( !$wgUser->isAnon() ) {
				$wgUser->setOption('CategoryExhibitionSortType', $sortType );
				$wgUser->saveSettings();
			}
			$this->sortOption = $sortType;
		}
	}

	public function setSortTypeFromParam(){

		global $wgRequest;

		$paramVar = $wgRequest->getText( 'sort' );
		if ( !empty( $paramVar ) ){
			$this->setSortType( $paramVar );
		}
	}

	/**
	 * Display type setters and getters
	 */

	public function setDisplayTypeFromParam(){

		global $wgRequest;

		$paramVar = $wgRequest->getText( 'display' );
		if ( !empty( $paramVar ) ){
			$this->setDisplayType( $paramVar );
		}
	}

	public function setDisplayType( $displayType ){

		global $wgUser;
		if ( in_array( $displayType, $this->allowedDisplayOptions ) ) {
			if ( !$wgUser->isAnon() ) {
				$wgUser->setOption('CategoryExhibitionDisplayType', $displayType );
				$wgUser->saveSettings();
			}
			$this->displayOption = $displayType;
		}
	}

	public function getDisplayType(){

		global $wgUser, $wgCookiePrefix;

		if ( !empty( $this->displayOption ) && in_array( $this->displayOption, $this->allowedDisplayOptions ) ){
			return $this->displayOption;
		}
		$cookieName = $wgCookiePrefix . 'CategoryExhibitionDisplayType';
		if ( $wgUser->isAnon() ){
			$this->setDisplayTypeFromParam();
			$return = $this->displayOption;
		} else {
			$return = $wgUser->getOption( 'CategoryExhibitionDisplayType', $this->allowedDisplayOptions[0] );
		}

		if ( !empty( $return ) && in_array( $return, $this->allowedDisplayOptions ) ){
			return $return;
		} else {
			return $this->allowedDisplayOptions[0];
		}
	}

	/**
	 * main function returning fillet template ready to print.
	 * @param $itemsPerPage int number of articles per page
	 * @param $namespace mixed: int namespace or array of int for category query
	 * @return EasyTemplate object
	 */

	protected function getTemplateForNameSpace( $namespace, $itemsPerPage = 16, $negative = false ){

		global $wgTitle;
		$cachedContent = $this->getFromCache();
		$oTmpl = new EasyTemplate( dirname( __FILE__ ) . "/templates/" );
		if( empty( $cachedContent ) ){
			$aTmpData = $this->fetchSectionItems( $namespace, $negative );
			$pages = Paginator::newFromArray( $aTmpData, $itemsPerPage );
			if ( is_array( $aTmpData ) && count( $aTmpData ) > 0 ){
				$aTmpData = $pages->getPage( $this->paginatorPosition, true );
				$aData = $this->getArticles( $aTmpData );
				$oTmpl->set_vars(
					array (
						'data'		=> $aData,
						'category'	=> $this->categoryTitle->getText(),
						'paginator'	=> $pages->getBarHTML( $this->sUrl )
					)
				);
				$this->saveToCache( $oTmpl->mVars );
				return $oTmpl;
			} else {
				return null;
			}
		} else {
			$oTmpl->set_vars( $cachedContent );
			return $oTmpl;
		}
	}

	/**
	 * Exacutes template. Checks if it is done from Ajax request.
	 * @param $oTmpl EasyTemplate template obj
	 * @return string
	 */

	protected function executeTemplate( $oTmpl ){

		if ( !empty($oTmpl) ){
		$oTmpl->set_vars(array('fromAjax' => $this->isFromAjax));
			if ( $this->isFromAjax ){
				return array(
				    'page'	=> $oTmpl->execute( 'page' ),
				    'paginator'	=> $oTmpl->mVars['paginator']
				);
			} else {
				return $oTmpl->execute( $this->templateName );
			}
		} else {
			return '';
		}
	}

	public function getSectionHTML( ) {

		# for overloading
	}

	/**
	 * Returns image from page.
	 * @param $mPageId int page id
	 * @return string - image url
	 */

	protected function getImageFromPageId( $mPageId ){

		if ( !is_array( $mPageId ) ){
			$mPageId = array( $mPageId );
		}

		$imageServing = new ImageServing( $mPageId, $this->thumbWidth , array( "w" => $this->thumbWidth, "h" => $this->thumbHeight ) );
		$imageUrl = '';

		foreach ( $imageServing->getImages( 1 ) as $key => $value ){
			if ( !empty( $value[0]['name'] ) ){
				$tmpTitle = Title::newFromText( $value[0]['name'], NS_FILE );
				$image = wfFindFile( $tmpTitle );
				if ( empty( $image ) ){
					return '';
				}
				$imageUrl = wfReplaceImageServer(
					$image->getThumbUrl(
						$imageServing->getCut( $image->width, $image->height )."-".$image->getName()
					)
				);
			}
		}
		return $imageUrl;
	}

	/**
	 * Loads detail data for articles that will be displayed in current page.
	 * @param $aTmpData array articles in sections page
	 * @return array - data for template
	 */

	protected function getArticles( $aTmpData ){

		$aData = array();
		foreach( $aTmpData as $item ){	
			$articleData = $this->getArticleData( $item['page_id'] );
			if(!empty($articleData)) { 		
				$aData[] = $articleData;
			} 
		};		
		return $aData;
	}

	protected function isVerify(){

		if ( empty( $this->verifyChecker ) ){
			$this->verifyChecker = md5( F::app()->wg->server );
		}
		return $this->verifyChecker;
	}

	protected function getArticleData( $pageId ){

		$oMemCache = F::App()->wg->memc;
		$sKey = F::App()->wf->sharedMemcKey(
			'category_exhibition_category_cache',
			$pageId,
			F::App()->wg->cityId,
			$this->isVerify()
		);

		$cachedResult = $oMemCache->get( $sKey );

		if ( !empty( $cachedResult ) ) {
			return $cachedResult;
		}

		$snippetText = '';
		$imageUrl = $this->getImageFromPageId( $pageId );

		if ( empty( $imageUrl ) ){
			$snippetService = new ArticleService ( $pageId );
			$snippetText = $snippetService->getTextSnippet();
		}

		$oTitle = Title::newFromID( $pageId );
		if(!($oTitle instanceof Title)) {
			return false;
		}

		$returnData = array(
			'id'		=> $pageId,
			'img'		=> $imageUrl,
			'snippet'	=> $snippetText,
			'title'		=> $this->getTitleForElement( $oTitle ),
			'url'		=> $oTitle->getFullURL()
		);

		// will be purged elsewhere after edit
		$oMemCache->set( $sKey, $returnData, 60*60*24 );
		
		return $returnData ;
	}

	protected function getTitleForElement( $oTitle ){
		return $oTitle->getText();
	}

	/**
	 * Loads data for pagination.
	 */

	function loadPaginationVars( ){

		global $wgTitle, $wgRequest;
		$variableName = $this->urlParameter;
		$paginatorPosition = 1;
		$reqValues = $wgRequest->getValues();
		if ( !empty( $reqValues[ $variableName ] ) ){
			$paginatorPosition = (int)$reqValues[ $variableName ];
			unset( $reqValues[ $variableName ] );
		};
		$return = array();
		foreach( $reqValues AS $key => $value ) {
			$return[] = $key.'='.$value;
		}

		$url = $wgTitle->getFullURL().'?'.implode( '&', $return );
		if ( count($value) > 0 ){
			$url.= '&'.$variableName.'=%s';
		} else {
			$url.= '?'.$variableName.'=%s';
		}
		$this->sUrl = $url;
		$this->paginatorPosition = $paginatorPosition;
		return array( 'url' => $url, 'position' => $paginatorPosition );;
	}

	/**
	 * Caching functions.
	 */

	protected function getKey( ) {
		global $wgCityId;
		return wfSharedMemcKey(
			'category_exhibition_section',
			$this->categoryTitle->getDBKey(),
			$this->templateName,
			$this->paginatorPosition,
			$this->getDisplayType(),
			$this->getSortType(),
			$this->isVerify(),
			$wgCityId
		);
	}

	protected function saveToCache( $content ) {
		
		global $wgMemc;
		$memcData = $this->getFromCache( );
		if ( empty($memcData) ){
			$wgMemc->set( $this->getKey( ), $content, 60*30 );
			return false;
		}
		return true;
	}

	protected function getFromCache ( ){

		global $wgMemc;
		return $wgMemc->get( $this->getKey( ) );
	}

	protected function clearCache ( ){

		global $wgMemc;
		return $wgMemc->delete( $this->getKey( ) );
	}
}
