define([
    'jquery', 'underscore', 'd3', 
    'leaflet.pip', 'app/template', 
    'mapbox', 'jquery.querystring', 'app/base'
], function($, _, d3, leafletPip, tmpl) {

    L.mapbox.accessToken = 'pk.eyJ1IjoiYnJlbnN1ZG9sIiwiYSI6IjQxNDg2MjEwOTQ0OGU4ODc2YjIwYjZjMzVhMDlmN2JkIn0.ktzNWKCPYB20Kb1py_T5HA';
    var map = L.mapbox.map('map', 'mapbox.light').setView([38.903, -77.013], 11);


    var url_params = $.querystring(window.location.search),
        query = url_params.q,
        color = d3.scale.category20(),
        hoods, hoods_layer = {};


    d3.json("/static/data/wash-dc.json", function(error, dc) {
        hoods = L.geoJson(dc, {
            style: getStyle,
            onEachFeature: onEachFeature
        }).addTo(map);

        addTweets();
    });


    function getStyle(feature) {
        var stylez = {
            weight: 1,
            opacity: 1,
            color: "#999",
            dashArray: '3',
            fillColor: color(feature.properties.id),
            fillOpacity: 0.4
        };
        return stylez;
    }


    function onEachFeature(feature, layer) {
        hoods_layer[feature.properties.id] = {
            layer: layer,
            name: feature.properties.subhood,
            tweet_ct: 0,
            tweets: []
        };

        layer.on({
            mouseover: highlightFeature,
            mouseout: resetHighlight,
            click: zoomToFeature
        });
    }


    function highlightFeature(e) {
        var layer = e.target,
            hood_name = layer.feature.properties.subhood;

        layer.setStyle({
            weight: 3,
            color: '#333',
            dashArray: null,
        });

        $('#hood-tt').html('<div class="inner">' + hood_name + '</div>');
    }


    function resetHighlight(e) {
        hoods.resetStyle(e.target);
        $('#hood-tt').empty();
    }


    function zoomToFeature(e) {
        map.fitBounds(e.target.getBounds());
    }


    function addTweets() {
        if (!query) return;

        d3.json("/tw?q=" + query, function(error, data) {
            if (error) return;

            var tweets = data.tweets || [];

            var ct = 0, 
                non_matches = 0;

            tweets.forEach(function(t) {
                var lat = t.coordinates[0],
                    lng = t.coordinates[1];

                L.circleMarker([lat, lng], {
                    radius: 7,
                    stroke: false,
                    fillColor: '#000',
                    fillOpacity: 0.5,
                    className: 'tweet-marker'
                }).bindPopup(t.txt).addTo(map);

                var matches = leafletPip.pointInLayer([lng, lat], hoods);

                if (matches.length) {
                    ct += 1;
                    var match = matches[0].feature.properties;
                    hoods_layer[match.id].tweet_ct += 1;
                    hoods_layer[match.id].tweets.push(t);
                } else {
                    non_matches += 1;
                }
            });

            var results = d3.entries(hoods_layer);
            results = _.filter(results, function(d) { return d.value.tweet_ct > 0; });
            results = _.sortBy(results, function(d) { return -d.value.tweet_ct; });

            var shell = $('#tw-tmpl').html(),
                html = tmpl(shell, {
                    ct: ct,
                    results: results
                });

            $('#tw-details').append(html);
        });
    }


    function goTo(el, ms_delay, ms_duration) {
        var $el = $(el).first();
        var isIE = /*@cc_on!@*/false || !!document.documentMode;
        var newPosition = parseInt($el.offset().top);

        document.documentElement.scrollTop = newPosition;

        if(isIE) {
            setTimeout(function() {
                document.documentElement.scrollTop = newPosition;
            }, ms_duration);
        } else {
            $('body,html').delay(ms_delay).animate({
                scrollTop: newPosition
            }, ms_duration);            
        }
    }


    $("body").on('click', '.hood-entry', function(e) {
        e.preventDefault();

        var hood_id = $(this).data('id'),
            hood = hoods_layer[hood_id];

        map.fitBounds(hood.layer.getBounds());
        goTo('form', 0, 0);
    });


    $("body").on('click', '.reset', function(e) {
        map.setView([38.903, -77.013], 11);
    });

});