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
    (function next(zi) {
      writeOut('Extracting ' + series + ' issue ' + (issue + zi))
      getLastIndex('page', function(lastPage) {
        zip.createReader(new zip.BlobReader(input.files[zi]), function(reader) {
          reader.getEntries(function(entries) {
            var ProgBar = $('<span>')
              .text('[          ]\n')
              .appendTo($('pre'))

            entries.sort(function(a, b) {
              if (a.filename < b.filename) return -1
              if (a.filename > b.filename) return 1
              return 0
            });

            (function nextPage(i) {
              entries[i].getData(new zip.BlobWriter(), function(blob) {
                var f = new FileReader();

                f.onloadend = function() {
                  var page = {
                    'series': series,
                    'issue': issue,
                    'pageNumber': i,
                    'data': f.result,
                    'id': lastPage + 1 + i
                  }
                  addItemToDatabase('page', page, lastPage + 1 + i, function() {
                    // Set these to null and pray to god gc will deallocate
                    f = null
                    blob = null
                    page = null
                    if (++i < entries.length) nextPage(i, entries)
                    else {
                      addItemToDatabase('manga', {
                        'name': series,
                        'issue': issue,
                        'startIndex': lastPage + 1,
                        'length': entries.length
                      }, false, function() {
                        writeOut(series + ' ' + (issue+i) + ' added to ChroManga successfully\n', 'green')
                        issue++

                        if (++zi < input.files.length) next(zi)
                        else {
                          $('#upload_button').add('#input').removeAttr('disabled')
                          writeOut('All zips added successfully!', 'green')
                        }
                      })
                    }
                  })
                }

                f.readAsDataURL(blob)

                var decas = Math.floor(i / entries.length * 10) + 1
                var barText = '['
                barText += Array(decas-1).join('=')
                barText += '>'
                barText += Array(11 - decas).join(' ')
                barText += ']\n'

                ProgBar.text(barText)
              })
            })(0)
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
