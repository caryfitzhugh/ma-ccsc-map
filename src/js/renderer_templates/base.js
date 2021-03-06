RendererTemplates.base = function (layer_id, opts, impl) {
  var renderer = Object.assign({},
    {
      pickle: function (al) {
        al.leaflet_layer_ids = [];
        delete al.loading_layers
        delete al.templates;
      },
      clone_layer_name: opts.clone_layer_name,
      parameters: opts.parameters,
      get_feature_info_xml_url: opts.get_feature_info_xml_url,
      get_feature_info_url: opts.get_feature_info_url,
    },
    opts,
    impl);

  renderer.render = (map, active_layer, pane) => {
    Renderers.update_templates(active_layer, opts);
    impl.render(map, active_layer, pane);
  }
  return renderer;
}
