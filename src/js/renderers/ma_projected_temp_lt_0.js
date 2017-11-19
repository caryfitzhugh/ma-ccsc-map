RendererTemplates.ma_projected_climate_data('ma_projected_temp_lt_0', {
  title: "Days Below 0&deg;F ",
  legend: " Projected change in # days below 0&deg;F",
  legend_precision: 1,
  legend_reverse: true,
  legend_units: "# Days",
  data_url: "https://repository.nescaum-ccsc-dataservices.com/data/ma/templt0.json",
  color_range: colorbrewer.Blues[6]
});