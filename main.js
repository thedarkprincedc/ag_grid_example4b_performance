(function(){
     $.urlParam = function(name){
	var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
	return results[1] || 0;
}
     agGrid.initialiseAgGridWithAngular1(angular);
     var module = angular.module("example", ["agGrid"]);

     module.controller("exampleCtrl", function($scope, $timeout, $http, $location) {
          var columnDefs = []
          $scope.onClickSearchBox = function(){
               //ACSSF5Y2014.B00001
               var regex = /[A-Z0-9]+\.[A-Z0-9]+/ig;
               if(regex.test(this.searchBox)){
                    getCustomColumnData(null, null, this.searchBox).then(function(msg){
                         var r = xmlToJSON(msg.data.tableViewportContent);
                         $scope.gridOptions.api.setColumnDefs(r.headers);
                         $scope.gridOptions.api.setRowData(r.body);
                    })
               }
          }

          $scope.gridOptions = {
               enableColResize: true,
               debug: true,
               rowSelection: 'multiple',
               rowDeselection: true,
               columnDefs: columnDefs,
               rowModelType: 'infinite',
               //paginationPageSize: 5,
               //paginationOverflowSize: 2,
               maxConcurrentDatasourceRequests: 2,
               infiniteInitialRowCount: 1,
               maxPagesInCache: 2,
               allowContextMenuWithControlKey: true,
               rowModelType : 'normal'
          };
          function getCustomColumnData(sRow, numOfItems, tableId, transpose){

               var bodyData = {
                    "tableGlobalId": "dwc.ACSSF5Y2014.B00001",
                    "geoIds":["0100000US"],
                    "naicsIds":["11","21","22","23","42","51","52","53","54","55","56","61","62","71","72","81","99","00","31-33","48-49","44-45"],
                    "startRow":1,
                    "rowCount":300,
                    "startColumn":1,
                    "columnCount":10,
                    "marginOfError":false,
                    "transposed":false,
                    "includeFilterableDims":true,
                    "enableSortControls":true,
                    "mapSumLevels":["040","050"]
               };
               bodyData.tableGlobalId = (tableId) ? "dwc." + tableId : bodyData.tableGlobalId;
               bodyData.startRow = (sRow || 1);
               bodyData.rowCount = (numOfItems || 300);
               bodyData.transposed = (transpose || false)

               return $http({
                    method: "POST",
                    url : 'https://data.census.gov/viz/service/table/render',
                    headers: {
                       'Content-Type': 'application/json;charset=UTF-8'
                     },
                     data: bodyData
               })
          }
          function setRowData(allOfTheData) {
               var dataSource = {
                    rowCount: null, // behave as infinite scroll
                    getRows: function (params) {
                         console.log('asking for ' + params.startRow + ' to ' + params.endRow);
                         // At this point in your code, you would call the server, using $http if in AngularJS 1.x.
                         // To make the demo look real, wait for 500ms before returning
                         setTimeout( function() {
                              // take a slice of the total rows
                              var rowsThisPage = allOfTheData.slice(params.startRow, params.endRow);
                              // if on or after the last page, work out the last row.
                              var lastRow = -1;
                              if (allOfTheData.length <= params.endRow) {
                                   lastRow = allOfTheData.length;
                              }
                              // call the success callback
                              params.successCallback(rowsThisPage, lastRow);
                         }, 500);
                    }
               };
               $scope.gridOptions.api.setDatasource(dataSource);
          }

          function xmlToJSON(xml){
               xml = xml.replace(/([A-Z]+\=(\'|\")[A-Z\d\s]+(\'|\"))/ig, function(r){
                   return r + " ";
              });
               //console.log(xml);
               var x2js = new X2JS();
               var document = x2js.xml2js(xml);

               //console.log(JSON.stringify(document, null, 2));
/*
{
     headerName: "",
     field: "pc1"
},
{
     headerName: "United States",
     children: [
          {headerName: "Estimate", field: "c2"}
     ]
}
*/
               var bodyDocument = {
                    "headers" : [

                    ],
                    "body" : []
               }
               var headers = ["pc1", "c2"]
               document.div.div.table.tr.forEach(function(val){
                    // is body code
                    if(val.hasOwnProperty("_class") && val.hasOwnProperty("_data-row-id")){
                         var re = {};
                         var count  = 0;
                         for(var index in val){
                              if(index !== "td" || index !== "th"){
                                   re[(count>0)?("c"+(count+1)):"pc1"] = val[index].__text;
                                   count++;
                              }

                         }
                         bodyDocument.body.push(re);
                    }
                    else if(val.hasOwnProperty("_class")){
                              var re = []
                              if(Array.isArray(val.th)){
                                   for(var element in val.th){
                                        re.push({
                                             "headerName" : val.th[element].__text,
                                             "field" : val.th[element]._id
                                        });
                                   }
                                   bodyDocument.headers = re;
                              }
                              else{


                                   var e = {
                                        "headerName" : val.th.__text,
                                        "field" : val.th._id
                                   };
                                   for(var rs in bodyDocument.headers){

                                        if(/^c[0-9]/i.test( bodyDocument.headers[rs].field) ){
                                             bodyDocument.headers[rs].children = [];
                                             bodyDocument.headers[rs].children.push(e);
                                        }
                                   }
                              }
                         }
               });
               console.log(JSON.stringify(bodyDocument, null, 2));

               return bodyDocument;
          }
     });
}());
