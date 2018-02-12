angular
  .controller('pdfviewerCtrl', loadFunction);

loadFunction.$inject = ['$scope', '$filter', 'structureService', '$location'];

function loadFunction($scope, $filter, structureService, $location) {
  //Register upper level modules
  structureService.registerModule($location, $scope, "pdfviewer");


  $scope.init = function () {
    var url = $scope.pdfviewer.modulescope.value;
    $scope.iframeSrc = "https://docs.google.com/viewer?url=" + url + "&embedded=true";
  };
}
