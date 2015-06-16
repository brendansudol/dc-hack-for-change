;(function() {
  requirejs.config({
    baseUrl: '/static/js',
    waitSeconds: 20,

    paths: {
      requireLib: 'lib/require',

      jquery: 'lib/jquery.min',
      'jquery.querystring': 'lib/jquery.querystring',

      underscore: 'lib/underscore-min',
      bootstrap: 'lib/bootstrap.min',

      d3: 'lib/d3.v3.min',
      topojson: 'lib/topojson.v1.min',
      queue: 'lib/queue.min',

      leaflet: 'lib/leaflet',
      'leaflet.pip': 'lib/leaflet-pip',

      mapbox: 'lib/mapbox'
    },

    shim: {
      bootstrap: {
        deps: ['jquery'],
        exports: '$.fn.popover'
      },
      'leaflet.pip': { deps: ['leaflet'] },
      'mapbox': { deps: ['leaflet'] }
    }

  });
})();
