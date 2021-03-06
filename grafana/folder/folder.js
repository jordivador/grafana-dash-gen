// Copyright (c) 2015 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

'use strict';

var errors = require('../errors');
var request = require('sync-request');
var config = require('../config');

function Folder(opts) {
    var self = this;
    opts = opts || {};

    if (!opts.name) {
        throw errors.UnfulfilledRequirement({
            component: 'grafana.folder.Folder',
            unfulfilledArg: 'name'
        });
    }

    self.state = {};

    // Overwrite defaults with custom values
    Object.keys(opts).forEach(function eachOpt(opt) {
        self.state[opt] = opts[opt];
    });
}

Folder.prototype.generate = function generate() {
    return this.state;
};

Folder.prototype.getFolderId = function getFolderId(opts) {
    var self = this;
    opts = opts || {};

    // We trust that token & url are present because this action is called on publish
    var cfg = config.getConfig();

    // Get all folders
    var res = request('GET', cfg.url + "/api/folders", {
            headers: {
                "Authorization": "Bearer " + cfg.token
            },
            timeout: opts.timeout || 1000
    });

    if (!res || res && res.statusCode !== 200) {
        throw errors.ApiError({
            apiCall: "GET "+ cfg.url + "/api/folders",
            reason: res.body.toString(),
            code: res.statusCode
        });
    } else {
        var found = JSON.parse(res.body.toString()).find(function(el) {
            return el.title === self.state.name;
        });

        if (!found) {
            throw errors.NoFolderException({
                folder: self.state.name
            });
        }

        self.state.folderId = found.id;
    }

    return self.state.folderId;
}

module.exports = Folder;
