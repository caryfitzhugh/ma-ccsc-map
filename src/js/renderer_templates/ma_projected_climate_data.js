const findDataForMAProjectedData = (layer_data, area, season, year) => {
  let data_value = {};
  _.each(layer_data.features, (feature) => {
    if (feature.properties.name === area) {
      _.each(feature.properties.data, (data) => {
        if (data.season === season) {
          data_value = _.find(data.values, (value) => {
            return value.year === year;
          });
          if (data_value) {
            data_value = {
              value: data_value,
              season: season,
              year: year,
              area: area,
              season_data: data,
              area_data: feature
            }
          }
        }
      });
    }
  })
  return data_value;
};

RendererTemplates.ma_projected_climate_data = function (layer_id, opts) {
  RendererTemplates.ma_climate_data(layer_id, {
   
    clone_layer_name: function(active_layer) {
       console.log(layer_id,opts)
       let p = active_layer.parameters.options;
      var name =  opts.title + " Y:" + active_layer.parameters.years[p.year_indx] + "s S:" + p.season + " by " + p.summary;
      return name;
    },
    info_template: `
        <div class='col-xs-2'>
          <label> {{name}}</label>
        </div>
        <div class='col-xs-10'>
          <table class='table'>
            <thead>
              <tr>
                <th style='text-align: center;'
                    colspan='{{u.object_entries_count(active_layer.parameters.all_seasons) + 2}}'> {{geojson.name}} {{geojson.geomtype}}
    </th>
              </tr>
              <tr class='smaller-header'>
                <th> </th>
                <th> ` + opts.title + ` (` + opts.legend_units + `) </th>
                <th class='deltas' style='text-align: center;'
                    colspan='{{u.object_entries_count(active_layer.parameters.all_seasons)}}'>
                      ` + opts.legend + ` </th>
              </tr>
              <tr>
                <th> Season </th>
                <th> Baseline (1970-2000)</th>
                {{#active_layer.parameters.years}}
                  <th> {{.}}s</th>
                {{/active_layer.parameters.years}}
              </tr>
            </thead>
            <tbody>
              {{#u.sort_by(geojson.location_data.area_data.properties.data, 'season')}}
                <tr class="{{(season === geojson.location_data.season ? 'active-season' : '')}}">
                  <td>{{u.capitalize(season)}}</td>
                  <td>{{baseline}}</td>
                  {{#u.sort_by(values, 'year')}}
                    <td decorator="tooltip: Likely Range: {{range}}" class='{{(year === geojson.location_data.year ? 'active-year' : '')}}'>{{delta}}</td>
                  {{/sort_by(values, 'year')}}
                </tr>
              {{/u.sort_by(geojson.location_data.area_data.properties.data, 'season')}}
            </tbody>
          </table>
    `,
    legend_template: `
      <div class='detail-block show-confidence'>
        <label decorator='tooltip:Choose a Summary Area'> Summary: </label>
        <select value='{{parameters.options.summary}}'>
          {{#u.to_sorted_values_from_hash(parameters.all_summaries)}}
            <option value='{{key}}'>{{{value}}}</option>
          {{/u.to_sorted_values_from_hash(parameters.all_summaries)}}
        </select>
      </div>
      <div class='detail-block opacity'>
        <label  decorator='tooltip:Use slider to adjust Decade'> Decade: </label>
        <input type="range" value="{{parameters.options.year_indx}}"
          min="0"
          max="{{parameters.years.length-1}}">
        {{parameters.years[parameters.options.year_indx]}}s
      </div>
      <div class='detail-block show-confidence'>
        <label decorator='tooltip:Choose a Season'> Season: </label>
        <select value='{{parameters.options.season}}'>
          {{#u.to_sorted_values_from_hash(parameters.all_seasons)}}
            <option value='{{key}}'>{{value}}</option>
          {{/u.to_sorted_values_from_hash(parameters.all_seasons)}}
        </select>
      </div>

      {{#{metrics: parameters.metrics_ranges[parameters.options.season],
          legend: '` + opts.legend + `',
          quantiled: true,
          reversed: true,
          precision: '` + opts.legend_precision + `',
          colors: parameters.color_range} }}
        {{> map_color_block_legend_template }}
      {{/{metrics: parameters.metrics_ranges[parameters.options.season]}}
    `,
    data_url: opts.data_url,
    onLoadedData: (layer_data, active_layer) => {
      // Only do this ONCE.
      if (_.isEmpty(active_layer.parameters.metrics_ranges)) {
        let years = _.uniq(_.flatten(_.map(layer_data.features, (feature) => {
          return _.flatten(_.map(feature.properties.data, (data) => {
              return _.flatten(_.map(data.values, (value) => {
                return value.year;
              }));
          }));
        }))).sort();

        active_layer.parameters.years = years;

        // Calculate the color brewer bands.
        // Get min / max values for all these metrics across all the years / seasons / etc.
        let data_values = {};
        _.each(layer_data.features, (feature) => {
          _.each(feature.properties.data, (data) => {
            data_values[data.season] = data_values[data.season] || [];
            _.each(data.values, (value) => {
              data_values[data.season].push(value.delta);
            });
          });
        });

        _.each(active_layer.parameters.all_seasons, (name, season) => {
          active_layer.parameters.metrics_ranges[season] =
            d3.scaleQuantile().domain(data_values[season]).range(active_layer.parameters.color_range).quantiles();
        });
      }
    },
    onEachGeometry: (layer_data, active_layer, feature, layer) => {
      let p = active_layer.parameters.options;
      //let ma_trans = RendererTemplates.ma_climate_data_translation;
      let colorize = RendererTemplates.ma_climate_data_colorize;

      try {
        let location_data = findDataForMAProjectedData(layer_data,
                                               feature.properties.name,
                                               p.season,
                                               active_layer.parameters.years[p.year_indx]
                                              );
        feature.properties.location_data = location_data;

        let color = colorize(active_layer.parameters.metrics_ranges[p.season],
                             location_data.value.delta,
                             active_layer.parameters.color_range);

        layer.setStyle({fillColor: color, color: color});
      } catch( e) {
        feature.properties.location_data = null;

        console.log('failed to find value for ', p.metric,
                    "Feature Name:", feature.properties.name,
                    feature.properties.name,
                    "Available Names:", Object.keys(layer_data));
        let rgb = `transparent`;
        layer.setStyle({fillColor: rgb, color: rgb});
      }
    },

    parameters: {
      opacity: 100,
      color_range: opts.color_range,
      metrics_ranges: {},
      all_summaries: {
        "county": "County",
        "state": "State",
        "basin": "Drainage Basin",
        //"watershed": "HUC8 Watershed",
        //"6km": "6km Bounding Box",
      },
      all_seasons: {
        "annual": "Annual",
        "fall": "Fall",
        "winter": "Winter",
        "spring": "Spring",
        "summer": "Summer",
      },
      years: [],
      options: {
        year_indx: 0,
        season: 'annual',
        summary: 'county',
      },
    }
  });
};
