﻿
// helper functions ---
function buildDataNodes() {

    var dataNodes = {};

    for (var i = 0; i < arguments.length; i++) {

        for (var j = 0; j < arguments[i].length; j++) {

            if (!(arguments[i][j]["Location ID"] in dataNodes)) {

                dataNodes[arguments[i][j]["Location ID"]] = {};
            }

            if (!(i in dataNodes[arguments[i][j]["Location ID"]])) {

                dataNodes[arguments[i][j]["Location ID"]][i] = [];
            }

            dataNodes[arguments[i][j]["Location ID"]][i].push(arguments[i][j]);
        }
    }
    
    dataNodes = Object.keys(dataNodes).map(function (nodeString, i) {

        return buildDataNode(nodeString, dataNodes[nodeString], i);
    });

    return dataNodes;
}

function buildDataNode(nodeString, data, index) {

    nodeString = nodeString.split('}');

    var point2d = (nodeString[0] + "}").replace('Point2D ', ''),
        name = data[0][0]["Name"],
        locationType = data[0][0]["Location type"];

    point2d = point2d.replace(/=/g, ':');
    point2d = point2d.replace(/ /g, '"');
    point2d = point2d.replace(/,/g, '",');
    point2d = JSON.parse(point2d);

    for (var key in point2d) {
        point2d[key] = parseFloat(point2d[key]);
    }

    dataNode = new DataNode(point2d, name, locationType);
    dataNode.setData(data);

    return dataNode;
}

// model ---
function DataNode(point2d, name, locationType) {

    this._pos = point2d;
    this._name = name;
    this._locationType = locationType;
    this._data = {};
    this._attributes = {};

    this.isActive = true;
    this.isSelected = true;

    this.wasActive = true;
}
DataNode.prototype = {

    getName: function () {

        return this._name;
    },

    getLocationType: function () {

        return this._locationType;
    },

    setData: function (data) {

        this._data = data;
    },

    getData: function () {
       
        return this._data;
    },

    findData: function () { // specific to csv

        var data = {};

        for (var scheme in this.getData()) {

            data[scheme] = this.getData()[scheme].find(function (data) {

                return data['Passenger type'] == 'All' &&
                    data['Value'] == 'MEAN';

            });
        };

        return data;
    },

    getAttribute: function (key) {

        if (key in this._attributes) {
            
            return this._attributes[key];
        }

        return null;
    },

    setAttribute: function (key, value) {

        this._attributes[key] = value;
    }
}

function Model() {

    var _dataNodes = [];
    var _dataNodeLocationTypes = {};
    var _dataNodeLocationTypeValues = {};
    var _dataNodeNames = {};
    var _dxf = null;

    this.setDataNodes = function (dataNodes) {

        _dataNodes = dataNodes;

        for (var i = 0; i < _dataNodes.length; i++) {

            var dataNode = _dataNodes[i];

            if (!(dataNode.getLocationType() in _dataNodeLocationTypes)) {
                _dataNodeLocationTypes[dataNode.getLocationType()] = [];
            }

            if (!(dataNode.getName() in _dataNodeNames)) {
                _dataNodeNames[dataNode.getName()] = [];
            }

            _dataNodeLocationTypes[dataNode.getLocationType()].push(dataNode);
            _dataNodeNames[dataNode.getName()].push(dataNode);
        }
    };

    this.getDataNodes = function () {

        return _dataNodes;
    };

    this.getDataNodeLocationTypes = function () {

        return _dataNodeLocationTypes;
    };

    this.getDataNodeNames = function () {

        return _dataNodeNames;
    };

    this.setDXFData = function (dxf) {

        _dxf = dxf;
    };

    this.getDXFData = function () {

        return _dxf;
    };

    this.getDataNodeNamesArr = function() {

        var dataTypes = this.getDataNodeNames(),
            __ = [];

        for (var type in dataTypes) {

            if (dataTypes[type].length > 1) {
                __.push(type);
            }
        }

        return __;
    }

    this.getDataFormatted = function () {

        var dataTypes = this.getDataNodeNames();
        var __ = {};

        for (var type in dataTypes) {

            if (dataTypes[type].length > 1) {

                var schemes = {};

                for (var i = 0; i < dataTypes[type].length; i++) {

                    var dataNode = dataTypes[type][i],
                        data = dataNode.findData();

                    if (!dataNode.isActive) continue;

                    for (var scheme in data) {

                        if (!(scheme in schemes)) {

                            schemes[scheme] = [];
                        }

                        schemes[scheme].push(data[scheme]);
                    }
                }

                for (var scheme in schemes) {

                    var attributes = {};

                    for (var i = 0; i < schemes[scheme].length; i++) {

                        var dimension = +schemes[scheme][i]["Dimension"];

                        for (var attribute in schemes[scheme][i]) {

                            if (cdr.core.time.isTime(attribute)) {

                                if (!(attribute in attributes)) {

                                    attributes[attribute] = [];
                                }

                                attributes[attribute].push(+schemes[scheme][i][attribute] / dimension);
                            }
                        }
                    }

                    schemes[scheme] = attributes;
                }

                if (Object.keys(schemes).length > 0) {

                    __[type] = schemes;
                }              
            }
        }

        return __;
    };
}