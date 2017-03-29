Renderers.trout_streams = {
  pickle: function (al) {
    delete al.legend_url;
    al.leaflet_layer_ids = [];
  },
  update_legend_url: function (active_layer) {
    active_layer.legend_url = CDN(MAP_SERVER_HOST + "/geoserver/wms?request=GetLegendGraphic&LAYER=nyccsc:" + active_layer.layer_default_id +"&format=image/png");
  },
  create_leaflet_layers: function (map, active_layer) {
    if (_.isEmpty(active_layer.leaflet_layer_ids)) {
      var layer = new L.TileLayer.WMS(CDN(MAP_SERVER_HOST + "/geoserver/nyccsc/wms"), {
                    layers: 'nyccsc:trout_streams',
                    format: 'image/png',
                    transparent: true,
                    opacity: 0,
                    zIndex: -1
                  });

      layer.on("tileload", function (loaded) { Views.ControlPanel.fire("tile-layer-loaded", active_layer); });
      layer.on("tileerror", function (err) { Views.ControlPanel.fire("tile-layer-loading-error", active_layer); });
      layer.addTo(map);
      active_layer.leaflet_layer_ids = [layer._leaflet_id];
    }
  },
  get_feature_info_url: function (active_layer) {
    return CDN(MAP_SERVER_HOST + "/geoserver/nyccsc/wms" +
          "?SERVICE=WMS&VERSION=1.1.1&"+
          "REQUEST=GetFeatureInfo&LAYERS=nyccsc:trout_streams&"+
          "QUERY_LAYERS=nyccsc:trout_streams&"+
          "STYLES=&"+
          "BBOX=<%= bbox %>&"+
          "FEATURE_COUNT=5&"+
          "HEIGHT=<%= height %>&"+
          "WIDTH=<%= width %>&"+
          "FORMAT=text%2Fhtml&"+
          "INFO_FORMAT=application%2Fjson&"+
          "SRS=EPSG%3A4326&"+
          "X=<%= x %>&Y=<%= y %>");
  }
};
