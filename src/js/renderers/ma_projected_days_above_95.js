RendererTemplates.ma_projected_climate_data("ma_projected_days_above_95", {
  title: "MA Projected Days > 95&deg;F",
  legend: " Change in # days above 95&deg;F",
  legend_precision: 1,
  legend_units: " Days ",
  data_url: "https://repository.nescaum-ccsc-dataservices.com/data/ma/tempgt95.json",
  color_ranges: colorbrewer.OrRd[4]
});
