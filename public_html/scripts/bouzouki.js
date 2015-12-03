
var center_marker;

//
// Upon successful request with some hits, populate the data in the
// feed with some tweet elements which return sorted
//
function on_location_result(data)
{
    var start_time = +new Date();
    if (!center_marker)
    {
	center_marker = new google.maps.Marker({
	    icon: 'images/arrow.png'
	});
    }
    center_marker.setMap(undefined);
    center_marker.setPosition(map.getCenter());
    center_marker.setMap(map);

    // clear out all the old data
    $('#feed-list').empty();
    for(var i = window.markers.length - 1; i >= 0; --i)
    {
	window.markers[i].setMap(null);
	google.maps.event.clearListeners(window.markers[i]);
    }
    window.markers.length = 0;

    // Iterate over each response and create an element
    for(var i = 0; i < data.hits.length; ++i)
    {
	// Keep some code clean
	create_tweet_element(data.hits[i], i);
    }
    
    var end_time = +new Date();
    // Update the footer text
    $('#footer').empty();
    $('#footer').append('Took ' + data['_took'] + 'ms for the request and ' +
			(end_time - start_time) + 'ms creating ' + data.hits.length + ' nodes');

    // Push the feed window to the top
    $('#feed').scrollTop(0);
}


// For lack of a config file
// Alternate colors
var BACKGROUND_CHOICES = ['bg-light', 'bg-dark'];
var TWITTER_ACCOUNT_URL = 'https://twitter.com/';

//
// Buils a DOM element using the data contained in a hit.
//
function create_tweet_element(curr_hit, index)
{

    // Should use Google's map url, but it's safer to load from our own host
    //var icon_root = 'http://maps.google.com/mapfiles/kml/paddle/';
    var icon_root = 'images/icon';
    // Prevent too many large pins from being displayed
    var icon_id = ((index <= 25) ? String.fromCharCode(65 + index) : '_none');
    var icon_image_url = icon_root + icon_id +'.png';

    // Construct the DOM element for a tweet
    var li = $('<li>', {class:  'li-tweet ' + BACKGROUND_CHOICES[index % 2],
			id: 'tweet_' + index}).appendTo('#feed-list');
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
    // These should be pooled instead of new'd
    var geo_location = decodeGeoHash(curr_hit.geo);
    var marker_pos = new google.maps.LatLng(geo_location.latitude[0], geo_location.longitude[0]);
    var new_marker = new google.maps.Marker({
	position: marker_pos,
	title: '' + index,
	icon: icon_image_url,
    });
    new_marker.setMap(map);
    // Make it so the tweets scroll to themselves in the feed when clicked on the map
    new_marker.addListener('click', function(event){
	// If we're not highlighted already, show this in the feed
	var curr_pos = $('#tweet_' + index).position().top;
	if (curr_pos != 0)
	{
	    // Iterate through every tweet
	    var total_pos = 0;
	    for(var i = 0; i < index; ++i)
	    {
		total_pos += $('#tweet_'+i).height();
	    };
	    $('#feed').scrollTop(total_pos);
	}
    });
    window.markers.push(new_marker);
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
    // Stringify the active tags to make life easier
    var hashtag_string = (window.active_tags) ? window.active_tags.toString() : '';
    var params = $.param({'lat':lat, 'lon': lon, 'precision': precision, 'hashtags': hashtag_string});
    // Firefox Fix
    var url = ((window.location.origin) ? window.location.origin : '') + '/api/tweet_feed?' + params;
    $.get(url, callback);
}

//
// When the form is submitted, make a request
//
function on_lat_lon_form_submit()
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
// When a hashtag is inserted and submitted, it will live in the query as long
// as it is not cleared
//
function on_hashtag_form_submit(){
    var tags_to_search = $('#hashtags').val()
	.split(/[\s,]/)
	.map(trim)
	.filter(is_hashtag);

    window.active_tags = tags_to_search;
    on_map_drag_end();
}

//
// Helper for map function - call on string
//
function trim(val){
    return val.trim();
}

//
// Helper for filter function - detects if it is a hashtag
//
function is_hashtag(val){
    return val.length > 0 && val.startsWith('#');
}

//
// Reset the hashtag form, removing it from future searches
//
function on_hashtag_form_reset()
{
    window.active_tags = [];
    $('#hashtags').val('');
    on_map_drag_end();
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