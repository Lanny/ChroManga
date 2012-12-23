function addItemToDatabase(storeName, item, index, callback) {
  var transaction = mangaDB.transaction([storeName], "readwrite")
  var store = transaction.objectStore(storeName)
  var request = null

  if (index === false) request = store.add(item)
  else request = store.add(item)

  if (!callback) var callback = function() {}

  request.onerror = function(e) {
    console.log('Write to mangaDB has failed')
    console.log(e.value)
    callback(e)
  }

  request.onsuccess = callback
}

function getLastIndex(storeName, callback) {
  var objectStore = mangaDB.transaction([storeName]).objectStore(storeName)
  var lastIndex = 0
  objectStore.openCursor().onsuccess = function(e) {
    if (event.target.result) {
      lastIndex = event.target.result.value.id
      event.target.result.continue()
    }
    else {
      callback(lastIndex)
    }
  }
}

function clearStore(storeName) {
  var setVersionRequest = mangaDB.setVersion("1.0")

  setVersionRequest.onsuccess = function(e) {
    if (mangaDB.objectStoreNames.contains(storeName)) {
      mangaDB.deleteObjectStore(storeName);
    }
  }
}
 
function clearAllStores() {
  // Convinience function for... well, clearing stores
  clearStore('page')
  clearStore('manga')
}

(function init() {
  var request = webkitIndexedDB.open("CroManga")
  request.onsuccess = function(e) {
    window.mangaDB = e.target.result

    var setVersionRequest = mangaDB.setVersion("1.0")

    setVersionRequest.onsuccess = function(e) {
      mangaDB.createObjectStore("page",
        {keyPath: "id"})

      mangaDB.createObjectStore("manga",
        {keyPath: "id",
         autoIncrement: true})
    }

    setVersionRequest.onfailure = function() { alert('Store creation failed') }
  }

  request.onfailure = function() { alert('Database creation failed') }
})()