//
// Upon successful request with some hits, populate the data in the
// feed with some tweet elements which return sorted
//
function on_location_result(data)
{
    // Alternate colors
    var bg_choices = ['bg-light', 'bg-dark'];

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
	$('#feed-list').append('<li class="li-tweet ' + bg_choices[i % 2] + '">' +
			       '<img src="' + curr_hit.author.avatar_url+'"></img>' +
			       '<span class="span-tweet"><p class="p-tweet">' + curr_hit.author.name + '</p>' +
			       '<p>' + curr_hit.text + '</p>' +
			       '</span>' +
			       '</li>');

	// Make a marker
	var geo_location = decodeGeoHash(curr_hit.geo);
	var marker_pos = new google.maps.LatLng(geo_location.latitude[0], geo_location.longitude[0]);
	var new_marker = new google.maps.Marker({
	    position: marker_pos,
	    title: i
	});
	new_marker.setMap(map);
	window.markers.push(new_marker);
    }
}

//
// Fetch location-specific tweets, given a pair of lat/lon coordinates and a zoom level.
// The zoom level is in relation to the Google Maps
//
function get_location_tweets(lat, lon, zoom, callback)
{
    var params = $.param({'lat':lat, 'lon': lon, 'zoom': zoom});
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