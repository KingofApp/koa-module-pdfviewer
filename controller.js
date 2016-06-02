angular
  .controller('pdfviewerCtrl', loadFunction);

loadFunction.$inject = ['$scope', '$filter', 'structureService', '$location'];

function loadFunction($scope, $filter, structureService, $location) {
  //Register upper level modules
  structureService.registerModule($location, $scope, "pdfviewer");

  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (function() {
      return window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function(callback, element) {
          window.setTimeout(callback, 1000 / 60);
        };
    })();
  }

  document.addEventListener('tizenhwkey', function(e) {
    if (e.keyName === 'back') {
      try {
        tizen.application.getCurrentApplication().exit();
      } catch (error) {}
    }
  });

  var canvas = document.getElementById('canvas');
  var context = canvas.getContext('2d');
  var pageElement = document.getElementById('page');

  var reachedEdge = false;
  var touchStart = null;
  var touchDown = false;

  var lastTouchTime = 0;
  pageElement.addEventListener('touchstart', startTouch);
  pageElement.addEventListener('mousedown', startTouch);

  function startTouch(e) {
    touchDown = true;

    if (e.timeStamp - lastTouchTime < 500) {
      lastTouchTime = 0;
      toggleZoom();
    } else {
      lastTouchTime = e.timeStamp;
    }
  }

  pageElement.addEventListener('touchmove', moveTouch);
  pageElement.addEventListener('mousemove', moveTouch);

  function moveTouch(e) {
    if (pageElement.scrollLeft === 0 ||
      pageElement.scrollLeft === pageElement.scrollWidth - page.clientWidth) {
      reachedEdge = true;
    } else {
      reachedEdge = false;
      touchStart = null;
    }

    if (reachedEdge && touchDown) {
      if (touchStart === null) {
        touchStart = (e.changedTouches) ? e.changedTouches[0].clientX : e.clientX;
      } else {
        var xx = (e.changedTouches) ? e.changedTouches[0].clientX : e.clientX;
        var distance = xx - touchStart;
        if (distance < -100) {
          touchStart = null;
          reachedEdge = false;
          touchDown = false;
          openNextPage();
        } else if (distance > 100) {
          touchStart = null;
          reachedEdge = false;
          touchDown = false;
          openPrevPage();
        }
      }
    }
  }
  pageElement.addEventListener('touchend', endTouch);
  pageElement.addEventListener('mouseup', endTouch);

  function endTouch(e) {
    touchStart = null;
    touchDown = false;
  }

  var pdfFile;
  var currPageNumber = 1;

  var openNextPage = function() {
    var pageNumber = Math.min(pdfFile.numPages, currPageNumber + 1);
    if (pageNumber !== currPageNumber) {
      currPageNumber = pageNumber;
      openPage(pdfFile, currPageNumber);
    }
  };

  var openPrevPage = function() {
    var pageNumber = Math.max(1, currPageNumber - 1);
    if (pageNumber !== currPageNumber) {
      currPageNumber = pageNumber;
      openPage(pdfFile, currPageNumber);
    }
  };

  var zoomed = true;
  var toggleZoom = function() {
    zoomed = !zoomed;
    openPage(pdfFile, currPageNumber);
  };

  var fitScale = 1;
  var openPage = function(pdfFile, pageNumber) {
    var scale = zoomed ? fitScale : 1;

    pdfFile.getPage(pageNumber).then(function(page) {
      viewport = page.getViewport(1);

      if (zoomed) {
        var scale = pageElement.clientWidth / viewport.width;
        viewport = page.getViewport(scale);
      }

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      var renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      page.render(renderContext);
    });
  };

  PDFJS.workerSrc = $filter('loadUrl')('modules/pdfviewer/pdfjs/pdf.worker.js');
  setTimeout(function() {
    PDFJS.disableStream = true;
    PDFJS.disableWorker = true;
    PDFJS.getDocument($scope.pdfviewer.modulescope.value).then(function(pdf) {
      pdfFile = pdf;
      openPage(pdf, currPageNumber, 1);
    }).catch(function(error) {
      console.log("Error occurred", error);
    });
  }, 400);

}
