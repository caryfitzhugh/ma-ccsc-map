RendererTemplates.ma_projected_climate_data("ma_projected_days_below_temp", {
  title: "MA Projected Days Below Temp ",
  legend: "Days",
  legend_precision: 0,
  data_url: "https://repository.nescaum-ccsc-dataservices.com/data/ma/below_temp_thresholds.json",
  color_ranges: {
    'lt0': colorbrewer.Blues[9],
    'lt32': colorbrewer.Blues[9],
  },
  all_metrics: {
    "lt0" : "Days Below 0F",
    "lt32" : "Days Below 32F",
  }
});