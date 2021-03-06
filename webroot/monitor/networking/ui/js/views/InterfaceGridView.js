/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

define([
    'underscore',
    'contrail-view'
], function (_, ContrailView) {
    var InterfaceGridView = ContrailView.extend({
        el: $(contentContainer),

        render: function () {
            var self = this,
                viewConfig = this.attributes.viewConfig,
                modelMap = this.modelMap,
                projectFQN = viewConfig['projectFQN'],
                networkFQN = viewConfig['networkFQN'],
                instanceUUID = viewConfig['instanceUUID'],
                elementId = viewConfig['elementId'],
                interfacesAjaxConfig, viewModel, ucid;

            if (contrail.checkIfExist(projectFQN)) {
                ucid = ctwc.get(ctwc.UCID_PROJECT_INTERFACE_LIST, networkFQN);
                interfacesAjaxConfig = getInterfacesAjaxConfig(null, projectFQN);
                self.renderView4Config(self.$el, this.model, getInterfaceGridViewConfig(interfacesAjaxConfig, ucid, elementId));
            } else if (modelMap != null && modelMap[viewConfig['modelKey']] != null) {
                ucid = ctwc.get(ctwc.UCID_INSTANCE_INTERFACE_LIST, networkFQN, instanceUUID);
                //TODO: Create a model from data coming from ModelMap
                viewModel = modelMap[viewConfig['modelKey']];
                if (!(viewModel.isRequestInProgress())) {
                    interfacesAjaxConfig = getInterfacesAjaxConfig(viewModel.attributes);
                    self.renderView4Config(self.$el, this.model, getInterfaceGridViewConfig(interfacesAjaxConfig, ucid, elementId));
                }

                viewModel.onAllRequestsComplete.subscribe(function () {
                    interfacesAjaxConfig = getInterfacesAjaxConfig(viewModel.attributes);
                    self.renderView4Config(self.$el, this.model, getInterfaceGridViewConfig(interfacesAjaxConfig, ucid, elementId));
                });
            }
        }
    });

    function getInterfacesAjaxConfig(responseJSON, projectFQN) {
        var ajaxConfig,
            interfaceList = contrail.checkIfExist(responseJSON) ? responseJSON['value']['UveVirtualMachineAgent']['interface_list'] : [];

        ajaxConfig = {
            url: ctwc.URL_VM_INTERFACES,
            type: 'POST',
            data: JSON.stringify({
                kfilt: interfaceList.join(','),
                projectFQN: projectFQN
            })
        };

        return ajaxConfig;
    };

    function getInterfaceGridViewConfig(interfacesAjaxConfig, ucid, elementId) {
        return {
            elementId: cowu.formatElementId([ctwl.MONITOR_INTERFACE_LIST_VIEW_ID]),
            view: "SectionView",
            viewConfig: {
                rows: [
                    {
                        columns: [
                            {
                                elementId: elementId,
                                title: ctwl.TITLE_INTERFACES,
                                view: "GridView",
                                viewConfig: {
                                    elementConfig: getInstanceInterfacesConfig(interfacesAjaxConfig, ucid)
                                }
                            }
                        ]
                    }
                ]
            }
        }
    };

    function getInstanceInterfacesConfig(interfacesAjaxConfig, ucid) {
        var gridElementConfig = {
            header: {
                title: {
                    text: ctwl.TITLE_INTERFACES_SUMMARY
                },
                defaultControls: {
                    collapseable: false,
                    exportable: true,
                    refreshable: true,
                    searchable: true
                }
            },
            body: {
                options: {
                    autoRefresh: false,
                    checkboxSelectable: false,
                    detail: {
                        template: cowu.generateDetailTemplateHTML(getInterfaceDetailsTemplateConfig(), cowc.APP_CONTRAIL_CONTROLLER)
                    }
                },
                dataSource: {
                    remote: {
                        ajaxConfig: interfacesAjaxConfig,
                        dataParser: ctwp.interfaceDataParser
                    },
                    vlRemoteConfig: {
                        vlRemoteList: ctwgc.getInterfaceStatsLazyRemoteConfig()
                    },
                    cacheConfig : {
                        ucid: ucid
                    }
                }
            },
            columnHeader: {
                columns: ctwgc.instanceInterfaceColumns
            },
            footer: {
                pager: { options: { pageSize: 8, pageSizeSelect: [8, 25, 50, 100] } }
            }
        };
        return gridElementConfig;
    };

    function getInterfaceDetailsTemplateConfig() {
        return {
            templateGenerator: 'RowSectionTemplateGenerator',
            templateGeneratorConfig: {
                rows: [
                    {
                        templateGenerator: 'ColumnSectionTemplateGenerator',
                        templateGeneratorConfig: {
                            columns: [
                                {
                                    class: 'span6',
                                    rows: [
                                        {
                                            title: ctwl.TITLE_INTERFACE_DETAILS,
                                            templateGenerator: 'BlockListTemplateGenerator',
                                            templateGeneratorConfig: [
                                                {
                                                    key: 'name',
                                                    templateGenerator: 'TextGenerator'
                                                },
                                                {
                                                    key: 'ip',
                                                    templateGenerator: 'TextGenerator'
                                                },
                                                {
                                                    key: 'mac_address',
                                                    templateGenerator: 'TextGenerator'
                                                },
                                                {
                                                    key: 'gateway',
                                                    templateGenerator: 'TextGenerator'
                                                },
                                                {
                                                    key: 'virtual_network',
                                                    templateGenerator: 'TextGenerator'
                                                },
                                                {
                                                    key: 'vm_name',
                                                    templateGenerator: 'TextGenerator'
                                                },
                                                {
                                                    key: 'active',
                                                    templateGenerator: 'TextGenerator'
                                                }
                                            ]
                                        }
                                    ]
                                },
                                {
                                    class: 'span6',
                                    rows: [
                                        {
                                            title: ctwl.TITLE_TRAFFIC_DETAILS,
                                            templateGenerator: 'BlockListTemplateGenerator',
                                            templateGeneratorConfig: [
                                                {
                                                    key: 'throughput',
                                                    templateGenerator: 'TextGenerator',
                                                    templateGeneratorConfig: {
                                                        formatter: 'throughput'
                                                    }
                                                }
                                            ]
                                        },
                                        {
                                            title: ctwl.TITLE_FLOATING_IPS,
                                            templateGenerator: 'BlockListTemplateGenerator',
                                            templateGeneratorConfig: [
                                                {
                                                    key: 'floatingIP',
                                                    templateGenerator: 'TextGenerator'
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                ]
            }
        };
    };

    return InterfaceGridView;
});
