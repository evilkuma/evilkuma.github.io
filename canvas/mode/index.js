
document.getElementById('create').onclick = function (e) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/canvas');

    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.send(
        'create=' + encodeURIComponent(1)
    );

    xhr.onreadystatechange = function() {
        if (xhr.readyState != 4) return;

        if (xhr.status != 200) {
            alert(xhr.status + ': ' + xhr.statusText);
        } else {
            if(+xhr.responseText === 1) {
                location.href = '/canvas'
            } else {
                alert('Произошла ошибка.')
                location.href = '/auth'
            }
        }
    }
};

document.getElementById('connect').onclick = function (e) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/canvas');

    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.send(
        'id=' + encodeURIComponent(document.getElementById('roomid').value)
    );

    xhr.onreadystatechange = function() {
        if (xhr.readyState != 4) return;

        if (xhr.status != 200) {
            alert(xhr.status + ': ' + xhr.statusText);
        } else {
            if(+xhr.responseText === 1) {
                location.href = '/canvas'
            } else {
                alert('Такая комната не найдена.')
            }
        }
    }
};