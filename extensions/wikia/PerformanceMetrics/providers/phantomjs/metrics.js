/*global phantom:true, console:true, require:true */

/**
 * Generates performance metrics using head-less WebKit-based browser
 *
 * phantomjs required - http://code.google.com/p/phantomjs/wiki/BuildInstructions
 */
var page = require('webpage').create(),
	system = require('system'),
	address;

if (system.args.length === 1) {
	console.log('Usage: metrics.js <URL>');
	phantom.exit();
}

// calculate DOM complexity
function getDomComplexity(page) {
	var metrics = page.evaluate(function() {
		// run this in the "scope" of the browser
		function processNode(node, metrics, depth) {
			var childNodes = node.childNodes;

			// we're going deeper and deeper
			depth = depth || 0;
			depth++;

			// count the current node
			metrics.elements++;
			metrics.nodes++;
			metrics.depthStack.push(depth);

			// recursively process child nodes
			if (childNodes && childNodes.length) {
				for (var i = 0, len = childNodes.length; i < len; i++) {
					switch(childNodes[i].nodeType) {
						case Node.ELEMENT_NODE:
							processNode(childNodes[i], metrics, depth);
							break;

						case Node.TEXT_NODE:
						case Node.COMMENT_NODE:
							metrics.nodes++;
							break;
					}
				}
			}
		};

		var metrics = {
			elements: 0,
			nodes: 0,
			depthStack: [] // tmp
		},
		node = document.getElementsByTagName('html')[0];

		processNode(node, metrics);

		return metrics;
	});

	// process depth calculation
	metrics.depthStack = metrics.depthStack.sort(function(a, b) {return a - b});

	var sum = 0, len = metrics.depthStack.length, pos = parseInt(len / 2);
	metrics.depthStack.forEach(function(val) {sum += val});

	metrics.avgElementsDepth = (sum / len).toFixed(2);
	metrics.medElementsDepth = (pos % 2 == 1) ? metrics.depthStack[pos] : ((metrics.depthStack[pos] + metrics.depthStack[pos-1]) / 2);

	delete metrics.depthStack;
	return metrics;
};

// log total page load time
page.onLoadStarted = function () {
    page.startTime = new Date();
};

// count requests made
page.requests = 0;
page.onResourceRequested = function(res) {
	page.requests++;
};

// load the emit and print out the metrics
address = system.args[1];

page.open(address, function(status) {
	switch(status) {
		case 'success':
			var url = page.evaluate(function() {
				return document.location.toString();
			}),
			metrics = {
				loadTime: new Date() - page.startTime,
				requests: page.requests
			};

			// evaluate DOM complexity
			var domMetrics = getDomComplexity(page);
			for (var key in domMetrics) {
				metrics[key] = domMetrics[key];
			}

			// other metrics
			metrics.cookiesRaw = page.evaluate(function () {
				return document.cookie.length;
			});

			metrics.localStorage = page.evaluate(function () {
				return window.localStorage.length;
			});

			// emit the results
			var report = {
				url: url,
				metrics: metrics
			};

			console.log(JSON.stringify(report));
			break;

		default:
			console.log(false);
	}

	// otherwise phantomjs will never terminate
	phantom.exit();
});