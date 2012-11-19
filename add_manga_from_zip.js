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
    zip.createReader(new zip.BlobReader(input.files[0]), function(reader) {
      reader.getEntries(function(entries) {
        // Order entries by filename
        entries.sort(function(a, b) {
          if (a.filename < b.filename) return -1
          if (a.filename > b.filename) return 1
          return 0
        })

        var pages = {length:0};
        (function next(i) {
          entries[i].getData(new zip.BlobWriter(), function(blob) {
            var f = new FileReader();
            f.readAsDataURL(blob)

            // I love async, but when I get stuff like this, I just don't know what else to do
            f.pageNumber = i

            f.onloadend = function() {
              console.log(f)
              pages[f.pageNumber] = {
                'series': series,
                'issue': issue,
                'pageNumber': f.pageNumber,
                'data': f.result
              }
              pages.length += 1

              if (pages.length == entries.length) {
                // Read them all, push it to the DB
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
              }
            }
          })
          if (i < entries.length) next(i+1)
        })(0)
      })
    })
  })
})