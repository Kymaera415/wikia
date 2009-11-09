<?php

class Piggyback extends SpecialPage
{
	var $mAction;

	function __construct(){
		global $wgRequest;
		parent::__construct( 'Piggyback','piggyback' );
		$this->mAction = $wgRequest->getVal( 'action' );
		wfLoadExtensionMessages('Piggyback');
	}

	function execute( $par ){
		global $wgRequest, $wgOut, $wgUser;
			
		if( !$wgUser->isAllowed( 'piggyback' ) ) {
			$wgOut->permissionRequired( 'piggyback' );
			return;
		}

		if (PBLoginForm::isPiggyback()) {
			$wgOut->setPageTitle( wfMsg( 'badaccess' ) );
			$wgOut->addHtml(wfMsg('firstlogout'));
			$wgOut->returnToMain();
			return  ;
		}

		$this->setHeaders();
		$LoginForm = new PBLoginForm($wgRequest);
		if ($this->mAction == 'submitlogin' && ($wgRequest->wasPosted())) {
			$LoginForm->validPiggyback();
		}

		$LoginForm->render();
	}
}


/*
 * overload LoginForm to not re-implement user verification
 */

class PBLoginForm extends LoginForm
{
	var $mOtherName,$exTemplate,$plugin;

	function __construct(&$request) {
		global $wgUser;

		$this->titleObj = SpecialPage::getTitleFor( 'Piggyback');
		$this->plugin = new PiggybackTemplate();
		$this->exTemplate =  new UserloginTemplate();
		$this->exTemplate->set( 'action', $this->titleObj->getLocalUrl( 'action=submitlogin' ) );

		$this->mOtherName = $request->getVal('wpOtherName');
		parent::LoginForm(&$request);
		$this->mType = "login";
		/* fake to don't change remember password */
		$this->mRemember = (bool)$wgUser->getOption( 'rememberpassword' );
	}

	function mainLoginForm($msg, $msgtype = 'error' ) {
		$this->exTemplate->set('messagetype', $msgtype );
		$this->exTemplate->set('message',$msg);
		$this->exTemplate->set( 'name', $this->mName );
		$this->exTemplate->set( 'password', $this->mPassword );
		$this->plugin->set( 'otherName', $this->mOtherName );
	}

	function successfulLogin() {
		global $wgUser, $wgAuth,$wgOut,$wgRequest;

		/* post valid */
		$u = User::newFromName( $this->mOtherName );

		if (  $u->getId()  == 0 ) {
			$this->mainLoginForm(wfMsg( 'nosuchusershort', htmlspecialchars( $this->mOtherName ) ));
			return ;
		}


		if (  $u->getId()  == $wgUser->getId() ) {
			$this->mainLoginForm(wfMsg( 'itisyou'));
			return ;
		}

		/*		if (  $u->isAllowed('piggyback') )
		 {
			$this->mainLoginForm(wfMsg( 'issysopto', htmlspecialchars( $this->mOtherName ) ));
			return ;
			} */

		$wgRequest->setSessionData("PgParentUser",$wgUser->getID());

		$log = new LogPage( 'piggyback' );
		$log->addEntry( 'piggyback', SpecialPage::getTitleFor( 'Piggyback') , "login ".$wgUser->getName()." to ".$u->getName(),  array() );

		$this->switchUser($u);
	}

	function switchUser($u) {
		global $wgUser, $wgAuth,$wgOut,$wgRequest,$wgLang;
		$oldUserlang = $wgUser->getOption( 'language' );
		$wgAuth->updateUser( $u );
		$wgUser = $u;
		$wgUser->setCookies();

		if( $this->hasSessionCookie() || $this->mSkipCookieCheck ) {
			/* Replace the language object to provide user interface
			 * in "parent user" lenguage
			 *
			 */
			if( $this->hasSessionCookie() || $this->mSkipCookieCheck )
			{
				$code = $wgRequest->getVal( 'uselang',$oldUserlang );
				$wgLang = Language::factory( $code );
			} else
			{
				return $this->cookieRedirectCheck( 'login' );
			}
		}

		$userpage = Title::makeTitle( NS_USER, $wgUser->getName());
		$wgOut->redirect( $userpage->getLocalUrl() );
	}

	function validPiggyback() {
		global $wgUser;

		/* pre valid */
		$cUserId = User :: idFromName($this->mName);
		if (($cUserId != 0) && ($wgUser->getID() != $cUserId ))
		{
			$this->mainLoginForm(wfMsg( 'wronguser', htmlspecialchars( $this->mName ) ));
			return ;
		}
		$this->processLogin();
	}

	function render() {
		global $wgOut,$wgScriptPath;
		$this->exTemplate->set("header",$this->plugin);
		$wgOut->addStyle("$wgScriptPath/extensions/Piggyback/Resources/Piggyback.css");
		$wgOut->addTemplate($this->exTemplate);
	}

	static function isPiggyback() {
		global $wgRequest;
		return $wgRequest->getSessionData("PgParentUser") != null;
	}

	function goToParent($oldName) {
		global $wgRequest;
		$u = User::newFromId( $wgRequest->getSessionData("PgParentUser") );
		$log = new LogPage( 'piggyback' );
		$this->switchUser($u);
		/*	$log->addEntry( 'piggyback', SpecialPage::getTitleFor( 'Piggyback') ,"logout ".$u->getName()." from ".$oldName, array() ); */
		$wgRequest->setSessionData("PgParentUser",null);
	}
}



