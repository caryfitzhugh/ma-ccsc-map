RendererTemplates.wms("flood_zones", {
  parameters: {
    opacity: 70,
    min_zoom: 11,
    max_zoom: 20,
    options: {

    }
  },
  clone_layer_name: function(active_layer) {
    return active_layer.name;
  },
  url: CDN("http://giswebservices.massgis.state.ma.us/geoserver/wms"),
  wms_opts:(active_layer) => {
    //var year = active_layer.parameters.year;
    return  {
      layers: 'massgis:GISDATA.FEMA_NFHL_POLY',
      format: "image/png",
      opacity: 0,
      zIndex: -1,
      transparent: true,
    };
  },
  get_feature_info_url: function (active_layer) {
    //var year = active_layer.parameters.year;
    return CDN("http://giswebservices.massgis.state.ma.us/geoserver/wms") +
          "?SERVICE=WMS&VERSION=1.1.1&"+
          "REQUEST=GetFeatureInfo&LAYERS=massgis:GISDATA.FEMA_NFHL_POLY&"+
          "QUERY_LAYERS=massgis:GISDATA.FEMA_NFHL_POLY&"+
          "PROPERTYNAME=DFIRM_ID,LABEL,FLD_AR_ID&"+
          "STYLES=&"+
          "BBOX=<%= bbox %>&"+
          "FEATURE_COUNT=5&"+
          "HEIGHT=<%= height %>&"+
          "WIDTH=<%= width %>&"+
          "FORMAT=text%2Fhtml&"+
          "INFO_FORMAT=application%2Fjson&"+
          "SRS=EPSG:4326&"+
          "X=<%= x %>&Y=<%= y %>";
  },
  legend_template: `
      <div class='detail-block show-confidence'>
        <label> Legend: </label>
        <img src='{{CDN("http://giswebservices.massgis.state.ma.us/geoserver/wms?request=GetLegendGraphic&LAYER=massgis:GISDATA.FEMA_NFHL_POLY&format=image/png")}}'/>
      </div>
  `,
  info_template: `
      <div class='col-xs-2'>
        <label> {{name}} </label>
      </div>
      <div class='col-xs-10'><table class='table'>
            <thead>
              <tr>
                <th> DFIRM_ID </th>
                <th> FLD_AR_ID </th>
                <th> Zone Info</th>
              </tr>
            </thead>
             <tbody>
                {{#json.features}}
                  <tr>
                    <td>{{properties.DFIRM_ID}}</td>
                    <td>{{properties.FLD_AR_ID}}</td>
                    <td>{{properties.LABEL}}</td>
                  </tr>
                {{ else }}
                  Unknown / No Response
                {{/json.features}}
              </tbody>
          </table>      
      </div>
  `
});
