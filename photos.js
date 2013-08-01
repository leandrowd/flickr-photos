/*global jQuery*/

var setupPhotos = (function ($) {
    function each (items, callback) {
        var i;
        for (i = 0; i < items.length; i += 1) {
            setTimeout(callback.bind(this, items[i]), 0);
        }
    }

    function flatten (items) {
        return items.reduce(function (a, b) {
            return a.concat(b);
        });
    }

    function loadPhotosByTag (tag, max, callback) {
        var photos = [];
        var callback_name = 'callback_' + Math.floor(Math.random() * 100000);

        window[callback_name] = function (data) {
            delete window[callback_name];
            var i;
            for (i = 0; i < max; i += 1) {
                photos.push(data.items[i].media.m);
            }
            callback(null, photos);
        };

        $.ajax({
            url: 'http://api.flickr.com/services/feeds/photos_public.gne',
            data: {
                tags: tag,
                lang: 'en-us',
                format: 'json',
                jsoncallback: callback_name
            },
            dataType: 'jsonp'
        });
    }

    function loadAllPhotos (tags, max, callback) {
        var results = [];
        function handleResult (err, photos) {
            if (err) { return callback(err); }

            results.push(photos);
            if (results.length === tags.length) {
                callback(null, flatten(results));
            }
        }

        each(tags, function (tag) {
            loadPhotosByTag(tag, max, handleResult);
        });
    }

    function renderPhoto (photo) {
        var img = new Image();
        img.src = photo;
        return img;
    }

    /* Favourites */
    function favouriteToggleClassName(favouriteStar, reference){
        favouriteStar.className = 'favourite ';
        favouriteStar.className += (checkFavourite(reference) == -1) ?
          "icon-heart-empty" : "icon-heart";
    }

    function favouriteStar (photo){
        var favouriteStar = document.createElement('button');
        favouriteStar.dataset.reference = photo.src;
        favouriteStar.addEventListener('click', favouriteToggle, false);
        favouriteToggleClassName(favouriteStar, photo.src);
        return favouriteStar;
    }

    function favouriteToggle(e){
        var favouriteList = getFavourites(),
            reference = e.target.dataset.reference,
            fav = checkFavourite(reference);

        if(fav > -1){
          //remove from list
          favouriteList.splice(fav, 1);
        }else{
          //append in list
          favouriteList.push(reference);
        }
        //update list
        localStorage.setItem("Favourites", favouriteList);
        //update class
        favouriteToggleClassName(e.target, reference);
    }

    //returns index of favourite in list
    function checkFavourite(reference){
        var favouriteList = getFavourites(),
            index = favouriteList.indexOf(reference);

        return index;
    }

    //returns favourite list from localStorage
    function getFavourites(){
        var storage = localStorage.getItem("Favourites");
        return storage ? storage.split(",") : [];
    }

    /* end of Favourites */

    function imageAppender (id) {
        var holder = document.getElementById(id);
        return function (img) {
            var elm = document.createElement('div');

            elm.className = 'photo';
            elm.appendChild(img);
            elm.appendChild(favouriteStar(img));

            holder.appendChild(elm);
        };
    }

    // ----
    
    var max_per_tag = 5;
    return function setup (tags, callback) {
        loadAllPhotos(tags, max_per_tag, function (err, items) {
            if (err) { return callback(err); }

            each(items.map(renderPhoto), imageAppender('photos'));
            callback();
        });
    };
}(jQuery));
