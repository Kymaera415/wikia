<?php

/**
 * This is an example use of SpecialPage controller
 * @author ADi
 *
 */
class DummyExtensionSpecialPageController extends WikiaSpecialPageController {

	private $data = array();

	public function __construct() {
		$this->data[] = 'foo';
		$this->data[] = 'bar';
		$this->data[] = 'baz';

		// standard SpecialPage constructor call
		parent::__construct( 'DummyExtension', '', false );
	}

	/**
	 * this is default method
	 */
	public function index() {
		$this->redirect( 'DummyExtensionSpecialPage', 'helloWorld' );
	}

	public function helloWorld() {
		if($this->request->getVal('param') == 1 ) {
			// changing default template
			$this->response->setTemplatePath( dirname( __FILE__ ) . '/templates/someTemplate.php' );
		}

		// setting response data
		$this->response->setVal( 'header', 'Hello World!' );

		// example of setting SpecialPage::mIncluding
		$this->mIncluding = true;
	}

	public function getDialog() {

	}

	public function getSomeData() {
		$this->response->setVal( 'someData', $this->data );
	}

}