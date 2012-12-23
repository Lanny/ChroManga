function downloadManga() {
  chrome.tabs.executeScript(null, {file:"downloader.js"})
}

function getElementFromStorage(storeName, index, callback) {
  var transaction = mangaDB.transaction([storeName])
  var objectStore = transaction.objectStore(storeName)
  var request = objectStore.get(index)

  request.onsuccess = function(event) {
    callback(request.result)
  }

  request.onerror = function(event) {
    alert('Retreiving page failed')
  }
}

function getEntireStore(storeName, callback) {
  var objectStore = mangaDB.transaction([storeName]).objectStore(storeName)
  var items = []
  objectStore.openCursor().onsuccess = function(e) {
    if (event.target.result) {
      items.push(event.target.result.value)
      event.target.result.continue()
    }
    else {
      callback(items)
    }
  }
}

function removeElementFromStorage(storeName, index, callback) {
  var request = mangaDB.transaction([storeName], "readwrite")
    .objectStore(storeName)
    .delete(index)

  request.onsuccess = callback
}

function purgeManga(index, callback) {
  getElementFromStorage('manga', index, function(manga) {
    for (var i = manga.startIndex; i < manga.startIndex + manga.length; i++) {
      removeElementFromStorage('page', i, function(){})
    }
    removeElementFromStorage('manga', manga.id, function(){
      callback()
    })
  })
}

chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
  if (request.action == "add_manga") {
    getLastIndex('page', function(lastIndex) {
      var manga = {
        'name': request.mangaName,
        'issue': request.mangaIssue,
        'startIndex': lastIndex+1,
        'length': request.mangaLength
      }

      addItemToDatabase('manga', manga, false)

      for (var i = 0; i < request.pages.length; i++) {
        var page = request.pages[i]

        if (!page) {
          // Might happen if we hit a 404 while downloading, just stuff a placeholder in
          page = {
            'issue': request.mangaIssue,
            'pageNumber': i,
            'series': request.mangaName,
            'data': null
          }
        }

        page.id = manga.startIndex + i
        addItemToDatabase('page', page, manga.startIndex + i)
      }

      sendResponse('Done!')
    })
  }
  else if (request.action == "get_manga_index") {
    getEntireStore('manga', function(result) {
      sendResponse(result)
    })
  }
  else if (request.action == "get_manga_page") {
    getElementFromStorage('page', request.index, function(result) {
      sendResponse(result)
    })
  }
  else if (request.action == "purge_manga") {
    var purged_count = 0
    var k = request.manga_ids
    for (var i = 0; i < k.length; i++) {
      purgeManga(parseInt(k[i]), function() {
        if (++purged_count == request.manga_ids.length) {
          sendResponse(null)
        }
      })
    }
  }
});

chrome.browserAction.onClicked.addListener(function() {
  chrome.tabs.create({
    index: 9999,
    url: 'comic_index.html'
  })
})
