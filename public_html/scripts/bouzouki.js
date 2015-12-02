//
// Upon successful request with some hits, populate the data in the
// feed with some tweet elements which return sorted
//
function on_location_result(data)
{
    // Alternate colors
    var bg_choices = ['bg-light', 'bg-dark'];
    $('#feed-list').empty();
    for(var i = 0; i < data.hits.length; ++i)
    {
	$('#feed-list').append('<li class="li-tweet ' + bg_choices[i % 2] + '">' +
			       '<img src="' + data.hits[i].author.avatar_url+'"></img>' +
			       '<span class="span-tweet"><p class="p-tweet">' + data.hits[i].author.name + '</p>' +
			       '<p>' + data.hits[i].text + '</p>' +
			       '</span>' +
			       '</li>');
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

// Load data for the main feed
$.get(window.location.origin + '/api/tweet_feed', on_main_feed)
