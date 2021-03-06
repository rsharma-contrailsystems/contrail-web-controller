/*
 * Copyright (c) 2014 Juniper Networks, Inc. All rights reserved.
 */

var cdbPageLoader = new ConfigDatabaseLoader();

function ConfigDatabaseLoader () {
    this.load = function (paramObject) {
        var self = this, currMenuObj = globalObj.currMenuObj,
            hashParams = paramObject['hashParams'],
            pathCDBView = ctWebDir + '/setting/configdb/ui/js/views/ConfigDatabaseView.js',
            renderFn = paramObject['function'],
            loadingStartedDefObj = paramObject['loadingStartedDefObj'];

        require([pathCDBView], function (ConfigDatabaseView) {
            self.cdbView = new ConfigDatabaseView();
            self.renderView(renderFn, hashParams);
            if (contrail.checkIfExist(loadingStartedDefObj)) {
                loadingStartedDefObj.resolve();
            }
        });
    };
    this.renderView = function (renderFn, hashParams, view) {
        $(contentContainer).empty();
        switch (renderFn) {
            case 'renderFQTable':
                this.cdbView.renderFQTableNamesList({hashParams: hashParams});
                break;
            case 'renderUUIDTable':
                this.cdbView.renderUUIDTableNamesList({hashParams: hashParams});
                break;
        }
    };
    this.updateViewByHash = function (currPageQueryStr, lastPageQueryStr, currMenuObj) {
        var hash = currMenuObj['hash'],
            renderFn;

        if (hash == "setting_configdb_fqname") {
            renderFn = "renderFQTable";
        } else if (hash == "setting_configdb_uuid"){
            renderFn = "renderUUIDTable";
        }
        this.load({hashParams: currPageQueryStr, 'function': renderFn});
    };
    this.destroy = function () {

    };
};