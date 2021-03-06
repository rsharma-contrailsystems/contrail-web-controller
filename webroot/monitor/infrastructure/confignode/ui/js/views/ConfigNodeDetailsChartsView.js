/*
 * Copyright (c) 2015 Juniper Networks, Inc. All rights reserved.
 */

define([
    'underscore',
    'contrail-view',
    'backbone',
    'monitor/infrastructure/common/ui/js/views/NodeDetailsInfoboxesView',
    'monitor/infrastructure/confignode/ui/js/views/ConfigNodeDetailsAPIServerLineChartView',
    'monitor/infrastructure/confignode/ui/js/models/ConfigNodeDetailsAPIServerChartListModel',
    'monitor/infrastructure/confignode/ui/js/views/ConfigNodeDetailsServiceMonitorLineChartView',
    'monitor/infrastructure/confignode/ui/js/models/ConfigNodeDetailsServiceMonitorChartListModel',
    'monitor/infrastructure/confignode/ui/js/views/ConfigNodeDetailsSchemaLineChartView',
    'monitor/infrastructure/confignode/ui/js/models/ConfigNodeDetailsSchemaChartListModel'
], function(_,ContrailView,Backbone,NodeDetailsInfoboxesView,
        ConfigNodeDetailsAPIServerLineChartView,ConfigNodeDetailsAPIServerChartListModel,
        ConfigNodeDetailsServiceMonitorLineChartView,ConfigNodeDetailsServiceMonitorChartListModel,
        ConfigNodeDetailsSchemaLineChartView,ConfigNodeDetailsSchemaChartListModel) {

    //Ensure ConfigNodeDetailsChartsView is instantiated only once and re-used always
    //Such that tabs can be added dynamically like from other feature packages
    var ConfigNodeDetailsChartsView = ContrailView.extend({
        el: $(contentContainer),
        render: function () {
            var self = this;
            var viewConfig = this.attributes.viewConfig;
            var hostname = viewConfig['hostname'];
            var detailsChartsTmpl = contrail.getTemplate4Id(cowc.NODE_DETAILS_CHARTS);
            self.$el.append(detailsChartsTmpl);
            this.infoBoxView = new NodeDetailsInfoboxesView({el:$(contentContainer).
                find('#infoboxes-container'), widgetTitle:'CPU and Memory Utilization'});
            var infoBoxList = getInfoboxesConfig({node:hostname});
            for(var i=0;i<infoBoxList.length;i++) {
                this.infoBoxView.add(infoBoxList[i]);
            }
        }
    });

    function getInfoboxesConfig(config) {
        var configNodeDetailsAPIServerChartListModel =
            new ConfigNodeDetailsAPIServerChartListModel(config);
        var configNodeDetailsServiceMonitorChartListModel =
            new ConfigNodeDetailsServiceMonitorChartListModel(config);
        var configNodeDetailsSchemaChartListModel =
            new ConfigNodeDetailsSchemaChartListModel(config);
        return [{
            title: 'API Server',
            prefix:'configAPIServer',
            sparklineTitle1:'CPU Share (%)',
            sparklineTitle2:'Memory',
            sparkline1Dimension:'cpu_info.cpu_share',
            sparkline2Dimension:'cpu_info.mem_res',
            view: ConfigNodeDetailsAPIServerLineChartView,
            model: configNodeDetailsAPIServerChartListModel
        },
        {
            title: 'Service Monitor',
            prefix:'configServiceMonitor',
            sparklineTitle1:'CPU Share (%)',
            sparklineTitle2:'Memory',
            sparkline1Dimension:'cpu_info.cpu_share',
            sparkline2Dimension:'cpu_info.mem_res',
            view: ConfigNodeDetailsServiceMonitorLineChartView,
            model: configNodeDetailsServiceMonitorChartListModel
        },
        {
            title: 'Schema Transformer',
            prefix:'configSchema',
            sparklineTitle1:'CPU Share (%)',
            sparklineTitle2:'Memory',
            sparkline1Dimension:'cpu_info.cpu_share',
            sparkline2Dimension:'cpu_info.mem_res',
            view: ConfigNodeDetailsSchemaLineChartView,
            model: configNodeDetailsSchemaChartListModel
        }];
    };

    return ConfigNodeDetailsChartsView;
});
