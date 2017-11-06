import $ from 'jquery'
import keyboardJS from 'keyboardjs'
import './content.scss'
import { websitesMap } from '../../js/plugins/website'
const chrome = window.chrome;

const App = {
    isOpen: false,

    initDom() {
        const html = `
            <div id="steward-main" class="steward-main" style="display:none;">
            </div>
        `;

        $('body').append(html);
        this.$el = $('#steward-main');
    },
    openBox() {
        if (this.isOpen) {
            return;
        } else {
            this.isOpen = true;
        }

        const popupurl = chrome.extension.getURL('popup.html');
        const html = `
            <iframe id="steward-iframe" src="${popupurl}" name="steward-box" width="510" height="460" frameborder="0"></iframe>
        `;
        this.$el.html(html);
        this.$iframe = $('#steward-iframe');

        this.$el.show();
        this.$iframe.load(function() {
            const iframeWindow = document.getElementById('steward-iframe').contentWindow;

            iframeWindow.postMessage({
                ext_from: 'content',
                host: window.location.host
            }, '*');
        });
    },

    closeBox() {
        this.$el.empty().hide();
        this.isOpen = false;
    },

    bindEvents() {
        const that = this;
        const host = window.location.host;

        if (websitesMap[host]) {
            websitesMap[host].setup();
        }

        keyboardJS.bind('esc', function() {
            that.closeBox();
        });

        window.addEventListener('message', event => {
            if (event.data.action === 'closeBox') {
                this.closeBox();
            }
        });

        chrome.runtime.onMessage.addListener(req => {
            if (req.action === 'openBox') {
                if (this.isOpen) {
                    this.closeBox();
                } else {
                    this.openBox();
                }
            }
        });

        $(document).on('click', function(e) {
            if (that.isOpen && e.target.id !== 'steward-main') {
                that.closeBox();
            }
        });
    },

    init() {
        this.initDom();
        this.bindEvents();
    }
};

App.init();