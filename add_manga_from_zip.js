$(function() {
  $('#upload_button').click(function() {
    var input = document.getElementById('input')
    var series = $('#series_name').val()
    var issue = $('#issue_number').val()

    if (!input.files.length) {
      alert('No file selected')
      return
    }

    // http://gildas-lormeau.github.com/zip.js for when shit goes bad
    extract(input.files[0], function(files, filenames) {
      blobArrayToPageArray(files, series, issue, function(pages) {
        chrome.extension.sendRequest({
          'action': 'add_manga',
          'mangaName': series,
          'mangaIssue': issue,
          'mangaLength': pages.length,
          'pages': pages
        }, 
        function(response) {
          alert(response)
        })
      })
    })
  })

  $('#mupload_button').click(function() {
    var input = document.getElementById('minput')
    var series = $('#mseries_name').val()
    var issue = parseInt($('#missue_number').val())

    if (!input.files.length) {
      alert('No file selected')
      return
    }

    extract(input.files[0], function(tfiles, tfilenames) {
      (function next(i) {
        extract(tfiles[i], function(files, filenames) {
          blobArrayToPageArray(files, series, parseInt(issue)+i, function(pages) {
            console.log(pages[0])
            chrome.extension.sendRequest({
              'action': 'add_manga',
              'mangaName': series,
              'mangaIssue': pages[0].issue,
              'mangaLength': pages.length,
              'pages': pages
            }, 
            function(response) {
              console.log('Done with ' + i)
              if (++i < tfiles.length) next(i)
              else alert('All done, yay!')
            })
          })
        })
      })(0)
    })
  })
})

function extract(file, callback) {
  zip.createReader(new zip.BlobReader(file), function(reader) {
    reader.getEntries(function(entries) {
      entries.sort(function(a, b) {
        if (a.filename < b.filename) return -1
        if (a.filename > b.filename) return 1
        return 0
      })

      var filenames = []
      for (var i = 0; i < entries.length; i++) filenames.push(entries[i].filename)
      var files = {length:0};
      (function next(i) {
        entries[i].getData(new zip.BlobWriter(), function(blob) {
          files[i] = blob
          files.length++
          if (files.length == entries.length) {
            callback(files, filenames)
          }
        })
        if (i < entries.length-1) next(i+1, entries)
      })(0)
    })
  })
}

function blobArrayToPageArray(blobArray, series, issue, callback) {
  var pages = {length:0};
  (function next(i) {
    var f = new FileReader();
    f.readAsDataURL(blobArray[i])

    // I love async, but when I get stuff like this, I just don't know what else to do
    f.pageNumber = i

    f.onloadend = function() {
      pages[f.pageNumber] = {
        'series': series,
        'issue': issue,
        'pageNumber': f.pageNumber,
        'data': f.result
      }
      pages.length += 1

      if (pages.length == blobArray.length) {
        callback(pages)
      }
    }

    if (++i < blobArray.length) next(i)
  })(0)
}