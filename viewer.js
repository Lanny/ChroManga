function parseURL() {
  var args = {}
  var splitArgString = document.location.href.split('#')[1].split('&')
  for (var i = 0; i < splitArgString.length; i++) {
    var foo = splitArgString[i].split('=')
    args[foo[0]] = parseInt(foo[1])
  }
  return args
}

$(function() {
  args = parseURL()
  container = $('#comic_container')
  turnPage(args.current)

  // Build our index
  var index = $('#index')
  for (var i = 0; i < args.length; i++) {
    var url = 'viewer.html#start=' + args.start + '&current=' + i + '&length=' + args.length
    $('<a>').attr('href', url)
      .text(i + ' ')
      .appendTo(index)
  }

  function turnPage(index, quickTurn) {
    container.empty()

    // Make sure we don't overrun our book
    if (index > args.length) return

    // If quickTurn is set we insert our preloaded image, otherwise load
    if (quickTurn) container.append(nextPage)
    else { 
      // Otherwise grab it from IndexedDB
      chrome.extension.sendRequest({action:"get_manga_page", index: args.start + args.current}, function(page) {
        var img = $('<img>')
          .attr('src', page.data)
          .appendTo(container)

        if (img.width() > $(window).width()) img.attr('width', $(window).width() - 15 + 'px')
      })
    }

    $('body').scrollTop(0)
    var url = 'viewer.html#start=' + args.start + '&current=' + args.current + '&length=' + args.length
    history.pushState(null, null, url)

    // Preload the next image, checking there is an image to preload
    if (!(index >= args.length - 1)) {
      chrome.extension.sendRequest({action:"get_manga_page", index: args.start + args.current + 1}, function(page) {
        nextPage = $('<img>')
          .attr('src', page.data)

        if (img.width() > $(window).width()) img.attr('width', $(window).width() - 15 + 'px')
      })
    }
  }

  // Handle all our hot keys
  $('body').keydown(function(e) {
    switch (e.keyCode) {
      case 32 :
        // Spacebar, scroll and/or flip page
        if ($(window).scrollTop() + $(window).height() == $(document).height()) {
          // Are we at the bottom of the page? If so turn to the next
          // Check if there actually is a next page...
          if (args.current >= args.length) return
          turnPage(++args.current, true)
        }

        else {
          // Otherwise just scroll 
          var dest = $('body').scrollTop() + $(window).height() - 100
          $('body').animate({'scrollTop': dest}, 600)
        }

        e.preventDefault()
        break

      // Left and right arrows, back and forward a page
      case 37 :
        turnPage(--args.current)
        break

      case 39 :
        turnPage(++args.current, true)
        break
    }
  })
})