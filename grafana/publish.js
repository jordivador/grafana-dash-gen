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
var request = require('request-promise');
var config = require('./config');
var errors = require('./errors');

/* eslint-disable max-statements, max-len, no-console, no-undef */
async function publish(dashboard, opts) {
    return new Promise(function (resolve, reject) {
        opts = opts || {};

        if (!dashboard) {
            reject(errors.UnfulfilledRequirement({
                component: 'grafana.publish',
                unfulfilledArg: 'dashboard'
            }));
        }

        var state = dashboard.state;
        var cfg = config.getConfig();

        if (!state || !state.title) {
            reject(errors.InvalidState({
                component: 'grafana.Dashboard',
                invalidArg: 'title',
                reason: 'undefined'
            }));
        }

        if (!cfg.url) {
            reject(errors.Misconfigured({
                invalidArg: 'url',
                reason: 'undefined',
                resolution: 'Must call grafana.configure before publishing'
            }));
        }

        if (!cfg.token) {
            reject(errors.Misconfigured({
                invalidArg: 'token',
                reason: 'Token is required for API utilization'
            }));
        }

        var createData = {
            dashboard: dashboard.generate(),
            folderId: dashboard.getFolderId(opts),
            overwrite: true
        };

        request({
            uri: cfg.url + '/api/dashboards/db/',
            method: 'POST',
            body: createData,
            headers: {
                "Authorization": "Bearer " + cfg.token
            },
            json: true,
            timeout: opts.timeout || 1000
        }).then(createResp => {
            if (createResp.status !== 'success') {
                reject(errors.PublishError({
                    dashboard: state.title,
                    error: createResp.body.message,
                    response: createResp.statusCode
                }));
            } else {
                resolve(state);
            }
        }).catch(createErr => {
            reject(errors.PublishError({
                dashboard: state.title,
                error: createErr.error.message,
                response: JSON.stringify(createErr)
            }));
        });
    });
}


/* eslint-enable */
module.exports = publish;
