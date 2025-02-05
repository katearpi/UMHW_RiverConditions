﻿function formatDate(value) {
    if (value) {
        var inputDate = new Date(value);
        return dojo.date.locale.format(inputDate, {
            selector: 'date',
            datePattern: 'MM/dd/yyyy HH:mm:ss'
        });


    } else {
        return "";
    }
}

//Explore drilldown examples https://js.devexpress.com/Demos/WidgetsGallery/Demo/Charts/ChartsDrillDown/Knockout/Light/

define([
        "esri/tasks/QueryTask",
        "esri/tasks/query",
  "dojo/_base/declare",
  "dojo/_base/lang",
  "esri/request",
  "dojo/promise/all",
  "dojo/promise/all",
  "esri/request", "dojo/_base/array", 
  "dojo/dom",
  "dojo/dom-class",
  "dijit/registry",
  "dojo/on",

], function (
           QueryTask, Query, declare, lang, esriRequest, all, All, request, dom, domClass, registry, on
) {

    return declare([], {
        m_streamSectionArrray: [],
        m_strSteamSectionQuery: "",
        m_FWPWarnFeatures: [],
        m_StepThruCounter: 0,

        Start: function (sectionGeometries, streamSectionArrray) {
            this.m_streamSectionArrray = streamSectionArrray;
            //this.m_pSectionsPolysFL_URLL = pSectionsPolysFL;
            
            var pQuery = new Query();
            var queryTask = new QueryTask(app.strFWPURL);
            pQuery.where = app.strFWPQuery;
            pQuery.returnGeometry = true;
            pQuery.outFields = ["*"];
            pQuery.outSpatialReference = {"wkid": 102100};
            pQuery.geometry = sectionGeometries;
            pQuery.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
            queryTask.execute(pQuery, this.GetFWPWarnResults1, this.GetFWPWarnResultsError1);       
        },

        ClearVars: function () {
            m_streamSectionArrray = [];
            m_strSteamSectionQuery = "";
            m_FWPWarnFeatures = [];
            m_StepThruCounter = 0;
        },
        
        GetFWPWarnResults1: function (results) {     
            this.m_FWPWarnFeatures = results.features;
            var resultCount = this.m_FWPWarnFeatures.length;
            if (resultCount > 0) {
                var pFeature = results.features[this.app.pGetWarn.m_StepThruCounter];
                this.app.pGetWarn.FindSectionsOverlappingFWPWarnFeatures2(pFeature.geometry);

                var x = document.getElementById("divFWPAlert");
                if (x.style.visibility === "hidden") {
                    x.style.visibility = 'visible';
                }
            } else {
                this.app.pGage.SectionsReceived(app.pGetWarn.m_streamSectionArrray, "", "", "", "", false);  //if an error go continue with getting seciton detail and display
                this.app.pGetWarn.ClearVars();
            }
        },

        GetFWPWarnResultsError1: function (results) {
            alert("Error with query on FWS warn layer1");
            this.app.pGage.SectionsReceived(streamSectionArrray, "", "", "", "", false);  //if an error go continue with getting seciton detail and display
            this.app.pGetWarn.ClearVars();
        },  
        
        FindSectionsOverlappingFWPWarnFeatures2: function (pFeature) {
            var pQuery = new Query();
            var queryTask = new QueryTask(app.strHFL_URL + "5");
            pQuery.returnGeometry = false;
            pQuery.outFields = ["StreamName","SectionID"];
            pQuery.outSpatialReference = {"wkid": 102100};
            pQuery.geometry = pFeature;
            pQuery.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
            queryTask.execute(pQuery, this.GetFWPWarnResults2, this.GetFWPWarnResultsError2);
        },

        GetFWPWarnResults2: function (results) {
            var resultCount = results.features.length;
            var pCurrentFWPFeature = this.m_FWPWarnFeatures[this.app.pGetWarn.m_StepThruCounter];

            if (resultCount > 0) {  //due to the previous query this should alsways be > 0
                for (var i = 0; i < resultCount; i++) {
                    //Add to the m_streamSectionArrray based on values from the via m_FWPWarnFeatures and m_StepThruCounter
                    var strDESCRIPTION = pCurrentFWPFeature.attributes["DESCRIPTION"];
                    var strLOCATION = pCurrentFWPFeature.attributes["LOCATION"];
                    var strPRESSRELEASE = pCurrentFWPFeature.attributes["PRESSRELEASE"];
                    var strPUBLISHDATE = pCurrentFWPFeature.attributes["PUBLISHDATE"];
                    strPUBLISHDATE = formatDate(strPUBLISHDATE);
                    var strTITLE = pCurrentFWPFeature.attributes["TITLE"];

                    var pSectionSelectedFeature = results.features[i];

                    var strSectionName = pSectionSelectedFeature.attributes.StreamName;
                    var strSectionID = pSectionSelectedFeature.attributes.SectionID;

                    for (var is = 0; is < app.pGetWarn.m_streamSectionArrray.length; is++) {
                        if ((app.pGetWarn.m_streamSectionArrray[is][0] == strSectionName) &&
                            (app.pGetWarn.m_streamSectionArrray[is][2] == strSectionID)) {
                            
                            app.pGetWarn.m_streamSectionArrray[is][17] = strDESCRIPTION;
                            app.pGetWarn.m_streamSectionArrray[is][18] = strLOCATION;
                            app.pGetWarn.m_streamSectionArrray[is][19] = strPRESSRELEASE;
                            app.pGetWarn.m_streamSectionArrray[is][20] = strPUBLISHDATE;
                            app.pGetWarn.m_streamSectionArrray[is][21] = strTITLE;
                            app.pGetWarn.m_streamSectionArrray[is][22] = "MT FWP Restriction (click for details)";
                        }
                    }
                }
            }
            this.app.pGetWarn.m_StepThruCounter += 1;

            if (this.app.pGetWarn.m_StepThruCounter == this.m_FWPWarnFeatures.length) {
                this.app.pGage.SectionsReceived(app.pGetWarn.m_streamSectionArrray, "", "", "", "", false);  //if an error go continue with getting seciton detail and display
                this.app.pGetWarn.ClearVars();
            } else {
                var pNextFWPFeature = this.m_FWPWarnFeatures[this.app.pGetWarn.m_StepThruCounter];
                this.app.pGetWarn.FindSectionsOverlappingFWPWarnFeatures2(pNextFWPFeature.geometry);
            }
        },

        GetFWPWarnResultsError2: function (results) {
            console.log("Failed to get results from Sections Layer when querying by FWP Warn polygon due to an error: ", err);
            alert("Error with query on FWS warn layer2");
            this.app.pGage.SectionsReceived(streamSectionArrray, "", "", "", "", false);  //if an error go continue with getting seciton detail and display
            this.app.pGetWarn.ClearVars();
        }
    });
}
);


