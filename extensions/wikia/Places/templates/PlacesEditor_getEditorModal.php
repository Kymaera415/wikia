<div id="PlacesEditorWrapper">
	<div id="PlacesEditorColumn">
		<form>
			<input type="hidden" id="GoogleMapsKey" value="<?= $wg->GoogleMapsKey ?>">
			<label>
				<?= wfMsg('places-toolbar-button-address') ?>
				<input type="text" id="PlacesEditorAddress" autofocus>
				<input type="submit" value="<?= wfMsg('places-editor-search') ?>">
			</label>
			<ul></ul>
		</form>

		<button id="PlacesEditorMyLocation"><?= wfMsg('places-editor-show-my-location') ?></button>

		<label> 
			<?= wfMsg('places-editor-geoposition') ?>
			<input id="PlacesEditorGeoPosition" type="text" readonly>
		</label>
	</div>

	<div id="PlacesEditorMap"></div>
</div>