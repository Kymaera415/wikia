<?php

/**
 * Item parameter manipulation base class. This is for manipulations
 * that apply to individual values, which can either be the whole value
 * of a non-list parameter, or a single item of a list parameter.
 * 
 * @since 0.4
 * 
 * @file ItemParameterManipulation.php
 * @ingroup Validator
 * @ingroup ParameterManipulations
 * 
 * @licence GNU GPL v3 or later
 * @author Jeroen De Dauw < jeroendedauw@gmail.com >
 */
abstract class ItemParameterManipulation extends ParameterManipulation {
	
	/**
	 * Manipulate an actual value.
	 * 
	 * @param string $value
	 * @param Parameter $parameter
	 * @param array $parameters
	 * 
	 * @since 0.4
	 * 
	 * @return mixed
	 */	
	protected abstract function doManipulation( &$value, Parameter $parameter, array &$parameters );	
	
	/**
	 * Constructor.
	 * 
	 * @since 0.4
	 */
	public function __construct() {
		parent::__construct();
	}
	
	/**
	 * @see ParameterManipulation::isForLists
	 */
	public function isForLists() {
		return false;
	}
	
	/**
	 * Validate a parameter against the criterion.
	 * 
	 * @param Parameter $parameter
	 * @param array $parameters
	 * 
	 * @since 0.4
	 */	
	public function manipulate( Parameter &$parameter, array &$parameters ) {
		if ( is_array( $parameter->getValue() ) ) {
			$value = &$parameter->getValue();
			foreach ( $value as &$item ) {
				$this->doManipulation( $item, $parameter, $parameters );
			}
		}
		else {
			$this->doManipulation( $parameter->getValue(), $parameter, $parameters );
		}	
	}
	
}