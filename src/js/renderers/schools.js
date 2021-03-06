RendererTemplates.geojson_points("schools", {
  parameters: {
    opacity: false,
    options: {
     
    }
  },
  url: CDN(GEOSERVER + "/ma/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=ma:schools&maxFeatures=500&outputFormat=application%2Fjson"),

  pointToLayer: function (active_layer, feature, latlng) {
    var icon_url;
    icon_url = './img/school.png'
    return L.marker(latlng, {
        icon: L.icon({
            iconUrl: icon_url,
            iconSize: [21, 24],
            iconAnchor: [11, 24],
            popupAnchor: [0, -22]
        }),
        title: feature.properties.name
    });
  },

  popupContents: function (feature) {
    var index = feature.properties.reason_cls

    return "<strong>Name: " + feature.properties.name + "</strong></br>" +
           "Address: " + feature.properties.address + ", " + feature.properties.town_mail + "<br/>"+
           "School Type: " + feature.properties.type_desc +  "<br/>"+
          "</br>"+
           Renderers.utils.zoom_to_location_link( feature.geometry );
  },
  legend_template: `
      <div class='detail-block show-confidence' style='float: left; clear: both;'>     
          <div style='width: 50%; float: left;'>
            <img src={{'./img/school.png'}}>
            <strong>{{value}}</strong>
          </div>
      </div>
  `,
});
