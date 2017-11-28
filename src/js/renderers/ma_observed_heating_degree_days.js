RendererTemplates.ma_observed_climate_data("ma_observed_heating_degree_days", {
  title: "Heating Degree Days",
  legend: "Observed Heating Degree-Days",
  legend_precision: 0,
  legend_units: "Degree-Days",
  //data_url: "https://repository.nescaum-ccsc-dataservices.com/data/ma/heatdegdays.json",
  data_url: "https://adirondackatlas.org/api/v1/climateobs.php?parameter=heatdegdays",
  color_range: colorbrewer.OrRd[6]
});
