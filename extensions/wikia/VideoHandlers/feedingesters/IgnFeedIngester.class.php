<?php

class IgnFeedIngester extends VideoFeedIngester {
	protected static $API_WRAPPER = 'IgnApiWrapper';
	protected static $PROVIDER = 'ign';
	protected static $FEED_URL = 'http://apis.ign.com/partners/wikia/video/v3/videos?fromDate=$1&toDate=$2';
	protected static $CLIP_TYPE_BLACKLIST = array();

	public function downloadFeed($startDate, $endDate) {

		wfProfileIn( __METHOD__ );
		$url = $this->initFeedUrl($startDate, $endDate);

		print("Connecting to $url...\n");

		$content = $this->getUrlContent($url);

		if (!$content) {
			print("ERROR: problem downloading content!\n");
			wfProfileOut( __METHOD__ );
			return 0;
		}

		wfProfileOut( __METHOD__ );
		return $content;
	}

	protected function getUrlContent($url) {
		$options = array(
			'timeout'=>'default'
		);
		echo("Creating request\n");
		$req = HttpRequest::factory( $url, $options );
		$req->setHeader('X-App-Id','94bd2de3');
		$req->setHeader('X-App-Key','f3c3c1ccc56991a1aefe42262188f620');
		echo("Executing\n");
		$status = $req->execute();
		if ( $status->isOK() ) {
			echo("Got content\n");
			$ret = $req->getContent();
		} else {
			$errMsg = "Requested URL was: " . $req->getFinalUrl();
			$errMsg .= " (err: " . json_encode($req->status->errors) . ')';
			Wikia::log(__METHOD__, 'error', $errMsg);
			echo("No content\n".$errMsg);
			$ret = false;
		}
		return $ret;
	}

	private function initFeedUrl($startDate, $endDate) {
		$url = str_replace('$1', $startDate, static::$FEED_URL);
		$url = str_replace('$2', $endDate, $url);
		return $url;
	}

	public function import($content='', $params=array()) {

		wfProfileIn( __METHOD__ );

		$debug = !empty($params['debug']);
		$addlCategories = !empty($params['addlCategories']) ? $params['addlCategories'] : array();

		$articlesCreated = 0;

		$content = json_decode($content, true);

		$i = 0;
		foreach($content as $video) {
			$i++;

			$clipData = array();

			$clipData['titleName'] = $video['metadata']['name'];
			$clipData['publishDate'] = $video['metadata']['publishDate'];
			$clipData['videoId'] = $video['videoId'];
			$clipData['description'] = $video['metadata']['description'];
			$clipData['duration'] =  $video['metadata']['duration'];
			$clipData['thumbnail'] =  $video['metadata']['thumbnail'];
			$clipData['videoUrl'] =  $video['metadata']['url'];
			$clipData['classification'] = $video['metadata']['classification'];
			if( isset($video['metadata']['ageGate']) ) {
				$clipData['ageGate'] = $video['metadata']['ageGate'];
			} else {
				$clipData['ageGate'] = 0;
			}
			$clipData['highDefinition'] = $video['metadata']['highDefinition'];

			$keywords = array();
			foreach( $video['objectRelations'] as $obj ) {
				$keywords[$obj['objectName']] = true;
			}
			$keywords = array_keys( $keywords );
			$clipData['keywords'] = implode(", ", $keywords );


			$createParams = array('addlCategories'=>$addlCategories, 'debug'=>$debug);
			$articlesCreated += $this->createVideo($clipData, $msg, $createParams);


		}

		wfProfileOut( __METHOD__ );
		return 0;
	}

	protected function generateName(array $data) {

		wfProfileIn( __METHOD__ );
		$name = $data['titleName'];

		wfProfileOut( __METHOD__ );
		return $name;
	}

	public function generateTitleName(array $data) {
		$name = $data['titleName'];

		return $name;
	}

	public function generateCategories(array $data, $addlCategories) {

		wfProfileIn( __METHOD__ );

		$categories = !empty($addlCategories) ? $addlCategories : array();
		$categories[] = 'IGN';
		$categories[] = 'Games';

		wfProfileOut( __METHOD__ );

		return $categories;
	}

	protected function generateMetadata(array $data, &$errorMsg) {
		//error checking
		if (empty($data['videoId'])) {
			$errorMsg = 'no video id exists';
			return 0;
		}

		$metadata =
			array(
				'videoId'		=> $data['videoId'],
				'hd'			=> $data['highDefinition'],
				'duration'		=> $data['duration'],
				'published'		=> strtotime($data['publishDate']),
				'ageGate'		=> $data['ageGate'],
				'thumbnail'		=> $data['thumbnail'],
				'videoUrl'		=> $data['videoUrl'],
				'category'		=> $data['classification'],
				'description'	=> $data['description'],
				'keywords'		=> $data['keywords'],
			);
		return $metadata;
	}
}