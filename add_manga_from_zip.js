$(function() {
  $('#upload_button').click(function() {
    var input = document.getElementById('input')
    var series = $('#series_name').val()
    var issue = parseInt($('#issue_number').val())

    if (!input.files.length) {
      alert('No file selected')
      return
    }

    $('#upload_button').add('#input').attr('disabled', 'disabled')

    writeOut(input.files.length + ' files selected...');

    // http://gildas-lormeau.github.com/zip.js for when shit goes bad
    (function next(i) {
      writeOut('Extracting ' + series + ' issue ' + (issue + i))
      extract(input.files[i], function(files, filenames) {
        writeOut('Extraction complete, begin serializing', 'green')
        blobArrayToPageArray(files, series, issue, function(pages) {
          writeOut('Serialization complete, submitting to database', 'green')
          chrome.extension.sendRequest({
            'action': 'add_manga',
            'mangaName': series,
            'mangaIssue': issue + i,
            'mangaLength': pages.length,
            'pages': pages
          }, 
          function(response) {
            writeOut(series + ' ' + (issue+i) + ' added to ChroManga successfully\n', 'green')
            if (++i < input.files.length) next(i)
            else {
              writeOut('All zips added successfully!', 'green')
              $('#upload_button').add('#input').removeAttr('disabled')
            }
          })
        })
      })
    })(0)
  })
})

function writeOut(message, color) {
  if (!color) var color = 'black'
  $('pre').append(
    $('<span>').css('color', color)
      .text(message + '\n')
  )
  $('#output').scrollTop(999999)
}

function extract(file, callback) {
  zip.createReader(new zip.BlobReader(file), function(reader) {
    reader.getEntries(function(entries) {
      var ProgBar = $('<span>')
        .text('[          ]')
        .appendTo($('pre'))

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

          var decas = Math.floor(files.length / entries.length * 10) + 1
          var barText = '['
          barText += Array(decas).join('=')
          barText += '>'
          barText += Array(11 - decas).join(' ')
          barText += ']'

          ProgBar.text(barText)

          if (files.length == entries.length) {
            writeOut('\n')
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
        writeOut('\t' + pages.length + ' pages serialized', 'green')
        callback(pages)
      }
    }

    if (++i < blobArray.length) next(i)
  })(0)
}