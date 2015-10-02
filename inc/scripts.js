/*
whenAll function first found at http://stackoverflow.com/questions/5824615/jquery-when-callback-for-when-all-deferreds-are-no-long-unresolved-either-r
and code then taken from https://gist.github.com/fearphage/4341799
*/
;(function($) {
	var slice = [].slice;

	$.whenAll = function(array) {
		var
		resolveValues = arguments.length == 1 && $.isArray(array) ? array : slice.call(arguments),
			length = resolveValues.length,
			remaining = length,
			deferred = $.Deferred(),
			i = 0,
			failed = 0,
			rejectContexts = Array(length),
			rejectValues = Array(length),
			resolveContexts = Array(length),
			value;

		function updateFunc(index, contexts, values) {
			return function() {
				!(values === resolveValues) && failed++;
				deferred.notifyWith(
					contexts[index] = this, values[index] = slice.call(arguments)
				);
				if (!(--remaining)) {
					deferred[(!failed ? 'resolve' : 'reject') + 'With'](contexts, values);
				}
			};
		}

		for (; i < length; i++) {
			if ((value = resolveValues[i]) && $.isFunction(value.promise)) {
				value.promise()
					.done(updateFunc(i, resolveContexts, resolveValues))
					.fail(updateFunc(i, rejectContexts, rejectValues));
			} else {
				deferred.notifyWith(this, value);
				--remaining;
			}
		}

		if (!remaining) {
			deferred.resolveWith(resolveContexts, resolveValues);
		}

		return deferred.promise();
	};
})(jQuery);

var js_output = $(".js-output");

// If we find a plugin path then this is set to that path
var found_plugin_path = null;

function check_for_plugins_in(site_and_path) {

	// Get all plugins
	var plugins = $(".popular-plugins-list li[data-plugin-slug]");
	var li, plugin_slug;

	// Paths to check
	// relative to found WP installation
	// http://www.simple-fields.com/wordpress/
	// http://www.rollingstones.com/
	// http://demo.roots.io/license.txt » demo.roots.io/plugins/akismet/readme.txt
	var plugin_paths = [
		"wp-content/plugins/",
		"plugins/",
		"wp-content/mu-plugins/",
		"app/plugins/",
		"app/mu-plugins/",
		"content/plugins/",
		"content/mu-plugins/"
	];

	js_output.append("<p><span class='js-plugin-progress progress'></span> Hold on while we look for " + plugins.length + " plugins…");
	var js_plugin_progress = $(".js-plugin-progress");
	var num_plugins_checked = 0;
	var num_plugin_paths_to_check = plugins.length * plugin_paths.length;
	//console.log("num_plugin_paths_to_check", num_plugin_paths_to_check);
	var plugins_found = [];
	var plugins_ajax = [];

	plugins.each(function() {

		li = $(this);
		plugin_slug = li.data("plugin-slug");

		// js_output.append("<p>Checking plugin with slug " + plugin_slug);

		// check each path
		[].forEach.call(plugin_paths, function(one_path) {

			one_plugin_path = site_and_path + one_path + plugin_slug + "/readme.txt";

			(function() {

				var site_and_path = one_plugin_path;
				var this_plugin_slug = plugin_slug;
				var this_one_path = one_path;

				// if found_plugin_path is set then only continue if this path is the same
				/*if (found_plugin_path && found_plugin_path != this_one_path) {
					console.log("skipping check since path found elsewhere");
					return;
				}*/

				var ajax_call = $.ajax({
					url: site_and_path,
					type: "HEAD",
					dataType: "script",
					cache: true
				})
					.done(function(data, textStatus, xhr) {
						//js_output.append("<p class='found'>Looks like I found plugin " + this_plugin_slug + " at <code>" + site_and_path + "</code>");
						//console.log("found response code: ", xhr.status);
						plugins_found.push(this_plugin_slug);
						//console.log("found plugin in path " + this_one_path);
						found_plugin_path = this_one_path;
					})
					.fail(function() {
						//console.log("fail"); 
						//js_output.append("<p>Nope, " + this_plugin_slug + " not found at <code>" + site_and_path + "</code>");
					}).always(function() {
						//console.log("always");
					});

				plugins_ajax.push(ajax_call);

			}());

		}); // foreach path

	}); // plugins each

	$.whenAll(plugins_ajax).then(function() {
		// we don't get here
		// console.log("success all");
	}, function() {
		// console.log("fail all");
		//console.log("plugins_found", plugins_found);
		outputResult();

	}, function() {
		//console.log("progress all");
		var percentDone = ((num_plugins_checked + 1) / num_plugin_paths_to_check) * 100;
		percentDone = Math.round(percentDone);
		js_plugin_progress.html(percentDone + " %");
		num_plugins_checked++;
		
		console.log("checked plugin " + num_plugins_checked + " / " + num_plugin_paths_to_check);
		//if (num_plugins_checked == num_plugin_paths_to_check) {
			// this was the last check
			
		//}

	});

	// output result/found plugins, when all is done
	function outputResult() {

		//console.log("plugins_found", plugins_found);
		if (plugins_found.length) {

			js_output.append("<p><span class='progress'>" + plugins_found.length + " plugins found!</span> It looks like we found some plugins:");
			var plugins_list_html = "<ul class='found-plugins'>";
			[].forEach.call(plugins_found, function(plugin_slug) {

				var plugin_info_li = plugins.filter("[data-plugin-slug=" + plugin_slug + "]");
				if (plugin_info_li.length) {
					plugins_list_html += "<li>";
					plugins_list_html += "<a target='_blank' href='" + plugin_info_li.find("a").attr("href") + "'>" + plugin_info_li.text() + "</a>";
					var plugin_description = plugin_info_li.data("plugin-description");
					if (plugin_description)
						plugins_list_html += "<br>" + plugin_description;
					plugins_list_html += "</li>";
				}

			});
			plugins_list_html += "</ul>";
			js_output.append(plugins_list_html);

		} else {
			// no plugins found, but we should let the user know about that too
			js_output.append("Doh! We couln't find any plugins.");
		}

	}

}


var check_uri_for_wp_installation = function(site_and_path) {

	return $.ajax({
		url: site_and_path,
		cache: true,
		type: "HEAD",
		dataType: "script",
	});
	/*
	.done(function() { 
		//console.log("Found WP site at", site_and_path); 
		console.log("Found wp site at"  + site_and_path);
		gTest.push("Found wp site at " + site_and_path);

		var p = $("<p>").html("Found WordPress site at ");
		p.append(document.createTextNode(site_and_path));
		js_output.append(p);
		// check_for_plugins_in(site_and_path);

	})
	.fail(function() { 
		console.log("Did NOT found wp site at " + site_and_path);
		gTest.push("Did NOT found wp site at" + site_and_path);
		// console.log("fail"); 
		//var p = $("<p>").html("Did not find site at");
		//p.append(document.createTextNode(site_and_path));
		//js_output.append(p);
	});
	*/

};


// Look for querystring and start our stuf if correct key is found
var wpsite = document.location.search.match(/wordpress-site=(.*)/);

if (wpsite && wpsite.length) {

	// site is found in qs, get the correct url and start diggin'

	wpsite = wpsite[1];
	wpsite = unescape(wpsite);
	wpsite = $.trim(wpsite);
	wpsite = wpsite.replace(/\++$/, "");

	// Remove trailing slash
	wpsite = wpsite.replace(/\/+$/, "");

	// Add to input field so it's easy to change
	$("input[name='wordpress-site']").val(wpsite);

	// Make sure it begins with http or https
	if (!wpsite.match("https?://")) {
		wpsite = "http://" + wpsite;
	}

	js_output.append("<p><span class='js-checkSiteProgress progress'></span> Checking if <span class='js-wpsite'></span> is a WordPress site.</p>");
	$(".js-wpsite").html(document.createTextNode(wpsite));

	// Paths to check for WP installation at
	var paths = [
		"/wp-config.php",
		"/wordpress/wp-config.php",
		"/wp/wp-config.php",
		"/license.txt",
		"/wordpress/license.txt",
		"/wp/license.txt"
	];
	var pathCurrentChecking = 0;

	// Check each path for a WP installation
	var ajaxcalls = [];
	var gTest = [];
	[].forEach.call(paths, function(path) {

		var site_and_path = wpsite + path;
		//console.log("checking for wpsite att uri " + site_and_path);
		ajaxcalls.push(check_uri_for_wp_installation(site_and_path));

	});

	$.whenAll(ajaxcalls).then(function() {

		// console.log("whenAll success");
		// sometimes all is success. probablt redirect and things going on
		js_output.append("<p><span class='progress progress-fail'>Doh!</span> Sorry, but we could not determine the location of WordPress at that site.</p>");

	}, function() {

		// whenAll fail
		// We always fail, but maybe one of the calls succeeded
		var found_site = false;
		$.each(ajaxcalls, function() {

			if ($.isArray(this) && this[1] == "success") {
				
				found_site = true;
				this[2].then(function() {
					var site_and_path = this.url.replace("license.txt", "");
					site_and_path = site_and_path.replace("wp-config.php", "");
					js_output.append("<p><span class='progress'>Success!</span> Found installation at " + site_and_path + ".");
					check_for_plugins_in(site_and_path);
				});

				// Only check first found installation
				return false;

			}
		});

		if (!found_site) {
			js_output.append("<p><span class='progress progress-fail'>Doh!!1</span> I could not find any WP site at that location.</p>");
		}

	}, function() {
		var percentDone = ((pathCurrentChecking + 1) / paths.length) * 100;
		percentDone = Math.round(percentDone);
		$(".js-checkSiteProgress").text(percentDone + " %");
		pathCurrentChecking++;
	});

}