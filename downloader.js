$(document).ready(function() {
  // Add the download button to the page
  var download = $('<span>')
    .attr('class', 'next')
    .css('cursor', 'pointer')
    .html('<a>Download</a>')
    .click(downloadManga)

  $('.next').after(download)
})

function downloadManga() {
  // Build up our progress UI
  var progressDiv = $('<div>')
    .attr('id', 'progress_div')
    .appendTo(document.body)

  var statusMessage = $('<p>')
    .attr('id', 'progress_message')
    .text('Generating page URLs')
    .appendTo(progressDiv)

  var progressBar = $('<div>')
    .attr('id', 'progress_bar')
    .appendTo(progressDiv)

  // How we generate urls is going to depend on the site hosting them
  var urls = []
  var series
  var issue

  if (window.location.href.match('http://www\.mangareader\.net/.+')) {
    var re = $('h1').text().match('^(.+?)(\\d+)$')
    series = re[1]
    issue = re[2]

    var mangaLength = $('#pageMenu').text().split('\n').slice(-2)[0]

    var re = $('#img').attr('src').match('(.+-)(\\d+)(\..+)')
    var prefix = re[1]
    var magicNum = re[2] - $('#pageMenu').find('option[selected="selected"]').text() + 1
    var suffix = re[3]

    for (var i = 0; i < mangaLength; i++) {
      urls.push(prefix + (magicNum + i) + suffix)
    }
  }

  statusMessage.text('Downloading pages...')

  // Because we're going to get our pages back in uncertian order, we have
  // to be able to sort them as we insert them. That's why we're using an
  // object and manually tracking length
  var pages = {length:0}

  for (var urlNum = 0; urlNum < urls.length; urlNum++) {
    (function() {
      var xhr = new XMLHttpRequest()
      xhr.open('GET', urls[urlNum], true)
      xhr.responseType = "blob"

      // Tack urlNum onto the xhr object so we have it later
      xhr.urlNum = urlNum

      xhr.addEventListener("load", function() {
        if (xhr.status === 200) {
          console.log('Received image ' + xhr.urlNum + ' of ' + mangaLength)

          // Be sure to serialize because Google doesn't want to support basic functionality
          // for their own fucking tech >:(
          var f = new FileReader()
          f.readAsDataURL(xhr.response)

          f.onloadend = function() {
            pages[xhr.urlNum] = {
              'series': series,
              'issue': issue,
              'pageNumber': xhr.urlNum,
              'data': f.result
            }
            pages.length += 1

            var prog = (pages.length / mangaLength) * 100
            $('#progress_bar').css('background-image', 
              '-webkit-linear-gradient(left, orange ' + prog + '%, grey ' + (prog+5) + '%)')

            if (pages.length == mangaLength) {
              chrome.extension.sendRequest({
                'action': 'add_manga',
                'mangaName': series,
                'mangaIssue': issue,
                'mangaLength': mangaLength,
                'pages': pages
              }, 
              function(response) {
                alert(response)
                progressDiv.remove()
              })
            }
          }
        }
        else if (xhr.status === 404) {
          // The page is missing, nothing we can really do about it.
          mangaLength -= 1
        }
      }, false)

      xhr.send()
    })()
  }
}
