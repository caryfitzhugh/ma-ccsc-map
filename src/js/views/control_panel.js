/*global L , Views, Ractive, console, _, Controllers.Layers */
var LeafletMap = L.map("map", {zoomControl: false});

var z_indexes = {
  base: 0,
  layers: 1000
};

// Add default scale control to LeafletMap
L.control.scale().addTo(LeafletMap);

Views.ControlPanel = new Ractive({
  template: "#control_panel_template",
  el:  "control_panel_root",
  data: {
    u: ViewUtils,
    sharing_url: function (token) {
      return Controllers.Sharing.sharing_url(token);
    },
    all_active_hidden: function (active_layers) {
      return true === _.uniq(_.pluck(active_layers, "is_hidden"))[0];
    },
    layer_load_state_error_count: function (layers_loading_states, layer_default_id) {
      var errors = layers_loading_states[layer_default_id] ? layers_loading_states[layer_default_id].errors : 0;
      return ""+ errors + " Errors";
    },
    fixed_precision: function (v, precision) {
      if (v) {
        return v.toFixed(precision);
      } else {
        return v;
      }
    },
    fields_from_sovi_response: function (xml) {
      var output = [];
      _.each( $(xml).find("FIELDS"), function (field) {
        var fields = {};
        _.each(field.attributes, function (attr) {
          fields[attr.nodeName] = attr.nodeValue;
        });
        output.push(fields);
      });
      return output;
    },
    has_feature_info_responses: function (responses) {
      var has = false;
      if (responses.length > 0) {
        if (_.filter(responses, function (resp) {
              return (resp.json && resp.json.features && resp.json.features.length > 0 ) ||
                      ///  This second one is for GEOJSON responses
                     ( resp.json && resp.json.geojson)  ||
                     ( resp.xml ) ||
                     ( resp.json.results && resp.json.results.length > 0) ;
            } ).length > 0) {
              has = true
            }
      }
      return has;
    },
    layer_load_state: function (layers_loading_states, layer_default_id) {
      var state = "";
      var errors = layers_loading_states[layer_default_id] ? layers_loading_states[layer_default_id].errors : 0;
      var loaded = layers_loading_states[layer_default_id] ? layers_loading_states[layer_default_id].loaded : 0;

      // Only errors - it is down
      if (errors > 0 && loaded === 0) {
          state = "danger";
      } else if (errors > 0 && loaded > 0) {
          state = "warning";
      } else if (errors === 0 && loaded > 0) {
        state = "success"
      }

      return state;
    },
    all_active_collapsed: function (active_layers) {
      return true === _.uniq(_.pluck(active_layers, "is_collapsed"))[0];
    },
    able_to_copy: function (active_layer ) {
      var result =
        active_layer && // Active layer?
        Renderers[active_layer.renderer_id] && // Renderer exists?
        Renderers[active_layer.renderer_id].clone_layer_name; // There is some renderer.
      return !!result;

    },
    layer_has_standalone_wizard: function (active_layer ) {
      if (active_layer) {
        return !!(Renderers[active_layer.renderer_id].has_standalone_wizard);
      } else {
        return false;
      }
    },

    layer_has_click_info: function (active_layer) {
      return
        // Active layer?
        active_layer &&

        // Renderer exists?
        Renderers[active_layer.renderer_id] &&

        // There is some renderer.
        (
          Renderers[active_layer.renderer_id].find_geo_json ||
          Renderers[active_layer.renderer_id].get_feature_info_xml_url ||
          Renderers[active_layer.renderer_id].get_feature_info_url
        );
    },

    get_layer_defaults: function (default_layers, layer_default_id) {
      return _.find(default_layers, "id", layer_default_id) || {};
    },
    is_active_layer: function (active_layers, layer_default_id) {
      return Controllers.Layers.is_active_layer(active_layers, layer_default_id);
    },
    layers: {
      // These are all the layers in the entire system (all we know about)
      defaults: [],
      // These are available layer ids, the ones in the tree view.
      available_ids: [],

      // These are the active layers. A copy of the all_layer fields
      // So they can have modifications and such
      // The order of this array should be the order of rendering
      active: [],

      tree: []
    },

    map: LeafletMap,
    has_geolocation: !!navigator.geolocation,
    layer_controls: {
      current_layer_info: null,
      active_tab: "layers",
      search_string: "",
      search_results: [],
      tray: {
        open: true
      }
    },
    layers_loading_states: {

    },
    map_state: {
      zoom: null,
      center: null,
      zoom_max: 16
    },
    parameters: {},
    base_layers: [],
    active_base_layer: null,
    map_controls: {
      active_base_layer: null,
      base_layer_control_open: false
    },
    map_details: {
      feature_info_requests: null,
      location: null /*{
                          lat: 0,
                          lng: 0
                        }*/

    },
    sharing_modal: {
      open: false
    },
    wizard: {
      open: false,
      current_step: 0,
      steps: ["welcome",
              "sidebar_intro",
              "base_layers",
              "adding_things",
              "find_more_info",
              "order_layers",
              "using_legends_tab",
              "printing",
              "advanced_layer_controls"
      ]
    }
  },
  decorators: {
      tooltip:  RactiveTooltip
  },
});
// Connect callbacks to the Map to update our data
LeafletMap.on("zoomend", function (evt) {
  Views.ControlPanel.set("map_state.zoom", LeafletMap.getZoom());
});

LeafletMap.on("moveend", function (evt) {
  Views.ControlPanel.set("map_state.center", LeafletMap.getCenter());
});

LeafletMap.on("click", function (evt) {
  Controllers.FeatureInfo.get_details(Views.ControlPanel, evt);
});

Views.ControlPanel.on({
  // Activate this tab AND make it toggle the tray if already open
  "show-layers-control": function (evt) {
    var cp = Views.ControlPanel;

    if (cp.get("layer_controls.active_tab") === "layers") {
      cp.set("layer_controls.tray.open", !cp.get("layer_controls.tray.open"));
    } else {
      cp.set("layer_controls.tray.open", true);
      cp.set("layer_controls.active_tab", "layers");
    }
  },

  // Activate this tab AND make it toggle the tray if already open
  "show-details-control": function (evt) {
    var cp = Views.ControlPanel;

    if (cp.get("layer_controls.active_tab") === "details") {
      cp.set("layer_controls.tray.open", !cp.get("layer_controls.tray.open"));
    } else {
      cp.set("layer_controls.tray.open", true);
      cp.set("layer_controls.active_tab", "details");
    }
  },
  "show-search-control": function (evt) {
    var cp = Views.ControlPanel;

    if (cp.get("layer_controls.active_tab") === "search") {
      cp.set("layer_controls.tray.open", !cp.get("layer_controls.tray.open"));
    } else {
      cp.set("layer_controls.tray.open", true);
      cp.set("layer_controls.active_tab", "search");
    }
  },

  "map-zoom-in" : function (evt) {
    var map = Views.ControlPanel.get('map');
    map.zoomIn();
  },
  "map-zoom-out" : function (evt) {
    var map = Views.ControlPanel.get('map');
    map.zoomOut();
  },
  "map-set-view": function (center, zoom ) {
    var map = Views.ControlPanel.get('map');
    map.setView(center, zoom);
  },
  "map-zoom-home" : function (evt) {
    var map = Views.ControlPanel.get('map');
    var bbox = Views.ControlPanel.get("parameters.bounding-box");
    if (bbox) {
      map.fitBounds(new L.LatLngBounds(new L.LatLng(bbox[1], bbox[0]), new L.LatLng(bbox[3], bbox[2])));
    } else {
      map.setView([42.4, -76], 6);
    }
  },
  "map-zoom-me" : function (evt) {
    var map = Views.ControlPanel.get('map');

    navigator.geolocation.getCurrentPosition(
      function (position) {
        map.setView({lat: position.coords.latitude, lng: position.coords.longitude}, 14);
      }, function () {
        console.log("Failed to geo-locate");
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 12*60*1000 }
    );
  },
  "update-layers-parameters": function (active_layer) {
    var cp = Views.ControlPanel;
    Controllers.Layers.update_layers_parameters(cp, active_layer);
  },
  "tile-layer-loaded": function (active_layer, force_reload ) {
    var cp = Views.ControlPanel;
    Controllers.Layers.mark_layer_as_loaded(cp, active_layer, true, force_reload);
  },
  "tile-layer-loading-error": function (active_layer) {
    var cp = Views.ControlPanel;
    Controllers.Layers.mark_layer_as_loaded(cp, active_layer, false);
  },
  "activate-base-layer" : function (evt) {
    var cp = Views.ControlPanel;
    cp.set("map_controls.active_base_layer", evt.context.name);
  },
  "toggle-base-layer-control" : function (evt) {
    var cp = Views.ControlPanel;
    cp.set("map_controls.base_layer_control_open",
           !cp.get("map_controls.base_layer_control_open"));
  },

  // You click a layer on / off active
  "toggle-layer-active": function (evt) {
    var cp = Views.ControlPanel;
    Controllers.Layers.toggle_layer_active(cp, evt.context);
  },
  "move-active-to-top": function (evt) {
    var cp = Views.ControlPanel;
    Controllers.Layers.move_active_to_top(cp, evt);
  },
  "make-active-hidden": function (evt) {
    var cp = Views.ControlPanel;
    Controllers.Layers.make_active_hidden(cp, evt);
  },
  "make-active-visible": function (evt) {
    var cp = Views.ControlPanel;
    Controllers.Layers.make_active_visible(cp, evt);
  },
  "expand-all-layers": function (evt) {
    var cp = Views.ControlPanel;
    Controllers.Layers.expand_all_layers(cp, evt);
  },
  "visible-all-layers": function (evt) {
    var cp = Views.ControlPanel;
    Controllers.Layers.visible_all_layers(cp, evt);
  },
  "hide-all-layers": function (evt) {
    var cp = Views.ControlPanel;
    Controllers.Layers.hide_all_layers(cp, evt);
  },
  "collapse-all-layers": function (evt) {
    var cp = Views.ControlPanel;
    Controllers.Layers.collapse_all_layers(cp, evt);
  },
  "toggle-active-collapsed": function (evt) {
    var cp = Views.ControlPanel;
    Controllers.Layers.toggle_active_collapsed(cp, evt);
  },
  "remove-active": function (evt) {
    var cp = Views.ControlPanel;
    Controllers.Layers.remove_active(cp, evt);

  },
  "toggle-layer-group-collapse": function (evt) {
    var cp = Views.ControlPanel;
    evt.context.is_expanded = !evt.context.is_expanded;
    cp.update(evt.keypath);
  },
  "show-layer-info" : function (evt) {
    var cp = Views.ControlPanel;
    evt.original.stopPropagation();
    evt.original.preventDefault();
    cp.set("layer_controls.current_layer_info", evt.context);
  },
  "show-active-layer-info": function (evt) {
    var cp = Views.ControlPanel;
    cp.set("layer_controls.current_layer_info", evt.context.layer_default_id);
    evt.original.stopPropagation();
    evt.original.preventDefault();
  },

  "hide-feature-info-modal" : function (evt) {
    var cp = Views.ControlPanel;
    cp.set("map_details.location", null);
  },
  "hide-layer-info-modal" : function (evt) {
    var cp = Views.ControlPanel;
    cp.set("layer_controls.current_layer_info", null);
  },
  "deactivate-all-layers": function (evt) {
    Controllers.Layers.deactivate_all(Views.ControlPanel);
  },
  "zoom-to-search-result": function (evt) {
    var map = Views.ControlPanel.get('map');
    var bbox = evt.context.properties.bbox.split(",")
    if (bbox) {
      map.fitBounds(new L.LatLngBounds(new L.LatLng(bbox[1], bbox[0]),
                                       new L.LatLng(bbox[3], bbox[2])));
    }
  },
  "print-map": function (evt) {
    var cp = Views.ControlPanel;
    var current = cp.get("layer_controls.tray.open");
    cp.set("layer_controls.tray.open", false);
    window.print();
    cp.set("layer_controls.tray.open", current);
  },
  "clear-layers-search-query": function (evt) {
    var cp = Views.ControlPanel;
    cp.set("layers.search_string", "");
    $("#layers_search_input").focus();
  },
  "clear-search-query": function (evt) {
    var cp = Views.ControlPanel;
    cp.set("layer_controls.search_string", "");
    $("#search_input").focus();
  },
  "clone-active-layer": function (evt) {
    var cp = Views.ControlPanel;
    Controllers.Layers.add_cloned_layer(cp, evt.context, "testly");
  },
  "open-sharing-modal": function (evt) {
    var cp = Views.ControlPanel;
    Controllers.Sharing.open_sharing(cp, evt);
  },
  "request-share-link-token": function (evt) {
    Views.ControlPanel.set("sharing_modal.token", "loading");

    Controllers.Sharing.save_state(
      Controllers.Sharing.get_save_data(Views.ControlPanel),
      function (token){
        Views.ControlPanel.set("sharing_modal.token", token);
        Controllers.Sharing.add_token_copy(Views.ControlPanel);
    });
  },
  "hide-sharing-modal": function (evt) {
    var cp = Views.ControlPanel;
    Controllers.Sharing.hide_sharing(cp, evt);
  },
  "show-wizard": function (evt) {
    var cp = Views.ControlPanel;
    if (cp.get('wizard.current_step')) {
      cp.set("wizard.current_step", 0);
    }
    cp.set("wizard.open", true);
  },
  "next-wizard": function (evt) {
    var cp = Views.ControlPanel;
    cp.set("wizard.current_step", (1 + cp.get("wizard.current_step")) % cp.get("wizard.steps").length);
  },
  // This could be combined with the steps, and maybe some names are added, but... It's not
  // going to be that data driven... unfortunately.
  // If this was clojure, I could just write the HTML as hiccup, inside JS. But since it's not
  // I need to write the HTML in the template and link the two somehow. Bleck
  "wizard-sidebar-intro": function (evt) { Views.ControlPanel.set("wizard.current_step", _.findIndex(Views.ControlPanel.get('wizard.steps'), function (v) { return v === "sidebar_intro";})); },
  "wizard-base-layers": function (evt) { Views.ControlPanel.set("wizard.current_step", _.findIndex(Views.ControlPanel.get('wizard.steps'), function (v) { return v === "base_layers";})); },
  "wizard-adding-things": function (evt) { Views.ControlPanel.set("wizard.current_step", _.findIndex(Views.ControlPanel.get('wizard.steps'), function (v) { return v === "adding_things";})); },
  "wizard-find-more-info": function (evt) { Views.ControlPanel.set("wizard.current_step", _.findIndex(Views.ControlPanel.get('wizard.steps'), function (v) { return v === "find_more_info";})); },
  "wizard-order-layers": function (evt) { Views.ControlPanel.set("wizard.current_step", _.findIndex(Views.ControlPanel.get('wizard.steps'), function (v) { return v === "order_layers";})); },
  "wizard-using-legends-tab": function (evt) { Views.ControlPanel.set("wizard.current_step", _.findIndex(Views.ControlPanel.get('wizard.steps'), function (v) { return v === "using_legends_tab";})); },
  "wizard-printing": function (evt) { Views.ControlPanel.set("wizard.current_step", _.findIndex(Views.ControlPanel.get('wizard.steps'), function (v) { return v === "printing";})); },
  "wizard-advanced-layer-controls": function (evt) { Views.ControlPanel.set("wizard.current_step", _.findIndex(Views.ControlPanel.get('wizard.steps'), function (v) { return v === "advanced_layer_controls";})); },
  "prev-wizard": function (evt) {
    var cp = Views.ControlPanel;
    var cur = cp.get("wizard.current_step");
    var total = cp.get("wizard.steps").length;
    var next = cur - 1;
    // THe JS mod does not work well.  -1 % 4 is not 3 (as in ruby) but -1... what in the world. :(
    if (next < 0) {
      next = next + total;
    }
    cp.set("wizard.current_step", next);
  },
  "show-standalone-wizard": function (evt) {
    Views.ControlPanel.set("wizard.standalone", evt.context.renderer_id);
  },
  "close-standalone-wizard": function (evt) {
    Views.ControlPanel.set('wizard.standalone', null);
  },
  "close-wizard": function (evt) {
    var cp = Views.ControlPanel;
    cp.set("wizard.open", false);
  }
});

Views.ControlPanel.observe("layer_controls.search_string", function (str) {
  var cp = Views.ControlPanel;
  // Make the call to search the endpoint
  if (str.length > 1) {
    Controllers.Search.execute_search(str,
      function (search_str, results) {
        if (cp.get("layer_controls.search_string") === search_str) {
         cp.set("layer_controls.search_results", results);
        }
      });
  } else {
    cp.set("layer_controls.search_results", []);
  }
});

Views.ControlPanel.observe("parameters.bounding-box", function (bbox) {
  var map = Views.ControlPanel.get('map');
  if (bbox) {
    var lat = new L.LatLng(bbox[1], bbox[0]);
    var lng = new L.LatLng(bbox[3], bbox[2]);
    map.fitBounds(new L.LatLngBounds(lat, lng));
  }
});

Views.ControlPanel.observe("parameters.available-layers", function (avail_layer_ids) {
  if (avail_layer_ids) {
    var cp = Views.ControlPanel;
    Controllers.Layers.set_available_layer_ids(cp, avail_layer_ids);

  }
});

Views.ControlPanel.observe("parameters.active-layers", function (desired_active_layer_ids) {
  var cp = Views.ControlPanel;
  if (desired_active_layer_ids) {
    Controllers.Layers.force_layers_active(cp, desired_active_layer_ids);
  }
});

Views.ControlPanel.observe("map_controls.active_base_layer", function (base_layer_name) {
  var map = Views.ControlPanel.get('map');
  var base_layers = Views.ControlPanel.get("base_layers");

  var base_layer_to_be_activated = _.find(base_layers,
    function (base_layer) { return base_layer.name === base_layer_name; });
  var base_layers_to_be_removed = _.reject(base_layers, base_layer_to_be_activated);
  if (base_layer_to_be_activated) {

    _.each(base_layers_to_be_removed, function (remove_layer) {
      if (map.hasLayer(remove_layer.data)) {
        map.removeLayer(remove_layer.data);
      }
    });

    // Add this new one?
    if (base_layer_to_be_activated.name === "None") {
      // Removed!
    } else {
      map.addLayer(base_layer_to_be_activated.data);
      base_layer_to_be_activated.data.setZIndex(z_indexes.base);
    }
  }
});

Views.ControlPanel.observe("layers.available_ids", function (available_ids) {
  if (available_ids) {
    var cp = Views.ControlPanel;
    Controllers.Layers.ensure_active_are_available(cp);
    Controllers.Layers.update_layer_tree(cp);
  }
});

Views.ControlPanel.observe("layers.search_string", function (search_string) {
  var cp = Views.ControlPanel;
  Controllers.Layers.update_layer_tree(cp);
});

Views.ControlPanel.observe("layers.active", function (new_active_layers, old_active_layers) {
  var map = Views.ControlPanel.get('map');

  var cp = Views.ControlPanel;
  _.each(old_active_layers, function (old_active_layer) {
    if (!_.find(new_active_layers, "id", old_active_layer.id)) {
      Renderers.remove(map, old_active_layer);
    }
  });

  _.map(new_active_layers, function (new_active_layer) {
    var active_layer_indx = _.findIndex(_.cloneDeep(new_active_layers).reverse(),
                                        "id",
                                        new_active_layer.id);
    var z_index = z_indexes.layers + active_layer_indx;
    Renderers.render(map, new_active_layer, z_index);
  });
  // Sometimes things add new layers or whatnot.
  // So update, check for dirty.
  cp.update("layers.active");
});

Views.ControlPanel.observe("map_details.location", function (click_location) {
  var map = Views.ControlPanel.get('map');
  var cp = Views.ControlPanel;
  var marker = cp.get("map_details.location_marker");

  if (click_location) {
    if (marker && marker.getLatLng() !== click_location) {
      map.removeLayer(marker);
      marker = null;
      cp.set("map_details.location_marker", marker);
    }

    if (!marker) {
      marker = new L.marker(click_location);
      cp.set("map_details.location_marker", marker);
      marker.addTo(map);
    }
    // Else - is a marker and it's in the right spot! yay.

  } else { // No click location
    if (marker) {
      map.removeLayer(marker);
      marker = null;
      cp.set("map_details.location_marker", marker);
    }

    // else: No marker? No worries
  }
});

Views.ControlPanel.observe("base_layers", function (base_layers) {
  // If this is set and there are no base layers - then default to the first
  if (!Views.ControlPanel.get("map_controls.active_base_layer") && base_layers.length > 0) {
    Views.ControlPanel.set("map_controls.active_base_layer", base_layers[0].name);
  }
});

Views.ControlPanel.observe("layer_controls.tray.open", function (open) {
  $("#map").toggleClass("tray-open", open);
  LeafletMap.invalidateSize();
});
