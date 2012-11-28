$(function() {
  lastCheckedBox = null
  chrome.extension.sendRequest({action:"get_manga_index"}, function(response) {
    if (!response) { alert('Retreiving manga list failed') }
    else {
      table = $('table')
      for (var i = 0; i < response.length; i++) {
        var manga_url = 'viewer.html#start=' + 
          response[i].startIndex + 
          '&current=0&length=' + 
          response[i].length

        $('<tr>').attr('class', i%2?'even':'odd')
          .append(
            $('<td>').append(
              $('<input>')
              .attr('type', 'checkbox')
              .attr('value', response[i].id)
              .attr('id', 'cb' + i)
              .click(function(e) {
                // this.checked will actually be true if the user is just clicking
                // the box. Kinda counter-intuitive
                if (!lastCheckedBox && this.checked) {
                  console.log('here')
                  lastCheckedBox = parseInt(this.id.substr(2))
                }
                else if (lastCheckedBox && this.checked && e.shiftKey) {
                  var thisIdNum = parseInt(this.id.substr(2)) 
                  var a = (thisIdNum > lastCheckedBox) ? lastCheckedBox : thisIdNum
                  var b = (thisIdNum < lastCheckedBox) ? lastCheckedBox : thisIdNum
                  for (var i = a; i < b; i++) {
                    $('#cb'+i).prop('checked', 'true')
                  }
                  lastCheckedBox = null
                }
              })
            )
          )
          .append(
            $('<td>').append(
              $('<a>')
                .attr('href', manga_url)
                .text(response[i].name + ' ' + response[i].issue)
              )
          )
          .append(
            $('<td>').text(response[i].length)
          )
          .appendTo(table)
      }
    }
  })
  $('#del_button').click(function() {
    var mangaIds = $(':checked').map(function() { return this.value }).get()
    if (mangaIds.length < 1) {alert('No items selected'); return}
    chrome.extension.sendRequest({action:"purge_manga",'manga_ids':mangaIds}, function(response) {
      document.location.href = document.location.href
    })
  })
})