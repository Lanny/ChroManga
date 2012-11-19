$(function() {
  chrome.extension.sendRequest({action:"get_manga_index"}, function(response) {
    if (!response) { alert('Retreiving manga list failed') }
    else {
      table = $('table')
      for (var i = 0; i < response.length; i++) {
        var manga_url = 'viewer.html#start=' + 
              response[i].startIndex + 
              '&current=0&length=' + 
              response[i].length

        console.log(response[i])
        $('<tr>').attr('class', i%2?'even':'odd')
          .html('<td><a href="' + manga_url + '">' + response[i].name +
            response[i].issue + '</a></td>' +
            '<td>' + response[i].length + '</td>')
          .append(
            $('<td>').append(
              $('<button>').click(function() {
                chrome.extension.sendRequest({action:'purge_manga', manga:$(this).data('mangaId')}, function() {
                  console.log('we\'re back')
                  window.location.reload()
                })
              })
              .text('delete')
              .data('mangaId', response[i].id)
            )
          )
          .appendTo(table)
      }
    }
  })
})