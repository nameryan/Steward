/*global _gaq*/
import $ from 'jquery'
import { NUMBER } from '../constant/index'
import * as api from '../api/index'
import * as date from '../utils/date'
import _ from 'underscore'
import storage from '../utils/storage'
import Toast from 'toastr'

const STORAGE_KEY = 'wallpapers';
const $body = $('body');

let curUrl = '';
let intervalTimer = 0;

function updateWallpaper(url, save) {
    if (!url) {
        return;
    }

    if (save) {
        window.localStorage.setItem('wallpaper', url);
    }

    curUrl = url;
    $body.css({
        'background-image': `url(${url})`,
        'background-size': 'cover'
    });
}

function saveWallpaperLink() {
    storage.sync.get(STORAGE_KEY, []).then(data => {
        let wallpapers = data;

        if (curUrl) {
            wallpapers.push(curUrl);
            wallpapers = _.uniq(wallpapers);
        }

        console.log(wallpapers);

        return {
            [STORAGE_KEY]: wallpapers
        };
    }).then(newResults => storage.sync.set(newResults)).then(() => {
        Toast.success('save successfully');
    });
}

function randomBool() {
    return Boolean(Math.round(Math.random()));
}

function wallpaperApiHandler(resp, isBing) {
    console.log(`update from ${isBing ? 'bing' : 'cache'}...`);
    if (!isBing) {
        return resp;
    } else {
        return api.bing.root + resp.images[0].url;
    }
}

function getRandomOne(list) {
    if (list && list.length) {
        const index = Math.round(Math.random() * (list.length - 1));

        return list[index];
    }
}

export function refreshWallpaper(today) {
    const method = today ? 'today' : 'rand';

    Promise.all([
        api.bing[method](),
        storage.sync.get(STORAGE_KEY, [])
    ]).then(([bing, cache]) => {
        const isBing = randomBool();

        if (isBing || cache.length === 0) {
            updateWallpaper(wallpaperApiHandler(bing, true));
        } else {
            updateWallpaper(wallpaperApiHandler(getRandomOne(cache)), true);
        }
    }).catch(resp => {
        console.log(resp);
    });
}

export function init() {
    // restore
    const lastDate = new Date(window.localStorage.getItem('lastDate') || Number(new Date()));
    const defaultWallpaper = window.localStorage.getItem('wallpaper');

    window.localStorage.setItem('lastDate', date.format());

    if (date.isNewDate(new Date(), lastDate)) {
        refreshWallpaper(true);
    } else if (!defaultWallpaper) {
        refreshWallpaper();
    } else {
        updateWallpaper(defaultWallpaper);
    }

    // bind events
    $('#j-refresh-wp').on('click', function() {
        refreshWallpaper();
        _gaq.push(['_trackEvent', 'wallpaper', 'click', 'refresh']);
    });

    $('#j-save-wplink').on('click', function() {
        saveWallpaperLink();
        _gaq.push(['_trackEvent', 'wallpaper', 'click', 'save']);
    });

    $(document).on('dblclick', function(event) {
        if (event.target.tagName === 'BODY') {
            clearInterval(intervalTimer);
            Toast.success('The automatic refresh of the wallpaper has been disabled');
        }
    });

    // set interval
    intervalTimer = setInterval(refreshWallpaper, NUMBER.WALLPAPER_INTERVAL);
}