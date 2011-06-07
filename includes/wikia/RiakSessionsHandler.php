<?php


/**
 * This file gets included if $wgSessionsInRiak is set in the config.
 * It redirects session handling functions to store their data in riak
 * instead of the local filesystem.
 *
 * @file
 * @ingroup Cache
 * @author Krzysztof Krzyżaniak (eloy)
 */

class RiakSessionHandler {

	const BUCKET = "sessions";
	const EXPIRE = 3600;

	/**
	 * return proper key for session
	 *
	 * if $wgSharedDB is set it means that we use global user table on 1st cluster
	 *
	 * if nothing from above is set we have local user table (for example
	 * uncyclopedia)
	 */
	static public function key( $id ) {
		return wfGetSessionKey( $id );
	}

	static public function open() {
		#
		# NOP, riak is connectless protocol (HTTP)
		#
		return true;
	}

	static public function close() {
		#
		# NOP, riak is connectless protocol (HTTP)
		#
		return true;
	}

	static public function read( $id ) {
		global $wgRiakSessionNode;

		$cache = new RiakCache( self::BUCKET, $wgRiakSessionNode, false );
		wfDebugLog( "session", __METHOD__ . ": reading $id from session storage\n", true );
		return $cache->get( self::key( $id ) );
	}

	static public function write( $id, $data ) {
		global $wgRiakSessionNode;

		$cache = new RiakCache( self::BUCKET, $wgRiakSessionNode, false );
		wfDebugLog( "session", __METHOD__ . ": store on session storage with key {$id}\n", true );
		$cache->set( self::key( $id ), $data, self::EXPIRE );
	}

	static public function destroy( $id ) {
		global $wgRiakSessionNode;

		$cache = new RiakCache( self::BUCKET, $wgRiakSessionNode, false );
		$cache->delete( self::key( $id ) );
	}

	static public function gc( $maxlifetime ) {
		return true;
	}
}

if( $wgSessionsInRiak ) {
	session_set_save_handler(
		array( "RiakSessionHandler", "open" ),
		array( "RiakSessionHandler", "close" ),
		array( "RiakSessionHandler", "read" ),
		array( "RiakSessionHandler", "write" ),
		array( "RiakSessionHandler", "destroy" ),
		array( "RiakSessionHandler", "gc" )
	);
}
