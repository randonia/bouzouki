
var center_marker;

//
// Upon successful request with some hits, populate the data in the
// feed with some tweet elements which return sorted
//
function on_location_result(data)
{
    if (!center_marker)
    {
	center_marker = new google.maps.Marker({
	    icon: 'images/arrow.png'
	});
    }
    center_marker.setMap(undefined);
    center_marker.setPosition(map.getCenter());
    center_marker.setMap(map);

    // Alternate colors
    var bg_choices = ['bg-light', 'bg-dark'];

    var TWITTER_ACCOUNT_URL = 'https://twitter.com/';
    // clear out all the old data
    $('#feed-list').empty();
    for(var i = window.markers.length - 1; i >= 0; --i)
    {
	window.markers[i].setMap(null);
    }
    for(var i = 0; i < data.hits.length; ++i)
    {
	// Keep some code clean
	var curr_hit = data.hits[i];
	// Should use Google's map url, but it's safer to load from our own host
	//var icon_root = 'http://maps.google.com/mapfiles/kml/paddle/';
	var icon_root = 'images/icon';
	// Prevent too many large pins from being displayed
	var icon_id = ((i <= 25) ? String.fromCharCode(65 + i) : '_none');
	var icon_image_url = icon_root + icon_id +'.png';

	// Construct the DOM element for a tweet
	var li = $('<li>', {class:  'li-tweet ' + bg_choices[i % 2]}).appendTo('#feed-list');
	li.append($('<img>', {src: icon_image_url}));
	li.append($('<img>', {src: curr_hit.author.avatar_url}));
	var span = $('<span>', {class: 'span-tweet'}).appendTo(li);
	var author_name = $('<p>').appendTo(span);
	author_name.attr('class', 'p-tweet-name');
	var author_link = $('<a>' + curr_hit.author.name + '</a>').appendTo(author_name);
	author_link.attr('href', TWITTER_ACCOUNT_URL + curr_hit.author.handle);
	author_link.attr('target', '_blank');
	author_link.attr('class', 'a-username');
	var tweet_text = $('<p>' + curr_hit.text + '</p>').appendTo(span);
	var tweet_date_text = new Date(parseFloat(curr_hit.date)).toDateString();
	var tweet_link_container = $('<p>', {class: 'p-tweet-link-container'}).appendTo(span);
	var tweet_link = $('<a>' + tweet_date_text + '</a>').appendTo(tweet_link_container);
	tweet_link.attr('class', 'a-tweet');
	tweet_link.attr('href', TWITTER_ACCOUNT_URL + curr_hit.author.handle + '/status/' + curr_hit.id);
	tweet_link.attr('target', '_blank');
	// Make a marker
	var geo_location = decodeGeoHash(curr_hit.geo);
	var marker_pos = new google.maps.LatLng(geo_location.latitude[0], geo_location.longitude[0]);
	var new_marker = new google.maps.Marker({
	    position: marker_pos,
	    title: i,
	    icon: icon_image_url
	});
	new_marker.setMap(map);
	window.markers.push(new_marker);

	// Update the footer text
	$('#footer').empty();
	$('#footer').append('Took ' + data['_took'] + 'ms');
    }
}

//
// Fetch location-specific tweets, given a pair of lat/lon coordinates and a zoom level.
// The zoom level is in relation to the Google Maps
//
function get_location_tweets(lat, lon, callback)
{
    var bounds = map.getBounds();
    var precision = undefined;
    if (bounds)
    {	
	// Get estimated precision of the current boundaries of the map
	var top_right = bounds.getNorthEast();
	var bottom_left = bounds.getSouthWest();
	// Calculate the "monitor distance" to get a rough estimate of how precise we should be
	var window_height = top_right.lat() - bottom_left.lat();
	var window_width = top_right.lng() - bottom_left.lng();
	var precision_value = window_width * 0.5;
	// Wyoming is 360 miles wide and 280 miles tall. Wyoming roughly fills the screen at
	// precision level 4.6. Therefore, at 1.0 precision level we are covering roughly:
	//  78miles wide x 60miles tall, or 124.8km x 96km
	// End result is multiplying our precision value by 120km to get a rough radius
	precision = precision_value * 120;
    }
    // Default to 30km
    precision = Math.round((precision) ? precision : 30);
    var params = $.param({'lat':lat, 'lon': lon, 'precision': precision});
    var url = window.location.origin + '/api/tweet_feed?' + params;
    $.get(url, callback);
}

//
// When the form is submitted, make a request
//
function on_form_submit()
{
    var lat = $('#latitude').val();
    var lon = $('#longitude').val();
    var center_point = validate_coordinates(lat, lon);
    if (center_point)
    {
	map_move_to_point(center_point);
    }
}

//
// Some basic validation on latitude/longitude
//
function validate_coordinates(lat, lon)
{
    lat = parseFloat(lat);
    lon = parseFloat(lon);
    // If we're passed in garbage, do nothing
    if (isNaN(lat) || isNaN(lon))
    {
	return undefined;
    }
    return {'lat': lat, 'lng': lon};
}

//
// Move the map to the point and update any tweets
//
function map_move_to_point(point)
{
    map.setCenter(point);
    on_map_drag_end();
}