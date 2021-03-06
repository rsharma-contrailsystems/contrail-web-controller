/*
 * Copyright (c) 2015 Juniper Networks, Inc. All rights reserved.
 */

define([
    'underscore',
    'backbone',
    'contrail-list-model',
    'knockback',
    'contrail-view',
    'config/networking/policy/ui/js/views/policyFormatters'
], function (_, Backbone, ContrailListModel, Knockback, ContrailView,
             PolicyFormatters) {
    var policyFormatters = new PolicyFormatters();
    var prefixId = ctwl.POLICY_PREFIX_ID,
        modalId = 'configure-' + prefixId,
        editTemplate = contrail.getTemplate4Id(cowc.TMPL_GENERIC_EDIT_FORM),
        externalGatewayDS = [],
        popupData = [];

    var PolicyCreateEditView = ContrailView.extend({
        modalElementId: '#' + modalId,
        renderPolicyPopup: function (options) {
            var editLayout = editTemplate(
                                {modalId: modalId, prefixId: prefixId}),
                self = this;

            cowu.createModal({'modalId': modalId,
                              'className': 'modal-980',
                              'title': options['title'],
                              'body': editLayout,
                              'onSave': function () {
                self.model.configurePolicy(options['mode'],
                                                  popupData,
                {
                    init: function () {
                        self.model.showErrorAttr(prefixId + cowc.FORM_SUFFIX_ID,
                                                 false);
                        cowu.enableModalLoading(modalId);
                    },
                    success: function () {
                        options['callback']();
                        $("#" + modalId).modal('hide');
                    },
                    error: function (error) {
                        cowu.disableModalLoading(modalId, function () {
                            self.model.showErrorAttr(
                                       prefixId + cowc.FORM_SUFFIX_ID,
                                       error.responseText);
                        });
                    }
                });
            }, 'onCancel': function () {
                Knockback.release(self.model, document.getElementById(modalId));
                kbValidation.unbind(self);
                $("#" + modalId).modal('hide');
            }});

           this.fetchAllData(this ,
                function(allData) {
                   var disableElement = false
                   if(options['mode'] == "edit") {
                       disableElement = true;
                   }
                   //self.model.model().attribues.popupData = allData;
                   self.renderView4Config(
                        $("#" + modalId).find("#" + modalId + "-form"),
                        self.model, getConfigureViewConfig
                        (disableElement, allData),
                        null, null, null, function(){
                            self.model.showErrorAttr(prefixId +
                                            cowc.FORM_SUFFIX_ID, false);
                            Knockback.applyBindings(self.model,
                                            document.getElementById(modalId));
                            kbValidation.bind(self);
                            //kbValidation.bind(self,{collection:
                            //      self.model.model().attributes.policyRules});
                   });
                   return;
               }
           );
        },
        renderDeletePolicy: function (options) {
            var selectedGridData = options['selectedGridData'],
                elId = 'deletePoliciesID';
            var items = "";
            var rowIdxLen = selectedGridData.length;
            for (var i = 0; i < rowIdxLen; i++) {
                items +=
                    selectedGridData[i]["name"]
                if (i < rowIdxLen - 1) {
                    items += ',';
                }
            }
            var delTemplate =
                contrail.getTemplate4Id(ctwl.TMPL_CORE_GENERIC_DEL),
                self = this;
            var delLayout = delTemplate({prefixId: prefixId,
                                        item: ctwl.TXT_POLICY,
                                        itemId: items})
            cowu.createModal({'modalId': modalId, 'className': 'modal-980',
                             'title': options['title'], 'btnName': 'Confirm',
                             'body': delLayout, 'onSave': function () {
                self.model.deletePolicy(selectedGridData, {
                    init: function () {
                        self.model.showErrorAttr(elId, false);
                        cowu.enableModalLoading(modalId);
                    },
                    success: function () {
                        options['callback']();
                        $("#" + modalId).modal('hide');
                    },
                    error: function (error) {
                        cowu.disableModalLoading(modalId, function () {
                            self.model.showErrorAttr(elId, error.responseText);
                        });
                    }
                });
            }, 'onCancel': function () {
                Knockback.release(self.model, document.getElementById(modalId));
                kbValidation.unbind(self);
                $("#" + modalId).modal('hide');
            }});
            this.model.showErrorAttr(elId, false);
            Knockback.applyBindings(this.model,
                                    document.getElementById(modalId));
            kbValidation.bind(this);
        },
        fetchAllData : function(self, callback) {
            var getAjaxs = [];
            var selectedDomainUUID = ctwu.getGlobalVariable('domain').uuid;;
            var selectedDomain = ctwu.getGlobalVariable('domain').name;;
            var selectedProject = ctwu.getGlobalVariable('project').name;;

            getAjaxs[0] = $.ajax({
                url:"/api/tenants/config/virtual-networks",
                type:"GET"
            });

            getAjaxs[1] = $.ajax({
                url:"/api/tenants/config/service-instance-templates/"
                + selectedDomainUUID,
                type:"GET"
            });

            /*getAjaxs[2] = $.ajax({
                url:"/api/tenants/config/service-instances-details/",
                type:"GET"
            });*/

            //get policies
            getAjaxs[3] = $.ajax({
                url:"/api/tenants/config/policys",
                type:"GET"
            });

            $.when.apply($, getAjaxs).then(
                function () {
                    //all success
                    var returnArr = []
                    var results = arguments;
                    var vns = results[0][0]["virtual-networks"];
                    returnArr["virtual-networks"] = [];
                    var allVns = [{text:'Enter or Select a Network',
                                   value:"dummy~virtual_network",
                                   id:"dummy~virtual_network",
                                   //value:"dummy",
                                   //id:"dummy",
                                   disabled : true },
                                 {text:"ANY (All Networks in Current Project)",
                                   value:"any~virtual_network",
                                   id:"any~virtual_network",
                                   //"value":"any",
                                   //"id":"any",
                                   "parent": "virtual_network"},
                                 {text:"LOCAL (All Networks to which this policy is associated)",
                                 value:"local~virtual_network",
                                 id:"local~virtual_network",
                                 //"value":"local",
                                 //"id":"local",
                                 "parent": "virtual_network"}];

                    if (null !== vns && typeof vns === "object" &&
                                     vns.length > 0) {
                        for (var i = 0; i < vns.length; i++) {
                            var vn = vns[i];
                            var virtualNetwork = vn["fq_name"];
                            var domain = virtualNetwork[0];
                            var project = virtualNetwork[1];
                            if(domain === selectedDomain &&
                               project === selectedProject) {
                                if(vn["fq_name"][2].toLowerCase() === "any" ||
                                   vn["fq_name"][2].toLowerCase() === "local"){
                                    var fqNameTxt = vn["fq_name"][2] +' (' +
                                                    domain + ':' +
                                                    project +')';
                                    var fqNameValue = vn["fq_name"].join(":");
                                    allVns.push({text : fqNameTxt,
                                         value : fqNameValue+"~virtual_network",
                                         id : fqNameValue+"~virtual_network",
                                         //value : fqNameValue,
                                         //id : fqNameValue,
                                         parent : "virtual_network" });
                                } else {
                                    allVns.push({text : vn["fq_name"][2],
                                                 value:(vn["fq_name"]).join(":")
                                                       +"~virtual_network",
                                                 id : (vn["fq_name"]).join(":")
                                                       +"~virtual_network",
                                                 //value:(vn["fq_name"]).join(":"),
                                                 //id : (vn["fq_name"]).join(":"),
                                                       parent : "virtual_network" });
                                }
                            } else {
                                var fqNameTxt = vn["fq_name"][2] +' (' +
                                                domain + ':' +
                                                project +')';
                                var fqNameValue = vn["fq_name"].join(":");
                                allVns.push({text : fqNameTxt,
                                     value : fqNameValue+"~virtual_network",
                                     id : fqNameValue+"~virtual_network",
                                     //value : fqNameValue,
                                     //id : fqNameValue,
                                     parent : "virtual_network" });
                            }
                        }
                    }

                    var sts = jsonPath(results[1][0],
                              "$.service_templates[*].service-template");
                    //process policies data
                    var policies = results[3][0]["network-policys"];
                    if(null !== policies && policies.length > 0) {
                       returnArr["policys-input"] = policies;
                    }
                    //prepare policies sub array
                    var allPolicies = [{text:'Enter or Select a Policy',
                                        value:"dummy"+"~network_policy",
                                        //value:"dummy",
                                        disabled : true }];
                    for(var i = 0; i < policies.length; i++) {
                        var policy = policies[i];
                        var fqn =  policy["fq_name"];
                        var domain = fqn[0];
                        var project = fqn[1];
                        if(domain === selectedDomain &&
                           project === selectedProject) {
                            allPolicies.push(
                                {text : policy["fq_name"][2],
                                 value : (policy["fq_name"]).join(":")
                                         +"~network_policy",
                                 id : (policy["fq_name"]).join(":")
                                         +"~network_policy",
                                 //value : (policy["fq_name"]).join(":"),
                                 //id : (policy["fq_name"]).join(":"),
                                 parent : "network_policy"});
                        }
                    }
                    returnArr["service_instances"] = [];
                    var analyzerInsts = [];
                    var serviceInsts = [];
                    if (null !== sts && sts.length > 0) {
                        for (var i = 0; i < sts.length; i++) {
                            if (sts[i].service_template_properties.service_type
                                                          === "analyzer") {
                                if (typeof sts[i].service_instance_back_refs
                                                          !== "undefined" &&
                                    sts[i].service_instance_back_refs.length
                                                          > 0) {
                                    var si_backRef =
                                        sts[i].service_instance_back_refs;
                                    var si_backRef_len =
                                       sts[i].service_instance_back_refs.length;
                                    var st = "";
                                    st = "analyzer";
                                    for (var j = 0; j < si_backRef_len; j++) {
                                        if(si_backRef[j].to[0]
                                                          === selectedDomain &&
                                            si_backRef[j].to[1]
                                                          === selectedProject) {
                                                var si_val_obj =
                                                {"text":si_backRef[j].to[2],
                                                "id":
                                                   (si_backRef[j].to).join(":"),
                                                "value":
                                                   (si_backRef[j].to).join(":"),
                                                "st":st}
                                            analyzerInsts[analyzerInsts.length]
                                                 = si_val_obj;
                                            serviceInsts.push(si_val_obj);
                                                ;
                                        } else {
                                            var si_backRef_format =
                                                si_backRef[j].to[2] + "(" +
                                                si_backRef[j].to[0] + ":" +
                                                si_backRef[j].to[1] + ")";
                                            var si_backRefVal =
                                               (si_backRef[j].to).join(":");
                                            var si_val_obj = {
                                                "text":si_backRef_format,
                                                "value":si_backRefVal,
                                                "id":si_backRefVal,
                                                "st":st
                                            };
                                            analyzerInsts[analyzerInsts.length] =
                                                si_val_obj;
                                            serviceInsts.push(si_val_obj);
                                        }
                                    }
                                }
                            } else {
                                if (typeof sts[i].service_instance_back_refs
                                    !== "undefined" &&
                                    sts[i].service_instance_back_refs.length > 0) {
                                        var si_backRef =
                                            sts[i].service_instance_back_refs;
                                        var si_backRef_len =
                                            sts[i].service_instance_back_refs.length;
                                    var st =
                                        sts[i].service_template_properties.service_type;
                                    for (var j = 0; j < si_backRef_len; j++) {
                                        if(si_backRef[j].to[0] === selectedDomain &&
                                            si_backRef[j].to[1] === selectedProject) {
                                            serviceInsts[serviceInsts.length] =
                                                {"text":si_backRef[j].to[2],
                                                "value":(si_backRef[j].to).join(":"),
                                                "id":(si_backRef[j].to).join(":"),
                                                "st":st};
                                        } else {
                                               var si_backRef_join =
                                                   si_backRef[j].to.join(":")
                                               var si_backref_val =
                                                   si_backRef[j].to[2] + "(" +
                                                   si_backRef[j].to[0] + ":" +
                                                   si_backRef[j].to[1] + ")";
                                               serviceInsts[serviceInsts.length] =
                                               {"text": si_backref_val,
                                               "value": si_backRef_join,
                                               "id":si_backRef_join,
                                               "st":st};
                                        }
                                    }
                                }
                            }
                        }
                    }
                    returnArr["service_instances"] = serviceInsts;
                    returnArr["analyzerInsts"] = analyzerInsts;
                    //add other project policies at the end
                    for(var i = 0; i < policies.length; i++) {
                        var policy = policies[i];
                        var fqn =  policy["fq_name"];
                        var project = fqn[1];
                        if(project !== selectedProject) {
                            var fqNameTxt = policy["fq_name"][2]+' (' +
                                            domain + ':' +
                                            project +')';
                            var fqNameValue = policy["fq_name"].join(":");
                            allPolicies.push({text : fqNameTxt,
                                              value : fqNameValue+"~network_policy",
                                              id : fqNameValue+"~network_policy",
                                              parent : 'network_policy'});
                        }
                    }
                    var addrFields = [];
                    addrFields.push({text : 'CIDR', value : 'subnet',
                                    children : [{
                                        text:'Enter a CIDR',
                                        value:"dummy",
                                        disabled : true }]},
                                   {text : 'Networks', value : 'virtual_network',
                                   children : allVns},
                                   {text : 'Policies', value : 'network_policy',
                                   children : allPolicies});
                    returnArr["addrFields"] = addrFields;
                    callback(returnArr);
                }
            )
        }
    });

    var getConfigureViewConfig = function(isDisable, allData) {
        return {
            elementId: cowu.formatElementId(
                            [prefixId, ctwl.TITLE_EDIT_POLICY]),
            view: "SectionView",
            viewConfig:{
            rows: [{
                    columns: [{
                        elementId: 'name',
                        name: 'Name',
                        view: "FormInputView",
                        viewConfig: {
                                    disabled: isDisable,
                                    placeHolder: ctwl.POLICY_NAME,
                                    path: 'name',
                                    label:'Policy Name',
                                    dataBindValue: 'name',
                                    class: "span6"}
                    }]
                },{
                    columns: [{
                        elementId: 'PolicyRules',
                        view: "FormCollectionView",
                        //view: "FormEditableGridView",
                        viewConfig: {
                            label:"Policy Rules",
                            path: "PolicyRules",
                            validation: 'ruleValidation',
                            templateId: cowc.TMPL_COLLECTION_HEADING_VIEW,
                            collection: "policyRules",
                            rows:[{
                               rowActions: [
                                   {onClick:
                                   "function() { $root.deleteRules($data, this); }",
                                    iconClass: 'icon-minus'}
                               ],
                            columns: [
                                {
                                 elementId: 'simple_action',
                                 name: 'Action',
                                 view: "FormDropdownView",
                                 class: "",
                                 width: 60,
                                 viewConfig: {
                                     templateId: cowc.TMPL_EDITABLE_GRID_DROPDOWN_VIEW,
                                     path: "simple_action",
                                     disabled: "showService()",
                                     dataBindValue: "simple_action()",
                                     elementConfig:{
                                         data:['PASS','DENY']
                                    }}
                                },
                                {
                                 elementId: 'protocol',
                                 name: 'Protocol',
                                 view: "FormDropdownView",
                                 class: "",
                                 width: 60,
                                 viewConfig: {
                                     templateId: cowc.TMPL_EDITABLE_GRID_DROPDOWN_VIEW,
                                     path: "protocol",
                                     dataBindValue: "protocol()",
                                     elementConfig:{
                                     data:['ANY', 'TCP', 'UDP', 'ICMP']
                                    }}
                                },
                                {
                                    elementId: 'src_address',
                                    view:
                                        "FormHierarchicalDropdownView",
                                    name: 'Source',
                                    class: "",
                                    width: 225,
                                    viewConfig: {
                                        templateId: cowc.TMPL_EDITABLE_GRID_DROPDOWN_VIEW,
                                        width: 225,
                                        path: 'src_address',
                                        dataBindValue: 'src_address()',
                                        elementConfig: {
                                            //defaultValueId : 1,
                                            minimumResultsForSearch : 1,
                                            dataTextField: "text",
                                            dataValueField: "value",
                                            data: allData.addrFields,
                                            queryMap: [
                                            {
                                                name : 'CIDR',
                                                value : 'subnet',
                                                iconClass:
                                                'icon-contrail-network-ipam'
                                            },
                                            {
                                                name : 'Networks',
                                                value : 'virtual_network',
                                                iconClass:
                                                'icon-contrail-virtual-network'
                                            },
                                            {
                                                name : 'Policies',
                                                value : 'network_policy',
                                                iconClass:
                                                'icon-contrail-network-policy'
                                            }
                                            ]
                                        }
                                    }
                                },
                                {
                                 elementId: 'src_ports_text',
                                 name: 'Ports',
                                 view: "FormInputView",
                                 class: "",
                                 width: 40,
                                 viewConfig: {
                                    templateId: cowc.TMPL_EDITABLE_GRID_INPUT_VIEW,
                                    path: 'src_ports_text',
                                    dataBindValue: 'src_ports_text()'
                                    }
                                },
                                {
                                 elementId: 'direction',
                                 name: 'Direction',
                                 view: "FormDropdownView",
                                 class: "",
                                 width: 60,
                                 viewConfig: {
                                     templateId: cowc.TMPL_EDITABLE_GRID_DROPDOWN_VIEW,
                                     path: "direction",
                                     dataBindValue: "direction()",
                                     disabled: "showService()",
                                     elementConfig:{
                                         data:['<>', '>']
                                     }}
                                },
                                {
                                    elementId: 'dst_address',
                                    view:
                                        "FormHierarchicalDropdownView",
                                    name: 'Destination',
                                    class: "span2",
                                    width: 225,
                                    viewConfig: {
                                        templateId: cowc.TMPL_EDITABLE_GRID_DROPDOWN_VIEW,
                                        width: 225,
                                        path: 'dst_address',
                                        dataBindValue: 'dst_address()',
                                        elementConfig: {
                                            //defaultValueId : 1,
                                            minimumResultsForSearch : 1,
                                            dataTextField: "text",
                                            dataValueField: "value",
                                            data: allData.addrFields,
                                            queryMap: [
                                            {
                                                name : 'CIDR',
                                                value : 'subnet',
                                                iconClass:
                                                'icon-contrail-network-ipam'
                                            },
                                            {
                                                name : 'Networks',
                                                value : 'virtual_network',
                                                iconClass:
                                                'icon-contrail-virtual-network'
                                            },
                                            {
                                                name : 'Policies',
                                                value : 'network_policy',
                                                iconClass:
                                                'icon-contrail-network-policy'
                                            }]
                                        }
                                    }
                                },
                                {
                                 elementId: 'dst_ports_text',
                                 name: 'Ports',
                                 view: "FormInputView",
                                 class: "",
                                 width: 40,
                                 viewConfig: {
                                    templateId: cowc.TMPL_EDITABLE_GRID_INPUT_VIEW,
                                    path: 'dst_ports_text',
                                    dataBindValue: 'dst_ports_text()'
                                    }
                                },
                                {
                                 elementId: 'log_checked',
                                 name: 'Log',
                                 view: "FormCheckboxView",
                                 class: "",
                                 width: 25,
                                 viewConfig: {
                                    templateId: cowc.TMPL_EDITABLE_GRID_CHECKBOX_VIEW,
                                    path: 'log_checked',
                                    dataBindValue: 'log_checked()'
                                    }
                                },
                                {
                                 elementId: 'apply_service_check',
                                 name: 'Services',
                                 view: "FormCheckboxView",
                                 class: "",
                                 width: 60,
                                 viewConfig: {
                                    templateId: cowc.TMPL_EDITABLE_GRID_CHECKBOX_VIEW,
                                    path: 'apply_service_check',
                                    dataBindValue: 'apply_service_check()'
                                    }
                                },
                                {
                                 elementId: 'mirror_to_check',
                                 name: 'Mirror',
                                 view: "FormCheckboxView",
                                 class: "",
                                 width: 60,
                                 viewConfig: {
                                     templateId: cowc.TMPL_EDITABLE_GRID_CHECKBOX_VIEW,
                                     path: 'mirror_to_check',
                                     dataBindValue: 'mirror_to_check()'
                                    }
                                }]
                            },{
                            columns: [
                                {
                                     elementId: 'service_instance',
                                     name: 'Services',
                                     view: "FormMultiselectView",
                                     width: 100,
                                     viewConfig: {
                                         colSpan: "11",
                                         class: "span10",
                                         placeHolder:"Select a service to apply...",
                                         //visible: "$root.showService",
                                         visible: "apply_service_check()",
                                         templateId: cowc.TMPL_EDITABLE_GRID_MULTISELECT_LEFT_LABEL_VIEW,
                                         path: "service_instance",
                                         dataBindValue: "service_instance()",
                                         elementConfig:{
                                             dataTextField: "text",
                                             dataValueField: "value",
                                             data:allData.service_instances
                                         }
                                     }
                                }
                            ]
                            },{
                            columns: [{
                                     elementId: 'mirror',
                                     name: 'Mirror',
                                     view: "FormDropdownView",
                                     width: 100,
                                     viewConfig: {
                                         placeHolder:"Select a service to mirror...",
                                         colSpan: "11",
                                         visible: "mirror_to_check()",
                                         templateId: cowc.TMPL_EDITABLE_GRID_DROPDOWN_LEFT_LABEL_VIEW,
                                         path: "mirror",
                                         dataBindValue: "mirror()",
                                         elementConfig:{
                                             dataTextField: "text",
                                             dataValueField: "value",
                                             data:allData.analyzerInsts
                                         }
                                    }
                            }],
                            /*rowActions: [
                                {onClick:
                                "function() { $root.deleteRules($data, this); }",
                                 iconClass: 'icon-minus'}
                            ]*/
                        }],
                            gridActions: [
                                {onClick: "function() { addRule(); }",
                                 buttonTitle: "Add Rule"}
                            ]
                    }
                    }]
                }]
            }
        }
    }

    return PolicyCreateEditView;
});
